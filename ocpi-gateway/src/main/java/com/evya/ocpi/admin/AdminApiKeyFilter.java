package com.evya.ocpi.admin;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Guards the operator API. Fails closed: if no key is configured, /internal is refused outright rather
 * than left open, because an unguarded party-administration endpoint mints roaming credentials.
 *
 * <p>This is a stopgap. The operator API should move behind the platform's own operator authentication
 * and audit log once the portal integrates it.
 */
@Component
public class AdminApiKeyFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AdminApiKeyFilter.class);
    private static final String HEADER = "X-Api-Key";

    private final String apiKey;

    public AdminApiKeyFilter(@Value("${ocpi.admin.api-key:}") String apiKey) {
        this.apiKey = apiKey;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        if (apiKey == null || apiKey.isBlank()) {
            log.error("Refused an operator API call: ocpi.admin.api-key (OCPI_ADMIN_API_KEY) is not set");
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                    "Operator API is not configured");
            return;
        }

        String presented = request.getHeader(HEADER);
        if (presented == null || !constantTimeEquals(presented, apiKey)) {
            log.warn("Refused an operator API call to {} with a bad or missing key",
                    request.getRequestURI());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean constantTimeEquals(String presented, String expected) {
        return MessageDigest.isEqual(
                presented.getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8));
    }
}
