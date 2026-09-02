import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ValidationRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector(state => state.authentication);
  const roleId = Number(user?.roleId);

  console.log('ValidationRoute - roleId:', roleId);

  const publicRoutes = ['/login', '/register', '/evdashboard','/terms', '/evdashboard/*'];

  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return location.pathname.startsWith(route.slice(0, -1));
    }
    return location.pathname === route;
  });

  if (isPublicRoute) {
    return children;
  }

  if (!isAuthenticated||!(Number(user?.roleId))||(Number(user?.roleId))==null) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const rolePermissions = {
    1: ['/', '/sites', '/add-site', '/site/*', '/editsite/*', '/stations', 
        '/add-stations', '/stations/*', '/whitelabels', '/whitelabels/*',
        '/franchiseOwners', '/franchiseOwners/*', '/evusers', '/evusers/*',
        '/profiles/*', '/rfid', '/issues-tracker', '/issues/*', '/reports',
        '/adminProfile', '/ocpp', '/manufacturers', '/manufacturers/*',
        '/addcharger/*', '/referral-codes', '/referral-codes/*','/edit-alert','/edit-alert/*',
        '/customer-support','/customer-support/:id','/customer-support/*',
        '/chargerhealth','/loading','/charger-installation-team','/charger-installation-team/add',
        '/charger-installation-team/edit/:id','/charger-installation-team/*',
        '/fleetManagement','/fleet/add','/fleet/revenue','/fleet/*',
        '/vehicle/add','/vehicle/*','/technician-dashboard','/technician-dashboard/:id',
        '/FranchiseRequests','/sites-requests','stations-requests',"/evyasense","/senseupload"],
    3: ['/', '/sites', '/add-site', '/site/*', '/editsite/*', '/stations',
        '/add-stations', '/stations/*',
        '/franchiseOwners', '/franchiseOwners/*', '/evusers', '/evusers/*',
        '/profiles/*', '/rfid', '/issues-tracker', '/issues/*', '/reports',
        '/adminProfile', '/ocpp',  '/manufacturers', '/manufacturers/*','/loading',
        '/addcharger/*', '/referral-codes', '/referral-codes/*', '/edit-alert','/edit-alert/*',
        '/chargerhealth','/customer-support', '/customer-support/*', '/customer-support/:id',
       '/FranchiseRequests'],
    4: ['/', '/sites', '/add-site', '/site/*', '/editsite/*', '/stations',
        '/add-stations', '/stations/*','/issues-tracker', '/issues/*', '/reports',
        '/adminProfile', '/edit-alert','/edit-alert/*','/chargerhealth'],
    6: (() => {
    const designation = user?.designation?.toLowerCase();
    if (designation?.includes("customer support")) {
return [
  '/employeeProfile',
    '/customer-support/tasks',
    '/customer-support/tasks/:id',
    '/customer-support/tasks*',
        '/customer-support/solved'
  ];    }
    if (designation?.includes("charger installer")) {
      return [ '/employeeProfile','/technician-dashboard','/technician-profile','completed-tasks','/technician/tasks/*',];
    }
    return [];
  }
)() 
  };

  const isAllowed = rolePermissions[roleId]?.some(route => {
    if (route.endsWith('*')) {
      return location.pathname.startsWith(route.slice(0, -1));
    }
    return location.pathname === route;
  });

  if (!isAllowed) {
    return <Navigate to='/*' replace />;
  }
  return children;
}