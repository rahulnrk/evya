import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  userDetails: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
};

const userAdminProfileSlice = createSlice({
  name: 'userAdminProfile',
  initialState,
  reducers: {
    getUserDetailsStart: (state) => {
      state.status = 'loading';
    },
    getUserDetailsSuccess: (state, action) => {
      state.status = 'succeeded';
      state.userDetails = action.payload;
    },
    getUserDetailsFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    updateUserProfileStart: (state) => {
      state.updateStatus = 'loading';
    },
    updateUserProfileSuccess: (state, action) => {
      state.updateStatus = 'succeeded';
      state.userDetails = action.payload;
    },
    updateUserProfileFailure: (state, action) => {
      state.updateStatus = 'failed';
      state.updateError = action.payload;
    },
  },
});

export const {
  getUserDetailsStart,
  getUserDetailsSuccess,
  getUserDetailsFailure,
  updateUserProfileStart,
  updateUserProfileSuccess,
  updateUserProfileFailure,
} = userAdminProfileSlice.actions;

export const fetchUserDetails = (userId) => async (dispatch) => {
  try {
    dispatch(getUserDetailsStart());
    const response = await AxiosServices.getUserDetails(userId);
    dispatch(getUserDetailsSuccess(response));
  } catch (error) {
    dispatch(getUserDetailsFailure(error.message));
  }
};
export const updateUserProfile = (userId, data) => async (dispatch) => {
  try {
    dispatch(updateUserProfileStart());
     const reponseData=await AxiosServices.updateUserProfile(userId, data);
    dispatch(updateUserProfileSuccess(reponseData));
    dispatch(fetchUserProfile(userId)); // Refresh user data
    return reponseData;
  } catch (error) {
    dispatch(updateUserProfileFailure(error.message));
  }
};
export default userAdminProfileSlice.reducer;
