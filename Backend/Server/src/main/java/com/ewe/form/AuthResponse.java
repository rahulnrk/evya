package com.ewe.form;

/**
 * Auth response DTO — never return raw User/Employee entities with password hashes.
 */
public class AuthResponse {

	private String token;
	private String refreshToken;
	/** CMS compatibility alias for userId */
	private Long id;
	private Long userId;
	private Integer roleId;
	private Long orgId;
	private String designation;
	private String username;
	private String email;

	public AuthResponse() {
	}

	public AuthResponse(String token, String refreshToken, Long userId, Integer roleId, Long orgId) {
		this.token = token;
		this.refreshToken = refreshToken;
		this.userId = userId;
		this.id = userId;
		this.roleId = roleId;
		this.orgId = orgId;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public String getRefreshToken() {
		return refreshToken;
	}

	public void setRefreshToken(String refreshToken) {
		this.refreshToken = refreshToken;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
		this.id = userId;
	}

	public Integer getRoleId() {
		return roleId;
	}

	public void setRoleId(Integer roleId) {
		this.roleId = roleId;
	}

	public Long getOrgId() {
		return orgId;
	}

	public void setOrgId(Long orgId) {
		this.orgId = orgId;
	}

	public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}
}
