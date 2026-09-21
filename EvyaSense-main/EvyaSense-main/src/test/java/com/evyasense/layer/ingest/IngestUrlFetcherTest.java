package com.evyasense.layer.ingest;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * SEC-004: URL ingest made the server fetch a caller-chosen URL. The old check resolved the host once
 * and then followed redirects, so a public URL redirecting inward went straight through.
 */
class IngestUrlFetcherTest {

    private final IngestUrlFetcher strict = new IngestUrlFetcher(false, false, 1_000_000);
    private HttpServer server;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/log.txt", exchange -> respond(exchange, 200, "a\n\n  b  \n\n"));
        server.createContext("/redirect", exchange -> {
            exchange.getResponseHeaders().add("Location", "http://169.254.169.254/latest/meta-data");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });
        server.createContext("/big", exchange -> respond(exchange, 200, "x".repeat(100)));
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    private static void respond(com.sun.net.httpserver.HttpExchange exchange, int status, String body)
            throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private String url(String path) {
        return "http://127.0.0.1:" + server.getAddress().getPort() + path;
    }

    @Test
    @DisplayName("Plain http and internal targets are refused outside the lab")
    void internalTargetsAreRefused() {
        assertThatThrownBy(() -> strict.validate("http://93.184.216.34/log.txt"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("https");
        for (String target : List.of("https://127.0.0.1/x", "https://10.0.0.5/x",
                "https://169.254.169.254/latest", "https://[::1]/x", "https://[fd00::1]/x")) {
            assertThatThrownBy(() -> strict.validate(target))
                    .as(target)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("private or internal");
        }
    }

    @Test
    @DisplayName("Redirects are never followed")
    void redirectsAreRefused() {
        IngestUrlFetcher lab = new IngestUrlFetcher(true, true, 1_000_000);
        List<String> lines = new ArrayList<>();

        assertThatThrownBy(() -> lab.fetchLines(url("/redirect"), lines::add))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("redirects are not followed");
        assertThat(lines).isEmpty();
    }

    @Test
    @DisplayName("Lines are trimmed and blank lines skipped")
    void linesAreRead() throws Exception {
        IngestUrlFetcher lab = new IngestUrlFetcher(true, true, 1_000_000);
        List<String> lines = new ArrayList<>();

        assertThat(lab.fetchLines(url("/log.txt"), lines::add)).isEqualTo(2);
        assertThat(lines).containsExactly("a", "b");
    }

    @Test
    @DisplayName("A body over the size cap is refused")
    void bodyIsCapped() {
        IngestUrlFetcher lab = new IngestUrlFetcher(true, true, 16);

        assertThatThrownBy(() -> lab.fetchLines(url("/big"), line -> { }))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("limit");
    }
}
