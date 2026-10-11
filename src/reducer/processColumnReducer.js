import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all process columns with filters and pagination
export const fetchAllProcessColumns = createAsyncThunk(
  "processColumn/fetchAllProcessColumns",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/processcolumn', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single process column by ID
export const fetchProcessColumnById = createAsyncThunk(
  "processColumn/fetchProcessColumnById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/processcolumn/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new process column
export const createProcessColumn = createAsyncThunk(
  "processColumn/createProcessColumn",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/processcolumn', formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update process column
export const updateProcessColumn = createAsyncThunk(
  "processColumn/updateProcessColumn",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/processcolumn/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete process column
export const deleteProcessColumn = createAsyncThunk(
  "processColumn/deleteProcessColumn",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/processcolumn/${id}`);
      return id; // Return the ID of deleted process column
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all process columns (for dropdowns)
export const getAllProcessColumns = createAsyncThunk(
  "processColumn/getAllProcessColumns",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/processcolumn', { params });
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  processColumns: [],
  selectedProcessColumn: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    is_active: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Slice
const processColumnSlice = createSlice({
  name: "processColumn",
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        search: "",
        is_active: "",
      };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Clear selected process column
    clearSelectedProcessColumn: (state) => {
      state.selectedProcessColumn = null;
    },
    // Clear process columns list
    clearProcessColumns: (state) => {
      state.processColumns = [];
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
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch All Process Columns
    builder
      .addCase(fetchAllProcessColumns.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProcessColumns.fulfilled, (state, action) => {
        state.loading = false;
        state.processColumns = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllProcessColumns.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Process Column By ID
    builder
      .addCase(fetchProcessColumnById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProcessColumnById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProcessColumn = action.payload;
      })
      .addCase(fetchProcessColumnById.rejected, (state) => {
        state.loading = false;
        state.selectedProcessColumn = null;
      });

    // Create Process Column
    builder
      .addCase(createProcessColumn.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProcessColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.processColumns.unshift(action.payload); // Add new process column to the beginning
        state.pagination.total += 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createProcessColumn.rejected, (state) => {
        state.loading = false;
      });

    // Update Process Column
    builder
      .addCase(updateProcessColumn.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProcessColumn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.processColumns.findIndex(
          (pc) => pc.id === action.payload.id
        );
        if (index !== -1) {
          state.processColumns[index] = action.payload;
        }
        state.selectedProcessColumn = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateProcessColumn.rejected, (state) => {
        state.loading = false;
      });

    // Delete Process Column
    builder
      .addCase(deleteProcessColumn.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProcessColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.processColumns = state.processColumns.filter(
          (pc) => pc.id !== action.payload
        );
        state.selectedProcessColumn = null;
        state.pagination.total -= 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteProcessColumn.rejected, (state) => {
        state.loading = false;
      });

    // Get All Process Columns (for dropdowns)
    builder
      .addCase(getAllProcessColumns.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllProcessColumns.fulfilled, (state, action) => {
        state.loading = false;
        state.processColumns = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(getAllProcessColumns.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedProcessColumn,
  clearProcessColumns,
  setSortConfig,
  resetSortConfig,
  resetPagination
} = processColumnSlice.actions;

export default processColumnSlice.reducer;