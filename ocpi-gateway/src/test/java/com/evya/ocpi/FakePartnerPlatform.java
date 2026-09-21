package com.evya.ocpi;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * A minimal OCPI peer for tests: serves a versions list and version details over loopback so the
 * handshake can be exercised end to end without a real partner.
 */
final class FakePartnerPlatform implements AutoCloseable {

    private final HttpServer server;
    private final List<String> seenAuthorization = new ArrayList<>();
    private boolean versionsBroken;

    FakePartnerPlatform() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/partner/versions", this::versions);
        server.createContext("/partner/2.2.1", this::versionDetails);
        server.setExecutor(null);
        server.start();
    }

    String versionsUrl() {
        return baseUrl() + "/partner/versions";
    }

    private String baseUrl() {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    List<String> seenAuthorization() {
        return seenAuthorization;
    }

    /** Makes the partner's own API fail, so the handshake cannot complete. */
    void breakVersions() {
        this.versionsBroken = true;
    }

    private void versions(HttpExchange exchange) throws IOException {
        seenAuthorization.add(exchange.getRequestHeaders().getFirst("Authorization"));
        if (versionsBroken) {
            respond(exchange, 500, "{\"status_code\":3000}");
            return;
        }
        respond(exchange, 200, """
                {"data":[{"version":"2.2.1","url":"%s/partner/2.2.1"}],
                 "status_code":1000,"status_message":"Success","timestamp":"2026-09-21T00:00:00Z"}
                """.formatted(baseUrl()));
    }

    private void versionDetails(HttpExchange exchange) throws IOException {
        seenAuthorization.add(exchange.getRequestHeaders().getFirst("Authorization"));
        respond(exchange, 200, """
                {"data":{"version":"2.2.1","endpoints":[
                   {"identifier":"credentials","role":"RECEIVER","url":"%s/partner/2.2.1/credentials"},
                   {"identifier":"cdrs","role":"RECEIVER","url":"%s/partner/2.2.1/cdrs"}]},
                 "status_code":1000,"status_message":"Success","timestamp":"2026-09-21T00:00:00Z"}
                """.formatted(baseUrl(), baseUrl()));
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    @Override
    public void close() {
        server.stop(0);
    }
}
