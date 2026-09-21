package com.evya.ocpi.credentials;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/** OCPI Image. Emitted only when a party has a logo configured, since url/category/type are required. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ImageDto(
        @JsonProperty("url") String url,
        @JsonProperty("category") String category,
        @JsonProperty("type") String type) {
}
