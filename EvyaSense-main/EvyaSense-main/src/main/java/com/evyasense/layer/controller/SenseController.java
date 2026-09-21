package com.evyasense.layer.controller;
import java.io.BufferedReader;


import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.URL;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.evyasense.layer.canonical.ChargerIds;
import com.evyasense.layer.kafka.SenseStore;
import com.evyasense.layer.model.OcppEnvelope;
import com.evyasense.layer.model.SenseEvent;



@RestController
@RequestMapping("/api/sense")
public class SenseController {

    private static final String TOPIC = "evya-sense-topic";

    // SENSE-003: the consumer attributes every line by its Kafka key, so ingestion must supply one.
    // CSMS station logs are named <yyyy-MM-dd>_<OCPPId>.txt, which lets the charger be derived from the
    // file name when it is not passed explicitly.
    private static final Pattern STATION_LOG_NAME = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}_(.+)\\.txt$");
    static final String CHARGER_ID_REQUIRED = "chargerId is required: pass ?chargerId=<OCPPId>, "
            + "or name the file <yyyy-MM-dd>_<OCPPId>.txt as the CSMS does";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final SenseStore store;

    public SenseController(KafkaTemplate<String, String> kafkaTemplate,
                           SenseStore store) {
        this.kafkaTemplate = kafkaTemplate;
        this.store = store;
    }

    // 1️⃣ Upload file → Kafka
    @PostMapping("/ingest/upload")
    public ResponseEntity<String> upload(@RequestParam MultipartFile file,
                                         @RequestParam(required = false) String chargerId) {

        String charger = resolveChargerId(chargerId, file.getOriginalFilename());
        if (charger == null) {
            return ResponseEntity.badRequest().body(CHARGER_ID_REQUIRED);
        }

        // 🔥 Clear old data before new file ingestion
        store.clear();

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {

            String line;
            while ((line = br.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    kafkaTemplate.send(TOPIC, charger, line.trim());
                }
            }

            return ResponseEntity.ok("Uploaded successfully");

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // 2️⃣ URL → Kafka
    // Fix 9: validate URL to prevent SSRF — only http/https, no private/loopback IPs
    @GetMapping("/ingest/url")
    public ResponseEntity<String> ingestUrl(@RequestParam String url,
                                            @RequestParam(required = false) String chargerId) {
        try {
            validateUrl(url);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rejected: " + e.getMessage());
        }

        String charger = resolveChargerId(chargerId, lastPathSegment(url));
        if (charger == null) {
            return ResponseEntity.badRequest().body(CHARGER_ID_REQUIRED);
        }

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(new URL(url).openStream()))) {

            String line;
            while ((line = br.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    kafkaTemplate.send(TOPIC, charger, line.trim());
                }
            }
            return ResponseEntity.ok("URL ingested");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Rejects non-http(s) schemes and private/loopback/link-local IP ranges.
     * Covers: 10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, [::1].
     */
    private void validateUrl(String rawUrl) {
        URL parsed;
        try {
            parsed = new URL(rawUrl);
        } catch (Exception e) {
            throw new IllegalArgumentException("Malformed URL");
        }

        String scheme = parsed.getProtocol();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Only http and https schemes are allowed");
        }

        InetAddress addr;
        try {
            addr = InetAddress.getByName(parsed.getHost());
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot resolve host: " + parsed.getHost());
        }

        if (addr.isLoopbackAddress() || addr.isSiteLocalAddress()
                || addr.isLinkLocalAddress() || addr.isAnyLocalAddress()) {
            throw new IllegalArgumentException("Requests to private/internal addresses are not allowed");
        }
    }

    /**
     * The charger for an ingestion: the explicit parameter if given, otherwise derived from a CSMS
     * station-log file name. Returns null when neither yields a safe id.
     */
    static String resolveChargerId(String explicit, String fileName) {
        String candidate = explicit == null || explicit.isBlank() ? null : explicit.trim();

        if (candidate == null && fileName != null) {
            String name = fileName.substring(Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\')) + 1);
            Matcher m = STATION_LOG_NAME.matcher(name);
            if (m.matches()) {
                candidate = m.group(1);
            }
        }

        // Same rule as the Kafka path: the id becomes a Redis key, a DB value and log text.
        return ChargerIds.isValid(candidate) ? candidate : null;
    }

    private static String lastPathSegment(String rawUrl) {
        try {
            String path = new URL(rawUrl).getPath();
            return path.substring(path.lastIndexOf('/') + 1);
        } catch (Exception e) {
            return null;
        }
    }

    // 3️⃣ Read mind data
    @GetMapping("/read")
    public List<SenseEvent> read() {
        return store.getAll();
    }
}
