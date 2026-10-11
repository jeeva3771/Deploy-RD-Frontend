import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../utils/url/config";

// ASYNC THUNKS
// Fetch all items with pagination, search, filters, and sorting
export const fetchAllItems = createAsyncThunk(
  "items/fetchAllItems",
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      const response = await axiosInstance.get("/item", { params, signal });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'canceled') {
        return rejectWithValue("aborted");
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch item stock by array of IDs
export const fetchItemsStockByIds = createAsyncThunk(
  "items/fetchItemsStockByIds",
  async (ids, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/item/stock", { ids });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single item by ID
export const fetchItemById = createAsyncThunk(
  "items/fetchItemById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/item/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new item
export const createItem = createAsyncThunk(
  "items/createItem",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/item", formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update item
export const updateItem = createAsyncThunk(
  "items/updateItem",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/item/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete item
export const deleteItem = createAsyncThunk(
  "items/deleteItem",
  async ({ id }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/item/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Bulk upload items
export const bulkUploadItems = createAsyncThunk(
  "items/bulkUploadItems",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/item/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Download item sample template
export const downloadItemSampleTemplate = createAsyncThunk(
  "items/downloadItemSampleTemplate",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/item/sample-template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Inventory_Item_Bulk_Upload_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// INITIAL STATE
const initialState = {
  items: [],
  stats: {
    totalStockUnits: 0,
    lowStockItems: 0,
    totalStockValue: 0
  },
  selectedItem: null,
  loading: false,
  optionsLoading: false,

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
const itemsSlice = createSlice({
  name: "items",
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
      };
    },

    setDefaultLimit: (state, action) => {
      state.pagination.limit = action.payload; // 5 or 10
    },

    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Clear selected item
    clearSelectedItem: (state) => {
      state.selectedItem = null;
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

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset pagination
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
      };
    },
  },

  extraReducers: (builder) => {
    // Fetch All Items
    builder
      .addCase(fetchAllItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.stats = action.payload.stats || {
          totalStockUnits: 0,
          lowStockItems: 0,
          totalStockValue: 0
        };
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: typeof action.payload.limit === 'number' ? action.payload.limit : state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        // state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(fetchAllItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Fetch Item By ID
    builder
      .addCase(fetchItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.loading = false;
        state.selectedItem = null;
        state.error = action.payload || action.error?.message;
      });

    // Create Item
    builder
      .addCase(createItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.loading = false;
        // state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Update Item
    builder
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.loading = false;
        // state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Delete Item
    builder
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.loading = false;
        // // Don't update list - will refetch
        // state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

// EXPORT ACTIONS
export const {
  setFilters,
  resetFilters,
  setPagination,
  resetPagination,
  clearSelectedItem,
  setSortConfig,
  resetSortConfig,
  clearError,
} = itemsSlice.actions;

// EXPORT REDUCER
export default itemsSlice.reducer;
