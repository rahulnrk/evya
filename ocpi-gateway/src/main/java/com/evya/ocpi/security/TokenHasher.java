package com.evya.ocpi.security;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Hashes tokens for indexed lookup.
 *
 * <p>Unsalted SHA-256 is deliberate: these are 256-bit values we generated ourselves, so there is no
 * dictionary to attack and a per-row salt would make lookup a table scan. This is only ever applied to
 * tokens from {@link TokenGenerator} or presented by a partner - never to a human-chosen secret.
 */
@Component
public class TokenHasher {

    public String hash(String rawToken) {
        if (rawToken == null || rawToken.isEmpty()) {
            throw new IllegalArgumentException("Cannot hash an empty token");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hashed.length * 2);
            for (byte b : hashed) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable in this JVM", e);
        }
    }
}
