package com.evya.ocpi;

import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.OcpiRole;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.OcpiPartyRepository;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.domain.repo.PartnerEndpointRepository;
import com.evya.ocpi.security.TokenGenerator;
import com.evya.ocpi.security.TokenHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authentication regressions for OCPI-001.
 *
 * <p>The replaced stub let any caller through on the credentials endpoint
 * ({@code OcpiAuthFilter.java:29} skipped every path containing "/credentials"), which meant anyone who
 * found the URL could register themselves as a roaming partner. These tests fail if that ever returns.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OcpiAuthFilterTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private OcpiPartyRepository parties;
    @Autowired
    private PartnerConnectionRepository connections;
    @Autowired
    private PartnerEndpointRepository endpoints;
    @Autowired
    private TokenGenerator tokenGenerator;
    @Autowired
    private TokenHasher tokenHasher;

    private String tokenA;

    @BeforeEach
    void setUp() {
        endpoints.deleteAll();
        connections.deleteAll();
        parties.deleteAll();

        OcpiParty party = new OcpiParty();
        party.setTenantId(7L);
        party.setCountryCode("IN");
        party.setPartyId("EVY");
        party.setRole(OcpiRole.CPO);
        party.setBusinessName("Evya Lab Tenant");
        parties.save(party);

        tokenA = tokenGenerator.newToken();
        PartnerConnection connection = new PartnerConnection();
        connection.setParty(party);
        connection.setTokenAHash(tokenHasher.hash(tokenA));
        connections.save(connection);
    }

    private String auth(String token) {
        return "Token " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("The credentials endpoint is not exempt from authentication")
    void credentialsRequiresAToken() throws Exception {
        mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"x\",\"url\":\"https://partner.test.invalid/versions\","
                                + "\"roles\":[{\"role\":\"EMSP\",\"party_id\":\"XYZ\","
                                + "\"country_code\":\"NL\"}]}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("An unknown token is refused")
    void unknownTokenIsRefused() throws Exception {
        mockMvc.perform(get("/ocpi/versions").header("Authorization", auth("not-a-real-token")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("A malformed Authorization header is refused")
    void malformedHeaderIsRefused() throws Exception {
        mockMvc.perform(get("/ocpi/versions").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/ocpi/versions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Refusals do not disclose which check failed")
    void refusalMessageIsUniform() throws Exception {
        mockMvc.perform(get("/ocpi/versions").header("Authorization", auth("not-a-real-token")))
                .andExpect(jsonPath("$.status_message").value("Invalid or missing credentials token"));
        mockMvc.perform(get("/ocpi/versions"))
                .andExpect(jsonPath("$.status_message").value("Invalid or missing credentials token"));
    }

    @Test
    @DisplayName("Token A reaches the version endpoints, which is how a handshake starts")
    void tokenAReachesVersions() throws Exception {
        mockMvc.perform(get("/ocpi/versions").header("Authorization", auth(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status_code").value(1000))
                .andExpect(jsonPath("$.data[0].version").value("2.2.1"));

        mockMvc.perform(get("/ocpi/versions/2.2.1").header("Authorization", auth(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.endpoints[0].identifier").value("credentials"));
    }

    @Test
    @DisplayName("A raw (un-encoded) token is also accepted, for partners that skip base64")
    void rawTokenIsAccepted() throws Exception {
        mockMvc.perform(get("/ocpi/versions").header("Authorization", "Token " + tokenA))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("An unsupported version is answered with OCPI 3002")
    void unsupportedVersionIsReported() throws Exception {
        mockMvc.perform(get("/ocpi/versions/2.1.1").header("Authorization", auth(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status_code").value(3002));
    }
}
