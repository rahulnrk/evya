package com.evya.ocpi;

import com.evya.ocpi.security.TokenCipher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenCipherTest {

    private static final String KEY = Base64.getEncoder()
            .encodeToString("evya-ocpi-test-key-0123456789abc".getBytes());
    private static final String OTHER_KEY = Base64.getEncoder()
            .encodeToString("a-completely-different-key-12345".getBytes());

    @Test
    @DisplayName("A token survives a round trip")
    void roundTrip() {
        TokenCipher cipher = new TokenCipher(KEY);
        String token = "partner-token-b-value";
        String encrypted = cipher.encrypt(token);

        assertThat(encrypted).isNotEqualTo(token).doesNotContain(token);
        assertThat(cipher.decrypt(encrypted)).isEqualTo(token);
    }

    @Test
    @DisplayName("Encrypting the same token twice gives different ciphertext")
    void ivIsRandomised() {
        TokenCipher cipher = new TokenCipher(KEY);
        assertThat(cipher.encrypt("same")).isNotEqualTo(cipher.encrypt("same"));
    }

    @Test
    @DisplayName("Ciphertext is useless without the key")
    void wrongKeyFails() {
        String encrypted = new TokenCipher(KEY).encrypt("partner-token-b-value");
        assertThatThrownBy(() -> new TokenCipher(OTHER_KEY).decrypt(encrypted))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("A tampered ciphertext is rejected rather than silently decrypted")
    void tamperingIsDetected() {
        TokenCipher cipher = new TokenCipher(KEY);
        String encrypted = cipher.encrypt("partner-token-b-value");

        byte[] raw = Base64.getDecoder().decode(encrypted);
        raw[raw.length - 1] ^= 0x01;
        String tampered = Base64.getEncoder().encodeToString(raw);

        assertThatThrownBy(() -> cipher.decrypt(tampered))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Startup fails loudly when the key is missing or the wrong size")
    void keyIsValidatedAtStartup() {
        assertThatThrownBy(() -> new TokenCipher(""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OCPI_TOKEN_KEY");

        String shortKey = Base64.getEncoder().encodeToString("too-short".getBytes());
        assertThatThrownBy(() -> new TokenCipher(shortKey))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }
}
