package com.evyasense.layer.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Drives the time-based half of anomaly detection (SENSE-004).
 *
 * <p>Detecting that something stopped happening cannot be done from the ingestion path, because a
 * charger that has stopped talking produces nothing to react to. This runs on a fixed tick instead.
 *
 * <p>The clock matters: CSMS log lines carry an IST wall-clock timestamp
 * ("Mon Sep 21 00:00:04 IST 2026") which is parsed into a zone-less LocalDateTime. "Now" must be
 * produced in that same zone, or on a UTC host every elapsed-time comparison is wrong by the offset.
 * {@code sense.log-zone} exists so this follows the CSMS rather than the server it happens to run on.
 */
@Component
public class SenseHealthScheduler {

    private static final Logger log = LoggerFactory.getLogger(SenseHealthScheduler.class);

    private final AnomalyDetectionService anomalyDetectionService;
    private final ZoneId logZone;
    private final long silenceThresholdSeconds;

    public SenseHealthScheduler(
            AnomalyDetectionService anomalyDetectionService,
            @Value("${sense.log-zone:Asia/Kolkata}") String logZone,
            @Value("${sense.silence-threshold-seconds:300}") long silenceThresholdSeconds) {
        this.anomalyDetectionService = anomalyDetectionService;
        this.logZone = ZoneId.of(logZone);
        this.silenceThresholdSeconds = silenceThresholdSeconds;
    }

    @Scheduled(fixedDelayString = "${sense.sweep-interval-ms:30000}")
    public void sweep() {
        LocalDateTime now = LocalDateTime.now(logZone);
        int tracked = anomalyDetectionService.trackedChargers();
        try {
            anomalyDetectionService.sweep(now, silenceThresholdSeconds);
            log.debug("Health sweep evaluated {} charger(s) at {}", tracked, now);
        } catch (Exception e) {
            // A sweep that dies takes every later sweep with it, so the whole fleet would go unwatched.
            log.error("Health sweep failed over {} charger(s); continuing on the next tick", tracked, e);
        }
    }
}
