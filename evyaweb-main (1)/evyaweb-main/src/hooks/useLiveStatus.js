/**
 * SCALE-3: subscribe to live charger status for the current station set.
 * - Initial paint uses cold availability (caller keeps stations as-is until first snapshot).
 * - SSE preferred; falls back to polling GET /api/status every 10s.
 * - If status service is unreachable, returns original stations (never blanks the map).
 */
import { useEffect, useRef, useState } from 'react';
import {
  collectChargerRefs,
  fetchStatusSnapshot,
  openStatusStream,
  mergeStatusIntoStations,
  applyStatusDelta,
  STATUS_POLL_MS,
  getStatusBaseUrl,
} from '../services/statusApi';

export function useLiveStatus(stationsWithCoordinates) {
  const [liveStations, setLiveStations] = useState(stationsWithCoordinates || []);
  const streamRef = useRef(null);
  const pollRef = useRef(null);
  const stationsRef = useRef(stationsWithCoordinates || []);

  // Keep cold stations as baseline when input changes
  useEffect(() => {
    stationsRef.current = stationsWithCoordinates || [];
    setLiveStations(stationsWithCoordinates || []);
  }, [stationsWithCoordinates]);

  useEffect(() => {
    const stations = stationsWithCoordinates || [];
    const refs = collectChargerRefs(stations);

    // Tear down previous
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!getStatusBaseUrl() || refs.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const ac = new AbortController();

    const applySnapshot = async () => {
      const snap = await fetchStatusSnapshot(refs, ac.signal);
      if (cancelled || !snap) return false;
      setLiveStations((prev) =>
        mergeStatusIntoStations(stationsRef.current.length ? stationsRef.current : prev, snap),
      );
      return true;
    };

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        applySnapshot();
      }, STATUS_POLL_MS);
    };

    // Initial snapshot then SSE (or poll fallback)
    (async () => {
      await applySnapshot();
      if (cancelled) return;

      const stream = openStatusStream(refs, {
        onEvent: (delta) => {
          setLiveStations((prev) => applyStatusDelta(prev, delta));
        },
        onError: () => {
          // Fall back to polling; close broken stream
          if (streamRef.current) {
            streamRef.current.close();
            streamRef.current = null;
          }
          startPolling();
        },
      });

      if (stream) {
        streamRef.current = stream;
      } else {
        startPolling();
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [stationsWithCoordinates]);

  return liveStations;
}

export default useLiveStatus;
