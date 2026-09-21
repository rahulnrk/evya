package com.evya.ocpi;

import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.OcpiRole;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.OcpiPartyRepository;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.domain.repo.PartnerEndpointRepository;
import com.evya.ocpi.security.TokenGenerator;
import com.evya.ocpi.security.TokenHasher;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The OCPI credentials handshake end to end, against a fake partner platform.
 *
 * <p>These also pin the two defects in the stub this service replaces (OCPI-001): the credentials
 * endpoint was exempt from authentication, and the token it handed back was a hardcoded constant that
 * was never persisted, so a partner could never authenticate afterwards.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CredentialsHandshakeTest {

    private static final String PARTNER_TOKEN_B = "partner-token-b-value";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper json;
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

    private FakePartnerPlatform partner;
    private OcpiParty party;
    private PartnerConnection connection;
    private String tokenA;

    @BeforeEach
    void setUp() throws Exception {
        endpoints.deleteAll();
        connections.deleteAll();
        parties.deleteAll();

        partner = new FakePartnerPlatform();

        party = new OcpiParty();
        party.setTenantId(42L);
        party.setCountryCode("IN");
        party.setPartyId("EVY");
        party.setRole(OcpiRole.CPO);
        party.setBusinessName("Evya Lab Tenant");
        parties.save(party);

        tokenA = tokenGenerator.newToken();
        connection = new PartnerConnection();
        connection.setParty(party);
        connection.setTokenAHash(tokenHasher.hash(tokenA));
        connections.save(connection);
    }

    @AfterEach
    void tearDown() {
        partner.close();
    }

    private String auth(String token) {
        return "Token " + Base64.getEncoder()
                .encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private String credentialsBody() {
        return """
                {"token":"%s","url":"%s",
                 "roles":[{"role":"EMSP","party_id":"XYZ","country_code":"NL",
                           "business_details":{"name":"Partner BV"}}]}
                """.formatted(PARTNER_TOKEN_B, partner.versionsUrl());
    }

    @Test
    @DisplayName("Token A completes the handshake and is answered with a usable Token C")
    void handshakeIssuesWorkingTokenC() throws Exception {
        String body = mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode response = json.readTree(body);
        assertThat(response.path("status_code").asInt()).isEqualTo(1000);
        assertThat(response.path("timestamp").asText()).isNotBlank();

        String tokenC = response.path("data").path("token").asText();
        assertThat(tokenC).isNotBlank();
        // The stub returned the constant "your-token-123" to every partner and never stored it.
        assertThat(tokenC).isNotEqualTo("your-token-123");

        JsonNode role = response.path("data").path("roles").get(0);
        assertThat(role.path("country_code").asText()).isEqualTo("IN");
        assertThat(role.path("party_id").asText()).isEqualTo("EVY");
        assertThat(role.path("role").asText()).isEqualTo("CPO");

        // Token C actually authenticates: this is what the stub could not do.
        mockMvc.perform(get("/ocpi/2.2.1/credentials").header("Authorization", auth(tokenC)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Token A is single use: it stops working once the handshake completes")
    void tokenAIsInvalidatedAfterRegistration() throws Exception {
        mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andExpect(status().isOk());

        assertThat(connections.findById(connection.getId()).orElseThrow().getTokenAHash()).isNull();

        mockMvc.perform(get("/ocpi/2.2.1/credentials").header("Authorization", auth(tokenA)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("The handshake records the partner and caches their endpoints")
    void handshakeStoresPartnerInterface() throws Exception {
        mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andExpect(status().isOk());

        PartnerConnection stored = connections.findById(connection.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.REGISTERED);
        assertThat(stored.getPartnerCountryCode()).isEqualTo("NL");
        assertThat(stored.getPartnerPartyId()).isEqualTo("XYZ");
        assertThat(stored.getPartnerRole()).isEqualTo(OcpiRole.EMSP);
        assertThat(stored.getAgreedVersion()).isEqualTo("2.2.1");
        assertThat(stored.getRegisteredAt()).isNotNull();
        assertThat(endpoints.findByConnection(stored)).hasSize(2);

        // We called the partner with their own Token B, base64 encoded as OCPI 2.2 requires.
        String expected = "Token " + Base64.getEncoder()
                .encodeToString(PARTNER_TOKEN_B.getBytes(StandardCharsets.UTF_8));
        assertThat(partner.seenAuthorization()).isNotEmpty().allMatch(expected::equals);
    }

    @Test
    @DisplayName("No token is stored in a form the database alone can replay")
    void storedTokensAreNotRecoverableFromColumnsAlone() throws Exception {
        String body = mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andReturn().getResponse().getContentAsString();
        String tokenC = json.readTree(body).path("data").path("token").asText();

        PartnerConnection stored = connections.findById(connection.getId()).orElseThrow();
        assertThat(stored.getTokenCHash()).isNotNull().isNotEqualTo(tokenC);
        assertThat(stored.getTokenCEncrypted()).isNotNull().doesNotContain(tokenC);
        assertThat(stored.getPartnerTokenEncrypted()).isNotNull().doesNotContain(PARTNER_TOKEN_B);
    }

    @Test
    @DisplayName("A partner whose API is unreachable leaves no half-registered connection")
    void failedDiscoveryLeavesTokenAUsable() throws Exception {
        partner.breakVersions();

        String body = mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(json.readTree(body).path("status_code").asInt()).isEqualTo(3001);

        PartnerConnection stored = connections.findById(connection.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.PENDING);
        assertThat(stored.getTokenAHash()).isNotNull();
        assertThat(stored.getTokenCHash()).isNull();
    }

    @Test
    @DisplayName("POST on an already registered connection is refused; PUT rotates instead")
    void reRegistrationUsesPut() throws Exception {
        String first = mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andReturn().getResponse().getContentAsString();
        String tokenC = json.readTree(first).path("data").path("token").asText();

        mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenC))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andExpect(status().isMethodNotAllowed());

        String rotated = mockMvc.perform(put("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenC))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String newTokenC = json.readTree(rotated).path("data").path("token").asText();
        assertThat(newTokenC).isNotEqualTo(tokenC);

        mockMvc.perform(get("/ocpi/2.2.1/credentials").header("Authorization", auth(tokenC)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/ocpi/2.2.1/credentials").header("Authorization", auth(newTokenC)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE unregisters and destroys every token on the connection")
    void unregisterDestroysCredentials() throws Exception {
        String body = mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentialsBody()))
                .andReturn().getResponse().getContentAsString();
        String tokenC = json.readTree(body).path("data").path("token").asText();

        mockMvc.perform(delete("/ocpi/2.2.1/credentials").header("Authorization", auth(tokenC)))
                .andExpect(status().isOk());

        PartnerConnection stored = connections.findById(connection.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.UNREGISTERED);
        assertThat(stored.getTokenCHash()).isNull();
        assertThat(stored.getPartnerTokenEncrypted()).isNull();
        assertThat(endpoints.findByConnection(stored)).isEmpty();

        mockMvc.perform(get("/ocpi/2.2.1/credentials").header("Authorization", auth(tokenC)))
                .andExpect(status().isUnauthorized());
    }
}
