package com.evya.ocpi.security;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiStatus;
import org.springframework.http.HttpStatus;

/**
 * Holds the authenticated caller for the duration of one request. The filter sets it and always
 * clears it, so a pooled request thread can never carry one partner's identity into another's request.
 */
public final class OcpiCallerContext {

    private static final ThreadLocal<OcpiCaller> CURRENT = new ThreadLocal<>();

    private OcpiCallerContext() {
    }

    static void set(OcpiCaller caller) {
        CURRENT.set(caller);
    }

    static void clear() {
        CURRENT.remove();
    }

    public static OcpiCaller current() {
        OcpiCaller caller = CURRENT.get();
        if (caller == null) {
            throw new OcpiException(OcpiStatus.CLIENT_ERROR,
                    "Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return caller;
    }
}
