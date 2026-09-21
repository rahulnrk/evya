package com.evya.ocpi.domain.repo;

import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.PartnerConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartnerConnectionRepository extends JpaRepository<PartnerConnection, Long> {

    Optional<PartnerConnection> findByTokenCHash(String tokenCHash);

    Optional<PartnerConnection> findByTokenAHash(String tokenAHash);

    List<PartnerConnection> findByPartyId(Long partyId);

    List<PartnerConnection> findByStatus(ConnectionStatus status);
}
