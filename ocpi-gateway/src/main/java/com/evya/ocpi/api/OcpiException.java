package com.evya.ocpi.api;

import org.springframework.http.HttpStatus;

/**
 * An OCPI-level failure. Carries both the OCPI status code and the HTTP status to answer with.
 */
public class OcpiException extends RuntimeException {

    private final OcpiStatus status;
    private final HttpStatus httpStatus;

    public OcpiException(OcpiStatus status, String message) {
        this(status, message, HttpStatus.OK);
    }

    public OcpiException(OcpiStatus status, String message, HttpStatus httpStatus) {
        super(message);
        this.status = status;
        this.httpStatus = httpStatus;
    }

    public OcpiStatus getStatus() {
        return status;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
