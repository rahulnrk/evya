package com.evyasense.layer.model;



import lombok.Data;

@Data
public class ChangeAvailabilityPayload {

    private Integer connectorId;
    private String type; // Operative | Inoperative
	public Integer getConnectorId() {
		return connectorId;
	}
	public void setConnectorId(Integer connectorId) {
		this.connectorId = connectorId;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
}

