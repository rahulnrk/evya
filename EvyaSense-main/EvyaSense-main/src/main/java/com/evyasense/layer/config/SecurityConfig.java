package com.evyasense.layer.config;

import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * SEC-004: every EvyaSense endpoint was reachable without authentication - anomalies (whose root causes
 * embed raw OCPP payloads, i.e. idTags), the event store, Redis internals, and the ingest endpoints that
 * can inject events or clear the store.
 *
 * <p>Operators authenticate with the access token the business API already issues (HS256, the same
 * {@code JWT_SECRET} the OCPP server validates). Authorisation mirrors the OCPP operator rule: the
 * token's {@code roleId} must be one of {@code sense.auth.operator-role-ids} (default 1,4,6). Drivers
 * (roleId 2, type MOBILE) and refresh tokens are refused. The live-status API stays public: it is the
 * web map's read-only availability feed.
 *
 * <p>Not covered here: tenant scoping. Any operator can still read every charger's data, because Sense
 * has no charger-to-tenant mapping yet.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final int MIN_SECRET_LENGTH = 32;

    /** Previously shipped or placeholder secrets; the backend refuses these too (SEC-2b). */
    private static final Set<String> FORBIDDEN_SECRETS = Set.of(
            "evya-dev-jwt-secret-change-me-32chars-min",
            "change-me-to-a-long-random-string-at-least-32-chars",
            "secret",
            "changeme");

    @Bean
    public SecurityFilterChain senseSecurity(HttpSecurity http, JwtDecoder jwtDecoder,
            @Value("${sense.auth.operator-role-ids:1,4,6}") String operatorRoleIds) throws Exception {

        String[] operatorAuthorities = Arrays.stream(operatorRoleIds.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .map(id -> "ROLE_" + id)
                .toArray(String[]::new);

        http
                // Stateless bearer-token API: no session, no cookies, so no CSRF surface.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Continuations of a request that was already authorised, and error rendering.
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/status", "/api/status/stream").permitAll()
                        .anyRequest().hasAnyAuthority(operatorAuthorities))
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt
                        .decoder(jwtDecoder)
                        .jwtAuthenticationConverter(roleIdAuthorities())));

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(@Value("${jwt.secret:}") String secret) {
        requireStrongSecret(secret);

        SecretKeySpec key = new SecretKeySpec(secret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();

        // Signature and expiry, plus: only access tokens authenticate (the backend's SEC-2c rule).
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(),
                new JwtClaimValidator<Object>("tokenType", type -> "access".equals(String.valueOf(type)))));
        return decoder;
    }

    /**
     * Cross-origin access: the public status API is open to any origin (read-only map data); the operator
     * API only to the configured portal origins. Empty means no cross-origin operator access at all.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${sense.cors.allowed-origins:}") String allowedOrigins) {

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        CorsConfiguration status = new CorsConfiguration();
        status.addAllowedOrigin("*");
        status.setAllowedMethods(List.of("GET"));
        source.registerCorsConfiguration("/api/status", status);
        source.registerCorsConfiguration("/api/status/**", status);

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .toList();
        if (!origins.isEmpty()) {
            CorsConfiguration operator = new CorsConfiguration();
            operator.setAllowedOrigins(origins);
            operator.setAllowedMethods(List.of("GET", "POST"));
            operator.setAllowedHeaders(List.of("Authorization", "Content-Type"));
            source.registerCorsConfiguration("/api/**", operator);
        }
        return source;
    }

    /** Maps the backend's roleId claim to ROLE_<id>, the convention the OCPP server uses. */
    private Converter<Jwt, AbstractAuthenticationToken> roleIdAuthorities() {
        return jwt -> {
            Object roleId = jwt.getClaims().get("roleId");
            List<GrantedAuthority> authorities = roleId == null
                    ? List.of()
                    : List.of(new SimpleGrantedAuthority("ROLE_" + roleId));
            return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
        };
    }

    static void requireStrongSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("jwt.secret (env JWT_SECRET) is not set. EvyaSense validates the "
                    + "platform's operator tokens and refuses to start without the shared secret.");
        }
        String trimmed = secret.trim();
        if (trimmed.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("jwt.secret must be at least " + MIN_SECRET_LENGTH
                    + " characters (got " + trimmed.length() + ").");
        }
        if (FORBIDDEN_SECRETS.contains(trimmed)) {
            throw new IllegalStateException("jwt.secret matches a known weak or default value.");
        }
    }
}
