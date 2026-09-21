package com.evyasense.layer.config;

import com.evyasense.layer.controller.AnomalyController;
import com.evyasense.layer.controller.SenseController;
import com.evyasense.layer.controller.StatusController;
import com.evyasense.layer.ingest.IngestUrlFetcher;
import com.evyasense.layer.kafka.SenseStore;
import com.evyasense.layer.repo.ChargerAnomalyRepository;
import com.evyasense.layer.service.LiveStatusService;
import com.evyasense.layer.service.StatusEventHub;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-004. Tokens are real HS256 JWTs signed like the business API signs them, so the decoder, the
 * access-only rule and the roleId mapping are exercised - not a mocked authentication.
 */
@WebMvcTest(controllers = {AnomalyController.class, StatusController.class, SenseController.class})
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "jwt.secret=" + SecurityConfigTest.SECRET,
        "sense.cors.allowed-origins=https://portal.example"
})
class SecurityConfigTest {

    static final String SECRET = "sense-test-only-jwt-secret-0123456789abcdef";
    private static final String OTHER_SECRET = "a-different-secret-nobody-issued-tokens-with";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChargerAnomalyRepository anomalies;
    @MockitoBean
    private LiveStatusService liveStatus;
    @MockitoBean
    private StatusEventHub statusEvents;
    @MockitoBean
    private KafkaTemplate<String, String> kafka;
    @MockitoBean
    private SenseStore store;
    @MockitoBean
    private IngestUrlFetcher urlFetcher;

    private static String token(String secret, Object roleId, String type, String tokenType,
                                Instant expiresAt) throws Exception {
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .subject("7")
                .claim("userId", 7)
                .claim("type", type)
                .claim("tokenType", tokenType)
                .issueTime(Date.from(Instant.now().minusSeconds(60)))
                .expirationTime(Date.from(expiresAt));
        if (roleId != null) {
            claims.claim("roleId", roleId);
        }
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims.build());
        jwt.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
        return "Bearer " + jwt.serialize();
    }

    private static Instant inAnHour() {
        return Instant.now().plusSeconds(3600);
    }

    @Test
    @DisplayName("The operator API refuses anonymous requests")
    void anonymousIsRefused() throws Exception {
        mockMvc.perform(get("/api/anomalies")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/sense/read")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("An operator access token is accepted")
    void operatorIsAccepted() throws Exception {
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(SECRET, 1, "EMPLOYEE", "access", inAnHour())))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(SECRET, 6, "USER", "access", inAnHour())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("A driver's app token is authenticated but forbidden")
    void driverIsForbidden() throws Exception {
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(SECRET, 2, "MOBILE", "access", inAnHour())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("A token without a roleId is forbidden")
    void missingRoleIsForbidden() throws Exception {
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(SECRET, null, "USER", "access", inAnHour())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Refresh tokens, expired tokens and foreign signatures are refused")
    void invalidTokensAreRefused() throws Exception {
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(SECRET, 1, "EMPLOYEE", "refresh", inAnHour())))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(SECRET, 1, "EMPLOYEE", "access",
                                Instant.now().minusSeconds(600))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/anomalies")
                        .header("Authorization", token(OTHER_SECRET, 1, "EMPLOYEE", "access", inAnHour())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Ingestion requires an operator")
    void ingestRequiresOperator() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "2026-09-21_LAB001.txt", "text/plain",
                "line".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/sense/ingest/upload").file(file))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(multipart("/api/sense/ingest/upload").file(file)
                        .header("Authorization", token(SECRET, 2, "MOBILE", "access", inAnHour())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("The web map's live status stays public")
    void liveStatusIsPublic() throws Exception {
        mockMvc.perform(get("/api/status").param("ids", "CP1")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Cross-origin: status from anywhere, operator API only from the configured portal")
    void corsIsScoped() throws Exception {
        mockMvc.perform(options("/api/status")
                        .header("Origin", "https://anywhere.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "*"));

        mockMvc.perform(options("/api/anomalies")
                        .header("Origin", "https://portal.example")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://portal.example"));

        mockMvc.perform(options("/api/anomalies")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
