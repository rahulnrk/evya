import { createSlice } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';
import { fetchProfiles } from './profilesSlice';

const initialState = {
  loading: false,
  error: null,
  success: false,
};

const profileManagementSlice = createSlice({
  name: 'profileManagement',
  initialState,
  reducers: {
    addProfileStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    addProfileSuccess: (state) => {
      state.loading = false;
      state.error = null;
      state.success = true;
    },
    addProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
    resetProfileStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
});

export const {
  addProfileStart,
  addProfileSuccess,
  addProfileFailure,
  resetProfileStatus,
} = profileManagementSlice.actions;


const formatProfileData = (data, profileType) => {
    const baseData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      countryCode: data.countryCode,
      phoneNumber: data.phoneNumber,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      country: data.country,
      zipCode: data.zipCode,
    };
  
    switch (profileType) {
      case 'driver':
        return {
          ...baseData,
          password: data.password,
          confirmPassword: data.confirmPassword,
          roleName: "driver",
          salesChannel: null
        };
  
      case 'owner':
        return {
          ...baseData,
          orgName: data.userRole === 'whiteLabel' ? data.franchiseName : data.orgName,
          salesChannel: "Dealer",
          dealerOrg: data.userRole === 'whiteLabel' ? data.dealerOrg : null,
          searchText: "",
          roleName: "Owner"
        };
  
      case 'dealerAdmin':
        return {
          ...baseData,
          creationType: "new",
          emailcheck: null,
          orgName: data.orgName,
          roleName: "DealerAdmin",
          salesChannel: null
        };
  
      default:
        throw new Error('Invalid profile type');
    }
  };
  
export const addProfile = (data, profileType) => async (dispatch) => {
  try {
    dispatch(addProfileStart());
    const formattedData = formatProfileData(data, profileType);
    await AxiosServices.addProfile(formattedData);
    dispatch(addProfileSuccess());    
    dispatch(fetchProfiles(profileType, { 
      page: 0, 
      size: 10, 
      sortBy: 'id', 
      orderBy: 'desc',
      filter: ''
    }));
  } catch (error) {
    dispatch(addProfileFailure(error.message));
  }
};

export default profileManagementSlice.reducer;