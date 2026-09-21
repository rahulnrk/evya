# ADR-002 — OCPI roaming and EvyaSense foundations

Status: accepted · Date: 2026-09-21 · Deciders: founder · Supersedes: none
Related: OCPI-001, SENSE-001, SENSE-003, SENSE-004, SEC-004, PROC-001, OCPP-002/017

> Records referenced here (`ops/BUG-REGISTER.md`, ADR-001, `lab/`) live in the local lab copy until the PROC-001 consolidation brings them into this repo.

## Context

OCPI and EvyaSense were both carried as "nearly there" on the roadmap. On inspection each is a scaffold
with a structural flaw that more rules or more endpoints would not fix:

- `ocpiiiiii/OCPI` is ~350 lines: one unauthenticated `POST /credentials`
  (`OcpiAuthFilter.java:29` skips every path containing `/credentials`) returning a hardcoded token
  (`CredentialsServiceImpl.java:38`). No `/versions`, no modules, no tenant in the model.
- EvyaSense parses CSMS **text logs** back into OCPP frames. Those lines carry no charger identity, so
  attribution is guessed from the most recent WebSocket session (SENSE-003), and rules only run when a
  charger sends something, so a charger that dies silently is never reported (SENSE-004).

## Decisions

### D1 — Sense feed: log-tail shipper now, structured CSMS events next
A standalone shipper tails `stationLogs/<OCPPId>/` and publishes to Kafka **keyed by OCPPId**, which fixes
attribution at the source without a CSMS deploy. The CSMS then gains a structured event publisher in its
next release; the shipper stays as the fallback for chargers on older builds.

*Why:* Sense must stop depending on a CSMS change that is itself entangled with PROC-001. The Kafka key is
the contract, so the consumer does not change when the producer is upgraded.

### D2 — OCPI identity: one party per tenant
Each CPO tenant is its own OCPI party (`country_code` + `party_id`); EVYA operates the gateway underneath.
Partner connections are scoped to (our party ↔ their party), and every module query is scoped by the
tenant behind our party.

*Why:* tenants keep their brand, hold their own roaming agreements, and can leave with their party id.
Retrofitting this after the first partner means renegotiating with every partner.

### D3 — CPO role first
Build the CPO (sender) side: versions, credentials, locations, tariffs, sessions, CDRs, tokens with
real-time authorization, commands. eMSP follows once CPO is solid.

### D4 — Both workstreams in parallel
OCPI gateway and Sense share no code and can proceed together.

## Consequences

- The OCPI stub is **replaced**, not extended: new service `ocpi-gateway/`, package `com.evya.ocpi`,
  its own schema. It reads EVYA data through internal APIs/events, never by sharing tables.
- Tokens we issue (A and C) are stored as SHA-256 for indexed lookup **and** AES-GCM encrypted so
  `GET /credentials` stays conformant; the partner's Token B is encrypted because we must replay it.
  The encryption key lives in the secret store (`OCPI_TOKEN_KEY`), never in the database or the repo.
- Minting Token A is an operator action behind an internal API — a human performs the production
  handshake and hands Token A over out of band (CLAUDE.md ground rule 1).
- **OCPI Commands is gated on the async OCPP command API.** START_SESSION/STOP_SESSION must bridge to
  RemoteStart/Stop, which today blocks the thread for up to 120 s and can return nothing (OCPP-002,
  OCPP-017). Commands is scheduled after that fix, not before.
- Schema gaps block Locations and Tariffs and need their own change: `site_location` has no city, postal
  code, state or country and stores lat/long as free strings; `port.connector_type` is a free string;
  a tariff is a single `billingAmount` + `billingUnits` with no element/restriction model.
