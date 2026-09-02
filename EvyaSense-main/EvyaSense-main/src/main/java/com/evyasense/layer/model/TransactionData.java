package com.evyasense.layer.model;



import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionData {
    private String transactionId;
    private String chargerId;
    private String connectorId;
    private String idTag;
    private LocalDateTime startTime;
    private LocalDateTime stopTime;
    private Double lastMeterValue;
    private Double energyConsumed;
    private LocalDateTime lastEventTime;
    private LocalDateTime lastUpdated;
    private boolean active;
    private boolean transactionAccepted;
    
    
    private LocalDateTime lastMeterTime;

    private double previousMeterValue;

    private String transactionStatus;
    
	public String getTransactionId() {
		return transactionId;
	}
	public void setTransactionId(String transactionId) {
		this.transactionId = transactionId;
	}
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
	public String getIdTag() {
		return idTag;
	}
	public void setIdTag(String idTag) {
		this.idTag = idTag;
	}
	public LocalDateTime getStartTime() {
		return startTime;
	}
	public void setStartTime(LocalDateTime startTime) {
		this.startTime = startTime;
	}
	public LocalDateTime getStopTime() {
		return stopTime;
	}
	public void setStopTime(LocalDateTime stopTime) {
		this.stopTime = stopTime;
	}
	public Double getLastMeterValue() {
		return lastMeterValue;
	}
	public void setLastMeterValue(Double lastMeterValue) {
		this.lastMeterValue = lastMeterValue;
	}
	public Double getEnergyConsumed() {
		return energyConsumed;
	}
	public void setEnergyConsumed(Double energyConsumed) {
		this.energyConsumed = energyConsumed;
	}
	public LocalDateTime getLastEventTime() {
		return lastEventTime;
	}
	public void setLastEventTime(LocalDateTime lastEventTime) {
		this.lastEventTime = lastEventTime;
	}
	public LocalDateTime getLastUpdated() {
		return lastUpdated;
	}
	public void setLastUpdated(LocalDateTime lastUpdated) {
		this.lastUpdated = lastUpdated;
	}
	public String getTransactionStatus() {
		return transactionStatus;
	}
	public void setTransactionStatus(String transactionStatus) {
		this.transactionStatus = transactionStatus;
	}
    
    // Redis key: transaction:{transactionId}
}
