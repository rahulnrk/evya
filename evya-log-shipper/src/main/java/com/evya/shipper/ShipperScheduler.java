package com.evya.shipper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ShipperScheduler {

    private static final Logger log = LoggerFactory.getLogger(ShipperScheduler.class);

    private final LogTailService tailer;

    public ShipperScheduler(LogTailService tailer) {
        this.tailer = tailer;
    }

    @Scheduled(fixedDelayString = "${shipper.poll-interval-ms:2000}")
    public void poll() {
        try {
            int published = tailer.poll();
            if (published > 0) {
                log.debug("Published {} log line(s)", published);
            }
        } catch (Exception e) {
            // A poll that throws must not kill the schedule, or the whole fleet stops being shipped.
            log.error("Log poll failed; retrying on the next tick", e);
        }
    }
}
