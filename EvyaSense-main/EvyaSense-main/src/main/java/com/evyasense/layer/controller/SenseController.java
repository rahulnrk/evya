package com.evyasense.layer.controller;
import java.io.BufferedReader;


import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
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
import com.evyasense.layer.ingest.IngestUrlFetcher;
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
    private final IngestUrlFetcher urlFetcher;

    public SenseController(KafkaTemplate<String, String> kafkaTemplate,
                           SenseStore store,
                           IngestUrlFetcher urlFetcher) {
        this.kafkaTemplate = kafkaTemplate;
        this.store = store;
        this.urlFetcher = urlFetcher;
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

    // 2  URL -> Kafka
    // SEC-004: fetched by IngestUrlFetcher - redirects never followed, every resolved address checked,
    // https only outside the lab, body size-capped. Internal error text is not echoed to the caller.
    @GetMapping("/ingest/url")
    public ResponseEntity<String> ingestUrl(@RequestParam String url,
                                            @RequestParam(required = false) String chargerId) {

        String charger = resolveChargerId(chargerId, lastPathSegment(url));
        if (charger == null) {
            return ResponseEntity.badRequest().body(CHARGER_ID_REQUIRED);
        }

        try {
            int lines = urlFetcher.fetchLines(url, line -> kafkaTemplate.send(TOPIC, charger, line));
            return ResponseEntity.ok("URL ingested (" + lines + " lines)");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rejected: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(503).body("Interrupted while fetching the URL");
        } catch (Exception e) {
            System.err.println("URL ingest failed for charger " + charger + ": " + e);
            return ResponseEntity.status(502).body("Could not fetch the URL");
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
            String path = URI.create(rawUrl.trim()).getPath();
            return path == null ? null : path.substring(path.lastIndexOf('/') + 1);
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
