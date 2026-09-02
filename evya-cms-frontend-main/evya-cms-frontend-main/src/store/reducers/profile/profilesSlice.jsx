import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  list: [],
  status: 'idle',
  error: null,
  totalElements: 0,
  currentPage: 0,
};

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    getProfilesStart: (state) => {
      state.status = 'loading';
    },
    getProfilesSuccess: (state, action) => {
      state.status = 'succeeded';
      state.list = action.payload.content;
      state.totalElements = action.payload.totalElements;
      state.currentPage = action.payload.number;
    },
    getProfilesFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
  },
});

export const {
  getProfilesStart,
  getProfilesSuccess,
  getProfilesFailure,
} = profilesSlice.actions;

// Thunk action creator
export const fetchProfiles = (type, params) => async (dispatch) => {
  try {
    dispatch(getProfilesStart());
    const response = await AxiosServices.getProfiles(type, params);
    dispatch(getProfilesSuccess(response.data));
  } catch (error) {
    dispatch(getProfilesFailure(error.message));
  }
};

export default profilesSlice.reducer;
