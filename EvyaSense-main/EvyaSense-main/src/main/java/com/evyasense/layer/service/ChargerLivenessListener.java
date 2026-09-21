package com.evyasense.layer.service;

import java.time.LocalDateTime;

/**
 * Notified when the time-driven sweep decides a charger has gone silent, and when it is heard from
 * again. Keeps storage (Redis, MySQL status history) out of the detection logic, so detection keeps
 * working when a store is down.
 */
public interface ChargerLivenessListener {

    /**
     * @param chargerId   the OCPPId
     * @param silentSince the last time anything was heard from the charger
     * @param detectedAt  when the sweep concluded it is offline
     */
    void wentSilent(String chargerId, LocalDateTime silentSince, LocalDateTime detectedAt);

    /**
     * @param chargerId the OCPPId
     * @param heardAt   log time of the first message after the outage
     */
    void cameBack(String chargerId, LocalDateTime heardAt);
}
