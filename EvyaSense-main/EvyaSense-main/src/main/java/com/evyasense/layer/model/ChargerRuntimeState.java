package com.evyasense.layer.model;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import com.evyasense.layer.canonical.AnomalyType;

import lombok.Data;

@Data
public class ChargerRuntimeState {

    private String chargerId;

    // WebSocket
    private boolean websocketConnected;
    private LocalDateTime lastEventTime;   
    private int meterReadingsCount = 0;
	private LocalDateTime groundFaultStartTime;

    public int getMeterReadingsCount() {
			return meterReadingsCount;
		}
		public void setMeterReadingsCount(int meterReadingsCount) {
			this.meterReadingsCount = meterReadingsCount;
		}
		public LocalDateTime getGroundFaultStartTime() {
			return groundFaultStartTime;
		}
		public void setGroundFaultStartTime(LocalDateTime groundFaultStartTime) {
			this.groundFaultStartTime = groundFaultStartTime;
		}
	public LocalDateTime getWebsocketConnectedTime() {
		return WebsocketConnectedTime;
	}
	public void setWebsocketConnectedTime(LocalDateTime websocketConnectedTime) {
		WebsocketConnectedTime = websocketConnectedTime;
	}
	public int getCommandTimeoutCount() {
		return commandTimeoutCount;
	}
	public void setCommandTimeoutCount(int commandTimeoutCount) {
		this.commandTimeoutCount = commandTimeoutCount;
	}
	public boolean isOverCurrentActive() {
		return overCurrentActive;
	}
	public void setOverCurrentActive(boolean overCurrentActive) {
		this.overCurrentActive = overCurrentActive;
	}
	public LocalDateTime getOverCurrentStartTime() {
		return overCurrentStartTime;
	}
	public void setOverCurrentStartTime(LocalDateTime overCurrentStartTime) {
		this.overCurrentStartTime = overCurrentStartTime;
	}
	public LocalDateTime getZeroEnergyStart() {
		return zeroEnergyStart;
	}
	public void setZeroEnergyStart(LocalDateTime zeroEnergyStart) {
		this.zeroEnergyStart = zeroEnergyStart;
	}
	public boolean isChargingDuringOffline() {
		return chargingDuringOffline;
	}
	public void setChargingDuringOffline(boolean chargingDuringOffline) {
		this.chargingDuringOffline = chargingDuringOffline;
	}
	public Double getEnergyAtDisconnect() {
		return energyAtDisconnect;
	}
	public void setEnergyAtDisconnect(Double energyAtDisconnect) {
		this.energyAtDisconnect = energyAtDisconnect;
	}
	public Double getMaxPowerKW() {
		return maxPowerKW;
	}
	public void setMaxPowerKW(Double maxPowerKW) {
		this.maxPowerKW = maxPowerKW;
	}
	public boolean isClockDriftDetected() {
		return clockDriftDetected;
	}
	public void setClockDriftDetected(boolean clockDriftDetected) {
		this.clockDriftDetected = clockDriftDetected;
	}
	public String getLastErrorCode() {
		return lastErrorCode;
	}
	public void setLastErrorCode(String lastErrorCode) {
		this.lastErrorCode = lastErrorCode;
	}
	public LocalDateTime getLastStatusTimestamp() {
		return lastStatusTimestamp;
	}
	public void setLastStatusTimestamp(LocalDateTime lastStatusTimestamp) {
		this.lastStatusTimestamp = lastStatusTimestamp;
	}
	public Integer getLastConnectorId() {
		return lastConnectorId;
	}
	public void setLastConnectorId(Integer lastConnectorId) {
		this.lastConnectorId = lastConnectorId;
	}
	public AnomalyType getLastRaisedAnomaly() {
		return lastRaisedAnomaly;
	}
	public void setLastRaisedAnomaly(AnomalyType lastRaisedAnomaly) {
		this.lastRaisedAnomaly = lastRaisedAnomaly;
	}
	public LocalDateTime getRemoteStopAcceptedTime() {
		return remoteStopAcceptedTime;
	}
	public void setRemoteStopAcceptedTime(LocalDateTime remoteStopAcceptedTime) {
		this.remoteStopAcceptedTime = remoteStopAcceptedTime;
	}
	public Double getLastEnergyAtRemoteStop() {
		return lastEnergyAtRemoteStop;
	}
	public void setLastEnergyAtRemoteStop(Double lastEnergyAtRemoteStop) {
		this.lastEnergyAtRemoteStop = lastEnergyAtRemoteStop;
	}
	public boolean isRemoteStopPending() {
		return remoteStopPending;
	}
	public void setRemoteStopPending(boolean remoteStopPending) {
		this.remoteStopPending = remoteStopPending;
	}
	public boolean isRebootDuringTransaction() {
		return rebootDuringTransaction;
	}
	public void setRebootDuringTransaction(boolean rebootDuringTransaction) {
		this.rebootDuringTransaction = rebootDuringTransaction;
	}
	public LocalDateTime getDisconnectTime() {
		return disconnectTime;
	}
	public void setDisconnectTime(LocalDateTime disconnectTime) {
		this.disconnectTime = disconnectTime;
	}
	public Deque<LocalDateTime> getBootHistory() {
		return bootHistory;
	}
	public void setBootHistory(Deque<LocalDateTime> bootHistory) {
		this.bootHistory = bootHistory;
	}
	public Map<AnomalyType, Integer> getAnomalyCount() {
		return anomalyCount;
	}
	public void setAnomalyCount(Map<AnomalyType, Integer> anomalyCount) {
		this.anomalyCount = anomalyCount;
	}
	public Map<AnomalyType, LocalDateTime> getLastAnomalyTime() {
		return lastAnomalyTime;
	}
	public void setLastAnomalyTime(Map<AnomalyType, LocalDateTime> lastAnomalyTime) {
		this.lastAnomalyTime = lastAnomalyTime;
	}
	public boolean isGroundFaultActive() {
		return groundFaultActive;
	}
	public void setGroundFaultActive(boolean groundFaultActive) {
		this.groundFaultActive = groundFaultActive;
	}
	public Double getLastEnergy() {
		return lastEnergy;
	}
	public void setLastEnergy(Double lastEnergy) {
		this.lastEnergy = lastEnergy;
	}
	public String getMeterIntervalSource() {
		return meterIntervalSource;
	}
	public void setMeterIntervalSource(String meterIntervalSource) {
		this.meterIntervalSource = meterIntervalSource;
	}
	public List<Long> getMeterTimeBuffer() {
		return meterTimeBuffer;
	}
	public void setMeterTimeBuffer(List<Long> meterTimeBuffer) {
		this.meterTimeBuffer = meterTimeBuffer;
	}
	// Boot / Heartbeat
    private Integer heartbeatInterval;
    private LocalDateTime lastHeartbeatTime;
    private LocalDateTime lastBootTime;
    private LocalDateTime WebsocketConnectedTime;

    // Transaction
    private Integer activeTransactionId;
    private LocalDateTime transactionStartTime;
    private String currentStatus;   // Charging, Available, Suspended etc
  

    private int commandTimeoutCount;
 // ---- Electrical safety tracking ----
    private boolean overCurrentActive;
    private LocalDateTime overCurrentStartTime;

    // ---- Meter stuck detection ----
    private LocalDateTime zeroEnergyStart;

    // ---- Offline charging revenue risk ----
    private boolean chargingDuringOffline;
    private Double energyAtDisconnect;

    // ---- Physics validation ----
    private Double maxPowerKW = 22.0; // configurable

    // ---- Clock drift ----
    private boolean clockDriftDetected;

   
    // Meter
    private Double lastMeterValue;
    private LocalDateTime lastMeterTime;
    private Integer meterInterval;
    private Integer configuredMeterInterval;
    private Integer learnedMeterInterval;
    private String lastErrorCode;
    private LocalDateTime lastStatusTimestamp;
    private Integer lastConnectorId;

    private Deque<LocalDateTime> recentMeterTimes = new ArrayDeque<>();


    // Thresholds
    private Integer meterTolerance = 5;
    private Integer heartbeatTolerance = 5;
    private AnomalyType lastRaisedAnomaly;
    private LocalDateTime remoteStopAcceptedTime;
    private Double lastEnergyAtRemoteStop;
    private boolean remoteStopPending;
    private boolean rebootDuringTransaction;
    private LocalDateTime disconnectTime;
    private Deque<LocalDateTime> bootHistory = new ArrayDeque<>();
    private Map<AnomalyType, Integer> anomalyCount = new HashMap<>();
    private Map<AnomalyType, LocalDateTime> lastAnomalyTime = new HashMap<>();

    private boolean groundFaultActive;
    private Double lastEnergy;
    private String meterIntervalSource;
    private List<Long> meterTimeBuffer = new ArrayList<>();



	public String getChargerId() {
		return chargerId;
	}
	public void setChargerId(String chargerId) {
		this.chargerId = chargerId;
	}
	public boolean isWebsocketConnected() {
		return websocketConnected;
	}
	public void setWebsocketConnected(boolean websocketConnected) {
		this.websocketConnected = websocketConnected;
	}
	public LocalDateTime getLastEventTime() {
		return lastEventTime;
	}
	public void setLastEventTime(LocalDateTime lastEventTime) {
		this.lastEventTime = lastEventTime;
	}
	public Integer getHeartbeatInterval() {
		return heartbeatInterval;
	}
	public void setHeartbeatInterval(Integer heartbeatInterval) {
		this.heartbeatInterval = heartbeatInterval;
	}
	public LocalDateTime getLastHeartbeatTime() {
		return lastHeartbeatTime;
	}
	public void setLastHeartbeatTime(LocalDateTime lastHeartbeatTime) {
		this.lastHeartbeatTime = lastHeartbeatTime;
	}
	public LocalDateTime getLastBootTime() {
		return lastBootTime;
	}
	public void setLastBootTime(LocalDateTime lastBootTime) {
		this.lastBootTime = lastBootTime;
	}
	public Integer getActiveTransactionId() {
		return activeTransactionId;
	}
	public void setActiveTransactionId(Integer activeTransactionId) {
		this.activeTransactionId = activeTransactionId;
	}
	public LocalDateTime getTransactionStartTime() {
		return transactionStartTime;
	}
	public void setTransactionStartTime(LocalDateTime transactionStartTime) {
		this.transactionStartTime = transactionStartTime;
	}
	public String getCurrentStatus() {
		return currentStatus;
	}
	public void setCurrentStatus(String currentStatus) {
		this.currentStatus = currentStatus;
	}
	public Double getLastMeterValue() {
		return lastMeterValue;
	}
	public void setLastMeterValue(Double lastMeterValue) {
		this.lastMeterValue = lastMeterValue;
	}
	public LocalDateTime getLastMeterTime() {
		return lastMeterTime;
	}
	public void setLastMeterTime(LocalDateTime lastMeterTime) {
		this.lastMeterTime = lastMeterTime;
	}
	public Integer getMeterInterval() {
		return meterInterval;
	}
	public void setMeterInterval(Integer meterInterval) {
		this.meterInterval = meterInterval;
	}
	public Integer getConfiguredMeterInterval() {
		return configuredMeterInterval;
	}
	public void setConfiguredMeterInterval(Integer configuredMeterInterval) {
		this.configuredMeterInterval = configuredMeterInterval;
	}
	public Integer getLearnedMeterInterval() {
		return learnedMeterInterval;
	}
	public void setLearnedMeterInterval(Integer learnedMeterInterval) {
		this.learnedMeterInterval = learnedMeterInterval;
	}
	public Deque<LocalDateTime> getRecentMeterTimes() {
	    return recentMeterTimes;
	}

	public void setRecentMeterTimes(Deque<LocalDateTime> recentMeterTimes) {
	    this.recentMeterTimes = recentMeterTimes;
	}

	public Integer getMeterTolerance() {
		return meterTolerance;
	}
	public void setMeterTolerance(Integer meterTolerance) {
		this.meterTolerance = meterTolerance;
	}
	public Integer getHeartbeatTolerance() {
		return heartbeatTolerance;
	}
	public void setHeartbeatTolerance(Integer heartbeatTolerance) {
		this.heartbeatTolerance = heartbeatTolerance;
	}
	public int getMeterCountLastMinute() {
		if (recentMeterTimes.isEmpty() || lastEventTime == null) return 0;
		LocalDateTime oneMinuteAgo = lastEventTime.minusSeconds(60);
		return (int) recentMeterTimes.stream()
				.filter(t -> !t.isBefore(oneMinuteAgo))
				.count();
	}
	
	
}
