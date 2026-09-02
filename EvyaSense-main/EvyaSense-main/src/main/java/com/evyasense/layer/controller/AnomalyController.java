package com.evyasense.layer.controller;

import com.evyasense.layer.entity.ChargerAnomaly;
import com.evyasense.layer.repo.ChargerAnomalyRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anomalies")
public class AnomalyController {

    private final ChargerAnomalyRepository repository;

    public AnomalyController(ChargerAnomalyRepository repository) {
        this.repository = repository;
    }

    // Get all anomalies
    @GetMapping
    public List<ChargerAnomaly> getAll() {
        return repository.findAll();
    }

    // Get active issues only
    @GetMapping("/active")
    public List<ChargerAnomaly> getActive() {
        return repository.findByStatus("ACTIVE");
    }

    // Get anomalies by charger
    @GetMapping("/{chargerId}")
    public List<ChargerAnomaly> getByCharger(
            @PathVariable String chargerId) {

        return repository.findByChargerId(chargerId);
    }
}
