package com.ewe.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.hibernate.exception.GenericJDBCException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.ewe.dao.GeneralDao;
import com.ewe.pojo.VendorModule;

/** ADR-003: per-vendor modules and vendor resolution. */
class VendorModuleServiceTest {

	private GeneralDao dao;
	private VendorModuleService service;

	@BeforeEach
	void setUp() {
		dao = mock(GeneralDao.class);
		service = new VendorModuleService(dao, 1, 3, 4);
	}

	private static VendorModule row(String key, boolean enabled) {
		VendorModule row = new VendorModule();
		row.setVendorId(7L);
		row.setModuleKey(key);
		row.setEnabled(enabled);
		return row;
	}

	private void stored(VendorModule... rows) throws Exception {
		when(dao.findAllSQLQuery(any(VendorModule.class), anyString(), anyMap())).thenReturn(Arrays.asList(rows));
	}

	private static Map<String, Object> vendorRow(long vendorId) {
		return Collections.<String, Object>singletonMap("vendorId", java.math.BigDecimal.valueOf(vendorId));
	}

	@Test
	void defaultsReproduceTodaysProductForExistingVendors() throws Exception {
		stored();

		Map<ProductModule, Boolean> state = service.effectiveModules(7L);

		assertFalse(state.get(ProductModule.OCPI));
		assertFalse(state.get(ProductModule.SENSE));
		assertFalse(state.get(ProductModule.FLEET));
		assertTrue(state.get(ProductModule.LOAD_MANAGEMENT));
		assertTrue(state.get(ProductModule.REFERRAL_CODES));
	}

	@Test
	void storedChoicesOverrideDefaultsAndRetiredKeysAreIgnored() throws Exception {
		stored(row("ocpi", true), row("referral_codes", false), row("retired_module", true));

		Map<ProductModule, Boolean> state = service.effectiveModules(7L);

		assertTrue(state.get(ProductModule.OCPI));
		assertFalse(state.get(ProductModule.REFERRAL_CODES));
		assertEquals(ProductModule.values().length, state.size());
	}

	@Test
	void theVendorIsQueriedWithABoundParameter() throws Exception {
		stored();

		service.effectiveModules(7L);

		@SuppressWarnings("unchecked")
		ArgumentCaptor<Map<String, Object>> params = ArgumentCaptor.forClass(Map.class);
		ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
		verify(dao).findAllSQLQuery(any(VendorModule.class), sql.capture(), params.capture());
		assertTrue(sql.getValue().contains(":vendorId"));
		assertEquals(7L, params.getValue().get("vendorId"));
	}

	@Test
	void platformAdminGetsEveryModule() {
		List<String> modules = service.modulesFor(1, null);

		assertEquals(ProductModule.values().length, modules.size());
		assertTrue(modules.contains("ocpi"));
		verifyNoInteractions(dao);
	}

	@Test
	void vendorUsersGetTheirVendorsEnabledModules() throws Exception {
		stored(row("ocpi", true));

		assertEquals(Arrays.asList("ocpi", "load_management", "referral_codes"), service.modulesFor(3, 7L));
	}

	@Test
	void userWithoutAVendorGetsNoModules() {
		assertTrue(service.modulesFor(3, null).isEmpty());
		assertTrue(service.modulesFor(null, null).isEmpty());
	}

	@Test
	void vendorAdminIsResolvedThroughTheWhiteLabelLink() {
		when(dao.getMapDataWithParam(anyString(), anyMap())).thenReturn(Arrays.asList(vendorRow(7L)));

		assertEquals(Long.valueOf(7L), service.resolveVendorId(99L, 3));

		ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
		@SuppressWarnings("unchecked")
		ArgumentCaptor<Map<String, Object>> params = ArgumentCaptor.forClass(Map.class);
		verify(dao).getMapDataWithParam(sql.capture(), params.capture());
		assertTrue(sql.getValue().contains("users_in_whitelabels"));
		assertFalse(sql.getValue().contains("99"), "the user id must be bound, never concatenated");
		assertEquals(99L, params.getValue().get("userId"));
	}

	@Test
	void franchiseOwnerIsResolvedThroughTheirOwnerOrg() {
		when(dao.getMapDataWithParam(anyString(), anyMap())).thenReturn(Arrays.asList(vendorRow(7L)));

		assertEquals(Long.valueOf(7L), service.resolveVendorId(55L, 4));

		ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
		verify(dao).getMapDataWithParam(sql.capture(), anyMap());
		assertTrue(sql.getValue().contains("owner_orgs"));
		assertTrue(sql.getValue().contains("whitelabelId"));
	}

	@Test
	void otherRolesAndUnlinkedUsersHaveNoVendor() {
		assertNull(service.resolveVendorId(99L, 1));
		assertNull(service.resolveVendorId(99L, 6));
		assertNull(service.resolveVendorId(null, 3));
		verifyNoInteractions(dao);

		when(dao.getMapDataWithParam(anyString(), anyMap())).thenReturn(Collections.<Map<String, Object>>emptyList());
		assertNull(service.resolveVendorId(99L, 3));
	}

	@Test
	void aQueryFailureSignsTheUserInWithoutVendorModules() {
		when(dao.getMapDataWithParam(anyString(), anyMap()))
				.thenThrow(new GenericJDBCException("query failed", new java.sql.SQLException("boom")));

		assertNull(service.resolveVendorId(99L, 3));
	}

	@Test
	void switchingAModuleRecordsWhoAndWhen() throws Exception {
		stored();

		service.setModule(7L, ProductModule.OCPI, true, 99L);

		ArgumentCaptor<VendorModule> saved = ArgumentCaptor.forClass(VendorModule.class);
		verify(dao).savOrupdate(saved.capture());
		assertEquals(Long.valueOf(7L), saved.getValue().getVendorId());
		assertEquals("ocpi", saved.getValue().getModuleKey());
		assertTrue(saved.getValue().isEnabled());
		assertEquals(Long.valueOf(99L), saved.getValue().getUpdatedBy());
		assertNotNull(saved.getValue().getUpdatedAt());
	}

	@Test
	void switchingAgainUpdatesTheSameRow() throws Exception {
		VendorModule existing = row("ocpi", true);
		stored(existing);

		service.setModule(7L, ProductModule.OCPI, false, 42L);

		ArgumentCaptor<VendorModule> saved = ArgumentCaptor.forClass(VendorModule.class);
		verify(dao).savOrupdate(saved.capture());
		assertSame(existing, saved.getValue());
		assertFalse(saved.getValue().isEnabled());
		assertEquals(Long.valueOf(42L), saved.getValue().getUpdatedBy());
	}

	@Test
	void anUnknownVendorDoesNotExist() {
		when(dao.getMapDataWithParam(anyString(), anyMap())).thenReturn(Collections.<Map<String, Object>>emptyList());

		assertFalse(service.vendorExists(404L));
		assertFalse(service.vendorExists(null));
	}
}
