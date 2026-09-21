package com.evya.shipper;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "shipper")
public class ShipperProperties {

    /**
     * Root of the CSMS station logs. Each immediate subdirectory is one charger and its name is the
     * OCPPId, which becomes the Kafka key - this is the charger identity the log lines themselves
     * do not carry.
     */
    private String root = "/home/ubuntu/logs/stationLogs";

    /** Topic EvyaSense consumes. */
    private String topic = "evya-sense-topic";

    /** Where read offsets are checkpointed so a restart neither repeats nor skips lines. */
    private String stateFile = "shipper-state.properties";

    /**
     * On first sight of a file, start at its end instead of replaying history. The safe default for
     * production; set false to backfill an existing log directory.
     */
    private boolean startAtEnd = true;

    /** Upper bound on bytes read per file per poll, so one large file cannot starve the others. */
    private int maxBytesPerPoll = 1_048_576;

    public String getRoot() {
        return root;
    }

    public void setRoot(String root) {
        this.root = root;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getStateFile() {
        return stateFile;
    }

    public void setStateFile(String stateFile) {
        this.stateFile = stateFile;
    }

    public boolean isStartAtEnd() {
        return startAtEnd;
    }

    public void setStartAtEnd(boolean startAtEnd) {
        this.startAtEnd = startAtEnd;
    }

    public int getMaxBytesPerPoll() {
        return maxBytesPerPoll;
    }

    public void setMaxBytesPerPoll(int maxBytesPerPoll) {
        this.maxBytesPerPoll = maxBytesPerPoll;
    }
}
