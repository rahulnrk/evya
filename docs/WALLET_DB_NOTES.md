# Wallet DB topology (SEC-6 / SEC-6b)

**Status:** **SEC-6b DECIDED — consolidated on `evya`**

## Decision

**Repoint OCPP `DB_URL` to the same `evya` database as Backend.**

| Service | `DB_URL` target |
|---------|-----------------|
| Backend/Server (PhonePe **credit**) | `databaseName=evya` |
| evya-ocpp (BillingService **debit**) | **same** `databaseName=evya` |

Historical split (`evya` vs `evya_online` on different hosts) is **retired** for wallet integrity.

## Config

Both services already use env placeholders:

```
DB_URL=jdbc:sqlserver://HOST:1433;databaseName=evya;encrypt=true;trustServerCertificate=true
DB_USER=...
DB_PASSWORD=...
```

OCPP `.env.example` and `application.properties` comments now require **identical** credentials/URL as Backend.  
Operators must set the same env vars on both processes in deploy.

## Code notes

- SEC-6 atomic credit/debit still apply — now on the **same** `accounts` / `account_transaction` tables.
- BUG-10: OCPP queries must use schema column `accountBalance` (not `account_balance`).

## Residual risk

- Ensure any legacy data only in `evya_online` is migrated or abandoned before cutover.
- Dual-running against two DBs during migration is unsafe — cut over fully.
