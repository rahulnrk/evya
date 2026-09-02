package com.ewe.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;

	public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header != null && header.startsWith("Bearer ")) {
			String token = header.substring(7).trim();
			// SEC-2c: reject refresh tokens — only access tokens authenticate API calls
			if (jwtTokenProvider.validateAccessToken(token)) {
				try {
					Long userId = jwtTokenProvider.getUserId(token);
					Integer roleId = jwtTokenProvider.getRoleId(token);
					Collection<SimpleGrantedAuthority> authorities = new ArrayList<>();
					if (roleId != null) {
						authorities.add(new SimpleGrantedAuthority("ROLE_" + roleId));
					}
					authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
					UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
							userId, null, authorities);
					SecurityContextHolder.getContext().setAuthentication(auth);
				} catch (Exception e) {
					SecurityContextHolder.clearContext();
				}
			} else {
				SecurityContextHolder.clearContext();
			}
		}
		filterChain.doFilter(request, response);
	}
}
