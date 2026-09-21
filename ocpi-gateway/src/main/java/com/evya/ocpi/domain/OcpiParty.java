package com.evya.ocpi.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * One EVYA tenant's identity on the roaming network (ADR-002 D2: a party per tenant).
 *
 * <p>The tenant behind a party is the isolation boundary: every module query must be scoped by
 * {@link #getTenantId()}, never by the requesting partner alone.
 */
@Entity
@Table(name = "ocpi_party",
        uniqueConstraints = @UniqueConstraint(name = "uk_party_identity",
                columnNames = {"country_code", "party_id"}))
public class OcpiParty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** EVYA tenant this party belongs to (owner_orgs.id). Never null: an orphan party is a leak. */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /** ISO 3166-1 alpha-2, e.g. "IN". */
    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    /** Three characters assigned by the national registry, e.g. "EVY". */
    @Column(name = "party_id", nullable = false, length = 3)
    private String partyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private OcpiRole role;

    @Column(name = "business_name", nullable = false, length = 100)
    private String businessName;

    @Column(name = "business_website", length = 255)
    private String businessWebsite;

    @Column(name = "business_logo_url", length = 255)
    private String businessLogoUrl;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getPartyId() {
        return partyId;
    }

    public void setPartyId(String partyId) {
        this.partyId = partyId;
    }

    public OcpiRole getRole() {
        return role;
    }

    public void setRole(OcpiRole role) {
        this.role = role;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getBusinessWebsite() {
        return businessWebsite;
    }

    public void setBusinessWebsite(String businessWebsite) {
        this.businessWebsite = businessWebsite;
    }

    public String getBusinessLogoUrl() {
        return businessLogoUrl;
    }

    public void setBusinessLogoUrl(String businessLogoUrl) {
        this.businessLogoUrl = businessLogoUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
