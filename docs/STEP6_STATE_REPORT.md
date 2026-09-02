# STEP 6 — State Foundation Report

**Date:** 2026-07-27  
**Scope:** STATE-1 (auth single source of truth), STATE-2 (RTK Query pattern + RFID dedupe), STATE-3 (BookingSuccessPopup)  
**App root:** `evya-native-main (1)/evya-native-main`

---

## Verify

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **233 errors** (≤ 261 baseline) ✓ |
| Metro Android bundle (`--dev false`) | **Done writing bundle output** ✓ |
| DB required? | No |

---

## STATE-1 — Single source of truth for user/auth

### Infrastructure
| Piece | Location | Role |
|---|---|---|
| Redux auth slice | `src/redux/AuthSlice.ts` | Owner of `userId`, `user`, `vehicles`, `isAuthenticated`, etc. |
| redux-persist | `src/redux/store.ts` | Persists auth whitelist to AsyncStorage (backing store only) |
| PersistGate | `App.tsx` | Blocks UI until rehydrate |
| `useAuth()` | `src/hooks/useAuth.ts` | Public API: `login`, `logout`, `userId`, `user`, … |
| AppContext | `src/contexts/app-context.tsx` | **UI-only** (`onBoarded`); mirrors auth from Redux for splash/onboarding; one-time migrates legacy AsyncStorage `ID` → Redux then deletes it |

### Auth path after STATE-1
- **Write:** `login()` / `setUserId` / OTP flow → Redux only (no direct AsyncStorage `ID` write).
- **Read:** screens use `useAuth()` (or `useSelector(state => state.auth)` where already present).
- **Logout:** `useAuth().logout()` → clear JWT, Redux logout, RTK Query `resetApiState`, `persistor.purge()`.
- **Legacy:** bootstrap removes AsyncStorage `ID` so it is no longer a parallel read path.

### Screens now reading auth from Redux (`useAuth` / Redux selectors)

| Screen / file | How |
|---|---|
| `login-screen.tsx` | Context `login()` → Redux `setUserId` (no AsyncStorage ID) |
| `account.tsx` | `useAuth()` — userId, user, logout |
| `home-screen.tsx` | `useAuth()` — userId, user, vehicles, loading |
| `wallet-card-and-transactions.tsx` | `useAuth().userId` |
| `AddMoney.tsx` | `useAuth().userId` |
| `RFIDTabs.tsx` | `useAuth().userId` |
| `profile-screen.tsx` | `useAuth().userId` |
| `AddressScreen.tsx` | `useAuth().userId` |
| `add-vehicle.tsx` | `useAuth().userId` |
| `book-a-charger-screen.tsx` | `useAuth().userId` |
| `bookings-list.tsx` | `useAuth().userId` |
| `check-in-screen.tsx` | `useAuth().userId` |
| `station-details-screen.tsx` | `useAuth().userId` |
| `FavouriteStation.tsx` | `useAuth().userId` |
| `charging-status.tsx` | `useAuth().userId` |
| `request-franchise-screen.tsx` | `useAuth()` (user + userId) |
| `my-franchises-screen.tsx` | `useAuth().userId` |
| `help.tsx` | `useAuth().userId` |
| `vehicle-list.tsx` | `useAuth().userId` (+ RTK vehicles) |
| Splash / onboarding | AppContext `contextState` (mirrored from Redux + onBoarded UI flag only) |
| Other charge/booking screens | Already used `useSelector(state.auth)` |

**Not dual-source anymore:** AsyncStorage key `ID` is migration-only; JWT token remains in AsyncStorage via `Apis.js` (`authToken`) as the HTTP credential, separate from session owner (Redux).

---

## STATE-2 — RTK Query pattern (3 endpoints + RFID dedupe)

### API slice
`src/redux/api/baseApi.ts` — mounted in store with middleware + `setupListeners` for focus/reconnect refetch.

| Endpoint | Hook | Wraps | Consumers |
|---|---|---|---|
| **Stations list** | `useGetStationsQuery` | `StationsService.getStations` | `StationList.tsx`, `map-card.tsx` |
| **User vehicles** | `useGetUserVehiclesQuery` | `StationsService.getUserVehicles` | `vehicle-list.tsx` |
| **Wallet** | `useGetWalletQuery` | `StationsService.getCompleteWalletData` | `wallet-card-and-transactions.tsx` |
| **User RFIDs** (dedupe helper) | `useGetUserRFIDsQuery` | `StationsService.getUserRFIDs` | `active-rfid.tsx`, `request-rfid.tsx` |

Rest of `Apis.js` left intact.

### Pattern established
- Generated hooks replace manual `useState` loading flags + `useFocusEffect` refetch storms.
- Caching via `keepUnusedDataFor`, `refetchOnFocus`, `refetchOnMountOrArgChange`.
- Pull-to-refresh uses `refetch()`.
- Tag invalidation: `baseApi.util.invalidateTags(['Vehicles'])` after add-vehicle; logout calls `resetApiState()`.

### RFID double-fetch — **gone**
**Before:**  
- Request tab → `getUserRFIDs` (or path that hit the same API)  
- Active tab → `getActiveRFIDs` → **internally called `getUserRFIDs` again**  
→ two network calls when both tabs mount / switch.

**After:**  
Both `RequestRFIDScreen` and `ActiveRFIDScreen` call **`useGetUserRFIDsQuery(userId)`** with the same cache key.  
RTK Query serves one network request; tabs filter client-side:

- Active: `status === 'active'`
- Request: `status !== 'active'`

`Apis.js` `getActiveRFIDs` / `getRequestedRFIDs` remain but are no longer used by these tabs.

---

## STATE-3 — BookingSuccessPopup dedupe

| Action | Path |
|---|---|
| **Kept** | `src/extra/BookingSuccessPopup.tsx` |
| **Deleted** | `src/screens/station-details/BookingSuccessPopup.tsx` |
| **Imports** | `app-navigation.tsx`, `book-a-charger-screen.tsx`, `check-in-screen.tsx` already pointed at `extra/` |

---

## Release notes / follow-ups

1. **react-native-fast-image** (STEP 5): still needs a **native rebuild** before remote images use the native cache path.
2. Further RTK migrations (bookings, favourites, tickets, etc.) can follow the same `baseApi` pattern.
3. Home map still uses WebView (`WebMapSection`); native `StationList` / `map-card` now own the RTK stations pattern for list/carousel UI.

---

## Files touched (summary)

**New / core**
- `src/redux/api/baseApi.ts`
- `src/redux/store.ts` (persist + api + setupListeners)
- `src/hooks/useAuth.ts`
- `src/contexts/app-context.tsx` (UI-only + migrate)
- `App.tsx` (PersistGate)

**RTK consumers**
- `wallet-card-and-transactions.tsx`, `vehicle-list.tsx`, `StationList.tsx`, `map-card.tsx`
- `active-rfid.tsx`, `request-rfid.tsx`

**Auth migrations**
- account, home, AddMoney, RFIDTabs, profile, Address, add-vehicle, book-a-charger, bookings-list, check-in, station-details, FavouriteStation, charging-status, franchises, help, login (prior)

**Dedupe**
- Deleted `station-details/BookingSuccessPopup.tsx`
