package com.ewe.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ewe.dao.GeneralDao;
import com.ewe.pojo.VendorModule;

/** ADR-003: onboarding a vendor onto a plan in one flow, seeding its module defaults. */
class VendorOnboardingTest {

	private GeneralDao dao;
	private VendorModuleService service;

	@BeforeEach
	void setUp() {
		dao = mock(GeneralDao.class);
		service = new VendorModuleService(dao, 1, 3, 4);
	}

	// No module has an explicit row yet.
	private void noExistingRows() throws Exception {
		when(dao.getMapDataWithParam(anyString(), anyMap())).thenReturn(Collections.<Map<String, Object>>emptyList());
		when(dao.findAllSQLQuery(any(VendorModule.class), anyString(), anyMap()))
				.thenReturn(Collections.<VendorModule>emptyList());
	}

	@Test
	void standardPlanSeedsCatalogueDefaultsForEveryModule() throws Exception {
		noExistingRows();

		service.onboard(7L, VendorPlan.STANDARD, 99L);

		// One row written per catalogue module, each at its default.
		org.mockito.ArgumentCaptor<VendorModule> saved = org.mockito.ArgumentCaptor.forClass(VendorModule.class);
		verify(dao, org.mockito.Mockito.times(ProductModule.values().length)).savOrupdate(saved.capture());
		for (VendorModule row : saved.getAllValues()) {
			ProductModule module = ProductModule.fromKey(row.getModuleKey());
			assertEquals(module.isEnabledByDefault(), row.isEnabled(),
					module.getKey() + " should be seeded at its default");
			assertEquals(Long.valueOf(99L), row.getUpdatedBy());
		}
	}

	@Test
	void roamingPlanTurnsOcpiOn() throws Exception {
		noExistingRows();

		service.onboard(7L, VendorPlan.ROAMING, 99L);

		org.mockito.ArgumentCaptor<VendorModule> saved = org.mockito.ArgumentCaptor.forClass(VendorModule.class);
		verify(dao, org.mockito.Mockito.atLeastOnce()).savOrupdate(saved.capture());
		VendorModule ocpi = saved.getAllValues().stream()
				.filter(r -> "ocpi".equals(r.getModuleKey())).findFirst().orElseThrow();
		assertTrue(ocpi.isEnabled(), "ROAMING enables OCPI");
	}

	@Test
	void onboardingDoesNotOverturnAnExistingChoiceForUnnamedModules() throws Exception {
		// The operator already turned load_management OFF (against its default). A STANDARD re-run must
		// not touch it, because the plan does not name it and a row already exists.
		when(dao.getMapDataWithParam(anyString(), anyMap()))
				.thenReturn(Arrays.asList(Collections.<String, Object>singletonMap("moduleKey", "load_management")));
		when(dao.findAllSQLQuery(any(VendorModule.class), anyString(), anyMap()))
				.thenReturn(Collections.<VendorModule>emptyList());

		service.onboard(7L, VendorPlan.STANDARD, 99L);

		org.mockito.ArgumentCaptor<VendorModule> saved = org.mockito.ArgumentCaptor.forClass(VendorModule.class);
		verify(dao, org.mockito.Mockito.atLeastOnce()).savOrupdate(saved.capture());
		assertFalse(saved.getAllValues().stream().anyMatch(r -> "load_management".equals(r.getModuleKey())),
				"an unnamed module that already has a row is left alone");
	}

	@Test
	void aPlanReassertsItsNamedModulesEvenWhenARowExists() throws Exception {
		// OCPI was turned off; onboarding onto ROAMING must turn it back on (the plan names it).
		when(dao.getMapDataWithParam(anyString(), anyMap()))
				.thenReturn(Arrays.asList(Collections.<String, Object>singletonMap("moduleKey", "ocpi")));
		when(dao.findAllSQLQuery(any(VendorModule.class), anyString(), anyMap()))
				.thenReturn(Collections.<VendorModule>emptyList());

		service.onboard(7L, VendorPlan.ROAMING, 99L);

		org.mockito.ArgumentCaptor<VendorModule> saved = org.mockito.ArgumentCaptor.forClass(VendorModule.class);
		verify(dao, org.mockito.Mockito.atLeastOnce()).savOrupdate(saved.capture());
		VendorModule ocpi = saved.getAllValues().stream()
				.filter(r -> "ocpi".equals(r.getModuleKey())).findFirst().orElseThrow();
		assertTrue(ocpi.isEnabled());
	}

	@Test
	void planKeyParsingIsForgiving() {
		assertEquals(VendorPlan.STANDARD, VendorPlan.fromKey(null));
		assertEquals(VendorPlan.STANDARD, VendorPlan.fromKey(""));
		assertEquals(VendorPlan.ROAMING, VendorPlan.fromKey("roaming"));
		assertEquals(VendorPlan.FULL, VendorPlan.fromKey(" FULL "));
		org.junit.jupiter.api.Assertions.assertNull(VendorPlan.fromKey("platinum"));
	}
}
