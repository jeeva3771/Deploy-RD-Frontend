import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all vendors with filters and pagination
export const fetchAllVendors = createAsyncThunk(
  "vendor/fetchAllVendors",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/vendor", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single vendor by ID
export const fetchVendorById = createAsyncThunk(
  "vendor/fetchVendorById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/vendor/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new vendor
export const createVendor = createAsyncThunk(
  "vendor/createVendor",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/vendor", formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update vendor
export const updateVendor = createAsyncThunk(
  "vendor/updateVendor",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/vendor/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete vendor
export const deleteVendor = createAsyncThunk(
  "vendor/deleteVendor",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/vendor/${id}`);
      return id; // Return the ID of deleted vendor
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all vendors name (for dropdowns)
export const getAllVendors = createAsyncThunk(
  "vendor/getAllVendors",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/vendor/name", { params });
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  vendors: [],
  selectedVendor: null,
  serviceCategories: [],
  contractTypes: [],
  loading: false,
  optionsLoading: false,
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
const vendorSlice = createSlice({
  name: "vendor",
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
    // Clear selected vendor
    clearSelectedVendor: (state) => {
      state.selectedVendor = null;
    },
    // Clear vendors list
    clearVendors: (state) => {
      state.vendors = [];
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
  },
  extraReducers: (builder) => {
    // Fetch All Vendors
    builder
      .addCase(fetchAllVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllVendors.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Vendor By ID
    builder
      .addCase(fetchVendorById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendorById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVendor = action.payload;
      })
      .addCase(fetchVendorById.rejected, (state) => {
        state.loading = false;
        state.selectedVendor = null;
      });

    // Create Vendor
    builder
      .addCase(createVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors.unshift(action.payload); // Add new vendor to the beginning
        state.pagination.total += 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createVendor.rejected, (state) => {
        state.loading = false;
      });

    // Update Vendor
    builder
      .addCase(updateVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vendors.findIndex(
          (vendor) => vendor._id === action.payload._id
        );
        if (index !== -1) {
          state.vendors[index] = action.payload;
        }
        state.selectedVendor = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateVendor.rejected, (state) => {
        state.loading = false;
      });

    // Delete Vendor
    builder
      .addCase(deleteVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = state.vendors.filter(
          (vendor) => vendor._id !== action.payload
        );
        state.selectedVendor = null;
        state.pagination.total -= 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteVendor.rejected, (state) => {
        state.loading = false;
      });

    // Get All Vendors (for dropdowns)
    builder
      .addCase(getAllVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload;
      })
      .addCase(getAllVendors.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedVendor,
  clearVendors,
  setSortConfig,
  resetSortConfig,
  resetPagination,
} = vendorSlice.actions;

export default vendorSlice.reducer;
