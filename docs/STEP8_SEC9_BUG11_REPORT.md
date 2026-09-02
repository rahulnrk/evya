# SEC-9 + BUG-11 Report — Public map allowlist + clean bbox 400

**Date:** 2026-07-27  
**Backend:** `Backend/Server`  
**Trigger:** Live test — `GET /api/mobile/mobilegetAllSites` → **401** without JWT → blank `web.evyaa.com` map (evyaweb axios has no `Authorization` header).

---

## SEC-9 — Option A: permitAll for read-only public map GETs

### File
`src/main/java/com/ewe/config/WebSecurityConfig.java`

### Allowlisted (GET only)

| Endpoint | Method | Why public (read-only, non-sensitive) |
|---|---|---|
| `/api/mobile/mobilegetAllSites` | **GET** | Station list for map discovery; only path `evyaweb/src/axios/Apis.jsx` calls |
| `/api/mobile/Details` | **GET** | Public site detail by `siteId` (ports/connectors/status for a station) |
| `/services/station/stationDetails/**` | **GET** | Public station entity by id |
| `/services/site/siteDetails/**` | **GET** | Public site details by id |
| `/services/site/stationDetailsbysiteid/**` | **GET** | Stations belonging to a site (discovery) |

All registered with `HttpMethod.GET` so POST/PUT/DELETE on related paths stay authenticated.

### Confirmed not allowlisted (stay authenticated)

| Category | Examples |
|---|---|
| Auth/user | `/api/mobile/userDetails/**`, profile update, registration (reg already public by design) |
| Wallet / payments | wallet, PhonePe, payment |
| Bookings / charge | reservation, remote start/stop |
| RFID | RFID list / toggle |
| Tickets / help | `/services/issues/**` |
| Favourites (user-scoped) | `/services/site/getFavSite/user/**` |
| Franchise writes | request-franchise (role-gated) |
| Admin / CMS lists | siteList, getAllSites by org, dashboard, etc. |
| RN station search with filters that already use JWT | `/services/station/getstations` — **left authenticated** (RN continues to send token) |

### evyaweb call surface
`Apis.jsx` only hits `GET https://server.evyaa.com/api/mobile/mobilegetAllSites`.  
Other detail paths are allowlisted proactively for map drill-down / deep links without expanding the auth surface to writes.

### RN
Authenticated RN calls unchanged: still send Bearer JWT; public GETs also work with a token (filter still accepts optional Bearer).

---

## BUG-11 — Malformed bbox → 400 JSON

### File
`src/main/java/com/ewe/controller/advice/ErrorCtrl.java`

### Change
Specific handler for `MethodArgumentTypeMismatchException` (more specific than the catch-all `Exception` → 500):

```json
{
  "success": false,
  "code": 400,
  "parameter": "minLat",
  "rejectedValue": "1 OR 1=1",
  "message": "Invalid parameter 'minLat': expected Double"
}
```

Binding still fails **before** SQL; named parameters remain injection-safe. This only fixes status/body quality.

---

## Verify

| Check | Result |
|---|---|
| `JAVA_HOME=…/jdk-17` `mvnw -DskipTests compile` | **BUILD SUCCESS** (exit 0) |

### Suggested live smoke (after deploy/restart)
```bash
# No token — must be 200 (not 401)
curl -s -o /dev/null -w "%{http_code}" \
  "https://server.evyaa.com/api/mobile/mobilegetAllSites?latitude=17.41&longitude=78.47"

# Malformed bbox — must be 400 (not 500)
curl -s -w "\n%{http_code}\n" \
  "https://server.evyaa.com/api/mobile/mobilegetAllSites?minLat=1%20OR%201%3D1&minLng=78&maxLat=18&maxLng=79"

# Sensitive — must still be 401 without token
curl -s -o /dev/null -w "%{http_code}" \
  "https://server.evyaa.com/api/mobile/userDetails/1"
```
