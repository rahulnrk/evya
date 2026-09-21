package com.evya.ocpi.security;

import com.evya.ocpi.api.OcpiResponse;
import com.evya.ocpi.api.OcpiStatus;
import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates every OCPI request against a stored token hash.
 *
 * <p>Two rules the replaced stub got wrong:
 * <ul>
 *   <li>The credentials endpoint is <b>not</b> exempt. It is the one endpoint that must check Token A -
 *       exempting it lets anyone register as a roaming partner.</li>
 *   <li>Tokens are matched by hash, so no raw token is ever read out of the database.</li>
 * </ul>
 *
 * <p>Handshake endpoints (versions, credentials) accept Token A or Token C; every module endpoint
 * requires a fully registered connection.
 */
@Component
public class OcpiAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(OcpiAuthFilter.class);
    private static final String SCHEME = "Token ";
    private static final Duration LAST_SEEN_THROTTLE = Duration.ofMinutes(1);

    private final PartnerConnectionRepository connections;
    private final TokenHasher hasher;
    private final ObjectMapper mapper;

    public OcpiAuthFilter(PartnerConnectionRepository connections, TokenHasher hasher,
                          ObjectMapper mapper) {
        this.connections = connections;
        this.hasher = hasher;
        this.mapper = mapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/ocpi/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(SCHEME)) {
            reject(response, "Missing or malformed Authorization header");
            return;
        }

        Optional<OcpiCaller> caller = resolve(header.substring(SCHEME.length()).trim());
        if (caller.isEmpty()) {
            reject(response, "Unknown or expired credentials token");
            return;
        }

        OcpiCaller authenticated = caller.get();
        if (!isHandshakeEndpoint(request) && authenticated.viaTokenA()) {
            reject(response, "Registration is not complete: this endpoint requires the token issued "
                    + "by the credentials handshake");
            return;
        }

        try {
            OcpiCallerContext.set(authenticated);
            touch(authenticated.connection());
            chain.doFilter(request, response);
        } finally {
            OcpiCallerContext.clear();
        }
    }

    /**
     * OCPI 2.2+ sends the token base64-encoded. Older and lenient partners send it raw, so both forms
     * are checked - each against the same stored hash, so accepting both weakens nothing.
     */
    private Optional<OcpiCaller> resolve(String presented) {
        if (presented.isEmpty()) {
            return Optional.empty();
        }
        for (String candidate : candidates(presented)) {
            String hash = hasher.hash(candidate);

            Optional<PartnerConnection> registered = connections.findByTokenCHash(hash);
            if (registered.isPresent() && usable(registered.get())) {
                return Optional.of(new OcpiCaller(registered.get(), false));
            }

            Optional<PartnerConnection> pending = connections.findByTokenAHash(hash);
            if (pending.isPresent() && pending.get().getStatus() == ConnectionStatus.PENDING
                    && pending.get().getParty().isActive()) {
                return Optional.of(new OcpiCaller(pending.get(), true));
            }
        }
        return Optional.empty();
    }

    private List<String> candidates(String presented) {
        List<String> candidates = new ArrayList<>(2);
        candidates.add(presented);
        try {
            String decoded = new String(Base64.getDecoder().decode(presented), StandardCharsets.UTF_8);
            if (!decoded.isEmpty() && decoded.chars().allMatch(c -> c >= 0x21 && c <= 0x7E)) {
                candidates.add(decoded);
            }
        } catch (IllegalArgumentException notBase64) {
            // The partner sent a raw token; the unmodified candidate already covers it.
        }
        return candidates;
    }

    private boolean usable(PartnerConnection connection) {
        if (connection.isUsable()) {
            return true;
        }
        log.warn("Refused a request on connection {} in status {}",
                connection.getId(), connection.getStatus());
        return false;
    }

    private boolean isHandshakeEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/ocpi/versions") || path.endsWith("/credentials");
    }

    /** Records liveness without a database write on every single request. */
    private void touch(PartnerConnection connection) {
        Instant lastSeen = connection.getLastSeenAt();
        if (lastSeen == null || Duration.between(lastSeen, Instant.now()).compareTo(LAST_SEEN_THROTTLE) > 0) {
            connection.setLastSeenAt(Instant.now());
            connections.save(connection);
        }
    }

    /**
     * One message for every authentication failure: which of "no such token", "wrong phase" or
     * "suspended" applies is exactly what an attacker probing tokens would want to learn.
     */
    private void reject(HttpServletResponse response, String reason) throws IOException {
        log.warn("OCPI request refused: {}", reason);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getWriter(),
                OcpiResponse.error(OcpiStatus.CLIENT_ERROR, "Invalid or missing credentials token"));
    }
}
