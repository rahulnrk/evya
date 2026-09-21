package com.evya.ocpi.domain;

/** OCPI party roles. EVYA publishes as CPO first; EMSP follows (ADR-002 D3). */
public enum OcpiRole {
    CPO,
    EMSP,
    HUB,
    NSP,
    OTHER,
    SCSP
}
