package com.evya.ocpi.portal;

import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.OcpiRole;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.OcpiPartyRepository;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.security.TokenGenerator;
import com.evya.ocpi.security.TokenHasher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Vendor self-service for OCPI (ADR-003): a vendor manages its own party and partner invitations, EVYA
 * sees every vendor. Access control is the caller's job; this layer scopes every read and write to a
 * single vendor and never crosses vendors.
 */
@Service
public class PortalOcpiService {

    private static final Logger log = LoggerFactory.getLogger(PortalOcpiService.class);

    private final OcpiPartyRepository parties;
    private final PartnerConnectionRepository connections;
    private final TokenGenerator tokenGenerator;
    private final TokenHasher tokenHasher;
    private final OcpiRole defaultRole;
    private final String baseUrl;

    public PortalOcpiService(OcpiPartyRepository parties, PartnerConnectionRepository connections,
                             TokenGenerator tokenGenerator, TokenHasher tokenHasher,
                             @Value("${ocpi.default-role:CPO}") String defaultRole,
                             @Value("${ocpi.public-base-url}") String baseUrl) {
        this.parties = parties;
        this.connections = connections;
        this.tokenGenerator = tokenGenerator;
        this.tokenHasher = tokenHasher;
        this.defaultRole = OcpiRole.valueOf(defaultRole.toUpperCase(Locale.ROOT));
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    public Optional<PortalDtos.PartyView> partyOf(Long vendorId) {
        return parties.findByTenantId(vendorId).stream().findFirst().map(this::view);
    }

    /**
     * Creates the vendor's party, or updates its business details. One party per vendor for now; the
     * country/party id is fixed once set, because it is the vendor's identity on the roaming network.
     */
    @Transactional
    public PortalDtos.PartyView upsertParty(Long vendorId, PortalDtos.UpsertPartyRequest request) {
        String country = request.countryCode().toUpperCase(Locale.ROOT);
        String partyId = request.partyId().toUpperCase(Locale.ROOT);

        OcpiParty party = parties.findByTenantId(vendorId).stream().findFirst().orElse(null);
        if (party == null) {
            parties.findByCountryCodeAndPartyId(country, partyId).ifPresent(existing -> {
                throw new PortalException("Party " + country + "*" + partyId + " is already taken");
            });
            party = new OcpiParty();
            party.setTenantId(vendorId);
            party.setCountryCode(country);
            party.setPartyId(partyId);
            party.setRole(defaultRole);
        } else if (!party.getCountryCode().equals(country) || !party.getPartyId().equals(partyId)) {
            throw new PortalException("This vendor's OCPI identity is already "
                    + party.getCountryCode() + "*" + party.getPartyId() + " and cannot be changed here");
        }

        party.setBusinessName(request.businessName());
        party.setBusinessWebsite(request.businessWebsite());
        party.setBusinessLogoUrl(request.businessLogoUrl());
        parties.save(party);
        log.info("Vendor {} party saved: {}*{}", vendorId, country, partyId);
        return view(party);
    }

    public List<PortalDtos.ConnectionView> connectionsOf(Long vendorId) {
        OcpiParty party = parties.findByTenantId(vendorId).stream().findFirst().orElse(null);
        if (party == null) {
            return List.of();
        }
        return connections.findByPartyId(party.getId()).stream().map(this::view).toList();
    }

    /** Mints a Token A for this vendor's party. The vendor must have a party first. */
    @Transactional
    public PortalDtos.InviteResult invite(Long vendorId, PortalDtos.InviteRequest request) {
        OcpiParty party = parties.findByTenantId(vendorId).stream().findFirst()
                .orElseThrow(() -> new PortalException("Set up your OCPI party before inviting a partner"));

        String tokenA = tokenGenerator.newToken();
        PartnerConnection connection = new PartnerConnection();
        connection.setParty(party);
        connection.setTokenAHash(tokenHasher.hash(tokenA));
        connection.setPartnerBusinessName(request.partnerLabel());
        connections.save(connection);

        log.info("Vendor {} invited a partner (connection {})", vendorId, connection.getId());
        return new PortalDtos.InviteResult(connection.getId(), tokenA, baseUrl + "/ocpi/versions",
                "Give this token to the partner over an agreed channel. It is shown once, works only until "
                        + "the handshake completes, and cannot be recovered.");
    }

    /** Ends a connection: its tokens are destroyed. Scoped to the vendor's own party. */
    @Transactional
    public void revoke(Long vendorId, Long connectionId) {
        PartnerConnection connection = ownedConnection(vendorId, connectionId);
        connection.wipeTokens();
        connection.setStatus(ConnectionStatus.UNREGISTERED);
        connection.setRegisteredAt(null);
        connections.save(connection);
        log.info("Vendor {} revoked connection {}", vendorId, connectionId);
    }

    private PartnerConnection ownedConnection(Long vendorId, Long connectionId) {
        PartnerConnection connection = connections.findById(connectionId)
                .orElseThrow(() -> new PortalException("No such connection"));
        Long owner = connection.getParty() == null ? null : connection.getParty().getTenantId();
        if (owner == null || !owner.equals(vendorId)) {
            // Do not reveal that the connection exists under another vendor.
            throw new PortalException("No such connection");
        }
        return connection;
    }

    private PortalDtos.PartyView view(OcpiParty party) {
        return new PortalDtos.PartyView(party.getId(), party.getTenantId(), party.getCountryCode(),
                party.getPartyId(), party.getRole(), party.getBusinessName(), party.isActive());
    }

    private PortalDtos.ConnectionView view(PartnerConnection c) {
        return new PortalDtos.ConnectionView(c.getId(), c.getPartnerCountryCode(), c.getPartnerPartyId(),
                c.getPartnerRole(), c.getPartnerBusinessName(), c.getStatus(), c.getAgreedVersion(),
                c.getRegisteredAt(), c.getLastSeenAt());
    }

    /** A portal request that cannot be satisfied; the controller maps it to 400. */
    public static class PortalException extends RuntimeException {
        public PortalException(String message) {
            super(message);
        }
    }
}
