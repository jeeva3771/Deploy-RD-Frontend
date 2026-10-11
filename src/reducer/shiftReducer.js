import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Bulk assign shift to multiple users
export const bulkAssignShift = createAsyncThunk(
  "shiftRoster/bulkAssignShift",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/shift-roster/bulk-assign",
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to assign shifts"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Get shift roster overview with optional filters
export const getShiftRosterOverview = createAsyncThunk(
  "shiftRoster/getShiftRosterOverview",
  async ({ department_id, shift_time_id } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (department_id) params.department_id = department_id;
      if (shift_time_id) params.shift_time_id = shift_time_id;

      const response = await axiosInstance.get("/shift-roster/overview", {
        params,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch roster overview"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// View detailed shift assignment for a specific user
export const viewUserShiftDetails = createAsyncThunk(
  "shiftRoster/viewUserShiftDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/shift-roster/view/${userId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch user shift details"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Get shift assignment history for a specific user
export const getShiftAssignmentHistory = createAsyncThunk(
  "shiftRoster/getShiftAssignmentHistory",
  async ({ userId, limit, skip }, { rejectWithValue }) => {
    try {
      const params = {};
      if (limit) params.limit = limit;
      if (skip) params.skip = skip;

      const response = await axiosInstance.get(
        `/shift-roster/history/${userId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to fetch shift assignment history"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Get available users for team builder
export const getUsersForTeamBuilder = createAsyncThunk(
  "shiftRoster/getUsersForTeamBuilder",
  async ({ department_id, shift_time_id } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (department_id) params.department_id = department_id;
      if (shift_time_id) params.shift_time_id = shift_time_id;

      const response = await axiosInstance.get("/team-builder/users", {
        params,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to fetch users for team builder"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Update shift assignment
export const updateShiftAssignment = createAsyncThunk(
  "shiftRoster/updateShiftAssignment",
  async ({ assignmentId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/shift-roster/update/${assignmentId}`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update assignment"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

/**
 * Deactivate shift assignment
 */
export const deactivateShiftAssignment = createAsyncThunk(
  "shiftRoster/deactivateShiftAssignment",
  async (assignmentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(
        `/shift-roster/deactivate/${assignmentId}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to deactivate assignment"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

/**
 * Get department shift summary
 */
export const getDepartmentShiftSummary = createAsyncThunk(
  "shiftRoster/getDepartmentShiftSummary",
  async (departmentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/shift-roster/department-summary/${departmentId}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch department summary"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// ==================== INITIAL STATE ====================
const initialState = {
  rosterData: [],
  userShiftDetails: null,
  assignmentHistory: null,
  availableUsers: [],
  departmentSummary: null,
  isLoading: false,
  error: null,
  successMessage: null,
  filters: {
    department_id: "",
    shift_time_id: "",
  },
};

// ==================== SLICE ====================
const shiftRosterSlice = createSlice({
  name: "shiftRoster",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearUserShiftDetails: (state) => {
      state.userShiftDetails = null;
    },
    clearAssignmentHistory: (state) => {
      state.assignmentHistory = null;
    },
    clearDepartmentSummary: (state) => {
      state.departmentSummary = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        department_id: "",
        shift_time_id: "",
      };
    },
  },
  extraReducers: (builder) => {
    // Bulk Assign Shift
    builder
      .addCase(bulkAssignShift.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkAssignShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage =
          action.payload.message || "Shifts assigned successfully";
      })
      .addCase(bulkAssignShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Shift Roster Overview
    builder
      .addCase(getShiftRosterOverview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShiftRosterOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rosterData = action.payload.data || [];
        state.successMessage = "Roster data fetched successfully";
      })
      .addCase(getShiftRosterOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // View User Shift Details
    builder
      .addCase(viewUserShiftDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(viewUserShiftDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userShiftDetails = action.payload.data || action.payload;
        state.successMessage = "User shift details fetched successfully";
      })
      .addCase(viewUserShiftDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Shift Assignment History
    builder
      .addCase(getShiftAssignmentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShiftAssignmentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assignmentHistory = action.payload.data || action.payload;
        state.successMessage = "Assignment history fetched successfully";
      })
      .addCase(getShiftAssignmentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Users for Team Builder
    builder
      .addCase(getUsersForTeamBuilder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUsersForTeamBuilder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableUsers = action.payload.data || [];
        state.successMessage = "Available users fetched successfully";
      })
      .addCase(getUsersForTeamBuilder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Shift Assignment
    builder
      .addCase(updateShiftAssignment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateShiftAssignment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage =
          action.payload.message || "Assignment updated successfully";
      })
      .addCase(updateShiftAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Deactivate Shift Assignment
    builder
      .addCase(deactivateShiftAssignment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateShiftAssignment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage =
          action.payload.message || "Assignment deactivated successfully";
      })
      .addCase(deactivateShiftAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Department Shift Summary
    builder
      .addCase(getDepartmentShiftSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDepartmentShiftSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departmentSummary = action.payload.data || action.payload;
        state.successMessage = "Department summary fetched successfully";
      })
      .addCase(getDepartmentShiftSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  clearUserShiftDetails,
  clearAssignmentHistory,
  clearDepartmentSummary,
  setFilters,
  resetFilters,
} = shiftRosterSlice.actions;

export default shiftRosterSlice.reducer;
