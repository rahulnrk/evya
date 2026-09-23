package com.evya.ocpi.domain;

/**
 * Which side started a connection's OCPI credentials handshake (both directions are valid per the 2.2.1
 * spec, ADR-003 D5).
 */
public enum ConnectionDirection {

    /** We invited the partner: EVYA issued Token A and the partner registered against us. */
    INBOUND,

    /** We registered with the partner (or hub): the partner issued Token A and EVYA initiated. */
    OUTBOUND
}
