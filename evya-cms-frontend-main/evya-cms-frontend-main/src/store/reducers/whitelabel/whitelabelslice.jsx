import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  list: [],
  status: 'idle',
  error: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
};

const whitelabelSlice = createSlice({
  name: 'whitelabel',
  initialState,
  reducers: {
    getProfilesStart: (state) => {
      state.status = 'loading';
    },
    getProfilesSuccess: (state, action) => {
      state.status = 'succeeded';

      const data = action.payload;

      state.list = data.whitelabels ;
      state.totalElements = data.totalItems;
      state.totalPages = data.totalPages ;
      state.currentPage = data.currentPage;
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
} = whitelabelSlice.actions;

export const fetchWhiteLabellist = (params) => async (dispatch) => {
  try {
    dispatch(getProfilesStart());
    const response = await AxiosServices.getWhitelabel(params);
    dispatch(getProfilesSuccess(response.data));
  } catch (error) {
    dispatch(getProfilesFailure(error.message));
  }
};

export const fetchSearchWhiteLabellist = (params) => async (dispatch) => {
  try {
    dispatch(getProfilesStart());
    const response = await AxiosServices.unifiedSearch(params);
    dispatch(getProfilesSuccess(response.data)); 
  } catch (error) {
    dispatch(getProfilesFailure(error.message));
  }
};

export default whitelabelSlice.reducer;

