package com.ewe.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * SEC-2b / SEC-2c: secret fail-fast + access-only validation.
 */
public class JwtTokenProviderTest {

	private JwtTokenProvider provider;

	@BeforeEach
	void setUp() {
		provider = new JwtTokenProvider();
		ReflectionTestUtils.setField(provider, "jwtSecret",
				"unit-test-jwt-secret-value-at-least-32-chars-long!!");
		ReflectionTestUtils.setField(provider, "jwtExpirationMs", 3600000L);
		ReflectionTestUtils.setField(provider, "refreshExpirationMs", 86400000L);
	}

	@Test
	void accessTokenValidatesAsAccess() {
		String access = provider.createAccessToken(1L, 2, 1L, "MOBILE");
		assertTrue(provider.validateAccessToken(access));
		assertTrue(provider.validate(access));
	}

	@Test
	void refreshTokenMustNotAuthenticateApi() {
		String refresh = provider.createRefreshToken(1L);
		assertTrue(provider.validate(refresh), "signature still valid");
		assertFalse(provider.validateAccessToken(refresh), "refresh must not be accepted as access");
	}

	@Test
	void blankSecretFailsStartup() {
		JwtTokenProvider p = new JwtTokenProvider();
		ReflectionTestUtils.setField(p, "jwtSecret", "");
		assertThrows(IllegalStateException.class, p::validateSecretAtStartup);
	}

	@Test
	void knownWeakSecretFailsStartup() {
		JwtTokenProvider p = new JwtTokenProvider();
		ReflectionTestUtils.setField(p, "jwtSecret", "evya-dev-jwt-secret-change-me-32chars-min");
		assertThrows(IllegalStateException.class, p::validateSecretAtStartup);
	}

	@Test
	void shortSecretFailsStartup() {
		JwtTokenProvider p = new JwtTokenProvider();
		ReflectionTestUtils.setField(p, "jwtSecret", "tooshort");
		assertThrows(IllegalStateException.class, p::validateSecretAtStartup);
	}
}
