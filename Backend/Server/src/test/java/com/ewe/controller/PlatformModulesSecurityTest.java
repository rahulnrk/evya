package com.ewe.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.ewe.config.WebSecurityConfig;
import com.ewe.platform.ProductModule;
import com.ewe.platform.VendorModuleService;
import com.ewe.platform.VendorPlan;
import com.ewe.security.JwtAuthenticationFilter;
import com.ewe.security.JwtTokenProvider;

/**
 * ADR-003: only the platform admin manages vendor modules. Tokens are minted by the real
 * JwtTokenProvider, so the filter, the ROLE_<id> mapping and the URL rule are all exercised.
 */
// The application class declares @ComponentScan("com.ewe"), which defeats slice filtering and drags in the
// database layer; an explicit context keeps this test to the controller and the real security chain.
@WebMvcTest
@ContextConfiguration(classes = { PlatformModulesController.class, WebSecurityConfig.class,
		JwtAuthenticationFilter.class, JwtTokenProvider.class })
@TestPropertySource(properties = "jwt.secret=unit-test-jwt-secret-value-at-least-32-chars-long!!")
class PlatformModulesSecurityTest {

	private static final long ADMIN_USER = 99L;
	private static final long VENDOR_USER = 55L;

	@Autowired
	private MockMvc mockMvc;
	@Autowired
	private JwtTokenProvider tokens;
	@MockBean
	private VendorModuleService vendorModules;

	@BeforeEach
	void setUp() {
		Map<ProductModule, Boolean> state = new EnumMap<ProductModule, Boolean>(ProductModule.class);
		for (ProductModule module : ProductModule.values()) {
			state.put(module, module == ProductModule.OCPI);
		}
		when(vendorModules.vendorExists(7L)).thenReturn(true);
		when(vendorModules.effectiveModules(7L)).thenReturn(state);
	}

	private String bearer(long userId, int roleId) {
		return "Bearer " + tokens.createAccessToken(userId, roleId, null, "USER");
	}

	@Test
	void anonymousRequestsAreRefused() throws Exception {
		mockMvc.perform(get("/services/platform/modules")).andExpect(status().isUnauthorized());
	}

	@Test
	void vendorAdminsCannotManageModules() throws Exception {
		mockMvc.perform(get("/services/platform/modules").header("Authorization", bearer(VENDOR_USER, 3)))
				.andExpect(status().isForbidden());
		mockMvc.perform(put("/services/platform/vendors/7/modules/ocpi")
						.header("Authorization", bearer(VENDOR_USER, 3))
						.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
				.andExpect(status().isForbidden());
		verify(vendorModules, never()).setModule(anyLong(), eq(ProductModule.OCPI), anyBoolean(), anyLong());
	}

	@Test
	void platformAdminReadsTheCatalogueAndAVendorsModules() throws Exception {
		mockMvc.perform(get("/services/platform/modules").header("Authorization", bearer(ADMIN_USER, 1)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].key", hasItem("ocpi")));
		mockMvc.perform(get("/services/platform/vendors/7/modules").header("Authorization", bearer(ADMIN_USER, 1)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].key").value("ocpi"))
				.andExpect(jsonPath("$[0].enabled").value(true));
	}

	@Test
	void platformAdminSwitchesAModuleAndIsRecordedAsTheActor() throws Exception {
		mockMvc.perform(put("/services/platform/vendors/7/modules/ocpi")
						.header("Authorization", bearer(ADMIN_USER, 1))
						.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
				.andExpect(status().isOk());

		verify(vendorModules).setModule(7L, ProductModule.OCPI, true, ADMIN_USER);
	}

	@Test
	void badRequestsAreRejected() throws Exception {
		mockMvc.perform(put("/services/platform/vendors/7/modules/teleport")
						.header("Authorization", bearer(ADMIN_USER, 1))
						.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(put("/services/platform/vendors/7/modules/ocpi")
						.header("Authorization", bearer(ADMIN_USER, 1))
						.contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(put("/services/platform/vendors/404/modules/ocpi")
						.header("Authorization", bearer(ADMIN_USER, 1))
						.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void anySignedInUserSeesTheirOwnModules() throws Exception {
		when(vendorModules.resolveVendorId(VENDOR_USER, 3)).thenReturn(7L);
		when(vendorModules.modulesFor(3, 7L)).thenReturn(Arrays.asList("ocpi", "load_management"));

		mockMvc.perform(get("/services/me/modules").header("Authorization", bearer(VENDOR_USER, 3)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.vendorId").value(7))
				.andExpect(jsonPath("$.modules[0]").value("ocpi"));
	}

	@Test
	void platformAdminOnboardsAVendorOntoAPlan() throws Exception {
		mockMvc.perform(post("/services/platform/vendors/7/onboard").param("plan", "ROAMING")
						.header("Authorization", bearer(ADMIN_USER, 1)))
				.andExpect(status().isOk());

		verify(vendorModules).onboard(7L, VendorPlan.ROAMING, ADMIN_USER);
	}

	@Test
	void onboardDefaultsToStandardWhenNoPlanGiven() throws Exception {
		mockMvc.perform(post("/services/platform/vendors/7/onboard")
						.header("Authorization", bearer(ADMIN_USER, 1)))
				.andExpect(status().isOk());

		verify(vendorModules).onboard(7L, VendorPlan.STANDARD, ADMIN_USER);
	}

	@Test
	void vendorAdminsCannotOnboard() throws Exception {
		mockMvc.perform(post("/services/platform/vendors/7/onboard").param("plan", "FULL")
						.header("Authorization", bearer(VENDOR_USER, 3)))
				.andExpect(status().isForbidden());
		verify(vendorModules, org.mockito.Mockito.never())
				.onboard(org.mockito.ArgumentMatchers.anyLong(),
						org.mockito.ArgumentMatchers.any(VendorPlan.class),
						org.mockito.ArgumentMatchers.anyLong());
	}

	@Test
	void anUnknownPlanIsRejected() throws Exception {
		mockMvc.perform(post("/services/platform/vendors/7/onboard").param("plan", "platinum")
						.header("Authorization", bearer(ADMIN_USER, 1)))
				.andExpect(status().isBadRequest());
	}
}
