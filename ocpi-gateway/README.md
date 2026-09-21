# EVYA OCPI gateway

Multi-tenant OCPI 2.2.1 gateway, CPO role. Replaces the `ocpiiiiii/OCPI` spike (ADR-002).

Each EVYA tenant is its own OCPI party; EVYA operates the gateway underneath. A partner connection is
scoped to (our party, their party), and the token a partner presents is what resolves both — and with
them, the tenant whose data they may see.

## Status

| Module | State |
|---|---|
| `versions` + version details | done |
| `credentials` (Token A/B/C, rotation, unregister) | done |
| `locations`, `tariffs`, `sessions`, `cdrs`, `tokens`, `commands` | not started |

Only implemented modules are published in the version details, so a partner's integration tests never
hit a 404 for something we advertised but do not serve.

**`commands` is blocked**, not merely unscheduled: START_SESSION/STOP_SESSION must bridge to
RemoteStart/Stop, which today blocks a thread for up to 120 s and can return nothing (OCPP-002, OCPP-017).
It follows the async OCPP command API.

**`locations` and `tariffs` need a schema change first.** `site_location` has no city, postal code, state
or country and stores lat/long as free strings; `port.connector_type` is a free string; a tariff is one
`billingAmount` + `billingUnits` with no element or restriction model. See ADR-002.

## Run it

Configuration comes from the environment; see `.env.example`. The service refuses to start without `OCPI_TOKEN_KEY` or `PLATFORM_JWT_SECRET` (the platform's
operator JWT secret, shared with the business API).

```
export OCPI_TOKEN_KEY=$(openssl rand -base64 32)
export PLATFORM_JWT_SECRET=<the business API's JWT_SECRET>
./mvnw spring-boot:run
```

Windows note: paths containing spaces or `(1)` break the Maven wrapper and Boot 4 config resolution.
Build from a `subst` drive or a copy under `C:\evya\` (CLAUDE.md ground rule 8).

Lab overlay: `lab/overlays/ocpi-gateway-application-lab.properties` (port 8082, MySQL on 3307, loopback
partners allowed).

## Managing roaming (ADR-003)

OCPI is a per-vendor product. A vendor turns it on in the portal only if EVYA has enabled the `ocpi`
module for that vendor. Administration is the portal's **OCPI tab**, authenticated with the operator's
own platform login token (the same JWT the business API issues); there is no separate API key.

`/portal/**` (vendor self-service, platform JWT):

| Endpoint | Who | Does |
|---|---|---|
| `GET /portal/ocpi/party` | vendor admin, or platform admin with `?vendorId=` | the vendor's OCPI party |
| `PUT /portal/ocpi/party` | same | create or update the party (country/party id fixed once set) |
| `GET /portal/ocpi/connections` | same | the vendor's partner connections and their status |
| `POST /portal/ocpi/connections/invite` | same | mint a Token A to hand a partner (invite direction) |
| `DELETE /portal/ocpi/connections/{id}` | same | end a connection; its tokens are destroyed |

A vendor admin (role 3) may act only on its own vendor; the platform admin (role 1) may act on any
vendor by naming it with `?vendorId=`. Both need the `ocpi` module. The vendor comes from the token's
`vendorId` claim, so one vendor can never see or touch another's roaming.

`/ocpi/**` (the roaming protocol) is unchanged: partners authenticate per-connection with the tokens from
the handshake below, not the platform JWT.

Once a party exists and a Token A is issued, the partner completes the handshake against `/ocpi/versions`
and `POST /ocpi/2.2.1/credentials` exactly as before.

**Not yet built:** the reverse direction — registering EVYA with a partner or hub that issued *us* a
Token A (ADR-003 D5). That needs an OCPI client that posts our credentials to their endpoint; it is the
next increment. Today the portal covers inviting a partner (EVYA issues Token A).

## Security decisions worth knowing

- **The credentials endpoint is authenticated.** The stub this replaces skipped auth for any path
  containing `/credentials`, so anyone who found the URL could register as a roaming partner.
  `OcpiAuthFilterTest.credentialsRequiresAToken` fails if that regresses.
- **Tokens are never stored in a directly usable form.** Tokens we issue are SHA-256 hashed for lookup;
  Token B and Token C are additionally AES-256-GCM encrypted with a key from the environment, because we
  must replay one and return the other. A database dump alone yields nothing.
- **Token A is single use.** It is destroyed the moment a handshake completes.
- **Partner URLs are validated before we fetch them.** https only, no loopback, private, link-local or
  unique-local targets, and redirects are never followed — otherwise the gateway is an SSRF proxy into
  our own network. The DNS-rebinding window is documented in `PartnerUrlValidator`, not pretended away.
- **Authentication failures all return the same message**, so probing cannot distinguish "no such token"
  from "wrong phase" from "suspended".
- **Minting Token A is an operator action**, guarded by a separate key that fails closed. It should move
  behind the platform's operator authentication and audit log when the portal integrates it.

## Tests

```
./mvnw test
```

24 tests: the full handshake against a fake partner platform (`FakePartnerPlatform`), Token A
invalidation, rotation, unregister, failure-leaves-no-partial-state, token storage, the auth regressions
above, the SSRF guard and the cipher.
