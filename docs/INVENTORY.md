# EVYA System Inventory

**Generated:** 2026-07-26 (Phase 0.1)  
**Root:** `C:\Users\nande\Downloads\EVYA`  
**Also present:** `app-release (1).apk`, `EVYA_AGENT_WORKORDER.md`, `.claude/`

> **Path note:** On disk, native and OCPP folders have a `(1)` suffix from Windows download/unzip:
> - `evya-native-main (1)/evya-native-main`
> - `evya-ocpp-main (1)/evya-ocpp-main`  
> Workorder paths omit the `(1)`. Use the actual disk paths below for all commands.

---

## Project map

| # | Disk path | Purpose | Stack / versions | Entry point | Build command |
|---|-----------|---------|------------------|-------------|---------------|
| 1 | `evya-native-main (1)/evya-native-main` | Customer mobile app (Android/iOS) | React Native **0.74.4**, React 18.2, TypeScript 5.0.4, Redux Toolkit 2.9, axios | `App.tsx` → `src/routes/root-navigation.tsx`; API hub: `src/axios/Apis.js` | `npm install`; `npx tsc --noEmit`; `npx jest`; `npx react-native bundle …` |
| 2 | `Backend/Server` | Main business API (`server.evyaa.com`) | Spring Boot **2.3.1**, Java **8**, package `com.ewe`, Hibernate + SQL Server | `com.ewe.EvyaServerApplication` | `./mvnw -q -DskipTests compile` (Windows: `mvnw.cmd`) |
| 3 | `evya-ocpp-main (1)/evya-ocpp-main` | OCPP 1.6 charger gateway (`ocpp.evyaa.com`) | Spring Boot **2.3.1**, Java **8**, package `com.test.ocpp` | `com.test.ocpp.EvgOcppApplication`; WS: `handler/WebSocketHandler.java` | `./mvnw -q -DskipTests compile` |
| 4 | `evya-cms-frontend-main/evya-cms-frontend-main` | Admin CMS (“spark-stop”) | Vite **5.3**, React **18.3**, Redux Toolkit, shadcn/Radix, Tailwind | `src/main.jsx` → `src/App.jsx`; HTTP: `src/services/AxiosServices.jsx` | `npm install`; `npx vite build` |
| 5 | `EvyaSense-main/EvyaSense-main` | Anomaly / telemetry sense layer | Spring Boot **4.0.2** (pom), Java **17**, Kafka + Redis + MySQL/JPA | `com.evyasense.layer.EvyaSenseLayerApplication`; consumer: `kafka/SenseConsumer.java` | `mvn -DskipTests compile` (wrapper may pin Maven 3.9.12) |

**Extra artifact:** `app-release (1).apk` — prebuilt Android release (not source-of-truth for config).

---

## 1. Customer mobile app (`evya-native`)

| Field | Value |
|-------|--------|
| **Purpose** | End-user EV charging: map/stations, book/pay, RemoteStart/Stop, wallet, RFID, fleet, account |
| **Stack** | RN 0.74.4, React 18.2, TS, React Navigation 7, Redux Toolkit, AsyncStorage, WebView, maps, camera-kit, geolocation, Razorpay SDK (dep present) |
| **Entry** | `App.tsx` wraps Redux + `AppProvider` + `LocationProvider` + `ChargingProvider` + `RefreshProvider` + `RootNav` |
| **API client** | `src/axios/Apis.js` |
| **Build** | `npm install` → `npx tsc --noEmit` / `npx jest` / Metro bundle / `npm run android` |
| **Runtime deps** | Backend HTTPS, OCPP HTTPS, portal, **web.evyaa.com** (map WebView; source **not in repo**), Nominatim reverse geocode, NHTSA VIN decode, Google Maps deep links |

### Hardcoded base URLs (app)

| Constant | Value | Role |
|----------|-------|------|
| `BASE_URL` | `https://server.evyaa.com/api/mobile` | Mobile-only APIs |
| `baseurl` | `https://server.evyaa.com/services` | Shared app/portal services |
| `OCPP_URL` | `https://ocpp.evyaa.com/ocpp` | OCPP HTTP features (RemoteStart, meter values, etc.) |
| `portalurl` | `https://portal.evyaa.com` | Portal reference |
| Map WebView | `https://web.evyaa.com/mapsection` | Home map section |
| Map tab | `https://web.evyaa.com/mapsearch` | Map tab WebView |
| Nominatim | `https://nominatim.openstreetmap.org/reverse?...` | Reverse geocode |
| NHTSA | `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/...` | VIN decode |
| Marketing | `https://evya.energy` | About screen |
| QR expected host (legacy string) | `https://backend.chargeevya.com/?siteId=…` | Scan validation message |

**Auth interceptor:** TODO — no `Authorization` header attached (`Apis.js` ~16–28).

---

## 2. Backend / Server (`Backend/Server`)

| Field | Value |
|-------|--------|
| **Purpose** | Users, OTP login, sites/stations, wallet/PhonePe/Razorpay, RFID, fleet, tickets, CMS services, Beckn search, email |
| **Stack** | Spring Boot 2.3.1, Java 8, Spring Security, JPA/Hibernate, WebSocket starter, Twilio, mail, SQL Server driver |
| **Entry** | `com.ewe.EvyaServerApplication` — dual connectors: `server.port=8800`, `http.port=8211` |
| **Primary mobile controller** | `controller/MobileAPIController.java` → `@RequestMapping("/api/mobile")` |
| **Login** | `LoginController` → `login/authenticate` |
| **Build** | `mvnw.cmd -q -DskipTests compile` → classes under `target/classes/com/ewe` |
| **Docker** | `Dockerfile` (OpenJDK 8; jar name in Dockerfile may not match `Server-0.0.1-SNAPSHOT.jar`) |

### Runtime dependencies

| Dependency | Config source | Notes |
|------------|---------------|--------|
| **SQL Server `evya`** | `application.properties` | Host `13.203.97.248:1433`, user `sa` (password in props) |
| **PhonePe** (sandbox) | `phonepe.*` | Preprod OAuth + pay + order status URLs |
| **Razorpay** | `razorpay.key.id` / `razorpay.secret.key` | Test keys in props |
| **Twilio** | `twilio.*` | SMS OTP |
| **Gmail SMTP** | `spring.mail.*` | App password in props |
| **Google Maps API key** | `google.maps.api.key` | Also hardcoded in CMS `LocationPicker.jsx` |
| **xAI / Grok API** | `grok.api.key` / `grok.api.url` | `https://api.x.ai/v1/chat/completions` |
| **Hibernate Search FS** | `C:/hibernate/lucence/indexes` | Local filesystem indexes |
| **Beckn** | `beckn.*` | Domain/city defaults |

### Controller base paths (summary)

| Prefix | Controller |
|--------|------------|
| `/api/mobile` | MobileAPIController, PhonePeController |
| `/services/*` | site, station, fleet, employee, userprofile, dashboard, rfid, issues, manufacturer, referral-codes, notes |
| `/login/` | LoginController |
| `/tasks` | TaskController |
| `/service/delete` | DeletionController |
| `/messageBundle` | i18n |
| `/` | WelcomeController |

---

## 3. OCPP server (`evya-ocpp`)

| Field | Value |
|-------|--------|
| **Purpose** | OCPP 1.6 WebSocket to chargers; HTTP API for portal/app remote commands; billing/session/meter |
| **Stack** | Spring Boot 2.3.1, Java 8, WebSocket, JPA, Twilio, Gson |
| **Entry** | `com.test.ocpp.EvgOcppApplication` |
| **WS path** | `/ocpp16/{clientId}` (`WebSocketConfiguration`) — CORS `*`; interceptor always accepts |
| **HTTP API** | `MessagesController` `@RequestMapping("/ocpp")` — e.g. `/ocpp/request`, `/ocpp/app/request`, meter values, logs |
| **Core handler** | `handler/WebSocketHandler.java` — session map by station `clientId` |
| **Ports** | `server.port=8085`, `http.port=8212` |
| **Build** | `mvnw.cmd -q -DskipTests compile` |

### Runtime dependencies

| Dependency | Config | Notes |
|------------|--------|--------|
| **SQL Server `evya_online`** | RDS `evya-database.cj4o2io0879p.ap-south-1.rds.amazonaws.com:1433` | User `admin` (password in props) |
| **Station/session log files** | `/home/ubuntu/logs/stationLogs/`, `sessionLogs/` | Linux paths |
| **FCM push** | `utils/PushNotification.java` | Legacy `fcm.googleapis.com/fcm/send` (deprecated API) |
| **Twilio** | dependency present | SMS-related |

**Wallet concern:** billing mutates wallet balance in OCPP DB path; Backend PhonePe credits may use separate `evya` DB — same-instance vs split is **unconfirmed** (flag for SEC-6 / docs later).

---

## 4. Admin CMS (`evya-cms-frontend`)

| Field | Value |
|-------|--------|
| **Purpose** | Operator portal: sites/stations, employees, fleet, issues, RFID, franchise, OCPP ops, EvyaSense dashboard, reports |
| **Stack** | Vite 5, React 18, Redux, Radix/shadcn, Tailwind, axios, recharts, jspdf, xlsx, `qrcode.react` |
| **Package name** | `spark-stop` |
| **Entry** | `index.html` → `src/main.jsx` |
| **HTTP layer** | `src/services/AxiosServices.jsx` — three clients: main `baseURL`, `baseOCPPURL`, `baseAlertsURL` |
| **Build** | `npm install` then `npx vite build` → `dist/` |
| **Auth client-side** | `localStorage` `authToken` / `roleId`; Bearer header; franchise route gated client-side only |

### Hardcoded URLs (CMS)

| Name | Active value | Role |
|------|--------------|------|
| `baseURL` | `http://localhost:8800` | Backend (prod comment: `https://server.evyaa.com`) |
| `baseOCPPURL` | `https://ocpp.evyaa.com` | OCPP admin APIs |
| `baseAlertsURL` | `http://35.154.169.228:8080/` | EvyaSense / alerts |
| Google Maps JS | key embedded in `LocationPicker.jsx` | Places/map picker |
| Verify import | `http://localhost:8080/station/verify-and-import` | Franchise verify (local Sense?) |
| Freepik BG | free-vector URL | Cosmetic |

**Hygiene note:** `README.md` still contains unresolved merge conflict markers (`<<<<<<< HEAD`).

---

## 5. EvyaSense (`EvyaSense-main`)

| Field | Value |
|-------|--------|
| **Purpose** | Consume charger/OCPP events, normalize, detect anomalies, store hot state in Redis + durable MySQL |
| **Stack** | Spring Boot 4.0.2, Java 17, Kafka, Redis, JPA/MySQL, Lombok |
| **Entry** | `EvyaSenseLayerApplication` |
| **Kafka** | Topic `evya-sense-topic`; consumer group `sense-reader-group-v4`; bootstrap `localhost:9092` |
| **Redis** | `localhost:6379` |
| **MySQL** | `${DB_URL:jdbc:mysql://localhost:3306/evya}` + `DB_USER` / `DB_PASSWORD` / `JPA_DDL_AUTO` env pattern |
| **HTTP port** | `8080` |
| **Controllers** | Anomaly, Data, RedisInspect, Sense (ingest/read) |
| **Docker Compose** | Zookeeper + Kafka only (no Redis/MySQL services in compose) |
| **Build** | Prefer system `mvn` with `JAVA_HOME` → JDK 17 |

**Missing upstream:** process that ships charger logs/events **into** Kafka is not in this monorepo.

---

## Data flow (as implemented)

```
Mobile App
  ├─ /api/mobile, /services  ──► Backend/Server (:8800) ──► SQL Server "evya"
  ├─ /ocpp/*                 ──► evya-ocpp (:8085) ──► SQL Server "evya_online"
  │                                 │
  │                                 └─ WS /ocpp16/{clientId} ◄── chargers
  └─ WebView                 ──► web.evyaa.com  (SOURCE NOT IN REPO)

CMS (spark-stop)
  ├─ localhost:8800 / server.evyaa.com ──► Backend
  ├─ ocpp.evyaa.com                    ──► OCPP HTTP
  └─ 35.154.169.228:8080               ──► EvyaSense / alerts

chargers → (log shipper MISSING) → Kafka "evya-sense-topic"
  → EvyaSense → Redis + MySQL → CMS Sense dashboard
```

---

## Hardcoded production / external service registry

| Service | Where referenced | Endpoint / host |
|---------|------------------|-----------------|
| Backend prod | App `Apis.js` | `https://server.evyaa.com` |
| Backend local | CMS `config.jsx` | `http://localhost:8800` |
| OCPP prod | App + CMS | `https://ocpp.evyaa.com` |
| Portal | App | `https://portal.evyaa.com` |
| Map web | App | `https://web.evyaa.com/*` |
| EvyaSense alerts | CMS | `http://35.154.169.228:8080/` |
| Backend SQL | `Backend/.../application.properties` | `13.203.97.248:1433` / DB `evya` |
| OCPP SQL | OCPP `application.properties` | AWS RDS / DB `evya_online` |
| Sense MySQL | env-default localhost | `localhost:3306/evya` |
| Kafka | EvyaSense | `localhost:9092`, topic `evya-sense-topic` |
| Redis | EvyaSense | `localhost:6379` |
| PhonePe sandbox | Backend props | `api-preprod.phonepe.com` |
| Razorpay | Backend props | keys in props |
| Twilio | Backend props | Account SID / Auth Token |
| Gmail SMTP | Backend props | `smtp.gmail.com:587` |
| Google Maps | Backend + CMS | Maps JS / API key |
| xAI Grok | Backend props | `api.x.ai` |
| Nominatim | App LocationContext | OpenStreetMap reverse |
| NHTSA vPIC | App Apis.js | VIN decode |
| FCM legacy | OCPP PushNotification | `fcm.googleapis.com/fcm/send` |
| Marketing site | App About | `https://evya.energy` |

**Secrets in source (names only — full values live in properties; treat as compromised for rotation):**

- Backend: DB password, PhonePe client secret, Twilio AuthToken, Gmail app password, Razorpay secret, Grok API key, Google Maps API key  
- OCPP: DB password  
- EvyaSense: defaults only (`root`/`root`) unless env overridden  

Detailed secret inventory → **P0.5 `SECURITY_BASELINE.md`**.

---

## Known missing (do not fabricate)

| Item | Impact |
|------|--------|
| `web.evyaa.com` map web app source | App map is remote WebView only |
| Database schema / DDL dumps | Backends use Hibernate `update`/`validate` + raw SQL; no migration pack in repo |
| Kafka log-shipper from chargers/OCPP | EvyaSense has nothing to consume without external producer |
| Android `google-services.json` / keystore | No FCM receiver path in app as shipped |
| Unified wallet DB proof | Backend `evya` vs OCPP `evya_online` may split wallet |

---

## Confirmed layout quirks (for later phases)

1. Merge conflict markers: CMS `README.md`; workorder also cites OCPP `.gitignore`.  
2. CMS `qrcode.react` in `package.json` — may need `npm install` to reconcile lockfile.  
3. App `AuthSlice.js` is TypeScript content with `.js` extension (tsc noise).  
4. App OTP functions in `Apis.js` are stubbed (real calls commented).  
5. Two SQL Server databases (`evya` vs `evya_online`) with different hosts.

---

## Next Phase 0 artifacts

| ID | Output |
|----|--------|
| P0.2 | `docs/API_CONTRACT.md` |
| P0.3 | `docs/FLOWS.md` |
| P0.4 | `docs/STATE_MAP.md` |
| P0.5 | `docs/SECURITY_BASELINE.md` |
| P0.6 | `docs/BUILD_BASELINE.md` |
