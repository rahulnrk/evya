package com.ewe.platform;

/** Request body for switching a module: {"enabled": true|false}. */
public class ModuleToggle {

	private Boolean enabled;

	public Boolean getEnabled() {
		return enabled;
	}

	public void setEnabled(Boolean enabled) {
		this.enabled = enabled;
	}
}
