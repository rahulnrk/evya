package com.evyasense.layer.service;



import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.evyasense.layer.model.BootNotificationPayload;
import com.evyasense.layer.model.ChargerData;
import com.evyasense.layer.model.ConnectorData;
import com.evyasense.layer.model.MeterValuesPayload;
import com.evyasense.layer.model.SenseEvent;
import com.evyasense.layer.model.StartTransactionPayload;
import com.evyasense.layer.model.StatusNotificationPayload;
import com.evyasense.layer.model.StopTransactionPayload;
import com.evyasense.layer.model.TransactionData;
import com.evyasense.layer.model.WebSocketContext;

import lombok.RequiredArgsConstructor;

@Service
public class DataProcessorService {

    private final RedisService redisService;
    private final MySQLService mysqlService;
    private final AnomalyDetectionService anomalyDetectionService;
    private final StatusEventHub statusEventHub;

    public DataProcessorService(
            RedisService redisService,
            MySQLService mysqlService,
            AnomalyDetectionService anomalyDetectionService,
            StatusEventHub statusEventHub) {

        this.redisService = redisService;
        this.mysqlService = mysqlService;
        this.anomalyDetectionService = anomalyDetectionService;
        this.statusEventHub = statusEventHub;
    }
    public void processEvent(SenseEvent event) {
        String eventType = event.getEventType();
        String action = event.getAction();
        
        if ("WEBSOCKET".equals(eventType) && "HANDSHAKE".equals(action)) {
            processHandshake(event);
        } else if ("OCPP_REQUEST".equals(eventType)) {
            processOcppRequest(event);
        } else if ("OCPP_RESPONSE".equals(eventType)) {
            processOcppResponse(event);
        }
        anomalyDetectionService.handleEvent(event);

        
    }
    
    private void processHandshake(SenseEvent event) {
        WebSocketContext context = event.getSocketContext();
        if (context != null && context.getChargerId() != null) {
            // Initialize charger in Redis
            ChargerData charger = redisService.getChargerData(context.getChargerId());
            if (charger == null) {
                charger = new ChargerData();
                charger.setChargerId(context.getChargerId());
                charger.setStatus("online");
                redisService.saveChargerData(charger);
                mysqlService.saveChargerData(charger);
            }
        }
    }
    
    private void processOcppRequest(SenseEvent event) {
        switch (event.getAction()) {
            case "BootNotification":
                processBootNotificationRequest(event);
                break;
            case "StatusNotification":
                processStatusNotificationRequest(event);
                break;
            case "StartTransaction":
                processStartTransactionRequest(event);
                break;
            case "StopTransaction":
                processStopTransactionRequest(event);
                break;
            case "MeterValues":
                processMeterValues(event);
                break;
        }
    }
    
    private void processOcppResponse(SenseEvent event) {
        switch (event.getAction()) {
            case "BootNotification":
                processBootNotificationResponse(event);
                break;
            case "Heartbeat":
                processHeartbeatResponse(event);
                break;
            case "StartTransaction":
                processStartTransactionResponse(event);
                break;
            case "StopTransaction":
                processStopTransactionResponse(event);
                break;
        }
    }
    
    private void processBootNotificationRequest(SenseEvent event) {
        BootNotificationPayload payload = (BootNotificationPayload) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String chargerId = context.getClientId();
            
            ChargerData charger = redisService.getChargerData(chargerId);
            if (charger == null) {
                charger = new ChargerData();
                charger.setChargerId(chargerId);
            }
            
            charger.setFirmwareVersion(payload.getFirmwareVersion());
            redisService.saveChargerData(charger);
        }
    }
    
    private void processBootNotificationResponse(SenseEvent event) {
        Map<String, Object> payload = (Map<String, Object>) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String chargerId = context.getClientId();
            
            ChargerData charger = redisService.getChargerData(chargerId);
            if (charger == null) {
                charger = new ChargerData();
                charger.setChargerId(chargerId);
            }
            
            charger.setLastBootTime(event.getLogTime());
            if ("Accepted".equals(payload.get("status"))) {
                charger.setStatus("online");
            }
            
            redisService.saveChargerData(charger);
            mysqlService.saveChargerData(charger);
        }
    }
    
    private void processHeartbeatResponse(SenseEvent event) {
        Map<String, Object> payload = (Map<String, Object>) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String chargerId = context.getClientId();
            
            ChargerData charger = redisService.getChargerData(chargerId);
            if (charger == null) {
                charger = new ChargerData();
                charger.setChargerId(chargerId);
            }
            
            LocalDateTime lastHeartbeat = charger.getLastHeartbeat();
            charger.setLastHeartbeat(event.getLogTime());
            
            // Check if charger went offline (no heartbeat for 5 minutes)
            boolean wasOnline = "online".equals(charger.getStatus());
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minus(5, ChronoUnit.MINUTES);
            
            if (wasOnline && lastHeartbeat != null && lastHeartbeat.isBefore(fiveMinutesAgo)) {
                // Charger went offline
                charger.setStatus("offline");
                mysqlService.trackChargerStatusChange(chargerId, "online", "offline");
            } else {
                charger.setStatus("online");
            }
            
            redisService.saveChargerData(charger);
            mysqlService.saveChargerData(charger);
        }
    }
    
    private void processStatusNotificationRequest(SenseEvent event) {
        StatusNotificationPayload payload = (StatusNotificationPayload) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String chargerId = context.getClientId();
            String connectorId = String.valueOf(payload.getConnectorId());
            
            ConnectorData connector = redisService.getConnectorData(chargerId, connectorId);
            if (connector == null) {
                connector = new ConnectorData();
                connector.setChargerId(chargerId);
                connector.setConnectorId(connectorId);
            }
            
            String oldStatus = connector.getStatus();
            String newStatus = payload.getStatus();
            
            // Only update MySQL when status actually changes
            if (oldStatus == null || !oldStatus.equals(newStatus)) {
                connector.setLastStatusChanged(event.getLogTime());
                connector.setStatus(newStatus);
                
                redisService.saveConnectorData(connector);
                mysqlService.saveConnectorData(connector);
                
                if (oldStatus != null) {
                    mysqlService.trackConnectorStatusChange(chargerId, connectorId, 
                                                           oldStatus, newStatus);
                }
                // SCALE-3: push delta to SSE subscribers
                statusEventHub.publish(chargerId, connectorId, newStatus);
            } else {
                // Just update Redis with same status
                connector.setStatus(newStatus);
                redisService.saveConnectorData(connector);
            }
        }
    }
    
    private void processStartTransactionRequest(SenseEvent event) {
        StartTransactionPayload payload = (StartTransactionPayload) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            // Get connector status to find which connector is starting transaction
            String chargerId = context.getClientId();
            
            // We'll update this when we get the response with transactionId
        }
    }
    
    private void processStartTransactionResponse(SenseEvent event) {
        Map<String, Object> payload = (Map<String, Object>) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String chargerId = context.getClientId();
            
            // Get the latest StartTransaction request for this messageId
            // In real implementation, you'd need to correlate request/response
            
            if (payload.containsKey("transactionId")) {
                String transactionId = String.valueOf(payload.get("transactionId"));
                
                TransactionData transaction = new TransactionData();
                transaction.setTransactionId(transactionId);
                transaction.setChargerId(chargerId);
                // Need to get connectorId from status
                transaction.setLastEventTime(event.getLogTime());
                
                redisService.saveTransactionData(transaction);
            }
        }
    }
    private void processStopTransactionResponse(SenseEvent event) {
        Map<String, Object> payload = (Map<String, Object>) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String messageId = event.getMessageId();
            
            // Get correlated request data
            Map<String, Object> requestData = redisService.getCorrelationData(messageId);
            
            if (requestData != null) {
                String transactionId = (String) requestData.get("transactionId");
                String chargerId = (String) requestData.get("chargerId");
                
                TransactionData transaction = redisService.getTransactionData(transactionId);
                
                if (transaction != null) {
                    // Update final transaction details from response if available
                    if (payload.containsKey("idTagInfo")) {
                        Map<String, Object> idTagInfo = (Map<String, Object>) payload.get("idTagInfo");
                        // You can store additional info from response if needed
                    }
                    
                    // Save final transaction to MySQL
                    mysqlService.saveTransactionData(transaction);
                    
                    // Update connector status back to AVAILABLE or other appropriate status
                    if (transaction.getConnectorId() != null) {
                        ConnectorData connector = redisService.getConnectorData(
                            chargerId, 
                            transaction.getConnectorId()
                        );
                        
                        if (connector != null) {
                            String oldStatus = connector.getStatus();
                            connector.setStatus("AVAILABLE");
                            connector.setLastStatusChanged(event.getLogTime());
                            redisService.saveConnectorData(connector);
                            mysqlService.saveConnectorData(connector);
                            
                            if (oldStatus != null && !oldStatus.equals("AVAILABLE")) {
                                mysqlService.trackConnectorStatusChange(
                                    chargerId, 
                                    transaction.getConnectorId(),
                                    oldStatus, 
                                    "AVAILABLE"
                                );
                            }
                        }
                    }
                    
                    // Clean up correlation data
                    redisService.deleteCorrelationData(messageId);
                }
            }}
        }
    
    private void processStopTransactionRequest(SenseEvent event) {
        StopTransactionPayload payload = (StopTransactionPayload) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        if (context != null && context.getClientId() != null) {
            String transactionId = String.valueOf(payload.getTransactionId());
            
            TransactionData transaction = redisService.getTransactionData(transactionId);
            if (transaction != null) {
                transaction.setStopTime(event.getLogTime());
                
                // Extract meter values
                if (payload.getTransactionData() != null && !payload.getTransactionData().isEmpty()) {
                    for (var transactionData : payload.getTransactionData()) {
                        for (var sampledValue : transactionData.getSampledValue()) {
                            if ("Energy.Active.Import.Register".equals(sampledValue.getMeasurand())) {
                                transaction.setLastMeterValue(Double.valueOf(sampledValue.getValue()));
                            } else if ("Power.Active.Import".equals(sampledValue.getMeasurand())) {
                                transaction.setEnergyConsumed(Double.valueOf(sampledValue.getValue()));
                            }
                        }
                    }
                }
                
                redisService.saveTransactionData(transaction);
                mysqlService.saveTransactionData(transaction);
            }
        }
    }
    
    private void processMeterValues(SenseEvent event) {
        MeterValuesPayload payload = (MeterValuesPayload) event.getPayload();
        WebSocketContext context = event.getSocketContext();
        
        // Update latest meter values for transactions
        if (payload.getTransactionId() != null && context != null) {
            String transactionId = String.valueOf(payload.getTransactionId());
            TransactionData transaction = redisService.getTransactionData(transactionId);
            
            if (transaction != null) {
                transaction.setLastEventTime(event.getLogTime());
                
                // Update meter values
                if (payload.getMeterValue() != null && !payload.getMeterValue().isEmpty()) {
                    for (var meterValue : payload.getMeterValue()) {
                        for (var sampledValue : meterValue.getSampledValue()) {
                            if ("Energy.Active.Import.Register".equals(sampledValue.getMeasurand())) {
                                transaction.setLastMeterValue(Double.valueOf(sampledValue.getValue()));
                            }
                        }
                    }
                }
                
                redisService.saveTransactionData(transaction);
            }
        }
    }
}
