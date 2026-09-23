package com.ewe.platform;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/**
 * A named bundle of modules EVYA can onboard a vendor onto in one step (ADR-003). A plan sets its listed
 * modules on and every other optional module to its catalogue default, so onboarding is explicit and
 * repeatable. {@code STANDARD} is just the catalogue defaults.
 */
public enum VendorPlan {

    STANDARD(EnumSet.noneOf(ProductModule.class)),
    ROAMING(EnumSet.of(ProductModule.OCPI)),
    FULL(EnumSet.allOf(ProductModule.class));

    private final Set<ProductModule> enabled;

    VendorPlan(Set<ProductModule> enabled) {
        this.enabled = enabled;
    }

    /** True if this plan turns the module on; modules a plan does not name keep their catalogue default. */
    public boolean enables(ProductModule module) {
        return enabled.contains(module) || (this == STANDARD && module.isEnabledByDefault());
    }

    public Set<ProductModule> enabledModules() {
        return Collections.unmodifiableSet(enabled);
    }

    public static VendorPlan fromKey(String key) {
        if (key == null || key.isBlank()) {
            return STANDARD;
        }
        try {
            return VendorPlan.valueOf(key.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
