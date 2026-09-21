package com.evya.ocpi.versions;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.api.OcpiResponse;
import com.evya.ocpi.api.OcpiStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The entry point of every OCPI integration: a partner holding Token A calls /ocpi/versions, picks a
 * version, reads its endpoints and then posts credentials.
 *
 * <p>Only modules this gateway actually serves are published. Advertising a module we do not implement
 * would send partners to a 404 during their own integration tests.
 */
@RestController
@RequestMapping("/ocpi/versions")
public class VersionsController {

    private final String baseUrl;

    public VersionsController(@Value("${ocpi.public-base-url}") String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    @GetMapping
    public OcpiResponse<List<VersionDto>> versions() {
        return OcpiResponse.success(List.of(
                new VersionDto(OcpiVersion.V2_2_1, baseUrl + "/ocpi/versions/" + OcpiVersion.V2_2_1)));
    }

    @GetMapping("/{version}")
    public OcpiResponse<VersionDetailsDto> details(@PathVariable String version) {
        if (!OcpiVersion.V2_2_1.equals(version)) {
            throw new OcpiException(OcpiStatus.UNSUPPORTED_VERSION,
                    "This gateway serves OCPI " + OcpiVersion.V2_2_1);
        }
        return OcpiResponse.success(new VersionDetailsDto(OcpiVersion.V2_2_1, endpoints()));
    }

    private List<EndpointDto> endpoints() {
        // Credentials is published as RECEIVER: this side receives the partner's credentials object.
        // Confirm against the partner's expectations during sandbox integration - implementations
        // differ on the role they expect for the handshake modules.
        return List.of(new EndpointDto("credentials", InterfaceRole.RECEIVER,
                baseUrl + "/ocpi/" + OcpiVersion.V2_2_1 + "/credentials"));
    }
}
