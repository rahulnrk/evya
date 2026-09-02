import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated ,user} = useSelector(state => state.authentication);

  // Public routes
  const publicRoutes = [
    '/login', 
    '/register', 
    '/evdashboard',
    '/evdashboard/connecting',
    '/evdashboard/connecting/evpayments',
    '/evdashboard/connecting/evpayments/chargingstatus'
  ];

  if (publicRoutes.includes(location.pathname)) {
    return children;
  }

  if  (!isAuthenticated||!(Number(user?.roleId))||(Number(user?.roleId))==null) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}