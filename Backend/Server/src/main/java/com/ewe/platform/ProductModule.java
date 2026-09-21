package com.ewe.platform;

/**
 * Optional modules EVYA can switch on or off per vendor (ADR-003). Anything not listed here is core CMS
 * and always available.
 *
 * <p>Defaults reproduce what every vendor saw before per-vendor modules existed, so introducing them
 * changes nothing for existing vendors. New modules start switched off.
 */
public enum ProductModule {

	OCPI("ocpi", "OCPI roaming", false),
	SENSE("sense", "EvyaSense (beta)", false),
	FLEET("fleet", "Fleet management", false),
	LOAD_MANAGEMENT("load_management", "Load management", true),
	REFERRAL_CODES("referral_codes", "Referral codes", true);

	private final String key;
	private final String label;
	private final boolean enabledByDefault;

	ProductModule(String key, String label, boolean enabledByDefault) {
		this.key = key;
		this.label = label;
		this.enabledByDefault = enabledByDefault;
	}

	public String getKey() {
		return key;
	}

	public String getLabel() {
		return label;
	}

	public boolean isEnabledByDefault() {
		return enabledByDefault;
	}

	/** @return the module with this key, or null for an unknown key */
	public static ProductModule fromKey(String key) {
		for (ProductModule module : values()) {
			if (module.key.equals(key)) {
				return module;
			}
		}
		return null;
	}
}
