package com.ewe.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.ewe.controller.advice.ServerException;
import com.ewe.form.AuthResponse;
import com.ewe.form.LoginUser;
import com.ewe.form.UserDetailsForm;
import com.ewe.messages.ResponseMessage;
import com.ewe.pojo.Employee;
import com.ewe.pojo.User;
import com.ewe.pojo.Usersinroles;
import com.ewe.security.JwtTokenProvider;
import com.ewe.service.EmployeeService;
import com.ewe.service.UserService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Hidden;

@RestController
@Scope("request")
@Hidden
@RequestMapping("login/")
@Api(tags = "LoginController")
public class LoginController {

	@Autowired
	private UserService userService;

	@Autowired
	private EmployeeService empService;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@Autowired
	private com.ewe.platform.VendorModuleService vendorModuleService;

	@ApiOperation(value = "Unified Authentication Endpoint for Users and Employees")
	@RequestMapping(value = "authenticate", method = RequestMethod.POST)
	public ResponseEntity<AuthResponse> authenticate(@RequestBody LoginUser loginUser) throws Exception {
		String rawPassword = new String(java.util.Base64.getDecoder().decode(loginUser.getPassword()));
		User user = (User) this.userService.getUser(loginUser.getUsername());
		if (user != null) {
			return authenticateUser(user, rawPassword);
		}
		Employee employee = userService.getEmployeeByUsername(loginUser.getUsername());
		if (employee != null) {
			return authenticateEmployee(employee, rawPassword);
		}
		throw new ServerException(com.ewe.messages.Error.USER_NOT_EXIST.toString(),
				Integer.toString(com.ewe.messages.Error.USER_NOT_EXIST.getCode()));
	}

	private ResponseEntity<AuthResponse> authenticateUser(User user, String rawPassword) throws ServerException {
		User userdetails = userService.getProfileById(user.getId());
		if (userdetails.getEmail() == null) {
			throw new ServerException(com.ewe.messages.Error.USER_NOT_EXIST.toString(),
					Integer.toString(com.ewe.messages.Error.USER_NOT_EXIST.getCode()));
		}

		String storedHashedPassword = userdetails.getPasswords().iterator().next().getPassword();
		boolean isPasswordValid = BCrypt.checkpw(rawPassword, storedHashedPassword);

		if (!isPasswordValid) {
			throw new ServerException(com.ewe.messages.Error.AUTHENTICATION.toString(),
					Integer.toString(com.ewe.messages.Error.AUTHENTICATION.getCode()));
		}

		Integer roleId = resolveUserRoleId(userdetails);
		Long orgId = userdetails.getOrgId();
		// ADR-003: the vendor comes from the link tables, not from orgId (set from a form field).
		Long vendorId = vendorModuleService.resolveVendorId(userdetails.getId(), roleId);
		java.util.List<String> modules = vendorModuleService.modulesFor(roleId, vendorId);
		String access = jwtTokenProvider.createAccessToken(userdetails.getId(), roleId, orgId, "USER", vendorId,
				modules);
		String refresh = jwtTokenProvider.createRefreshToken(userdetails.getId());

		AuthResponse body = new AuthResponse(access, refresh, userdetails.getId(), roleId, orgId);
		body.setUsername(userdetails.getUsername());
		body.setEmail(userdetails.getEmail());
		body.setVendorId(vendorId);
		body.setModules(modules);
		return ResponseEntity.status(HttpStatus.OK).body(body);
	}

	private Integer resolveUserRoleId(User userdetails) {
		try {
			if (userdetails.getUsersinroles() != null && !userdetails.getUsersinroles().isEmpty()) {
				Usersinroles uir = userdetails.getUsersinroles().iterator().next();
				if (uir.getRole_id() != null) {
					return uir.getRole_id().intValue();
				}
			}
		} catch (Exception ignored) {
		}
		return 2; // default driver/mobile-ish role
	}

	private ResponseEntity<AuthResponse> authenticateEmployee(Employee emp, String rawPassword) throws ServerException {
		Employee empDetails = empService.getProfileById(emp.getId());

		if (empDetails.getEmail() == null) {
			throw new ServerException(com.ewe.messages.Error.USER_NOT_EXIST.toString(),
					Integer.toString(com.ewe.messages.Error.USER_NOT_EXIST.getCode()));
		}

		String storedHashedPassword = empDetails.getPasswords().iterator().next().getPassword();
		boolean isPasswordValid = BCrypt.checkpw(rawPassword, storedHashedPassword);

		if (!isPasswordValid) {
			throw new ServerException(com.ewe.messages.Error.AUTHENTICATION.toString(),
					Integer.toString(com.ewe.messages.Error.AUTHENTICATION.getCode()));
		}

		int roleId = 6;
		Long orgId = null;
		try {
			// Employee may expose org via reflection-safe defaults
			orgId = empDetails.getId() != null ? null : null;
		} catch (Exception ignored) {
		}

		String access = jwtTokenProvider.createAccessToken(empDetails.getId(), roleId, orgId, "EMPLOYEE");
		String refresh = jwtTokenProvider.createRefreshToken(empDetails.getId());

		AuthResponse body = new AuthResponse(access, refresh, empDetails.getId(), roleId, orgId);
		body.setUsername(empDetails.getUsername());
		body.setEmail(empDetails.getEmail());
		body.setDesignation(empDetails.getDesignation());
		return ResponseEntity.status(HttpStatus.OK).body(body);
	}

	@ApiOperation(value = "Registration For New User")
	@RequestMapping(value = "registration", method = RequestMethod.POST)
	public ResponseEntity<ResponseMessage> registration(@RequestBody UserDetailsForm user) throws Exception {
		userService.addDriver(user);
		return ResponseEntity.status(HttpStatus.OK).body(new ResponseMessage("Registered successfully"));
	}
}
