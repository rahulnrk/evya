package com.evyasense.layer.model;

import lombok.Data;

@Data
public class AuthorizationPayload {
	private String idTag;

	public String getIdTag() {
		return idTag;
	}

	public void setIdTag(String idTag) {
		this.idTag = idTag;
	}

}
