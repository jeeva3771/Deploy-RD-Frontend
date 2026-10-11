import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { fetchUserDashboard } from '../../reducer/dashboardReducer';
import { useDispatch, useSelector } from 'react-redux';
import Spinner from '../../utils/spinners/Spinner';

export default function UserRoute() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user: authUser } = useSelector(state => state.auth);
  const { userDashboard, isLoading, error } = useSelector(state => state.dashboard);

  const currentUser = authUser || JSON.parse(localStorage.getItem('user'));
  const isOnlyProfile = currentUser?.only_profile === true;
  const location = useLocation();
  const currentPath = location.pathname;

  // Fetch dashboard data once when component mounts
  useEffect(() => {
    if (isAuthenticated && token && !userDashboard && !isLoading && !isOnlyProfile) {
      dispatch(fetchUserDashboard());
    }
  }, [dispatch, isAuthenticated, token, userDashboard, isLoading, isOnlyProfile]);

  // Not authenticated
  if (!isAuthenticated || !token) {
    return <Navigate to="/" replace />;
  }

  // Check for only_profile restriction early
  if (isOnlyProfile && currentPath !== '/user-profile') {
    return <Navigate to="/user-profile" replace />;
  }

  // Show loading spinner while fetching dashboard
  if (isLoading && !userDashboard) {
    return <Spinner path="" />;
  }

  // Error fetching dashboard
  if (error) {
    console.error("Dashboard fetch error:", error);
    return <Navigate to="/" replace />;
  }

  // Check if user is authorized based on dashboard response
  if (userDashboard && userDashboard.ok !== true) {
    console.warn("User not authorized to access dashboard");
    return <Navigate to="/" replace />;
  }

  // Authorized - render protected routes
  return <Outlet />;
}