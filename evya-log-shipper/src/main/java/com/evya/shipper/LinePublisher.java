package com.evya.shipper;

/**
 * Where a log line goes. An interface so the tailer can be tested without a broker, and so the
 * destination can change without touching the tailing logic.
 */
public interface LinePublisher {

    /**
     * @param chargerId the OCPPId, used as the partition key so one charger's lines stay ordered
     * @param line      one complete log line, newline stripped
     * @param source    the file it came from, for tracing
     */
    void publish(String chargerId, String line, String source);
}
