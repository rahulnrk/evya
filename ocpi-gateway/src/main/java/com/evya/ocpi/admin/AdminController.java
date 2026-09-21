package com.evya.ocpi.admin;

import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.repo.OcpiPartyRepository;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.security.TokenGenerator;
import com.evya.ocpi.security.TokenHasher;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Operator API: register a tenant as an OCPI party and mint the Token A that starts a handshake.
 *
 * <p>Minting Token A is deliberately a human step (CLAUDE.md ground rule 1): the token is returned once,
 * in the response to this call, and handed to the partner out of band. Nothing stored here can reproduce it.
 */
@RestController
@RequestMapping("/internal/ocpi")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final OcpiPartyRepository parties;
    private final PartnerConnectionRepository connections;
    private final TokenGenerator tokenGenerator;
    private final TokenHasher tokenHasher;
    private final String baseUrl;

    public AdminController(OcpiPartyRepository parties, PartnerConnectionRepository connections,
                           TokenGenerator tokenGenerator, TokenHasher tokenHasher,
                           @Value("${ocpi.public-base-url}") String baseUrl) {
        this.parties = parties;
        this.connections = connections;
        this.tokenGenerator = tokenGenerator;
        this.tokenHasher = tokenHasher;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    @PostMapping("/parties")
    public ResponseEntity<AdminDtos.PartyView> createParty(
            @Valid @RequestBody AdminDtos.CreatePartyRequest request) {

        String country = request.countryCode().toUpperCase(Locale.ROOT);
        String partyId = request.partyId().toUpperCase(Locale.ROOT);

        parties.findByCountryCodeAndPartyId(country, partyId).ifPresent(existing -> {
            throw new ResponseStatusException(CONFLICT,
                    "Party " + country + "*" + partyId + " already exists");
        });

        OcpiParty party = new OcpiParty();
        party.setTenantId(request.tenantId());
        party.setCountryCode(country);
        party.setPartyId(partyId);
        party.setRole(request.role());
        party.setBusinessName(request.businessName());
        party.setBusinessWebsite(request.businessWebsite());
        party.setBusinessLogoUrl(request.businessLogoUrl());
        parties.save(party);

        log.info("Created OCPI party {}*{} for tenant {}", country, partyId, request.tenantId());
        return ResponseEntity.ok(view(party));
    }

    @GetMapping("/parties")
    public List<AdminDtos.PartyView> listParties() {
        return parties.findAll().stream().map(this::view).toList();
    }

    @PostMapping("/connections")
    public AdminDtos.ConnectionCreated createConnection(
            @Valid @RequestBody AdminDtos.CreateConnectionRequest request) {

        OcpiParty party = parties.findById(request.partyId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No such party"));

        String tokenA = tokenGenerator.newToken();

        PartnerConnection connection = new PartnerConnection();
        connection.setParty(party);
        connection.setTokenAHash(tokenHasher.hash(tokenA));
        connection.setPartnerBusinessName(request.partnerLabel());
        connections.save(connection);

        log.info("Minted Token A for connection {} on party {}*{}",
                connection.getId(), party.getCountryCode(), party.getPartyId());

        return new AdminDtos.ConnectionCreated(
                connection.getId(),
                party.getId(),
                tokenA,
                baseUrl + "/ocpi/versions",
                "Hand this token to the partner over an agreed channel. It is shown once, "
                        + "authenticates only until the handshake completes, and cannot be recovered.");
    }

    @GetMapping("/connections")
    public List<AdminDtos.ConnectionView> listConnections() {
        return connections.findAll().stream()
                .map(c -> new AdminDtos.ConnectionView(
                        c.getId(),
                        c.getParty().getId(),
                        c.getPartnerCountryCode(),
                        c.getPartnerPartyId(),
                        c.getPartnerRole(),
                        c.getPartnerBusinessName(),
                        c.getStatus(),
                        c.getAgreedVersion(),
                        c.getRegisteredAt(),
                        c.getLastSeenAt()))
                .toList();
    }

    private AdminDtos.PartyView view(OcpiParty party) {
        return new AdminDtos.PartyView(party.getId(), party.getTenantId(), party.getCountryCode(),
                party.getPartyId(), party.getRole(), party.getBusinessName(), party.isActive());
    }
}
