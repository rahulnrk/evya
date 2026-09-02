package com.evyasense.layer.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;
@Data
public class StatusNotificationPayload {
    private Integer connectorId;
    private String status;
    private String errorCode;
    private String info;
    private String vendorErrorCode;
    private String vendorId;
    private String timestamp;
	public Integer getConnectorId() {
		return connectorId;
	}
	public void setConnectorId(Integer connectorId) {
		this.connectorId = connectorId;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public String getErrorCode() {
		return errorCode;
	}
	public void setErrorCode(String errorCode) {
		this.errorCode = errorCode;
	}
	public String getInfo() {
		return info;
	}
	public void setInfo(String info) {
		this.info = info;
	}
	public String getVendorErrorCode() {
		return vendorErrorCode;
	}
	public void setVendorErrorCode(String vendorErrorCode) {
		this.vendorErrorCode = vendorErrorCode;
	}
	public String getVendorId() {
		return vendorId;
	}
	public void setVendorId(String vendorId) {
		this.vendorId = vendorId;
	}
	public String getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}

    // Getters & Setters
   
}