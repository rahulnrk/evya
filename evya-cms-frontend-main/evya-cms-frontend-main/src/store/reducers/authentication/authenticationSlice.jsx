import { createSlice } from "@reduxjs/toolkit";
import AxiosServices from "@/services/AxiosServices";

const storedToken = localStorage.getItem('authToken');
const storedId = localStorage.getItem('id');
const storedOrgId = localStorage.getItem('orgId');
const storedRoleId = localStorage.getItem('roleId');
const storedDesignation = localStorage.getItem('designation');
// ADR-003: which vendor this user belongs to, and the modules they may use.
const storedVendorId = localStorage.getItem('vendorId');
const parseModules = () => { try { return JSON.parse(localStorage.getItem('modules')) || []; } catch { return []; } };

const initialState = {
  auth: { loading: false, text: 'logging' },
  isAuthenticated: Boolean(storedToken),
  registerStatus: 'idle',
  registerError: null,
  loginLoading: false,
  loginText: "",
  loginNotification: false,
  user: {
    id: storedId || null,
    orgId: storedOrgId || null,
    token: storedToken || null,
    roleId: storedRoleId || null,
    designation: storedDesignation || null,
    vendorId: storedVendorId || null,
    modules: parseModules(),
  },
};

export const authenticationSlice = createSlice({
  name: 'authentication',
  initialState,
  reducers: {
    loginUserStart: (state) => {
      state.loginLoading = true;
    },
    loginUserSuccess: (state, action) => {
      state.loginLoading = false;
      state.user = {
        id: action.payload.id,
        orgId: action.payload.orgId,
        token: action.payload.token,
        roleId: action.payload.usersinroles?.[0]?.role_id || action.payload.roleId || null,
        designation: action.payload.designation || null,
        vendorId: action.payload.vendorId ?? null,
        modules: action.payload.modules || [],
      };
      state.isAuthenticated = true;
    },
    loginUserFailure: (state, action) => {
      state.loginLoading = false;
      state.loginText = action.payload;
      state.loginNotification = true;
    },
    logoutUser: (state) => {
      state.isAuthenticated = false;
      state.user = {
        id: null,
        orgId: null,
        token: null,
        roleId: null,
        vendorId: null,
        modules: [],
      };
      localStorage.removeItem('authToken');
      localStorage.removeItem('orgId');
      localStorage.removeItem('id');
      localStorage.removeItem('roleId');
      localStorage.removeItem('vendorId');
      localStorage.removeItem('modules');
    },
    stopNotification: (state) => {
      state.loginNotification = false;
    },
    registerUserStart: (state) => {
      state.registerStatus = 'loading';
      state.auth.loading = true;
    },
    registerUserSuccess: (state) => {
      state.registerStatus = 'succeeded';
      state.auth.loading = false;
    },
    registerUserFailure: (state, action) => {
      state.registerStatus = 'failed';
      state.registerError = action.payload;
      state.auth.loading = false;
    },
  },
});

export const {
  loginUserStart,
  loginUserSuccess,
  loginUserFailure,
  logoutUser,
  registerUserStart,
  registerUserSuccess,
  registerUserFailure,
  stopNotification,
} = authenticationSlice.actions;

export const registerUser = (userData) => async (dispatch) => {
  try {
    dispatch(registerUserStart());
    await AxiosServices.registerUser(userData);
    dispatch(registerUserSuccess());
  } catch (error) {
    dispatch(registerUserFailure("Unable to Register: " + (error.response?.data?.message || error.message)));
  }
};

export const loginDispatcher = (userData) => async (dispatch) => {
  try {
    dispatch(loginUserStart());

    const response = await AxiosServices.loginUser(userData);
    const data = response.data;
    // SEC-2 AuthResponse: token, userId/id, roleId, orgId (no raw User entity)
    const roleId = data.roleId || data.usersinroles?.[0]?.role_id || null;
    const userId = data.userId || data.id;

    if (!data.token) {
      throw new Error("Login response missing token");
    }
    if (!roleId) {
      throw new Error("No role assigned to this user");
    }
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("orgId", data.orgId || "");
    localStorage.setItem("id", userId);
    localStorage.setItem("roleId", roleId);

    if (data.designation) {
      localStorage.setItem("designation", data.designation);
    } else {
      localStorage.removeItem("designation");
    }

    // ADR-003: the per-vendor product. Absent for EVYA admins and drivers.
    if (data.vendorId != null) {
      localStorage.setItem("vendorId", data.vendorId);
    } else {
      localStorage.removeItem("vendorId");
    }
    localStorage.setItem("modules", JSON.stringify(data.modules || []));

    dispatch(loginUserSuccess({
      ...data,
      id: userId,
      roleId,
      token: data.token,
    }));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch(loginUserFailure("Unable to Login: " + errorMessage));
  }
};
export default authenticationSlice.reducer; 