package com.evyasense.layer.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
public class StartTransactionPayload {
    private Integer connectorId;
    private String idTag;
    private Integer meterStart;
    private String timestamp;

    private String reservationId;

	public Integer getConnectorId() {
		return connectorId;
	}

	public void setConnectorId(Integer connectorId) {
		this.connectorId = connectorId;
	}

	public String getIdTag() {
		return idTag;
	}

	public void setIdTag(String idTag) {
		this.idTag = idTag;
	}

	public Integer getMeterStart() {
		return meterStart;
	}

	public void setMeterStart(Integer meterStart) {
		this.meterStart = meterStart;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}

	public String getReservationId() {
		return reservationId;
	}

	public void setReservationId(String reservationId) {
		this.reservationId = reservationId;
	}
   
}

