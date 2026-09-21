package com.evyasense.layer.controller;



import com.evyasense.layer.model.*;
import com.evyasense.layer.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

// SEC-004: raw Redis inspection is a debugging aid. It does not exist unless explicitly enabled, and
// even then requires an operator token like every other non-public endpoint.
@ConditionalOnProperty(name = "sense.debug-endpoints.enabled", havingValue = "true")
@RestController
@RequestMapping("/api/redis/inspect")
@RequiredArgsConstructor
public class RedisInspectController {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisService redisService;

    // Fix 7: replaced all redisTemplate.keys(pattern) calls with SCAN to avoid
    // blocking Redis during large keyspace scans.
    private Set<String> scan(String pattern) {
        Set<String> keys = new HashSet<>();
        ScanOptions opts = ScanOptions.scanOptions().match(pattern).count(100).build();
        try (Cursor<String> cursor = redisTemplate.scan(opts)) {
            cursor.forEachRemaining(keys::add);
        }
        return keys;
    }

    @GetMapping("/keys")
    public Set<String> getAllKeys(@RequestParam(required = false) String pattern) {
        return scan(pattern != null ? pattern : "*");
    }

    @GetMapping("/keys/by-type")
    public Map<String, Set<String>> getKeysByType() {
        Map<String, Set<String>> result = new HashMap<>();
        result.put("chargers", scan("charger:*"));
        result.put("connectors", scan("connector:*"));
        result.put("transactions", scan("transaction:*"));
        result.put("correlations", scan("correlation:*"));
        return result;
    }

    @GetMapping("/charger/{chargerId}")
    public Map<Object, Object> getChargerHash(@PathVariable String chargerId) {
        String key = "charger:" + chargerId;
        return redisTemplate.opsForHash().entries(key);
    }

    @GetMapping("/charger/all")
    public List<Map<Object, Object>> getAllChargers() {
        Set<String> keys = scan("charger:*");
        List<Map<Object, Object>> result = new ArrayList<>();
        for (String key : keys) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            data.put("_key", key);
            result.add(data);
        }
        return result;
    }

    @GetMapping("/connector/{chargerId}/{connectorId}")
    public Map<Object, Object> getConnectorHash(
            @PathVariable String chargerId,
            @PathVariable String connectorId) {
        String key = "connector:" + chargerId + ":" + connectorId;
        return redisTemplate.opsForHash().entries(key);
    }

    @GetMapping("/connector/all")
    public List<Map<Object, Object>> getAllConnectors() {
        Set<String> keys = scan("connector:*");
        List<Map<Object, Object>> result = new ArrayList<>();
        for (String key : keys) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            data.put("_key", key);
            result.add(data);
        }
        return result;
    }

    @GetMapping("/connector/by-charger/{chargerId}")
    public List<Map<Object, Object>> getConnectorsByCharger(@PathVariable String chargerId) {
        Set<String> keys = scan("connector:" + chargerId + ":*");
        List<Map<Object, Object>> result = new ArrayList<>();
        for (String key : keys) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            data.put("_key", key);
            result.add(data);
        }
        return result;
    }

    @GetMapping("/transaction/{transactionId}")
    public Map<Object, Object> getTransactionHash(@PathVariable String transactionId) {
        String key = "transaction:" + transactionId;
        return redisTemplate.opsForHash().entries(key);
    }

    @GetMapping("/transaction/all")
    public List<Map<Object, Object>> getAllTransactions() {
        Set<String> keys = scan("transaction:*");
        List<Map<Object, Object>> result = new ArrayList<>();
        for (String key : keys) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            data.put("_key", key);
            result.add(data);
        }
        return result;
    }

    @GetMapping("/transaction/active")
    public List<Map<Object, Object>> getActiveTransactions() {
        Set<String> keys = scan("transaction:*");
        List<Map<Object, Object>> result = new ArrayList<>();
        for (String key : keys) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            String stopTime = (String) data.get("stopTime");
            if (stopTime == null || stopTime.equals("null") || stopTime.isEmpty()) {
                data.put("_key", key);
                result.add(data);
            }
        }
        return result;
    }

    @GetMapping("/correlation/{messageId}")
    public Map<Object, Object> getCorrelationHash(@PathVariable String messageId) {
        String key = "correlation:" + messageId;
        return redisTemplate.opsForHash().entries(key);
    }

    @GetMapping("/stats")
    public Map<String, Object> getRedisStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total_keys", scan("*").size());
        stats.put("chargers", scan("charger:*").size());
        stats.put("connectors", scan("connector:*").size());
        stats.put("transactions", scan("transaction:*").size());
        stats.put("correlations", scan("correlation:*").size());

        Properties memoryInfo = redisTemplate.getRequiredConnectionFactory()
                .getConnection()
                .info("memory");
        stats.put("memory", memoryInfo);
        return stats;
    }

    @DeleteMapping("/key/{key}")
    public Boolean deleteKey(@PathVariable String key) {
        return redisTemplate.delete(key);
    }

    // Fix 7: /clear-all endpoint removed — it wiped the entire Redis keyspace
    // with no authentication and a blocking KEYS * scan.
}
