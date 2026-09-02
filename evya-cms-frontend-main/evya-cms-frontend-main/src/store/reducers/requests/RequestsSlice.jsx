import { createSlice } from "@reduxjs/toolkit";
import AxiosServices from "@/services/AxiosServices";

const initialState = {
  list: [],
  status: "idle",
  jsonRequests: [],
  dbRequests: { totalItems: 0, totalPages: 1, requests: [], currentPage: 0 },
  totalElements: 0,
  error: null,
  verifyStatus: "idle",
  currentPage: 0,
};

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    fetchRequestsStart: (state) => {
      state.status = "loading";
      state.error = null;
    },
    fetchJsonRequestsSuccess: (state, action) => {
      state.status = "succeeded";
      state.jsonRequests = action.payload || [];
    },
    fetchDbRequestsSuccess: (state, action) => {
      state.status = "succeeded";
      state.dbRequests = action.payload || {
        totalItems: 0,
        totalPages: 1,
        currentPage: 0,
        requests: [],
      };
    },
    fetchRequestsFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },

    addRequestSuccess: (state, action) => {
      state.list.push(action.payload);
      state.totalElements += 1;
    },

    verifyStationStart: (state) => {
      state.verifyStatus = "loading";
    },
    verifyStationSuccess: (state, action) => {
      state.verifyStatus = "succeeded";
      const { siteId, stationId, portId } = action.payload;

      state.jsonRequests = state.jsonRequests.map((site) => {
        if (site.siteId === siteId) {
          return {
            ...site,
            stations: site.stations?.map((station) => {
              if (station.stationId === stationId) {
                return {
                  ...station,
                  ports: station.ports?.map((port) =>
                    port.portId === portId
                      ? { ...port, status: "Verified" }
                      : port
                  ),
                };
              }
              return station;
            }),
          };
        }
        return site;
      });
    },
    verifyStationFailure: (state, action) => {
      state.verifyStatus = "failed";
      state.error = action.payload;
    },

    removeVerifiedStation: (state, action) => {
      const stationId = action.payload;
      state.jsonRequests = state.jsonRequests
        .map((franchise) => {
          if (franchise.stations?.length) {
            const beforeCount = franchise.stations.length;
            const filteredStations = franchise.stations.filter(
              (s) => s.stationId !== stationId && s.id !== stationId
            );
            return {
              ...franchise,
              stations:
                filteredStations.length > 0 ? filteredStations : undefined,
            };
          }
          return franchise;
        })
        .filter((franchise) => {
          const keep =
            franchise.stations?.length ||
            franchise.siteName ||
            franchise.managerName;
          return keep;
        });

      if (state.dbRequests?.requests?.length) {
        state.dbRequests.requests = state.dbRequests.requests
          .map((franchise) => {
            if (franchise.stations?.length) {
              const beforeCount = franchise.stations.length;
              const filteredStations = franchise.stations.filter(
                (s) => s.stationId !== stationId && s.id !== stationId
              );
              return {
                ...franchise,
                stations:
                  filteredStations.length > 0 ? filteredStations : undefined,
              };
            }
            return franchise;
          })
          .filter((franchise) => {
            const keep =
              franchise.stations?.length ||
              franchise.siteName ||
              franchise.managerName;
            return keep;
          });
      }
    },
  },
});

export const createRequest = (requestData) => async (dispatch) => {
  try {
    const savedRequest = await AxiosServices.requestFranchise(requestData);
    if (savedRequest?.id) {
      dispatch(addRequestSuccess(savedRequest));
    }
    return savedRequest;
  } catch (error) {
    dispatch(fetchRequestsFailure(error.message || "Failed to create request"));
    throw error;
  }
};

export const fetchRequestedData = (params = {}) => async (dispatch) => {
  dispatch(fetchRequestsStart());
  try {
    const data = await AxiosServices.getRequestedFranchises(params);
    dispatch(fetchJsonRequestsSuccess(data));
  } catch (error) {
    dispatch(fetchRequestsFailure(error.message || error));
  }
};

export const fetchRequestedDataDb = (params = {}) => async (dispatch) => {
  dispatch(fetchRequestsStart());
  try {
    const response = await AxiosServices.getRequestedFranchisesList(params);
    console.log("📥 Raw DB Data fetched:", response);

    const formattedResponse = Array.isArray(response)
      ? {
          totalItems: response.length,
          totalPages: 1,
          currentPage: 0,
          requests: response,
        }
      : {
          totalItems: response?.totalItems || 0,
          totalPages: response?.totalPages || 1,
          currentPage: response?.currentPage || 0,
          requests: response?.requests || [],
        };

    dispatch(fetchDbRequestsSuccess(formattedResponse));
  } catch (error) {
    console.error("Error fetching DB requests:", error);
    dispatch(fetchRequestsFailure(error.message || error));
  }
};

export const verifyStation = (stationData) => async (dispatch) => {
    dispatch(verifyStationStart());
    try {
        const requestData = {
            ev_stations: [
                {
                    franchise_name: stationData.franchiseName,
                    site_name: stationData.siteName,
                    station_name: stationData.stationName,
                    address: stationData.address,
                    coordinates: {
                        latitude: stationData.coordinates?.latitude?.toString() || stationData.latitude?.toString(),
                        longitude: stationData.coordinates?.longitude?.toString() || stationData.longitude?.toString()
                    },
                    capacity: stationData.capacity,
                    number_of_chargers: 1,
                    application_number: stationData.applicationNumber || stationData.serialNumber,
                    serial_number: stationData.serialNumber,
                    connector_type: stationData.connectorType,
                    port_type: stationData.portType,
                    email: stationData.email,
                    mobile_number: stationData.mobileNumber,
                    district: stationData.district || null,
                    registration_date: stationData.registrationDate || null,
                    registration: stationData.registration || null,
                    icon: stationData.icon || null,
                    status: stationData.status || null,
                    verification_notes: stationData.verificationNotes || null
                }
            ]
        };

        const response = await AxiosServices.verifyAndImportStations(requestData);
        
        // Update the Redux state
        dispatch(verifyStationSuccess({
            stationId: stationData.stationId,
            portId: stationData.portId,
            data: response
        }));
        
        // Also update the local list by removing the verified station
        dispatch(removeVerifiedStation(stationData.stationId));
        
        return response;
    } catch (error) {
        console.error('Verification error:', error);
        dispatch(verifyStationFailure(error.message || "Failed to verify station"));
        throw error;
    }
};
export const {
  fetchRequestsStart,
  fetchJsonRequestsSuccess,
  fetchDbRequestsSuccess,
  fetchRequestsFailure,
  addRequestSuccess,
  verifyStationStart,
  verifyStationSuccess,
  verifyStationFailure,
  removeVerifiedStation,
} = requestsSlice.actions;

export default requestsSlice.reducer;
