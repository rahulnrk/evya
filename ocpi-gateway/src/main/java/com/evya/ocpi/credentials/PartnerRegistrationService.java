package com.evya.ocpi.credentials;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiStatus;
import com.evya.ocpi.domain.OcpiParty;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.security.TokenGenerator;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * The partner-initiated handshake (ADR-003 D5): the partner (often a hub) issued us a Token A out of
 * band, and EVYA initiates the exchange. OCPI 2.2.1 allows either platform to initiate.
 *
 * <p>Ordering mirrors the inbound flow: the partner is contacted and their response parsed <i>before</i>
 * anything is written, so a partner whose API is unreachable or whose reply is malformed leaves no
 * half-registered connection behind. The one HTTP call that a database failure could strand is the POST
 * of our credentials; that window is documented rather than pretended away.
 */
@Service
public class PartnerRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(PartnerRegistrationService.class);

    private final PartnerVersionClient versionClient;
    private final CredentialsWriter writer;
    private final TokenGenerator tokenGenerator;
    private final ObjectMapper mapper;
    private final String baseUrl;

    public PartnerRegistrationService(PartnerVersionClient versionClient, CredentialsWriter writer,
                                      TokenGenerator tokenGenerator, ObjectMapper mapper,
                                      @Value("${ocpi.public-base-url}") String baseUrl) {
        this.versionClient = versionClient;
        this.writer = writer;
        this.tokenGenerator = tokenGenerator;
        this.mapper = mapper;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    /**
     * Registers our {@code party} with a partner using the partner's Token A.
     *
     * @param connection a fresh, unsaved connection already bound to our party
     * @param versionsUrl the partner's versions URL, given to us out of band
     * @param tokenA the one-time token the partner issued us
     */
    public void registerWithPartner(PartnerConnection connection, String versionsUrl, String tokenA) {
        OcpiParty party = connection.getParty();

        // 1. Learn the partner's endpoints (validates the URL, https/public only, no redirects).
        PartnerVersionClient.PartnerInterface partnerInterface = versionClient.discover(versionsUrl, tokenA);

        // 2. Mint the token the partner will use to call us, and POST our credentials to them.
        String ourTokenForPartner = tokenGenerator.newToken();
        String ourCredentials = ourCredentialsJson(party, ourTokenForPartner);
        JsonNode partnerData = versionClient.postCredentials(partnerInterface, tokenA, ourCredentials);

        // 3. Parse the partner's credentials object (their token for us, their url, their roles).
        CredentialsDto partnerCredentials = parseCredentials(partnerData);
        CredentialsRoleDto partnerRole = primaryRole(partnerCredentials.roles());

        // 4. Persist only now that the exchange has fully succeeded.
        writer.completeOutboundRegistration(connection, ourTokenForPartner, partnerCredentials.token(),
                partnerCredentials, partnerRole, partnerInterface);

        log.info("Registered party {}*{} with partner {}*{} ({} endpoints)",
                party.getCountryCode(), party.getPartyId(), partnerRole.countryCode(),
                partnerRole.partyId(), partnerInterface.modules().size());
    }

    private String ourCredentialsJson(OcpiParty party, String token) {
        ImageDto logo = party.getBusinessLogoUrl() == null ? null
                : new ImageDto(party.getBusinessLogoUrl(), "OPERATOR", imageType(party.getBusinessLogoUrl()));
        CredentialsRoleDto role = new CredentialsRoleDto(party.getRole().name(),
                new BusinessDetailsDto(party.getBusinessName(), party.getBusinessWebsite(), logo),
                party.getPartyId(), party.getCountryCode());
        CredentialsDto ours = new CredentialsDto(token, baseUrl + "/ocpi/versions", List.of(role));
        try {
            return mapper.writeValueAsString(ours);
        } catch (Exception e) {
            throw new OcpiException(OcpiStatus.SERVER_ERROR, "Could not build our credentials object");
        }
    }

    private CredentialsDto parseCredentials(JsonNode data) {
        try {
            CredentialsDto credentials = mapper.treeToValue(data, CredentialsDto.class);
            if (credentials.token() == null || credentials.token().isBlank()
                    || credentials.url() == null || credentials.roles() == null || credentials.roles().isEmpty()) {
                throw new OcpiException(OcpiStatus.UNABLE_TO_USE_CLIENT_API,
                        "The partner's credentials object is incomplete");
            }
            return credentials;
        } catch (OcpiException e) {
            throw e;
        } catch (Exception e) {
            throw new OcpiException(OcpiStatus.UNABLE_TO_USE_CLIENT_API,
                    "The partner's credentials object could not be read");
        }
    }

    private CredentialsRoleDto primaryRole(List<CredentialsRoleDto> roles) {
        return roles.stream()
                .filter(r -> "CPO".equalsIgnoreCase(r.role()))
                .findFirst()
                .orElse(roles.get(0));
    }

    private String imageType(String url) {
        int dot = url.lastIndexOf('.');
        return dot < 0 ? "png" : url.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
