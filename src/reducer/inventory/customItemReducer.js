import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../utils/url/config";

// ASYNC THUNKS
// Fetch all custom items with pagination, search, and sorting
export const fetchAllCustomItems = createAsyncThunk(
  "customItems/fetchAllCustomItems",
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      const response = await axiosInstance.get("/custom-item", { params, signal });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'canceled') {
        return rejectWithValue("aborted");
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch custom item stock by array of IDs
export const fetchCustomItemsStockByIds = createAsyncThunk(
  "customItems/fetchCustomItemsStockByIds",
  async (ids, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/custom-item/stock", { ids });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new custom item
export const createCustomItem = createAsyncThunk(
  "customItems/createCustomItem",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/custom-item", formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update custom item
export const updateCustomItem = createAsyncThunk(
  "customItems/updateCustomItem",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/custom-item/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete custom item
export const deleteCustomItem = createAsyncThunk(
  "customItems/deleteCustomItem",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/custom-item/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// INITIAL STATE
const initialState = {
  customItems: [],
  stats: {
    totalStockUnits: 0,
    totalStockValue: 0
  },
  selectedCustomItem: null,
  loading: false,

  // Pagination
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },

  // Filters
  filters: {
    search: "",
    category: "",
  },

  // Sorting
  sortConfig: {
    key: null,
    direction: "asc",
  },

  error: null,
};

// SLICE
const customItemsSlice = createSlice({
  name: "customItems",
  initialState,
  reducers: {
    // Set filters
    setCustomFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Reset filters
    resetCustomFilters: (state) => {
      state.filters = {
        search: "",
        category: "",
      };
    },

    setCustomDefaultLimit: (state, action) => {
      state.pagination.limit = action.payload; // 5 or 10
    },

    // Set pagination
    setCustomPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Clear selected item
    clearSelectedCustomItem: (state) => {
      state.selectedCustomItem = null;
    },

    // Set sort configuration
    setCustomSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },

    // Reset sort configuration
    resetCustomSortConfig: (state) => {
      state.sortConfig = {
        key: null,
        direction: "asc",
      };
    },

    // Clear error
    clearCustomError: (state) => {
      state.error = null;
    },

    // Reset pagination
    resetCustomPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
      };
    },
  },

  extraReducers: (builder) => {
    // Fetch All Custom Items
    builder
      .addCase(fetchAllCustomItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCustomItems.fulfilled, (state, action) => {
        state.loading = false;
        state.customItems = action.payload.data || [];
        state.stats = action.payload.stats || {
          totalStockUnits: 0,
          totalStockValue: 0
        };
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllCustomItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Create Custom Item
    builder
      .addCase(createCustomItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomItem.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(createCustomItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Update Custom Item
    builder
      .addCase(updateCustomItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomItem.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(updateCustomItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Delete Custom Item
    builder
      .addCase(deleteCustomItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomItem.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(deleteCustomItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

// EXPORT ACTIONS
export const {
  setCustomFilters,
  resetCustomFilters,
  setCustomDefaultLimit,
  setCustomPagination,
  resetCustomPagination,
  clearSelectedCustomItem,
  setCustomSortConfig,
  resetCustomSortConfig,
  clearCustomError,
} = customItemsSlice.actions;

// EXPORT REDUCER
export default customItemsSlice.reducer;
