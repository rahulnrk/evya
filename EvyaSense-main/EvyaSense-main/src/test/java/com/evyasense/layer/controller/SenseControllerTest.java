package com.evyasense.layer.controller;

import com.evyasense.layer.kafka.SenseStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * The consumer now attributes every line by its Kafka key (SENSE-003), so the upload path - the one
 * that already worked - must publish keyed lines or it would be silently dropped.
 */
class SenseControllerTest {

    private static final String LOG = "Mon Sep 21 00:00:04 IST 2026\tReceived Message : [2,\"a\",\"Heartbeat\",{}]\n"
            + "Mon Sep 21 00:00:05 IST 2026\tResponse Message : [3,\"a\",{\"currentTime\":\"x\"}]\n";

    @SuppressWarnings("unchecked")
    private final KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
    private final SenseStore store = mock(SenseStore.class);
    private SenseController controller;

    @BeforeEach
    void setUp() {
        controller = new SenseController(kafka, store);
    }

    private MockMultipartFile file(String name) {
        return new MockMultipartFile("file", name, "text/plain", LOG.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Uploaded lines are keyed by the charger named in the CSMS file name")
    void uploadKeysByFileName() {
        ResponseEntity<String> response = controller.upload(file("2026-09-21_LAB001.txt"), null);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(kafka).send("evya-sense-topic", "LAB001",
                "Mon Sep 21 00:00:04 IST 2026\tReceived Message : [2,\"a\",\"Heartbeat\",{}]");
        verify(kafka).send("evya-sense-topic", "LAB001",
                "Mon Sep 21 00:00:05 IST 2026\tResponse Message : [3,\"a\",{\"currentTime\":\"x\"}]");
    }

    @Test
    @DisplayName("An explicit chargerId wins over the file name")
    void explicitChargerIdWins() {
        controller.upload(file("anything.txt"), "CP-42");

        verify(kafka).send("evya-sense-topic", "CP-42",
                "Mon Sep 21 00:00:04 IST 2026\tReceived Message : [2,\"a\",\"Heartbeat\",{}]");
    }

    @Test
    @DisplayName("Without a charger the upload is refused, and nothing is published or cleared")
    void uploadWithoutChargerIsRefused() {
        ResponseEntity<String> response = controller.upload(file("export.txt"), null);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).contains("chargerId is required");
        verify(kafka, never()).send(anyString(), anyString(), anyString());
        verify(store, never()).clear();
    }

    @Test
    @DisplayName("Charger ids are resolved from names and paths, and unsafe ids are rejected")
    void chargerIdResolution() {
        assertThat(SenseController.resolveChargerId(null, "2026-09-21_LAB001.txt")).isEqualTo("LAB001");
        assertThat(SenseController.resolveChargerId(null, "logs/LAB002/2026-09-21_LAB002.txt")).isEqualTo("LAB002");
        assertThat(SenseController.resolveChargerId(null, "C:\\fakepath\\2026-09-21_LAB007.txt")).isEqualTo("LAB007");
        assertThat(SenseController.resolveChargerId("  CP-9 ", null)).isEqualTo("CP-9");
        assertThat(SenseController.resolveChargerId(null, "notes.txt")).isNull();
        assertThat(SenseController.resolveChargerId(null, null)).isNull();
        assertThat(SenseController.resolveChargerId("charger:*", null)).isNull();
        assertThat(SenseController.resolveChargerId("a b", null)).isNull();
    }
}
