package com.evyasense.layer.model;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Data;

@Data
public class WebSocketContext {
    private String chargerId;
    private String clientId;
    private String sessionId;
    private String clientIp;
    
    private LocalDateTime connectedAt;

	public String getChargerId() {
		return chargerId;
	}

	public void setChargerId(String chargerId) {
		this.chargerId = chargerId;
	}

	public String getClientId() {
		return clientId;
	}

	public void setClientId(String clientId) {
		this.clientId = clientId;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public String getClientIp() {
		return clientIp;
	}

	public void setClientIp(String clientIp) {
		this.clientIp = clientIp;
	}

	public LocalDateTime getConnectedAt() {
		return connectedAt;
	}

	public void setConnectedAt(LocalDateTime connectedAt) {
		this.connectedAt = connectedAt;
	}
}
