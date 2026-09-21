package com.evya.ocpi.credentials;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiStatus;
import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.OcpiRole;
import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.PartnerEndpoint;
import com.evya.ocpi.domain.repo.PartnerConnectionRepository;
import com.evya.ocpi.domain.repo.PartnerEndpointRepository;
import com.evya.ocpi.security.TokenCipher;
import com.evya.ocpi.security.TokenHasher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

/**
 * The transactional write half of the handshake.
 *
 * <p>Separate from {@link CredentialsService} on purpose: a {@code @Transactional} method called from
 * another method of the same bean bypasses the proxy and silently runs without a transaction. Keeping
 * the write in its own bean means the boundary is real.
 */
@Component
public class CredentialsWriter {

    private final PartnerConnectionRepository connections;
    private final PartnerEndpointRepository endpoints;
    private final TokenHasher tokenHasher;
    private final TokenCipher tokenCipher;

    public CredentialsWriter(PartnerConnectionRepository connections,
                             PartnerEndpointRepository endpoints,
                             TokenHasher tokenHasher,
                             TokenCipher tokenCipher) {
        this.connections = connections;
        this.endpoints = endpoints;
        this.tokenHasher = tokenHasher;
        this.tokenCipher = tokenCipher;
    }

    @Transactional
    public void completeRegistration(PartnerConnection connection, CredentialsDto request,
                                     CredentialsRoleDto partnerRole,
                                     PartnerVersionClient.PartnerInterface partnerInterface,
                                     String tokenC) {

        connection.setPartnerCountryCode(partnerRole.countryCode().toUpperCase(Locale.ROOT));
        connection.setPartnerPartyId(partnerRole.partyId().toUpperCase(Locale.ROOT));
        connection.setPartnerRole(toRole(partnerRole.role()));
        connection.setPartnerBusinessName(partnerRole.businessDetails() == null
                ? null : partnerRole.businessDetails().name());
        connection.setPartnerVersionsUrl(request.url());
        connection.setPartnerTokenEncrypted(tokenCipher.encrypt(request.token()));
        connection.setAgreedVersion(partnerInterface.version());

        connection.setTokenCHash(tokenHasher.hash(tokenC));
        connection.setTokenCEncrypted(tokenCipher.encrypt(tokenC));
        // Token A is single-use by design: once the handshake lands it must never authenticate again.
        connection.setTokenAHash(null);
        connection.setStatus(ConnectionStatus.REGISTERED);
        connection.setRegisteredAt(Instant.now());
        connections.save(connection);

        // Hibernate orders inserts before deletes in a single flush, so a rotation would collide with
        // the rows it is replacing on uk_endpoint_module. Force the delete out first.
        endpoints.deleteByConnection(connection);
        endpoints.flush();

        for (PartnerVersionClient.PartnerModule module : partnerInterface.modules()) {
            PartnerEndpoint endpoint = new PartnerEndpoint();
            endpoint.setConnection(connection);
            endpoint.setIdentifier(module.identifier());
            endpoint.setRole(module.role());
            endpoint.setUrl(module.url());
            endpoints.save(endpoint);
        }
    }

    @Transactional
    public void unregister(Long connectionId) {
        PartnerConnection connection = connections.findById(connectionId)
                .orElseThrow(() -> new OcpiException(OcpiStatus.CLIENT_ERROR, "Unknown connection"));
        endpoints.deleteByConnection(connection);
        connection.wipeTokens();
        connection.setStatus(ConnectionStatus.UNREGISTERED);
        connection.setRegisteredAt(null);
        connections.save(connection);
    }

    private OcpiRole toRole(String role) {
        try {
            return OcpiRole.valueOf(role.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new OcpiException(OcpiStatus.INVALID_PARAMETERS, "Unknown role: " + role);
        }
    }
}
