package com.evyasense.layer.kafka;



import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;

import com.evyasense.layer.model.SenseEvent;



@Component
public class SenseStore {

    // Fix 5: cap in-memory event history to prevent unbounded heap growth
    private static final int MAX_EVENTS = 50_000;
    private static final int TRIM_BATCH = 1_000;

    private final List<SenseEvent> events = new CopyOnWriteArrayList<>();
    private final Set<String> dedupIndex = ConcurrentHashMap.newKeySet();

    // Actions that should NEVER be deduplicated
    private static final Set<String> NO_DEDUP_ACTIONS = Set.of(
            "MeterValues",
            "Heartbeat",
            "StatusNotification",
            "BootNotification"
    );

    public void add(SenseEvent e) {

        // ✅ Skip dedup based on rules
        if (skipDedup(e)) {
            events.add(e);
            trimIfNeeded();
            return;
        }

        String key = buildKey(e);

        // ❌ Duplicate found → ignore
        if (!dedupIndex.add(key)) {
            return;
        }

        events.add(e);
        trimIfNeeded();
    }

    // Fix 5: evict oldest events when the list exceeds MAX_EVENTS
    private void trimIfNeeded() {
        if (events.size() > MAX_EVENTS) {
            List<SenseEvent> toRemove = events.subList(0, TRIM_BATCH);
            toRemove.forEach(events::remove);
        }
    }

    /**
     * Dedup rules:
     * - Always keep MeterValues, Heartbeat, StatusNotification, BootNotification
     * - Keep OCPP_RESPONSE only for above actions
     * - Dedup everything else
     */
    private boolean skipDedup(SenseEvent e) {

        String action = e.getAction();
        String type = e.getEventType();

        // Always allow streaming-type events
        if (NO_DEDUP_ACTIONS.contains(action)) {
            return true;
        }

        // Allow responses ONLY for above actions
        if ("OCPP_RESPONSE".equals(type)
                && NO_DEDUP_ACTIONS.contains(action)) {
            return true;
        }

        return false;
    }

    private String buildKey(SenseEvent e) {
        return String.join("|",
                safe(e.getEventType()),
                safe(e.getAction()),
                safe(e.getMessageId())
        );
    }

    private String safe(String v) {
        return v == null ? "NULL" : v;
    }

    public List<SenseEvent> getAll() {
        return events.stream()
                .sorted(Comparator.comparing(SenseEvent::getLogTime))
                .toList();
    }

    public void clear() {
        events.clear();
        dedupIndex.clear();
    }
}
