package com.ewe.security;

import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Component
public class JwtTokenProvider {

	private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

	/** Known-weak / previously shipped defaults — must never be accepted. */
	private static final Set<String> FORBIDDEN_SECRETS = new HashSet<>(Arrays.asList(
			"evya-dev-jwt-secret-change-me-32chars-min",
			"change-me-to-a-long-random-string-at-least-32-chars",
			"secret",
			"changeme"
	));

	public static final String TOKEN_TYPE_ACCESS = "access";
	public static final String TOKEN_TYPE_REFRESH = "refresh";

	@Value("${jwt.secret:}")
	private String jwtSecret;

	@Value("${jwt.expiration-ms:3600000}")
	private long jwtExpirationMs;

	@Value("${jwt.refresh-expiration-ms:86400000}")
	private long refreshExpirationMs;

	/**
	 * SEC-2b: refuse to start with missing/short/known-default JWT secret.
	 * No silent forgeable fallback.
	 */
	@PostConstruct
	public void validateSecretAtStartup() {
		if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
			throw new IllegalStateException(
					"FATAL: jwt.secret / JWT_SECRET is not set. "
							+ "Set a strong random secret (min 32 chars) via environment variable JWT_SECRET. "
							+ "Refusing to start with a missing or default secret.");
		}
		String s = jwtSecret.trim();
		if (s.length() < 32) {
			throw new IllegalStateException(
					"FATAL: JWT_SECRET must be at least 32 characters (got " + s.length() + "). Refusing to start.");
		}
		if (FORBIDDEN_SECRETS.contains(s)) {
			throw new IllegalStateException(
					"FATAL: JWT_SECRET matches a known weak/default value. Generate a unique secret and set JWT_SECRET.");
		}
		log.info("JWT secret validated at startup (length={})", s.length());
	}

	public String createAccessToken(Long userId, Integer roleId, Long orgId, String subjectType) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("userId", userId);
		claims.put("roleId", roleId);
		claims.put("orgId", orgId);
		claims.put("type", subjectType);
		claims.put("tokenType", TOKEN_TYPE_ACCESS);
		return buildToken(claims, String.valueOf(userId), jwtExpirationMs);
	}

	public String createRefreshToken(Long userId) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("userId", userId);
		claims.put("tokenType", TOKEN_TYPE_REFRESH);
		return buildToken(claims, String.valueOf(userId), refreshExpirationMs);
	}

	private String buildToken(Map<String, Object> claims, String subject, long ttlMs) {
		Date now = new Date();
		Date exp = new Date(now.getTime() + ttlMs);
		return Jwts.builder()
				.setClaims(claims)
				.setSubject(subject)
				.setIssuedAt(now)
				.setExpiration(exp)
				.signWith(SignatureAlgorithm.HS256, jwtSecret.getBytes())
				.compact();
	}

	public Claims parseClaims(String token) {
		return Jwts.parser()
				.setSigningKey(jwtSecret.getBytes())
				.parseClaimsJws(token)
				.getBody();
	}

	/** Signature + expiry only (any token type). Prefer {@link #validateAccessToken}. */
	public boolean validate(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	/**
	 * SEC-2c: only access tokens may authenticate API requests.
	 * Refresh tokens are rejected even if signature/expiry are valid.
	 */
	public boolean validateAccessToken(String token) {
		try {
			Claims claims = parseClaims(token);
			Object tokenType = claims.get("tokenType");
			if (tokenType == null || !TOKEN_TYPE_ACCESS.equals(String.valueOf(tokenType))) {
				return false;
			}
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	public Long getUserId(String token) {
		Object v = parseClaims(token).get("userId");
		if (v == null) {
			return Long.valueOf(parseClaims(token).getSubject());
		}
		return Long.valueOf(v.toString());
	}

	public Integer getRoleId(String token) {
		Object v = parseClaims(token).get("roleId");
		return v == null ? null : Integer.valueOf(v.toString());
	}

	public Long getOrgId(String token) {
		Object v = parseClaims(token).get("orgId");
		return v == null ? null : Long.valueOf(v.toString());
	}
}
