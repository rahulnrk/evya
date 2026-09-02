package com.evyasense.layer.model;



import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChargerData {
    private String chargerId;
    private LocalDateTime lastBootTime;
    private String firmwareVersion;
    private LocalDateTime lastHeartbeat;
    private String status; // online/offline based on heartbeat
    private LocalDateTime lastUpdated;
   
    private boolean websocketConnected;

    private int heartbeatInterval;  // in seconds
    private String currentStatus;
    private String previousStatus;
    private String lastErrorCode;
    private boolean groundFaultActive;
 
    
	public String getChargerId() {
		return chargerId;
	}
	public void setChargerId(String chargerId) {
		this.chargerId = chargerId;
	}
	public LocalDateTime getLastBootTime() {
		return lastBootTime;
	}
	public void setLastBootTime(LocalDateTime lastBootTime) {
		this.lastBootTime = lastBootTime;
	}
	public String getFirmwareVersion() {
		return firmwareVersion;
	}
	public void setFirmwareVersion(String firmwareVersion) {
		this.firmwareVersion = firmwareVersion;
	}
	public LocalDateTime getLastHeartbeat() {
		return lastHeartbeat;
	}
	public void setLastHeartbeat(LocalDateTime lastHeartbeat) {
		this.lastHeartbeat = lastHeartbeat;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public LocalDateTime getLastUpdated() {
		return lastUpdated;
	}
	public void setLastUpdated(LocalDateTime lastUpdated) {
		this.lastUpdated = lastUpdated;
	}
    
    // Redis key: charger:{chargerId}
}
