package com.evya.ocpi.domain.repo;

import com.evya.ocpi.domain.OcpiParty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OcpiPartyRepository extends JpaRepository<OcpiParty, Long> {

    Optional<OcpiParty> findByCountryCodeAndPartyId(String countryCode, String partyId);

    List<OcpiParty> findByTenantId(Long tenantId);
}
