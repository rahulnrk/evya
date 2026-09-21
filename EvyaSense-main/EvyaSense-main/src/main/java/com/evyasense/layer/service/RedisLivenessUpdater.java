package com.evyasense.layer.service;

import com.evyasense.layer.model.ChargerData;
import com.evyasense.layer.model.ConnectorData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Keeps the live-status plane truthful. Before the sweep existed, a charger that died stayed "online"
 * in Redis indefinitely, because status only changed when a heartbeat arrived.
 *
 * <p>The web map computes availability from <i>port</i> statuses, not from the charger status, so
 * marking the charger offline alone would still show its ports as available. On an outage every known
 * port is pushed to SSE subscribers as {@value #UNAVAILABLE}; on recovery each port's last reported
 * status is pushed back.
 */
@Component
public class RedisLivenessUpdater implements ChargerLivenessListener {

    private static final Logger log = LoggerFactory.getLogger(RedisLivenessUpdater.class);

    static final String ONLINE = "online";
    static final String OFFLINE = "offline";
    static final String UNAVAILABLE = "Unavailable";

    private final RedisService redisService;
    private final MySQLService mysqlService;
    private final StatusEventHub statusEventHub;

    public RedisLivenessUpdater(RedisService redisService, MySQLService mysqlService,
                                StatusEventHub statusEventHub) {
        this.redisService = redisService;
        this.mysqlService = mysqlService;
        this.statusEventHub = statusEventHub;
    }

    @Override
    public void wentSilent(String chargerId, LocalDateTime silentSince, LocalDateTime detectedAt) {
        if (setStatus(chargerId, OFFLINE)) {
            publishPorts(chargerId, true);
        }
        log.warn("Charger {} marked offline: nothing heard since {}", chargerId, silentSince);
    }

    @Override
    public void cameBack(String chargerId, LocalDateTime heardAt) {
        if (setStatus(chargerId, ONLINE)) {
            publishPorts(chargerId, false);
        }
        log.info("Charger {} back online at {}", chargerId, heardAt);
    }

    /** @return true if the status actually changed */
    private boolean setStatus(String chargerId, String newStatus) {
        ChargerData charger = redisService.getChargerData(chargerId);
        if (charger == null) {
            charger = new ChargerData();
            charger.setChargerId(chargerId);
        }

        String oldStatus = charger.getStatus();
        if (newStatus.equals(oldStatus)) {
            return false;
        }

        charger.setStatus(newStatus);
        redisService.saveChargerData(charger);
        mysqlService.saveChargerData(charger);
        mysqlService.trackChargerStatusChange(chargerId, oldStatus == null ? "unknown" : oldStatus,
                newStatus);
        return true;
    }

    private void publishPorts(String chargerId, boolean offline) {
        for (String connectorId : redisService.getConnectorIdsForCharger(chargerId)) {
            String status = offline ? UNAVAILABLE : lastReported(chargerId, connectorId);
            statusEventHub.publish(chargerId, connectorId, status);
        }
    }

    private String lastReported(String chargerId, String connectorId) {
        ConnectorData connector = redisService.getConnectorData(chargerId, connectorId);
        return connector == null ? null : connector.getStatus();
    }
}
