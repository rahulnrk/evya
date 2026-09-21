package com.evya.ocpi.versions;

import com.fasterxml.jackson.annotation.JsonProperty;

/** An entry in GET /ocpi/versions. */
public record VersionDto(
        @JsonProperty("version") String version,
        @JsonProperty("url") String url) {
}
