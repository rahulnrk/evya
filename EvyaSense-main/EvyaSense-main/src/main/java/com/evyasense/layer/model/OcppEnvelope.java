package com.evyasense.layer.model;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class OcppEnvelope {
    private LocalDateTime logTime;
    private WebSocketContext socketContext;
    private int messageType;
    private String messageId;
    private String action;
    private Object payload;
	public LocalDateTime getLogTime() {
		return logTime;
	}
	public void setLogTime(LocalDateTime logTime) {
		this.logTime = logTime;
	}
	public WebSocketContext getSocketContext() {
		return socketContext;
	}
	public void setSocketContext(WebSocketContext socketContext) {
		this.socketContext = socketContext;
	}
	public int getMessageType() {
		return messageType;
	}
	public void setMessageType(int messageType) {
		this.messageType = messageType;
	}
	public String getMessageId() {
		return messageId;
	}
	public void setMessageId(String messageId) {
		this.messageId = messageId;
	}
	public String getAction() {
		return action;
	}
	public void setAction(String action) {
		this.action = action;
	}
	public Object getPayload() {
		return payload;
	}
	public void setPayload(Object payload) {
		this.payload = payload;
	}
}

