package com.evyasense.layer.repo;


import com.evyasense.layer.entity.ChargerAnomaly;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChargerAnomalyRepository
        extends JpaRepository<ChargerAnomaly, Long> {

    List<ChargerAnomaly> findByChargerId(String chargerId);

    List<ChargerAnomaly> findByStatus(String status);
}
