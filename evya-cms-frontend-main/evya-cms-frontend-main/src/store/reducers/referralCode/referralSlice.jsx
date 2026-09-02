import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseURL,baseOCPPURL } from '@/config';
const API_BASE_URL = `${baseURL}/services/referral-codes`;

const initialState = {
  list: [],
  status: 'idle',
  error: null,
  currentReferral: null,
  addReferralStatus: 'idle',
  updateReferralStatus: 'idle',
  deleteReferralStatus: 'idle',
};

export const fetchReferrals = createAsyncThunk(
  'referral/fetchReferrals',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/getAllReferral`);
    console.log(response.data);
    return response.data; // Assuming the response has a 'referrals' array
  }
);

export const getReferralDetails = createAsyncThunk(
  'referral/getReferralDetails',
  async (id) => {
    const response = await axios.get(`${API_BASE_URL}/getAllReferral/${id}`);
    return response.data;
  }
);

export const addReferral = createAsyncThunk(
  'referral/addReferral',
  async (referralData) => {
    const response = await axios.post(`${API_BASE_URL}/add`, referralData);
    return response.data;
  }
);

export const updateReferral = createAsyncThunk(
  'referral/updateReferral',
  async ({ id, ...referralData }, { dispatch }) => {
    await axios.put(`${API_BASE_URL}/edit/${id}`, referralData);
    const refreshed = await axios.get(`${API_BASE_URL}/getAllReferral/${id}`);
    return refreshed.data;
  }
);

export const deleteReferral = createAsyncThunk(
  'referral/deleteReferral',
  async (id) => {
    await axios.delete(`${API_BASE_URL}/delete/${id}`);
    return id;
  }
);

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {
    resetReferralState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all referrals
      .addCase(fetchReferrals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReferrals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchReferrals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Get referral details
      .addCase(getReferralDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getReferralDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentReferral = action.payload;
      })
      .addCase(getReferralDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Add referral
      .addCase(addReferral.pending, (state) => {
        state.addReferralStatus = 'loading';
      })
      .addCase(addReferral.fulfilled, (state, action) => {
        state.addReferralStatus = 'succeeded';
        state.list.push(action.payload);
      })
      .addCase(addReferral.rejected, (state, action) => {
        state.addReferralStatus = 'failed';
        state.error = action.error.message;
      })

      // Update referral
      .addCase(updateReferral.pending, (state) => {
        state.updateReferralStatus = 'loading';
      })
      .addCase(updateReferral.fulfilled, (state, action) => {
        state.updateReferralStatus = 'succeeded';
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.currentReferral = action.payload;
      })
      .addCase(updateReferral.rejected, (state, action) => {
        state.updateReferralStatus = 'failed';
        state.error = action.error.message;
      })

      // Delete referral
      .addCase(deleteReferral.pending, (state) => {
        state.deleteReferralStatus = 'loading';
      })
      .addCase(deleteReferral.fulfilled, (state, action) => {
        state.deleteReferralStatus = 'succeeded';
        state.list = state.list.filter(item => item.id !== action.payload);
      })
      .addCase(deleteReferral.rejected, (state, action) => {
        state.deleteReferralStatus = 'failed';
        state.error = action.error.message;
      });
  }
});

export default referralSlice.reducer;
export const selectAllReferrals = (state) => state.referral.list;
export const selectReferralById = (id) => (state) =>
  state.referral.list.find(item => item.id === id);
export const selectCurrentReferral = (state) => state.referral.currentReferral;
export const selectReferralStatus = (state) => state.referral.status;
export const selectReferralError = (state) => state.referral.error;
export const selectUpdateReferralStatus = (state) =>
  state.referral.updateReferralStatus;