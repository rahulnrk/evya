package com.evyasense.layer.entity;



import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
// Fix 4: unique constraint makes ON DUPLICATE KEY UPDATE in MySQLService actually upsert
@Table(name = "connector_status",
       uniqueConstraints = @UniqueConstraint(columnNames = {"charger_id", "connector_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConnectorStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "charger_id", length = 50, nullable = false)
    private String chargerId;
    
    @Column(name = "connector_id", length = 10, nullable = false)
    private String connectorId;
    
    @Column(name = "status", length = 50)
    private String status;
    
    @Column(name = "last_status_changed")
    private LocalDateTime lastStatusChanged;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        lastUpdated = LocalDateTime.now();
    }
}