package com.evyasense.layer.service;


import com.evyasense.layer.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MySQLService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Transactional
    public void saveChargerData(ChargerData chargerData) {
        String sql = """
            INSERT INTO charger_status 
            (charger_id, last_boot_time, firmware_version, last_heartbeat, status, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            last_boot_time = VALUES(last_boot_time),
            firmware_version = VALUES(firmware_version),
            last_heartbeat = VALUES(last_heartbeat),
            status = VALUES(status),
            last_updated = VALUES(last_updated)
            """;
        
        jdbcTemplate.update(sql,
            chargerData.getChargerId(),
            chargerData.getLastBootTime(),
            chargerData.getFirmwareVersion(),
            chargerData.getLastHeartbeat(),
            chargerData.getStatus(),
            LocalDateTime.now()
        );
    }
    
    @Transactional
    public void saveConnectorData(ConnectorData connectorData) {
        String sql = """
            INSERT INTO connector_status 
            (charger_id, connector_id, status, last_status_changed, last_updated)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            last_status_changed = VALUES(last_status_changed),
            last_updated = VALUES(last_updated)
            """;
        
        jdbcTemplate.update(sql,
            connectorData.getChargerId(),
            connectorData.getConnectorId(),
            connectorData.getStatus(),
            connectorData.getLastStatusChanged(),
            LocalDateTime.now()
        );
    }
    
    @Transactional
    public void saveTransactionData(TransactionData transactionData) {
        String sql = """
            INSERT INTO transactions
            (transaction_id, charger_id, connector_id, id_tag, start_time,
             stop_time, last_meter_value, energy_consumed, last_event_time,
             transaction_status, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            stop_time = VALUES(stop_time),
            last_meter_value = VALUES(last_meter_value),
            energy_consumed = VALUES(energy_consumed),
            last_event_time = VALUES(last_event_time),
            transaction_status = VALUES(transaction_status),
            last_updated = VALUES(last_updated)
            """;

        jdbcTemplate.update(sql,
            transactionData.getTransactionId(),
            transactionData.getChargerId(),
            transactionData.getConnectorId(),
            transactionData.getIdTag(),
            transactionData.getStartTime(),
            transactionData.getStopTime(),
            transactionData.getLastMeterValue(),
            transactionData.getEnergyConsumed(),
            transactionData.getLastEventTime(),
            transactionData.getTransactionStatus(),
            LocalDateTime.now()
        );
    }
    
    // Status change tracking for charger (online/offline)
    public void trackChargerStatusChange(String chargerId, String oldStatus, String newStatus) {
        String sql = """
            INSERT INTO charger_status_history 
            (charger_id, old_status, new_status, changed_at)
            VALUES (?, ?, ?, ?)
            """;
        
        jdbcTemplate.update(sql,
            chargerId,
            oldStatus,
            newStatus,
            LocalDateTime.now()
        );
    }
    
    // Status change tracking for connector
    public void trackConnectorStatusChange(String chargerId, String connectorId, 
                                         String oldStatus, String newStatus) {
        String sql = """
            INSERT INTO connector_status_history 
            (charger_id, connector_id, old_status, new_status, changed_at)
            VALUES (?, ?, ?, ?, ?)
            """;
        
        jdbcTemplate.update(sql,
            chargerId,
            connectorId,
            oldStatus,
            newStatus,
            LocalDateTime.now()
        );
    }
}