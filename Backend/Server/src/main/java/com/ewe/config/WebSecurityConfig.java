package com.ewe.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.ewe.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	/** ADR-003: the platform admin role (the portal's role 1). */
	@Value("${platform.roles.admin:1}")
	private int adminRoleId;

	@Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,https://portal.evyaa.com,https://web.evyaa.com}")
	private String allowedOrigins;

	public WebSecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.cors().and()
			.csrf().disable()
			.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			.and()
			.authorizeRequests()
			// Public auth / OTP / registration / docs / health
			.antMatchers(
					"/login/authenticate",
					"/login/registration",
					"/api/mobile/otp/**",
					"/api/mobile/userRegistartion",
					"/",
					"/error",
					"/api-docs/**",
					"/swagger-ui/**",
					"/swagger-ui-custom.html",
					"/v3/api-docs/**",
					"/swagger-resources/**",
					"/webjars/**"
			).permitAll()
			.antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
			/*
			 * SEC-9: public map discovery (read-only GET).
			 * evyaweb (web.evyaa.com) has no JWT — charger locations are non-sensitive public data.
			 * Wallet / user / booking / RFID / write APIs stay authenticated.
			 */
			.antMatchers(HttpMethod.GET,
					"/api/mobile/mobilegetAllSites",
					"/api/mobile/Details",
					"/services/station/stationDetails/**",
					"/services/site/siteDetails/**",
					"/services/site/stationDetailsbysiteid/**"
			).permitAll()
			// Franchise admin surface — role 4 (matches CMS client check, now enforced server-side)
			.antMatchers("/services/station/request-franchise", "/services/**/franchise/**")
				.hasAnyAuthority("ROLE_4", "ROLE_1", "ROLE_ADMIN")
			// ADR-003: per-vendor modules are managed by the platform admin only
			.antMatchers("/services/platform/**").hasAnyAuthority("ROLE_" + adminRoleId, "ROLE_ADMIN")
			.anyRequest().authenticated()
			.and()
			.exceptionHandling()
			.authenticationEntryPoint((request, response, authException) -> {
				response.setStatus(401);
				response.setContentType("application/json");
				response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\",\"code\":401}");
			})
			.accessDeniedHandler((request, response, accessDeniedException) -> {
				response.setStatus(403);
				response.setContentType("application/json");
				response.getWriter().write("{\"success\":false,\"message\":\"Forbidden\",\"code\":403}");
			})
			.and()
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
			.headers().frameOptions().disable();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		List<String> origins = Arrays.asList(allowedOrigins.split(","));
		configuration.setAllowedOrigins(origins);
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
		configuration.setExposedHeaders(Arrays.asList("Authorization"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
