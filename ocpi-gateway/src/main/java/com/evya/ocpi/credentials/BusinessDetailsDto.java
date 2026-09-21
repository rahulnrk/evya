package com.evya.ocpi.credentials;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/** OCPI BusinessDetails. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BusinessDetailsDto(
        @JsonProperty("name") String name,
        @JsonProperty("website") String website,
        @JsonProperty("logo") ImageDto logo) {
}
