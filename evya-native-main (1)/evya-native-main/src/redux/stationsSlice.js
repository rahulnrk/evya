// stationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import StationsService from "../axios/Apis";


// Async thunk to fetch stations
export const fetchStations = createAsyncThunk(
  "stations/fetchStations",
  async (newParams = {}, { getState, rejectWithValue, signal }) => {
    try {
      const state = getState();
      const lastFilters = state.stations.lastUsedParams ;

      // Merge previous filters with new ones
      const filters = newParams.filters || state.stations.lastUsedParams || {};

      const data = await StationsService.getStations({
        location: newParams.location,
        filters,
        search: newParams.search,
        from: newParams.from,
        to: newParams.to,
      }, signal);

      return { data, filters };
    } catch (err) {
      if (!err.response) return rejectWithValue("Network error - please check your connection");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  stations: [],
  loading: false,
  error: null,
  lastUsedParams: {},
  lastUpdated: null,
};

const stationsSlice = createSlice({
  name: "stations",
  initialState,
  reducers: {
    clearStations: (state) => {
      state.stations = [];
      state.lastUpdated = null;
      state.error = null;
    },
    updateStation: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.stations.findIndex(s => s.id === id);
      if (index !== -1) {
        state.stations[index] = { ...state.stations[index], ...updates };
      }
    },
    clearError: (state) => { state.error = null; },
     updateFilters: (state, action) => {
      state.lastUsedParams = { ...state.lastUsedParams, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(fetchStations.fulfilled, (state, action) => {
        state.loading = false;
        state.stations = action.payload.data;
        state.lastUsedParams = action.payload.filters; // store only filters
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchStations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  }
});

export const { clearStations, updateStation, clearError, updateFilters } = stationsSlice.actions;

export const selectAllStations = (state) => state.stations.stations;
export const selectStationById = (state, stationId) =>
  state.stations.stations.find((s) => s.id === stationId);
export const selectStationsLoading = (state) => state.stations.loading;
export const selectStationsError = (state) => state.stations.error;
export const selectStationsLastUpdated = (state) => state.stations.lastUpdated;
export const selectStationsParams = (state) => state.stations.lastUsedParams;

export default stationsSlice.reducer;
