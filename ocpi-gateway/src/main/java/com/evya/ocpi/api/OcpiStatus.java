package com.evya.ocpi.api;

/**
 * OCPI 2.2.1 status codes (§ Status codes). The HTTP status reports transport success; this code
 * reports what OCPI made of the request.
 */
public enum OcpiStatus {

    SUCCESS(1000, "Success"),

    CLIENT_ERROR(2000, "Client error"),
    INVALID_PARAMETERS(2001, "Invalid or missing parameters"),
    NOT_ENOUGH_INFORMATION(2002, "Not enough information"),
    UNKNOWN_LOCATION(2003, "Unknown location"),
    UNKNOWN_TOKEN(2004, "Unknown token"),

    SERVER_ERROR(3000, "Server error"),
    UNABLE_TO_USE_CLIENT_API(3001, "Unable to use the client's API"),
    UNSUPPORTED_VERSION(3002, "Unsupported version"),
    NO_MATCHING_ENDPOINTS(3003, "No matching endpoints or expected endpoints missing");

    private final int code;
    private final String defaultMessage;

    OcpiStatus(int code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public int code() {
        return code;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
