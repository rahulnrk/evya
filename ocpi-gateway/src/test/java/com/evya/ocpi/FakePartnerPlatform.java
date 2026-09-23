package com.evya.ocpi;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * A minimal OCPI peer for tests: serves a versions list and version details over loopback so the
 * handshake can be exercised end to end without a real partner.
 */
final class FakePartnerPlatform implements AutoCloseable {

    private final HttpServer server;
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final List<String> seenAuthorization = new CopyOnWriteArrayList<>();
    private volatile boolean versionsBroken;
    private volatile CyclicBarrier versionsBarrier;
    private volatile String extraModuleUrl;
    private volatile String receivedCredentialsBody;
    private volatile boolean credentialsReturnsBadBody;

    FakePartnerPlatform() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/partner/versions", this::versions);
        server.createContext("/partner/2.2.1", this::versionDetails);
        server.createContext("/partner/2.2.1/credentials", this::credentials);
        // More than one thread: concurrency tests hold several requests open at once.
        server.setExecutor(executor);
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

    /** Holds each versions request until {@code parties} of them are in flight together. */
    void holdVersionsUntil(int parties) {
        this.versionsBarrier = new CyclicBarrier(parties);
    }

    /** Publishes an extra "locations" endpoint at the given URL. */
    void publishModuleUrl(String url) {
        this.extraModuleUrl = url;
    }

    /** What we received at POST /credentials, or null if it was never called. */
    String receivedCredentialsBody() {
        return receivedCredentialsBody;
    }

    /** Make the credentials endpoint answer with a token-less body, to test our validation. */
    void credentialsReturnsBadBody() {
        this.credentialsReturnsBadBody = true;
    }

    /**
     * The partner side of a partner-initiated handshake: receives EVYA's credentials POST (authenticated
     * with the Token A this partner issued) and returns the partner's own credentials object.
     */
    private void credentials(HttpExchange exchange) throws IOException {
        seenAuthorization.add(exchange.getRequestHeaders().getFirst("Authorization"));
        try (InputStream in = exchange.getRequestBody()) {
            receivedCredentialsBody = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        if (credentialsReturnsBadBody) {
            respond(exchange, 200, """
                    {"data":{"url":"%s/partner/versions","roles":[]},
                     "status_code":1000,"status_message":"Success","timestamp":"2026-09-23T00:00:00Z"}
                    """.formatted(baseUrl()));
            return;
        }
        respond(exchange, 200, """
                {"data":{"token":"partner-issued-token-for-evya","url":"%s/partner/versions",
                   "roles":[{"role":"CPO","party_id":"HUB","country_code":"NL",
                             "business_details":{"name":"Hub Operator"}}]},
                 "status_code":1000,"status_message":"Success","timestamp":"2026-09-23T00:00:00Z"}
                """.formatted(baseUrl()));
    }

    private void versions(HttpExchange exchange) throws IOException {
        seenAuthorization.add(exchange.getRequestHeaders().getFirst("Authorization"));
        CyclicBarrier barrier = versionsBarrier;
        if (barrier != null) {
            try {
                barrier.await(10, TimeUnit.SECONDS);
            } catch (Exception timedOutOrBroken) {
                // Let the request continue; the test's own assertions report what happened.
            }
        }
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
        String extra = extraModuleUrl == null ? ""
                : ",{\"identifier\":\"locations\",\"role\":\"RECEIVER\",\"url\":\"" + extraModuleUrl + "\"}";
        respond(exchange, 200, """
                {"data":{"version":"2.2.1","endpoints":[
                   {"identifier":"credentials","role":"RECEIVER","url":"%s/partner/2.2.1/credentials"},
                   {"identifier":"cdrs","role":"RECEIVER","url":"%s/partner/2.2.1/cdrs"}%s]},
                 "status_code":1000,"status_message":"Success","timestamp":"2026-09-21T00:00:00Z"}
                """.formatted(baseUrl(), baseUrl(), extra));
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
        executor.shutdownNow();
    }
}
