import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/auth/login",
        credentials
      );
      const { token, user } = response.data;
      return { token, user };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Login failed"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const validateSession = createAsyncThunk(
  "auth/validateSession",
  async ({ Id, uuID }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/auth/session-service",
        { Id, uuID }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Session validation failed"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  token: localStorage.getItem("token") || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem("token"),
  error: null,
  successMessage: null,
  sessionValid: false,
};

// Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.sessionValid = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.successMessage = "Login successful";

				localStorage.setItem("token", action.payload.token);
      	localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Validate Session
    builder
      .addCase(validateSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionValid = action.payload.status;
        if (!action.payload.status) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(validateSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.sessionValid = false;
      });
  },
});

export const { logout, clearError, clearSuccess } = authSlice.actions;
export default authSlice.reducer;
