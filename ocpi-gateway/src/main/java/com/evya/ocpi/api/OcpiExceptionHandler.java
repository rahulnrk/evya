package com.evya.ocpi.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns failures into OCPI envelopes. Messages describe the request, never internal state: a partner
 * platform is an untrusted peer and error text is the cheapest way to leak topology.
 */
@RestControllerAdvice
public class OcpiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(OcpiExceptionHandler.class);

    @ExceptionHandler(OcpiException.class)
    public ResponseEntity<OcpiResponse<Void>> handleOcpi(OcpiException e) {
        log.warn("OCPI {} - {}", e.getStatus().code(), e.getMessage());
        return ResponseEntity.status(e.getHttpStatus())
                .body(OcpiResponse.error(e.getStatus(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<OcpiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String field = e.getBindingResult().getFieldError() == null
                ? "request body"
                : e.getBindingResult().getFieldError().getField();
        return ResponseEntity.ok(OcpiResponse.error(
                OcpiStatus.INVALID_PARAMETERS, "Invalid or missing parameter: " + field));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<OcpiResponse<Void>> handleUnexpected(Exception e) {
        log.error("Unhandled failure serving an OCPI request", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(OcpiResponse.error(OcpiStatus.SERVER_ERROR, "Server error"));
    }
}
