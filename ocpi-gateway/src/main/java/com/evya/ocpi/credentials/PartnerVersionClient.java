package com.evya.ocpi.credentials;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiStatus;
import com.evya.ocpi.versions.OcpiVersion;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Calls the partner's own OCPI interface with their Token B, to learn which modules they serve.
 *
 * <p>Redirects are not followed: a redirect is the classic way to turn a validated public URL into a
 * request against an internal host.
 */
@Component
public class PartnerVersionClient {

    private static final Logger log = LoggerFactory.getLogger(PartnerVersionClient.class);

    private final HttpClient http;
    private final ObjectMapper mapper;
    private final PartnerUrlValidator urlValidator;
    private final Duration readTimeout;

    public PartnerVersionClient(ObjectMapper mapper, PartnerUrlValidator urlValidator,
                                @Value("${ocpi.client.connect-timeout-ms:5000}") long connectTimeoutMs,
                                @Value("${ocpi.client.read-timeout-ms:15000}") long readTimeoutMs) {
        this.mapper = mapper;
        this.urlValidator = urlValidator;
        this.readTimeout = Duration.ofMillis(readTimeoutMs);
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    /**
     * Resolves the partner's version details for the version we speak and returns their endpoints.
     *
     * @throws OcpiException if the partner's API cannot be used, or serves no version we support
     */
    public PartnerInterface discover(String versionsUrl, String partnerToken) {
        URI versionsUri = urlValidator.validate(versionsUrl);

        JsonNode versions = get(versionsUri, partnerToken).path("data");
        if (!versions.isArray() || versions.isEmpty()) {
            throw new OcpiException(OcpiStatus.UNABLE_TO_USE_CLIENT_API,
                    "The versions endpoint returned no versions");
        }

        String detailsUrl = null;
        for (JsonNode version : versions) {
            if (OcpiVersion.V2_2_1.equals(version.path("version").asText())) {
                detailsUrl = version.path("url").asText(null);
                break;
            }
        }
        if (detailsUrl == null) {
            throw new OcpiException(OcpiStatus.UNSUPPORTED_VERSION,
                    "The partner does not serve OCPI " + OcpiVersion.V2_2_1);
        }

        JsonNode details = get(urlValidator.validate(detailsUrl), partnerToken).path("data");
        JsonNode endpoints = details.path("endpoints");
        if (!endpoints.isArray() || endpoints.isEmpty()) {
            throw new OcpiException(OcpiStatus.NO_MATCHING_ENDPOINTS,
                    "The partner published no endpoints for OCPI " + OcpiVersion.V2_2_1);
        }

        List<PartnerModule> modules = new ArrayList<>();
        for (JsonNode endpoint : endpoints) {
            String identifier = endpoint.path("identifier").asText(null);
            String url = endpoint.path("url").asText(null);
            String role = endpoint.path("role").asText("RECEIVER");
            if (identifier != null && url != null) {
                modules.add(new PartnerModule(identifier, role, url));
            }
        }
        return new PartnerInterface(OcpiVersion.V2_2_1, modules);
    }

    private JsonNode get(URI uri, String partnerToken) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .GET()
                .timeout(readTimeout)
                .header("Authorization", "Token " + base64(partnerToken))
                .header("Accept", "application/json")
                .build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Partner endpoint {} answered HTTP {}", uri, response.statusCode());
                throw new OcpiException(OcpiStatus.UNABLE_TO_USE_CLIENT_API,
                        "The partner's API answered HTTP " + response.statusCode());
            }
            return mapper.readTree(response.body());
        } catch (IOException e) {
            log.warn("Could not reach partner endpoint {}: {}", uri, e.toString());
            throw new OcpiException(OcpiStatus.UNABLE_TO_USE_CLIENT_API,
                    "The partner's API could not be reached");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new OcpiException(OcpiStatus.UNABLE_TO_USE_CLIENT_API,
                    "Interrupted while calling the partner's API");
        }
    }

    private String base64(String token) {
        return Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    /** What the partner serves at the agreed version. */
    public record PartnerInterface(String version, List<PartnerModule> modules) {
    }

    public record PartnerModule(String identifier, String role, String url) {
    }
}
