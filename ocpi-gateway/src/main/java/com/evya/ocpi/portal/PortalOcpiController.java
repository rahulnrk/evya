package com.evya.ocpi.portal;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Vendor self-service OCPI, driven by the portal's OCPI tab (ADR-003). Authenticated by the platform JWT
 * (see {@link PortalSecurityConfig}); this controller enforces two more rules from the token:
 * <ul>
 *   <li>the caller must have the {@code ocpi} module (403 otherwise), and</li>
 *   <li>a vendor admin may act only on its own vendor; the platform admin may pass any {@code vendorId}.</li>
 * </ul>
 */
@RestController
@RequestMapping("/portal/ocpi")
public class PortalOcpiController {

    private static final String OCPI_MODULE = "ocpi";

    private final PortalOcpiService service;
    private final int adminRoleId;

    public PortalOcpiController(PortalOcpiService service,
                               @Value("${platform.roles.admin:1}") int adminRoleId) {
        this.service = service;
        this.adminRoleId = adminRoleId;
    }

    @GetMapping("/party")
    public PortalDtos.PartyView party(Authentication authentication,
                                      @RequestParam(required = false) Long vendorId) {
        Long vendor = resolveVendor(authentication, vendorId);
        return service.partyOf(vendor)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No OCPI party yet"));
    }

    @PutMapping("/party")
    public PortalDtos.PartyView upsertParty(Authentication authentication,
                                            @Valid @RequestBody PortalDtos.UpsertPartyRequest request) {
        Long vendor = resolveVendor(authentication, request.vendorId());
        return service.upsertParty(vendor, request);
    }

    @GetMapping("/connections")
    public List<PortalDtos.ConnectionView> connections(Authentication authentication,
                                                       @RequestParam(required = false) Long vendorId) {
        return service.connectionsOf(resolveVendor(authentication, vendorId));
    }

    @PostMapping("/connections/invite")
    public PortalDtos.InviteResult invite(Authentication authentication,
                                          @RequestParam(required = false) Long vendorId,
                                          @RequestBody(required = false) PortalDtos.InviteRequest request) {
        Long vendor = resolveVendor(authentication, vendorId);
        return service.invite(vendor, request == null ? new PortalDtos.InviteRequest(null) : request);
    }

    @PostMapping("/connections/register")
    public PortalDtos.ConnectionView register(Authentication authentication,
                                              @RequestParam(required = false) Long vendorId,
                                              @Valid @RequestBody PortalDtos.RegisterRequest request) {
        return service.registerWithPartner(resolveVendor(authentication, vendorId), request);
    }

    @DeleteMapping("/connections/{connectionId}")
    public ResponseEntity<Void> revoke(Authentication authentication,
                                       @RequestParam(required = false) Long vendorId,
                                       @PathVariable Long connectionId) {
        service.revoke(resolveVendor(authentication, vendorId), connectionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * The vendor this request acts on, after the module and scoping checks.
     *
     * @param requestedVendorId a vendor a platform admin is acting on behalf of; ignored for vendor admins
     */
    private Long resolveVendor(Authentication authentication, Long requestedVendorId) {
        PortalUser user = PortalUser.from(authentication, adminRoleId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!user.hasModule(OCPI_MODULE)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The OCPI module is not enabled for this vendor");
        }

        if (user.platformAdmin()) {
            if (requestedVendorId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "As a platform admin, name the vendor with ?vendorId=");
            }
            return requestedVendorId;
        }

        if (user.vendorId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This user is not attached to a vendor");
        }
        if (requestedVendorId != null && !requestedVendorId.equals(user.vendorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own vendor's OCPI");
        }
        return user.vendorId();
    }

    @ExceptionHandler(PortalOcpiService.PortalException.class)
    public ResponseEntity<Object> handlePortal(PortalOcpiService.PortalException e) {
        return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
    }
}
