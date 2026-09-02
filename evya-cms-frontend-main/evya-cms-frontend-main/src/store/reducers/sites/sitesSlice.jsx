import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseURL,baseOCPPURL } from '@/config';
const API_BASE_URL = `${baseURL}/services`;

const initialState = {
  list: [],
  status: 'idle',
  error: null,
  currentSite: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  siteDetailsStatus: 'idle',
  siteDetailsError: null,
  owners: [],
  ownersStatus: 'idle',
  addSiteStatus: 'idle',
  addSiteError: null,
  updateSiteStatus: 'idle',
  updateSiteError: null, 
  stationList: [],
  stationTotalElements: 0,
  stationCurrentPage: 0,
  stationAdded: false,
  stationSuccess: false,
};

export const sitesSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    getSitesStart: (state) => {
      state.status = 'loading';
    },
    getSitesSuccess: (state, action) => {
      state.status = 'succeeded';
      state.list = action.payload.sites;
      state.totalElements = action.payload.totalItems;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
    },
    getSitesFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },

    deleteSiteStart: (state) => {
      state.status = 'loading';
    },
    deleteSiteSuccess: (state, action) => {
      state.status = 'succeeded';
      state.list = state.list.filter(site => site.siteId !== action.payload);
      state.totalElements -= 1;
    },
    deleteSiteFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    
    getSiteDetailsStart: (state) => {
      state.siteDetailsStatus = 'loading';
    },
    getSiteDetailsSuccess: (state, action) => {
      state.siteDetailsStatus = 'succeeded';
      state.currentSite = action.payload;
    },
    getSiteDetailsFailure: (state, action) => {
      state.siteDetailsStatus = 'failed';
      state.siteDetailsError = action.payload;
    },
    
    getOwnersStart: (state) => {
      state.ownersStatus = 'loading';
    },
    getOwnersSuccess: (state, action) => {
      state.ownersStatus = 'succeeded';
      state.owners = action.payload;
    },
    getOwnersFailure: (state, action) => {
      state.ownersStatus = 'failed';
      state.error = action.payload;
    },
    
    // Add site actions
    addSiteStart: (state) => {
      state.addSiteStatus = 'loading';
    },
    addSiteSuccess: (state) => {
      state.addSiteStatus = 'succeeded';
    },
    addSiteFailure: (state, action) => {
      state.addSiteStatus = 'failed';
      state.addSiteError = action.payload;
    },
    
    updateSiteStart: (state) => {
  state.addSiteStatus = 'loading';
},
updateSiteSuccess: (state) => {
  state.addSiteStatus = 'succeeded';
},
updateSiteFailure: (state, action) => {
  state.addSiteStatus = 'failed';
  state.addSiteError = action.payload;
},
resetAddSiteStatus: (state) => {
  state.addSiteStatus = 'idle';
  state.addSiteError = null;
},

    // Keep the station-related actions for compatibility
    getStationsSuccess: (state, action) => {
      state.stationList = action.payload
      state.stationTotalElements = action.payload.totalElements;
      state.stationCurrentPage = action.payload.number;
    },
    addStationSuccess: (state) => {
      state.stationAdded = true;
      state.stationSuccess = true;
    },
    addStationFailed: (state) => {
      state.stationAdded = true;
      state.stationSuccess = false;
    },
    addStationClose: (state) => {
      state.stationAdded = false;
    },
  },
    extraReducers: (builder) => {
    builder
      .addCase(searchSites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchSites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.data;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(searchSites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const {
  getSitesStart,
  getSitesSuccess,
  getSitesFailure,
  getSiteDetailsStart,
  getSiteDetailsSuccess,
  getSiteDetailsFailure,
  getOwnersStart,
  getOwnersSuccess,
  getOwnersFailure,
  addSiteStart,
  addSiteSuccess,
  addSiteFailure,
  updateSiteStart,            
  updateSiteSuccess,          
  updateSiteFailure,
  getStationsSuccess,
  addStationSuccess,
  addStationFailed,
  addStationClose,
  resetAddSiteStatus,
  deleteSite,
  deleteSiteStart,
  deleteSiteSuccess,
  deleteSiteFailure,
} = sitesSlice.actions;

export const fetchSites = (params = {}) => async (dispatch) => {
  try {
    dispatch(getSitesStart());
    const response = await axios.get(`${API_BASE_URL}/site/siteList`, { params });
    dispatch(getSitesSuccess(response.data));
  } catch (error) {
    dispatch(getSitesFailure(error.response?.data || 'Failed to fetch sites'));
  }
};

export const fetchSiteDetails = (id) => async (dispatch) => {
  try {
    dispatch(getSiteDetailsStart());
    const response = await axios.get(`${API_BASE_URL}/site/siteDetails/${id}`);
    dispatch(getSiteDetailsSuccess(response.data));
  } catch (error) {
    dispatch(getSiteDetailsFailure(error.response?.data || 'Failed to fetch site details'));
  }
};

export const searchSites = createAsyncThunk(
  'sites/searchSites',
  async ({ search, page, size, orgId }) => {
    const params = {
      search,
      page,
      size,
      orgId
    };

    const response = await axios.get(`${API_BASE_URL}/site/siteList`, { params });

    return {
      data: response.data.sites, // Already an array of objects
      currentPage: response.data.currentPage || 0,
      totalElements: response.data.totalItems || 0,
      totalPages: response.data.totalPages || 1
    };
  }
);

export const fetchOwners = () => async (dispatch) => {
  try {
    const orgId = localStorage.getItem("orgId");
    dispatch(getOwnersStart());
    const response = await axios.get(`${API_BASE_URL}/userprofile/getOwners?id=${orgId}`);
    dispatch(getOwnersSuccess(response.data));
  } catch (error) {
    dispatch(getOwnersFailure(error.response?.data || 'Failed to fetch owners'));
  }
};

export const addSite = (siteData) => async (dispatch) => {
  try {
    dispatch(addSiteStart());
    const response = await axios.post(`${API_BASE_URL}/site/add`, siteData);
    console.log(response);
    if (response.status === 201) {
      dispatch(addSiteSuccess());
      dispatch(fetchSites({ page: 0, size: 10 }));
      return response.data;
    }
  } catch (response) {
    dispatch(addSiteFailure(response || 'Failed to add site'));
    throw response;
  } finally {
    setTimeout(() => dispatch(resetAddSiteStatus()), 2000);
  }
};

export const updateSite = (id, siteData) => async (dispatch) => {
  try {
    dispatch(updateSiteStart());
    const response = await axios.put(`${API_BASE_URL}/site/edit/${id}`, siteData);
    console.log(response);
    if (response.status === 200) {
      dispatch(updateSiteSuccess());
      dispatch(fetchSites({ page: 0, size: 10 }));
      dispatch(fetchSiteDetails(id));
      return {
        data: response.data,
        status: response.status
      };
    }
  } catch (error) {
    dispatch(updateSiteFailure(error.response?.data || 'Failed to update site'));
    throw error.response?.data || 'An error occurred';
  }
};

export const fetchStations = (siteId, params) => async (dispatch) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/site/stationDetailsbysiteid/${siteId}`, { params });
    console.log(response.data);
    dispatch(getStationsSuccess(response.data));
  } catch (error) {
    console.error('Error fetching stations:', error);
  }
};
export const addStation = (stationData) => async (dispatch) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/stations/add`, stationData);
    dispatch(addStationSuccess());
    dispatch(fetchStations(stationData.siteId, { page: 0, size: 100 }));
  } catch (error) {
    dispatch(addStationFailed());
    console.error('Error adding station:', error);
  }
};

export const fetchFranchiseOwners = () => fetchOwners();
export default sitesSlice.reducer;