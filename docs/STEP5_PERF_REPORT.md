# STEP 5 — Smoothness quick wins (PERF-2 + PERF-6)

**Date:** 2026-07-27

## Verify

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` error count | **261** (matches prior ~261 baseline; no increase after Image import fix) |
| Metro bundle android `dev false` | **Done writing bundle output** (exit 0) |
| Bundled `src/assets/images` total | **~2.3 MB** (was ~7.2–8.3 MB) |

---

## PERF-2 — `unmountOnBlur: false`

**File:** `src/routes/app-navigation.tsx`

- Changed `unmountOnBlur: true` → `unmountOnBlur: false` so bottom-tab stacks (including Home/Map WebViews → evyaweb Leaflet) stay mounted.

### Screens adjusted for refetch side effects

| Screen | Adjustment |
|--------|------------|
| **`wallet-card-and-transactions.tsx`** | Focus refetch now uses a **60s TTL** (`lastFetchAtRef`). Pull-to-refresh and route-param refresh still force fetch. Avoids wallet API storm when switching tabs with tabs kept alive. |
| **`home-screen.tsx`** | **No change** — existing `useFocusEffect` only calls `getUserDetails` when user payload is empty (already safe under keep-alive). |

No other tab screens had remount-only refetch that needed a TTL tweak for this step. Broader caching remains STEP 6 (RTK Query).

---

## PERF-6 — Right-size assets + remote cache

### Bundled PNG compression (same paths / requires)

In-place resize + optimize under `src/assets/images/` (54/63 files shrunk). Worst offenders:

| Asset | Before | After |
|-------|--------|-------|
| `chargingstation.png` | ~1902 KB | ~149 KB |
| `chargers/hpcl.png` | ~738 KB | ~107 KB |
| `chargers/incl.png` | ~695 KB | ~80 KB |
| `chargers/bpcl.png` | ~667 KB | ~82 KB |
| `home/banner.png` | ~517 KB | ~55 KB |

**Total folder size: ~2.3 MB** (from ~7.2+ MB).

Import paths unchanged (`require(...)` still valid).

### Remote / brand imagery

- Added dep: **`react-native-fast-image`**
- New helper: `src/components/cached-remote-image.tsx`
  - FastImage + disk cache for `http(s)` URIs
  - Optional CDN query hints (`w`, `h`, `fm=webp`) via `withCdnResize`
- Wired for remote vehicle/device images:
  - `screens/devices/vehicle-list.tsx`
  - `screens/devices/vehicle.tsx`
  - `screens/devices/devices-list.tsx`

Native rebuild required for FastImage on device (`pod install` / gradle) after this JS change.

---

## Note on tsc

Pre-existing project debt remains (~261 errors). `unmountOnBlur` typing noise on navigation options is pre-existing (option type mismatch with React Navigation 7). No intentional new app-logic type errors introduced by STEP 5.
