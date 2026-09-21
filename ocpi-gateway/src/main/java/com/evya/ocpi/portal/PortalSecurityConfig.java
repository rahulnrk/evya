package com.evya.ocpi.portal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Secures the portal-facing OCPI administration API (ADR-003 D4), replacing the internal API key. It
 * trusts the platform's operator JWT: the same HS256 {@code JWT_SECRET} the business API signs with.
 *
 * <p>Two surfaces:
 * <ul>
 *   <li>{@code /ocpi/**} - the roaming protocol, authenticated per partner by {@code OcpiAuthFilter};
 *       Spring Security leaves it alone.</li>
 *   <li>{@code /portal/**} - vendor self-service, authenticated by the platform JWT here. Per-vendor
 *       scoping and the {@code ocpi} module check are enforced in the controller from the token claims.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class PortalSecurityConfig {

    private static final int MIN_SECRET_LENGTH = 32;
    private static final Set<String> FORBIDDEN_SECRETS = Set.of(
            "evya-dev-jwt-secret-change-me-32chars-min",
            "change-me-to-a-long-random-string-at-least-32-chars",
            "secret", "changeme");

    @Bean
    public SecurityFilterChain portalSecurity(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
                .securityMatcher("/portal/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/portal/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.decoder(jwtDecoder)));
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(@Value("${platform.jwt-secret:}") String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("platform.jwt-secret (env PLATFORM_JWT_SECRET) is not set. The "
                    + "portal OCPI API validates the business API's operator tokens and needs the shared secret.");
        }
        String trimmed = secret.trim();
        if (trimmed.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("platform.jwt-secret must be at least " + MIN_SECRET_LENGTH + " chars");
        }
        if (FORBIDDEN_SECRETS.contains(trimmed)) {
            throw new IllegalStateException("platform.jwt-secret matches a known weak or default value");
        }

        SecretKeySpec key = new SecretKeySpec(trimmed.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(),
                new JwtClaimValidator<Object>("tokenType", type -> "access".equals(String.valueOf(type)))));
        return decoder;
    }
}
