package com.evya.ocpi.versions;

import com.fasterxml.jackson.annotation.JsonProperty;

/** One module endpoint we serve, as published in the version details. */
public record EndpointDto(
        @JsonProperty("identifier") String identifier,
        @JsonProperty("role") InterfaceRole role,
        @JsonProperty("url") String url) {
}
