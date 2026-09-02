# EVYA Security Baseline (scan only — no fixes)

**Generated:** 2026-07-26 (Phase 0.5)  
**Rule:** document only. Fixes are Phase 2 (SEC-*).

---

## 1. Authentication & authorization model

### Mobile app

| Item | Finding |
|------|---------|
| Login mechanism | Intended OTP SMS; **client stubs** OTP (`Apis.js` send/verify) → always `userId: 3` |
| Session credential | **None** — only AsyncStorage `ID` (numeric userId) |
| HTTP auth | Axios interceptor TODO; **no Authorization header** on app requests |
| Trust boundary | Any client can call `/api/mobile/*` and `/services/*` with arbitrary `userId` path/body params |

### CMS (spark-stop)

| Item | Finding |
|------|---------|
| Login | POST `login/authenticate` with Base64 password |
| Token | Expects `data.token` → stores `localStorage.authToken` |
| Server response | Returns raw `User` / `EmployeeDTO` **with no JWT** (`LoginController.java:59-74`) |
| Effect | `Authorization: Bearer undefined` (or stale) — not validated server-side anyway |
| Role gate | Client-only: franchise URLs rejected if `roleId !== 4` in axios interceptor (`AxiosServices.jsx`) — bypassable |

### Backend Spring Security

```java
// WebSecurityConfig.java:20-28
.csrf().disable()
.authorizeRequests()
.antMatchers("/**").permitAll()
```

| Setting | Value | Risk |
|---------|-------|------|
| Auth required | **None** — all routes public | Critical |
| CSRF | Disabled | Expected for pure API if token-based; today no tokens |
| CORS origins | `*` | Any origin |
| CORS credentials | false | |
| Frame options | disabled | |

### OCPP HTTP / WebSocket

| Setting | Value |
|---------|-------|
| Spring Security filter | No JWT/session auth on `/ocpp/**` |
| CORS | `WebConfiguration` `/**` methods `*` |
| WS path | `/ocpp16/{clientId}` |
| Handshake | `WebSocketClientInterceptor.beforeHandshake` **always returns true** (line 29–47) |
| clientId | Taken from URL path; **not verified** against provisioned stations |
| Session collision | `WebSocketHandler` can **evict** existing station session on reconnect (~line 148) → station hijack / telemetry forge |

---

## 2. Endpoint auth matrix (representative)

Legend: **Pub** = effectively public (no auth enforced).

### Backend `/api/mobile` (Pub)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/otp/{phoneNo}` | SQLi on phone; leaks existence; SMS cost |
| POST | `/otp/verify` | OTP only; no phone binding |
| POST | `/userRegistartion` | Open registration |
| GET/PUT | `/userDetails`, `/updateUserDetails` | IDOR by userId |
| GET | `/walletDetails/{userId}`, `/walletTransactions/{accId}` | IDOR wallet |
| POST | `/pay`, GET `/verify/{orderId}` | Payment initiation/credit |
| POST | `/add_payment`, callbacks | Payment surface |
| GET | `/Details`, `/mobilegetAllSites` | Data disclosure |
| CRUD | EV, address, RFID mobile paths | IDOR |

### Backend `/services/*` (Pub)

| Area | Paths | Risk |
|------|-------|------|
| site/station | list, details, fav, franchise request | Data + mutation without auth |
| rfid | request, toggle, list | |
| issues | create/list/delete tickets | Spam / data |
| employee, userprofile, dashboard | admin CMS APIs | **Full admin surface public** |
| fleet, manufacturer, referral | | |

### Backend login

| Path | Auth | Notes |
|------|------|-------|
| POST `login/authenticate` | Public by design | No rate limit visible; returns entity not token |
| POST `login/registration` | Public | |

### OCPP (Pub)

| Path | Risk |
|------|------|
| POST `/ocpp/request` | **Privileged** features (Reset, firmware, config…) callable by app/anyone |
| POST `/ocpp/app/request` | Restricted set — app **does not use** this |
| GET reservations/metervalues | Info disclosure / session tracking |
| WS `/ocpp16/{id}` | Unauthenticated charger impersonation |

### EvyaSense

| Path | Notes |
|------|-------|
| Controllers on :8080 | No security config found in scan comparable to Backend permitAll pattern; Redis inspect endpoints especially sensitive if exposed |
| Kafka/Redis localhost defaults | OK locally; dangerous if bound publicly |

---

## 3. OTP design (SEC-1 evidence)

| File | Line | Issue |
|------|------|-------|
| `MobileAPIServiceImpl.java` | 99 | In-memory `otpStore` ConcurrentHashMap — lost on restart; not multi-instance |
| | 114 | `Math.random()` 4-digit OTP (1000–9999) |
| | 108 | SQL concat phone lookup |
| | 141–165 | `VerifyOtp(String otp)` iterates **all** store entries; **any** matching code logs in that user |
| | | No attempt limit / lockout |
| `MobileAPIController.java` | 95–97 | Verify accepts **only** `@RequestParam otp` |

App currently **does not call** these endpoints (stubs) — production risk when stubs removed without SEC-1.

---

## 4. SQL injection (string concatenation)

### Unauthenticated-reachable priority samples

| File | Line | Snippet pattern |
|------|------|-----------------|
| `MobileAPIServiceImpl.java` | 108 | `"SELECT id FROM Users WHERE mobilenumber = '" + phoneNo + "'"` |
| | 187–201 | username/email/mobile checks concat |
| | 320 | `"SELECT * FROM users WHERE id = " + id` |
| | 513 | vehicles by userId concat |
| | 592+ | update user path concat |
| | 660, 673 | accounts / transactions |
| | many more (~100+ sites per workorder) |
| `StationDaoImpl.java` (OCPP) | 57 | `"... OCPPId='"+stationRefNum+"'"` — **stationRefNum from WS clientId** |
| | 69 | connector/station numeric concat |
| OCPP other DAOs | statusSendingDataDaoImpl, etc. | similar concat |

**Positive pattern to copy:** OCPP `BillingService` / some `getMapData(sql, params)` overloads use parameters — not universal.

---

## 5. Hardcoded secrets (rotation required by human)

> Values exist in tree; listed by **property name / location only**. Treat all as compromised.

| Location | Keys / secrets present |
|----------|------------------------|
| `Backend/Server/.../application.properties` | `spring.datasource.password`, PhonePe `client-secret`, Twilio `AuthToken`, Gmail `spring.mail.password`, Razorpay `secret.key`, `grok.api.key`, `google.maps.api.key` |
| OCPP `application.properties` | SQL Server `password` for RDS `evya_online` |
| CMS `LocationPicker.jsx` | Google Maps API key embedded in script URL |
| EvyaSense | Default `root`/`root` if env unset (better: `${DB_*}` pattern) |

**Do not commit fixes that re-hardcode.** Phase H-5 / secret rotation is owner-operated.

---

## 6. How the app authenticates requests

```
Current:
  Client → HTTPS API with JSON body/path userId
  No token, no HMAC, no mTLS

Intended (TODO comments only):
  Bearer token in apiClient interceptor
```

CMS sends Bearer when `authToken` in localStorage, but Backend does not validate JWT.

---

## 7. CORS / CSRF summary

| Service | CORS | CSRF |
|---------|------|------|
| Backend | `*` origins | disabled |
| OCPP MVC | all methods `*` | n/a (no Spring Security chain for API auth) |
| OCPP WS | `setAllowedOrigins("*")` | n/a |

---

## 8. Other security-relevant defects (cross-phase)

| ID | Issue |
|----|-------|
| SEC-6 | Wallet credit/debit read-modify-write race; dual DBs possible |
| SEC-7 | WS no auth + session eviction |
| SEC-8 | App hits privileged `/ocpp/request` |
| BUG-1 | Handler brace bug → wrong command dispatch |
| FCM | Legacy API key path (if any key remains) — dead API |
| Password on login | CMS sends Base64-only password (not encryption) — encoding not secrecy |

---

## 9. Severity rollup

| Severity | Count theme |
|----------|-------------|
| Critical | Open API surface; OTP takeover design; unauth OCPP privilege + WS hijack; SQLi on auth paths |
| High | IDOR on wallet/user; secrets in repo; no app auth |
| Medium | CORS *; dual wallet DB uncertainty; CMS fake Bearer |
| Low | Frame options disabled; verbose error messages |

---

## 10. Phase 2 mapping

| Baseline section | Workorder |
|------------------|-----------|
| OTP | SEC-1 |
| Login token + entity leak | SEC-2 |
| Spring Security + CORS | SEC-3 |
| SQL concat | SEC-4 |
| App stubs + interceptor | SEC-5 |
| Wallet atomicity | SEC-6 |
| OCPP WS auth | SEC-7 |
| App OCPP path privilege | SEC-8 |
