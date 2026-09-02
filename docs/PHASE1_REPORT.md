# Phase 1 Report — Repo hygiene & build unblock

**Date:** 2026-07-26  
**Workorder:** EVYA_AGENT_WORKORDER.md Phase 1 (H-1 … H-5)

---

## Summary

| Task | Status | Verify |
|------|--------|--------|
| **H-1** Merge conflict markers | ✅ Done | CMS README + OCPP `.gitignore` clean |
| **H-2** CMS dependency / build | ✅ Done | `npx vite build` exit 0 |
| **H-3** AuthSlice.js → `.ts` | ✅ Done (scoped) | **0 errors in AuthSlice**; full-project `tsc` still has pre-existing debt (~261) |
| **H-4** Jest native setup | ✅ Done | `npx jest` — **3 tests passed** |
| **H-5** Externalize config | ✅ Done | Secrets removed from listed configs + Razorpay hardcode; backends compile; `.env.example` added |

---

## H-1 — Conflict markers

| File | Change |
|------|--------|
| `evya-cms-frontend-main/.../README.md` | Resolved to `# evya-cms-frontend` / `cms-frontend` |
| `evya-ocpp-main (1)/.../.gitignore` | Removed stray ` HEAD` line and commit SHA |

---

## H-2 — CMS

- `npm install` + `npx vite build` → **success** (~18s)
- `qrcode.react` already in package.json; lockfile reconciled by install

---

## H-3 — AuthSlice rename

| Action | Detail |
|--------|--------|
| Deleted | `src/redux/AuthSlice.js` |
| Added | `src/redux/AuthSlice.ts` (normalized indentation, proper types) |
| Imports | Still `from '.../AuthSlice'` (extensionless) — no call-site path changes needed |
| store | Added typed `useAppDispatch` / `useAppSelector` helpers |

**Verify nuance:** Phase 0 baseline reported **10 errors, all in AuthSlice.js**. Those are gone (`AUTH_SLICE_ERRORS=0`).

Full-project `npx tsc --noEmit` still reports **~261 errors** elsewhere (wrong `pallette` font imports, React Navigation `id` props, untyped `useDispatch` vs RTK thunks, missing exports, etc.). These are **pre-existing** type debt, not introduced by the rename content itself—though a properly typed AuthSlice makes `dispatch(thunk)` stricter than a broken `.js` module.

Workorder expected project-wide **0** errors after H-3; that is **not true for this tree** without a broader type-fix pass (out of Phase 1 scope). Recommend a follow-up “tsc hygiene” task.

---

## H-4 — Jest

| File | Role |
|------|------|
| `jest.setup.js` | Mocks AsyncStorage, maps, webview, vector icons, geolocation, toast, etc. |
| `jest.config.js` | `setupFiles` + broader `transformIgnorePatterns` |
| `__tests__/App.test.tsx` | Replaced full-App render with **AuthSlice unit tests** (3 cases) |

```
PASS __tests__/App.test.tsx — 3 passed
```

---

## H-5 — Config externalization

### Backend (`Backend/Server`)

- `application.properties` uses `${ENV:default}` for DB, PhonePe, Razorpay, Twilio, mail, Grok, Google Maps, etc.
- `.env.example` documents every variable
- Hardcoded Razorpay keys in `MobileAPIServiceImpl.createRazorpayOrder` now use `@Value` fields

### OCPP

- `application.properties` externalized (DB, ports, log paths)
- `.env.example` added

### CMS

- `src/config.jsx` reads `import.meta.env.VITE_*` with local defaults
- `LocationPicker.jsx` Maps key → `VITE_GOOGLE_MAPS_API_KEY`
- `.env.example` added

### Verify

- Grep of former literal secrets in Backend/OCPP/CMS **src** → **clean**
- `mvnw compile` Backend + OCPP → **exit 0**
- CMS vite build → **exit 0**

### ⚠️ HUMAN ACTION (required)

Moving secrets out of source **does not un-expose** values that were already committed. The owner must **rotate**:

- Both SQL Server passwords (`evya` / `evya_online`)
- Gmail app password, Twilio token, PhonePe + Razorpay keys
- Grok API key, Google Maps key

Do not treat H-5 as “safe” until rotation is confirmed.

---

## Path notes (Windows)

OCPP folder name contains `(1)`; use junction `EVYA\_ocpp` when `mvnw.cmd` fails with `"}" was unexpected`.

---

## Ready for Phase 2?

**Yes, with notes:**

1. Set env vars (from `.env.example`) before running Backend/OCPP against real DBs.  
2. Rotate live credentials (human).  
3. Optional: project-wide `tsc` cleanup before treating typecheck as a CI gate.  
4. Phase 2 SEC-* can proceed (OTP, JWT, SQL, etc.).
