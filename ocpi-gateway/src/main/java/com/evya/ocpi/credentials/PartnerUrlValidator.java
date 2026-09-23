package com.evya.ocpi.credentials;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

/**
 * Guards the one place a partner hands us a URL we then fetch server-side.
 *
 * <p>Without this check, anyone holding a Token A could point the versions URL at loopback, a private
 * range or a cloud metadata endpoint and use the gateway as an SSRF proxy into our own network.
 *
 * <p>Known limitation: the host is resolved here and again by the HTTP client, so a DNS entry that
 * changes between the two calls can still slip through. Closing that needs a connection-level check in
 * the socket factory; it is tracked rather than pretended away.
 */
@Component
public class PartnerUrlValidator {

    private final boolean allowPrivateTargets;
    private final boolean allowPlainHttp;

    public PartnerUrlValidator(
            @Value("${ocpi.client.allow-private-targets:false}") boolean allowPrivateTargets,
            @Value("${ocpi.client.allow-plain-http:false}") boolean allowPlainHttp) {
        this.allowPrivateTargets = allowPrivateTargets;
        this.allowPlainHttp = allowPlainHttp;
    }

    public URI validate(String candidate) {
        URI uri;
        try {
            uri = URI.create(candidate.trim());
        } catch (IllegalArgumentException e) {
            throw new OcpiException(OcpiStatus.INVALID_PARAMETERS, "url is not a valid URI");
        }

        String scheme = uri.getScheme();
        if (scheme == null) {
            throw new OcpiException(OcpiStatus.INVALID_PARAMETERS, "url must be absolute");
        }
        boolean https = "https".equalsIgnoreCase(scheme);
        if (!https && !(allowPlainHttp && "http".equalsIgnoreCase(scheme))) {
            throw new OcpiException(OcpiStatus.INVALID_PARAMETERS, "url must use https");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new OcpiException(OcpiStatus.INVALID_PARAMETERS, "url has no host");
        }

        if (!allowPrivateTargets) {
            requirePublicHost(host);
        }
        return uri;
    }

    private void requirePublicHost(String host) {
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new OcpiException(OcpiStatus.INVALID_PARAMETERS, "url host does not resolve");
        }
        for (InetAddress address : addresses) {
            // Normalise IPv4-mapped IPv6 (::ffff:a.b.c.d) so the checks below see the real IPv4 address.
            InetAddress effective = normalizeMappedIpv4(address);
            if (effective.isLoopbackAddress() || effective.isAnyLocalAddress()
                    || effective.isLinkLocalAddress() || effective.isSiteLocalAddress()
                    || effective.isMulticastAddress() || isUniqueLocalIpv6(effective)
                    || isCarrierGradeNat(effective)) {
                throw new OcpiException(OcpiStatus.INVALID_PARAMETERS,
                        "url must point at a publicly routable host");
            }
        }
    }

    /** RFC 6598 carrier-grade NAT (100.64.0.0/10), used by some cloud metadata and internal networks. */
    private boolean isCarrierGradeNat(InetAddress address) {
        byte[] bytes = address.getAddress();
        return bytes.length == 4 && (bytes[0] & 0xFF) == 100 && (bytes[1] & 0xC0) == 0x40;
    }

    /** Unwraps an IPv4-mapped IPv6 address (::ffff:a.b.c.d) to its IPv4 form so it cannot bypass the checks. */
    private InetAddress normalizeMappedIpv4(InetAddress address) {
        byte[] b = address.getAddress();
        if (b.length == 16) {
            boolean mapped = true;
            for (int i = 0; i < 10; i++) {
                if (b[i] != 0) {
                    mapped = false;
                    break;
                }
            }
            if (mapped && (b[10] & 0xFF) == 0xFF && (b[11] & 0xFF) == 0xFF) {
                try {
                    return InetAddress.getByAddress(new byte[]{b[12], b[13], b[14], b[15]});
                } catch (UnknownHostException ignored) {
                    // fall through to the original address
                }
            }
        }
        return address;
    }

    /** fc00::/7 - the IPv6 equivalent of the private IPv4 ranges. */
    private boolean isUniqueLocalIpv6(InetAddress address) {
        byte[] bytes = address.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xFE) == 0xFC;
    }
}
