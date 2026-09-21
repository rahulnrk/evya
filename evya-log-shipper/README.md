# EVYA log shipper

Tails the CSMS station logs and publishes every line to Kafka **keyed by OCPPId**, so EvyaSense gets a
live feed. This is the fallback half of ADR-002 D1: it runs next to the CSMS with no CSMS change. The
primary path, a structured-event publisher inside the CSMS, follows in a later CSMS release, and this
shipper stays in place for chargers on older builds.

## Why the key matters

A CSMS log line has no charger identity in it:

```
Mon Sep 21 00:00:04 IST 2026	Received Message : [2,"1789929004406249","Heartbeat",{}]
```

The station only appears in the path: `stationLogs/<OCPPId>/<date>_<OCPPId>.txt`. The shipper uses that
directory name as the Kafka record key (and also sends it as a `chargerId` header). EvyaSense reads the
charger from the key. Before this, it attached every frame to whichever charger had connected most
recently (SENSE-003). Keying by OCPPId also keeps each charger's lines on one partition, in order, so
OCPP frames that span several lines are reassembled correctly.

## Behaviour

- **Complete lines only.** A trailing line that is still being written waits for the next poll.
- **Resumes after restart.** Read offsets are checkpointed to `shipper.state-file` (written atomically),
  so a restart neither repeats nor skips lines.
- **Rotation-safe.** If a file shrinks, it is read again from the start.
- **No replay by default.** On first sight a file is tracked from its end (`shipper.start-at-end=true`).
  Set it to `false` once to backfill an existing directory.
- **New chargers are picked up automatically** when their directory appears.
- **Bounded reads.** A poll reads at most `shipper.max-bytes-per-poll` from each file, so one large file
  cannot starve the rest.

## Known limits

- **Publishing is at-most-once.** The offset moves forward before the Kafka send is acknowledged, so a
  broker outage can lose lines. Failures are logged. The durable fix is a local outbox, or the CSMS
  event publisher, which replaces this path anyway.
- **Timestamps are IST wall-clock with no offset.** The CSMS writes them that way. EvyaSense parses them
  in `sense.log-zone`, which defaults to `Asia/Kolkata` (SENSE-005).

## Run it

```
export SHIPPER_ROOT=/home/ubuntu/logs/stationLogs      # must match the CSMS file.logsLocation
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
./mvnw spring-boot:run
```

Lab overlay: `lab/overlays/shipper-application-lab.properties`. It tails `lab/logs/stationLogs` and
replays the captured lab logs (`start-at-end=false`).

Windows: build from a path with no spaces or `(1)` in it (CLAUDE.md ground rule 8).

## Tests

```
./mvnw test
```

Six tests: per-charger keys, partial lines held back, restart without duplicates, truncation, the
start-at-end backlog rule, and chargers that appear later. No broker needed: `LinePublisher` is an
interface and the tests record what would have been sent.
