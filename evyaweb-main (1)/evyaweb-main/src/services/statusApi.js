/**
 * SCALE-3 — live status hot plane (EvyaSense).
 * Base URL from env (CRA): REACT_APP_STATUS_BASE_URL
 * Fallback leaves host empty so fetch fails softly → map keeps cold availability.
 */
const STATUS_BASE =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_STATUS_BASE_URL) ||
  '';

export const STATUS_POLL_MS = 10_000;
export const STATUS_MAX_IDS = 500;

export function getStatusBaseUrl() {
  return (STATUS_BASE || '').replace(/\/$/, '');
}

/**
 * Collect unique chargerRefs from stations (cold payload field chargerRefs / OCPPId).
 */
export function collectChargerRefs(stations = []) {
  const set = new Set();
  for (const s of stations) {
    const refs = s.chargerRefs || s.charger_refs || [];
    if (Array.isArray(refs)) {
      refs.forEach((r) => r && set.add(String(r)));
    } else if (typeof refs === 'string' && refs) {
      refs.split(',').forEach((r) => r && set.add(r.trim()));
    }
    // port-level refs
    const ports = s.ports || [];
    if (Array.isArray(ports)) {
      ports.forEach((p) => {
        if (p?.chargerRef) set.add(String(p.chargerRef));
      });
    }
  }
  return Array.from(set).slice(0, STATUS_MAX_IDS);
}

/**
 * Snapshot: GET /api/status?ids=
 * Returns { success, chargers:[{ chargerRef, ports, available, total }] } or null on failure.
 */
export async function fetchStatusSnapshot(chargerRefs, signal) {
  const base = getStatusBaseUrl();
  if (!base || !chargerRefs?.length) return null;
  const ids = chargerRefs.slice(0, STATUS_MAX_IDS).join(',');
  try {
    const res = await fetch(
      `${base}/api/status?ids=${encodeURIComponent(ids)}`,
      { signal, headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Open SSE to /api/status/stream?ids=
 * Returns { close } or null if EventSource unavailable / no base URL.
 * onEvent({ chargerRef, connectorId, status })
 */
export function openStatusStream(chargerRefs, { onEvent, onError } = {}) {
  const base = getStatusBaseUrl();
  if (!base || !chargerRefs?.length || typeof EventSource === 'undefined') {
    return null;
  }
  const ids = chargerRefs.slice(0, STATUS_MAX_IDS).join(',');
  const url = `${base}/api/status/stream?ids=${encodeURIComponent(ids)}`;
  let es;
  try {
    es = new EventSource(url);
  } catch (e) {
    if (onError) onError(e);
    return null;
  }

  es.addEventListener('status', (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (onEvent) onEvent(data);
    } catch {
      // ignore bad payloads
    }
  });

  es.onerror = (err) => {
    if (onError) onError(err);
  };

  return {
    close: () => {
      try {
        es.close();
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Apply status snapshot to stations → new array with updated available/avaiPorts.
 * Pure: does not mutate input. Unknown chargers leave cold availability.
 */
export function mergeStatusIntoStations(stations, snapshot) {
  if (!stations?.length || !snapshot?.chargers) return stations;

  // Map chargerRef → { available, total, ports }
  const byRef = new Map();
  for (const c of snapshot.chargers) {
    if (c?.chargerRef) byRef.set(String(c.chargerRef), c);
  }

  // Also track connector status for port-level aggregation
  const connectorStatus = new Map(); // "ref:cid" → status
  for (const c of snapshot.chargers) {
    const ref = c?.chargerRef;
    if (!ref || !Array.isArray(c.ports)) continue;
    for (const p of c.ports) {
      if (p?.connectorId != null) {
        connectorStatus.set(`${ref}:${p.connectorId}`, p.status);
      }
    }
  }

  return stations.map((station) => {
    const refs = collectChargerRefs([station]);
    if (!refs.length) return station;

    // Prefer port-level if we have ports on the station
    const ports = station.ports || [];
    if (Array.isArray(ports) && ports.length > 0) {
      let available = 0;
      let known = 0;
      for (const p of ports) {
        const key = `${p.chargerRef}:${p.connectorId}`;
        const st = connectorStatus.get(key);
        if (st == null) continue;
        known++;
        if (isLiveAvailable(st)) available++;
      }
      if (known === 0) return station; // no live data — keep cold
      return {
        ...station,
        available,
        avaiPorts: available,
        totalPorts: station.totalPorts || station.noOfPorts || ports.length,
        liveStatus: true,
      };
    }

    // Aggregate by chargerRefs
    let available = 0;
    let total = 0;
    let any = false;
    for (const ref of refs) {
      const c = byRef.get(ref);
      if (!c) continue;
      any = true;
      available += Number(c.available) || 0;
      total += Number(c.total) || 0;
    }
    if (!any) return station;
    return {
      ...station,
      available: total > 0 ? available : station.available,
      avaiPorts: total > 0 ? available : station.avaiPorts,
      totalPorts: total > 0 ? total : station.totalPorts || station.noOfPorts,
      liveStatus: true,
    };
  });
}

/**
 * Apply a single SSE delta onto stations (one connector status change).
 */
export function applyStatusDelta(stations, { chargerRef, connectorId, status }) {
  if (!stations?.length || !chargerRef) return stations;

  return stations.map((station) => {
    const refs = collectChargerRefs([station]);
    if (!refs.includes(String(chargerRef))) return station;

    const ports = station.ports || [];
    // Track live port map on station (ephemeral)
    const livePorts = { ...(station._livePorts || {}) };
    const key = `${chargerRef}:${connectorId}`;
    livePorts[key] = status;

    // If we have cold port list, count those keys
    let available = 0;
    let total = 0;
    if (Array.isArray(ports) && ports.length > 0) {
      total = ports.length;
      for (const p of ports) {
        const k = `${p.chargerRef}:${p.connectorId}`;
        const st = livePorts[k] != null ? livePorts[k] : null;
        // if we never got live for this port, fall back to cold site-level by not counting as known
        if (st != null && isLiveAvailable(st)) available++;
        else if (st == null && (station.available || station.avaiPorts) > 0) {
          // leave cold until fully known — use ratio only when all known
        }
      }
      const known = Object.keys(livePorts).filter((k) =>
        ports.some((p) => `${p.chargerRef}:${p.connectorId}` === k),
      ).length;
      if (known < ports.length) {
        // Partial: keep previous available if set, else cold
        return {
          ...station,
          _livePorts: livePorts,
        };
      }
      return {
        ...station,
        _livePorts: livePorts,
        available,
        avaiPorts: available,
        totalPorts: total,
        liveStatus: true,
      };
    }

    // No port list — bump available heuristically only when Available
    return {
      ...station,
      _livePorts: livePorts,
      liveStatus: true,
    };
  });
}

function isLiveAvailable(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === 'available' || s === 'preparing';
}

export default {
  getStatusBaseUrl,
  collectChargerRefs,
  fetchStatusSnapshot,
  openStatusStream,
  mergeStatusIntoStations,
  applyStatusDelta,
  STATUS_POLL_MS,
};
