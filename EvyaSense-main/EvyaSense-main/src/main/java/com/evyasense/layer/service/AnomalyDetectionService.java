
package com.evyasense.layer.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.function.Consumer;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.evyasense.layer.canonical.AnomalyType;
import com.evyasense.layer.entity.ChargerAnomaly;
import com.evyasense.layer.model.*;
import com.evyasense.layer.repo.ChargerAnomalyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AnomalyDetectionService {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Map<String, ChargerRuntimeState> stateMap = new ConcurrentHashMap<>();
	private final ChargerAnomalyRepository anomalyRepository;

	// SENSE-004: one open outage per silent charger. The alert is raised once when the charger goes
	// quiet and resolved when it speaks again, instead of a fresh row after every cooldown.
	private final Map<String, SilenceEpisode> openSilence = new ConcurrentHashMap<>();
	private final List<ChargerLivenessListener> livenessListeners;
	private final Executor livenessDispatch;

	/** Plain construction (tests): liveness callbacks run inline on the caller's thread. */
	public AnomalyDetectionService(ChargerAnomalyRepository anomalyRepository) {
		this(anomalyRepository, List.of(), Runnable::run);
	}

	@Autowired
	public AnomalyDetectionService(ChargerAnomalyRepository anomalyRepository,
			List<ChargerLivenessListener> livenessListeners) {
		this(anomalyRepository, livenessListeners, Executors.newSingleThreadExecutor(task -> {
			Thread thread = new Thread(task, "sense-liveness");
			thread.setDaemon(true);
			return thread;
		}));
	}

	/**
	 * @param livenessDispatch runs listener callbacks (Redis, MySQL, SSE). They are submitted while the
	 *        charger's lock is held, so a single-threaded dispatcher delivers each charger's offline/online
	 *        transitions in order while keeping that I/O off the ingest and sweep threads.
	 */
	public AnomalyDetectionService(ChargerAnomalyRepository anomalyRepository,
			List<ChargerLivenessListener> livenessListeners, Executor livenessDispatch) {
		this.anomalyRepository = anomalyRepository;
		this.livenessListeners = livenessListeners;
		this.livenessDispatch = livenessDispatch;
	}

	@PreDestroy
	void stopLivenessDispatch() {
		if (livenessDispatch instanceof ExecutorService service) {
			service.shutdown();
		}
	}

	// =========================================================
	// ENTRY POINT
	// =========================================================
	public void handleEvent(SenseEvent event) {

		if (event.getSocketContext() == null)
			return;

		String chargerId = event.getSocketContext().getClientId();
		if (chargerId == null)
			chargerId = event.getSocketContext().getChargerId();
		if (chargerId == null)
			return;

		ChargerRuntimeState state = stateMap.computeIfAbsent(chargerId, id -> {
			ChargerRuntimeState s = new ChargerRuntimeState();
			s.setChargerId(id);
			return s;
		});

		// The health sweep reads and updates the same state from the scheduler thread.
		synchronized (state) {
			processLocked(state, event);
		}
	}

	private void processLocked(ChargerRuntimeState state, SenseEvent event) {

		// Any traffic at all proves the charger is alive again.
		closeSilenceEpisode(state, event.getLogTime());

		state.setLastEventTime(event.getLogTime());
//
//        long drift = Math.abs(
//        	    Duration.between(event.getLogTime(),
//        	                     LocalDateTime.now()).getSeconds());
//
//        	if (drift > 120) {
//
//        	    raise(
//        	        AnomalyType.STATUS_TRANSACTION_MISMATCH,
//        	        state,
//        	        "Clock drift detected.",
//        	        event.getLogTime(),
//        	        "Timestamp difference exceeds allowed threshold."
//        	    );
//        	}

		System.out.println("\n===============================");
		System.out.println("Incoming Event -> " + event.getAction() + " | Type: " + event.getEventType()
				+ " | LogTime: " + event.getLogTime());
		System.out.println("===============================");

		switch (event.getEventType()) {
		case "WEBSOCKET" -> handleWebsocket(state, event);
		case "OCPP_REQUEST", "OCPP_RESPONSE" -> handleOcpp(state, event);
		}

		runRules(state, event.getLogTime());
		printState(state);
	}

	// =========================================================
	// TIME-DRIVEN EVALUATION (SENSE-004)
	// =========================================================

	/**
	 * Evaluates every known charger against the clock.
	 *
	 * <p>Every rule in runRules used to fire only while a charger was still sending, so the most common
	 * failure - a charger that goes quiet - produced no event and was therefore never reported. This
	 * sweep is the missing trigger: it runs on a fixed tick whether or not anything arrived.
	 *
	 * @param now                      wall-clock time in the same zone as the CSMS log timestamps
	 * @param silenceThresholdSeconds  how long total silence is tolerated before the charger is flagged
	 */
	public void sweep(LocalDateTime now, long silenceThresholdSeconds) {

		for (ChargerRuntimeState state : stateMap.values()) {
			synchronized (state) {
				sweepLocked(state, now, silenceThresholdSeconds);
			}
		}
	}

	private void sweepLocked(ChargerRuntimeState state, LocalDateTime now, long silenceThresholdSeconds) {

		LocalDateTime lastEvent = state.getLastEventTime();

		if (lastEvent != null && !openSilence.containsKey(state.getChargerId())) {

			long silentFor = Duration.between(lastEvent, now).getSeconds();

			long threshold = state.getHeartbeatInterval() != null && state.getHeartbeatInterval() > 0
					? Math.max(2L * state.getHeartbeatInterval(), silenceThresholdSeconds)
					: silenceThresholdSeconds;

			if (silentFor > threshold) {

				String proof = String.format(
						"LastEvent=%s | Now=%s | Silent=%d sec | Threshold=%d sec | Status=%s | TxId=%s",
						lastEvent, now, silentFor, threshold, state.getCurrentStatus(),
						state.getActiveTransactionId());

				ChargerAnomaly raised = raise(AnomalyType.HEARTBEAT_TIMEOUT, state,
						"Charger has sent nothing at all. Treat as offline.", now, proof, null);

				if (raised != null) {
					openSilence.put(state.getChargerId(), new SilenceEpisode(raised, lastEvent));
					notifyWentSilent(state.getChargerId(), lastEvent, now);
				}
			}
		}

		// While a charger is silent its outage alert covers everything else time-based about it: "no
		// meter values" from a dead charger is the outage, not a second problem every minute. The other
		// rules resume as soon as it is heard from again.
		if (openSilence.containsKey(state.getChargerId()))
			return;

		runRules(state, now);
	}

	/** How many chargers Sense currently holds runtime state for. */
	public int trackedChargers() {
		return stateMap.size();
	}

	/**
	 * Resolves an open outage when the charger is heard from again. Lines that predate the outage (a
	 * lagging shipper, a backfill) do not count as the charger coming back.
	 */
	private void closeSilenceEpisode(ChargerRuntimeState state, LocalDateTime heardAt) {

		String chargerId = state.getChargerId();
		SilenceEpisode episode = openSilence.get(chargerId);

		if (episode == null || heardAt == null || !heardAt.isAfter(episode.silentSince()))
			return;
		if (!openSilence.remove(chargerId, episode))
			return;

		long offlineFor = Duration.between(episode.silentSince(), heardAt).getSeconds();

		ChargerAnomaly anomaly = episode.anomaly();
		anomaly.setStatus("RESOLVED");
		anomaly.setRootCause(anomaly.getRootCause() + " | Resolved=" + heardAt
				+ " (traffic resumed after " + offlineFor + " sec)");
		anomalyRepository.save(anomaly);

		System.out.println("Charger " + chargerId + " is talking again after " + offlineFor + " sec");

		dispatch(chargerId, listener -> listener.cameBack(chargerId, heardAt));
	}

	private void notifyWentSilent(String chargerId, LocalDateTime silentSince, LocalDateTime detectedAt) {
		dispatch(chargerId, listener -> listener.wentSilent(chargerId, silentSince, detectedAt));
	}

	/**
	 * Hands a liveness transition to the listeners without holding the charger's lock during their I/O.
	 * A slow or unavailable Redis/MySQL must not stall ingestion for the charger or the fleet-wide sweep.
	 */
	private void dispatch(String chargerId, Consumer<ChargerLivenessListener> call) {
		if (livenessListeners.isEmpty())
			return;
		try {
			livenessDispatch.execute(() -> {
				for (ChargerLivenessListener listener : livenessListeners) {
					try {
						call.accept(listener);
					} catch (Exception e) {
						// Detection must keep working when a store is down; the failure is reported, not hidden.
						System.err.println("Liveness listener failed for " + chargerId + ": " + e);
					}
				}
			});
		} catch (RejectedExecutionException e) {
			System.err.println("Liveness update for " + chargerId + " dropped: dispatcher is shutting down");
		}
	}

	/** An open outage: the anomaly raised for it and the last time the charger was heard from. */
	private record SilenceEpisode(ChargerAnomaly anomaly, LocalDateTime silentSince) {
	}

	// =========================================================
	// WEBSOCKET
	// =========================================================
	private void handleWebsocket(ChargerRuntimeState state, SenseEvent event) {

		String action = event.getAction();

		if ("CONNECTED".equalsIgnoreCase(action) || "HANDSHAKE".equalsIgnoreCase(action)) {

			state.setWebsocketConnected(true);
			state.setWebsocketConnectedTime(event.getSocketContext().getConnectedAt());
			System.out.println("WebSocket Connected at " + event.getLogTime());
		}

		if ("DISCONNECTED".equalsIgnoreCase(action)) {

			state.setWebsocketConnected(false);
			state.setDisconnectTime(event.getLogTime());
			System.out.println("WebSocket Disconnected at " + event.getLogTime());
			raise(AnomalyType.WEBSOCKET_DISCONNECTED, state,
					"WebSocket connection lost. Charger offline.",
					event.getLogTime(),
					"Charger disconnected at " + event.getLogTime(),
					null);
		}
	}

	// =========================================================
	// OCPP HANDLER
	// =========================================================
	private void handleOcpp(ChargerRuntimeState state, SenseEvent event) {

		switch (event.getAction()) {

		case "BootNotification" -> handleBoot(state, event);

		case "Heartbeat" -> {
			state.setLastHeartbeatTime(event.getLogTime());
			System.out.println("Heartbeat Received at " + event.getLogTime());
		}

		case "StatusNotification" -> handleStatus(state, event);

		case "StartTransaction" -> handleStartTransaction(state, event);

		case "StopTransaction" -> handleStopTransaction(state);

		case "RemoteStopTransaction" -> handleRemoteStop(state, event);

		case "MeterValues" -> handleMeterValues(state, event);
		case "GetConfiguration" -> handleGetConfiguration(state, event);

		}
	}

	private void handleGetConfiguration(ChargerRuntimeState state, SenseEvent event) {

		if (!"OCPP_RESPONSE".equals(event.getEventType()))
			return;

		Map<?, ?> payload = (Map<?, ?>) event.getPayload();
		List<Map<?, ?>> keys = (List<Map<?, ?>>) payload.get("configurationKey");

		if (keys == null)
			return;

		for (Map<?, ?> entry : keys) {

			String key = (String) entry.get("key");

			if ("MeterValueSampleInterval".equalsIgnoreCase(key)) {

				try {
					int interval = Integer.parseInt((String) entry.get("value"));

					state.setMeterInterval(interval);
					state.setMeterIntervalSource("GET_CONFIG");

					System.out.println("MeterInterval set from GET_CONFIG: " + interval + " sec");

				} catch (Exception ignored) {
				}
			}
		}
	}

	// =========================================================
	// BOOT
	// =========================================================
	private void handleBoot(ChargerRuntimeState state, SenseEvent event) {

		if (!state.isWebsocketConnected()) {
			state.setWebsocketConnected(true);
			System.out.println("WebSocket auto-marked CONNECTED (BootNotification) at " + event.getLogTime());
		}

		LocalDateTime bootTime = event.getLogTime();
		state.setLastBootTime(bootTime);
		state.getBootHistory().addLast(bootTime);

		while (state.getBootHistory().size() > 10)
			state.getBootHistory().removeFirst();

		if ("OCPP_RESPONSE".equals(event.getEventType())) {
			Map<?, ?> payload = (Map<?, ?>) event.getPayload();
			if (payload.get("interval") != null) {
				Integer interval = (Integer) payload.get("interval");
				state.setHeartbeatInterval(interval);
				System.out.println("Learned Heartbeat Interval: " + interval);
			}
		}

		checkWatchdogReboot(state, bootTime);

		if (state.getActiveTransactionId() != null) {

			String proof = String.format(
					"TxId=%s | Status=%s | BootTime=%s | LastMeterValue=%s | WebSocket=%s | LastHeartbeat=%s",
					state.getActiveTransactionId(), state.getCurrentStatus(), event.getLogTime(),
					state.getLastMeterValue(), state.isWebsocketConnected(), state.getLastHeartbeatTime());

			raise(AnomalyType.REBOOT_DURING_TRANSACTION, state,
					"Charger rebooted while transaction active. Possible data loss.", event.getLogTime(), proof,
					getRawMessageFromEvent(event));
		}

	}

	// =========================================================
	// STATUS
	// =========================================================
	private void handleStatus(ChargerRuntimeState state, SenseEvent event) {

		if (!"OCPP_REQUEST".equals(event.getEventType()))
			return;

		StatusNotificationPayload payload = objectMapper.convertValue(event.getPayload(),
				StatusNotificationPayload.class);

		state.setCurrentStatus(payload.getStatus());
		state.setLastErrorCode(payload.getErrorCode());

		System.out.println("Status Updated: " + payload.getStatus() + " at " + event.getLogTime());
		System.out.println("ErrorCode Updated: " + payload.getErrorCode());

		if (payload.getErrorCode() != null && !"NONE".equalsIgnoreCase(payload.getErrorCode())) {

			String rootCause = "";
			switch (payload.getErrorCode()) {

			case "GROUND_FAULT" -> {
				state.setGroundFaultActive(true);
				rootCause = "Charger detected ground fault.";
				raise(AnomalyType.CHARGER_GROUND_FAULT, state, "Ground fault reported. Effect: Charging may be unsafe.",
						event.getLogTime(), rootCause, getRawMessageFromEvent(event));
			}

			case "OVERCURRENT" -> {
				rootCause = "Charger detected overcurrent.";
				raise(AnomalyType.CHARGER_OVERCURRENT, state,
						"Overcurrent detected. Effect: Possible damage if charging continues.", event.getLogTime(),
						rootCause, getRawMessageFromEvent(event));
			}

			case "WEAKSIGNAL" -> {
				rootCause = "Charger detected weak signal.";
				raise(AnomalyType.CHARGER_WEAK_SIGNAL, state,
						"Weak signal reported. Communication may be intermittent.", event.getLogTime(),
						rootCause, getRawMessageFromEvent(event));
			}

			default -> {
				rootCause = "Charger reported error code: " + payload.getErrorCode();
				raise(AnomalyType.CHARGER_ERROR, state, "Unknown charger error. Effect: Charging may be disrupted.",
						event.getLogTime(), rootCause, getRawMessageFromEvent(event));
			}
			}

		} else {
			state.setGroundFaultActive(false);
		}

	}

	// =========================================================
	// TRANSACTION START
	// =========================================================
	private void handleStartTransaction(ChargerRuntimeState state, SenseEvent event) {

		if (!"OCPP_RESPONSE".equals(event.getEventType()))
			return;

		Map<?, ?> payload = (Map<?, ?>) event.getPayload();

		// 🔥 FIX: Get idTagInfo first
		Map<?, ?> idTagInfo = (Map<?, ?>) payload.get("idTagInfo");
		if (idTagInfo == null)
			return;

		Object status = idTagInfo.get("status");

		if (!"Accepted".equals(status)) {
			System.out.println("StartTransaction Rejected at " + event.getLogTime());
			return;
		}

		Integer txId = (Integer) payload.get("transactionId");
		if (txId == null)
			return;

		Integer currentTx = state.getActiveTransactionId();

		if (currentTx != null && currentTx.equals(txId)) {
			raise(AnomalyType.DUPLICATE_TRANSACTION, state,
					"Duplicate StartTransaction received. Possible retry or billing duplication.",
					event.getLogTime(),
					"TransactionId=" + txId + " already active on this charger.",
					getRawMessageFromEvent(event));
			return;
		}

		if (currentTx != null && !currentTx.equals(txId)) {
			if ("Charging".equalsIgnoreCase(state.getCurrentStatus()))
				raise(AnomalyType.TRANSACTION_REPLACED_WHILE_ACTIVE, state,
						"New transaction replaced active transaction. Effect: Billing mismatch.", event.getLogTime(),
						"Concurrent transaction on same connector.", getRawMessageFromEvent(event));
		}

		state.setActiveTransactionId(txId);
		state.setTransactionStartTime(event.getLogTime());

		System.out.println("Transaction Started: " + txId + " at " + event.getLogTime());
	}

	private void handleStopTransaction(ChargerRuntimeState state) {

		System.out.println("Transaction Stopped: " + state.getActiveTransactionId() + " at " + LocalDateTime.now());

		state.setActiveTransactionId(null);
		state.setRemoteStopPending(false);
		state.setRemoteStopAcceptedTime(null);
		state.setLastEnergyAtRemoteStop(null);
	}

	// =========================================================
	// REMOTE STOP
	// =========================================================
	private void handleRemoteStop(ChargerRuntimeState state, SenseEvent event) {

		if (!"OCPP_RESPONSE".equals(event.getEventType()))
			return;

		Map<?, ?> payload = (Map<?, ?>) event.getPayload();

		if ("Accepted".equals(payload.get("status"))) {

			state.setRemoteStopAcceptedTime(event.getLogTime());
			state.setRemoteStopPending(true);
			state.setLastEnergyAtRemoteStop(state.getLastMeterValue());

			System.out.println("Remote Stop Accepted at " + event.getLogTime());
		}
	}

	// =========================================================
	// METER VALUES
	// =========================================================
	private void handleMeterValues(ChargerRuntimeState state, SenseEvent event) {
		if (state.getMeterInterval() == null) {

			if (state.getLastMeterTime() != null) {

				long diff = Duration.between(state.getLastMeterTime(), event.getLogTime()).getSeconds();

				if (diff > 5 && diff < 3600) { // sanity bounds

					state.getMeterTimeBuffer().add(diff);

					if (state.getMeterTimeBuffer().size() >= 3) {

						long avg = (long) state.getMeterTimeBuffer().stream().mapToLong(Long::longValue).average()
								.orElse(0);

						state.setMeterInterval((int) avg);
						state.setMeterIntervalSource("AUTO");

						System.out.println("MeterInterval AUTO-learned: " + avg + " sec");

						state.getMeterTimeBuffer().clear();
					}
				}
			}
		}

// ---------------------------------------------------------
// EXISTING LOGIC (UNCHANGED)
// ---------------------------------------------------------

		MeterValuesPayload payload = objectMapper.convertValue(event.getPayload(), MeterValuesPayload.class);

		state.setLastMeterTime(event.getLogTime());
		state.getRecentMeterTimes().addLast(event.getLogTime());
		LocalDateTime twoMinutesAgo = event.getLogTime().minusSeconds(120);
		while (!state.getRecentMeterTimes().isEmpty()
				&& state.getRecentMeterTimes().peekFirst().isBefore(twoMinutesAgo)) {
			state.getRecentMeterTimes().pollFirst();
		}

		if (payload.getMeterValue().isEmpty())
			return;

		Double current = Double.valueOf(payload.getMeterValue().get(0).getSampledValue().get(0).getValue());

		System.out.println("Meter Value: " + current + " at " + event.getLogTime());

		if (state.getLastMeterValue() != null) {

			double diff = current - state.getLastMeterValue();
			System.out.println("Energy Diff: " + diff);

			if (diff > 5000) {

				String proof = String.format(
						"TxId=%s | Status=%s | PrevMeter=%.3f | CurrentMeter=%.3f | Diff=%.3f | LastMeterTime=%s | Now=%s",
						state.getActiveTransactionId(), state.getCurrentStatus(), state.getLastMeterValue(), current,
						diff, state.getLastMeterTime(), event.getLogTime());

				raise(AnomalyType.ENERGY_JUMP, state, "Abnormal sudden energy increase detected.", event.getLogTime(),
						proof, getRawMessageFromEvent(event));
			}

			String proof = String.format(
					"TxId=%s | Status=%s | PrevMeter=%.3f | CurrentMeter=%.3f | Diff=%.3f | LastMeterTime=%s | Now=%s | MeterInterval=%s sec",
					state.getActiveTransactionId(), state.getCurrentStatus(), state.getLastMeterValue(), current, diff,
					state.getLastMeterTime(), event.getLogTime(), state.getMeterInterval());

			if (diff == 0 && state.getActiveTransactionId() != null) {

				proof = String.format(
						"TxId=%s | Status=%s | PrevMeter=%.3f | CurrentMeter=%.3f | Diff=%.3f | LastMeterTime=%s | Now=%s | MeterInterval=%s sec",
						state.getActiveTransactionId(), state.getCurrentStatus(), state.getLastMeterValue(), current,
						diff, state.getLastMeterTime(), event.getLogTime(), state.getMeterInterval());

				raise(AnomalyType.CONTINUOUS_SAME_POWER, state,
						"No power change while charging. Effect: Billing may be inaccurate.", event.getLogTime(), proof,
						getRawMessageFromEvent(event));
			}

			if (state.isGroundFaultActive() && state.getActiveTransactionId() != null
					&& "Charging".equalsIgnoreCase(state.getCurrentStatus()) && diff > 0) {

				raise(AnomalyType.GROUND_FAULT_ENERGY_FLOWING, state,
						"GroundFault active but energy still flowing. Effect: Safety risk.", event.getLogTime(),
						"Charger continues delivering power despite ground fault.", getRawMessageFromEvent(event));
			}

			if ("OVERCURRENT".equalsIgnoreCase(state.getLastErrorCode())
					&& state.getActiveTransactionId() != null && "Charging".equalsIgnoreCase(state.getCurrentStatus())
					&& diff > 0) {

				raise(AnomalyType.OVERCURRENT_BUT_CHARGING, state,
						"Overcurrent reported but charging continues. Effect: Equipment damage risk.",
						event.getLogTime(), "Charger failed to stop power delivery after OverCurrent.",
						getRawMessageFromEvent(event));
			}
		}

		state.setLastMeterValue(current);
	}

	// =========================================================
	// RULE ENGINE
	// =========================================================
	private void runRules(ChargerRuntimeState state, LocalDateTime now) {

		// --------------------------------------------------
		// CHARGING BUT NO METERVALUE DIAGNOSTIC
		// --------------------------------------------------
		if (state.getActiveTransactionId() != null && state.getMeterInterval() != null
				&& state.getLastMeterTime() != null) {

			long diff = Duration.between(state.getLastMeterTime(), now).getSeconds();

			long threshold = (3L * state.getMeterInterval()) + 5;

			if (diff > threshold) {

				String rootCause;

				// 1️⃣ Status check
				if (!"Charging".equalsIgnoreCase(state.getCurrentStatus())
						&& !"Preparing".equalsIgnoreCase(state.getCurrentStatus())) {

					rootCause = "Charger not in Charging/Preparing state. Current status: " + state.getCurrentStatus();
				}

				// 2️⃣ WebSocket check
				else if (!state.isWebsocketConnected()) {

					rootCause = "WebSocket disconnected. Network issue.";
				}

				// 3️⃣ Heartbeat check
				else if (state.getLastHeartbeatTime() == null || Duration.between(state.getLastHeartbeatTime(), now)
						.getSeconds() > 2 * state.getHeartbeatInterval()) {

					rootCause = "Heartbeat timeout. Charger firmware unresponsive.";
				}

				// 4️⃣ ErrorCode check
				else if (state.getLastErrorCode() != null && !"NONE".equalsIgnoreCase(state.getLastErrorCode())) {

					rootCause = "Hardware fault reported: " + state.getLastErrorCode();
				}

				// 5️⃣ Default firmware issue
				else {

					rootCause = String.format(
							"Firmware issue. No meter values for %d sec (threshold: %d sec). TxId=%s | Status=%s | WebSocket=%s | LastHeartbeat=%s | LastError=%s",
							diff, threshold, state.getActiveTransactionId(), state.getCurrentStatus(),
							state.isWebsocketConnected(), state.getLastHeartbeatTime(), state.getLastErrorCode());

				}

				raise(AnomalyType.CHARGING_NO_METER_VALUES, state,
						"No meter values received during active charging transaction. Possible firmware hang.",
						now, rootCause, null);

			}
		}

		// --------------------------------------------------
		// CHARGING CONTINUES AFTER REMOTE STOP
		// --------------------------------------------------
		if (state.isRemoteStopPending() && state.getRemoteStopAcceptedTime() != null
				&& state.getActiveTransactionId() != null) {

			long graceWindow = 60; // seconds

			long diff = Duration.between(state.getRemoteStopAcceptedTime(), now).getSeconds();

			if (diff > graceWindow) {

				String rootCause;

				// 1️⃣ WebSocket check
				if (!state.isWebsocketConnected()) {

					rootCause = "WebSocket disconnected after RemoteStop. StopTransaction may be lost.";
				}

				// 2️⃣ Heartbeat check
				else if (state.getLastHeartbeatTime() == null || Duration.between(state.getLastHeartbeatTime(), now)
						.getSeconds() > 2 * state.getHeartbeatInterval()) {

					rootCause = "Charger firmware hang after RemoteStop.";
				}

				// 3️⃣ Hardware error check
				else if (state.getLastErrorCode() != null && !"NONE".equalsIgnoreCase(state.getLastErrorCode())) {

					rootCause = "Hardware fault preventing stop: " + state.getLastErrorCode();
				}

				// 4️⃣ Energy still increasing check
				else if (state.getLastEnergyAtRemoteStop() != null && state.getLastMeterValue() != null
						&& state.getLastMeterValue() > state.getLastEnergyAtRemoteStop()) {

					rootCause = "Relay not opened. Energy still increasing.";
				}

				// 5️⃣ Default firmware logic failure
				else {

					rootCause = "Firmware ignored RemoteStop command.";
				}

				raise(AnomalyType.CHARGING_AFTER_REMOTE_STOP, state,
						"Charging continues after RemoteStop. Billing & safety risk.", now, rootCause, null);
			}
		}
		// --------------------------------------------------
		// HEARTBEAT TIMEOUT / CHARGER HANG
		// --------------------------------------------------
		if (state.getLastBootTime() != null && state.isWebsocketConnected() && state.getHeartbeatInterval() != null
				&& state.getHeartbeatInterval() > 0) {

			long sinceBoot = Duration.between(state.getLastBootTime(), now).getSeconds();

			// Wait at least 2 intervals after boot before checking heartbeat
			if (sinceBoot >= 2 * state.getHeartbeatInterval() && state.getLastHeartbeatTime() != null) {

				long diff = Duration.between(state.getLastHeartbeatTime(), now).getSeconds();

				long threshold = 2 * state.getHeartbeatInterval();

				if (diff > threshold) {

					String proof = String.format(
							"LastBoot=%s | LastHeartbeat=%s | Now=%s | Elapsed=%d sec | Interval=%d",
							state.getLastBootTime(), state.getLastHeartbeatTime(), now, diff,
							state.getHeartbeatInterval());

					raise(AnomalyType.HEARTBEAT_TIMEOUT, state, "Charger online but heartbeat stopped.", now, proof,
							null);
				}
			}
		}

// --------------------------------------------------
// PARTIAL COMMUNICATION LOSS
// --------------------------------------------------
		if (state.isWebsocketConnected() && state.getLastHeartbeatTime() != null
				&& state.getHeartbeatInterval() != null) {

			long hbDiff = Duration.between(state.getLastHeartbeatTime(), now).getSeconds();

			if (hbDiff <= 2 * state.getHeartbeatInterval() && state.getCommandTimeoutCount() > 3) {
				String proof = String.format(
						"WebSocket=CONNECTED | " + "LastHeartbeat=%s | Elapsed=%d sec | "
								+ "CommandTimeoutCount=%d | Threshold=%d",
						state.getLastHeartbeatTime(), hbDiff, state.getCommandTimeoutCount(),
						state.getHeartbeatInterval() * 2);

				raise(AnomalyType.PARTIAL_COMMUNICATION_LOSS, state,
						"Charger sending heartbeat but not responding to commands.", now, proof, null);

			}
		}
//--------------------------------------------------
//METER FLOODING
//--------------------------------------------------
		if (state.getMeterCountLastMinute() > 60) {

			raise(AnomalyType.METER_FLOODING, state, "MeterValues flooding detected.", now,
					"MeterValue frequency exceeds threshold.", null);
		}

		if (!state.isWebsocketConnected() && state.getDisconnectTime() != null
				&& state.getActiveTransactionId() != null) {

			long diff = Duration.between(state.getDisconnectTime(), now).getSeconds();

			if (diff > 60)
				raise(AnomalyType.OPEN_TRANSACTION_AFTER_DISCONNECT, state,
						"Transaction left open after charger disconnect. Effect: Billing/data risk.", now,
						"WebSocket disconnected while transaction active.", null);
		}

		// --------------------------------------------------
		// STATUS / TRANSACTION MISMATCH
		// --------------------------------------------------
		if (state.getActiveTransactionId() != null && state.getCurrentStatus() != null
				&& "AVAILABLE".equalsIgnoreCase(state.getCurrentStatus())) {
			String proof = String.format("TxId=%s | Status=%s | DisconnectTime=%s",
					state.getActiveTransactionId(), state.getCurrentStatus(), state.getDisconnectTime());
			raise(AnomalyType.STATUS_TRANSACTION_MISMATCH, state,
					"Charger reports Available while transaction is still open. Billing mismatch risk.",
					now, proof, null);
		}

		// --------------------------------------------------
		// METER INTERVAL UNKNOWN
		// --------------------------------------------------
		if (state.getActiveTransactionId() != null && state.getMeterInterval() == null
				&& state.getTransactionStartTime() != null
				&& Duration.between(state.getTransactionStartTime(), now).getSeconds() > 300) {
			raise(AnomalyType.METER_INTERVAL_UNKNOWN, state,
					"No meter interval determined 5 minutes into transaction. Cannot detect meter loss.",
					now,
					"TxId=" + state.getActiveTransactionId() + " | TxStart=" + state.getTransactionStartTime(),
					null);
		}
	}

	// =========================================================
	// WATCHDOG
	// =========================================================
	private void checkWatchdogReboot(ChargerRuntimeState state, LocalDateTime now) {

		int count = 0;
		for (LocalDateTime t : state.getBootHistory()) {
			if (Duration.between(t, now).toMinutes() <= 15)
				count++;
		}

		StringBuilder history = new StringBuilder();

		for (LocalDateTime t : state.getBootHistory()) {
			if (Duration.between(t, now).toMinutes() <= 15) {
				history.append(t).append(", ");
			}
		}

		String proof = String.format("%d reboots within 15 min | RebootTimes=[%s] | Now=%s", count,
				history.length() > 0 ? history.substring(0, history.length() - 2) : "none", now);

		if (count >= 3) {
			raise(AnomalyType.WATCHDOG_REBOOT_LOOP, state, "Repeated reboots detected. System instability.", now, proof,
					null);
		}

	}

	// =========================================================
	// ANOMALY SAVE (Enhanced with effect and rootCause)
	// =========================================================
	private ChargerAnomaly raise(AnomalyType type, ChargerRuntimeState state, String effect, LocalDateTime logTime,
			String rootCause, String rawMessage) {

		// An open outage already has its alert; do not stack a new row on it after every cooldown.
		if (type == AnomalyType.HEARTBEAT_TIMEOUT && openSilence.containsKey(state.getChargerId()))
			return null;

		LocalDateTime now = logTime;

		// -----------------------------------------
		// Spam Prevention (Cooldown 60 seconds)
		// -----------------------------------------
		LocalDateTime lastTime = state.getLastAnomalyTime().get(type);

		if (lastTime != null && Duration.between(lastTime, now).getSeconds() < 60) {

			System.out.println("⚠ Spam prevented for: " + type);
			return null;
		}

		// -----------------------------------------
		// Increment Count
		// -----------------------------------------
		state.getAnomalyCount().merge(type, 1, Integer::sum);

		int count = state.getAnomalyCount().get(type);
		state.getLastAnomalyTime().put(type, now);

		// -----------------------------------------
		// Save to DB
		// -----------------------------------------
		ChargerAnomaly anomaly = new ChargerAnomaly();
		anomaly.setChargerId(state.getChargerId());
		anomaly.setAnomalyType(type);
		anomaly.setSeverity(type.getSeverity().name());
		anomaly.setDetectedAt(logTime);
		anomaly.setStatus("ACTIVE");
		anomaly.setOccurrenceCount(count);
		anomaly.setEffect(effect);
		String finalRootCause = rootCause;

		if (rawMessage != null && !rawMessage.isEmpty()) {
			finalRootCause = rootCause + " | Raw log: " + rawMessage;
		}

		anomaly.setRootCause(finalRootCause);

		ChargerAnomaly saved = anomalyRepository.save(anomaly);

		System.out.println("🚨 ANOMALY DETECTED");
		System.out.println("Type      : " + type);
		System.out.println("Severity  : " + type.getSeverity());
		System.out.println("Count     : " + count);
		System.out.println("Charger   : " + state.getChargerId());
		System.out.println("Effect    : " + effect);
		System.out.println("RootCause : " + finalRootCause);
		System.out.println("LogTime   : " + logTime);

		return saved != null ? saved : anomaly;
	}

	// helper method for evidence added by pavan
	private String getRawMessageFromEvent(SenseEvent event) {

		if (event == null)
			return null;

		String rawMessage = event.getRawMessage();

		if (rawMessage != null && !rawMessage.isEmpty()) {
			return rawMessage;
		}

		if (event.getPayload() != null) {
			try {
				return objectMapper.writeValueAsString(event.getPayload());
			} catch (Exception e) {
				return "Unable to serialize payload";
			}
		}

		return null;
	}

	private void printState(ChargerRuntimeState state) {

		System.out.println("\n-------- CHARGER STATE --------");
		System.out.println("ChargerId          : " + state.getChargerId());
		System.out.println("WebSocketConnected : " + state.isWebsocketConnected());
		System.out.println("HeartbeatInterval  : " + state.getHeartbeatInterval());
		System.out.println("LastHeartbeatTime  : " + state.getLastHeartbeatTime());
		System.out.println("MeterInterval      : " + state.getMeterInterval());
		System.out.println("LastMeterTime      : " + state.getLastMeterTime());
		System.out.println("LastMeterValue     : " + state.getLastMeterValue());
		System.out.println("TransactionId      : " + state.getActiveTransactionId());
		System.out.println("CurrentStatus      : " + state.getCurrentStatus());
		System.out.println("--------------------------------\n");
	}
}
