package com.evya.ocpi.security;

import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.PartnerConnection;

/**
 * The authenticated peer behind the current request, and - through the connection's party - the EVYA
 * tenant whose data it may see. Module code must scope every query by {@link #tenantId()}.
 *
 * @param connection the connection the presented token resolved to
 * @param viaTokenA  true when the caller is still in the handshake (Token A), false once registered
 */
public record OcpiCaller(PartnerConnection connection, boolean viaTokenA) {

    public OcpiParty party() {
        return connection.getParty();
    }

    public Long tenantId() {
        return connection.getParty().getTenantId();
    }

    /** Short, non-secret identifier for logs. Never log the token itself. */
    public String describe() {
        return connection.getPartnerCountryCode() + "*" + connection.getPartnerPartyId()
                + " -> " + party().getCountryCode() + "*" + party().getPartyId()
                + " (connection " + connection.getId() + ")";
    }
}
