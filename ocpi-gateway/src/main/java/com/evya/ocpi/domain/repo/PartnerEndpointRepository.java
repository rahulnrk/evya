package com.evya.ocpi.domain.repo;

import com.evya.ocpi.domain.PartnerConnection;
import com.evya.ocpi.domain.PartnerEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartnerEndpointRepository extends JpaRepository<PartnerEndpoint, Long> {

    List<PartnerEndpoint> findByConnection(PartnerConnection connection);

    void deleteByConnection(PartnerConnection connection);
}
