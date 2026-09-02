package com.evyasense.layer.entity;



import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "connector_status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConnectorStatusHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "charger_id", length = 50, nullable = false)
    private String chargerId;
    
    @Column(name = "connector_id", length = 10, nullable = false)
    private String connectorId;
    
    @Column(name = "old_status", length = 50)
    private String oldStatus;
    
    @Column(name = "new_status", length = 50, nullable = false)
    private String newStatus;
    
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    
    @PrePersist
    public void prePersist() {
        changedAt = LocalDateTime.now();
    }
}
