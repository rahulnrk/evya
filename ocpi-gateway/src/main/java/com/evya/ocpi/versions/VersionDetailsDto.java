package com.evya.ocpi.versions;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/** GET /ocpi/versions/{version}: the modules we serve at that version. */
public record VersionDetailsDto(
        @JsonProperty("version") String version,
        @JsonProperty("endpoints") List<EndpointDto> endpoints) {
}
