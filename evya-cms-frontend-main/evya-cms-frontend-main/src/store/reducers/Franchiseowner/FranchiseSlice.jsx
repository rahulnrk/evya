import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  list: [],
  status: 'idle',
  error: null,
  totalElements: 0,
  currentPage: 0,
};

const FranchiseSlice= createSlice({
  name: 'franchise',
  initialState,
  reducers: {
    getProfilesStart: (state) => {
      state.status = 'loading';
    },
    getProfilesSuccess: (state, action) => {
      state.status = 'succeeded';
      state.list = action.payload.ownersList;
      state.totalElements = action.payload.totalItems;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
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
} =  FranchiseSlice.actions;

// Thunk action creator
export const fetchOwnerlist = ( params) => async (dispatch) => {
  try {
    dispatch(getProfilesStart());
    const response = await AxiosServices.getOwnerlist( params);
    console.log(response.data);
    dispatch(getProfilesSuccess(response.data));
  } catch (error) {
    dispatch(getProfilesFailure(error.message));
  }
};
export default FranchiseSlice.reducer;
