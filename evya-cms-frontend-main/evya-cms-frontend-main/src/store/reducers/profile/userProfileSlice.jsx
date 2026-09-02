import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';
import { fetchProfiles } from '../profile/profilesSlice';

const initialState = {
  userDetails: null,
  rfidCards: { content: [], totalElements: 0 },
  loading: false,
  error: null,
  success: false,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    getUserProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getUserProfileSuccess: (state, action) => {
      state.loading = false;
      state.userDetails = action.payload;
      state.error = null;
    },
    getUserProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    getRfidCardsSuccess: (state, action) => {
      state.rfidCards = action.payload;
    },
    updateUserProfileStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    updateUserProfileSuccess: (state) => {
      state.loading = false;
      state.success = true;
      state.error = null;
    },
    updateUserProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
    deleteUserProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteUserProfileSuccess: (state) => {
      state.loading = false;
      state.userDetails = null;
      state.error = null;
    },
    deleteUserProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetUserProfileState: () => initialState,
  },
});

export const {
  getUserProfileStart,
  getUserProfileSuccess,
  getUserProfileFailure,
  getRfidCardsSuccess,
  updateUserProfileStart,
  updateUserProfileSuccess,
  updateUserProfileFailure,
  deleteUserProfileStart,
  deleteUserProfileSuccess,
  deleteUserProfileFailure,
  resetUserProfileState,
} = userProfileSlice.actions;

// Thunk action creators
export const fetchUserProfile = (userId) => async (dispatch) => {
  try {
    dispatch(getUserProfileStart());
    const response = await AxiosServices.getUserDetails(userId);
    dispatch(getUserProfileSuccess(response));
  } catch (error) {
    dispatch(getUserProfileFailure(error.message));
  }
};

export const fetchRfidCards = (userId) => async (dispatch) => {
  try {
    const response = await AxiosServices.getRfidCards(userId);
    dispatch(getRfidCardsSuccess(response));
  } catch (error) {
    console.error('Error fetching RFID cards:', error);
  }
};

export const updateUserProfile = (userId, data) => async (dispatch) => {
  try {
    dispatch(updateUserProfileStart());
    await AxiosServices.updateUserProfile(userId, data);
    dispatch(updateUserProfileSuccess());
    dispatch(fetchUserProfile(userId)); // Refresh user data
  } catch (error) {
    dispatch(updateUserProfileFailure(error.message));
  }
};

export const deleteUserProfile = (userId) => async (dispatch) => {
  try {
    dispatch(deleteUserProfileStart());
    await AxiosServices.deleteUserProfile(userId);
    dispatch(deleteUserProfileSuccess());
    dispatch(fetchProfiles('driver', {
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: ''
    }));
  } catch (error) {
    dispatch(deleteUserProfileFailure(error.message));
  }
};
export default userProfileSlice.reducer;
