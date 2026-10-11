import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { validateSession, logout } from "../../reducer/authReducer";
import { resetDashboard } from "../../reducer/dashboardReducer";
import { decodeJwt } from "../helper/jwtHelper";

const RouteGuard = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  const { token, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const validateUserSession = async () => {
      const currentPath = window.location.pathname;

      // Not authenticated - redirect dashboard to login
      if (!isAuthenticated || !token) {
        if (currentPath.startsWith("/dashboard")) {
          navigate("/", { replace: true });
        }
        setChecking(false);
        return;
      }

      // Authenticated but on login page - redirect to dashboard
      if (isAuthenticated && currentPath === "/") {
        navigate("/dashboard", { replace: true });
        setChecking(false);
        return;
      }

      // Authenticated and on dashboard - validate session
      if (isAuthenticated && currentPath.startsWith("/dashboard")) {
        try {
          const decoded = decodeJwt(token);
          if (!decoded) {
            // Invalid token
            dispatch(logout());
            dispatch(resetDashboard());
            navigate("/", { replace: true });
            setChecking(false);
            return;
          }

          const { id, uuid } = decoded;

          // Validate session with backend
          const result = await dispatch(validateSession({ Id: id, uuID: uuid })).unwrap();

          if (!result.status) {
            // Session invalid - logout
            dispatch(logout());
            dispatch(resetDashboard());
            navigate("/", { replace: true });
          }
        } catch (error) {
          console.error("Session validation failed:", error);
          dispatch(logout());
          dispatch(resetDashboard());
          navigate("/", { replace: true });
        }
      }

      setChecking(false);
    };

    validateUserSession();
  }, [navigate, dispatch, token, isAuthenticated]);

  if (checking) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        Checking session...
      </div>
    );
  }

  return children;
};

export default RouteGuard;
