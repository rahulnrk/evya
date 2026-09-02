import {configureStore} from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';

import authenticationReducer from "./reducers/authentication/authenticationSlice"
import countriesReducer from './reducers/utils/countriesSlice';
import sitesReducer from './reducers/sites/sitesSlice'
import stationsReducer from './reducers/stations/stationsSlice';
import profilesReducer from './reducers/profile/profilesSlice';
import profileManagementReducer from './reducers/profile/profileManagementSlice';
import organizationsReducer from './reducers/organizations/organizationsSlice';
import userProfileReducer from './reducers/profile/userProfileSlice';
import rfidRequestReducer from './reducers/rfid/rfidSlice';
import issuesReducer from './reducers/issues/issuesSlice';
import reportsReducer from './reducers/reports/reportsSlice';
import dashboardReducer from './reducers/dashboard/dashboardSlice';
import userAdminProfileReducer from './reducers/user/userAdminProfileSlice';
import ocppReducer from './reducers/ocpp/ocppSlice';
import manufacturerReducer from './reducers/manufacturer/manufacturerSlice';
import whitelabelReducer from './reducers/whitelabel/whitelabelslice';
import franchiseReducer from './reducers/Franchiseowner/FranchiseSlice';
import referralReducer from './reducers/referralCode/referralSlice';
import employeeReducer from "./reducers/employee/employeeSlice";
import technicianTasksReducer from './reducers/tasks/technicianTasksSlice';
import chargerInstallationReducer from './reducers/chargerInstallation/ChargerInstallationSlice';
import fleetReducer from './reducers/fleet/FleetSlice';
import requestsReducer from './reducers/requests/RequestsSlice';
import evuserReducer from './reducers/evuser/evuserSlice';

const rootReducer = combineReducers({
    authentication: authenticationReducer,
    countries: countriesReducer,
    sites: sitesReducer,
    stations:stationsReducer,
    profiles:profilesReducer,
    profileManagement:profileManagementReducer,
    organizations:organizationsReducer,
    userProfile:userProfileReducer,
    rfidRequest:rfidRequestReducer,
    issues:issuesReducer,
    reports: reportsReducer,
    dashboard: dashboardReducer,
    userAdminProfile: userAdminProfileReducer,
    ocpp: ocppReducer,
    manufacturer: manufacturerReducer,
    whitelabel:whitelabelReducer,
    franchise:franchiseReducer,
    referral: referralReducer,
    employee: employeeReducer,
    chargerInstallation: chargerInstallationReducer,
    technicianTasks: technicianTasksReducer,
    fleet: fleetReducer,
    requests: requestsReducer,
    evuser:evuserReducer,

  });

export const store = configureStore({
    reducer:rootReducer
})
