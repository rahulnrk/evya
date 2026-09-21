package com.evya.shipper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Tails the CSMS station logs and publishes each complete line to Kafka, keyed by OCPPId.
 *
 * <p>The charger identity is the whole point. A CSMS log line is just
 * {@code <timestamp>\tReceived Message : [2,"<id>","Heartbeat",{}]} - the station appears only in the
 * directory name. Attaching it as the Kafka key is what lets EvyaSense attribute an event to the right
 * charger instead of guessing from the most recent connection (SENSE-003).
 *
 * <p>Only complete lines are published: a partial trailing line is left for the next poll, so a line
 * being written as we read is never shipped in halves.
 */
public class LogTailService {

    private static final Logger log = LoggerFactory.getLogger(LogTailService.class);
    private static final byte NEWLINE = (byte) '\n';
    private static final int SCAN_CHUNK = 64 * 1024;

    /**
     * The directory name becomes a Kafka key, then a Redis key and log text in EvyaSense. Anything outside
     * this set (control characters, whitespace, glob characters) is refused rather than shipped.
     */
    private static final Pattern SAFE_CHARGER_ID = Pattern.compile("^[A-Za-z0-9._:-]{1,64}$");

    private final ShipperProperties properties;
    private final OffsetStore offsets;
    private final LinePublisher publisher;
    private final Set<String> reportedUnsafe = ConcurrentHashMap.newKeySet();

    public LogTailService(ShipperProperties properties, OffsetStore offsets, LinePublisher publisher) {
        this.properties = properties;
        this.offsets = offsets;
        this.publisher = publisher;
    }

    /** One pass over every charger directory. Returns the number of lines published. */
    public int poll() {
        Path root = Paths.get(properties.getRoot());
        if (!Files.isDirectory(root)) {
            log.warn("Station log root {} does not exist yet", root);
            return 0;
        }

        int published = 0;
        try (DirectoryStream<Path> chargers = Files.newDirectoryStream(root)) {
            for (Path chargerDir : chargers) {
                if (!Files.isDirectory(chargerDir)) {
                    continue;
                }
                String chargerId = chargerDir.getFileName().toString();
                if (!SAFE_CHARGER_ID.matcher(chargerId).matches()) {
                    if (reportedUnsafe.add(chargerId)) {
                        log.warn("Skipping station log directory with an unsafe name: {}", printable(chargerId));
                    }
                    continue;
                }
                published += shipCharger(chargerId, chargerDir);
            }
        } catch (IOException e) {
            log.error("Could not list station log directories under {}", root, e);
        }

        if (published > 0) {
            offsets.save();
        }
        return published;
    }

    private int shipCharger(String chargerId, Path chargerDir) {
        List<Path> files = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(chargerDir, "*.txt")) {
            for (Path file : stream) {
                if (Files.isRegularFile(file)) {
                    files.add(file);
                }
            }
        } catch (IOException e) {
            log.error("Could not list logs for charger {}", chargerId, e);
            return 0;
        }

        // Date-stamped names sort chronologically, so yesterday's tail ships before today's head.
        Collections.sort(files);

        int published = 0;
        for (Path file : files) {
            published += shipFile(chargerId, file);
        }
        return published;
    }

    private int shipFile(String chargerId, Path file) {
        String key = file.toAbsolutePath().toString();
        try {
            long size = Files.size(file);
            long offset = offsets.get(key);

            if (!offsets.isKnown(key)) {
                if (properties.isStartAtEnd()) {
                    // Do not replay a backlog the first time a file is seen - but start at a line boundary,
                    // or the rest of a line being written right now would be shipped as a fragment.
                    long start = lastLineBoundary(file, size);
                    offsets.put(key, start);
                    offsets.save();
                    log.info("Tracking {} from byte {} of {}", file.getFileName(), start, size);
                    return 0;
                }
                offset = 0;
            }

            if (offset > size) {
                // The file was rotated or truncated under us; start over rather than seek past the end.
                log.info("{} shrank from {} to {} bytes; restarting from the beginning",
                        file.getFileName(), offset, size);
                offset = 0;
            }
            if (offset == size) {
                return 0;
            }

            return readFrom(chargerId, file, key, offset, size);

        } catch (IOException e) {
            log.error("Could not read {}", file, e);
            return 0;
        }
    }

    private int readFrom(String chargerId, Path file, String key, long offset, long size)
            throws IOException {

        int toRead = (int) Math.min(size - offset, properties.getMaxBytesPerPoll());
        byte[] buffer = new byte[toRead];

        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "r")) {
            raf.seek(offset);
            raf.readFully(buffer);
        }

        int lastNewline = -1;
        for (int i = buffer.length - 1; i >= 0; i--) {
            if (buffer[i] == NEWLINE) {
                lastNewline = i;
                break;
            }
        }

        if (lastNewline < 0) {
            if (toRead >= properties.getMaxBytesPerPoll()) {
                // One line is longer than the read budget. Drop that whole line - never a piece of it -
                // by finding where it ends. If it has not ended yet, wait; the offset stays on a boundary.
                long lineEnd = findNewline(file, offset + toRead, size);
                if (lineEnd >= 0) {
                    log.warn("Skipped a {}-byte line in {} (over the {}-byte limit)",
                            lineEnd + 1 - offset, file.getFileName(), properties.getMaxBytesPerPoll());
                    offsets.put(key, lineEnd + 1);
                }
            }
            return 0;
        }

        int consumed = lastNewline + 1;
        String text = new String(buffer, 0, consumed, StandardCharsets.UTF_8);

        int published = 0;
        for (String line : text.split("\n", -1)) {
            String cleaned = line.endsWith("\r") ? line.substring(0, line.length() - 1) : line;
            if (!cleaned.isBlank()) {
                publisher.publish(chargerId, cleaned, file.getFileName().toString());
                published++;
            }
        }

        offsets.put(key, offset + consumed);
        return published;
    }

    /** Absolute position of the first newline at or after {@code from}, or -1 if there is none yet. */
    private long findNewline(Path file, long from, long size) throws IOException {
        byte[] chunk = new byte[SCAN_CHUNK];
        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "r")) {
            long position = from;
            while (position < size) {
                int n = (int) Math.min(chunk.length, size - position);
                raf.seek(position);
                raf.readFully(chunk, 0, n);
                for (int i = 0; i < n; i++) {
                    if (chunk[i] == NEWLINE) {
                        return position + i;
                    }
                }
                position += n;
            }
        }
        return -1;
    }

    /** Position just after the last newline in the first {@code size} bytes, or 0 if there is none. */
    private long lastLineBoundary(Path file, long size) throws IOException {
        byte[] chunk = new byte[SCAN_CHUNK];
        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "r")) {
            long end = size;
            while (end > 0) {
                int n = (int) Math.min(chunk.length, end);
                long start = end - n;
                raf.seek(start);
                raf.readFully(chunk, 0, n);
                for (int i = n - 1; i >= 0; i--) {
                    if (chunk[i] == NEWLINE) {
                        return start + i + 1;
                    }
                }
                end = start;
            }
        }
        return 0;
    }

    private static String printable(String value) {
        StringBuilder out = new StringBuilder(value.length());
        value.chars().forEach(c -> out.append(c >= 0x20 && c < 0x7f ? (char) c : '?'));
        return out.toString();
    }
}
