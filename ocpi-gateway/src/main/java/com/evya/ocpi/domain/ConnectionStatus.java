package com.evya.ocpi.domain;

/** Lifecycle of one (our party ↔ partner party) roaming connection. */
public enum ConnectionStatus {

    /** Token A minted and handed over; the partner has not completed the handshake yet. */
    PENDING,

    /** Handshake complete: the partner authenticates with Token C, we call them with Token B. */
    REGISTERED,

    /** Unregistered by either side. Tokens are wiped; a new Token A is needed to start over. */
    UNREGISTERED,

    /** Operator-disabled. Credentials survive but every request is refused. */
    SUSPENDED
}
