# STEP 8 / SCALE-1 — Viewport / BBox Fetch Report

**Date:** 2026-07-27  
**Scope:** Optional bbox filter on `GET /api/mobile/mobilegetAllSites` + evyaweb `MapSection` sends map bounds on debounced `moveend`  
**Backward-compat:** lat/lng path unchanged when bbox is absent (RN / legacy clients)

---

## Endpoint contract

```
GET /api/mobile/mobilegetAllSites
```

### Existing params (unchanged)

| Param | Required | Notes |
|---|---|---|
| `latitude` | no | With `longitude`, applies **legacy** distance filter (≈10 km HAVING) |
| `longitude` | no | Pair with `latitude` |
| `powerType` | no | Filter |
| `connectorTypes` | no | Filter |
| `status` | no | ACTIVE / inactive style |
| `powerRange` | no | e.g. `min-max` |
| `priceRange` | no | e.g. `min-max` |
| `search` | no | Site name / address LIKE |

### New optional params (SCALE-1)

| Param | Required | Notes |
|---|---|---|
| **`minLat`** | no* | South edge of viewport |
| **`minLng`** | no* | West edge |
| **`maxLat`** | no* | North edge |
| **`maxLng`** | no* | East edge |
| **`limit`** | no | Max rows; default **500** when bbox is used; hard cap **2000** |

\* All four of `minLat`, `minLng`, `maxLat`, `maxLng` must be present **and** valid (`min ≤ max`) to enable bbox mode.

### Behavior matrix

| Client sends | Server path |
|---|---|
| Full bbox (`minLat`…`maxLng`) | **Viewport filter** on `site_location` (parameterized `BETWEEN`); optional `limit` / default 500. Lat/lng distance HAVING **not** applied. |
| `latitude` + `longitude` only | **Legacy** radius path (existing 10 km HAVING + distance sort). Unchanged. |
| Neither | All sites matching filters/search (same as before when no location). |
| Bbox + lat/lng | **Bbox wins** (viewport mode). |

### SQL safety (SEC-4c)
Bbox corners are bound as named parameters (`:minLat`, `:minLng`, `:maxLat`, `:maxLng`) — no string concatenation of coordinates.

### Example
```http
# Viewport (evyaweb after pan)
GET /api/mobile/mobilegetAllSites?minLat=17.35&minLng=78.40&maxLat=17.48&maxLng=78.55&limit=500

# Legacy / RN-style center (still works)
GET /api/mobile/mobilegetAllSites?latitude=17.41&longitude=78.47
```

---

## Backend files

| File | Change |
|---|---|
| `MobileAPIController.java` | Optional request params `minLat/minLng/maxLat/maxLng/limit` |
| `MobileAPIService.java` | Signature extended |
| `MobileAPIServiceImpl.java` | Bbox `WHERE` + `setMaxResults` when limited; legacy distance path only if no bbox |

### RN note
Native app `Apis.js` calls **`/station/getstations`**, not `mobilegetAllSites`. Web map uses `mobilegetAllSites`. Bbox is **optional**, so any future RN caller of the mobile sites endpoint keeps working with lat/lng only.

---

## evyaweb files

| File | Change |
|---|---|
| `src/screens/HomeScreens/MapSection.jsx` | `MapMoveListener` reads `map.getBounds()`, emits bbox; **debounce 400 ms**; `fetchStationsWithParams` prefers bbox |
| `src/axios/Apis.jsx` | Sends `minLat/minLng/maxLat/maxLng` (+ optional `limit`) when present |
| `src/redux/StationsSlice.jsx` | Passes `limit` through |

### Debounce
**`MAP_MOVE_DEBOUNCE_MS = 400`** (within requested 300–500 ms).  
Previous default was 1500 ms.

### Preserved
- Marker clustering (`MarkerClusterGroup`)
- Marker click → select / cards / fly-to
- User-location marker outside cluster
- Filter tabs still re-fetch with current location (bbox if last move provided it)

---

## Verify

| Check | Result |
|---|---|
| `JAVA_HOME=…/jdk-17` + `mvnw -DskipTests compile` | **BUILD SUCCESS** (exit 0) |
| `npm run build` (evyaweb) | **Compiled successfully.** |
| Main JS gzip | ~194.16 kB (+520 B vs SCALE-2 cluster build) |
| Local backend runtime | Not running on :8080 this session |
| Remote `server.evyaa.com` | 502 (not usable for live bbox probe) |
| Docker `evya-mssql` | Up (ready for local server runtime test) |

### Suggested runtime smoke (local backend + DB)
```bash
# After starting Backend/Server against local MSSQL:
# Legacy still works:
curl "http://localhost:<port>/api/mobile/mobilegetAllSites?latitude=17.41&longitude=78.47"

# Bbox returns only sites inside box:
curl "http://localhost:<port>/api/mobile/mobilegetAllSites?minLat=17.3&minLng=78.3&maxLat=17.5&maxLng=78.6&limit=20"
```

---

## Summary for handoff
- **Bbox is optional** → fully backward-compatible with radius/lat-lng callers.  
- **Debounce:** 400 ms on `moveend`.  
- **Default viewport cap:** 500 sites when bbox is used (override with `limit`, max 2000).  
- Clustering / clicks / user location unchanged.
