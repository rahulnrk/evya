package com.evya.shipper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Remembers how far each log file has been read.
 *
 * <p>This is what makes a restart neither replay lines nor lose them. The file is rewritten
 * atomically, so a crash mid-write leaves the previous checkpoint intact rather than a truncated one.
 */
public class OffsetStore {

    private static final Logger log = LoggerFactory.getLogger(OffsetStore.class);

    private final Path file;
    private final Map<String, Long> offsets = new ConcurrentHashMap<>();

    public OffsetStore(Path file) {
        this.file = file;
        load();
    }

    public boolean isKnown(String key) {
        return offsets.containsKey(key);
    }

    public long get(String key) {
        return offsets.getOrDefault(key, 0L);
    }

    public void put(String key, long offset) {
        offsets.put(key, offset);
    }

    private void load() {
        if (!Files.exists(file)) {
            return;
        }
        Properties properties = new Properties();
        try (InputStream in = Files.newInputStream(file)) {
            properties.load(in);
        } catch (IOException e) {
            // Starting from an empty checkpoint would silently replay or skip the whole backlog, so
            // this is loud rather than a shrug.
            log.error("Could not read the offset checkpoint at {}; refusing to start from scratch", file, e);
            throw new IllegalStateException("Unreadable offset checkpoint: " + file, e);
        }
        for (String name : properties.stringPropertyNames()) {
            try {
                offsets.put(name, Long.parseLong(properties.getProperty(name)));
            } catch (NumberFormatException e) {
                log.warn("Ignoring malformed offset for {}", name);
            }
        }
        log.info("Loaded {} file offset(s) from {}", offsets.size(), file);
    }

    public synchronized void save() {
        Properties properties = new Properties();
        offsets.forEach((key, value) -> properties.setProperty(key, Long.toString(value)));

        Path temp = file.resolveSibling(file.getFileName() + ".tmp");
        try {
            if (file.getParent() != null) {
                Files.createDirectories(file.getParent());
            }
            try (OutputStream out = Files.newOutputStream(temp)) {
                properties.store(out, "EVYA log shipper offsets - do not edit while running");
            }
            try {
                Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            // Losing a checkpoint means replaying on restart, which is noisy but not silent data loss.
            log.error("Could not write the offset checkpoint at {}", file, e);
        }
    }
}
