import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const initialState = {
  stats: null,
  revenueGraph: [],
  sessionGraph: [],
  stationStats: null,
  portStats: null,
  whiteLabels: [],
  owners: [],
  dateRange: {
    startDate: '',
    endDate: ''
  },
  status: 'idle',
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    getDashboardDataStart: (state) => {
      state.status = 'loading';
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    getDashboardDataSuccess: (state, action) => {
      state.status = 'succeeded';
      const { type, data } = action.payload;
      switch(type) {
        case 'stats':
          state.stats = data[0];
          break;
        case 'revenueGraph':
          state.revenueGraph = data;
          break;
        case 'sessionGraph':
          state.sessionGraph = data;
          break;
        case 'stationStats':
          state.stationStats = data;
          break;
        case 'portStats':
          state.portStats = data;
          break;
        case 'whiteLabels':
          state.whiteLabels = data;
          break;
        case 'owners':
          state.owners = data;
          break;
      }
    },
    getDashboardDataFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
  },
});

export const {
  getDashboardDataStart,
  getDashboardDataSuccess,
  getDashboardDataFailure,
  setDateRange,
} = dashboardSlice.actions;

export const fetchDashboardStats = (orgId) => async (dispatch, getState) => {
  try {
    dispatch(getDashboardDataStart());

    const {dateRange = {}} = getState().dashboard;
    const {startDate, endDate} = dateRange;

    const params = {};
    if(startDate) params.startDate = startDate;
    if(endDate) params.endDate = endDate;

    const response = await AxiosServices.getDashboardStats(orgId, {params});
    dispatch(getDashboardDataSuccess({ type: 'stats', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error.message));
  }
};

export const fetchRevenueGraph = (orgId) => async (dispatch, getState) => {
  try {
    dispatch(getDashboardDataStart());

    const {dateRange = {}} = getState().dashboard;
    const {startDate, endDate} = dateRange;

    const params = {};
    if(startDate) params.startDate = startDate;
    if(endDate) params.endDate = endDate;

    const response = await AxiosServices.getRevenueGraph(orgId, {params});
    dispatch(getDashboardDataSuccess({ type: 'revenueGraph', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error.message));
  }
};

export const fetchSessionGraph = (orgId) => async (dispatch, getState) => {
  try {
    dispatch(getDashboardDataStart());

    const {dateRange = {}} = getState().dashboard;
    const {startDate, endDate} = dateRange;

    const params = {};
    if(startDate) params.startDate = startDate;
    if(endDate) params.endDate = endDate;

    const response = await AxiosServices.getSessionGraph(orgId, {params});
    dispatch(getDashboardDataSuccess({ type: 'sessionGraph', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error.message));
  }
};

export const fetchStationStats = (orgId) => async (dispatch, getState) => {
  try {
    dispatch(getDashboardDataStart());

    const {dateRange = {}} = getState().dashboard;
    const {startDate, endDate} = dateRange;

    const params = {};
    if(startDate) params.startDate = startDate;
    if(endDate) params.endDate = endDate;

    const response = await AxiosServices.getStationStats(orgId, {params});
    dispatch(getDashboardDataSuccess({ type: 'stationStats', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error.message));
  }
};

export const fetchPortStats = (orgId) => async (dispatch, getState) => {
  try {
    dispatch(getDashboardDataStart());

    const {dateRange = {}} = getState().dashboard;
    const {startDate, endDate} = dateRange;
    const params = {};
    if(startDate) params.startDate = startDate;
    if(endDate) params.endDate = endDate;

    const response = await AxiosServices.getPortStats(orgId, {params});
    dispatch(getDashboardDataSuccess({ type: 'portStats', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error.message));
  }
};
export const fetchWhiteLabels = () => async (dispatch) => {
  try {
    dispatch(getDashboardDataStart());
    const response = await AxiosServices.getWhiteLabels();
    dispatch(getDashboardDataSuccess({ type: 'whiteLabels', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error));
  }
};

export const fetchFranchises = () => async (dispatch) => {
  try {
    dispatch(getDashboardDataStart());
    const response = await AxiosServices.getFranchises();
    dispatch(getDashboardDataSuccess({ type: 'owners', data: response.data }));
  } catch (error) {
    dispatch(getDashboardDataFailure(error.message));
  }
};

export default dashboardSlice.reducer;
