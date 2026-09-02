import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AxiosServices from "@/services/AxiosServices";

const initialState = {
  walletDetails: {},
  walletStatus: "idle",
  walletError: null,
  walletHistory: [],
  walletHistoryStatus: "idle",
  walletHistoryError: null,
  evBrands: [],
  evBrandStatus: "idle",
  evBrandError: null,
};

export const fetchEVBrand = createAsyncThunk(
  "evuser/fetchEVBrand",
  async (_, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getEVBrand();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Failed to fetch EV brands"
      );
    }
  }
);

export const fetchWalletDetails = createAsyncThunk(
  "evuser/fetchWalletDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getWalletDetails(userId);
      return response; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Failed to fetch wallet details"
      );
    }
  }
);

export const fetchWalletTransaction  = createAsyncThunk(
  "evuser/fetchWalletTransactions",
  async (accId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getWalletTransactions(accId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Failed to fetch wallet history"
      );
    }
  }
);

const evuserSlice = createSlice({
  name: "evuser",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletDetails.pending, (state) => {
        state.walletStatus = "loading";
        state.walletError = null;
      })
      .addCase(fetchWalletDetails.fulfilled, (state, action) => {
        state.walletStatus = "succeeded";
        state.walletDetails = action.payload?.data?.[0] || {}; 
      })
      .addCase(fetchWalletDetails.rejected, (state, action) => {
        state.walletStatus = "failed";
        state.walletError = action.payload;
      });
    builder
      .addCase(fetchWalletTransaction.pending, (state) => {
        state.walletHistoryStatus = "loading";
        state.walletHistoryError = null;
      })
      .addCase(fetchWalletTransaction.fulfilled, (state, action) => {
        state.walletHistoryStatus = "succeeded";
        state.walletHistory = action.payload?.data || [];
      })
      .addCase(fetchWalletTransaction.rejected, (state, action) => {
        state.walletHistoryStatus = "failed";
        state.walletHistoryError = action.payload;
      });

    builder
      .addCase(fetchEVBrand.pending, (state) => {
        state.evBrandStatus = "loading";
        state.evBrandError = null;
      })
      .addCase(fetchEVBrand.fulfilled, (state, action) => {
        state.evBrandStatus = "succeeded";
        state.evBrands = action.payload?.data?.data || [];
      })
      .addCase(fetchEVBrand.rejected, (state, action) => {
        state.evBrandStatus = "failed";
        state.evBrandError = action.payload;
      });
  },
});

export default evuserSlice.reducer;