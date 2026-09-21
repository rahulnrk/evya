package com.evya.ocpi.domain.repo;

import com.evya.ocpi.domain.ConnectionStatus;
import com.evya.ocpi.domain.PartnerConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import java.util.List;
import java.util.Optional;

public interface PartnerConnectionRepository extends JpaRepository<PartnerConnection, Long> {

    Optional<PartnerConnection> findByTokenCHash(String tokenCHash);

    Optional<PartnerConnection> findByTokenAHash(String tokenAHash);

    List<PartnerConnection> findByPartyId(Long partyId);

    List<PartnerConnection> findByStatus(ConnectionStatus status);

    /**
     * Records liveness by touching one column. Saving the whole entity here would merge a snapshot taken
     * at authentication time over anything a concurrent handshake has written since.
     */
    @Modifying
    @Transactional
    @Query("update PartnerConnection c set c.lastSeenAt = :seenAt where c.id = :id")
    int touchLastSeen(@Param("id") Long id, @Param("seenAt") Instant seenAt);
}
