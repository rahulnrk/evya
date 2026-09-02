# EVYA App State Map

**Generated:** 2026-07-26 (Phase 0.4)  
**Scope:** `evya-native-main (1)/evya-native-main`

---

## Store inventory

### 1. Redux (`src/redux/store.ts`)

| Slice | File | Key fields | Written by | Read by (screens) |
|-------|------|------------|------------|-------------------|
| `auth` | `AuthSlice.js` (TS syntax in `.js`) | `userId`, `mobileNumber`, `isAuthenticated`, `otpSent`, `otpVerified`, `loading`, `error`, `timer`, `user`, `vehicles`, `address`, `account`, `userDataLoaded` | `sendOtp`, `verifyOtp`, `registerUser`, `updateProfile`, `getUserDetails` thunks; reducers `setMobileNumber`, `resetAuthState`, etc. | `login-screen`, `account`, `profile-screen`, `RFIDScreen`, `add-vehicle`, `vehicle-list`, `AddressScreen`, `request-franchise-screen`, `check-in-screen` (`user`) |
| `stations` | `stationsSlice.js` | `stations[]`, `loading`, `error` | `fetchStations` / `getStations` thunk | `map-card`, (commented: map-screen, home routes) |

**No redux-persist** — Redux is memory-only; cold start loses auth slice until re-fetched (context/AsyncStorage still say “logged in”).

---

### 2. React Contexts

| Context | File | Fields | Persist | Readers / writers |
|---------|------|--------|---------|-------------------|
| **AppContext** | `contexts/app-context.tsx` | `isAuthenticated`, `onBoarded`, `userId` | Yes via AsyncStorage | Splash routing; login/logout; wallet, RFID, address, franchises, add-vehicle, check-in (userId), account |
| **ChargingContext** | `contexts/ChargingContext.tsx` | `chargingSession`, `liveChargingData`, `isCharging` | AsyncStorage key `chargingSession` | charging-screen start/stop/live; home may surface active session |
| **LocationContext** | `contexts/LocationContext.js` | GPS coords, reverse-geocode place name | No (session) | map-card, map/home location-aware fetches; Nominatim network |
| **RefreshContext** | `contexts/RefreshContext.tsx` | pull-to-refresh / global refresh flag | No | screens triggering list refresh |

---

### 3. AsyncStorage keys

| Key | Constant | Set | Cleared | Consumers |
|-----|----------|-----|---------|-----------|
| `ID` | `constants/dimensions.ts` `ID` | `login-screen` + `AppContext.login` | `AppContext.logout`, `account` logout | Splash (`isAuthenticated` if present); all Context `userId` paths |
| `onBoard` | `onBoard` | Onboarding `storeValue`; `AppContext.onboard` | — | Splash → skip onboarding |
| `chargingSession` | string literal | `ChargingContext.startCharging` | stop/clear paths | Resume charging UI after app restart |

Helpers: `helpers/common-functions.tsx` `storeValue` / `getValue` / `removeValue` (JSON or raw string).

---

## Datum duplication matrix

| Datum | Locations | Risk |
|-------|-----------|------|
| **userId** | Redux `auth.userId`; AppContext `userId`; AsyncStorage `ID` | **High** — screens pick inconsistently (`contextState.userId` vs `state.auth.userId` / `user.id`). Franchise screen reads both. Drift after partial login/logout. |
| **isAuthenticated** | Redux `auth.isAuthenticated`; AppContext `isAuthenticated` (from storage) | **High** — Splash uses **Context only**. Redux flag true after OTP but lost on reload; Context true if `ID` exists without re-verify. |
| **mobileNumber** | Redux `mobileNumber`; Redux `user.mobileNumber` / `user.phone`; often not mirrored to Context | Medium — OTP flow uses Redux; profile may use `user` |
| **user profile** | Redux `user` after `getUserDetails`; not in Context | Medium — if `getUserDetails` fails after stub login, Context still authenticated with bare userId |
| **vehicles** | Redux `vehicles` and nested `user.vehicles` (both set in getUserDetails) | Medium — dual placement in same slice |
| **address** | Redux `address` | OK single owner, but wallet RFID reads it while AddressScreen also uses Context userId for mutations |
| **wallet / account** | Redux `account` (from getUserDetails); **also** local `useState` wallet on check-in / wallet screens from API | Medium — balance can be stale vs check-in local fetch |
| **stations list** | Redux `stations`; some screens local state / WebView map | Medium — native list vs web map not shared |
| **charging session** | ChargingContext + AsyncStorage; route params (`transactionId`, connector) | Medium — triple source during navigation |
| **live meter data** | ChargingContext `liveChargingData` + charging-screen local state | Medium — both updated on poll |

---

## Screen → store matrix (summary)

| Screen | userId from | Profile from | Other |
|--------|-------------|--------------|-------|
| Splash | Context (via storage) | — | onBoarded |
| Login | writes all three | Redux after details | OTP flags Redux |
| Account | Context | Redux `user` | logout clears storage |
| Profile | Context | Redux `user` | |
| Wallet / AddMoney | Context | — | local API wallet |
| RFID tabs / request | Context + Redux user | Redux address | |
| Check-in | Context userId + Redux `user` (idTag mobile) | — | local wallet state |
| Charging | route + ChargingContext | hardcoded vehicle display | |
| Map card | — | — | Redux stations + LocationContext |
| Franchises | Context **and** Redux userId | Redux user | |
| Add vehicle | Context userId | Redux vehicles | |
| Address | Context userId | Redux address | |

---

## Write paths that can desync

1. **Login** writes AsyncStorage in login-screen **and** again in `login()` — order-sensitive if one fails.  
2. **Logout** (`account.tsx` removes `ID`) must also reset Redux; if only storage cleared, next session Context false but Redux may still hold old user until remount.  
3. **`getUserDetails` failure** after stub OTP: `isAuthenticated` true, `user` null → empty profile screens with “logged in” shell.  
4. **No token store** — no single auth credential; identity is only `userId` trusted by APIs.

---

## Implications for later phases

| Workorder | Fix |
|-----------|-----|
| STATE-1 | Single owner = Redux (+ redux-persist); Context UI-only; AsyncStorage behind persist |
| STATE-2 | RTK Query for stations/wallet/vehicles — kills local wallet `useState` + double RFID fetches |
| SEC-5 | Store JWT next to session; interceptor reads one place |
| PERF-4 | Home `useSelector` object literals / focus refetch (when home uses Redux again) |

---

## CMS note (out of mobile scope)

CMS: `localStorage` `authToken`, `roleId` — not shared with mobile; token often undefined (SEC-2).
