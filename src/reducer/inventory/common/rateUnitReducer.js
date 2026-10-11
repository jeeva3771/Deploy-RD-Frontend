import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../utils/url/config";

// Async Thunks
export const fetchAllRateUnits = createAsyncThunk(
  "rateUnits/fetchAllRateUnits",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/rateunit", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createRateUnit = createAsyncThunk(
  "rateUnits/createRateUnit",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/rateunit`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRateUnit = createAsyncThunk(
  "rateUnits/updateRateUnit",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/rateunit/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteRateUnit = createAsyncThunk(
  "rateUnits/deleteRateUnit",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/rateunit/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  rateUnits: [],
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
  },
  sortConfig: {
    key: "created_at",
    direction: "desc",
  },
  error: null,
};

// Slice
const rateUnitSlice = createSlice({
  name: "rateUnits",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { search: "" };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination: (state) => {
      state.pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
    },
    setSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },
    resetSortConfig: (state) => {
      state.sortConfig = { key: "created_at", direction: "desc" };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchAllRateUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRateUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.rateUnits = action.payload.data || [];
        state.pagination.total = action.payload.count || 0;
      })
      .addCase(fetchAllRateUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Create
    builder
      .addCase(createRateUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRateUnit.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.rateUnits.unshift(action.payload.data);
          state.pagination.total += 1;
        }
      })
      .addCase(createRateUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Update
    builder
      .addCase(updateRateUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRateUnit.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const index = state.rateUnits.findIndex(
            (item) => item.id === action.payload.data.id
          );
          if (index !== -1) {
            state.rateUnits[index] = action.payload.data;
          }
        }
      })
      .addCase(updateRateUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Delete
    builder
      .addCase(deleteRateUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRateUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.rateUnits = state.rateUnits.filter(
          (item) => item.id !== action.payload.id
        );
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteRateUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  resetPagination,
  setSortConfig,
  resetSortConfig,
  clearError,
} = rateUnitSlice.actions;

export default rateUnitSlice.reducer;
