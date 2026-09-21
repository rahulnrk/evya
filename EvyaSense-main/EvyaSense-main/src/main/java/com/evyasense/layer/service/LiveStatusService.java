package com.evyasense.layer.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.evyasense.layer.model.ChargerData;
import com.evyasense.layer.model.ConnectorData;

import lombok.RequiredArgsConstructor;

/**
 * SCALE-3: batch live status for chargerRefs (OCPP ids) from Redis.
 */
@Service
@RequiredArgsConstructor
public class LiveStatusService {

    public static final int MAX_IDS = 500;

    static final String OFFLINE = "offline";
    static final String UNAVAILABLE = "Unavailable";

    private final RedisService redisService;

    public List<Map<String, Object>> statusForIds(String idsCsv) {
        List<String> ids = parseIds(idsCsv);
        List<Map<String, Object>> out = new ArrayList<>();
        for (String chargerRef : ids) {
            out.add(buildChargerStatus(chargerRef));
        }
        return out;
    }

    public Map<String, Object> buildChargerStatus(String chargerRef) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("chargerRef", chargerRef);

        ChargerData charger = redisService.getChargerData(chargerRef);
        String chargerStatus = charger != null ? charger.getStatus() : null;
        // A charger EvyaSense has marked silent cannot serve a driver, whatever its ports last reported.
        boolean offline = OFFLINE.equalsIgnoreCase(chargerStatus);
        body.put("chargerStatus", chargerStatus);

        Set<String> connectorIds = redisService.getConnectorIdsForCharger(chargerRef);
        List<Map<String, Object>> ports = new ArrayList<>();
        int available = 0;
        int total = 0;

        for (String connectorId : connectorIds) {
            ConnectorData cd = redisService.getConnectorData(chargerRef, connectorId);
            String reported = cd != null ? cd.getStatus() : null;
            String status = offline ? UNAVAILABLE : reported;
            Map<String, Object> port = new LinkedHashMap<>();
            port.put("connectorId", connectorId);
            port.put("status", status);
            if (offline) {
                port.put("lastReportedStatus", reported);
            }
            ports.add(port);
            total++;
            if (isAvailable(status)) {
                available++;
            }
        }

        body.put("ports", ports);
        body.put("available", available);
        body.put("total", total);
        return body;
    }

    public static List<String> parseIds(String idsCsv) {
        if (idsCsv == null || idsCsv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(idsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .limit(MAX_IDS)
                .collect(Collectors.toList());
    }

    public static boolean isAvailable(String status) {
        if (status == null) return false;
        String s = status.toLowerCase(Locale.ROOT);
        return "available".equals(s) || "preparing".equals(s);
    }
}
