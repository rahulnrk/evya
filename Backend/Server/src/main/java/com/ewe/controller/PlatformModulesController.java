package com.ewe.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ewe.platform.ModuleState;
import com.ewe.platform.ModuleToggle;
import com.ewe.platform.ProductModule;
import com.ewe.platform.VendorPlan;
import com.ewe.platform.VendorModuleService;

/**
 * Per-vendor product (ADR-003). {@code /services/platform/**} is restricted to the platform admin in
 * WebSecurityConfig; {@code /services/me/modules} is open to any signed-in portal user.
 */
@RestController
@RequestMapping("/services")
public class PlatformModulesController {

	private final VendorModuleService vendorModules;

	public PlatformModulesController(VendorModuleService vendorModules) {
		this.vendorModules = vendorModules;
	}

	/** The optional modules EVYA sells, with their defaults. */
	@GetMapping("/platform/modules")
	public List<ModuleState> catalogue() {
		List<ModuleState> catalogue = new ArrayList<ModuleState>();
		for (ProductModule module : ProductModule.values()) {
			catalogue.add(new ModuleState(module, module.isEnabledByDefault()));
		}
		return catalogue;
	}

	@GetMapping("/platform/vendors/{vendorId}/modules")
	public ResponseEntity<List<ModuleState>> vendorModules(@PathVariable Long vendorId) {
		if (!vendorModules.vendorExists(vendorId)) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(stateOf(vendorId));
	}

	@PutMapping("/platform/vendors/{vendorId}/modules/{moduleKey}")
	public ResponseEntity<?> setModule(@PathVariable Long vendorId, @PathVariable String moduleKey,
			@RequestBody(required = false) ModuleToggle toggle, Authentication authentication) {

		ProductModule module = ProductModule.fromKey(moduleKey);
		if (module == null) {
			return ResponseEntity.badRequest().body(message("Unknown module: " + moduleKey));
		}
		if (toggle == null || toggle.getEnabled() == null) {
			return ResponseEntity.badRequest().body(message("Body must be {\"enabled\": true} or {\"enabled\": false}"));
		}
		if (!vendorModules.vendorExists(vendorId)) {
			return ResponseEntity.notFound().build();
		}
		vendorModules.setModule(vendorId, module, toggle.getEnabled().booleanValue(), userIdOf(authentication));
		return ResponseEntity.ok(stateOf(vendorId));
	}

	/**
	 * The signed-in user's vendor and modules, read from the database so a change shows in the portal
	 * without signing in again. Services that trust the token see it at the next sign-in.
	 */
	/**
	 * Onboards a vendor onto a plan in one call (ADR-003): STANDARD (catalogue defaults), ROAMING (adds
	 * OCPI), or FULL. Platform admin only. The OCPI party stays self-service — the vendor sets its own
	 * network identity in the OCPI tab.
	 */
	@PostMapping("/platform/vendors/{vendorId}/onboard")
	public ResponseEntity<?> onboard(@PathVariable Long vendorId,
			@RequestParam(name = "plan", required = false) String planKey, Authentication authentication) {
		if (!vendorModules.vendorExists(vendorId)) {
			return ResponseEntity.notFound().build();
		}
		VendorPlan plan = VendorPlan.fromKey(planKey);
		if (plan == null) {
			return ResponseEntity.badRequest().body(message("Unknown plan: " + planKey));
		}
		vendorModules.onboard(vendorId, plan, userIdOf(authentication));
		return ResponseEntity.ok(stateOf(vendorId));
	}

	@GetMapping("/me/modules")
	public Map<String, Object> myModules(Authentication authentication) {
		Integer roleId = roleIdOf(authentication);
		Long vendorId = vendorModules.resolveVendorId(userIdOf(authentication), roleId);
		Map<String, Object> body = new LinkedHashMap<String, Object>();
		body.put("vendorId", vendorId);
		body.put("modules", vendorModules.modulesFor(roleId, vendorId));
		return body;
	}

	private List<ModuleState> stateOf(Long vendorId) {
		List<ModuleState> state = new ArrayList<ModuleState>();
		for (Map.Entry<ProductModule, Boolean> entry : vendorModules.effectiveModules(vendorId).entrySet()) {
			state.add(new ModuleState(entry.getKey(), Boolean.TRUE.equals(entry.getValue())));
		}
		return state;
	}

	private static Long userIdOf(Authentication authentication) {
		Object principal = authentication == null ? null : authentication.getPrincipal();
		return principal instanceof Long ? (Long) principal : null;
	}

	/** The numeric role from the ROLE_<id> authority that JwtAuthenticationFilter grants. */
	private static Integer roleIdOf(Authentication authentication) {
		if (authentication == null) {
			return null;
		}
		for (GrantedAuthority authority : authentication.getAuthorities()) {
			String name = authority.getAuthority();
			if (name.startsWith("ROLE_") && name.length() > 5 && Character.isDigit(name.charAt(5))) {
				return Integer.valueOf(name.substring(5));
			}
		}
		return null;
	}

	private static Map<String, String> message(String text) {
		return Collections.singletonMap("message", text);
	}
}
