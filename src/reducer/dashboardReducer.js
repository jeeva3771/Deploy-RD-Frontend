import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";
import { logout } from "./authReducer";

// Async Thunk for fetching user dashboard
export const fetchUserDashboard = createAsyncThunk(
  "dashboard/fetchUserDashboard",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      // Get token from auth state
      const state = getState();
      const token = state.auth.token;

      if (!token) {
        dispatch(logout());
        return rejectWithValue("No authentication token found");
      }

      // Make API call with Authorization header
      const response = await axiosInstance.get(
        "/auth/userdashboard");

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "";
      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("auth")
      ) {
        dispatch(logout());
      }

      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch dashboard"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Async Thunk for fetching Admin Executive dashboard
export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/fetchAdminDashboard",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      if (!token) {
        dispatch(logout());
        return rejectWithValue("No authentication token found");
      }

      const response = await axiosInstance.get(
        "/auth/admindashboard");

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "";
      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("auth")
      ) {
        dispatch(logout());
      }

      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch Admin Executive dashboard"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  userDashboard: null,
  adminDashboard: null,
  isLoading: false,
  error: null,
  successMessage: null,
};

// Dashboard Slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    resetDashboard: (state) => {
      state.userDashboard = null;
      state.adminDashboard = null;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch User Dashboard
    builder
      .addCase(fetchUserDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userDashboard = action.payload;
        state.successMessage = "Dashboard data loaded successfully";
      })
      .addCase(fetchUserDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.userDashboard = null;
      });

    // Fetch Admin Dashboard
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminDashboard = action.payload;
        state.successMessage = "Admin Executive dashboard data loaded successfully";
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.adminDashboard = null;
      });
  },
});

export const { clearError, clearSuccess, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
