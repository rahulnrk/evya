package com.evyasense.layer.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Reassembles OCPP frames that a CSMS log spreads over several lines.
 *
 * <p>Buffering state is held <b>per charger</b>. The previous implementation kept one StringBuilder and
 * one bracket counter as fields on the singleton consumer, so two chargers logging at the same time
 * interleaved into a single buffer and produced frames that belonged to neither. With the Kafka key set
 * to the OCPPId, each charger's lines arrive in order on one partition, and each gets its own buffer.
 */
public class OcppFrameAssembler {

    private static final Logger log = LoggerFactory.getLogger(OcppFrameAssembler.class);

    private static final int MAX_CHARGERS = 2_000;
    private static final int MAX_FRAME_CHARS = 512 * 1024;

    private final Map<String, Frame> buffers = new LinkedHashMap<>(16, 0.75f, false) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Frame> eldest) {
            return size() > MAX_CHARGERS;
        }
    };

    /**
     * Feeds one log line for one charger.
     *
     * @return the complete OCPP frame once its brackets balance, otherwise empty
     */
    public synchronized Optional<CompletedFrame> accept(String chargerId, String line, LocalDateTime logTime) {
        int jsonStart = line.indexOf('[');
        boolean startsFrame = jsonStart != -1 && isOcppStart(line.substring(jsonStart));

        if (startsFrame) {
            Frame unfinished = buffers.get(chargerId);
            if (unfinished != null && unfinished.text.length() > 0) {
                // A new frame started before the previous one closed: the log is malformed, and the
                // unfinished frame is lost. Say so rather than dropping it silently.
                log.warn("Dropped an unfinished OCPP frame for charger {} ({} chars)",
                        chargerId, unfinished.text.length());
            }
            Frame frame = new Frame();
            frame.startedAt = logTime;
            buffers.put(chargerId, frame);
            return append(chargerId, frame, line.substring(jsonStart));
        }

        Frame open = buffers.get(chargerId);
        if (open == null || open.text.length() == 0) {
            return Optional.empty();
        }
        return append(chargerId, open, line.trim());
    }

    /** Drops any partial frame for a charger, e.g. after a parse failure. */
    public synchronized void reset(String chargerId) {
        buffers.remove(chargerId);
    }

    private Optional<CompletedFrame> append(String chargerId, Frame frame, String text) {
        frame.text.append(text);
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '[') {
                frame.depth++;
            } else if (c == ']') {
                frame.depth--;
            }
        }

        // A frame that never closes would otherwise grow without bound on a malformed log.
        if (frame.text.length() > MAX_FRAME_CHARS) {
            buffers.remove(chargerId);
            return Optional.empty();
        }

        if (frame.depth == 0) {
            String complete = frame.text.toString();
            buffers.remove(chargerId);
            return Optional.of(new CompletedFrame(complete, frame.startedAt));
        }
        return Optional.empty();
    }

    /** CALL (2), CALLRESULT (3) and CALLERROR (4) are the frames worth reassembling. */
    private boolean isOcppStart(String fromBracket) {
        return fromBracket.startsWith("[2,") || fromBracket.startsWith("[3,")
                || fromBracket.startsWith("[4,");
    }

    private static final class Frame {
        private final StringBuilder text = new StringBuilder();
        private int depth;
        private LocalDateTime startedAt;
    }

    /** A reassembled frame and the log time of the line that started it. */
    public record CompletedFrame(String json, LocalDateTime logTime) {
    }
}
