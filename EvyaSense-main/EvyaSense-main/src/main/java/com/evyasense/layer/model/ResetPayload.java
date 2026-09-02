package com.evyasense.layer.model;


import lombok.Data;

@Data
public class ResetPayload {

    // Soft | Hard
    private String type;

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}
}
