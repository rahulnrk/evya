package com.evya.ocpi.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Mints OCPI credentials tokens. 256 bits from {@link SecureRandom}, base64url without padding, so the
 * value is safe in an Authorization header and has no structure a partner could guess or enumerate.
 */
@Component
public class TokenGenerator {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom random = new SecureRandom();

    public String newToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
