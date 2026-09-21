package com.evyasense.layer.canonical;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ChargerIdsTest {

    @Test
    @DisplayName("Ordinary and MAC-style OCPP identities are accepted")
    void realIdsAreValid() {
        assertThat(ChargerIds.isValid("LAB001")).isTrue();
        assertThat(ChargerIds.isValid("EVY-CP_12.3")).isTrue();
        assertThat(ChargerIds.isValid("00:1A:2B:3C:4D:5E")).isTrue();
    }

    @Test
    @DisplayName("Ids that could forge logs, widen Redis scans or alias a Redis key are refused")
    void unsafeIdsAreRefused() {
        assertThat(ChargerIds.isValid(null)).isFalse();
        assertThat(ChargerIds.isValid("")).isFalse();
        assertThat(ChargerIds.isValid("BAD ID")).isFalse();
        assertThat(ChargerIds.isValid("CP1\nforged log line")).isFalse();
        assertThat(ChargerIds.isValid("charger*")).isFalse();
        assertThat(ChargerIds.isValid("CP1:connectors")).isFalse();
        assertThat(ChargerIds.isValid("x".repeat(65))).isFalse();
    }

    @Test
    @DisplayName("Printable form masks control characters and truncates")
    void printableMasksAndTruncates() {
        assertThat(ChargerIds.printable("CP1\nforged")).isEqualTo("CP1?forged");
        assertThat(ChargerIds.printable(null)).isEqualTo("<none>");
        assertThat(ChargerIds.printable("y".repeat(100))).hasSize(83).endsWith("...");
    }
}
