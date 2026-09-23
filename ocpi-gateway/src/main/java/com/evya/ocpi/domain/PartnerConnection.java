package com.evya.ocpi.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * One roaming connection: our party (a tenant) to one partner party.
 *
 * <p>Token handling follows OCPI's A/B/C model and ADR-002:
 * <ul>
 *   <li><b>Token A</b> - we mint it and hand it over out of band. It authenticates the partner only
 *       until they complete the handshake, then it is destroyed.</li>
 *   <li><b>Token B</b> - theirs. We must replay it to call them, so it is stored encrypted, not
 *       hashed.</li>
 *   <li><b>Token C</b> - we mint it at the end of the handshake and the partner uses it from then on.
 *       Stored hashed for indexed lookup <i>and</i> encrypted so GET /credentials stays conformant.
 *       A database leak alone does not yield a usable token.</li>
 * </ul>
 * Raw token values never appear in logs, exceptions or any response but the one handover reply.
 */
@Entity
@Table(name = "ocpi_partner_connection",
        uniqueConstraints = @UniqueConstraint(name = "uk_connection_parties",
                columnNames = {"party_id_fk", "partner_country_code", "partner_party_id"}),
        indexes = {
                @Index(name = "idx_connection_token_c", columnList = "token_c_hash"),
                @Index(name = "idx_connection_token_a", columnList = "token_a_hash")
        })
public class PartnerConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Optimistic lock. The handshake writes a snapshot loaded before its outbound call to the partner;
     * without a version, two concurrent handshakes (or a rotation racing an unregister) would both
     * "succeed" and the last write would silently win.
     */
    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "party_id_fk", nullable = false)
    private OcpiParty party;

    @Column(name = "partner_country_code", length = 2)
    private String partnerCountryCode;

    @Column(name = "partner_party_id", length = 3)
    private String partnerPartyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "partner_role", length = 8)
    private OcpiRole partnerRole;

    @Column(name = "partner_business_name", length = 100)
    private String partnerBusinessName;

    @Column(name = "partner_versions_url", length = 512)
    private String partnerVersionsUrl;

    @Column(name = "agreed_version", length = 8)
    private String agreedVersion;

    @Column(name = "token_a_hash", length = 64, unique = true)
    private String tokenAHash;

    @Column(name = "token_c_hash", length = 64, unique = true)
    private String tokenCHash;

    @Column(name = "token_c_enc", length = 1024)
    private String tokenCEncrypted;

    @Column(name = "partner_token_enc", length = 1024)
    private String partnerTokenEncrypted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ConnectionStatus status = ConnectionStatus.PENDING;

    /**
     * Which side began the handshake. Existing rows are invitations (we issued Token A).
     *
     * <p>columnDefinition carries a SQL default so that {@code ddl-auto=update} adding this NOT NULL
     * column to a table that already has rows (from the invite flow) succeeds on MySQL's strict mode;
     * the Java default alone is invisible to schema generation.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8, columnDefinition = "varchar(8) default 'INBOUND'")
    private ConnectionDirection direction = ConnectionDirection.INBOUND;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "registered_at")
    private Instant registeredAt;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    /** True once the partner may call protected modules. */
    public boolean isUsable() {
        return status == ConnectionStatus.REGISTERED && party != null && party.isActive();
    }

    /** Destroys every credential on this connection (DELETE /credentials, suspension). */
    public void wipeTokens() {
        this.tokenAHash = null;
        this.tokenCHash = null;
        this.tokenCEncrypted = null;
        this.partnerTokenEncrypted = null;
    }

    public Long getId() { return id; }

    public OcpiParty getParty() { return party; }

    public void setParty(OcpiParty party) { this.party = party; }

    public String getPartnerCountryCode() { return partnerCountryCode; }

    public void setPartnerCountryCode(String v) { this.partnerCountryCode = v; }

    public String getPartnerPartyId() { return partnerPartyId; }

    public void setPartnerPartyId(String v) { this.partnerPartyId = v; }

    public OcpiRole getPartnerRole() { return partnerRole; }

    public void setPartnerRole(OcpiRole v) { this.partnerRole = v; }

    public String getPartnerBusinessName() { return partnerBusinessName; }

    public void setPartnerBusinessName(String v) { this.partnerBusinessName = v; }

    public String getPartnerVersionsUrl() { return partnerVersionsUrl; }

    public void setPartnerVersionsUrl(String v) { this.partnerVersionsUrl = v; }

    public String getAgreedVersion() { return agreedVersion; }

    public void setAgreedVersion(String v) { this.agreedVersion = v; }

    public String getTokenAHash() { return tokenAHash; }

    public void setTokenAHash(String v) { this.tokenAHash = v; }

    public String getTokenCHash() { return tokenCHash; }

    public void setTokenCHash(String v) { this.tokenCHash = v; }

    public String getTokenCEncrypted() { return tokenCEncrypted; }

    public void setTokenCEncrypted(String v) { this.tokenCEncrypted = v; }

    public String getPartnerTokenEncrypted() { return partnerTokenEncrypted; }

    public void setPartnerTokenEncrypted(String v) { this.partnerTokenEncrypted = v; }

    public ConnectionStatus getStatus() { return status; }

    public void setStatus(ConnectionStatus v) { this.status = v; }

    public ConnectionDirection getDirection() { return direction; }

    public void setDirection(ConnectionDirection v) { this.direction = v; }

    public Instant getCreatedAt() { return createdAt; }

    public void setCreatedAt(Instant v) { this.createdAt = v; }

    public Instant getRegisteredAt() { return registeredAt; }

    public void setRegisteredAt(Instant v) { this.registeredAt = v; }

    public Instant getLastSeenAt() { return lastSeenAt; }

    public void setLastSeenAt(Instant v) { this.lastSeenAt = v; }
}
