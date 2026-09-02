package com.evyasense.layer.controller;



import com.evyasense.layer.model.*;
import com.evyasense.layer.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataController {
    
    private final RedisService redisService ;
    
    @GetMapping("/charger/{chargerId}")
    public ResponseEntity<ChargerData> getChargerData(@PathVariable String chargerId) {
        ChargerData data = redisService.getChargerData(chargerId);
        return data != null ? 
               ResponseEntity.ok(data) : 
               ResponseEntity.notFound().build();
    }
    
    @GetMapping("/connector/{chargerId}/{connectorId}")
    public ResponseEntity<ConnectorData> getConnectorData(
            @PathVariable String chargerId,
            @PathVariable String connectorId) {
        ConnectorData data = redisService.getConnectorData(chargerId, connectorId);
        return data != null ? 
               ResponseEntity.ok(data) : 
               ResponseEntity.notFound().build();
    }
    
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<TransactionData> getTransactionData(
            @PathVariable String transactionId) {
        TransactionData data = redisService.getTransactionData(transactionId);
        return data != null ? 
               ResponseEntity.ok(data) : 
               ResponseEntity.notFound().build();
    }
    
    @GetMapping("/charger/{chargerId}/connectors")
    public ResponseEntity<List<ConnectorData>> getAllConnectorsForCharger(
            @PathVariable String chargerId) {
        // This would require a scan operation in Redis
        // For simplicity, you might want to maintain a set of connector IDs per charger
        return ResponseEntity.ok(List.of());
    }
}
