package com.evyasense.layer.ingest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.function.Consumer;

/**
 * Fetches a log file from a URL for ingestion (SEC-004).
 *
 * <p>The endpoint this serves makes the server issue a request to a caller-chosen URL, which is a
 * textbook SSRF entry point. The previous check resolved the host once and then used
 * {@code URL.openStream()}, which follows redirects, so a public URL that redirected to 169.254.169.254
 * or an internal host went straight through. Here redirects are never followed, every address the host
 * resolves to must be public, plain http is refused outside the lab, and the body is size-capped.
 *
 * <p>Known limit: the host is resolved here and again by the HTTP client, so DNS that changes between
 * the two (rebinding) is not closed by this class.
 */
@Component
public class IngestUrlFetcher {

    private final boolean allowPrivateTargets;
    private final boolean allowPlainHttp;
    private final long maxBytes;
    private final HttpClient http;

    public IngestUrlFetcher(
            @Value("${sense.ingest.allow-private-targets:false}") boolean allowPrivateTargets,
            @Value("${sense.ingest.allow-plain-http:false}") boolean allowPlainHttp,
            @Value("${sense.ingest.max-bytes:104857600}") long maxBytes) {
        this.allowPrivateTargets = allowPrivateTargets;
        this.allowPlainHttp = allowPlainHttp;
        this.maxBytes = maxBytes;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    /**
     * Fetches the URL and hands every non-blank line, trimmed, to {@code onLine}.
     *
     * @return the number of lines handed over
     * @throws IllegalArgumentException if the URL or the response is refused (caller answers 400)
     * @throws IOException if the source cannot be read
     */
    public int fetchLines(String rawUrl, Consumer<String> onLine) throws IOException, InterruptedException {
        URI uri = validate(rawUrl);

        HttpRequest request = HttpRequest.newBuilder(uri).GET().timeout(Duration.ofSeconds(60)).build();
        HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());

        int status = response.statusCode();
        if (status != 200) {
            response.body().close();
            throw new IllegalArgumentException(status >= 300 && status < 400
                    ? "redirects are not followed (HTTP " + status + ")"
                    : "the source answered HTTP " + status);
        }

        int lines = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new CappedInputStream(response.body(), maxBytes), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty()) {
                    onLine.accept(trimmed);
                    lines++;
                }
            }
        }
        return lines;
    }

    URI validate(String rawUrl) {
        URI uri;
        try {
            uri = URI.create(rawUrl.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("malformed URL");
        }

        String scheme = uri.getScheme();
        boolean https = "https".equalsIgnoreCase(scheme);
        if (!https && !(allowPlainHttp && "http".equalsIgnoreCase(scheme))) {
            throw new IllegalArgumentException("only https URLs are accepted");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IllegalArgumentException("URL has no host");
        }

        if (!allowPrivateTargets) {
            InetAddress[] addresses;
            try {
                addresses = InetAddress.getAllByName(uri.getHost());
            } catch (UnknownHostException e) {
                throw new IllegalArgumentException("host does not resolve");
            }
            for (InetAddress address : addresses) {
                if (address.isLoopbackAddress() || address.isAnyLocalAddress()
                        || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                        || address.isMulticastAddress() || isUniqueLocalIpv6(address)) {
                    throw new IllegalArgumentException("requests to private or internal addresses are not allowed");
                }
            }
        }
        return uri;
    }

    /** fc00::/7, the IPv6 equivalent of the private IPv4 ranges. */
    private static boolean isUniqueLocalIpv6(InetAddress address) {
        byte[] bytes = address.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xFE) == 0xFC;
    }

    /** Stops reading once the body exceeds the cap, so one URL cannot exhaust memory or the topic. */
    private static final class CappedInputStream extends FilterInputStream {
        private final long cap;
        private long count;

        CappedInputStream(InputStream in, long cap) {
            super(in);
            this.cap = cap;
        }

        @Override
        public int read() throws IOException {
            int b = super.read();
            if (b != -1) {
                advance(1);
            }
            return b;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            int n = super.read(buffer, offset, length);
            if (n > 0) {
                advance(n);
            }
            return n;
        }

        private void advance(long n) throws IOException {
            count += n;
            if (count > cap) {
                throw new IOException("source exceeds the " + cap + " byte limit");
            }
        }
    }
}
