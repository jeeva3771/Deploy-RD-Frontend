import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { axiosInstance, backendUrl } from "../utils/url/config";
// import { useAuth } from "./auth";
import { useSelector } from "react-redux";

const PriorityColorContext = createContext();

export const PriorityColorProvider = ({ children }) => {
  // const { auth } = useAuth();

  const { token, isAuthenticated } = useSelector(state => state.auth);

  const [priorityColors, setPriorityColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Define routes where API should be called
  const allowedRoutes = ["/enquiries", "/designerenquiry", "/accounts", "/sampleorder", "/productionorder", "/quotation", "/operation-planning", "/dtp-studio", "/shopfloor", "/job-ledger"];

  const shouldFetch = allowedRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const fetchPriorityColors = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${backendUrl}/priorityclr`);
      if (response.data.success) {
        setPriorityColors(response.data.data || []);
      } else {
        console.error("Failed to fetch:", response.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CHANGE auth?.token TO token:
    if (shouldFetch && token && isAuthenticated) {
      fetchPriorityColors();
    }
  }, [shouldFetch, location.pathname, token, isAuthenticated]);

  return (
    <PriorityColorContext.Provider
      value={{ priorityColors, loading, error, refresh: fetchPriorityColors }}
    >
      {children}
    </PriorityColorContext.Provider>
  );
};

export const usePriorityColors = () => useContext(PriorityColorContext);
