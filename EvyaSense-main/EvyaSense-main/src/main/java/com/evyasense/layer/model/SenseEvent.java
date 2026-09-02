package com.evyasense.layer.model;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class SenseEvent {

    private LocalDateTime logTime;
    private String eventType;   // WEBSOCKET | OCPP_REQUEST | OCPP_RESPONSE
    private String action;      // StartTransaction, Heartbeat, HANDSHAKE
    private String messageId;
    private Integer messageType;
    private Object payload;
    private WebSocketContext socketContext;
    
    private String rawMessage;
    
	public String getRawMessage() {
		return rawMessage;
	}
	public void setRawMessage(String rawMessage) {
		this.rawMessage = rawMessage;
	}
	public LocalDateTime getLogTime() {
		return logTime;
	}
	public void setLogTime(LocalDateTime logTime) {
		this.logTime = logTime;
	}
	public String getEventType() {
		return eventType;
	}
	public void setEventType(String eventType) {
		this.eventType = eventType;
	}
	public String getAction() {
		return action;
	}
	public void setAction(String action) {
		this.action = action;
	}
	public String getMessageId() {
		return messageId;
	}
	public void setMessageId(String messageId) {
		this.messageId = messageId;
	}
	public Integer getMessageType() {
		return messageType;
	}
	public void setMessageType(Integer messageType) {
		this.messageType = messageType;
	}
	public Object getPayload() {
		return payload;
	}
	public void setPayload(Object payload) {
		this.payload = payload;
	}
	public WebSocketContext getSocketContext() {
		return socketContext;
	}
	public void setSocketContext(WebSocketContext socketContext) {
		this.socketContext = socketContext;
	}

    // getters & setters
}
