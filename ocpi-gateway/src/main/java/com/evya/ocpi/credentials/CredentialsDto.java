package com.evya.ocpi.credentials;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * The OCPI Credentials object, exchanged in both directions.
 *
 * <p>Inbound, {@code token} is the partner's Token B - the token we use to call them. Outbound, it is
 * the Token C we mint for them to call us.
 */
public record CredentialsDto(
        @JsonProperty("token") @NotBlank String token,
        @JsonProperty("url") @NotBlank String url,
        @JsonProperty("roles") @NotEmpty @Valid List<CredentialsRoleDto> roles) {
}
