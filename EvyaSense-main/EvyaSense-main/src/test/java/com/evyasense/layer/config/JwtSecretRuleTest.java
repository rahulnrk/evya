package com.evyasense.layer.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** EvyaSense refuses to run with a secret an attacker could guess, like the backend (SEC-2b). */
class JwtSecretRuleTest {

    @Test
    @DisplayName("A missing, short or known-default secret stops startup")
    void weakSecretsAreRefused() {
        assertThatThrownBy(() -> SecurityConfig.requireStrongSecret(null))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("JWT_SECRET");
        assertThatThrownBy(() -> SecurityConfig.requireStrongSecret("   "))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> SecurityConfig.requireStrongSecret("too-short-secret"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("at least 32");
        assertThatThrownBy(() -> SecurityConfig.requireStrongSecret(
                "change-me-to-a-long-random-string-at-least-32-chars"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("known weak");
    }

    @Test
    @DisplayName("A long random secret is accepted")
    void strongSecretIsAccepted() {
        assertThatCode(() -> SecurityConfig.requireStrongSecret("q7Hc2mN9vX4pL8rT1wZ6yB3kF5sD0gJ2"))
                .doesNotThrowAnyException();
    }
}
