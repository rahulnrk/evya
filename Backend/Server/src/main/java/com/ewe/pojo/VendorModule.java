package com.ewe.pojo;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.UniqueConstraint;

/**
 * A module EVYA has explicitly switched on or off for one vendor (a white-label org). Modules with no row
 * fall back to their catalogue default ({@link com.ewe.platform.ProductModule}). Who changed it, and when,
 * is kept on the row.
 */
@Entity
@Table(name = "vendor_modules", uniqueConstraints = @UniqueConstraint(columnNames = { "vendorId", "moduleKey" }))
public class VendorModule extends BaseEntity {

	private static final long serialVersionUID = 1L;

	private Long vendorId;
	private String moduleKey;
	private boolean enabled;
	private Long updatedBy;
	private Date updatedAt;

	@Column(name = "vendorId", nullable = false)
	public Long getVendorId() {
		return vendorId;
	}

	public void setVendorId(Long vendorId) {
		this.vendorId = vendorId;
	}

	@Column(name = "moduleKey", nullable = false, length = 40)
	public String getModuleKey() {
		return moduleKey;
	}

	public void setModuleKey(String moduleKey) {
		this.moduleKey = moduleKey;
	}

	@Column(name = "enabled", nullable = false)
	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	@Column(name = "updatedBy")
	public Long getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(Long updatedBy) {
		this.updatedBy = updatedBy;
	}

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "updatedAt")
	public Date getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Date updatedAt) {
		this.updatedAt = updatedAt;
	}
}
