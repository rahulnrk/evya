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
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Found in review of the first version: the handshake writes a snapshot loaded before its outbound
 * call, and liveness tracking saved whole entities, so racing requests could both "win" or undo a
 * registration. These pin the fix (optimistic locking plus a one-column liveness update).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CredentialsConcurrencyTest {

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
    private PartnerConnection connection;
    private String tokenA;

    @BeforeEach
    void setUp() throws Exception {
        endpoints.deleteAll();
        connections.deleteAll();
        parties.deleteAll();
        partner = new FakePartnerPlatform();

        OcpiParty party = new OcpiParty();
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
        return "Token " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private MvcResult postCredentials() throws Exception {
        return mockMvc.perform(post("/ocpi/2.2.1/credentials")
                        .header("Authorization", auth(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"partner-token-b","url":"%s",
                                 "roles":[{"role":"EMSP","party_id":"XYZ","country_code":"NL"}]}
                                """.formatted(partner.versionsUrl())))
                .andReturn();
    }

    @Test
    @DisplayName("Two handshakes racing on one Token A produce exactly one registration")
    void concurrentHandshakesHaveOneWinner() throws Exception {
        partner.holdVersionsUntil(2);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        Callable<MvcResult> attempt = this::postCredentials;
        List<MvcResult> results = pool.invokeAll(List.of(attempt, attempt), 60, TimeUnit.SECONDS)
                .stream().map(future -> {
                    try {
                        return future.get();
                    } catch (Exception e) {
                        throw new IllegalStateException(e);
                    }
                }).toList();
        pool.shutdown();

        List<MvcResult> winners = results.stream()
                .filter(r -> r.getResponse().getStatus() == 200).toList();
        List<MvcResult> losers = results.stream()
                .filter(r -> r.getResponse().getStatus() != 200).toList();

        assertThat(winners).hasSize(1);
        assertThat(losers).hasSize(1);
        assertThat(losers.get(0).getResponse().getStatus()).isEqualTo(409);

        String winningToken = json.readTree(winners.get(0).getResponse().getContentAsString())
                .path("data").path("token").asText();
        PartnerConnection stored = connections.findById(connection.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.REGISTERED);
        assertThat(stored.getTokenCHash()).isEqualTo(tokenHasher.hash(winningToken));

        mockMvc.perform(get("/ocpi/2.2.1/credentials").header("Authorization", auth(winningToken)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Liveness tracking cannot revert a registration")
    void livenessUpdateDoesNotTouchCredentials() throws Exception {
        MvcResult registered = postCredentials();
        assertThat(registered.getResponse().getStatus()).isEqualTo(200);
        String tokenCHash = connections.findById(connection.getId()).orElseThrow().getTokenCHash();

        connections.touchLastSeen(connection.getId(), Instant.now());

        PartnerConnection stored = connections.findById(connection.getId()).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(ConnectionStatus.REGISTERED);
        assertThat(stored.getTokenCHash()).isEqualTo(tokenCHash);
        assertThat(stored.getTokenAHash()).isNull();
        assertThat(stored.getLastSeenAt()).isNotNull();
    }
}
