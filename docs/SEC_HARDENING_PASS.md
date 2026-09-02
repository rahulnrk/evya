# SEC hardening pass (post Phase 2)

**Date:** 2026-07-26

## SEC-2b — JWT weak default removed

| Before | After |
|--------|--------|
| `jwt.secret=${JWT_SECRET:evya-dev-jwt-secret-change-me-…}` | `jwt.secret=${JWT_SECRET:}` (empty if unset) |
| App starts and mints tokens with known secret | `JwtTokenProvider.validateSecretAtStartup()` / OCPP `JwtSecretValidator` **throws** if missing, &lt;32 chars, or known-weak |

Applies to **Backend** and **OCPP**.

## SEC-2c — refresh ≠ access

| Layer | Change |
|-------|--------|
| Backend filter | `validateAccessToken()` — requires claim `tokenType=access` |
| OCPP JWT filter | Same check before setting SecurityContext |
| Unit tests | `JwtTokenProviderTest.refreshTokenMustNotAuthenticateApi` |

## SEC-4b — PhonePe payment path SQL

All user/order-influenced reads in `PhonePeServiceImpl` now bind parameters:

- `users WHERE id = :id`
- `accounts WHERE user_id = :uid`
- `account_transaction WHERE transactionId = :tid AND status = 'PENDING'`
- account-by-order subquery with `:tid`

**Honest scope:** payment path + earlier phone/clientId sites are parameterized.  
**Still open:** remaining ~100+ concat sites in `MobileAPIServiceImpl` and other OCPP DAOs (track as SEC-4 sweep, not “SQLi closed”).

## SEC-6b — wallet split

No code change. See `WALLET_DB_NOTES.md` — needs your consolidation decision.
