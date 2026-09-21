package com.ewe.platform;

/** One module's state for a vendor, as the portal shows it. */
public class ModuleState {

	private final String key;
	private final String label;
	private final boolean enabled;
	private final boolean enabledByDefault;

	public ModuleState(ProductModule module, boolean enabled) {
		this.key = module.getKey();
		this.label = module.getLabel();
		this.enabled = enabled;
		this.enabledByDefault = module.isEnabledByDefault();
	}

	public String getKey() {
		return key;
	}

	public String getLabel() {
		return label;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public boolean isEnabledByDefault() {
		return enabledByDefault;
	}
}
