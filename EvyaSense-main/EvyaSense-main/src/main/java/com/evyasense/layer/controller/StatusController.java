package com.evyasense.layer.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.evyasense.layer.service.LiveStatusService;
import com.evyasense.layer.service.StatusEventHub;

import lombok.RequiredArgsConstructor;

/**
 * SCALE-3 hot plane — live charger/connector status from Redis.
 * Public/read-only discovery data (consistent with SEC-9 map posture).
 *
 * <pre>
 * GET /api/status?ids=CP1,CP2
 * GET /api/status/stream?ids=CP1,CP2  (SSE event: status)
 * </pre>
 */
@RestController
@RequestMapping("/api/status")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatusController {

    private final LiveStatusService liveStatusService;
    private final StatusEventHub statusEventHub;

    /**
     * Batch snapshot for the given chargerRefs (OCPP ids). Cap = {@link LiveStatusService#MAX_IDS}.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatus(
            @RequestParam(name = "ids", required = false) String ids) {
        List<String> parsed = LiveStatusService.parseIds(ids);
        List<Map<String, Object>> chargers = liveStatusService.statusForIds(ids);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "count", chargers.size(),
                "capped", parsed.size() >= LiveStatusService.MAX_IDS,
                "chargers", chargers));
    }

    /**
     * SSE stream of status deltas for the requested chargerRefs.
     * Events: {@code connected}, {@code status} with
     * {@code { chargerRef, connectorId, status }}.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestParam(name = "ids", required = false) String ids) {
        Set<String> refs = new HashSet<>(LiveStatusService.parseIds(ids));
        return statusEventHub.subscribe(refs);
    }
}
