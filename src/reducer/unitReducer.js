import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all units with filters and pagination
export const fetchAllUnits = createAsyncThunk(
  "unit/fetchAllUnits",
  async ({is_active=true, category = null, params = {}}, { rejectWithValue }) => {
    try {
      const config = {
        params
      };
      const response = await axiosInstance.get(`/units?is_active=${is_active}&category=${category}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single unit by ID
export const fetchUnitById = createAsyncThunk(
  "unit/fetchUnitById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/units/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new unit
export const createUnit = createAsyncThunk(
  "unit/createUnit",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/units', formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update unit
export const updateUnit = createAsyncThunk(
  "unit/updateUnit",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/units/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete unit
export const deleteUnit = createAsyncThunk(
  "unit/deleteUnit",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/units/${id}`);
      return id; // Return the ID of deleted unit
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  units: [],
  selectedUnit: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    category: "",
    is_active: "",
  },
  sortConfig: {
    key: null,
    direction: "",
  },
};

// Slice
const unitSlice = createSlice({
  name: "unit",
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
        category: "",
        is_active: "",
      };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Clear selected unit
    clearSelectedUnit: (state) => {
      state.selectedUnit = null;
    },
    // Clear units list
    clearUnits: (state) => {
      state.units = [];
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
    // Fetch All Units
    builder
      .addCase(fetchAllUnits.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllUnits.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Unit By ID
    builder
      .addCase(fetchUnitById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnitById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUnit = action.payload;
      })
      .addCase(fetchUnitById.rejected, (state) => {
        state.loading = false;
        state.selectedUnit = null;
      });

    // Create Unit
    builder
      .addCase(createUnit.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.units.unshift(action.payload); // Add new unit to the beginning
        state.pagination.total += 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createUnit.rejected, (state) => {
        state.loading = false;
      });

    // Update Unit
    builder
      .addCase(updateUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUnit.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.units.findIndex(
          (unit) => unit.id === action.payload.id
        );
        if (index !== -1) {
          state.units[index] = action.payload;
        }
        state.selectedUnit = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateUnit.rejected, (state) => {
        state.loading = false;
      });

    // Delete Unit
    builder
      .addCase(deleteUnit.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.units = state.units.filter((unit) => unit.id !== action.payload);
        state.selectedUnit = null;
        state.pagination.total -= 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteUnit.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedUnit,
  clearUnits,
  setSortConfig,
  resetSortConfig,
  resetPagination,
} = unitSlice.actions;

export default unitSlice.reducer;