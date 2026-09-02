# STEP 7 — Frontend Perf Polish Report

**Date:** 2026-07-27  
**Scope:** PERF-4 (re-renders), PERF-5 (list virtualization), PERF-7 (logging + dead deps)  
**App root:** `evya-native-main (1)/evya-native-main`  
**Out of scope (by design):** PERF-1 native map rewrite (WebView map is the path; scale work is STEP 8 / evyaweb); PERF-3 live-charging WebSocket (needs backend relay + charger).

---

## Verify

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **225 errors** (≤ 233 STEP-6 baseline) ✓ |
| Metro Android prod bundle | **Done writing bundle output** ✓ |
| DB required? | No |

---

## PERF-4 — Re-render fixes

### Atomic / stable auth selectors
| File | Change |
|---|---|
| `src/hooks/useAuth.ts` | Atomic `useAppSelector` per field (no object-literal selector); `useMemo` on returned API object |
| `src/screens/home/home-screen.tsx` | Uses `useAuth()` (atomic); **removed `useFocusEffect` refetch** → one-shot `useEffect` when `user` missing (not every tab focus) |

### RTK Query already covers focus refetch
No manual `useFocusEffect` left on wallet / vehicles / stations / RFID (RTK `refetchOnFocus` + cache).  
Did **not** touch remaining Apis.js screens.

### Memoized expensive rows
| Component | File |
|---|---|
| `TransactionItem` | `wallet-card-and-transactions.tsx` (`React.memo`) |
| `ScheduleCard` | `bookings-list.tsx` (`React.memo` + stable `renderItem` / `getItemLayout`) |
| Station list `renderItem` | `StationList.tsx` (`useCallback`) |
| Home children | Already `React.memo(CarList / MapSection / FilterTabs)` |

---

## PERF-5 — List virtualization (ScrollView + `.map` → FlatList)

| Screen | Before | After |
|---|---|---|
| **Recent transactions** | FlatList (already) | `getItemLayout`, stable `renderItem` / `keyExtractor`, windowing |
| **Bookings list** | FlatList (already) | memo row + `getItemLayout` + windowing |
| **My franchises** | `RootScroll` + `franchises.map` | **`FlatList`** + pull-to-refresh |
| **Store (EV catalog)** | `ScrollView` + grid `.map` rows | **`FlatList` `numColumns={2}`** |
| **Payment methods** | `ScrollView` + `paymentMethods.map` | **`FlatList`** + header/footer sections |
| **Account menu** | `View` + `menuItems.map` | **`FlatList`** + profile header / logout footer |
| **Book a charger (time slots)** | `ScrollView` + `timeSlots.map` | **`FlatList` `numColumns={4}`** |
| **Station details (charger tabs)** | horizontal `ScrollView` + `.map` | **horizontal `FlatList`** |
| **Add vehicle (brand/model/variant)** | `.map` inside scroll | **`FlatList`** per selection step |

Already-virtualized (left as improved FlatList, not ScrollView converts): wallet recent slice, vehicle-list, StationList, RFID tabs, Address list, Help tickets.

---

## PERF-7 — Logging + dead deps

### Console strip (release only)
- **Plugin:** `babel-plugin-transform-remove-console` (devDependency)
- **Config:** `babel.config.js` → `env.production.plugins` with `{ exclude: ['error', 'warn'] }`
- Dev / Metro debug builds keep all `console.*`; release strip drops `log` / `debug` / `info`.

### Dependencies removed (verified zero live imports)
| Package | Why removed |
|---|---|
| **`react-native-razorpay`** | No import in app; payments go through WebView / PhonePe redirect |
| **`react-native-get-location`** | No import; location uses `react-native-geolocation-service` |

### Flagged — **not** removed (future native-map path may want them)
| Package | Status |
|---|---|
| **`react-native-maps`** | Only commented-out code (`map-section`, `map-screen`, `routescreen`); keep for possible native map |
| **`@mapbox/polyline`** | Only commented-out route polyline decode; keep pending native-map decision |

---

## Files touched (summary)

**PERF-4:** `useAuth.ts`, `home-screen.tsx`, `wallet-card-and-transactions.tsx`, `bookings-list.tsx`, `StationList.tsx`  
**PERF-5:** `my-franchises-screen.tsx`, `store-screen.tsx`, `Paymentmethods.tsx`, `account.tsx`, `book-a-charger-screen.tsx`, `station-details-screen.tsx`, `add-vehicle.tsx`, `recent-transaction-list-screen.tsx`  
**PERF-7:** `babel.config.js`, `package.json` / lock (plugin + 2 dep removals)

---

## Notes for later steps
1. **STEP 8 / evyaweb:** map clustering + viewport fetch (scale) — not this step.
2. **PERF-3:** live charging WebSocket needs backend relay + charger E2E.
3. **Native rebuild** still needed for `react-native-fast-image` (STEP 5) and after any native-module dep changes in a full APK build.
