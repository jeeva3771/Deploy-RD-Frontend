import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllProcesses = createAsyncThunk(
  "process/getAllProcesses",
  async ({ is_active, order, department, params = {} }, { rejectWithValue }) => {
    try {
      const queryParams = {
        is_active,
        order,
        department,
        ...params
      };

      const response = await axiosInstance.get("/process", { params: queryParams });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch processes"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const getProcessById = createAsyncThunk(
  "process/getProcessById",
  async (processId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/process/${processId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch process"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createProcess = createAsyncThunk(
  "process/createProcess",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/process/", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to create process"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateProcess = createAsyncThunk(
  "process/updateProcess",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/process/${id}`, formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update process"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteProcess = createAsyncThunk(
  "process/deleteProcess",
  async (processId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/process/${processId}`);
      return { processId, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete process"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Check Service Category Exists
export const checkServiceCategoryExists = createAsyncThunk(
  "process/checkServiceCategoryExists",
  async (serviceCategoryId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/process/check-service-exist?service_category=${serviceCategoryId}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to check service category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  processes: [],
  singleProcess: null,
  isLoading: false,
  error: null,
  successMessage: null,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    process: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
  // Service Category Check State
  serviceCategoryCheck: {
    isChecking: false,
    exists: null,
    message: null,
  },
};

// Process Slice
const processSlice = createSlice({
  name: "process",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSingleProcess: (state) => {
      state.singleProcess = null;
    },
    // Set sort configuration
    setSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },
    // Reset sort configuration
    resetSortConfig: (state) => {
      state.sortConfig = {
        key: null,
        direction: "asc",
      };
    },
    // Reset pagination
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 5,
      };
    },
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        search: "",
        process: "",
        is_active: "",
        type: "",
      };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Clear service category check state
    clearServiceCategoryCheck: (state) => {
      state.serviceCategoryCheck = {
        isChecking: false,
        exists: null,
        message: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Get All Processes
    builder
      .addCase(getAllProcesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllProcesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.processes = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        state.successMessage = "Processes fetched successfully";
      })
      .addCase(getAllProcesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Process By ID
    builder
      .addCase(getProcessById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProcessById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleProcess = action.payload.data || action.payload;
        state.successMessage = "Process fetched successfully";
      })
      .addCase(getProcessById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Process
    builder
      .addCase(createProcess.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProcess.fulfilled, (state, action) => {
        state.isLoading = false;
        state.processes.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "Process created successfully";
      })
      .addCase(createProcess.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Process
    builder
      .addCase(updateProcess.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProcess.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedProcessData = action.payload.data || action.payload;
        const index = state.processes.findIndex(
          (proc) => proc.id === updatedProcessData.id
        );
        if (index !== -1) {
          state.processes[index] = updatedProcessData;
        }
        state.singleProcess = updatedProcessData;
        state.successMessage =
          action.payload.message || "Process updated successfully";
      })
      .addCase(updateProcess.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Process
    builder
      .addCase(deleteProcess.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProcess.fulfilled, (state, action) => {
        state.isLoading = false;
        state.processes = state.processes.filter(
          (proc) => proc.id !== action.payload.processId
        );
        state.successMessage =
          action.payload.message || "Process deleted successfully";
      })
      .addCase(deleteProcess.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Check Service Category Exists
    builder
      .addCase(checkServiceCategoryExists.pending, (state) => {
        state.serviceCategoryCheck.isChecking = true;
        state.serviceCategoryCheck.exists = null;
        state.serviceCategoryCheck.message = null;
      })
      .addCase(checkServiceCategoryExists.fulfilled, (state, action) => {
        state.serviceCategoryCheck.isChecking = false;
        state.serviceCategoryCheck.exists = action.payload.exists;
        state.serviceCategoryCheck.message = action.payload.message;
      })
      .addCase(checkServiceCategoryExists.rejected, (state, action) => {
        state.serviceCategoryCheck.isChecking = false;
        state.serviceCategoryCheck.exists = null;
        state.serviceCategoryCheck.message = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  clearSingleProcess,
  setFilters,
  resetFilters,
  setPagination,
  setSortConfig,
  resetSortConfig,
  resetPagination,
  clearServiceCategoryCheck
} = processSlice.actions;

export default processSlice.reducer;