import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  list: [],
  loading: false,
  error: null
};

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    fetchOrganizationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrganizationsSuccess: (state, action) => {
      state.loading = false;
      state.list = action.payload;
      state.error = null;
    },
    fetchOrganizationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const {
  fetchOrganizationsStart,
  fetchOrganizationsSuccess,
  fetchOrganizationsFailure
} = organizationsSlice.actions;

// Thunk action creator
export const fetchOrganizations = () => async (dispatch) => {
  try {
    dispatch(fetchOrganizationsStart());
    const response = await AxiosServices.getOrganizations();
    dispatch(fetchOrganizationsSuccess(response));
  } catch (error) {
    dispatch(fetchOrganizationsFailure(error.message));
  }
};

export default organizationsSlice.reducer;