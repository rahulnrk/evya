# EVYA — Agent Work Order

A single hand-off document for a coding agent working on the EVYA EV-charging platform.
Work **top to bottom**. Do not skip Phase 0 — the agent must understand the system before changing it.

Every task has: **Problem → Files → Change → Verify**. Do not mark a task done until its Verify step passes.

---

## 0. How to use this document

- **Phase 0** = understanding prompts. Feed these to the agent first. Each produces an artifact (a map, a list) the agent keeps for reference. No code changes yet.
- **Phases 1–6** = the actual corrections, ordered by leverage. Phase 1 (hygiene) unblocks the build; Phase 2 (security) is non-negotiable before real users; Phases 3–6 are quality, speed, and scale.
- **Verification Playbook** (end of doc) = the exact commands that already work on this machine, with expected output. Use it to prove nothing regressed.

### Ground rules for the agent
1. **Never invent credentials, schema, or endpoints.** If something is missing (DB schema, `web.evyaa.com`), stop and flag it — do not stub it silently.
2. **One task = one focused change + one passing Verify.** Don't bundle unrelated edits.
3. **Match the surrounding code style.** Don't reformat files you're not fixing.
4. **Preserve behavior contracts** between app ↔ backend ↔ OCPP unless a task explicitly changes them.
5. **Report honestly.** If a Verify step fails, say so with the output. Don't claim done.

---

## Project map (context primer — give this to the agent verbatim)

EVYA is an EV-charging platform in **5 codebases + 1 built APK**, all under `C:\Users\nande\Downloads\EVYA`:

| Folder | What it is | Stack | Entry point |
|---|---|---|---|
| `evya-native-main/evya-native-main` | Customer mobile app | React Native 0.74, TypeScript, Redux Toolkit | `App.tsx`, `src/axios/Apis.js` |
| `Backend/Server` | Main API (`server.evyaa.com`) | Spring Boot 2.3, Java 8, `com.ewe` | `controller/MobileAPIController.java` |
| `evya-ocpp-main/evya-ocpp-main` | OCPP 1.6 charger server (`ocpp.evyaa.com`) | Spring Boot 2.3, Java 8, `com.test` | `handler/WebSocketHandler.java` |
| `evya-cms-frontend-main/evya-cms-frontend-main` | Admin CMS ("spark-stop") | Vite, React 18, Redux, shadcn/Radix | `src/services/AxiosServices.jsx` |
| `EvyaSense-main/EvyaSense-main` | Anomaly-detection layer | Spring Boot 3, Java 17, Kafka + Redis | `kafka/SenseConsumer.java` |
| `evyaweb-main (1)/evyaweb-main` | **`web.evyaa.com` map web app** (embedded in the mobile app's map WebViews) | CRA, React 19, Leaflet+OSM, Google Maps (search), Redux | `src/App.js`, `src/screens/HomeScreens/MapSection.jsx` |

**Data flow:**
```
App ──/api/mobile,/services──► Backend/Server ──► SQL Server "evya"
App ──/ocpp──────────────────► evya-ocpp ──WS /ocpp16/{id}──► chargers ──► SQL Server "evya_online"
App ──WebView────────────────► web.evyaa.com (MAP — source NOT in repo)
chargers ─► logs ─► Kafka ─► EvyaSense ─► Redis + MySQL ─► CMS
```

**Known missing (do not fabricate):** the database schema/DDL, the Kafka log-shipper, keystore + `google-services.json`. *(The `web.evyaa.com` map app is now present as `evyaweb-main` — no longer missing.)*

**Map stack note (PERF-1 / SCALE):** the mobile app's Home + Map WebViews load `evyaweb-main` (`/mapsection`, `/mapsearch`). That web app uses **Leaflet + OSM**, renders **every** station as an individual marker (**no clustering**), and fetches **all sites within a radius** (default 100 km) refetching on `moveend`. It already keeps the map mounted (`FixedMapContainer`), but the RN `unmountOnBlur:true` reloads the whole web app on every tab switch (see PERF-2). PERF-1 options: (a) native RN map, or (b) keep `evyaweb` and set `unmountOnBlur:false`. SCALE-1/2/3 (clustering + bbox/viewport fetch + live status from EvyaSense Redis) should be implemented **in `evyaweb-main`**.

**Confirmed working today:** all 5 projects build/compile; all ~40 app API calls resolve to real backend routes.

---

## PHASE 0 — Understanding prompts (run first, no code changes)

Hand these to the agent one at a time. Each should produce a written artifact the agent saves under `docs/`.

### P0.1 — Build the system inventory
> Read the top-level of all 5 EVYA folders. Produce `docs/INVENTORY.md`: for each project — purpose, stack/version, entry point, build command, and its runtime dependencies (DB, Kafka, Redis, external APIs). List every hardcoded URL and every external service.

### P0.2 — Map the API contract end to end
> In `evya-native-main`, extract every endpoint called from `src/axios/Apis.js` (and any other file using axios). For each: HTTP method, path, which base URL (`/api/mobile`, `/services`, `/ocpp`), request shape, and caller screen. Then match each to its `@RequestMapping`/`@GetMapping`/etc. in `Backend/Server` and `evya-ocpp-main`. Produce `docs/API_CONTRACT.md` as a table with a "resolves? (Y/N)" column and flag any mismatch in method, path, or param name.

### P0.3 — Trace the two critical flows
> Produce `docs/FLOWS.md` tracing, step by step with file:line references:
> (a) **Login:** phone entry → OTP → user session → landing. Note where auth state is stored.
> (b) **Charge:** station select → book/pay → connect → RemoteStart → live status → stop → receipt. Note every timer, delay, and network call and its interval.

### P0.4 — Inventory state & data management
> In the app, list every place user/auth/session/vehicle/station state is stored (Redux slices, React Contexts, AsyncStorage keys). Produce `docs/STATE_MAP.md` showing which screens read/write each store and where the same datum is stored in more than one place.

### P0.5 — Security surface scan
> Produce `docs/SECURITY_BASELINE.md`: list every endpoint and whether it requires authentication/authorization; every SQL query built by string concatenation (file:line); every hardcoded secret; CORS/CSRF config; and how the app authenticates requests. Do not fix anything yet — just document.

### P0.6 — Confirm the build baseline
> Run the Verification Playbook (end of this doc) exactly as written and record pass/fail for each project in `docs/BUILD_BASELINE.md`. This is the "before" snapshot; every later change must keep these green.

**Gate:** Do not start Phase 1 until P0.1–P0.6 artifacts exist and the build baseline is green.

---

## PHASE 1 — Repo hygiene & build unblock (quick wins)

### H-1 — Remove committed merge-conflict markers
- **Problem:** unresolved git conflict markers are committed.
- **Files:** `evya-ocpp-main/evya-ocpp-main/.gitignore` (stray ` HEAD` line + commit SHA), `evya-cms-frontend-main/evya-cms-frontend-main/README.md` (`<<<<<<< HEAD … >>>>>>>`).
- **Change:** resolve to the intended content; remove markers.
- **Verify:** `grep -rn "<<<<<<<\|>>>>>>>\|=======" .` returns nothing in those files.

### H-2 — Fix the CMS missing dependency
- **Problem:** `qrcode.react` is imported in `src/pages/stations/StationDetails.jsx` and declared in `package.json` but not installed → fresh clone fails to build.
- **Files:** `evya-cms-frontend-main/evya-cms-frontend-main/`
- **Change:** `npm install` (reconciles lockfile) and commit the updated `package-lock.json`.
- **Verify:** `npx vite build` succeeds.

### H-3 — Rename `AuthSlice.js` → `AuthSlice.ts`
- **Problem:** the file contains TypeScript (`interface`, type annotations) but has a `.js` extension → 10 `tsc` errors; a strict build breaks.
- **Files:** `evya-native-main/evya-native-main/src/redux/AuthSlice.js` → `.ts`; fix imports if any reference the extension; also fix the ~18-space indentation while you're in there.
- **Verify:** `npx tsc --noEmit` reports **0 errors** (was 10, all in this file).

### H-4 — Configure the Jest native-module setup
- **Problem:** the only test (`__tests__/App.test.tsx`) fails because AsyncStorage's native module isn't mocked. Zero tests pass.
- **Files:** add `jest.setup.js` mocking `@react-native-async-storage/async-storage` and other native modules; reference it via `setupFiles` in `jest.config.js`.
- **Verify:** `npx jest` — the default test passes (or is replaced with a meaningful one that passes).

### H-5 — Externalize configuration (no hardcoded env in source)
- **Problem:** every backend hardcodes prod config; CMS ships pointing at `localhost:8800`.
- **Files:** `Backend/Server/src/main/resources/application.properties`, `evya-ocpp-main/.../application.properties`, `evya-cms-frontend-main/.../src/config.jsx`.
- **Change:** move DB URLs, passwords, API keys, and base URLs to environment variables with a documented `.env.example`. Follow the pattern EvyaSense already uses (`${DB_URL:default}`).
- **Verify:** grep for the literal passwords/keys in source returns nothing; apps still build; `.env.example` documents every variable.
- **⚠️ HUMAN ACTION (agent cannot do this):** the committed secrets are already exposed. Moving them to env vars does **not** un-expose them. The infra owner must **rotate the live credentials now** — both SQL Server `sa` passwords, the Gmail app password, PhonePe/Razorpay keys, and the Groq API key — independently of this code change. Flag this to the owner; do not consider H-5 "safe" until rotation is confirmed.

---

## PHASE 2 — Security (CRITICAL — do before any real users)

> After each backend change, re-run `mvnw compile` (see Playbook). After secret rotation, the human owner must rotate the actual live credentials — the agent cannot.
>
> **⚠️ Sequencing — do SEC-1 + SEC-2 + SEC-5 as one coordinated unit, not piecemeal.** SEC-1 changes the `/otp/verify` signature (backend), SEC-5 restores the app's OTP calls to match it (app), and SEC-2 issues the JWT the app must then attach. If these land in separate sessions you'll ship a broken login in between. Build them together, verify login end-to-end, then commit. SEC-3 (turn on the filter chain) should land in the same push so the new tokens are actually enforced.

### SEC-1 — Bind OTP verification to the phone number + rate-limit  🔴
- **Problem:** `VerifyOtp(String otp)` iterates the OTP store and matches **any** user's 4-digit code — no phone binding, no rate limit, `Math.random()` codes. Brute-forcing 0000–9999 logs in as whoever is mid-login. **Account takeover.**
- **Files:** `Backend/Server/src/main/java/com/ewe/serviceImpl/MobileAPIServiceImpl.java` (`getOTP`, `VerifyOtp`), `controller/MobileAPIController.java` (`/otp/verify` currently takes only `@RequestParam otp`).
- **Change:**
  1. `/otp/verify` must accept **both** phone number and otp; verify the code **for that phone only**.
  2. Use `SecureRandom`, 6-digit codes, short expiry.
  3. Add per-phone attempt limiting (e.g. 5 tries, then lockout) and per-phone send throttling.
  4. Move `otpStore` out of in-process memory to **Redis** (survives restart, works behind a load balancer). EvyaSense already runs Redis — reuse that pattern.
- **Verify:** unit test: correct otp for phone A does not verify phone B; wrong otp N times locks out; expired otp rejected. `mvnw compile` green.

### SEC-2 — Issue a real token on login; stop returning the User entity  🔴
- **Problem:** `LoginController.authenticate` validates the password then returns the raw `User`/`EmployeeDTO` with **no token**. The CMS then stores `data.token` (undefined) and sends `Bearer undefined`. There is no JWT anywhere.
- **Files:** `Backend/Server/.../controller/LoginController.java`, add a JWT util + filter, `pojo/User.java`.
- **Change:**
  1. Add a JWT library; on successful auth, issue a signed token (subject = userId/roleId, short expiry + refresh).
  2. Return a DTO `{ token, userId, roleId, orgId }` — never the entity.
  3. Add `@JsonIgnore` to `User.getPasswords()` so hashes can never serialize.
- **Verify:** login response contains a non-null `token`; response body contains no password field; CMS `Authorization` header carries a real token.

### SEC-3 — Turn on the Spring Security filter chain (both backends)  🔴
- **Problem:** `WebSecurityConfig` uses `antMatchers("/**").permitAll()` + CSRF disabled + CORS `*`. Everything is public. OCPP server has no auth and `WebConfiguration` sets CORS `*`.
- **Files:** `Backend/Server/.../config/WebSecurityConfig.java`, `evya-ocpp-main/.../config/WebConfiguration.java`.
- **Change:**
  1. Require a valid JWT on all endpoints except an explicit allowlist (`/login/authenticate`, `/api/mobile/otp/*`, health).
  2. Add role-based checks server-side (do NOT rely on the CMS's client-side `roleId` interceptor check — it's bypassable).
  3. Restrict CORS to known origins; keep CSRF handling appropriate for a token API.
- **Verify:** an unauthenticated request to a protected route returns 401; a valid token succeeds; role-gated route rejects wrong role.

### SEC-4 — Parameterize all SQL (kill injection)  🔴
- **Problem:** pervasive string-concatenated SQL. Unauthenticated-reachable examples: `MobileAPIServiceImpl.java:108` (`phoneNo`), `evya-ocpp-main/.../dao/impl/StationDaoImpl.java:57` (WebSocket `clientId`), which the DAO runs as multi-statement (stacked queries).
- **Files:** `Backend/Server/.../serviceImpl/MobileAPIServiceImpl.java` (116 concatenation sites), `dao/impl/GeneralDaoImpl.java`; `evya-ocpp-main/.../dao/impl/StationDaoImpl.java`, `StatusNotificationDaoImpl.java`, `GeneralDaoImpl.java`.
- **Change:** convert to parameterized queries / named parameters (the OCPP `BillingService` already does this correctly — copy that pattern). Prioritize the two unauthenticated-reachable sites first, then sweep the rest.
- **Verify:** a query with an injection payload (`' OR '1'='1`) in phone/clientId returns no data / errors safely; `mvnw compile` green.

### SEC-5 — Restore real OTP in the app (remove the stub)  🔴
- **Problem:** `Apis.js` `sendOtp`/`verifyOtp` (lines ~147–211) are hardcoded stubs returning `userId: 3`. Real implementations are commented out at ~214–270.
- **Files:** `evya-native-main/.../src/axios/Apis.js`; align with SEC-1's new signature (phone + otp).
- **Change:** delete the stubs, restore the real calls, wire the auth token from SEC-2 into the axios interceptor (currently a TODO at lines ~16–28). Send the token on every request; stop passing `userId` as a trust boundary.
- **Verify:** logging in requires a real server OTP; requests carry the `Authorization` header; `npx tsc --noEmit` + Metro bundle still pass.

### SEC-6 — Make wallet mutations atomic + idempotent  🔴
- **Problem:** both credit (`PhonePeServiceImpl.java:201-221`) and debit (`evya-ocpp .../BillingService.java:239-254`) are read-modify-write → lost updates (free charging / double credit). Credit isn't `@Transactional`; the two run against possibly different databases.
- **Files:** `Backend/Server/.../serviceImpl/PhonePeServiceImpl.java`, `evya-ocpp-main/.../webScoket/serviceImpl/BillingService.java`.
- **Change:**
  1. Single atomic statement: `UPDATE accounts SET balance = balance ± :amt WHERE id = :id AND balance >= :amt` (debit guard in the WHERE).
  2. Make credit `@Transactional`; keep the `status='PENDING'` idempotency guard so a re-poll can't double-credit.
  3. **Confirm whether the Backend wallet DB and the OCPP wallet DB are the same instance** — document the answer in `docs/`. If different, that's a data-integrity defect to escalate.
- **Verify:** concurrent debits can't overdraft; re-running a completed top-up doesn't double-credit; `mvnw compile` green.

### SEC-7 — Authenticate the OCPP WebSocket + stop session eviction  🔴
- **Problem:** `WebSocketClientInterceptor.beforeHandshake` always returns `true`; `clientId` is taken from the URL with no verification. `WebSocketHandler` (~line 148) evicts an existing station session on reconnect, so an attacker connecting as a known station ID kicks the real charger out and can forge telemetry.
- **Files:** `evya-ocpp-main/.../handler/WebSocketClientInterceptor.java`, `handler/WebSocketHandler.java`.
- **Change:** require OCPP security profile auth (HTTP Basic on handshake, or client cert) and validate `clientId` against provisioned stations before accepting; reject duplicate/unauthorized connections rather than evicting the legitimate one.
- **Verify:** handshake without valid credentials is rejected; a second connection for an already-connected station is refused, not swapped.

### SEC-8 — App must call the app endpoint, not the privileged one  🟠
- **Problem:** the app POSTs to `/ocpp/request` (`features()`, which exposes Reset/UpdateFirmware/ChangeConfiguration/ClearCache/vendingPriceUpdate) instead of `/ocpp/app/request` (`appFeatures()`, the restricted set).
- **Files:** `evya-native-main/.../src/axios/Apis.js:786` (`occprequests`); `evya-ocpp-main/.../webScoket/serviceImpl/OcppServiceImpl.java`.
- **Change:** point the app at `/ocpp/app/request`; confirm `appFeatures()` covers exactly the actions the app needs (ReserveNow, RemoteStart, RemoteStop, UnlockConnector) and nothing more. Ensure the privileged endpoint is admin-authenticated (SEC-3).
- **Verify:** app charging flow works via `/ocpp/app/request`; privileged actions are unreachable without admin auth.

---

### SEC-2b — Fail-fast if the JWT secret is unset (weak-default footgun)  🔴
- **Problem (found in verification):** `jwt.secret=${JWT_SECRET:evya-dev-jwt-secret-change-me-32chars-min}` ships a **known** default. If `JWT_SECRET` isn't set in production, the app silently signs with a public secret → anyone can forge tokens for any `userId`/`roleId` → full auth bypass. Same class of risk as the DB creds, but worse because it *works* silently.
- **Files:** `Backend/Server/.../security/JwtTokenProvider.java`, `evya-ocpp-main/.../security/*`, both `application.properties`.
- **Change:** on startup, refuse to boot (or fail health) if the secret is empty or equals the dev default when a prod profile is active. No silent fallback.
- **Verify:** starting without `JWT_SECRET` in prod profile aborts startup; dev still works.

### SEC-2c — Reject refresh tokens on API routes  🟠
- **Problem (found in verification):** `JwtTokenProvider.validate()` doesn't check `tokenType`, and `JwtAuthenticationFilter` accepts any valid token — so a **refresh token (24h TTL) authenticates API calls** like an access token.
- **Files:** `Backend/Server/.../security/JwtAuthenticationFilter.java` (and OCPP equivalent).
- **Change:** in the filter, reject tokens whose `tokenType != "access"`.
- **Verify:** a refresh token on a protected route returns 401; an access token succeeds.

### SEC-4b — Finish the SQL parameterization sweep (payment path is still injectable)  🔴
- **Problem (found in verification):** SEC-4 fixed the two *prioritized* sites (phone lookup, OCPP `OCPPId`), but the sweep isn't done. Notably `PhonePeServiceImpl` still concatenates user-influenced `statusResponse.getOrderId()` into SELECT queries (~lines 181-182, 196-198) and `request.getUserId()` (~line 109) — an authenticated user can inject via a crafted order id. The ~116 concatenation sites in `MobileAPIServiceImpl` and the remaining OCPP DAOs also stand. (The report's "SQL: phone + clientId parameterized" is accurate but is **not** "SQLi closed.")
- **Files:** `Backend/Server/.../serviceImpl/PhonePeServiceImpl.java` (priority — money path), `MobileAPIServiceImpl.java`, `evya-ocpp-main/.../dao/impl/*`.
- **Change:** parameterize the payment-path SELECTs first, then sweep the rest. The atomic wallet UPDATEs from SEC-6 are already parameterized — match that pattern.
- **Verify:** an injection payload in `merchantOrderId`/order id returns no data / errors safely; `mvnw compile` green.

### SEC-6b — Resolve the two-wallet-database integrity risk  🔴
- **Problem:** credit runs against Backend DB `evya`; debit ran against OCPP DB `evya_online`. SEC-6 made each side atomic, but different databases = **split-brain** wallet.
- **RESOLVED — direction confirmed by `evya_schema.sql`:** the schema dump proves a **single-database design** — `accounts`, `account_transaction`, `chargingActivity`, `ocpp_activeTransaction`, `ocpp_startTransaction`, `statusNotification` all live in the one `evya` database. The OCPP config's `evya_online` is the divergence. **Decision: consolidate both services onto `evya`.**
- **Change:** point OCPP's `DB_URL` at the same `evya` database as Backend; verify OCPP's `accounts`/`account_transaction` writes land in `evya`. Merge any historical rows that accumulated in `evya_online` (human-run, needs DB access).
- **Verify:** a top-up (Backend) and a charge debit (OCPP) read/write the same `accounts` row in `evya`.

### BUG-10 — OCPP wallet SQL uses a non-existent column (`account_balance`)  🔴
- **Problem (found by validating code against `evya_schema.sql`):** the real column is **`accountBalance`** (camelCase), but `evya-ocpp-main/.../dao/impl/GeneralDaoImpl.java` uses **`account_balance`** (snake_case) in 4 queries — lines ~283, ~298, ~309, and an `UPDATE accounts SET account_balance = ...` at ~317. These are the RFID wallet methods (`getUserInfoByRfid`, `getAccountBalanceByUserId`, `getUserInfoByPhone`, `updateAccountBalance`); they throw "invalid column name" at runtime → **RFID balance checks / deductions are broken** against the actual DB. 41 other sites use the correct `accountBalance`.
- **Files:** `evya-ocpp-main/.../dao/impl/GeneralDaoImpl.java`.
- **Change:** rename `account_balance` → `accountBalance` in those 4 queries. **Then** grep all hand-written SQL in both backends for column names and validate against `evya_schema.sql` — the JPA entities generate camelCase columns, so any snake_case column reference in raw SQL is a latent runtime failure.
- **Verify:** the 4 queries run against a DB created from `evya_schema.sql`; a broader schema/column audit is logged in `docs/`.

### SEC-9 — Public map endpoint is behind auth → blank web map  🔴 (found via live test)
- **Problem:** after SEC-3 locked everything except the allowlist, `GET /api/mobile/mobilegetAllSites` (and likely `/Details`, station-detail reads) requires a JWT. But `evyaweb` (the `web.evyaa.com` map, embedded in the RN app's WebViews) **sends no token** — its axios layer has no Authorization header. **Live-confirmed:** the endpoint returns **401** with no token, **200** with a valid token. So the web map will render **blank** (no stations) in production.
- **Decision needed + fix (recommended: option A):**
  - **A —** Allowlist the **read-only, non-sensitive** site endpoints (`mobilegetAllSites`, public site/station detail reads) as `permitAll`. Charger locations are public discovery data; keep wallet/user/bookings/RFID behind auth. Simplest and correct for a public map.
  - **B —** Have `evyaweb` authenticate (RN WebView injects the app's token, or evyaweb uses an anonymous/public token). More fragile; avoid passing tokens via URL.
- **Files:** `Backend/Server/.../config/WebSecurityConfig.java` (allowlist) and/or `evyaweb-main/.../src/axios/Apis.jsx` (auth header).
- **Verify:** with the chosen fix, `mobilegetAllSites` (bbox + legacy) returns 200 for the web map's call pattern; sensitive endpoints still 401 without a token.

### BUG-11 — Malformed bbox params return 500 instead of 400  🟡 (found via live test)
- **Problem:** the bbox params are typed `Double`; a non-numeric value (e.g. `minLat=1 OR 1=1`) fails binding and returns **500** (live-confirmed) instead of a clean 400. **Not a security hole** — the `Double` typing + named-parameter `BETWEEN :minLat` means the payload never reaches SQL (injection-proof by design). It's a robustness/error-handling gap.
- **Files:** `Backend/Server/.../controller/MobileAPIController.java` (add validation / a `MethodArgumentTypeMismatchException` handler → 400).
- **Verify:** malformed bbox → 400 with a clean JSON error, not 500.

### BUG-12 — `siteDetails/{id}` returns 500 for a non-existent id  🟡 (found via live probe)
- **Problem:** `GET /services/site/siteDetails/1` on an empty DB returns **500** (the handler doesn't handle not-found; likely NPE on an empty result). Now publicly triggerable since SEC-9 allowlisted it.
- **Files:** `Backend/Server/.../serviceImpl/SiteServiceImpl.java` + its controller.
- **Change:** return 404 (or 200 with empty body) for a missing site; don't throw.
- **Verify:** `siteDetails/<nonexistent>` → 404/empty, not 500.

## PHASE 3 — Correctness bugs

### BUG-1 — Fix the WebSocketHandler missing braces (severe)  🔴
- **Problem:** `WebSocketHandler.java` ~lines 253–258: a `System.out.println` sits between the `if (HardReset…)` condition and the intended body, and the block closes early. Result: **every** Portal/App/iOS message triggers `hardResetResponse` (spurious charger reboots), and the entire `else if` chain after it (`RemoteStart`, `RemoteStop`, `ReserveNow`, `ChangeAvailability`, `UnlockConnector`, `TriggerMessage`, `CancelReservation`, `SetChargingProfile`, …) is **unreachable dead code**.
- **Files:** `evya-ocpp-main/.../handler/WebSocketHandler.java`.
- **Change:** wrap the `HardReset` branch body in braces so only the reset call is conditional, and the `else if` chain is reachable.
- **Verify:** a non-reset message does NOT call `hardResetResponse`; each command type routes to its handler. Add a unit test over the dispatch method if feasible. `mvnw compile` green.

### BUG-2 — Fix timezone handling in check-in  🟠
- **Problem:** `check-in-screen.tsx:589-593` adds 5h30m to a `Date` then calls `.toISOString()` (which already converts to UTC) → sessions start 5.5h in the future. `getCurrentISTISO()` and `convertISOToDisplaySameTime()` use three different ad-hoc offset strategies.
- **Files:** `evya-native-main/.../src/screens/station-details/check-in-screen.tsx`.
- **Change:** standardize on UTC ISO for transport; format to IST only for display using a single helper. Remove manual millisecond offsets.
- **Verify:** a session started "now" has a start time equal to now (±clock skew), not +5:30.

### BUG-3 — Remove hardcoded vehicle on the charging screen  🟠
- **Problem:** `charging-screen.tsx:262-263` passes `vehicleName={'Tata Curve EV'} vehicleNumber={'TS08EV9876'}` — every user sees this during every session.
- **Files:** `evya-native-main/.../src/screens/station-details/charging-screen.tsx`.
- **Change:** pass the user's selected vehicle from state.
- **Verify:** the charging screen shows the logged-in user's actual vehicle.

### BUG-4 — `deleteFavoriteStation` ignores the station id  🟠
- **Problem:** `Apis.js:1071` takes `(userId, stationId)` but the URL is `/site/deleteFavSite/${userId}` — `stationId` is dropped, so it can't target a specific favorite.
- **Files:** `evya-native-main/.../src/axios/Apis.js`; confirm the backend `DeleteMapping("/deleteFavSite/{userId}")` signature in `SiteController.java` — the API may also need a `siteId` param.
- **Change:** pass `stationId`/`siteId` through to a backend route that deletes the specific favorite (coordinate the backend signature if needed).
- **Verify:** deleting one favorite removes only that one.

### BUG-5 — Replace the decommissioned FCM API (or remove dead push)  🟠
- **Problem:** `PushNotification.java:21` uses `fcm.googleapis.com/fcm/send` — the legacy API Google shut off in June 2024. The app also has no Firebase SDK / `google-services.json`, so there's no receiver either.
- **Files:** `evya-ocpp-main/.../utils/PushNotification.java`; app side needs Firebase integration if push is wanted.
- **Change:** either migrate to FCM HTTP v1 (OAuth2 + `google-services.json` on the app) or remove the dead push path and track it as a feature to build later. Decide with the owner.
- **Verify:** if kept, a test notification delivers to a device; if removed, no dead code paths remain.

### BUG-6 — Fix silent Slider prop typos  🟡
- **Problem:** `check-in-screen.tsx:652-654` uses `minimumTrackTincolor` / `maximumTrackTincolor` / `thumbTincolor` (missing "t") — ignored at runtime, slider is unthemed.
- **Files:** `evya-native-main/.../src/screens/station-details/check-in-screen.tsx`.
- **Change:** `minimumTrackTintColor` / `maximumTrackTintColor` / `thumbTintColor`.
- **Verify:** slider renders in brand colors.

### BUG-7 — Orphaned support tickets from login  🟡
- **Problem:** `login-screen.tsx:350` hardcodes `userId: 0` when creating a Need-Help ticket, so tickets aren't tied to the user.
- **Files:** `evya-native-main/.../src/screens/login/login-screen.tsx`.
- **Change:** use the real user id (or, pre-login, capture the entered phone number so support can trace it).
- **Verify:** a ticket created from login carries an identifying field.

### BUG-8 — Server-issued payment order IDs  🟡
- **Problem:** `AddMoney.tsx:77` builds the merchant order id client-side as `'TX' + Date.now()` — predictable and collision-prone.
- **Files:** `evya-native-main/.../src/screens/wallet/AddMoney.tsx`, Backend PhonePe service.
- **Change:** have the server issue the order id on payment initiation; the client never invents it.
- **Verify:** order ids are server-generated and unique under concurrency.

### BUG-9 — Dead/duplicate stop handler (wiring cleanup)  🟡
- **Problem (verified — do NOT remove working RemoteStop):** the Stop button already sends RemoteStop correctly via `charging-status.tsx` (`handleStopCharging` at ~line 546 → `requestType: "RemoteStop"` at ~line 575 → `occprequests` at ~579, wired to the button `onPress` at ~770). **Leave that path intact.** The smell is that the parent `charging-screen.tsx` defines its *own* `handleStopCharging` (~line 195) that only calls `stopCharging()` (clears the local session, no RemoteStop) and passes it as `onStopCharging` (~line 264) — but `ChargingStatus` does not declare an `onStopCharging` prop, so that handler is silently ignored (dead prop, second stop concept that never hits the server).
- **Files:** `evya-native-main/.../src/screens/station-details/charging-screen.tsx`, `charging-status.tsx`.
- **Change:** remove the ignored `onStopCharging` prop and the parent's dead `handleStopCharging`, OR wire it intentionally so the local-session clear happens only after the server confirms the stop. Do not touch the working RemoteStop call in `charging-status.tsx`.
- **Verify:** tapping Stop still sends RemoteStop (`/ocpp/.../request` with `RemoteStop`) exactly once; no dead prop remains; `tsc` + Metro bundle pass.

---

## PHASE 4 — Performance & UX (the "sluggish" fixes)

### PERF-1 — Replace the remote-WebView map with a native map  🔴 (biggest felt win)
- **Problem:** Home and the Map tab render a `WebView` of `web.evyaa.com` (`WebMapSection.tsx`, `WebViewScreen.tsx`, Map tab in `app-navigation.tsx:92-108`). Combined with PERF-2 it reloads a remote page on every visit → white screen + network wait.
- **Files:** `evya-native-main/.../src/screens/map/WebMapSection.tsx`, `screens/home/WebViewScreen.tsx`, `routes/app-navigation.tsx`.
- **Change:** render `react-native-maps` (already a dependency) natively. Fetch stations by **viewport bbox + zoom**, not all at once (see PHASE 6 for the scale design). Keep the WebView only if a native map is truly infeasible — but then at least fix PERF-2.
- **Verify:** returning to the map is instant (no network reload); markers render from local state.

### PERF-2 — Stop unmounting every tab on blur  🔴
- **Problem:** `app-navigation.tsx:184` sets `unmountOnBlur: true` on all tabs → full remount + refetch + lost scroll on every tab switch.
- **Files:** `evya-native-main/.../src/routes/app-navigation.tsx`.
- **Change:** set `unmountOnBlur: false` (or remove it) so tabs keep their state; rely on TTL/pull-to-refresh for freshness instead.
- **Verify:** switching tabs and back preserves scroll and doesn't refetch.

### PERF-3 — Push live charging over WebSocket; kill 30s polling & fake delays  🟠
- **Problem:** live charging polls `/ocpp/metervalues` every 30s (`charging-screen.tsx:182`) → gauge shows 0 for up to 30s and jumps. Connect flow has stacked artificial `setTimeout` delays (`connect-charger-screen.tsx`).
- **Files:** `evya-native-main/.../src/screens/station-details/charging-screen.tsx`, `connect-charger-screen.tsx`; backend needs a relay of charger meter values to the app (WebSocket/SSE).
- **Change:** subscribe to the transaction over WebSocket; **interpolate** elapsed time/energy with a 1s local timer corrected by real readings so the UI ticks smoothly. Remove the artificial 2s+2s delays; drive UI off real charger events.
- **Verify:** the gauge updates smoothly within ~1–2s of real data; time-to-"charging visible" drops from ~35s to a few seconds.

### PERF-4 — Fix re-render storms  🟠
- **Problem:** `home-screen.tsx:71-76` `useSelector` returns a new object literal → Home re-renders on every Redux action. `useFocusEffect` refetches on every focus in 3 screens.
- **Files:** `evya-native-main/.../src/screens/home/home-screen.tsx` and the other `useFocusEffect` users.
- **Change:** use `shallowEqual` or separate selectors; replace focus-refetch with TTL/pull-to-refresh (superseded by PHASE 5 if RTK Query is adopted).
- **Verify:** Home doesn't re-render on unrelated dispatches (React DevTools/profiler); no refetch on every navigation.

### PERF-5 — Virtualize all lists  🟡
- **Problem:** 7 screens use `ScrollView + .map` (renders all rows up front, stutters past ~50 items).
- **Files:** the 7 files identified in P0 (e.g. map station lists, transactions, bookings).
- **Change:** convert to `FlatList` (with `getItemLayout` + memoized rows + `keyExtractor`) or `@shopify/flash-list`.
- **Verify:** long lists scroll at 60fps; only visible rows mount.

### PERF-6 — CDN images + right-size assets  🟡
- **Problem:** `assets/images/chargingstation.png` is **1.9 MB**; several chargers/ banners are 500KB–740KB. Bundled assets total 8.3 MB.
- **Files:** `evya-native-main/.../src/assets/images/*`.
- **Change:** serve station/brand imagery from a CDN with on-the-fly resize + WebP via `react-native-fast-image`; compress bundled assets; keep only what's needed at device resolution.
- **Verify:** screens with images have no visible load hitch; bundle/APK size drops.

### PERF-7 — Strip production logging & dead native modules  🟡
- **Problem:** 196 `console.*` calls in the app (each a sync bridge hop in prod); unused native deps (`react-native-razorpay`, `react-native-get-location`, unused `react-native-maps`/`@mapbox/polyline` paths) bloat the 82 MB APK.
- **Files:** app-wide; `package.json`.
- **Change:** strip `console.*` in release (babel plugin `transform-remove-console`); remove genuinely unused dependencies (verify with a dependency check first).
- **Verify:** release bundle has no console output; APK size drops; app still builds + bundles.

---

## PHASE 5 — State & data layer (fixes "irregular screens")

### STATE-1 — Single source of truth for user/auth  🟠
- **Problem:** `userId`/user is stored in Redux (`AuthSlice`), Context (`AppContext`), and AsyncStorage (5 files) and drifts out of sync → screens show stale/empty data.
- **Files:** `evya-native-main/.../src/redux/AuthSlice.js(→.ts)`, `contexts/app-context.tsx`, all AsyncStorage users, `login-screen.tsx`.
- **Change:** make Redux the single owner of user/session state; use AsyncStorage only as a persistence layer behind it (redux-persist); Context holds UI-only state. All screens read from one place.
- **Verify:** updating the user in one place reflects everywhere immediately; no screen reads a second copy.

### STATE-2 — Adopt a server-cache layer (RTK Query)  🟠
- **Problem:** manual `loading` flags, ad-hoc caching, refetch storms, and duplicated fetches (e.g. `getUserRFIDs` called twice via `getRequestedRFIDs` + `getActiveRFIDs`).
- **Files:** new `src/redux/api/` slice(s); migrate `Apis.js` calls incrementally.
- **Change:** adopt **RTK Query** (already available via Redux Toolkit) for all server state — dedup, caching, background refetch, invalidation, generated hooks. Migrate a few endpoints first (stations, vehicles, wallet) to prove the pattern, then the rest.
- **Verify:** duplicate fetches gone; screens show cached data instantly then revalidate; loading/error handled by the query layer.

### STATE-3 — De-duplicate competing components  🟡
- **Problem:** two different `BookingSuccessPopup.tsx` (`extra/` and `station-details/`) → confirmation looks different by path. 8 files are >90% commented out.
- **Files:** app-wide.
- **Change:** keep one `BookingSuccessPopup`, delete the other and update imports; delete dead/commented-out screens (or move to a clearly-marked `graveyard/` if history is wanted).
- **Verify:** one confirmation component app-wide; `tsc` + Metro bundle still pass.

---

## PHASE 6 — Scale architecture (1K → 10K → 100K chargers)

> Core principle: **separate cold data from hot data; fetch by viewport; push, don't poll; cache, don't refetch.**

### SCALE-1 — Viewport-scoped station fetch (retire "get all")  🔴
- **Problem:** the app's station load returns everything — O(N) query + payload that dies past ~10K.
- **Change:** add a backend endpoint `GET /stations?bbox=<minLng,minLat,maxLng,maxLat>&zoom=<z>` returning only what's in view. At low zoom, return **server-side clusters with counts**, not points. Debounce refetch on pan/zoom.
- **Scale tiers:** ~1K → fetch all + client cluster (Supercluster) is acceptable. ~10K → viewport fetch + client cluster. ~100K+ → SCALE-2.
- **Verify:** panning fetches only visible stations; low-zoom shows cluster counts; payload size is bounded regardless of total charger count.

### SCALE-2 — Vector tiles for 100K+ geometry (cold plane)  🟠
- **Change:** stand up a tile server (Martin/Tegola/tippecanoe) that turns the station table into Mapbox Vector Tiles; render with **MapLibre GL Native** (free) or Mapbox. Tiles are CDN-cached and GPU-rendered — handles millions of points at 60fps. Metadata (name, connectors, power) rides in tile features or a cached `/stations/{id}` detail call.
- **Verify:** map stays at 60fps with 100K+ points; tiles are CDN-cached (304 on repeat).

### SCALE-3 — Real-time status plane off EvyaSense's Redis (hot)  🟠
- **Insight:** EvyaSense already consumes OCPP `StatusNotification` events from Kafka into Redis, keyed by charger/connector. **That Redis is the hot plane.**
- **Change:** expose `GET /status?bbox=…` and a WebSocket `subscribe(bbox)` backed by that Redis; stream **delta** status only for chargers currently in the user's viewport (50–500), not the whole set. App colors markers from this. Fall back to viewport-only polling if the socket drops.
- **Verify:** status changes on a visible charger reflect in the app within ~1–2s; the client never receives status for off-screen chargers.

### SCALE-4 — Cold/hot split for metadata caching  🟡
- **Change:** serve static station metadata with `ETag`/`If-None-Match` (repeat loads = 304, instant, cheap). Keep dynamic status entirely on the hot plane (SCALE-3). Never mix them in one payload.
- **Verify:** repeat metadata loads return 304; status never invalidates the metadata cache.

### SCALE-5 — Offline-first shell  🟡
- **Change:** cache last-known stations + user vehicles so the app opens instantly and shows something with no network; revalidate in the background. Splash must not block on the network.
- **Verify:** app is interactive <1s cold, even offline, showing cached data.

---

## Verification Playbook (exact commands — confirmed working on this machine)

Environment: **Node 22, npm 10, JDK 17, Docker present. Maven only via project `mvnw` wrappers.**
Java `JAVA_HOME` for wrapper builds: `/c/Program Files/Java/jdk-17`.

### CMS (Vite/React)
```bash
cd "evya-cms-frontend-main/evya-cms-frontend-main"
npm install          # needed once — reconciles missing qrcode.react
npx vite build       # EXPECT: "built in ..." + dist/ assets
```

### Mobile app (React Native)
```bash
cd "evya-native-main/evya-native-main"
npm install
npx tsc --noEmit     # EXPECT after H-3: 0 errors (baseline: 10, all in AuthSlice.js)
npx jest             # EXPECT after H-4: passing (baseline: 1 failed on AsyncStorage mock)
# Full JS build — resolves every import across all screens (no emulator needed):
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output /tmp/app.bundle --assets-dest /tmp/assets
# EXPECT: "Done writing bundle output"
```

### Backend/Server (Java 8, Spring Boot 2.3)
```bash
cd "Backend/Server"
./mvnw -q -DskipTests compile    # EXPECT: exit 0, classes under target/classes/com/ewe
```

### evya-ocpp (Java 8, Spring Boot 2.3)
```bash
cd "evya-ocpp-main/evya-ocpp-main"
./mvnw -q -DskipTests compile    # EXPECT: exit 0, classes under target/classes/com/test/ocpp
```

### EvyaSense (Java 17, Spring Boot 3)
```bash
# NOTE: its mvnw pins Maven 3.9.12 (may not download offline). Use a cached Maven + JAVA_HOME:
export JAVA_HOME="/c/Program Files/Java/jdk-17"
cd "EvyaSense-main/EvyaSense-main"
mvn -DskipTests compile          # EXPECT: "BUILD SUCCESS", 47 source files compiled
```

### API contract check (after any endpoint change)
```bash
# App side: list every URL in Apis.js
grep -nE 'axios\.(get|post|put|delete)|apiClient\.(get|post|put|delete)' \
  "evya-native-main/evya-native-main/src/axios/Apis.js"
# Backend side: list every route
grep -rhoE '@(Get|Post|Put|Delete|Request)Mapping\([^)]*' \
  "Backend/Server/src/main/java/com/ewe/controller/" \
  "evya-ocpp-main/evya-ocpp-main/src/main/java/com/test/ocpp/controller/"
# EXPECT: every app path resolves to a controller route (method + path + params match)
```

### Runtime E2E (BLOCKED until the human adds files)
Cannot run until: **DB schema/DDL** exists (all backends use raw SQL / `hbm2ddl=validate`), **`web.evyaa.com`** map source is provided, and **Kafka/Redis** are up (EvyaSense `docker-compose.yml` covers Kafka/Redis; the log-shipper into Kafka is still missing). Once the schema lands, boot Backend → OCPP → drive a login + station fetch + charge request through and verify against `docs/FLOWS.md`.

---

## Execution order (live status)

**DONE + verified:** Phase 0 · Phase 1 · Phase 2 (SEC-1…SEC-8) · Hardening (SEC-2b/2c/4b) · STEP 1 (DB alignment) · STEP 2 (runtime E2E — live 401/JWT proofs) · **STEP 3 (SEC-4c SQL sweep — 0 live concat sites in key paths; live injection test on OTP route → 400 not 500) · STEP 4 (BUG-1 brace fix → command chain reachable; BUG-2…BUG-9 all verified).**
**New assets in repo:** `evyaweb-main` (map app) · `evya_schema.sql` (DB schema, one `evya` DB, 71 tables).

**ALSO DONE + verified:** STEP 5 (PERF-2/6) · STEP 6 (STATE-1/2/3) · STEP 7 (PERF-4/5/7) · STEP 8 (SCALE-2 clustering, SCALE-1 bbox, SEC-9 public-map allowlist [live-proved], BUG-11, SCALE-3 live-status hot plane [build-verified; live needs Redis+log-shipper]).
**REMAINING:** PERF-3 (live-charging WebSocket — deferred, infra-heavy) · residual deep OCPP service-layer SQL sweep · BUG-12 · **human track below**.

Go-forward order (secure → correct → prove → smooth → clean → scale):

1. **STEP 1 — DB alignment** *(next agent task)*: SEC-6b (repoint OCPP `DB_URL` → `evya`), BUG-10 (`account_balance`→`accountBalance`), then a **column audit** of all raw SQL vs `evya_schema.sql`. Makes code match the real DB.
2. **STEP 2 — Runtime E2E** *(verification)*: Docker SQL Server → create `evya` → boot Backend+OCPP → prove live: 401 on protected routes, JWT fail-fast, forged/refresh token rejected. Confidence gate.
3. **STEP 3 — Finish security sweep (SEC-4c)**: parameterize the remaining ~116 `MobileAPIServiceImpl` + OCPP DAO SQL sites. Fully closes SQLi.
4. **STEP 4 — Correctness (Phase 3), BUG-1 first**: the WebSocketHandler brace bug breaks charger command routing — nothing charges right until fixed. Then BUG-2…BUG-9.
5. **STEP 5 — Smoothness quick wins**: PERF-2 (`unmountOnBlur:false`) + PERF-6 (CDN/resized images). Instant felt improvement.
6. **STEP 6 — State foundation**: STATE-1 (single source of truth) + STATE-2 (RTK Query). Clean, consistent data; kills "irregular screens."
7. **STEP 7 — Deep perf**: PERF-1 (native map or persisted WebView) · PERF-3 (live charging over WebSocket) · PERF-4/5/7.
8. **STEP 8 — Scale (in `evyaweb-main`)**: SCALE-1 (viewport/bbox fetch) · SCALE-2 (clustering) · SCALE-3 (live status from EvyaSense Redis).

**Human track (parallel, agent cannot do):** rotate exposed secrets · set `JWT_SECRET` (same on both services) · set `OCPP_WS_BASIC_USER/PASSWORD` · run the `evya_online`→`evya` data merge.

Everything else is quality and polish once the above are solid.
