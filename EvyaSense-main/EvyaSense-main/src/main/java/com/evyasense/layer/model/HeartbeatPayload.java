package com.evyasense.layer.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;


@Data
public class HeartbeatPayload {
    private String currentTime;

    public String getCurrentTime() { return currentTime; }
    public void setCurrentTime(String currentTime) { this.currentTime = currentTime; }
}
