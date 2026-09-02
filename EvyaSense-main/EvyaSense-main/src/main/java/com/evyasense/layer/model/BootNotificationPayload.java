package com.evyasense.layer.model;



import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;


@Data
public class BootNotificationPayload {
    private String chargePointVendor;
    private String chargePointModel;
    private String chargePointSerialNumber;
    private String chargeBoxSerialNumber;
    private String firmwareVersion;
    private String iccid;
    private String imsi;
    private String meterType;
    private String meterSerialNumber;
	public String getChargePointVendor() {
		return chargePointVendor;
	}
	public void setChargePointVendor(String chargePointVendor) {
		this.chargePointVendor = chargePointVendor;
	}
	public String getChargePointModel() {
		return chargePointModel;
	}
	public void setChargePointModel(String chargePointModel) {
		this.chargePointModel = chargePointModel;
	}
	public String getChargePointSerialNumber() {
		return chargePointSerialNumber;
	}
	public void setChargePointSerialNumber(String chargePointSerialNumber) {
		this.chargePointSerialNumber = chargePointSerialNumber;
	}
	public String getChargeBoxSerialNumber() {
		return chargeBoxSerialNumber;
	}
	public void setChargeBoxSerialNumber(String chargeBoxSerialNumber) {
		this.chargeBoxSerialNumber = chargeBoxSerialNumber;
	}
	public String getFirmwareVersion() {
		return firmwareVersion;
	}
	public void setFirmwareVersion(String firmwareVersion) {
		this.firmwareVersion = firmwareVersion;
	}
	public String getIccid() {
		return iccid;
	}
	public void setIccid(String iccid) {
		this.iccid = iccid;
	}
	public String getImsi() {
		return imsi;
	}
	public void setImsi(String imsi) {
		this.imsi = imsi;
	}
	public String getMeterType() {
		return meterType;
	}
	public void setMeterType(String meterType) {
		this.meterType = meterType;
	}
	public String getMeterSerialNumber() {
		return meterSerialNumber;
	}
	public void setMeterSerialNumber(String meterSerialNumber) {
		this.meterSerialNumber = meterSerialNumber;
	}

    // Getters & Setters
   
    
}






