package com.evyasense.layer.model;



import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConnectorData {
    private String chargerId;
    private String connectorId;
    private String status; // AVAILABLE, PREPARING, CHARGING, etc.
    private LocalDateTime lastStatusChanged;
    private LocalDateTime lastUpdated;
    
    private String activeTransactionId;
    
    private LocalDateTime lastMeterTime;
    private double lastMeterValue;
    private double previousMeterValue;
    private int meterInterval; // in seconds
    
   
	public String getChargerId() {
		return chargerId;
	}
	public void setChargerId(String chargerId) {
		this.chargerId = chargerId;
	}
	public String getConnectorId() {
		return connectorId;
	}
	public void setConnectorId(String connectorId) {
		this.connectorId = connectorId;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public LocalDateTime getLastStatusChanged() {
		return lastStatusChanged;
	}
	public void setLastStatusChanged(LocalDateTime lastStatusChanged) {
		this.lastStatusChanged = lastStatusChanged;
	}
	public LocalDateTime getLastUpdated() {
		return lastUpdated;
	}
	public void setLastUpdated(LocalDateTime lastUpdated) {
		this.lastUpdated = lastUpdated;
	}
    
    // Redis key: connector:{chargerId}:{connectorId}
}
