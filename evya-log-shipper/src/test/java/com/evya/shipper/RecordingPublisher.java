package com.evya.shipper;

import java.util.ArrayList;
import java.util.List;

/** Captures what the tailer would send, so the tailing logic can be tested without a broker. */
class RecordingPublisher implements LinePublisher {

    record Published(String chargerId, String line, String source) {
    }

    final List<Published> sent = new ArrayList<>();

    @Override
    public void publish(String chargerId, String line, String source) {
        sent.add(new Published(chargerId, line, source));
    }

    List<String> linesFor(String chargerId) {
        return sent.stream().filter(p -> p.chargerId().equals(chargerId)).map(Published::line).toList();
    }

    void clear() {
        sent.clear();
    }
}
