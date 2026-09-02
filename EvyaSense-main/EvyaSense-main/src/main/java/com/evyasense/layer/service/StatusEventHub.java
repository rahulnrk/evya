package com.evyasense.layer.service;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SCALE-3: fan-out connector status changes to SSE subscribers.
 * Subscriptions are keyed by the set of chargerRefs the client cares about.
 */
@Service
public class StatusEventHub {

    private static final Logger log = LoggerFactory.getLogger(StatusEventHub.class);
    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L; // 30 min

    private final CopyOnWriteArrayList<Subscription> subscriptions = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(Set<String> chargerRefs) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        Subscription sub = new Subscription(emitter, ConcurrentHashMap.newKeySet());
        if (chargerRefs != null) {
            sub.chargerRefs.addAll(chargerRefs);
        }
        subscriptions.add(sub);

        emitter.onCompletion(() -> subscriptions.remove(sub));
        emitter.onTimeout(() -> {
            subscriptions.remove(sub);
            emitter.complete();
        });
        emitter.onError(e -> subscriptions.remove(sub));

        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of(
                    "ok", true,
                    "watching", sub.chargerRefs.size())));
        } catch (IOException e) {
            subscriptions.remove(sub);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    /** Called from DataProcessorService when a connector status is written to Redis. */
    public void publish(String chargerRef, String connectorId, String status) {
        if (chargerRef == null) return;
        Map<String, Object> payload = Map.of(
                "chargerRef", chargerRef,
                "connectorId", connectorId != null ? connectorId : "",
                "status", status != null ? status : "");

        for (Subscription sub : subscriptions) {
            if (sub.chargerRefs.isEmpty() || !sub.chargerRefs.contains(chargerRef)) {
                continue;
            }
            try {
                sub.emitter.send(SseEmitter.event().name("status").data(payload));
            } catch (Exception e) {
                log.debug("SSE client gone: {}", e.getMessage());
                subscriptions.remove(sub);
                try { sub.emitter.complete(); } catch (Exception ignore) {}
            }
        }
    }

    private static final class Subscription {
        final SseEmitter emitter;
        final Set<String> chargerRefs;

        Subscription(SseEmitter emitter, Set<String> chargerRefs) {
            this.emitter = emitter;
            this.chargerRefs = chargerRefs;
        }
    }
}
