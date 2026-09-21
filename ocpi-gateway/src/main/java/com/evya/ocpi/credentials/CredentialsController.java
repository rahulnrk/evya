package com.evya.ocpi.credentials;

import com.evya.ocpi.api.OcpiResponse;
import com.evya.ocpi.security.OcpiCallerContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * OCPI credentials module. Unlike the stub this replaces, every method here is authenticated: the
 * filter has already resolved the caller from Token A or Token C before anything below runs.
 */
@RestController
@RequestMapping("/ocpi/2.2.1/credentials")
public class CredentialsController {

    private final CredentialsService credentials;

    public CredentialsController(CredentialsService credentials) {
        this.credentials = credentials;
    }

    @GetMapping
    public OcpiResponse<CredentialsDto> get() {
        return OcpiResponse.success(credentials.ourCredentials(OcpiCallerContext.current()));
    }

    @PostMapping
    public OcpiResponse<CredentialsDto> register(@Valid @RequestBody CredentialsDto request) {
        return OcpiResponse.success(credentials.register(OcpiCallerContext.current(), request));
    }

    @PutMapping
    public OcpiResponse<CredentialsDto> update(@Valid @RequestBody CredentialsDto request) {
        return OcpiResponse.success(credentials.update(OcpiCallerContext.current(), request));
    }

    @DeleteMapping
    public OcpiResponse<Void> unregister() {
        credentials.unregister(OcpiCallerContext.current());
        return OcpiResponse.success(null);
    }
}
