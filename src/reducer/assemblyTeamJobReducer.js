import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const createTeamProductionJob = createAsyncThunk(
  "teamProduction/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assembly-job/assign", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTeamProductionJobs = createAsyncThunk(
  "teamProduction/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/assembly-job/all", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const reassignTeamProductionJob = createAsyncThunk(
  "teamProduction/reassign",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assembly-job/reassign", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const acknowledgeDateChange = createAsyncThunk(
  "teamProduction/acknowledgeDate",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assembly-job/acknowledge-date", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const acknowledgeQtyChange = createAsyncThunk(
  "teamProduction/acknowledgeQty",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assembly-job/acknowledge-qty", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Reallocate: deactivates old card(s) and creates new assignment records.
// With source_job_id: only deactivates that specific card (Edit → split).
// Without source_job_id: deactivates ALL active cards for the SO (full plan redesign).
export const reallocateTeamProductionJob = createAsyncThunk(
  "teamProduction/reallocate",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assembly-job/reallocate", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const acknowledgeNotHeadAlert = createAsyncThunk(
  "teamProduction/acknowledgeNotHead",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assembly-job/acknowledge-not-head", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  teamJobs: [],         // All jobs or filtered team jobs
  unassignedJobs: [],   // specifically for the unassigned list
  unassignedPagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1
  },
  loading: false,
  error: null,
  createSuccess: false
};

const teamProductionSlice = createSlice({
  name: "teamProduction",
  initialState,
  reducers: {
    resetCreateStatus: (state) => {
      state.createSuccess = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createTeamProductionJob.pending, (state) => {
        state.loading = true;
        state.createSuccess = false;
      })
      .addCase(createTeamProductionJob.fulfilled, (state) => {
        state.loading = false;
        state.createSuccess = true;
      })
      .addCase(createTeamProductionJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch
      .addCase(fetchTeamProductionJobs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeamProductionJobs.fulfilled, (state, action) => {
        state.loading = false;

        // Check if this was a request for unassigned jobs only
        // The action.meta.arg contains the params passed to fetchTeamProductionJobs
        if (action.meta.arg?.unassigned === true || action.meta.arg?.unassigned === 'true') {
          state.unassignedJobs = action.payload.data || [];
          state.unassignedPagination = {
            totalItems: action.payload.totalCount || action.payload.data?.length || 0,
            totalPages: action.payload.totalPages || 1,
            currentPage: action.meta.arg?.page || 1
          };
        } else {
          // This is a general fetch for the lanes
          state.teamJobs = action.payload.data || [];
        }
      })
      .addCase(fetchTeamProductionJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reallocate (Edit → split or full plan redesign)
      .addCase(reallocateTeamProductionJob.pending, (state) => {
        state.loading = true;
      })
      .addCase(reallocateTeamProductionJob.fulfilled, (state) => {
        state.loading = false;
        state.createSuccess = true;
      })
      .addCase(reallocateTeamProductionJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetCreateStatus } = teamProductionSlice.actions;
export default teamProductionSlice.reducer;