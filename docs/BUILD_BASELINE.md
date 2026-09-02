# EVYA Build Baseline (“before” snapshot)

**Generated:** 2026-07-26 (Phase 0.6)  
**Machine notes:** Windows, Node available, JDK 17 at `C:\Program Files\Java\jdk-17`, project `mvnw` wrappers.  
**Path caveat:** Folders `evya-native-main (1)` and `evya-ocpp-main (1)` contain parentheses. `mvnw.cmd` fails with `"}" was unexpected` when cwd has `(…)`. **Workaround used:** directory junctions:

| Junction | Target |
|----------|--------|
| `C:\Users\nande\Downloads\EVYA\_ocpp` | `evya-ocpp-main (1)\evya-ocpp-main` |
| `C:\Users\nande\Downloads\EVYA\_native` | `evya-native-main (1)\evya-native-main` |

---

## Results summary

| Project | Command | Exit | Pass? | Notes |
|---------|---------|------|-------|-------|
| **CMS** | `npm install` | 0 | ✅ | Reconciled deps |
| **CMS** | `npx vite build` | 0 | ✅ | Built in ~18s; chunk size warning (>500 kB) |
| **Native** | `npx tsc --noEmit` | 2 | ❌ baseline | **10 errors**, all in `src/redux/AuthSlice.js` (TS syntax in `.js`) — matches workorder |
| **Native** | `npx jest` | 1 | ❌ baseline | Suite fails: AsyncStorage native module unmocked (`App.test.tsx` → `app-context`) |
| **Native** | Metro bundle (android, dev false) | 0 | ✅ | `docs/_bundle_tmp/app.bundle`; 59 assets |
| **Backend/Server** | `mvnw.cmd -q -DskipTests compile` | 0 | ✅ | Classes under `target/classes/com/ewe` |
| **evya-ocpp** | `mvnw.cmd -q -DskipTests compile` via `_ocpp` junction | 0 | ✅ | Direct path with `(1)` fails wrapper |
| **EvyaSense** | `mvnw.cmd -DskipTests compile` | 0 | ✅ | 47 sources; BUILD SUCCESS; deprecation warnings on Redis serializer |

---

## Per-project detail

### CMS (`evya-cms-frontend-main/evya-cms-frontend-main`)

```
✓ built in 17.94s
dist/assets/index-BC5fVceY.js  ~2.5 MB (gzip ~703 kB)
```

**Pass.** Large main chunk warning only.

### Mobile (`evya-native-main (1)/evya-native-main`)

**tsc (expected fail):**
```
src/redux/AuthSlice.js — 10× TS8006/TS8010 (interface / type annotations in .js)
```

**jest (expected fail):**
```
AsyncStorage.native.ts: RN$TurboModuleRegistry.getEnforcing(... ) is not a function
  at import from app-context.tsx ← App.tsx ← App.test.tsx
Test Suites: 1 failed, 1 total
```

**bundle (pass):**
```
Done writing bundle output
Copying 59 asset files
```

### Backend (`Backend/Server`)

```
mvnw.cmd -q -DskipTests compile → exit 0
```

### OCPP (`evya-ocpp-main (1)/evya-ocpp-main`)

```
# FAIL if cwd has parentheses:
"}" was unexpected at this time.  → exit 255

# PASS via junction:
cd C:\Users\nande\Downloads\EVYA\_ocpp
mvnw.cmd -q -DskipTests compile → exit 0
```

### EvyaSense (`EvyaSense-main/EvyaSense-main`)

```
BUILD SUCCESS — Compiling 47 source files … release 17
```

System `mvn` not on PATH; project `mvnw.cmd` worked.

---

## Hygiene signals observed during baseline (not fixed)

| Signal | Location | Phase 1 task |
|--------|----------|--------------|
| Merge conflict markers in README | CMS `README.md` | H-1 |
| AuthSlice `.js` with TS | native redux | H-3 |
| Jest missing AsyncStorage mock | native | H-4 |
| `qrcode.react` present in package.json | CMS (build OK after install) | H-2 (if lockfile drift) |

---

## Gate status for Phase 1

| Gate | Status |
|------|--------|
| P0.1 INVENTORY.md | ✅ written |
| P0.2 API_CONTRACT.md | ✅ written |
| P0.3 FLOWS.md | ✅ written |
| P0.4 STATE_MAP.md | ✅ written |
| P0.5 SECURITY_BASELINE.md | ✅ written |
| P0.6 BUILD_BASELINE.md | ✅ this file |

**Compiles green for production-critical Java + CMS + RN bundle.**  
**Known red (documented):** `tsc` AuthSlice, `jest` AsyncStorage — both Phase 1 hygiene.

**Phase 1 may start** with the understanding that H-3 and H-4 exist to clear the two reds.

---

## Re-run commands (Windows)

```powershell
$root = "C:\Users\nande\Downloads\EVYA"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# CMS
Set-Location "$root\evya-cms-frontend-main\evya-cms-frontend-main"
npm install; npx vite build

# Native (junction optional for tooling that chokes on paths)
Set-Location "$root\_native"   # or literal path with (1)
npx tsc --noEmit
npx jest
npx react-native bundle --platform android --dev false `
  --entry-file index.js --bundle-output $env:TEMP\app.bundle --assets-dest $env:TEMP\rn-assets

# Backend
Set-Location "$root\Backend\Server"
.\mvnw.cmd -q -DskipTests compile

# OCPP
Set-Location "$root\_ocpp"
.\mvnw.cmd -q -DskipTests compile

# EvyaSense
Set-Location "$root\EvyaSense-main\EvyaSense-main"
.\mvnw.cmd -DskipTests compile
```
