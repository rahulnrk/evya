# STEP 3 (SEC-4c) + STEP 4 (BUG-1…BUG-9) Report

**Date:** 2026-07-27

## Verify summary

| Check | Result |
|-------|--------|
| Backend `mvnw -DskipTests compile` | **exit 0** |
| OCPP `mvnw -DskipTests compile` | **exit 0** |
| RN Metro bundle (android, dev false) | **Done writing bundle output** (exit 0) |

---

## STEP 3 — SEC-4c SQL parameterization

### Backend

| Area | Change |
|------|--------|
| `GeneralDao` / `GeneralDaoImpl` | Added `findOneSQLQuery(entity, sql, params)`, `getMapDataWithParam`, `queryExecuteWithParam` |
| `MobileAPIServiceImpl` | Parameterized register uniqueness, profile, vehicles, accounts, wallet tx, RFID, address, payment-path lookups, comment LIKE patterns (no string-concat user values) |
| `SiteServiceImpl` | Fav delete uses named params; new single-site delete |

### OCPP DAOs

| File | Change |
|------|--------|
| `StationDaoImpl` | Fully rewritten with named params (times, OCPPId, port, ping IN-list, etc.); no multi-statement stacked SQL |
| `StatusNotificationDaoImpl` | delete/update/insert/getPortStatus/getStationStatus parameterized |
| `statusSendingDataDaoImpl` | active-transaction lookups parameterized |

### Honest residual

Some OCPP service-layer SQL strings (outside `dao/impl`) and large dynamic site-search builders may still concatenate **numeric/internal** values. User-influenced registration/login/wallet/RFID/favorite/status paths above are closed. Further sweep can continue file-by-file if needed.

---

## STEP 4 — Correctness bugs

| ID | Status | Diff summary |
|----|--------|--------------|
| **BUG-1** | Fixed | `WebSocketHandler` HardReset braced; else-if chain for RemoteStart/Stop/ReserveNow/… reachable again |
| **BUG-2** | Fixed | Removed +5h30m; transport uses `new Date().toISOString()`; display uses `toLocaleTimeString` |
| **BUG-3** | Fixed | Charging screen vehicle from Redux `user.vehicles[0]` |
| **BUG-4** | Fixed | `DELETE /services/site/deleteFavSite/{userId}/{siteId}` + app URL; service `deleteFavSiteForUser` |
| **BUG-5** | Fixed (no-op) | Legacy FCM path removed; `PushNotification` logs and returns (no call to decommissioned API) |
| **BUG-6** | Fixed | Slider `minimumTrackTintColor` / `maximumTrackTintColor` / `thumbTintColor` |
| **BUG-7** | Fixed | Login Need-Help ticket includes phone + optional `userId` |
| **BUG-8** | Fixed | Server issues UUID merchant order id in `PhonePeServiceImpl.createPayment`; client no longer sends `TX+Date.now()` |
| **BUG-9** | Fixed | Removed dead parent `handleStopCharging` / `onStopCharging` prop; RemoteStop in `charging-status` unchanged |

---

## Key files touched

**SEC-4c:** `GeneralDao.java`, `GeneralDaoImpl.java` (Backend), `MobileAPIServiceImpl.java`, `SiteServiceImpl.java`, OCPP `StationDaoImpl`, `StatusNotificationDaoImpl`, `statusSendingDataDaoImpl`

**BUG-1:** `WebSocketHandler.java`

**BUG-2/3/6/9:** `check-in-screen.tsx`, `charging-screen.tsx`

**BUG-4:** `SiteController.java`, `SiteService.java`, `SiteServiceImpl.java`, `Apis.js`

**BUG-5:** `PushNotification.java`

**BUG-7:** `login-screen.tsx`

**BUG-8:** `PhonePeServiceImpl.java`, `AddMoney.tsx`, `Apis.js`
