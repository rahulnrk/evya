package com.evya.ocpi.credentials;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiStatus;
import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.security.OcpiCaller;
import com.evya.ocpi.security.TokenCipher;
import com.evya.ocpi.security.TokenGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * The OCPI credentials handshake, server side.
 *
 * <p>Ordering matters: the partner's API is contacted <i>before</i> anything is written, so a partner
 * whose interface is unreachable leaves no half-registered connection behind and their Token A stays
 * valid for a retry. No database transaction is held open across the outbound HTTP call.
 */
@Service
public class CredentialsService {

    private static final Logger log = LoggerFactory.getLogger(CredentialsService.class);

    private final CredentialsWriter writer;
    private final PartnerVersionClient versionClient;
    private final TokenGenerator tokenGenerator;
    private final TokenCipher tokenCipher;
    private final String baseUrl;

    public CredentialsService(CredentialsWriter writer,
                              PartnerVersionClient versionClient,
                              TokenGenerator tokenGenerator,
                              TokenCipher tokenCipher,
                              @Value("${ocpi.public-base-url}") String baseUrl) {
        this.writer = writer;
        this.versionClient = versionClient;
        this.tokenGenerator = tokenGenerator;
        this.tokenCipher = tokenCipher;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    /** GET /credentials - the credentials object we last issued to this caller. */
    public CredentialsDto ourCredentials(OcpiCaller caller) {
        PartnerConnection connection = caller.connection();
        if (connection.getStatus() != ConnectionStatus.REGISTERED) {
            throw new OcpiException(OcpiStatus.CLIENT_ERROR, "This connection is not registered");
        }
        return credentialsFor(connection.getParty(),
                tokenCipher.decrypt(connection.getTokenCEncrypted()));
    }

    /** POST /credentials - the partner completes the handshake using Token A. */
    public CredentialsDto register(OcpiCaller caller, CredentialsDto request) {
        PartnerConnection connection = caller.connection();
        if (connection.getStatus() == ConnectionStatus.REGISTERED) {
            throw new OcpiException(OcpiStatus.CLIENT_ERROR,
                    "Already registered. Use PUT to replace these credentials.",
                    HttpStatus.METHOD_NOT_ALLOWED);
        }
        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new OcpiException(OcpiStatus.CLIENT_ERROR,
                    "This connection cannot be registered in status " + connection.getStatus());
        }
        return completeHandshake(connection, request);
    }

    /** PUT /credentials - the partner rotates their token; we answer with a fresh Token C. */
    public CredentialsDto update(OcpiCaller caller, CredentialsDto request) {
        PartnerConnection connection = caller.connection();
        if (connection.getStatus() != ConnectionStatus.REGISTERED) {
            throw new OcpiException(OcpiStatus.CLIENT_ERROR,
                    "Not registered. Use POST with the token issued out of band.",
                    HttpStatus.METHOD_NOT_ALLOWED);
        }
        return completeHandshake(connection, request);
    }

    /** DELETE /credentials - the partner unregisters. Every token on the connection is destroyed. */
    public void unregister(OcpiCaller caller) {
        writer.unregister(caller.connection().getId());
        log.info("Connection {} unregistered by the partner", caller.connection().getId());
    }

    private CredentialsDto completeHandshake(PartnerConnection connection, CredentialsDto request) {
        CredentialsRoleDto partnerRole = primaryRole(request.roles());

        // Contact the partner first: on failure nothing is written and Token A survives for a retry.
        PartnerVersionClient.PartnerInterface partnerInterface =
                versionClient.discover(request.url(), request.token());

        String tokenC = tokenGenerator.newToken();
        writer.completeRegistration(connection, request, partnerRole, partnerInterface, tokenC);

        log.info("Handshake complete for {}*{} on party {}*{} ({} partner endpoints)",
                partnerRole.countryCode(), partnerRole.partyId(),
                connection.getParty().getCountryCode(), connection.getParty().getPartyId(),
                partnerInterface.modules().size());

        return credentialsFor(connection.getParty(), tokenC);
    }

    /**
     * A platform may present several roles. For a CPO gateway the counterpart that matters is the eMSP,
     * so it wins; otherwise the first role is recorded. Full multi-role handling arrives with hub support.
     */
    private CredentialsRoleDto primaryRole(List<CredentialsRoleDto> roles) {
        return roles.stream()
                .filter(r -> "EMSP".equalsIgnoreCase(r.role()))
                .findFirst()
                .orElse(roles.get(0));
    }

    private CredentialsDto credentialsFor(OcpiParty party, String token) {
        ImageDto logo = party.getBusinessLogoUrl() == null
                ? null
                : new ImageDto(party.getBusinessLogoUrl(), "OPERATOR",
                        imageType(party.getBusinessLogoUrl()));

        CredentialsRoleDto role = new CredentialsRoleDto(
                party.getRole().name(),
                new BusinessDetailsDto(party.getBusinessName(), party.getBusinessWebsite(), logo),
                party.getPartyId(),
                party.getCountryCode());

        return new CredentialsDto(token, baseUrl + "/ocpi/versions", List.of(role));
    }

    private String imageType(String url) {
        int dot = url.lastIndexOf('.');
        return dot < 0 ? "png" : url.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
