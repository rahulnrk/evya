# EVYA API Contract Map

**Generated:** 2026-07-26 (Phase 0.2)  
**App source of truth:** `evya-native-main (1)/evya-native-main/src/axios/Apis.js`  
**Backends:** `Backend/Server` (`com.ewe`), `evya-ocpp-main (1)/evya-ocpp-main` (`com.test.ocpp`)

## Base URL legend

| Alias | Runtime value (app) | Service |
|-------|---------------------|---------|
| `BASE_URL` / `apiClient` | `https://server.evyaa.com/api/mobile` | Backend MobileAPI + PhonePe |
| `baseurl` | `https://server.evyaa.com/services` | Backend shared services |
| `OCPP_URL` | `https://ocpp.evyaa.com/ocpp` | OCPP MessagesController |

**Resolves column:** Y = method + path exist on a controller; N = no matching route; PARTIAL = path exists but param/method/privilege mismatch or app does not actually call network.

---

## Auth & user

| # | App export / caller | Method | App path | Base | Request shape | Caller screens | Backend mapping | Resolves? | Notes |
|---|---------------------|--------|----------|------|---------------|----------------|-----------------|-----------|-------|
| 1 | `sendOtp` | GET (intended) | `/otp/{phoneNo}` | mobile | path phone (10 digits) | `login-screen.tsx` via Redux `sendOtp` | `MobileAPIController` GET `/api/mobile/otp/{phoneNo}` | **PARTIAL** | **Stubbed client-side** — never hits network; real impl commented (~214–252) |
| 2 | `verifyOtp` | POST (intended) | `/otp/verify?otp=` | mobile | query `otp` only | `login-screen.tsx` via Redux `verifyOtp` | POST `/api/mobile/otp/verify` `@RequestParam String otp` | **PARTIAL** | **Stub returns `{userId:3}`**; backend exists but only matches OTP globally (no phone binding) |
| 3 | `registerUser` | POST | `/userRegistartion` | mobile | user JSON body | auth registration flow / AuthSlice | POST `/api/mobile/userRegistartion` | **Y** | Typo “Registartion” shared both sides |
| 4 | `updateProfile` / put update | PUT | `/updateUserDetails` | mobile | user body (+ optional config) | AuthSlice, profile | PUT `/api/mobile/updateUserDetails` | **Y** | Duplicated via raw axios and apiClient |
| 5 | `getUserDetails` | GET | `/userDetails/{userId}` | mobile | path id | AuthSlice after login | GET `/api/mobile/userDetails/{id}` | **Y** | |
| 6 | `addAddress` | POST | `/addAddress/{userId}` | mobile | address body | address screens | POST `/api/mobile/addAddress/{userId}` | **Y** | |
| 7 | `deleteAddress` | DELETE | `/deleteAddress/{AddressId}` | mobile | path id | account/address | DELETE `/api/mobile/deleteAddress/{addressId}` | **Y** | |

---

## Wallet & payments

| # | App export | Method | App path | Base | Request | Callers | Backend | Resolves? | Notes |
|---|------------|--------|----------|------|---------|---------|---------|-----------|-------|
| 8 | `getWalletDetails` | GET | `/walletDetails/{userId}` | mobile | path | wallet screens | GET `/api/mobile/walletDetails/{userId}` | **Y** | |
| 9 | `getWalletTransactions` | GET | `/walletTransactions/{walletId}` | mobile | path accId | wallet | GET `/api/mobile/walletTransactions/{accId}` | **Y** | App param name `walletId` = backend `accId` |
| 10 | `createPaymentTransaction` | POST | `/add_payment` | mobile | body amount/user | payment helpers | POST `/api/mobile/add_payment` | **Y** | Razorpay-era path still present |
| 11 | `handlePaymentCallback` | POST | `/handle-payment-callback` | mobile | callback body | payment helpers | POST `/api/mobile/handle-payment-callback` | **Y** | |
| 12 | `createPhonePePayment` | POST | `/pay` | mobile | PhonePe request body | `AddMoney.tsx` | `PhonePeController` POST `/api/mobile/pay` | **Y** | |
| 13 | `checkPhonePeStatus` | GET | `/verify/{merchantOrderId}` | mobile | path order id | `AddMoney.tsx` | GET `/api/mobile/verify/{merchantOrderId}` | **Y** | Credits wallet on verify |

---

## RFID

| # | App export | Method | App path | Base | Request | Callers | Backend | Resolves? | Notes |
|---|------------|--------|----------|------|---------|---------|---------|-----------|-------|
| 14 | `requestRFID` | POST | `/rfid/request/{userId}` | services | RFID request body | `RFIDScreen.tsx` | POST `/services/rfid/request/{userId}` | **Y** | |
| 15 | `getUserRFIDs` | GET | `/rfid/SingleUserRfid/{userId}` | services | path | RFID lists (also used by getRequested/getActive wrappers) | GET `/services/rfid/SingleUserRfid/{userId}` | **Y** | Called twice via wrappers (STATE-2 note) |
| 16 | `toggleRFIDStatus` | POST | `/rfid/toggle-status/{rfid}` | services | path id | RFID UI | POST `/services/rfid/toggle-status/{id}` | **Y** | Path param name differs (`rfid` vs `id`) — value is the same slot |

---

## Stations / sites

| # | App export | Method | App path | Base | Request | Callers | Backend | Resolves? | Notes |
|---|------------|--------|----------|------|---------|---------|---------|-----------|-------|
| 17 | `getStations` | GET | `/station/getstations` | services | query: lat/lng, filters, search, from, to | `stationsSlice`, home/map | GET `/services/station/getstations` | **Y** | Loads broad set (SCALE-1) |
| 18 | `getStationDetails` (×2 helpers) | GET | `/station/stationDetails/{stationId}` | services | path | station-details | GET `/services/station/stationDetails/{id}` | **Y** | Duplicate wrappers in Apis.js |
| 19 | `getSiteDetailsBySiteId` (Details) | GET | `/Details?siteId=` | mobile | query siteId | station details | GET `/api/mobile/Details?siteId=` | **Y** | |
| 20 | `getSiteDetails` | GET | `/site/siteDetails/{siteId}` | services | path | site flows | GET `/services/site/siteDetails/{id}` | **Y** | |
| 21 | `getPortStatusDetails` | GET | `/station/{portId}/status-details` (+ optional `calculationTime`) | services | path + query | check-in / pricing | GET `/services/station/{portId}/status-details` | **Y** | |
| 22 | `getPortStatus` | GET | `/station/status/{portId}` | services | path | connect/status | GET `/services/station/status/{portId}` | **Y** | |
| 23 | `calculateEnergy` | POST | `/calculate?portCapacity=&pricePerUnit=` | mobile | query + body | check-in pricing | POST `/api/mobile/calculate` | **Y** | |
| 24 | `addFavoriteStation` | POST | `/site/addFavSite/{userId}` | services | body with siteId | favorites | POST `/services/site/addFavSite/{userId}` + `AddFavSiteDTO` | **Y** | |
| 25 | `getFavoriteStations` | GET | `/site/getFavSite/user/{userId}` | services | path | favorites | GET `/services/site/getFavSite/user/{userId}` | **Y** | |
| 26 | `deleteFavoriteStation` | DELETE | `/site/deleteFavSite/{userId}` | services | path userId only | favorites | DELETE `/services/site/deleteFavSite/{userId}` | **PARTIAL** | **App takes `stationId` but does not send it**; backend deletes **all** favs for user |
| 27 | `requestFranchise` | POST | `/station/request-franchise` | services | franchise JSON | `request-franchise-screen.tsx` | POST `/services/station/request-franchise` | **Y** | |
| 28 | `getRequestedFranchises` | GET | `/station/requestedFranchise/user/{userId}` | services | path | `my-franchises-screen.tsx` | GET `/services/station/requestedFranchise/user/{userId}` | **Y** | |

---

## Vehicles

| # | App export | Method | App path | Base | Request | Callers | Backend | Resolves? | Notes |
|---|------------|--------|----------|------|---------|---------|---------|-----------|-------|
| 29 | `fetchBrands` | GET | `/evBrand` | mobile | — | `add-vehicle.tsx` | GET `/api/mobile/evBrand` | **Y** | |
| 30 | `addVehicle` | POST | `/addEV` | mobile | vehicle body | `add-vehicle.tsx` | POST `/api/mobile/addEV` | **Y** | |
| 31 | `getUserVehicles` | GET | `/myEV/{userId}` | mobile | path | AuthSlice, vehicle lists | GET `/api/mobile/myEV/{userId}` | **Y** | |
| 32 | `decodeVin` | GET | NHTSA external | external | VIN path | `add-vehicle.tsx` | n/a | **Y** (ext) | `vpic.nhtsa.dot.gov` — not EVYA backend |

---

## Support tickets

| # | App export | Method | App path | Base | Request | Callers | Backend | Resolves? | Notes |
|---|------------|--------|----------|------|---------|---------|---------|-----------|-------|
| 33 | `getTickets` | GET | `/issues/tickets/user/{UserId}` | services | path | `help.tsx` | GET `/services/issues/tickets/user/{userId}` | **Y** | |
| 34 | `createTicket` | POST | `/issues/createticket` | services | IssuesDto body | `help.tsx`, `login-screen.tsx` (userId:0) | POST `/services/issues/createticket` | **Y** | Login hardcodes userId 0 (BUG-7) |
| 35 | `deleteTicket` | DELETE | `/issues/tickets/{ticketId}` | services | path | `help.tsx` | `@DeleteMapping("/{id}")` → `/services/issues/{id}` | **N** | **Path mismatch:** app expects `/tickets/{id}`; backend is `/{id}` only |

---

## OCPP (HTTP)

| # | App export | Method | App path | Base | Request | Callers | OCPP controller | Resolves? | Notes |
|---|------------|--------|----------|------|---------|---------|-----------------|-----------|-------|
| 36 | `occprequests` | POST | `/request` | ocpp | OCPPForm body (ReserveNow, RemoteStart, etc.) | station-details / charge flow | POST `/ocpp/request` → `features()` | **Y path / WRONG privilege** | **Should use `/ocpp/app/request`** (`appFeatures`) per SEC-8; privileged set includes Reset/Firmware/etc. |
| 37 | reservation by id | GET | `/reservation?reservationId=` | ocpp | query | bookings | GET `/ocpp/reservation` | **Y** | |
| 38 | reservations total | GET | `/reservations/total?userId=` | ocpp | query | bookings | GET `/ocpp/reservations/total` | **Y** | |
| 39 | reservations upcoming | GET | `/reservations/upcoming?userId=` | ocpp | query | bookings | GET `/ocpp/reservations/upcoming` | **Y** | |
| 40 | reservations completed | GET | `/reservations/completed?userId=` | ocpp | query | bookings | GET `/ocpp/reservations/completed` | **Y** | |
| 41 | reservations cancelled | GET | `/reservations/cancelled?userId=` | ocpp | query | bookings | GET `/ocpp/reservations/cancelled` | **Y** | |
| 42 | reservations by port | GET | `/reservations/by-port?portId=` | ocpp | query | check-in | GET `/ocpp/reservations/by-port` | **Y** | |
| 43 | `getMeterValues` | GET | `/metervalues?transactionId=` | ocpp | query | `charging-screen.tsx` (poll ~30s) | GET `/ocpp/metervalues` | **Y** | |

OCPP also exposes (not listed as app call sites in Apis.js): `/ocpp/app/request`, `/stop-transaction`, `/activetransaction`, station log download routes.

---

## WebSocket (chargers only — not app HTTP)

| Path | Service | Notes |
|------|---------|-------|
| `WS /ocpp16/{clientId}` | evya-ocpp | Charger OCPP 1.6; handshake interceptor permits all; `clientId` from URL |

---

## CMS → backend (not full table; inventory pointers)

CMS uses `AxiosServices.jsx` against:

- `baseURL` = `http://localhost:8800` (prod comment `server.evyaa.com`)
- `baseOCPPURL` = `https://ocpp.evyaa.com`
- `baseAlertsURL` = `http://35.154.169.228:8080/`

CMS login hits `login/authenticate` (Backend `LoginController`) — returns user entity **without JWT** (SEC-2). Client still sets `Authorization: Bearer ${authToken}`.

---

## Mismatch / defect summary

| Severity | Item | Detail |
|----------|------|--------|
| 🔴 Contract dead | OTP send/verify | Client stubs; no network call to existing backend routes |
| 🔴 Privilege | `occprequests` → `/ocpp/request` | Uses admin feature set instead of `/ocpp/app/request` |
| 🟠 Path | `deleteTicket` | App `/issues/tickets/{id}` vs backend `/issues/{id}` |
| 🟠 Semantics | `deleteFavoriteStation` | `stationId` ignored; deletes all favorites for user |
| 🟠 Auth | All app calls | No Bearer token interceptor (TODO in Apis.js) |
| 🟡 Naming | walletId vs accId | Works if same numeric id |
| 🟡 Duplicate helpers | stationDetails ×2 | Same path, two exports |

## Coverage stats (app live network paths)

| Category | Count | Y | PARTIAL | N |
|----------|-------|---|--------|---|
| Backend mobile+services | ~35 | ~30 | 3 (OTP×2 stub, fav delete) | 1 (ticket delete path) |
| OCPP HTTP | 8 | 8 path | 1 privilege wrong | 0 missing path |
| External | 1 | 1 | — | — |

**Bottom line:** Nearly all active app URLs resolve to real controllers (as workorder claimed). Failures cluster on **auth stubs**, **one ticket DELETE path**, **favorite delete semantics**, and **wrong OCPP privilege endpoint**.

---

## How to re-verify

```powershell
# App call sites
Select-String -Path "evya-native-main (1)\evya-native-main\src\axios\Apis.js" -Pattern "axios\.(get|post|put|delete)|apiClient\.(get|post|put|delete)"

# Backend routes
Select-String -Path "Backend\Server\src\main\java\com\ewe\controller\*.java" -Pattern "@(Get|Post|Put|Delete|Request)Mapping"

# OCPP routes
Select-String -Path "evya-ocpp-main (1)\evya-ocpp-main\src\main\java\com\test\ocpp\controller\*.java" -Pattern "@(Get|Post|Put|Delete|Request)Mapping"
```
