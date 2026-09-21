package com.evya.ocpi.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * The OCPI response envelope: every OCPI reply carries data, status_code, status_message and timestamp.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OcpiResponse<T> {

    private T data;
    private int status_code;
    private String status_message;
    private String timestamp;

    public static <T> OcpiResponse<T> success(T data) {
        return of(data, OcpiStatus.SUCCESS, OcpiStatus.SUCCESS.defaultMessage());
    }

    public static <T> OcpiResponse<T> error(OcpiStatus status, String message) {
        return of(null, status, message == null ? status.defaultMessage() : message);
    }

    private static <T> OcpiResponse<T> of(T data, OcpiStatus status, String message) {
        OcpiResponse<T> response = new OcpiResponse<>();
        response.data = data;
        response.status_code = status.code();
        response.status_message = message;
        response.timestamp = Instant.now().toString();
        return response;
    }

    public T getData() {
        return data;
    }

    public int getStatus_code() {
        return status_code;
    }

    public String getStatus_message() {
        return status_message;
    }

    public String getTimestamp() {
        return timestamp;
    }
}
