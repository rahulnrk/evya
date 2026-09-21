package com.evya.ocpi.versions;

/**
 * OCPI versions this gateway speaks. 2.2.1 first for the widest partner support; 2.3.0 is additive and
 * is added here once its migration guide and OpenAPI have been read (ADR-002).
 */
public final class OcpiVersion {

    public static final String V2_2_1 = "2.2.1";

    private OcpiVersion() {
    }
}
