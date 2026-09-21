package com.ewe.platform;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ewe.dao.GeneralDao;
import com.ewe.exception.UserNotFoundException;
import com.ewe.pojo.VendorModule;

/**
 * Per-vendor product (ADR-003): which optional modules each vendor has, and which vendor a portal user
 * belongs to.
 *
 * <p>Persistence goes through {@link GeneralDao} (the backend's native Hibernate session) with bound
 * parameters only. The vendor is resolved from the link tables, never from {@code Users.orgId}, which is
 * set from a form field and does not reliably identify the vendor.
 */
@Service
public class VendorModuleService {

	private static final Logger log = LoggerFactory.getLogger(VendorModuleService.class);

	private static final String MODULES_OF_VENDOR = "SELECT * FROM vendor_modules WHERE vendorId = :vendorId";
	private static final String MODULE_OF_VENDOR =
			"SELECT * FROM vendor_modules WHERE vendorId = :vendorId AND moduleKey = :moduleKey";
	private static final String VENDOR_OF_VENDOR_ADMIN =
			"SELECT wl_org_id AS vendorId FROM users_in_whitelabels WHERE user_id = :userId";
	private static final String VENDOR_OF_FRANCHISE_OWNER =
			"SELECT o.whitelabelId AS vendorId FROM users_in_owners u JOIN owner_orgs o ON o.id = u.owner_org_id "
					+ "WHERE u.user_id = :userId";
	private static final String VENDOR_EXISTS = "SELECT id FROM white_lable_orgs WHERE id = :vendorId";

	private final GeneralDao generalDao;
	private final int adminRoleId;
	private final int vendorAdminRoleId;
	private final int franchiseOwnerRoleId;

	public VendorModuleService(GeneralDao generalDao,
			@Value("${platform.roles.admin:1}") int adminRoleId,
			@Value("${platform.roles.vendor-admin:3}") int vendorAdminRoleId,
			@Value("${platform.roles.franchise-owner:4}") int franchiseOwnerRoleId) {
		this.generalDao = generalDao;
		this.adminRoleId = adminRoleId;
		this.vendorAdminRoleId = vendorAdminRoleId;
		this.franchiseOwnerRoleId = franchiseOwnerRoleId;
	}

	/** Every catalogue module for a vendor: the stored choice if there is one, else the module default. */
	@Transactional(readOnly = true)
	public Map<ProductModule, Boolean> effectiveModules(Long vendorId) {
		Map<ProductModule, Boolean> state = new EnumMap<ProductModule, Boolean>(ProductModule.class);
		for (ProductModule module : ProductModule.values()) {
			state.put(module, module.isEnabledByDefault());
		}
		if (vendorId != null) {
			for (VendorModule row : rows(MODULES_OF_VENDOR, params("vendorId", vendorId))) {
				ProductModule module = ProductModule.fromKey(row.getModuleKey());
				if (module != null) {
					state.put(module, row.isEnabled());
				}
			}
		}
		return state;
	}

	/** Modules a user may use: every module for the platform admin, the vendor's enabled ones otherwise. */
	@Transactional(readOnly = true)
	public List<String> modulesFor(Integer roleId, Long vendorId) {
		List<String> keys = new ArrayList<String>();
		if (roleId != null && roleId.intValue() == adminRoleId) {
			for (ProductModule module : ProductModule.values()) {
				keys.add(module.getKey());
			}
			return keys;
		}
		if (vendorId == null) {
			return Collections.emptyList();
		}
		for (Map.Entry<ProductModule, Boolean> entry : effectiveModules(vendorId).entrySet()) {
			if (Boolean.TRUE.equals(entry.getValue())) {
				keys.add(entry.getKey().getKey());
			}
		}
		return keys;
	}

	/**
	 * The vendor a portal user belongs to, or null (platform admin, employee, driver, or no link). A query
	 * failure resolves to null: the user signs in with no vendor modules rather than being locked out.
	 */
	@Transactional(readOnly = true)
	public Long resolveVendorId(Long userId, Integer roleId) {
		if (userId == null || roleId == null) {
			return null;
		}
		String sql;
		if (roleId.intValue() == vendorAdminRoleId) {
			sql = VENDOR_OF_VENDOR_ADMIN;
		} else if (roleId.intValue() == franchiseOwnerRoleId) {
			sql = VENDOR_OF_FRANCHISE_OWNER;
		} else {
			return null;
		}
		try {
			List<Map<String, Object>> found = generalDao.getMapDataWithParam(sql, params("userId", userId));
			if (found == null || found.isEmpty()) {
				return null;
			}
			Object vendorId = found.get(0).get("vendorId");
			return vendorId instanceof Number ? Long.valueOf(((Number) vendorId).longValue()) : null;
		} catch (RuntimeException e) {
			log.warn("Could not resolve the vendor of user {} (role {}); signing in without vendor modules",
					userId, roleId, e);
			return null;
		}
	}

	@Transactional(readOnly = true)
	public boolean vendorExists(Long vendorId) {
		if (vendorId == null) {
			return false;
		}
		List<Map<String, Object>> found = generalDao.getMapDataWithParam(VENDOR_EXISTS, params("vendorId", vendorId));
		return found != null && !found.isEmpty();
	}

	/** Switches a module on or off for a vendor, recording who did it and when. */
	@Transactional
	public void setModule(Long vendorId, ProductModule module, boolean enabled, Long actorUserId) {
		Map<String, Object> key = params("vendorId", vendorId);
		key.put("moduleKey", module.getKey());
		List<VendorModule> existing = rows(MODULE_OF_VENDOR, key);

		VendorModule row = existing.isEmpty() ? new VendorModule() : existing.get(0);
		row.setVendorId(vendorId);
		row.setModuleKey(module.getKey());
		row.setEnabled(enabled);
		row.setUpdatedBy(actorUserId);
		row.setUpdatedAt(new Date());
		try {
			generalDao.savOrupdate(row);
		} catch (UserNotFoundException e) {
			throw new IllegalStateException("Could not save module " + module.getKey() + " for vendor " + vendorId, e);
		}
		log.info("Module {} switched {} for vendor {} by user {}", module.getKey(), enabled ? "on" : "off",
				vendorId, actorUserId);
	}

	private List<VendorModule> rows(String sql, Map<String, Object> params) {
		try {
			List<VendorModule> found = generalDao.findAllSQLQuery(new VendorModule(), sql, params);
			return found == null ? Collections.<VendorModule>emptyList() : found;
		} catch (UserNotFoundException e) {
			// Declared by GeneralDao but never thrown by its implementation; an absent row means "nothing stored".
			return Collections.emptyList();
		}
	}

	private static Map<String, Object> params(String name, Object value) {
		Map<String, Object> params = new HashMap<String, Object>();
		params.put(name, value);
		return params;
	}
}
