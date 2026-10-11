import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all outsource vendors with filters and pagination
export const fetchAllOutsourceVendors = createAsyncThunk(
  "outsourceVendor/fetchAllOutsourceVendors",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/outsourcevendor", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single outsource vendor by ID
export const fetchOutsourceVendorById = createAsyncThunk(
  "outsourceVendor/fetchOutsourceVendorById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/outsourcevendor/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new outsource vendor
export const createOutsourceVendor = createAsyncThunk(
  "outsourceVendor/createOutsourceVendor",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/outsourcevendor", formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update outsource vendor
export const updateOutsourceVendor = createAsyncThunk(
  "outsourceVendor/updateOutsourceVendor",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/outsourcevendor/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete outsource vendor
export const deleteOutsourceVendor = createAsyncThunk(
  "outsourceVendor/deleteOutsourceVendor",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/outsourcevendor/${id}`);
      return id; // Return the ID of deleted vendor
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all outsource vendors name (for dropdowns)
export const getOutsourceVendorNameList = createAsyncThunk(
  "outsourceVendor/getOutsourceVendorNameList",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/outsourcevendor/namelist", { params });
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  outsourceVendors: [],
  selectedOutsourceVendor: null,
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
const outsourceVendorSlice = createSlice({
  name: "outsourceVendor",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: "",
        is_active: "",
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearSelectedOutsourceVendor: (state) => {
      state.selectedOutsourceVendor = null;
    },
    clearOutsourceVendors: (state) => {
      state.outsourceVendors = [];
    },
    setSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },
    resetSortConfig: (state) => {
      state.sortConfig = {
        key: null,
        direction: "asc",
      };
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 5,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch All Outsource Vendors
    builder
      .addCase(fetchAllOutsourceVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllOutsourceVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.outsourceVendors = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllOutsourceVendors.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Outsource Vendor By ID
    builder
      .addCase(fetchOutsourceVendorById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOutsourceVendorById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOutsourceVendor = action.payload;
      })
      .addCase(fetchOutsourceVendorById.rejected, (state) => {
        state.loading = false;
        state.selectedOutsourceVendor = null;
      });

    // Create Outsource Vendor
    builder
      .addCase(createOutsourceVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOutsourceVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.outsourceVendors.unshift(action.payload);
        state.pagination.total += 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createOutsourceVendor.rejected, (state) => {
        state.loading = false;
      });

    // Update Outsource Vendor
    builder
      .addCase(updateOutsourceVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOutsourceVendor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.outsourceVendors.findIndex(
          (vendor) => vendor._id === action.payload._id
        );
        if (index !== -1) {
          state.outsourceVendors[index] = action.payload;
        }
        state.selectedOutsourceVendor = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateOutsourceVendor.rejected, (state) => {
        state.loading = false;
      });

    // Delete Outsource Vendor
    builder
      .addCase(deleteOutsourceVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOutsourceVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.outsourceVendors = state.outsourceVendors.filter(
          (vendor) => vendor.id !== action.payload
        );
        state.selectedOutsourceVendor = null;
        state.pagination.total -= 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteOutsourceVendor.rejected, (state) => {
        state.loading = false;
      });
      
    // Get all outsource vendors name (for dropdowns)
    builder
      .addCase(getOutsourceVendorNameList.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOutsourceVendorNameList.fulfilled, (state, action) => {
        state.loading = false;
        state.outsourceVendors = action.payload;
      })
      .addCase(getOutsourceVendorNameList.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedOutsourceVendor,
  clearOutsourceVendors,
  setSortConfig,
  resetSortConfig,
  resetPagination,
} = outsourceVendorSlice.actions;

export default outsourceVendorSlice.reducer;
