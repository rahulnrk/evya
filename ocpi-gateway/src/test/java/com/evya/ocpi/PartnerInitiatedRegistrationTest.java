package com.evya.ocpi;

import com.evya.ocpi.domain.ConnectionDirection;
import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.OcpiRole;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.OcpiPartyRepository;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.domain.repo.PartnerEndpointRepository;
import com.evya.ocpi.security.TokenCipher;
import com.evya.ocpi.security.TokenHasher;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ADR-003 D5: the partner-initiated handshake. A partner (often a hub) issued EVYA a Token A out of
 * band; the vendor enters the partner's versions URL and that token, and EVYA completes the exchange as
 * the initiating party. Driven end to end against a simulated partner.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PartnerInitiatedRegistrationTest {

    private static final long VENDOR = 300L;
    private static final List<String> WITH_OCPI = List.of("ocpi");
    private static final String PARTNER_TOKEN_A = "token-a-the-partner-gave-us";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper json;
    @Autowired private OcpiPartyRepository parties;
    @Autowired private PartnerConnectionRepository connections;
    @Autowired private PartnerEndpointRepository endpoints;
    @Autowired private TokenHasher tokenHasher;
    @Autowired private TokenCipher tokenCipher;

    private FakePartnerPlatform partner;

    @BeforeEach
    void setUp() throws Exception {
        endpoints.deleteAll();
        connections.deleteAll();
        parties.deleteAll();
        partner = new FakePartnerPlatform();

        OcpiParty party = new OcpiParty();
        party.setTenantId(VENDOR);
        party.setCountryCode("IN");
        party.setPartyId("ACM");
        party.setRole(OcpiRole.CPO);
        party.setBusinessName("Acme Charging");
        parties.save(party);
    }

    @AfterEach
    void tearDown() {
        partner.close();
    }

    private String vendorAdmin() {
        return PortalTokens.bearer(9L, 3, VENDOR, WITH_OCPI);
    }

    private String registerBody(String versionsUrl, String token) {
        return "{\"versionsUrl\":\"" + versionsUrl + "\",\"token\":\"" + token
                + "\",\"partnerLabel\":\"Roaming Hub\"}";
    }

    @Test
    @DisplayName("A vendor registers with a partner that issued it a Token A")
    void registersWithAPartner() throws Exception {
        String body = mockMvc.perform(post("/portal/ocpi/connections/register")
                        .header("Authorization", vendorAdmin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(partner.versionsUrl(), PARTNER_TOKEN_A)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REGISTERED"))
                .andExpect(jsonPath("$.direction").value("OUTBOUND"))
                .andExpect(jsonPath("$.partnerPartyId").value("HUB"))
                .andReturn().getResponse().getContentAsString();

        long connectionId = json.readTree(body).path("id").asLong();
        PartnerConnection stored = connections.findById(connectionId).orElseThrow();
        assertThat(stored.getParty().getTenantId()).isEqualTo(VENDOR);
        assertThat(stored.getDirection()).isEqualTo(ConnectionDirection.OUTBOUND);
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.REGISTERED);
        assertThat(stored.getPartnerCountryCode()).isEqualTo("NL");

        // We called the partner's credentials endpoint with the Token A they gave us.
        assertThat(partner.seenAuthorization())
                .contains("Token " + java.util.Base64.getEncoder()
                        .encodeToString(PARTNER_TOKEN_A.getBytes(java.nio.charset.StandardCharsets.UTF_8)));

        // We POSTed our own credentials (our token + versions url) to them.
        JsonNode posted = json.readTree(partner.receivedCredentialsBody());
        assertThat(posted.path("token").asText()).isNotBlank();
        assertThat(posted.path("url").asText()).endsWith("/ocpi/versions");
        assertThat(posted.path("roles").get(0).path("party_id").asText()).isEqualTo("ACM");

        // Neither token is stored in a directly usable form.
        assertThat(stored.getTokenCHash()).isNotNull().isNotEqualTo(posted.path("token").asText());
        assertThat(tokenCipher.decrypt(stored.getPartnerTokenEncrypted()))
                .isEqualTo("partner-issued-token-for-evya");
        // The token we issued the partner authenticates back to us.
        assertThat(stored.getTokenCHash())
                .isEqualTo(tokenHasher.hash(tokenCipher.decrypt(stored.getTokenCEncrypted())));

        assertThat(endpoints.findByConnection(stored)).isNotEmpty();
    }

    @Test
    @DisplayName("A partner that cannot be reached leaves no connection behind")
    void unreachablePartnerLeavesNoState() throws Exception {
        partner.breakVersions();

        mockMvc.perform(post("/portal/ocpi/connections/register")
                        .header("Authorization", vendorAdmin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(partner.versionsUrl(), PARTNER_TOKEN_A)))
                .andExpect(status().isBadRequest());

        assertThat(connections.findAll()).isEmpty();
    }

    @Test
    @DisplayName("A malformed partner credentials response is rejected and stores nothing")
    void badPartnerResponseLeavesNoState() throws Exception {
        partner.credentialsReturnsBadBody();

        mockMvc.perform(post("/portal/ocpi/connections/register")
                        .header("Authorization", vendorAdmin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(partner.versionsUrl(), PARTNER_TOKEN_A)))
                .andExpect(status().isBadRequest());

        assertThat(connections.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Registering with an internal or non-https URL is refused")
    void ssrfTargetsAreRefused() throws Exception {
        mockMvc.perform(post("/portal/ocpi/connections/register")
                        .header("Authorization", vendorAdmin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("https://169.254.169.254/versions", PARTNER_TOKEN_A)))
                .andExpect(status().isBadRequest());

        assertThat(connections.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Registering before the vendor has a party is refused")
    void needsAPartyFirst() throws Exception {
        parties.deleteAll();

        mockMvc.perform(post("/portal/ocpi/connections/register")
                        .header("Authorization", vendorAdmin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(partner.versionsUrl(), PARTNER_TOKEN_A)))
                .andExpect(status().isBadRequest());

        assertThat(connections.findAll()).isEmpty();
    }

    @Test
    @DisplayName("A vendor without the OCPI module cannot register")
    void ocpiModuleRequired() throws Exception {
        mockMvc.perform(post("/portal/ocpi/connections/register")
                        .header("Authorization", PortalTokens.bearer(9L, 3, VENDOR, List.of("load_management")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(partner.versionsUrl(), PARTNER_TOKEN_A)))
                .andExpect(status().isForbidden());
    }
}
