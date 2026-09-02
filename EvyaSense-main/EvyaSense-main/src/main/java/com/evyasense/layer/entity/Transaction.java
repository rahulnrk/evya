package com.evyasense.layer.entity;


import java.time.LocalDateTime;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "transaction_id", length = 50, nullable = false, unique = true)
    private String transactionId;
    
    @Column(name = "charger_id", length = 50, nullable = false)
    private String chargerId;
    
    @Column(name = "connector_id", length = 10)
    private String connectorId;
    
    @Column(name = "id_tag", length = 50)
    private String idTag;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "stop_time")
    private LocalDateTime stopTime;
    @Column(name = "last_meter_value", precision = 10, scale = 2)
    private BigDecimal lastMeterValue;

    @Column(name = "energy_consumed", precision = 10, scale = 2)
    private BigDecimal energyConsumed;

    @Column(name = "last_event_time")
    private LocalDateTime lastEventTime;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    @Column(name = "transaction_status", length = 20)
    private String transactionStatus;
    
    @PrePersist
    @PreUpdate
    public void updateTimestampAndStatus() {
        lastUpdated = LocalDateTime.now();
        // Auto-set transaction status based on stop_time
        this.transactionStatus = (stopTime == null) ? "ACTIVE" : "COMPLETED";
    }
    
    @Transient
    public boolean isActive() {
        return stopTime == null;
    }
}