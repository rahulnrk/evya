package com.evya.ocpi.portal;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;

/**
 * The signed-in portal user behind an OCPI administration request (ADR-003), read from the platform JWT.
 *
 * <p>The token carries {@code roleId}, the {@code vendorId} the user belongs to (null for the platform
 * admin), and the {@code modules} they may use. Vendor scoping is enforced from these claims: a vendor
 * admin may act only on its own vendor's party.
 */
public record PortalUser(Long userId, Integer roleId, Long vendorId, List<String> modules, boolean platformAdmin) {

    public boolean hasModule(String moduleKey) {
        return platformAdmin || (modules != null && modules.contains(moduleKey));
    }

    /** True when this user may administer OCPI for the given vendor. */
    public boolean canActOnVendor(Long targetVendorId) {
        if (platformAdmin) {
            return true;
        }
        return vendorId != null && vendorId.equals(targetVendorId);
    }

    @SuppressWarnings("unchecked")
    public static PortalUser from(Authentication authentication, int adminRoleId) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return null;
        }
        Jwt jwt = jwtAuth.getToken();
        Integer roleId = asInt(jwt.getClaim("roleId"));
        Long userId = asLong(jwt.getClaim("userId"));
        Long vendorId = asLong(jwt.getClaim("vendorId"));
        Object modulesClaim = jwt.getClaim("modules");
        List<String> modules = modulesClaim instanceof List ? (List<String>) modulesClaim : List.of();
        boolean platformAdmin = roleId != null && roleId == adminRoleId;
        return new PortalUser(userId, roleId, vendorId, modules, platformAdmin);
    }

    /** A non-secret description for logs. Never log the token. */
    public String describe() {
        return "user " + userId + " (role " + roleId + ", vendor " + vendorId + ")";
    }

    private static Integer asInt(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private static Long asLong(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }

    static boolean hasAuthority(Authentication authentication, String authority) {
        for (GrantedAuthority granted : authentication.getAuthorities()) {
            if (granted.getAuthority().equals(authority)) {
                return true;
            }
        }
        return false;
    }
}
