package com.evya.ocpi;

import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.OcpiRole;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.OcpiPartyRepository;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.domain.repo.PartnerEndpointRepository;
import com.evya.ocpi.security.TokenHasher;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ADR-003: vendor self-service OCPI. A vendor admin manages only its own party; the platform admin acts
 * on any vendor; the OCPI module gates access. Tokens are real HS256 tokens through the security chain.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortalOcpiTest {

    private static final long VENDOR_A = 100L;
    private static final long VENDOR_B = 200L;
    private static final List<String> WITH_OCPI = List.of("ocpi", "load_management");
    private static final List<String> WITHOUT_OCPI = List.of("load_management");

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper json;
    @Autowired private OcpiPartyRepository parties;
    @Autowired private PartnerConnectionRepository connections;
    @Autowired private PartnerEndpointRepository endpoints;
    @Autowired private TokenHasher tokenHasher;

    @BeforeEach
    void setUp() {
        endpoints.deleteAll();
        connections.deleteAll();
        parties.deleteAll();
    }

    private String vendorAdmin(long vendorId, List<String> modules) {
        return PortalTokens.bearer(9L, 3, vendorId, modules);
    }

    private String platformAdmin() {
        return PortalTokens.bearer(1L, 1, null, List.of());
    }

    private OcpiParty partyFor(long vendorId, String country, String partyId) {
        OcpiParty party = new OcpiParty();
        party.setTenantId(vendorId);
        party.setCountryCode(country);
        party.setPartyId(partyId);
        party.setRole(OcpiRole.CPO);
        party.setBusinessName("Vendor " + vendorId);
        return parties.save(party);
    }

    private String upsertBody(String country, String partyId) {
        return "{\"countryCode\":\"" + country + "\",\"partyId\":\"" + partyId
                + "\",\"businessName\":\"Acme Charging\"}";
    }

    @Test
    @DisplayName("A vendor admin sets up its own party and invites a partner")
    void vendorManagesItsOwnRoaming() throws Exception {
        mockMvc.perform(put("/portal/ocpi/party")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI))
                        .contentType(MediaType.APPLICATION_JSON).content(upsertBody("IN", "ACM")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vendorId").value(VENDOR_A))
                .andExpect(jsonPath("$.partyId").value("ACM"));

        String invite = mockMvc.perform(post("/portal/ocpi/connections/invite")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"partnerLabel\":\"Partner BV\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode result = json.readTree(invite);
        String tokenA = result.path("tokenA").asText();
        assertThat(tokenA).isNotBlank();

        PartnerConnection stored = connections.findById(result.path("connectionId").asLong()).orElseThrow();
        assertThat(stored.getParty().getTenantId()).isEqualTo(VENDOR_A);
        assertThat(stored.getTokenAHash()).isEqualTo(tokenHasher.hash(tokenA));
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.PENDING);

        mockMvc.perform(get("/portal/ocpi/connections")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].partnerBusinessName").value("Partner BV"));
    }

    @Test
    @DisplayName("Anonymous requests are refused")
    void anonymousIsRefused() throws Exception {
        mockMvc.perform(get("/portal/ocpi/party")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("A vendor without the OCPI module is forbidden")
    void ocpiModuleIsRequired() throws Exception {
        mockMvc.perform(get("/portal/ocpi/connections")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITHOUT_OCPI)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("A vendor admin cannot see or touch another vendor's OCPI")
    void vendorsAreIsolated() throws Exception {
        partyFor(VENDOR_A, "IN", "AAA");
        OcpiParty b = partyFor(VENDOR_B, "IN", "BBB");
        PartnerConnection bConn = new PartnerConnection();
        bConn.setParty(b);
        bConn.setTokenAHash(tokenHasher.hash("b-token"));
        connections.save(bConn);

        mockMvc.perform(get("/portal/ocpi/connections")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI))
                        .param("vendorId", String.valueOf(VENDOR_B)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/portal/ocpi/connections/" + bConn.getId())
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI)))
                .andExpect(status().isBadRequest());

        assertThat(connections.findById(bConn.getId()).orElseThrow().getStatus())
                .isEqualTo(ConnectionStatus.PENDING);
    }

    @Test
    @DisplayName("The platform admin acts on a named vendor and must name one")
    void platformAdminActsOnAnyVendor() throws Exception {
        partyFor(VENDOR_A, "IN", "AAA");

        mockMvc.perform(get("/portal/ocpi/party")
                        .header("Authorization", platformAdmin())
                        .param("vendorId", String.valueOf(VENDOR_A)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partyId").value("AAA"));

        mockMvc.perform(get("/portal/ocpi/party").header("Authorization", platformAdmin()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("A vendor's OCPI identity cannot be changed once set")
    void partyIdentityIsFixed() throws Exception {
        mockMvc.perform(put("/portal/ocpi/party")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI))
                        .contentType(MediaType.APPLICATION_JSON).content(upsertBody("IN", "ACM")))
                .andExpect(status().isOk());

        mockMvc.perform(put("/portal/ocpi/party")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI))
                        .contentType(MediaType.APPLICATION_JSON).content(upsertBody("IN", "XYZ")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Inviting before a party exists is refused")
    void inviteNeedsAParty() throws Exception {
        mockMvc.perform(post("/portal/ocpi/connections/invite")
                        .header("Authorization", vendorAdmin(VENDOR_A, WITH_OCPI))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }
}
