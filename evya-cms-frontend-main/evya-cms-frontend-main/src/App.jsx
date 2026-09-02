import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/authentication/Login';
import Registation from './pages/authentication/Registation';
import TermsOfUse from './pages/authentication/TermsOfUse';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './pages/authentication/ProtectedRoute';
import ValidationRoute from './pages/authentication/ValidationRoute';
import NotFound from './pages/404/NotFound';
import Sites from './pages/sites/Sites';
import AddSite from './pages/sites/AddSite';
import SingleSite from './pages/sites/SingleSite';
import { Toaster } from "@/components/ui/toaster";
import Stations from './pages/stations/Stations';
import StationDetails from './pages/stations/StationDetails';
import EVChargerDashboard  from './pages/dashboard/EvChargerDashboard';
import Profiles from './pages/profile/Profiles';
import RFIDRequests from './pages/rfid/RFIDRequest';
import RFIDActivate from './pages/rfid/RFIDActivate';
import IssuesTracker from './pages/issues/IssueTracker';
import WhiteLabels from './pages/whitelabels/WhiteLabels';
import FranchiseOwners from './pages/franchise/FranchiseOwners';
import EVUsers from './pages/evusers/EVUsers';
import Reports from './pages/reports/Reports';
import UserAdminProfile from './pages/user/UserAdminProfile';
import OCPP from './pages/ocpp/OCPP';
import Manufacturers from './pages/manufacturer/Manufacturers';
import ManufacturerDetails from './pages/manufacturer/ManufacturerDetails';
import EvDashboard from './evusers/EvDashboard';
import EvPayment from './evusers/EvPayment';
import ChargingStatus from './evusers/ChargingStatus';
import EvDashboardLayout from './evusers/EvDashboardLayout';
import EvConnecting from './evusers/EvConnecting';
import SetPassword from './setpassword/SetPassword';
import WhitelabelPageDetails from '@/pages/whitelabels/WhitelabelPageDetails';
import EditIssuePage from './pages/issues/dialog/EditIssue';
import FranchisePageDetails from './pages/franchise/FranchisePageDetails';
import EvUserPageDetails from './pages/evusers/EvUserPageDetails';
import AddStationPage from './pages/stations/AddStationPage';
import { AddCharger } from './pages/manufacturer/dialog/AddCharger';
import EditSite from './pages/sites/EditSite';
import ReferralCodes from './pages/referralcodes/ReferralCodes';
import EditReferralCode from './pages/referralcodes/EditReferralCode';
import ReferralCodeInfo from './pages/referralcodes/ReferralCodeInfo';

import ForgotPassword from './setpassword/ForgotPassword';
import ResetPassword from './setpassword/ResetPassword';
import  CustomerSupport  from './pages/customerSupport/CustomerSupport';
import { CustomerSupportDetails } from './pages/customerSupport/CustomerSupportDetails';
import { CustomerSupportTaskDetails } from './pages/singleCustomer/CustomerSupportTaskDetails';
import AddCustomerSupport from './pages/customerSupport/AddCustomerSupport';
import EditCustomerSupport from './pages/customerSupport/EditCustomerSupport';
import CustomerSupportTasks from './pages/singleCustomer/CustomerSupportTasks';
import SolvedIssues from './pages/singleCustomer/SolvedIssues';
import IssueDetails from './pages/customerSupport/IssueDetails';
import EmployeeProfile from './pages/user/EmployeeProfile';

//pavan's
import ChargerInstallationTeam from './pages/chargerInstallationTeam/ChargerInstallationTeam';
import AddTeamMember from './pages/chargerInstallationTeam/AddTeamMember';
import TeamMemberDetails from './pages/chargerInstallationTeam/TeamMemberDetails';
import EditTeamMember from './pages/chargerInstallationTeam/EditTeamMember';
import FleetManagement from './pages/fleetManagement/FleetManagement';
import AddFleet from './pages/fleetManagement/AddFleet';
import FleetDetails from './pages/fleetManagement/FleetDetails';
import AddVehicle from './pages/fleetManagement/AddVehicle';
import VehicleDetails from './pages/fleetManagement/VehicleDetails';
// import RevenueDashboard from './pages/fleetManagement/RevenueDashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import TechnicianProfile from './pages/technicianProfile/TechnicianProfile';
import TechnicianDashboardDetails from './pages/technician/TechnicianDashboardDetails';
import CompletedTasks from './pages/technician/CompletedTasks';
import FranchiseRequests from './pages/franchiseRequests/FranchiseRequests';
import StationLogsPage from './pages/stations/StationLogsPage';
import Chargerhealth from './pages/chargerHealth/Chargerhealth';
import EditAlertPage from './pages/chargerHealth/EditAlertPage';
import Loadmanagement from './users/Loadmanagement';
import FileUpload from './pages/EvyaSense/FileUpload';
import SenseDashboard from './pages/EvyaSense/SenseDashboard';
const router = createBrowserRouter([
  {
    path: "/",
    element: ( <ProtectedRoute>
        <ValidationRoute>
          <Dashboard />
        </ValidationRoute>
      </ProtectedRoute>),
    children:[
      { path:"/",element:<EVChargerDashboard/>},
      { path:"/sites",element:<Sites/>},
      { path:"/add-site",element:<AddSite/>},
      { path:"/site/:id",element:<SingleSite/>},
      { path:"/editsite/:id",element:<EditSite/>},
      { path: "/stations", element: <Stations /> },
      { path: "/add-stations", element: <AddStationPage /> },
      { path: "/stations/:id", element: <StationDetails /> },
      { path: "/whitelabels", element: <WhiteLabels /> },
      { path: "/whitelabels/:id/:orgId/:orgName", element: <WhitelabelPageDetails/> },
      { path: "/franchiseOwners", element: <FranchiseOwners /> },
      { path: "/franchiseOwners/:id/:orgId/:orgName", element: <FranchisePageDetails /> },
      { path: "/evusers", element: <EVUsers /> },
      { path: "/evusers/:id", element: <EvUserPageDetails/> },
      { path: "/profiles/:type", element: <Profiles /> },
      { path: "/rfid", element: <RFIDRequests /> },
      { path: "/rfid",element: <RFIDActivate />},
      { path: "/issues-tracker", element: <IssuesTracker /> },
      { path: "/issues/:id", element: <EditIssuePage/> },
      { path: "/reports", element: <Reports /> },
      { path: "/adminProfile", element: <UserAdminProfile /> },
      { path: "/employeeProfile", element: <EmployeeProfile /> },
      { path:"/ocpp",element:<OCPP />},
      { path:"/manufacturers",element:<Manufacturers />},
      { path:"/manufacturers/:id",element:<ManufacturerDetails />},
      { path:"/addcharger/:id",element:<AddCharger/>},
      { path:"/referral-codes", element:<ReferralCodes />},
      { path:"/referral-codes/:id/edit", element:<EditReferralCode />},
      { path:"/referral-codes/:id" ,element:< ReferralCodeInfo  />},
      { path: "/loading", element:<Loadmanagement />},
      { path: "/chargerhealth", element: <Chargerhealth /> },
      { path: "/customer-support", element: <CustomerSupport/>},
      { path: "/customer-support/:id", element: <CustomerSupportDetails /> },
      { path: "/customer-support/tasks", element: <CustomerSupportTasks /> },
      { path: "/customer-support/tasks/:id", element: <CustomerSupportTaskDetails /> },
      { path: "/customer-support/add", element: <AddCustomerSupport />},
      { path: "/customer-support/edit/:id", element: <EditCustomerSupport /> },
      { path: "/customer-support/solved", element: <SolvedIssues /> },
      { path: "/customer-support/issue-details/:id", element: <IssueDetails /> },
      //pavan's
      { path: "/technician-dashboard", element: <TechnicianDashboard /> },
      { path: "/technician/tasks/:id", element: <TechnicianDashboardDetails />},
      { path: "/technician-profile", element: <TechnicianProfile />},
      { path: "/technician/tasks/completed-tasks", element:<CompletedTasks/>},
      { path: "/charger-installation-team", element: <ChargerInstallationTeam /> },
      { path: "/charger-installation-team/add", element: <AddTeamMember /> },
      { path: "/charger-installation-team/:id", element: <TeamMemberDetails /> },
      { path: "/charger-installation-team/edit/:id", element: <EditTeamMember /> },
      { path: "/fleetManagement", element: <FleetManagement />},
      { path: "/fleet/add", element: <AddFleet />},
      { path: "/fleet/:id", element: <FleetDetails /> },
      { path: "/vehicle/add", element: <AddVehicle />},
      { path: "/vehicle/:id", element: <VehicleDetails />},
      // { path: "/fleet/revenue", element: <RevenueDashboard />},
      { path: "/FranchiseRequests", element: <FranchiseRequests />},
      { path: "/sites-requests", element: <FranchiseRequests />},
      { path: "/stations-requests",element: <FranchiseRequests />},
      { path: "/stations/:id/logs", element:<StationLogsPage />},
      { path: "/edit-alert/:cpId", element:<EditAlertPage />},
      { path: "/evyasense", element: <SenseDashboard /> },
      { path: "/senseupload", element: <FileUpload /> },

    ]
  },

  {
    path: "/login",
    element: (<ValidationRoute><Login /></ValidationRoute>),
  },
  {
    path: "/register",
    element: (<ValidationRoute><Registation /></ValidationRoute>),
  },
  {
    path: "/terms",
    element: (<ValidationRoute><TermsOfUse /></ValidationRoute>),
  },
  {
    path: "/evdashboard",
    element: (
             <EvDashboardLayout/>
             ),
    children: [
              { index: true, element: <EvDashboard /> },
              { path: "/evdashboard/connecting/evpayments/chargingstatus", element: <ChargingStatus /> },
              { path: "/evdashboard/connecting/evpayments", element: <EvPayment /> }, 
              { path: "connecting", element: <EvConnecting /> }, 
              ]
  },
  {
    path: "*",
    element: (<NotFound/>),
  },
  {
    path: "/set-password",
    element: (<SetPassword/>),
  },
   {
    path: "/forgot-password",
    element: <ForgotPassword/>,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
]);

// function App() {
//   return <><RouterProvider router={router} /><Toaster/></>;
// }
function App() {
  return (
    <div className="main-content">
      <RouterProvider router={router} />
      <Toaster />
    </div>
  );
}
export default App
//app.jsx