package com.evya.ocpi.portal;

import com.evya.ocpi.domain.ConnectionDirection;
import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** Request and response shapes for the portal-facing OCPI API (ADR-003). */
public final class PortalDtos {

    private PortalDtos() {
    }

    /**
     * Create or update the caller's OCPI party. A vendor admin's {@code vendorId} is taken from the token
     * and ignored here; a platform admin must supply it.
     */
    public record UpsertPartyRequest(
            Long vendorId,
            @NotBlank @Size(min = 2, max = 2) String countryCode,
            @NotBlank @Size(min = 3, max = 3) String partyId,
            @NotBlank String businessName,
            String businessWebsite,
            String businessLogoUrl) {
    }

    public record PartyView(
            Long id,
            Long vendorId,
            String countryCode,
            String partyId,
            OcpiRole role,
            String businessName,
            boolean active) {
    }

    /** Invite a partner: EVYA mints a Token A for this vendor's party for the partner to use. */
    public record InviteRequest(String partnerLabel) {
    }

    /**
     * Register with a partner or hub that issued us a Token A (ADR-003 D5). The vendor enters the
     * partner's versions URL and the one-time token they were given.
     */
    public record RegisterRequest(
            @jakarta.validation.constraints.NotBlank String versionsUrl,
            @jakarta.validation.constraints.NotBlank String token,
            String partnerLabel) {
    }

    /** The Token A, shown once, for a human to hand to the partner out of band. */
    public record InviteResult(
            Long connectionId,
            String tokenA,
            String versionsUrl,
            String handoverNote) {
    }

    public record ConnectionView(
            Long id,
            ConnectionDirection direction,
            String partnerCountryCode,
            String partnerPartyId,
            OcpiRole partnerRole,
            String partnerBusinessName,
            ConnectionStatus status,
            String agreedVersion,
            Instant registeredAt,
            Instant lastSeenAt) {
    }
}
