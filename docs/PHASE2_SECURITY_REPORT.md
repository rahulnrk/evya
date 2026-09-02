# Phase 2 Security Cluster — Report

**Date:** 2026-07-26  
**Cluster:** SEC-1 + SEC-2 + SEC-3 + SEC-5 (together) → SEC-4, SEC-6, SEC-7, SEC-8

---

## What landed

### SEC-1 — OTP phone-bound + rate limit
- `OtpService`: SecureRandom **6-digit**, TTL 5 min, send throttle 60s, **5 verify attempts → lockout 15 min**
- Redis-ready (`otp.use-redis`); default **false** uses in-memory for local/tests
- `/api/mobile/otp/verify?phoneNo=&otp=` — verifies **that phone only**
- Unit tests: `OtpServiceTest` (cross-phone reject, lockout, expiry, length)

### SEC-2 — JWT login DTO
- `jjwt` + `JwtTokenProvider`
- `LoginController` returns `AuthResponse` `{ token, refreshToken, userId/id, roleId, orgId, … }` — **no User entity**
- OTP verify also issues access + refresh tokens
- `User.getPasswords()` → `@JsonIgnore`
- CMS `loginDispatcher` stores real `data.token` / `userId`

### SEC-3 — Filter chain
- Backend: JWT filter, stateless, allowlist OTP/login/registration/docs; else **authenticated**; franchise antMatchers role-gated; CORS from env
- OCPP: Spring Security + JWT; `/ocpp/request` admin roles; `/ocpp/app/**` authenticated; `/ocpp16/**` permitAll (WS Basic separate)

### SEC-5 — App real OTP + Bearer
- Stubs removed; `sendOtp` / `verifyOtp(phone, otp)` hit server
- Token saved to AsyncStorage; **axios + apiClient** interceptors attach `Authorization: Bearer`
- Login UI **6-digit** OTP; passes `{ phoneNo, otp }` to Redux

### SEC-4 — SQL (priority sites)
- Phone lookup: `SELECT id FROM Users WHERE mobilenumber = :phone`
- OCPP `getStationUniqId`: `OCPPId = :ocppId` via `getRecordBySqlWithParam`

### SEC-6 — Atomic wallet
- PhonePe credit: claim PENDING → atomic `balance + amt` → COMPLETED (idempotent)
- OCPP debit: `UPDATE … SET balance = balance - :amt WHERE id=:id AND balance >= :amt`
- See `docs/WALLET_DB_NOTES.md` — **two different DBs**

### SEC-7 — WS auth
- Handshake: HTTP Basic (`OCPP_WS_BASIC_*`) + station must exist + **no duplicate live session**
- `WebSocketHandler`: refuse swap/evict of open station session

### SEC-8 — App OCPP path
- `occprequests` → `POST /ocpp/app/request` (not privileged `/request`)

---

## Verify checklist (agent)

| Check | Expected |
|-------|----------|
| Backend `mvnw compile` | green |
| Backend `OtpServiceTest` | green |
| OCPP `mvnw compile` | green |
| App Metro bundle | green |
| Unauth `GET /services/site/siteList` | **401** |
| OTP wrong phone | reject |
| Secrets scan | no new literals |

Runtime E2E login still needs live DB + Twilio + env JWT secret.

---

## Human follow-ups
1. Set `JWT_SECRET`, `OCPP_WS_BASIC_USER/PASSWORD` on deploy  
2. Point both services at same JWT secret  
3. Enable Redis (`OTP_USE_REDIS=true`) for multi-instance OTP  
4. Rotate previously leaked secrets  
5. Unify wallet DBs (see WALLET_DB_NOTES)
