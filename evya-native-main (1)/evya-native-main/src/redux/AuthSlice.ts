import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import StationsService from '../axios/Apis';

// Types
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Account {
  id: string;
  balance: number;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
  mobileNumber?: string;
  fullname?: string;
  vehicles?: Vehicle[];
}

interface UserDetails {
  user: User;
  vehicles: Vehicle[];
  address: Address[];
  account: Account | null;
}

interface AuthState {
  userId: string | null;
  mobileNumber: string;
  isAuthenticated: boolean;
  loading: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  error: string | null;
  timer: number;
  user: User | null;
  vehicles: Vehicle[];
  address: Address[];
  account: Account | null;
  userDataLoaded: boolean;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

// Async Thunks

export const getUserDetails = createAsyncThunk(
  'auth/getUserDetails',
  async (userId: string, { rejectWithValue }) => {
    try {
      const userResponse = await StationsService.getUserDetails(userId);
      await StationsService.getUserVehicles(userId);

      if (userResponse.success) {
        const apiData = userResponse.data.data;

        const userData: UserDetails = {
          user: {
            id: apiData.id,
            name: apiData.fullname || '',
            email: apiData.email,
            phone: apiData.mobileNumber,
            profileImage: apiData.profileImage,
            createdAt: apiData.createdAt,
            updatedAt: apiData.updatedAt,
            username: apiData.username,
            mobileNumber: apiData.mobileNumber,
            fullname: apiData.fullname,
            vehicles: apiData.vehicle,
          },
          vehicles: apiData.vehicle,
          address: apiData.address || [],
          account: apiData.account || null,
        };

        return userData;
      } else {
        return rejectWithValue(userResponse.message || 'User not found');
      }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Failed to fetch user details'));
    }
  }
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (mobileNumber: string, { rejectWithValue }) => {
    try {
      const response = await StationsService.sendOtp(mobileNumber);
      if (response.success) {
        return response;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Failed to send OTP'));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (
    { phoneNo, otp }: { phoneNo: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await StationsService.verifyOtp(phoneNo, otp);
      if (response.success) {
        return response;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Failed to verify OTP'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await StationsService.registerUser(userData);
      if (response.success) {
        return response;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Failed to register user'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await StationsService.updateProfile(userData);
      if (response.success) {
        return response;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Failed to update profile'));
    }
  }
);

const initialState: AuthState = {
  userId: null,
  mobileNumber: '',
  isAuthenticated: false,
  loading: false,
  otpSent: false,
  otpVerified: false,
  error: null,
  timer: 60,
  user: null,
  vehicles: [],
  address: [],
  account: null,
  userDataLoaded: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.userId = null;
      state.isAuthenticated = false;
      state.otpSent = false;
      state.otpVerified = false;
      state.error = null;
      state.vehicles = [];
      state.address = [];
      state.account = null;
      state.userDataLoaded = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setMobileNumber: (state, action: PayloadAction<string>) => {
      state.mobileNumber = action.payload;
    },
    setTimer: (state, action: PayloadAction<number>) => {
      state.timer = action.payload;
    },
    resetAuthState: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
      state.error = null;
      state.loading = false;
    },
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
      state.isAuthenticated = true;
    },
    updateVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
    },
    updateAddress: (state, action: PayloadAction<Address[]>) => {
      state.address = action.payload;
    },
    updateAccount: (state, action: PayloadAction<Account | null>) => {
      state.account = action.payload;
    },
    updateUserBasicInfo: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
        state.timer = 60;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.otpSent = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpVerified = true;
        const payload = action.payload as any;
        state.userId = payload?.data?.userId || payload?.userId || state.userId;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.otpVerified = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (payload?.data) {
          state.userId = payload.data?.userId || state.userId;
          state.isAuthenticated = true;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (payload?.data && state.user) {
          state.user = { ...state.user, ...payload.data };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(getUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.userDataLoaded = true;
        state.user = action.payload.user;
        state.vehicles = action.payload.vehicles;
        state.address = action.payload.address;
        state.account = action.payload.account;
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? null;
        state.userDataLoaded = false;
      });
  },
});

export const {
  logout,
  clearError,
  setMobileNumber,
  setTimer,
  resetAuthState,
  setUserId,
  updateVehicles,
  updateAddress,
  updateAccount,
  updateUserBasicInfo,
} = authSlice.actions;

export default authSlice.reducer;
