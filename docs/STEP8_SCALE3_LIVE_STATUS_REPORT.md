# STEP 8 / SCALE-3 — Live charger status (hot plane)

**Date:** 2026-07-27  
**Goal:** Color map markers from real-time availability **without** refetching geometry. Cold plane = `mobilegetAllSites` (bbox); hot plane = EvyaSense Redis status.

---

## Infra prerequisite (not faked)

EvyaSense Redis is filled by the Kafka pipeline from the **OCPP log-shipper**, which is still **missing from the repo**. Until shipper + Kafka + Redis are running:

- `GET /api/status` returns empty / zero ports for unknown chargers  
- SSE emits nothing  
- **Map still shows cold availability** from `mobilegetAllSites` (graceful degradation)

This step is **build-verified now**; **live** when the pipeline runs.

---

## 1. Correlation key (Backend only)

### Problem
EvyaSense keys Redis as `charger:{OCPPId}` / `connector:{OCPPId}:{connectorId}`.  
The map had `siteId` + port counts only — no OCPP id.

### Fields added to `GET /api/mobile/mobilegetAllSites` response (`GetSiteDetailsDto`)

| Field | Type | Source |
|---|---|---|
| **`chargerRefs`** | `Set<String>` | Distinct `station.OCPPId` for the site |
| **`ports`** | `List<{ chargerRef, connectorId, portId }>` | Each port with its station OCPP id + OCPP connector id + DB port pk |

SQL (parameterized aggregate, same query as before + two `STRING_AGG` subselects).

### Files
- `Backend/.../form/GetSiteDetailsDto.java` — fields + nested `PortRef`
- `Backend/.../serviceImpl/MobileAPIServiceImpl.java` — SELECT + row mapping

### Verify
`mvnw -DskipTests compile` → **BUILD SUCCESS** (exit 0)

---

## 2. Status API (EvyaSense, port 8080)

### Contracts

#### `GET /api/status?ids=<comma-sep chargerRefs>`
- **Max ids:** 500 (`LiveStatusService.MAX_IDS`)
- **Response:**
```json
{
  "success": true,
  "count": 2,
  "capped": false,
  "chargers": [
    {
      "chargerRef": "CP001",
      "chargerStatus": "online",
      "ports": [
        { "connectorId": "1", "status": "Available" },
        { "connectorId": "2", "status": "Charging" }
      ],
      "available": 1,
      "total": 2
    }
  ]
}
```
- Reads Redis only (no bbox, no geo).
- Missing chargers → empty ports, available/total 0.
- **Public** (`@CrossOrigin(origins="*")`); discovery data only.

#### `GET /api/status/stream?ids=<…>` (SSE)
- `Content-Type: text/event-stream`
- Events:
  - `connected` → `{ ok, watching }`
  - `status` → `{ chargerRef, connectorId, status }`
- Wired from `DataProcessorService.processStatusNotificationRequest` after Redis write via `StatusEventHub`.

### Supporting pieces
| Piece | Role |
|---|---|
| `LiveStatusService` | Batch snapshot + id parse/cap |
| `StatusEventHub` | SSE fan-out |
| `StatusController` | HTTP surface |
| `RedisService.trackConnectorId` / `getConnectorIdsForCharger` | Port list without SCAN |
| `DataProcessorService` | Publish on connector status change |

### Verify
`mvnw -DskipTests compile` (Java 17) → **BUILD SUCCESS** (exit 0)

---

## 3. evyaweb consumption

| File | Role |
|---|---|
| `src/services/statusApi.js` | Snapshot fetch, SSE, merge helpers |
| `src/hooks/useLiveStatus.js` | Lifecycle: cold paint → snapshot → SSE or poll 10s |
| `src/screens/HomeScreens/MapSection.jsx` | Renders `displayStations` from hook; clustering/click/user-location unchanged |
| `src/axios/Apis.jsx` | Passes through `chargerRefs` + `ports` from cold API |
| `.env.example` | `REACT_APP_STATUS_BASE_URL=` |

### Behavior
1. Bbox fetch returns stations (cold `available` / `avaiPorts`) → **markers paint immediately**.
2. Collect `chargerRefs` → `GET /api/status?ids=…` → merge into markers (icon via existing `createStationIcon`).
3. Open SSE `/api/status/stream?ids=…`; on error → **poll every 10s**.
4. On viewport change (`stationsWithCoordinates` changes) → tear down + resubscribe id set.
5. **If status base URL unset or service down:** hook never blanks; keeps cold data.

### Config
```bash
# .env (CRA)
REACT_APP_STATUS_BASE_URL=http://localhost:8080
# or https://sense.evyaa.com  — no trailing slash
```

### Verify
`npm run build` → **Compiled successfully.** (main JS ~195.56 kB gzip, +1.6 kB)

---

## 4. Degradation path (confirmed)

| Condition | Map behavior |
|---|---|
| `REACT_APP_STATUS_BASE_URL` empty | No status calls; cold availability only |
| Status service 5xx / network error | Snapshot returns null; stations unchanged |
| SSE fails | Falls back to 10s polling; if that fails too, cold data remains |
| Redis empty (no shipper) | Snapshot `available: 0, total: 0` → merge leaves cold counts when no port-level live data known |

**SCALE-3 is additive only** — cannot blank the map by design.

---

## Verify summary

| Project | Command | Result |
|---|---|---|
| Backend | `mvnw -DskipTests compile` | **BUILD SUCCESS** |
| EvyaSense | `mvnw -DskipTests compile` | **BUILD SUCCESS** |
| evyaweb | `npm run build` | **Compiled successfully** |

---

## Live when ready
1. Log-shipper → Kafka → EvyaSense consumer → Redis  
2. Deploy Backend with `chargerRefs`/`ports` on sites API  
3. Deploy EvyaSense with `/api/status`  
4. Set `REACT_APP_STATUS_BASE_URL` and rebuild/deploy web map  
5. Pan map → cold stations → icons update as connector status events flow  
