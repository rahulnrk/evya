# ADR-003 — Per-vendor product and OCPI self-service in the portal

Status: accepted · Date: 2026-09-21 · Deciders: founder · Builds on: ADR-002
Related: OCPI-001, SENSE-008, SEC-004

> `ops/BUG-REGISTER.md`, ADR-001/002 and `lab/` live in the local lab copy until the PROC-001 consolidation brings them into this repo.

## Context

EVYA sells its platform to vendors (charging businesses). The founder's direction (2026-09-21):

- EVYA must be able to give each vendor a customised product.
- Each vendor must manage its own roaming (OCPI) from the CMS, the way established CSMS products expose it.
- EvyaSense is experimental.

What exists today:

- Tenancy is `white_lable_orgs` (the vendor) → `owner_orgs` (franchise operators, `whitelabelId`) → site →
  station → port.
- Roles are assigned by name. The portal's own role map (`Sidebar.jsx`) treats 1 as Admin (EVYA), 3 as
  WhiteLabel (vendor admin), 4 as Franchise Owner and 6 as Employee.
- The portal menu is hard-coded per role, so every vendor gets the same product.
- The login token's `orgId` comes from `Users.orgId`, which is set from a form field. It is not a
  reliable vendor identifier: vendor users are linked through `users_in_whitelabels`, franchise owners
  through `users_in_owners` → `owner_orgs.whitelabelId`.
- OCPI administration was an internal API behind an EVYA-only key (ADR-002).

## Goals

- **G1 — Per-vendor product.** EVYA switches optional modules on or off per vendor. A vendor's users see
  and can use only what is enabled, and every service enforces the same rule.
- **G2 — OCPI self-service.** A vendor admin manages its own roaming from a Roaming (OCPI) tab in the
  portal: party profile, partner and hub connections in both handshake directions, and connection
  health. EVYA sees every vendor.
- **G3 — Sense stays experimental.** It becomes an opt-in beta module; no further hardening unless a goal
  needs it.

## Decisions

1. **The vendor is the white-label org.** Franchise owners belong to a vendor. The OCPI party is per
   vendor, and franchise locations roam under the vendor's party.
2. **The business API owns entitlements.** A `vendor_modules` table overlays a module catalogue kept in
   code. Defaults preserve today's behaviour for every existing vendor; OCPI and Sense are opt-in. Only
   Admin (role 1) changes them, and every change records who made it and when.
3. **The access token carries `vendorId` and `modules`.** They are resolved at login from the link
   tables, not from `Users.orgId`. Every service can then enforce entitlements without a network call.
   Changes apply at the next login or token refresh (at most about an hour).
4. **OCPI administration moves to a portal-facing API** authenticated with the platform token. The
   internal API key is removed.
   - Admin (role 1) can act on any vendor.
   - A vendor admin (role 3) can act only on its own vendor.
   - Both need the `ocpi` module.
5. **Both handshake directions are supported:** "invite a partner" (EVYA issues Token A) and "connect to a
   partner or hub" (the partner issues Token A and EVYA registers with it). Hubs usually onboard CPOs
   the second way.
6. **Role ids are configuration**, defaulting to the portal's own map (1 = platform admin, 3 = vendor
   admin). They must be confirmed against production's `role` table, which has no seed data in the
   repo.

## Consequences

- The per-vendor identity claim also unblocks tenant scoping in EvyaSense (SENSE-008) and the rest of
  the platform.
- The portal sidebar must filter by `modules`, as well as by role.
- Tokens issued before the change have no `vendorId`. Portal features that need it ask the user to sign in
  again, rather than guessing a vendor.
