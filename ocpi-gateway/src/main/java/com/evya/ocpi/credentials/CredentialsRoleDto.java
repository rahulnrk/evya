package com.evya.ocpi.credentials;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * One role a party plays. A platform may present several; we key a connection on the first CPO/eMSP
 * role, which is what a bilateral roaming agreement is actually about.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CredentialsRoleDto(
        @JsonProperty("role") @NotBlank String role,
        @JsonProperty("business_details") BusinessDetailsDto businessDetails,
        @JsonProperty("party_id") @NotBlank @Size(min = 3, max = 3) String partyId,
        @JsonProperty("country_code") @NotBlank @Size(min = 2, max = 2) String countryCode) {
}
