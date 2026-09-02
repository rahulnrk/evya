package com.evyasense.layer.service;



import com.evyasense.layer.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {
	private final RedisTemplate<String, Object> redisTemplate ;

    
    private static final String CHARGER_KEY_PREFIX = "charger:";
    private static final String CONNECTOR_KEY_PREFIX = "connector:";
    private static final String TRANSACTION_KEY_PREFIX = "transaction:";
    
    // Charger Operations
    public void saveChargerData(ChargerData chargerData) {
        String key = CHARGER_KEY_PREFIX + chargerData.getChargerId();
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();
        
        Map<String, String> data = new HashMap<>();
        data.put("chargerId", chargerData.getChargerId());
        data.put("lastBootTime", chargerData.getLastBootTime() != null ? 
                 chargerData.getLastBootTime().toString() : null);
        data.put("firmwareVersion", chargerData.getFirmwareVersion());
        data.put("lastHeartbeat", chargerData.getLastHeartbeat() != null ? 
                 chargerData.getLastHeartbeat().toString() : null);
        data.put("status", chargerData.getStatus());
        data.put("lastUpdated", LocalDateTime.now().toString());
        
        hashOps.putAll(key, data);
        redisTemplate.expire(key, 7, TimeUnit.DAYS); // Keep data for 7 days
    }
    
    public ChargerData getChargerData(String chargerId) {
        String key = CHARGER_KEY_PREFIX + chargerId;
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();
        Map<String, String> data = hashOps.entries(key);
        
        if (data.isEmpty()) return null;
        
        ChargerData charger = new ChargerData();
        charger.setChargerId(data.get("chargerId"));
        charger.setLastBootTime(parseDateTime(data.get("lastBootTime")));
        charger.setFirmwareVersion(data.get("firmwareVersion"));
        charger.setLastHeartbeat(parseDateTime(data.get("lastHeartbeat")));
        charger.setStatus(data.get("status"));
        charger.setLastUpdated(parseDateTime(data.get("lastUpdated")));
        
        return charger;
    }
    
    // Connector Operations
    public void saveConnectorData(ConnectorData connectorData) {
        String key = CONNECTOR_KEY_PREFIX + connectorData.getChargerId() + 
                    ":" + connectorData.getConnectorId();
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();
        
        Map<String, String> data = new HashMap<>();
        data.put("chargerId", connectorData.getChargerId());
        data.put("connectorId", connectorData.getConnectorId());
        data.put("status", connectorData.getStatus());
        data.put("lastStatusChanged", connectorData.getLastStatusChanged() != null ? 
                 connectorData.getLastStatusChanged().toString() : null);
        data.put("lastUpdated", LocalDateTime.now().toString());
        
        hashOps.putAll(key, data);
        redisTemplate.expire(key, 7, TimeUnit.DAYS);
        trackConnectorId(connectorData.getChargerId(), connectorData.getConnectorId());
    }
    
    public ConnectorData getConnectorData(String chargerId, String connectorId) {
        String key = CONNECTOR_KEY_PREFIX + chargerId + ":" + connectorId;
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();
        Map<String, String> data = hashOps.entries(key);
        
        if (data.isEmpty()) return null;
        
        ConnectorData connector = new ConnectorData();
        connector.setChargerId(data.get("chargerId"));
        connector.setConnectorId(data.get("connectorId"));
        connector.setStatus(data.get("status"));
        connector.setLastStatusChanged(parseDateTime(data.get("lastStatusChanged")));
        connector.setLastUpdated(parseDateTime(data.get("lastUpdated")));
        
        return connector;
    }

    /** Track connector ids per charger so status API can list ports without SCAN. */
    public void trackConnectorId(String chargerId, String connectorId) {
        if (chargerId == null || connectorId == null) return;
        String setKey = CHARGER_KEY_PREFIX + chargerId + ":connectors";
        redisTemplate.opsForSet().add(setKey, connectorId);
        redisTemplate.expire(setKey, 7, TimeUnit.DAYS);
    }

    @SuppressWarnings("unchecked")
    public java.util.Set<String> getConnectorIdsForCharger(String chargerId) {
        String setKey = CHARGER_KEY_PREFIX + chargerId + ":connectors";
        java.util.Set<Object> members = redisTemplate.opsForSet().members(setKey);
        java.util.Set<String> out = new java.util.HashSet<>();
        if (members == null) return out;
        for (Object m : members) {
            if (m != null) out.add(String.valueOf(m).replace("\"", ""));
        }
        return out;
    }
    
    // Transaction Operations
    public void saveTransactionData(TransactionData transactionData) {
        String key = TRANSACTION_KEY_PREFIX + transactionData.getTransactionId();
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();

        Map<String, String> data = new HashMap<>();
        data.put("transactionId", transactionData.getTransactionId());
        data.put("chargerId", transactionData.getChargerId());
        data.put("connectorId", transactionData.getConnectorId());
        data.put("idTag", transactionData.getIdTag());
        data.put("startTime", transactionData.getStartTime() != null ?
                 transactionData.getStartTime().toString() : null);
        data.put("stopTime", transactionData.getStopTime() != null ?
                 transactionData.getStopTime().toString() : null);
        data.put("lastMeterValue", transactionData.getLastMeterValue() != null ?
                 transactionData.getLastMeterValue().toString() : null);
        data.put("energyConsumed", transactionData.getEnergyConsumed() != null ?
                 transactionData.getEnergyConsumed().toString() : null);
        data.put("lastEventTime", transactionData.getLastEventTime() != null ?
                 transactionData.getLastEventTime().toString() : null);
        data.put("transactionStatus", transactionData.getTransactionStatus());
        data.put("lastUpdated", LocalDateTime.now().toString());

        hashOps.putAll(key, data);
        redisTemplate.expire(key, 30, TimeUnit.DAYS);
    }

    public TransactionData getTransactionData(String transactionId) {
        String key = TRANSACTION_KEY_PREFIX + transactionId;
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();
        Map<String, String> data = hashOps.entries(key);

        if (data.isEmpty()) return null;

        TransactionData transaction = new TransactionData();
        transaction.setTransactionId(data.get("transactionId"));
        transaction.setChargerId(data.get("chargerId"));
        transaction.setConnectorId(data.get("connectorId"));
        transaction.setIdTag(data.get("idTag"));
        transaction.setStartTime(parseDateTime(data.get("startTime")));
        transaction.setStopTime(parseDateTime(data.get("stopTime")));
        transaction.setLastMeterValue(data.get("lastMeterValue") != null ? 
                                      Double.valueOf(data.get("lastMeterValue")) : null);
        transaction.setEnergyConsumed(data.get("energyConsumed") != null ? 
                                      Double.valueOf(data.get("energyConsumed")) : null);
        transaction.setLastEventTime(parseDateTime(data.get("lastEventTime")));
        transaction.setTransactionStatus(data.get("transactionStatus"));
        transaction.setLastUpdated(parseDateTime(data.get("lastUpdated")));

        return transaction;
    }

    public void deleteCorrelationData(String messageId) {
        String key = "correlation:" + messageId;
        redisTemplate.delete(key);
    }
    // Helper methods
    private LocalDateTime parseDateTime(String dateTimeStr) {
        return dateTimeStr != null ? LocalDateTime.parse(dateTimeStr) : null;
    }
    
    private Double parseDouble(String doubleStr) {
        return doubleStr != null ? Double.parseDouble(doubleStr) : null;
    }
    public Map<String, Object> getCorrelationData(String messageId) {
        String key = "correlation:" + messageId;
        HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();
        Map<String, String> data = hashOps.entries(key);
        
        if (data.isEmpty()) return null;
        
        Map<String, Object> result = new HashMap<>(data);
        return result;
    }
}