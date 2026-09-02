import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';
const initialState = {
  stations: [],
  status: 'idle', 
  error: null,
  requestStatus: 'idle',
  requestError: null,
  requestResponse: null,
};

const ocppSlice = createSlice({
  name: 'ocpp',
  initialState,
  reducers: {
    getStationsStart: (state) => {
      state.status = 'loading';
    },
    getStationsSuccess: (state, action) => {
      state.status = 'succeeded';
      state.stations = action.payload;
      state.error = null;
    },
    getStationsFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
      state.stations = [];
    },
    sendRequestStart: (state) => {
      state.requestStatus = 'loading';
    },
    sendRequestSuccess: (state, action) => {
      state.requestStatus = 'succeeded';
      state.requestResponse = action.payload;
      state.requestError = null;
    },
    sendRequestFailure: (state, action) => {
      state.requestStatus = 'failed';
      state.requestError = action.payload;
      state.requestResponse = null;
    },
    clearRequestResponse: (state) => {
      state.requestStatus = 'idle';
      state.requestResponse = null;
      state.requestError = null;
    },
  },
});

export const {
  getStationsStart,
  getStationsSuccess,
  getStationsFailure,
  sendRequestStart,
  sendRequestSuccess,
  sendRequestFailure,
  clearRequestResponse,
} = ocppSlice.actions;

export const fetchOcppStations = () => async (dispatch) => {
  try {
    dispatch(getStationsStart());
    const response = await AxiosServices.getStations();
   
    
    let stationsData = [];
    
    if (Array.isArray(response.data)) {
      stationsData = response.data;
    } else if (response.data && Array.isArray(response.data.stations)) {
      stationsData = response.data.stations;
    } else if (response.data && Array.isArray(response.data.data)) {
      stationsData = response.data.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data.stations)) {
      stationsData = response.data.data.stations;
    } else {
      stationsData = [];
    }
    
    console.log("Number of raw stations:", stationsData.length);
    
    const uniqueStations = stationsData.filter((station, index, self) => 
      index === self.findIndex(s => s.id === station.id)
    );
    
    console.log("After deduplication:", uniqueStations.length);
    
    const normalizedStations = uniqueStations.map((station) => {
      console.log(`Processing station: ${station.stationName} (ID: ${station.id})`);
      
      const ports = (station.port || []).map(port => ({
        id: port.id,
        connectorId: port.connectorId,
        portName: port.connectorName || `Port ${port.connectorId}`,
        status:
          port.statusNotifcation?.[0]?.status ||
          port.statusNotifcation?.status ||      
          port.connectorStatus ||                
          port.status ||                         
          'Unknown'
      }));
      
      console.log(`  Found ${ports.length} ports`);
      
      const normalizedStation = {
        id: station.id,
        stationName: station.stationName || station.name || `Station ${station.id}`,
        referNo: station.referNo || station.referenceNumber || station.stationCode || '',
        port: ports,
        ports: ports 
      };
      
      console.log(`  Normalized station:`, {
        name: normalizedStation.stationName,
        id: normalizedStation.id,
        portsCount: normalizedStation.ports.length
      });
      
      return normalizedStation;
    });
    
    normalizedStations.forEach(station => {
      station.ports.forEach(port => {
        console.log(`  - ${port.portName}: ${port.status}`);
      });
    });
    
    dispatch(getStationsSuccess(normalizedStations));
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to fetch stations';
    dispatch(getStationsFailure(errorMessage));
  }
};

export const sendOcppRequest = (data) => async (dispatch) => {
  try {
    dispatch(sendRequestStart());
    
    const response = await AxiosServices.sendOcppRequest(data);
    console.log("OCPP Request response:", response); 
    
    const normalizedResponse = {
      status: response.data?.status || response.status || 'Unknown',
      message: response.data?.message || response.data?.response || response.message || 'No message',
      data: response.data
    };
    
    console.log("Normalized OCPP response:", normalizedResponse);
    
    dispatch(sendRequestSuccess(normalizedResponse)); 
  } catch (error) {
    console.error("Error sending OCPP request:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Request failed';
    dispatch(sendRequestFailure(errorMessage));
  }
};

export default ocppSlice.reducer;