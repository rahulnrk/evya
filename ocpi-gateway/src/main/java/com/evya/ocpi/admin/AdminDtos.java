package com.evya.ocpi.admin;

import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** Request and response shapes for the operator API. Internal only; not part of the OCPI surface. */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record CreatePartyRequest(
            @NotNull Long tenantId,
            @NotBlank @Size(min = 2, max = 2) String countryCode,
            @NotBlank @Size(min = 3, max = 3) String partyId,
            @NotNull OcpiRole role,
            @NotBlank String businessName,
            String businessWebsite,
            String businessLogoUrl) {
    }

    public record PartyView(
            Long id,
            Long tenantId,
            String countryCode,
            String partyId,
            OcpiRole role,
            String businessName,
            boolean active) {
    }

    public record CreateConnectionRequest(
            @NotNull Long partyId,
            String partnerLabel) {
    }

    /**
     * The only time a Token A is ever readable. It is shown once, handed to the partner out of band by
     * a named human, and stored here as a hash only.
     */
    public record ConnectionCreated(
            Long connectionId,
            Long partyId,
            String tokenA,
            String versionsUrl,
            String handoverNote) {
    }

    public record ConnectionView(
            Long id,
            Long partyId,
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
