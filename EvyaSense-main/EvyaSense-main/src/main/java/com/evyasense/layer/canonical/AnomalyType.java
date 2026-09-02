package com.evyasense.layer.canonical;

public enum AnomalyType {

    // =========================
    // CRITICAL (Safety Risk)
    // =========================
    GROUND_FAULT_ENERGY_FLOWING(Severity.CRITICAL),
    OVERCURRENT_BUT_CHARGING(Severity.CRITICAL),

    // =========================
    // HIGH (Major Functional)
    // =========================
    HEARTBEAT_TIMEOUT(Severity.HIGH),
    CHARGING_NO_METER_VALUES(Severity.HIGH),
    REBOOT_DURING_TRANSACTION(Severity.HIGH),
    OPEN_TRANSACTION_AFTER_DISCONNECT(Severity.HIGH),
    WATCHDOG_REBOOT_LOOP(Severity.HIGH),
    TRANSACTION_REPLACED_WHILE_ACTIVE(Severity.HIGH),
    CHARGING_AFTER_REMOTE_STOP(Severity.HIGH),
    PARTIAL_COMMUNICATION_LOSS(Severity.HIGH),

    // =========================
    // MEDIUM (Performance / Logic)
    // =========================
    ENERGY_JUMP(Severity.MEDIUM),
    METER_FLOODING(Severity.MEDIUM),
    CONTINUOUS_SAME_POWER(Severity.MEDIUM),
    DUPLICATE_TRANSACTION(Severity.MEDIUM),
    STATUS_TRANSACTION_MISMATCH(Severity.MEDIUM),

    // =========================
    // WARNING (Fault Reported)
    // =========================
    CHARGER_GROUND_FAULT(Severity.WARNING),
    CHARGER_OVERCURRENT(Severity.WARNING),
    CHARGER_WEAK_SIGNAL(Severity.WARNING),
    CHARGER_ERROR(Severity.WARNING),
    WEBSOCKET_DISCONNECTED(Severity.WARNING),
    METER_INTERVAL_UNKNOWN(Severity.WARNING);

    private final Severity severity;

    AnomalyType(Severity severity) {
        this.severity = severity;
    }

    public Severity getSeverity() {
        return severity;
    }
}
