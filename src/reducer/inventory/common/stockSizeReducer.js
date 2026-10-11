import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../utils/url/config";

// Async Thunks
export const fetchAllStockSizes = createAsyncThunk(
  "stockSize/fetchAllStockSizes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/stocksizes", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createStockSize = createAsyncThunk(
  "stockSize/createStockSize",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/stocksizes`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateStockSize = createAsyncThunk(
  "stockSize/updateStockSize",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/stocksizes/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteStockSize = createAsyncThunk(
  "stockSize/deleteStockSize",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/stocksizes/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  stockSizes: [],
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
const stockSizeSlice = createSlice({
  name: "stockSize",
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
      .addCase(fetchAllStockSizes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStockSizes.fulfilled, (state, action) => {
        state.loading = false;
        state.stockSizes = action.payload.data || [];
        state.pagination.total = action.payload.count || 0;
      })
      .addCase(fetchAllStockSizes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Create
    builder
      .addCase(createStockSize.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStockSize.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.stockSizes.unshift(action.payload.data);
          state.pagination.total += 1;
        }
      })
      .addCase(createStockSize.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Update
    builder
      .addCase(updateStockSize.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStockSize.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const index = state.stockSizes.findIndex(
            (item) => item.id === action.payload.data.id
          );
          if (index !== -1) {
            state.stockSizes[index] = action.payload.data;
          }
        }
      })
      .addCase(updateStockSize.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Delete
    builder
      .addCase(deleteStockSize.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStockSize.fulfilled, (state, action) => {
        state.loading = false;
        state.stockSizes = state.stockSizes.filter(
          (item) => item.id !== action.payload.id
        );
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteStockSize.rejected, (state, action) => {
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
} = stockSizeSlice.actions;

export default stockSizeSlice.reducer;
