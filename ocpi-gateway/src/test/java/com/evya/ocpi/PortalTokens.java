package com.evya.ocpi;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/** Mints platform-style HS256 tokens for the portal OCPI tests. */
final class PortalTokens {

    static final String SECRET = "ocpi-portal-test-secret-0123456789abcdef";

    private PortalTokens() {
    }

    static String bearer(long userId, int roleId, Long vendorId, List<String> modules) {
        try {
            JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .claim("userId", userId)
                    .claim("roleId", roleId)
                    .claim("tokenType", "access")
                    .issueTime(Date.from(Instant.now().minusSeconds(30)))
                    .expirationTime(Date.from(Instant.now().plusSeconds(3600)));
            if (vendorId != null) {
                claims.claim("vendorId", vendorId);
            }
            if (modules != null) {
                claims.claim("modules", modules);
            }
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims.build());
            jwt.sign(new MACSigner(SECRET.getBytes(StandardCharsets.UTF_8)));
            return "Bearer " + jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
