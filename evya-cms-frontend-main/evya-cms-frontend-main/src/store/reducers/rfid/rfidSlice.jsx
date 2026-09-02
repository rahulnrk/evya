import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  list: [],
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0,
  actionLoading: false,
  actionError: null,
  actionSuccess: false
};

const rfidRequestSlice = createSlice({
  name: 'rfidRequest',
  initialState,
  reducers: {
    getRfidRequestsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getRfidRequestsSuccess: (state, action) => {
      state.loading = false;
      state.list = action.payload.rfids;
      state.totalElements = action.payload.totalItems;
      state.currentPage = action.payload.number;
      state.error = null;
    },
    getRfidRequestsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    activateRfidStart: (state) => {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = false;
    },
    activateRfidSuccess: (state) => {
      state.actionLoading = false;
      state.actionError = null;
      state.actionSuccess = true;
    },
    activateRfidFailure: (state, action) => {
      state.actionLoading = false;
      state.actionError = action.payload;
      state.actionSuccess = false;
    },
    deleteRfidStart: (state) => {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = false;
    },
    deleteRfidSuccess: (state) => {
      state.actionLoading = false;
      state.actionError = null;
      state.actionSuccess = true;
    },
    deleteRfidFailure: (state, action) => {
      state.actionLoading = false;
      state.actionError = action.payload;
      state.actionSuccess = false;
    },
    resetRfidAction: (state) => {
      state.actionLoading = false;
      state.actionError = null;
      state.actionSuccess = false;
    },
    resetRfidRequests: (state) => initialState
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchRfidRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchRfidRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.rfids || [];
        state.totalElements = action.payload.totalElements || 0;
        state.currentPage = action.payload.currentPage || 0;
      })
      .addCase(searchRfidRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Search failed';
      });
    }
  
});

export const {
  getRfidRequestsStart,
  getRfidRequestsSuccess,
  getRfidRequestsFailure,
  activateRfidStart,
  activateRfidSuccess,
  activateRfidFailure,
  deleteRfidStart,
  deleteRfidSuccess,
  deleteRfidFailure,
  resetRfidAction,
  resetRfidRequests
} = rfidRequestSlice.actions;

export const fetchRfidRequests = (params) => async (dispatch) => {
  try {
    dispatch(getRfidRequestsStart());
    const response = await AxiosServices.getRfidRequestsList(params);
    console.log(response);
    dispatch(getRfidRequestsSuccess(response.data));
  } catch (error) {
    dispatch(getRfidRequestsFailure(error.message));
  }
};
export const searchRfidRequests = createAsyncThunk(
  'rfid/searchRfidRequests',
  async ({ search, page, size, searchField }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.searchRfidRequests({ search, page, size, searchField });

      
      return {
        rfids: response.data || [],
        totalElements: response.totalElements || 0,
        currentPage: response.currentPage || 0
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Search failed');
    }
  }
);

export const activateRfid = (payload) => async (dispatch) => {
  try {
    dispatch(activateRfidStart());
    await AxiosServices.activateRfid(payload);
    dispatch(activateRfidSuccess());
    dispatch(fetchRfidRequests({
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: null
    }));
  } catch (error) {
    dispatch(activateRfidFailure(error.message));
  }
};

export const deleteRfid = (id) => async (dispatch) => {
  try {
    dispatch(deleteRfidStart());
    await AxiosServices.deleteRfid(id);
    dispatch(deleteRfidSuccess());
    dispatch(fetchRfidRequests({
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: null
    }));
  } catch (error) {
    dispatch(deleteRfidFailure(error.message));
  }
};

export default rfidRequestSlice.reducer;