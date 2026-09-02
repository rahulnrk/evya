import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';
const initialState = {
  reportData: null,
  sites: [],
  stations: [],
  loading: false,
  error: null,
  filters: {
    reportType: '',
    selectedItem: '',
    selectedItemId: null,
    dateRange: '7',
    startDate: null,
    endDate: null,
  }
};
function getDefaultStartDate(range) {
  const days = parseInt(range, 10);
  if (isNaN(days)) return null;
  
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().split('T')[0];
}
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSites: (state, action) => {
      state.sites = action.payload;
    },
    setStations: (state, action) => {
      state.stations = action.payload;
    },
    setReportData: (state, action) => {
      state.reportData = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        ...(action.payload.dateRange && action.payload.dateRange !== 'Custom' ? {
          startDate: null,
          endDate: null
        } : {})
      };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    }
  }
});
export const { 
  setLoading, 
  setError, 
  setSites, 
  setStations, 
  setReportData, 
  setFilters,
  resetFilters
} = reportsSlice.actions;

export const fetchSites = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await AxiosServices.getSitesList('site');
    dispatch(setSites(response));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchStations = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await AxiosServices.getStationsList('station');
    dispatch(setStations(response));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchReportData = (filters) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
//lavanya added
   if (!filters.reportType) {
  throw new Error('Please select report type');
}


   const params = {
  startDate: filters.startDate || getDefaultStartDate(filters.dateRange),
  endDate: filters.endDate || new Date().toISOString().split('T')[0]
};

if (filters.selectedItemId) {
  if (filters.reportType === "sites") {
    params.siteId = filters.selectedItemId;
  } else {
    params.stationId = filters.selectedItemId;
  }
}

    console.log(params);
    if (filters.dateRange === 'Custom' && (!filters.startDate || !filters.endDate)) {
      throw new Error('Please select both start and end dates');
    }

    const response = await AxiosServices.getReportData(params);
    dispatch(setReportData(response));
  } catch (error) {
    dispatch(setError(error.message));
    dispatch(setReportData(null));
  } finally {
    dispatch(setLoading(false));
  }
};

export default reportsSlice.reducer;