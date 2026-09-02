import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const DEFAULT_IMAGE = require("../assets/images/home/m1.png");
const BASE_URL = "https://server.evyaa.com/api/mobile";  //backend-server apis from mobile controller to only app related apis
const baseurl="https://server.evyaa.com/services"; //backend-server apis common used for both app and portal
const OCPP_URL="https://ocpp.evyaa.com/ocpp"; //ocpp-server apis ocpp related api for app
 export const portalurl="https://portal.evyaa.com";
const AUTH_TOKEN_KEY = "authToken";

export async function setAuthToken(token) {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, String(token));
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

const attachAuth = async (config) => {
  try {
    const token = await getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore storage errors
  }
  return config;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT on every request (SEC-2 / SEC-5)
apiClient.interceptors.request.use(attachAuth, (error) => Promise.reject(error));
axios.interceptors.request.use(attachAuth, (error) => Promise.reject(error));

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
// Transform API response into usable station data
const transformStationData = (site, index) => {
  const allConnectors =
    site.stations?.flatMap((station) =>
      station.ports?.map((port) => port.connectorType) || []
    ) || [];

  const uniqueConnectors = Array.from(new Set(allConnectors));

  return {
    id: site.siteId || `station-${index}-${Date.now()}`,
    name: site.siteName || "Unnamed Station",
    address: site.locations?.[0]?.address || "Address not available",
    coordinates: {
      latitude: parseFloat(site.locations?.[0]?.latitude) || 0,
      longitude: parseFloat(site.locations?.[0]?.longitude) || 0,
    },
    available: site.availablePorts || 0,
    totalPorts: site.totalPorts || 0,
    totalStations: site.totalStations || 0,
    managerName: site.managerName || "-",
    managerPhone: site.managerPhone || "-",
    managerEmail: site.managerEmail || "-",
    connectors: uniqueConnectors.length > 0 ? uniqueConnectors : ["----"],
    originalData: { ...site },
    dataSource: "api",
    image: DEFAULT_IMAGE,
    current_type: site.stations?.[0]?.current_type||"----",
    power: "  --- ",
    price: "---",
    distance: "Navigate",
  };
};

//Core function
const getStations = async ({ location, filters, search, from, to } = {}, signal) => {
  let params = {};

  // Location
  if (location?.latitude != null) params.latitude = location.latitude;
  if (location?.longitude != null) params.longitude = location.longitude;

  // Filters
  if (filters) {
    if (filters.radius != null) params.radius = filters.radius;
    if (filters.connectorType != null) params.connectorType = filters.connectorType;
    if (filters.power != null) params.minPower = filters.power;
    if (filters.chargerType != null) params.powerType = filters.chargerType;
    if (filters.status != null) params.status = filters.status;
    if (filters.nameFilter != null) params.nameFilter = filters.nameFilter;
    console.log(filters.nameFilter);
  }

  // Search
  if (search && search.trim() !== "") params.address = search.trim();

  // From / To
  if (from) params.from = from;
  if (to) params.to = to;

  // Remove null/undefined/empty string
  Object.keys(params).forEach((key) => {
    if (params[key] === null || params[key] === undefined || params[key] === "") {
      delete params[key];
    }
  });

  const queryString = Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
  // console.log("URL:", `${API_URL}?${queryString}`);
  // console.log("Params Object:", params);

  const response = await axios.get(`${baseurl}/station/getstations`, { params, signal });

  if (response.status === 204) return [];

  const stationsData = Array.isArray(response.data) ? response.data : [];
  return stationsData.map(transformStationData);
};

const getTransactionTitle = (transaction) => {
  if (transaction.amtCredit > 0) return "Amount Credited";
  if (transaction.amtDebit > 0) return "Amount Debited";
  return "Transaction";
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString();
};

const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleTimeString();
};

const formatAmount = (transaction) => {
  return transaction.amtCredit > 0 ? `+${transaction.amtCredit}` : `-${transaction.amtDebit}`;
};
// Single export object
const StationsService = {
  getStations,
  getStationsByFilters: (filters, signal) => getStations({ filters }, signal),
  getStationsBySearch: (search, signal) => getStations({ search }, signal),
  getStationsByLocation: (location, signal) => getStations({ location }, signal),
  getStationsByFromTo: (from, to, signal) => getStations({ from, to }, signal),


  // SEC-5: real OTP calls aligned with SEC-1 (phone-bound verify, 6-digit)
  sendOtp: async (mobileNumber) => {
    try {
      const phoneNo = mobileNumber.replace(/\D/g, '').slice(-10);

      if (phoneNo.length !== 10) {
        return {
          success: false,
          message: "Please enter a valid 10-digit phone number"
        };
      }

      const response = await axios.get(`${BASE_URL}/otp/${phoneNo}`);
      return {
        success: response.data?.success || false,
        message: response.data?.message || "OTP sent successfully",
        data: response.data?.data || {}
      };
    } catch (error) {
      console.error("OTP send error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          "Failed to send OTP";
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data
      };
    }
  },

  verifyOtp: async (phoneNo, otp) => {
    try {
      const phone = String(phoneNo || '').replace(/\D/g, '').slice(-10);
      const response = await axios.post(
        `${BASE_URL}/otp/verify`,
        null,
        { params: { phoneNo: phone, otp } }
      );

      const data = response.data?.data || {};
      if (data.token) {
        await setAuthToken(data.token);
      }

      return {
        success: response.data?.success || false,
        message: response.data?.message || "OTP verified successfully",
        data
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to verify OTP",
        error: error.response?.data
      };
    }
  },

  // User Registration
  registerUser: async (userData) => {
    try {
      const response = await axios.post(`${BASE_URL}/userRegistartion`, userData);
      
      return {
        success: response.data?.success || false,
        message: response.data?.message || "User registered successfully",
        data: response.data?.data || []
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
        error: error.response?.data
      };
    }
  },

  // Update User Profile
  updateProfile: async (userData) => {
    try {
      const response = await axios.put(`${BASE_URL}/updateUserDetails`, userData);
      console.log(userData);
      console.log(response);
      
      return {
        success: response.data?.success || false,
        message: response.data?.message || "Profile updated successfully",
        data: response.data?.data || {}
      };
    } catch (error) {
      console.error("Profile update error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
        error: error.response?.data
      };
    }
  },
 getUserDetails: async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/userDetails/${userId}`);
    console.log('API response:', response.data);
    return {
      success: true,
       data:response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
},

getWalletDetails: async (userId, signal) => {
    try {
      const response = await axios.get(`${BASE_URL}/walletDetails/${userId}`, { signal });
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          data: response.data.data[0] || null, // first wallet object
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Failed to fetch wallet details",
          data: null,
        };
      }
    } catch (error) {
      console.error("Error fetching wallet details:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Network error occurred",
        data: null,
      };
    }
  },

  requestRFID: async (userId, payload) => {
  try {

    const response = await axios.post(
      `${baseurl}/rfid/request/${userId}`,
      payload
    );

    console.log("RFID Request Response:", response.data);

    return {
      success: true,
      message: response.data?.message || "RFID request sent successfully",
      data: response.data
    };

  } catch (error) {

    console.error("RFID request error:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Failed to request RFID"
    };

  }
},
getUserRFIDs: async (userId) => {
  try {

    console.log("Fetching RFIDs for user:", userId);

    const response = await axios.get(
      `${baseurl}/rfid/SingleUserRfid/${userId}`
    );

    console.log("RFID API Response:", response.data);

    return {
      success: true,
      data: response.data || []
    };

  } catch (error) {

    console.log(
      "RFID API ERROR:",
      error.response?.data || error.message
    );

    return {
      success: false,
      message: "Failed to fetch RFIDs",
      data: []
    };

  }
},
getRequestedRFIDs: async (userId) => {
  try {

    const res = await StationsService.getUserRFIDs(userId);

    if (!res.success) {
      return {
        success: false,
        message: "Failed to get requested RFIDs",
        data: []
      };
    }

    const requested = (res.data || []).filter(
      (item) => item.orderId
    );

    return {
      success: true,
      data: requested
    };

  } catch (error) {

    console.log("Requested RFID ERROR:", error);

    return {
      success: false,
      message: "Failed to get requested RFIDs",
      data: []
    };

  }
},

getActiveRFIDs: async (userId) => {
  try {

    const res = await StationsService.getUserRFIDs(userId);

    if (!res.success) {
      return {
        success: false,
        message: "Failed to get active RFIDs",
        data: []
      };
    }

    const active = (res.data || []).filter(
      (item) => item.rfId
    );

    return {
      success: true,
      data: active
    };

  } catch (error) {

    console.log("Active RFID ERROR:", error);

    return {
      success: false,
      message: "Failed to get active RFIDs",
      data: []
    };

  }
},
toggleRFIDStatus: async (rfid) => {
  try {

    console.log("Toggle RFID API:", `${baseurl}/rfid/toggle-status/${rfid}`);

    const response = await axios.post(
      `${baseurl}/rfid/toggle-status/${rfid}`
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    console.log(
      "Toggle RFID Error:",
      error.response?.data || error.message
    );

    return {
      success: false,
      message: error.response?.data?.message || "Failed to activate RFID"
    };

  }
},

  // Wallet transactions
  getWalletTransactions: async (walletId, signal) => {
    try {
      const response = await axios.get(`${BASE_URL}/walletTransactions/${walletId}`, { signal });

      if (response.data.success) {
        const transformedData = response.data.data.map((transaction) => ({
          id: transaction.id?.toString() || `transaction-${Date.now()}`,
          title: getTransactionTitle(transaction),
          date: formatDate(transaction.createTimeStamp || transaction.creationDate),
          time: formatTime(transaction.createTimeStamp || transaction.creationDate),
          amount: formatAmount(transaction),
          isCredit: transaction.amtCredit > 0,
          originalData: { ...transaction },
        }));

        return {
          success: true,
          message: response.data.message,
          data: transformedData,
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Failed to fetch transactions",
          data: [],
        };
      }
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Network error occurred",
        data: [],
      };
    }
  },

  // Wallet (details + transactions)
  getCompleteWalletData: async (userId, signal) => {
    try {
      const walletDetails = await StationsService.getWalletDetails(userId, signal);

      if (!walletDetails.success || !walletDetails.data) {
        return {
          success: false,
          message: walletDetails.message,
          wallet: null,
          transactions: [],
        };
      }

      const walletId = walletDetails.data.id;
      console.log(walletId);

      const transactions = await StationsService.getWalletTransactions(walletId, signal);
      console.log(transactions);

      return {
        success: true,
        message: "Wallet data retrieved successfully",
        wallet: walletDetails.data,
        transactions: transactions.data || [],
      };
    } catch (error) {
      console.error("Error fetching complete wallet data:", error);
      return {
        success: false,
        message: "Failed to fetch wallet data",
        wallet: null,
        transactions: [],
      };
    }
  },

  // Payment APIs
  /**
   * Create payment transaction in backend
   * @param {number} userId - User ID
   * @param {number} amount - Amount to be credited
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<Object>} Transaction data
   */
  createPaymentTransaction: async (userId, amount, signal = null) => {
    try {
      const config = signal ? { signal } : {};
      
      const response = await apiClient.post('/add_payment', {
        userId: userId,
        amtCredit: amount.toString()
      }, config);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment transaction');
      }

      console.log('Payment transaction created:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your internet connection.');
        }
        if (error.response) {
          throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
        if (error.request) {
          throw new Error('Network error: Unable to connect to server.');
        }
      }
      
      throw error;
    }
  },

  /**
   * Verify payment with backend after Razorpay payment
   * @param {Object} paymentData - Payment data from Razorpay
   * @param {string} paymentData.razorpay_order_id - Razorpay order ID
   * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
   * @param {string} paymentData.razorpay_signature - Razorpay signature
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<Object>} Verification result
   */
  verifyPayment: async (paymentData, signal = null) => {
    try {
      const config = signal ? { signal } : {};
      
      const response = await apiClient.post('/handle-payment-callback', {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      }, config);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Payment verification failed');
      }

      console.log('Payment verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Verification timeout. Please check your payment status.');
        }
        if (error.response) {
          throw new Error(`Verification failed: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
        if (error.request) {
          throw new Error('Network error: Unable to verify payment.');
        }
      }
      
      throw error;
    }
  },

  // Update User Details
updateUserDetails: async (userData, signal = null) => {
  try {
    const config = signal ? { signal } : {};
    
    const response = await apiClient.put('/updateUserDetails', userData, config);

    console.log('Update user details response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update user details error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      }
      if (error.request) {
        throw new Error('Network error: Unable to update user details.');
      }
    }
    
    throw error;
  }
},

 // Add Address
addAddress: async (userId, addressData, signal = null) => {
  try {
    const config = signal ? { signal } : {};
    
    const response = await apiClient.post(`/addAddress/${userId}`, addressData, config);

    console.log('Address API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding address:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      }
      if (error.request) {
        throw new Error('Network error: Unable to save address.');
      }
    }
    
    throw error;
  }
},


requestFranchise: async (franchiseData) => {
  try {
    const response = await axios.post(`${baseurl}/station/request-franchise`,
      franchiseData,
      { 
        headers: { 
          'Content-Type': 'application/json',
        } 
      }
    );

    console.log('Franchise API Response:', response.data);
    
    return {
      success: true,
      message: "Franchise request submitted successfully",
      data: response.data
    };
  } catch (error) {
    console.error("Request Franchise Error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to submit franchise request";
    return { 
      success: false, 
      message: errorMessage, 
      error: error.response?.data 
    };
  }
},
// Add this to your existing StationsService object
getRequestedFranchises: async (userId) => {
  try {
    const response = await axios.get(`${baseurl}/station/requestedFranchise/user/${userId}`);

    console.log('Franchises API Response:', response.data);
    
    return {
      success: true,
      message: "Franchises fetched successfully",
      data: response.data || [] // Extract the data array from response
    };
  } catch (error) {
    console.error("Get Franchises Error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch franchises";
    return { 
      success: false, 
      message: errorMessage, 
      error: error.response?.data,
      data: []
    };
  }
},


//  Send ReserveNow request
 occprequests :async (data) => {
  try {
    console.log(data);
    // SEC-8: app-restricted OCPP surface (not privileged /ocpp/request)
    const response = await axios.post(`${OCPP_URL}/app/request`, data);
    console.log(data);
    // return response;
    return {
        success: response.status,
        data: response.data,
        message: response.data.message,
      };
  } catch (error) {
    return handleError(error, "Failed to  request the ocpp");
  }
},

//  Get siteDetails ID
 getstationDetailsById : async (stationId) => {
  try {
    const response = await axios.get(`${baseurl}/station/stationDetails/${stationId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch reservation details");
  }
},
getstationById : async (stationId) => {
  try {
    const response = await axios.get(`${baseurl}/station/stationDetails/${stationId}`);
    return response;
  } catch (error) {
    return handleError(error, "Failed to fetch reservation details");
  }
},
stationById : async (stationId) => {
  try {
    const response = await axios.get(`${BASE_URL}/Details?siteId=${stationId}`);
    return response;
  } catch (error) {
    return handleError(error, "Failed to fetch reservation details");
  }
},
//  Get Reservation by ID
 getReservationById : async (reservationId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/reservation?reservationId=${reservationId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch reservation details");
  }
},

//  Get All Reservations by User
 getAllReservationsByUser: async (userId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/reservations/total?userId=${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch reservations");
  }
},

//  Get Upcoming (Reserved) Reservations
 getUpcomingReservations :async (userId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/reservations/upcoming?userId=${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch upcoming reservations");
  }
},

//  Get Completed Reservations
getCompletedReservations:async (userId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/reservations/completed?userId=${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch completed reservations");
  }
},

//  Get Cancelled Reservations
 getCancelledReservations: async (userId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/reservations/cancelled?userId=${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch cancelled reservations");
  }
},

getPortReservations: async (PortId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/reservations/by-port?portId=${PortId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "Failed to fetch port reservations");
  }
},
fetchBrands: async () => {
    try {
      const response = await apiClient.get('/evBrand');
      return {
        success: response.data?.success || false,
        data: response.data?.data || [],
        message: response.data?.message || 'Brands fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch vehicle brands'
      };
    }
  },
addVehicle: async (vehicleData) => {
    try {
      const response = await apiClient.post('/addEV', vehicleData);
      return {
        success: response.data?.success || false,
        data: response.data?.data || {},
        message: response.data?.message || 'Vehicle added successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to add vehicle'
      };
    }
  },

  /**
   * Get user's vehicle list
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's vehicles data
   */
  getUserVehicles: async (userId) => {
    try {
      const response = await apiClient.get(`/myEV/${userId}`);
      return {
        success: response.data?.success || false,
        data: response.data?.data || [],
        message: response.data?.message || 'Vehicles fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch vehicles'
      };
    }
  },

  // VIN decoding service
  /**
   * Decode VIN number to get vehicle details
   * @param {string} vinNumber - 17-digit VIN number
   * @returns {Promise<Object>} Decoded vehicle information
   */
  decodeVin: async (vinNumber) => {
    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vinNumber}?format=json`
      );
      
      if (response?.data?.Results) {
        const results = response.data.Results;
        const make = results.find((r) => r.Variable === 'Make')?.Value || '';
        const model = results.find((r) => r.Variable === 'Model')?.Value || '';
        const year = results.find((r) => r.Variable === 'Model Year')?.Value || '';
        
        return {
          success: true,
          data: {
            make: make,
            model: model,
            year: year ? Number(year) : null
          },
          message: 'VIN decoded successfully'
        };
      }
      
      return {
        success: false,
        data: null,
        message: 'No vehicle data found for this VIN'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to decode VIN. Please try manual selection.'
      };
    }
  },

   getMeterValues :async (transactionId) => {
  try {
    const response = await axios.get(`${OCPP_URL}/metervalues?transactionId=${transactionId}`);
    console.log(response.data)
    return response;
  } catch (error) {
    return handleError(error, "Failed to fetch upcoming reservations");
  }
},
// port avaliability
  portavaliablity: async (portId,time) => {
  try {
    if(!time){
    const response = await axios.get(`${baseurl}/station/${portId}/status-details`);
     return response;
    }
    else
    {
      const response = await axios.get(`${baseurl}/station/${portId}/status-details?calculationTime=${time}`);
       return response;
    }
   

  } catch (error) {
    return handleError(error, "Failed to fetch reservation details");
  }
},
// port avaliability
  portstatus: async (portId) => {
  try {
    const response = await axios.get(`${baseurl}/station/status/${portId}`);
   console.log("status",response.data);
    return response;

  } catch (error) {
    return handleError(error, "Failed to fetch reservation details");
  }
},

 // In your StationsService file
calculateCharging: async (portCapacity, pricePerUnit, requestBody) => {
  
  try {
    // Send portCapacity and pricePerUnit as query parameters
    // Send requestBody as the POST data
    const response = await axios.post(
      `${BASE_URL}/calculate?portCapacity=${portCapacity}&pricePerUnit=${pricePerUnit}`,
      requestBody
    );
    
    // console.log("API Response:", response.data);
    return response;

  } catch (error) {
    // console.error("API Error Details:", error.response?.data);
    return handleError(error, "Failed to calculate charging details");
  }
},

addFavoriteStation: async (userId, siteId) => {
    try {
      const response = await axios.post(
        `${baseurl}/site/addFavSite/${userId}`,
        siteId);  
      return {
        success: response.status,
        data: response.data,
        message: ''
      };
    } catch (error) {
      return handleError(error, "Failed to add favorite station");
    }
  },

  // Get Favorite Stations for User
  getFavoriteStations: async (userId) => {
    try {
      const response = await axios.get(
        `${baseurl}/site/getFavSite/user/${userId}`,
      );
     return {
        success: response.status,
        data: response.data,
        message: ''
      };
    } catch (error) {
      return handleError(error, "Failed to fetch favorite stations");
    }
  },

  // Delete Favorite Station (BUG-4: include siteId)
  deleteFavoriteStation: async (userId, stationId) => {
    try {
      const response = await axios.delete(
        `${baseurl}/site/deleteFavSite/${userId}/${stationId}`,
      );
     return {
        success: response.status,
        data: response.data,
        message: ''
      };
    } catch (error) {
      return handleError(error, "Failed to delete favorite station");
    }
  },

 // Delete Address
  deleteAddress: async (AddressId) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/deleteAddress/${AddressId}`
      );
     return {
        status: response.status,
        data: response.data,
        message: ''
      };
    } catch (error) {
      return handleError(error, "Failed to delete favorite station");
    }
  },
  // Fetch all tickets
getTickets: async (UserId) => {
  try {
    const response = await axios.get(
      `${baseurl}/issues/tickets/user/${UserId}`
    );
    return {
      status: response.status,
      data: response.data,
      message: 'Tickets fetched successfully'
    };
  } catch (error) {
    return handleError(error, "Failed to fetch tickets");
  }
},

// Create a new ticket
createTicket: async (ticketData) => {
  try {
    const response = await axios.post(
      `${baseurl}/issues/createticket`,
      ticketData
    );
    return {
      status: response.status,
      data: response.data,
      message: 'Ticket created successfully'
    };
  } catch (error) {
    return handleError(error, "Failed to create ticket");
  }
},

// Delete a ticket
deleteTicket: async (ticketId) => {
  try {
    const response = await axios.delete(
      `${baseurl}/issues/tickets/${ticketId}`
    );
    return {
      status: response.status,
      data: response.data,
      message: 'Ticket deleted successfully'
    };
  } catch (error) {
    return handleError(error, "Failed to delete ticket");
  }
},
createPhonePePayment: async (data) => {
  try {
    // BUG-8: server assigns merchantOrderId when omitted
    const response = await axios.post(`${BASE_URL}/pay`, {
      merchantOrderId: data.merchantOrderId || null,
      amount: data.amount,
      expireAfter: data.expireAfter,
      userId: data.userId,
    });
    return {
      success: true,
      orderId: response.data.orderId || response.data.merchantOrderId,
      merchantOrderId: response.data.orderId || response.data.merchantOrderId,
      redirectUrl: response.data.redirectUrl,
      state: response.data.state,
    };
  } catch (error) {
    return handleError(error, "Failed to create PhonePe payment");
  }
},

// Check PhonePe Payment Status
checkPhonePeStatus: async (merchantOrderId) => {
  try {
    const response = await axios.get(`${BASE_URL}/verify/${merchantOrderId}`); // ← verify
    return {
      success: true,
      state: response.data.state,
      orderId: response.data.orderId,
    };
  } catch (error) {
    return handleError(error, "Failed to check payment status");
  }
},
// get the sitedetails based on the site id
siteDetailsbyId: async (siteId) => {
  try {
    const response = await axios.get(
      `${baseurl}/site/siteDetails/${siteId}`
    );
    return {
      status: response.status,
      data: response.data,
      message: 'site details get successfully'
    };
  } catch (error) {
    return handleError(error, "Failed to delete ticket");
  }
},

/* =====================  COMMON ERROR HANDLER ===================== */
};
const handleError = (error, defaultMessage) => {
  console.error("API Error:", error);
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    defaultMessage;
  return { success: false, message };
};

export default StationsService;