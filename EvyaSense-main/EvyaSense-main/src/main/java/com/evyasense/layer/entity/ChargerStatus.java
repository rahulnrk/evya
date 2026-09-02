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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "charger_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChargerStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "charger_id", length = 50, nullable = false, unique = true)
    private String chargerId;
    
    @Column(name = "last_boot_time")
    private LocalDateTime lastBootTime;
    
    @Column(name = "firmware_version", length = 100)
    private String firmwareVersion;
    
    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;
    
    @Column(name = "status", length = 20)
    private String status;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    
    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        lastUpdated = LocalDateTime.now();
    }
}