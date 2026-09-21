package com.evya.ocpi.domain;

import jakarta.persistence.*;

/**
 * A module endpoint published by the partner, cached from their version details at handshake time.
 * We call these URLs as given; we never build a partner URL by concatenating onto a base.
 */
@Entity
@Table(name = "ocpi_partner_endpoint",
        uniqueConstraints = @UniqueConstraint(name = "uk_endpoint_module",
                columnNames = {"connection_id", "identifier", "role"}))
public class PartnerEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "connection_id", nullable = false)
    private PartnerConnection connection;

    /** OCPI module identifier, e.g. "locations", "cdrs", "commands". */
    @Column(nullable = false, length = 40)
    private String identifier;

    /** SENDER or RECEIVER, as published by the partner. */
    @Column(nullable = false, length = 10)
    private String role;

    @Column(nullable = false, length = 512)
    private String url;

    public Long getId() { return id; }

    public PartnerConnection getConnection() { return connection; }

    public void setConnection(PartnerConnection v) { this.connection = v; }

    public String getIdentifier() { return identifier; }

    public void setIdentifier(String v) { this.identifier = v; }

    public String getRole() { return role; }

    public void setRole(String v) { this.role = v; }

    public String getUrl() { return url; }

    public void setUrl(String v) { this.url = v; }
}
