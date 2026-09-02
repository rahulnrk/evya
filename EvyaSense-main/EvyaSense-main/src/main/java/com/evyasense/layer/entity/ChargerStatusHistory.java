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
@Table(name = "charger_status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChargerStatusHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "charger_id", length = 50, nullable = false)
    private String chargerId;
    
    @Column(name = "old_status", length = 20)
    private String oldStatus;
    
    @Column(name = "new_status", length = 20, nullable = false)
    private String newStatus;
    
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    
    @PrePersist
    public void prePersist() {
        changedAt = LocalDateTime.now();
    }
}