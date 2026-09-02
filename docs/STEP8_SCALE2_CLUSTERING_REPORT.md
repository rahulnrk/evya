# STEP 8 / SCALE-2 — Marker Clustering Report

**Date:** 2026-07-27  
**Project:** `evyaweb-main (1)/evyaweb-main` (`web.evyaa.com` map app)  
**Scope:** Client-side marker clustering only (no data-fetch / bbox changes — those are SCALE-1)

---

## Baseline (before changes)

```text
cd "evyaweb-main (1)/evyaweb-main"
npm install
npm run build
```

| Check | Result |
|---|---|
| `npm install` | OK (1435 packages) |
| `npm run build` | **Compiled successfully.** |
| Main JS (gzip) | **183.71 kB** (`main.7981a00f.js`) |
| Main CSS (gzip) | **6.49 kB** |
| Main JS (raw) | 590,727 bytes |
| Main CSS (raw) | 15,201 bytes |

---

## SCALE-2 change

### Problem
`src/screens/HomeScreens/MapSection.jsx` rendered **every** station as an individual Leaflet `<Marker>` via `stations.map(...)` — no clustering, sluggish past ~1K markers.

### Solution
Wrap station markers in **`MarkerClusterGroup`** (`react-leaflet-cluster` → Leaflet.markercluster):

| Zoom / behavior | Result |
|---|---|
| Low zoom | Count bubbles (`createClusterIcon`) |
| High zoom (`disableClusteringAtZoom={16}`) | Individual station markers |
| Max zoom spiderfy | Overlapping markers fan out |

### Preserved behavior
| Behavior | Status |
|---|---|
| Marker click → `handleMarkerClick` (select + card + fly-to) | Unchanged handlers on each `Marker` |
| `moveend` refetch via `MapMoveListener` → `handleMapLocationChange` → `fetchStationsWithParams` | Untouched (SCALE-1 later) |
| User-location marker (`UserLocationMarker`) | **Outside** cluster group — always shown |
| Status-based icons (`createStationIcon` availability badge / BPCL-HPCL logos) | Unchanged per-marker icons |

### Files
| File | Change |
|---|---|
| `src/screens/HomeScreens/MapSection.jsx` | Import cluster CSS + wrap markers in `MarkerClusterGroup` |
| `src/screens/HomeScreens/MapUtils.js` | Add `createClusterIcon` (EVYA gradient count bubble) |
| `package.json` | New deps (below) |

### New dependencies
| Package | Version | Role |
|---|---|---|
| **`react-leaflet-cluster`** | `^4.1.3` | React-Leaflet v5 / React 19 wrapper |
| **`leaflet.markercluster`** | `^1.5.3` | Underlying clustering engine (peer) |

---

## Verify (after)

| Check | Result |
|---|---|
| `npm run build` | **Compiled successfully.** |
| Main JS (gzip) | **193.87 kB** (+**10.16 kB** vs baseline) |
| Main CSS (gzip) | **6.71 kB** (+**221 B**) |
| Main JS (raw) | 627,239 bytes (+36,512 / ~+6.2%) |
| Main CSS (raw) | 16,398 bytes (+1,197) |

### Behavior confirmation (code-path review)
- **Marker click / popup-select path:** still `eventHandlers.click` → `handleMarkerClick(station, index)` (cards + fly-to).
- **moveend refetch:** `MapMoveListener` still registered on the map; fetch params path unchanged.
- **User location:** rendered as sibling of `MarkerClusterGroup`, not clustered.
- **No fetch-layer changes:** `fetchStations` / radius / filters left as-is for SCALE-1.

---

## Out of scope (next slices)
- **SCALE-1:** viewport / bbox fetch (retire radius “get all”)
- **SCALE-3 (workorder):** live status plane from EvyaSense Redis  
  *(Workorder also labels a vector-tile path as SCALE-2 for 100K+; this slice is the **client clustering** called out in STEP 8 / map sluggishness.)*

---

## How to smoke-test in browser
1. `npm start` in `evyaweb-main`
2. Open `/mapsection` (or host root via `FixedMapContainer`)
3. Zoom out → count bubbles; zoom in → individual markers expand
4. Click a marker → station card selects / map flies
5. Pan map → network still fires station refetch after debounce (same as before)
