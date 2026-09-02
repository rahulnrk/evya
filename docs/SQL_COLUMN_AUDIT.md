# SQL column audit vs `evya_schema.sql`

**Date:** 2026-07-26  
**Schema:** `evya_schema.sql` (71 tables, ~374 columns)  
**Scope:** Hand-written SQL / native queries in Backend + OCPP Java sources.

---

## SEC-6b (config)

| Item | Action |
|------|--------|
| OCPP `DB_URL` | **Must use same `evya` DB as Backend** (not `evya_online`) |
| Files | `evya-ocpp-main/.../.env.example`, `application.properties` comments, `docs/WALLET_DB_NOTES.md` |

Deploy: set identical `DB_URL` / `DB_USER` / `DB_PASSWORD` on both services.

---

## BUG-10 — `account_balance` → `accountBalance`

Schema `accounts.accountBalance` (camelCase). Four OCPP `GeneralDaoImpl` methods fixed:

| Method | Change |
|--------|--------|
| `getUserInfoByRfid` | `a.accountBalance`; also `r.userId`, `r.rfId` |
| `checkRfidValidity` | `r.expiryDate`, `r.rfId` |
| `getAccountBalanceByUserId` | `a.accountBalance` |
| `updateAccountBalance` | `SET accountBalance = :bal` (+ parameterized) |

Also parameterized RFID/phone lookups while touching these methods.

---

## Mismatches found and fixed

| Wrong (in SQL / mapping) | Correct (`evya_schema.sql`) | Location(s) | Status |
|--------------------------|-----------------------------|-------------|--------|
| `account_balance` | `accountBalance` | OCPP `GeneralDaoImpl` (4 queries) | **Fixed** |
| `rf_id` | `rfId` | OCPP `GeneralDaoImpl` RFID queries | **Fixed** |
| `user_id` on **rfid** | `userId` | OCPP `GeneralDaoImpl`; Backend `RFIDServiceImp` | **Fixed** |
| `expiry_date` | `expiryDate` | OCPP `GeneralDaoImpl` | **Fixed** |
| `mobilenumber` | `mobileNumber` | Backend `MobileAPIServiceImpl` OTP; `UserServiceImpl` lists | **Fixed** |
| `connector_Id` / `connector_id` | `connectorId` | OCPP `StationDaoImpl.getPortUniqId`; `JSONDataParser`; `ResponseService` | **Fixed** (aliases preserved where Java reads map keys) |
| `station_Id` (wrong casing) | `station_id` | OCPP port joins | **Fixed** where wrong; `station_id` is correct |
| `referNo` (station) | `OCPPId` | OCPP many queries (`ResponseService`, `StationDaoImpl.pingStnIds`, etc.) | **Fixed** in SQL → `OCPPId` often `AS referNo` for map keys |
| Employee `@Column` snake_case | schema camelCase | Backend `Employee.java` (`joiningDate`, `username`, `fullname`, `mobileNumber`, `active`) | **Fixed** |

---

## Valid snake_case (do **not** “fix”)

These appear in schema as written:

| Column | Table(s) |
|--------|----------|
| `user_id` | `accounts`, `password`, `usersinroles`, `users_in_owners`, … |
| `account_id` | `accounts` FK side, `account_transaction`, `rfid` |
| `station_id` | `port` |
| `owner_org_id` | `users_in_owners` |
| `wl_org_id` | `users_in_whitelabels` |
| `site_id` | `station`, etc. |

---

## Residual / not fully rewritten this pass

| Issue | Notes |
|-------|--------|
| **Java still uses map key `referNo`** | SQL now selects `OCPPId AS referNo` in several places so call sites keep working. Prefer migrating readers to `OCPPId` later. |
| **`session` table** | Queried heavily in OCPP (`session`, `accountTransaction_id`) but **not present** in `evya_schema.sql` dump. Treat as schema dump incomplete or legacy table — **not renamed blindly**. |
| **`organization` / `users_in_org`** | `sessionDataServiceImpl` references tables not in dump. |
| **Remaining SQLi** | Many queries still concatenate values (SEC-4 sweep); this audit is **column naming**, not parameterization completeness. |
| **`statusNotification.port_id`** | Used in joins; confirm against live DB if dump incomplete. |
| **Hibernate entity `@Column` drift** | Other entities may still declare wrong column names; only `Employee` was corrected when found. |

---

## How the audit was run

1. Parse `CREATE TABLE` / quoted column identifiers from `evya_schema.sql`.  
2. Grep Backend + OCPP `*.java` for SQL keywords + known wrong tokens (`account_balance`, `mobilenumber`, `rf_id`, `referNo`, `connector_Id`, …).  
3. Classify: wrong-vs-schema → fix; valid snake_case → leave; missing tables → residual log.  
4. `mvnw -DskipTests compile` on both backends after edits.

---

## Verify

| Check | Result |
|-------|--------|
| Backend compile | green (after edits) |
| OCPP compile | green (after edits) |
| `account_balance` in OCPP src | **0** |
| Shared wallet DB config | OCPP `.env.example` → `databaseName=evya` |
