// Find your existing config.js file and replace it with this:

import axios, { AxiosError } from 'axios';

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: backendUrl
});

// Request interceptor - add token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ADD THIS NEW CODE - Response interceptor to handle 401 errors
let isHandling401 = false;

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !isHandling401) {
      isHandling401 = true;

      // Clear auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      // window.location.href = '/';

      setTimeout(() => {
        isHandling401 = false;
      }, 1000);
    }

    return Promise.reject(error);
  }
);

// Export AxiosError for use in error handling
export { AxiosError };