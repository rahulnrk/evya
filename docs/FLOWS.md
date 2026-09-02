# EVYA Critical Flows

**Generated:** 2026-07-26 (Phase 0.3)  
**Paths:** `evya-native-main (1)/evya-native-main` unless noted.

---

## (a) Login: phone → OTP → session → landing

### Sequence

| Step | What happens | File:line (approx) | Network / storage |
|------|--------------|--------------------|-------------------|
| 0 | App boots → `RootNav` stack: Splash → Onboarding / Auth / App | `src/routes/root-navigation.tsx:33-41` | — |
| 1 | Splash waits for `AppContext` load, then **1s** timeout | `screens/splash/splash-screen.tsx:18-29` | Reads AsyncStorage via context init |
| 2 | If `isAuthenticated` → App tabs; else if `onBoarded` → Auth; else Onboarding | `splash-screen.tsx:22-28` | Auth = presence of AsyncStorage key `ID` |
| 3 | Context init loads `ID` + `onBoard` keys | `contexts/app-context.tsx:63-91` | AsyncStorage |
| 4 | User enters phone; **Get OTP** → Redux `sendOtp` | `login-screen.tsx:273-295` → `AuthSlice.js:101-115` | **No real network** — `Apis.js` stub `sendOtp` (~148-188) |
| 5 | On stub success: `otpSent=true`, UI moves to 4-digit OTP step | `login-screen.tsx:180-184`; `AuthSlice` sendOtp.fulfilled | Timer `timer: 60` in auth state |
| 6 | User enters 4 digits; **Verify** → Redux `verifyOtp` | `login-screen.tsx:300-316` → `AuthSlice.js:117-131` | **No real network** — stub returns `{ userId: 3 }` (`Apis.js:189-211`) |
| 7 | `verifyOtp.fulfilled`: `otpVerified=true`, `userId` from payload, `isAuthenticated=true` | `AuthSlice.js:259-264` | Redux only |
| 8 | Effect on `otpVerified && userId`: | `login-screen.tsx:106-175` | |
| 8a | `AsyncStorage.setItem(ID, userId)` | `login-screen.tsx:114` | Key `ID` (`constants/dimensions.ts:5`) |
| 8b | `context.login(userId)` re-writes storage + sets context auth | `login-screen.tsx:115`; `app-context.tsx:106+` | Dual write: screen + context |
| 8c | `dispatch(getUserDetails(userId))` | `login-screen.tsx:119` | **Network:** GET `/api/mobile/userDetails/{id}` + GET `/api/mobile/myEV/{id}` |
| 8d | Toast success; after **500ms** navigate: | `login-screen.tsx:127-159` | |
| | • vehicles.length > 0 → `navigation.reset` to App tabs | | |
| | • else → Add Vehicle stack | | |

### Auth state storage (login)

| Store | Fields written at login | Owner |
|-------|-------------------------|--------|
| Redux `auth` | `userId`, `isAuthenticated`, `otpVerified`, `mobileNumber`, later `user`/`vehicles`/`address`/`account` | `AuthSlice.js` |
| AppContext | `isAuthenticated`, `userId` | `app-context.tsx` |
| AsyncStorage | `ID` = userId string; `onBoard` = onboarding flag | Splash routing depends on these |

**No JWT / session token is stored or attached to axios** (`Apis.js:16-28` TODO).

### Intended (commented) real OTP path

| Step | Call | Backend |
|------|------|---------|
| Send | GET `/api/mobile/otp/{phoneNo}` | `MobileAPIController` ~58 |
| Verify | POST `/api/mobile/otp/verify?otp=` (**otp only**, no phone) | `MobileAPIController` ~95-97 |

### Timers / delays (login)

| Delay | Where | Purpose |
|-------|-------|---------|
| 1000 ms | Splash | Brand flash before route decision |
| 60 s | Auth `timer` | OTP resend countdown (UI) |
| 500 ms | Post-login navigate | Toast visibility |

### Gaps vs secure design

- OTP not bound to phone on server (when real path restored).
- Stub always authenticates as `userId: 3`.
- Need-help from login creates ticket with `userId: 0` (`login-screen.tsx:347-350`).

---

## (b) Charge: select → pay/book → connect → RemoteStart → live → stop

Two entry paths from station details:

1. **Connect / pay & charge** — immediate charge  
2. **Book Now** → book flow → later check-in with reservation  

Focus below is **pay & charge** (primary live path). Book uses `ReserveNow` on same OCPP endpoint.

### High-level path

```
Map/Home stations → Station details → Check-in (amount/time)
  → Connect-charger (status machine + RemoteStart)
  → Charging screen (poll meter values)
  → Stop (local context clear only)
```

### Step-by-step

| Step | UI / action | File:line | Network | Timer/delay |
|------|-------------|-----------|---------|-------------|
| 1 | Load stations (list/map data) | `redux/stationsSlice.js` → `getStations` | GET `/services/station/getstations` | — |
| 2 | Open station details; fetch site/station + port availability | `station-details-screen.tsx` (~348-420) | GET stationDetails, port status-details | Per-connector fetches |
| 3 | User selects connector; taps **Connect** | `station-details-screen.tsx:784-791` | — | Navigates to check-in with `button: 'pay & charge'` |
| 4 | Check-in loads wallet | `check-in-screen.tsx:467-475` | GET `/api/mobile/walletDetails/{userId}` | — |
| 5 | Port availability for limits | `check-in-screen.tsx:173-175` | GET `/services/station/{portId}/status-details` | — |
| 6 | User sets time / units / % via tabs + slider; amount computed | check-in helpers + optional calculate | POST `/api/mobile/calculate?...` (when used) | — |
| 7 | Balance gate (min ₹50 for charge; reservation fee notes in UI) | `check-in-screen.tsx:402-456`, UI ~803-806 | — | Alert timeout ~414 `setTimeout` |
| 8 | **Pay & charge** → `startChargingTransaction` builds payload | `check-in-screen.tsx:571-621` | **No OCPP call yet** | |
| 8a | **Timezone bug:** `startTime = now + 5h30m` then `.toISOString()` | `check-in-screen.tsx:589-603` | — | Session times shifted +5:30 (BUG-2) |
| 8b | Payload: `requestType: "RemoteStart"`, station/port/connector, `idTag: user.mobileNumber`, `userId` | same | | |
| 8c | Navigate to **Connect Charger** with `updatedPayload` | `check-in-screen.tsx:605-618` | — | |
| 9 | Connect screen status machine | `connect-charger-screen.tsx` | | |
| 9a | Start WAITING; poll port status every **3s** for Preparing | `:145-160`, `TIMING.POLLING_INTERVAL: 3000` | GET `/services/station/status/{portId}` via `portstatus` | |
| 9b | Per-status timeout **120s** | `TIMING.STATUS_TIMEOUT: 120000` | | Alerts if stuck |
| 9c | On Preparing → **2s** delay → status SUSPENDED_EV | `:156-158` | artificial | |
| 9d | On SUSPENDED_EV → **2s** delay → STARTING → call OCPP | `:179-187` | | stacked artificial delays (PERF-3) |
| 10 | **RemoteStart** via `StationsService.occprequests` | `connect-charger-screen.tsx:202` | POST **`https://ocpp.evyaa.com/ocpp/request`** (privileged `features()`, not `/app/request`) | OCPP → WS to charger |
| 11 | On Accepted + `transactionId` → navigate Charging screen | `:204-220` | | |
| 12 | Charging screen registers session in `ChargingContext` | `charging-screen.tsx:70-111` | persists `chargingSession` AsyncStorage | |
| 13 | **Live status poll** `getMeterValues(transactionId)` | `charging-screen.tsx:116-190` | GET `/ocpp/metervalues?transactionId=` | **Initial fetch + every 30s** |
| 14 | UI gauge/SOC/cost from last poll only (no local 1s interpolate) | same | | Up to **30s lag** (PERF-3) |
| 15 | Auto clear poll if status Completed/Stopped/Finishing | `:154-158` | | |
| 16 | User **Stop** → `stopCharging()` | `charging-screen.tsx:195-207` → `ChargingContext.tsx:208-238` | **No RemoteStop HTTP call** — clears Redux/context + AsyncStorage only | 1s flag reset |

### Book path (delta)

| Step | Action | File | Network |
|------|--------|------|---------|
| B1 | Book Now → Book Charger flow → check-in with `button: 'Book Charger'` | station-details / book screens | |
| B2 | `ReserveNow` payload → `occprequests` | `check-in-screen.tsx:497-566` | POST `/ocpp/request` `requestType: "ReserveNow"` |
| B3 | Success popup with `reservationId` | same + BookingSuccessPopup | |

### Hardcoded UI on live charge

| Issue | Location |
|-------|----------|
| Vehicle shown as `'Tata Curve EV'` / `'TS08EV9876'` | `charging-screen.tsx:262-263` (per workorder / BUG-3) |

### Timer inventory (charge)

| Interval | Value | File | Effect |
|----------|-------|------|--------|
| Port prepare poll | 3 s | connect-charger `TIMING.POLLING_INTERVAL` | Wait for Preparing |
| Status stuck timeout | 120 s | `STATUS_TIMEOUT` | Error alert + stop polling |
| Artificial prepare→next | 2 s | connect-charger:156 | UX delay |
| Artificial → RemoteStart | 2 s | connect-charger:183 | UX delay before OCPP |
| Meter poll | 30 s | charging-screen:182 | Live UI updates |
| Stop debounce | 1 s | ChargingContext:228 | Prevent double stop |

### Backend / OCPP chain (after app POST)

```
App POST /ocpp/request { requestType: RemoteStart|ReserveNow|... }
  → MessagesController.RestAPI → WebSocketHandler.features(ocppForm)
  → (intended) else-if chain for RemoteStart / RemoteStop / ReserveNow / …
  → WebSocket session for stationId → OCPP CALL to charger
  → StartTransaction / MeterValues stored in OCPP DB
  → GET /ocpp/metervalues reads transaction telemetry
```

**Known server defect (BUG-1):** brace bug in `WebSocketHandler` can make HardReset path run incorrectly and leave command handlers unreachable — breaks RemoteStart routing at scale.

**Wallet debit:** occurs on OCPP billing path when session settles (separate from app stop button); not driven by app `stopCharging` today.

---

## Flow diagrams (compact)

### Login

```
Splash(1s) ─► Auth Login
                │ phone
                ▼
           sendOtp [STUB]
                │
                ▼
           enter 4-digit OTP
                │
                ▼
           verifyOtp [STUB → userId:3]
                │
                ├─ AsyncStorage ID
                ├─ AppContext.login
                └─ getUserDetails (real API)
                        │
            vehicles? ──yes──► App tabs
                   └──no───► Add Vehicle
```

### Charge (pay & charge)

```
StationDetails ─Connect─► CheckIn (wallet + duration)
                              │ validate balance
                              ▼
                         payload RemoteStart (+5:30 bug)
                              │ navigate
                              ▼
                         ConnectCharger
                           poll Preparing @3s
                           delays 2s + 2s
                              │
                              ▼
                         POST /ocpp/request RemoteStart
                              │ transactionId
                              ▼
                         ChargingScreen
                           poll metervalues @30s
                              │
                              ▼
                         Stop → local clear only
```

---

## Cross-references

| Workorder item | Flow evidence |
|----------------|---------------|
| SEC-5 | Login stubs `Apis.js` |
| SEC-8 | Charge uses `/ocpp/request` not `/app/request` |
| BUG-1 | OCPP handler routing |
| BUG-2 | check-in +5:30 before ISO |
| BUG-3 | Hardcoded vehicle on charging UI |
| PERF-2/3 | Tab remount / poll + fake delays |
| STATE-1 | userId in Redux + Context + AsyncStorage |
