import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all customers with filters and pagination
export const fetchAllCustomers = createAsyncThunk(
  "customer/fetchAllCustomers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/customer', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single customer by ID
export const fetchCustomerById = createAsyncThunk(
  "customer/fetchCustomerById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/customer/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new customer
export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/customer', formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  "customer/updateCustomer",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/customer/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  "customer/deleteCustomer",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/customer/${id}`);
      return id; // Return the ID of deleted customer
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  customers: [],
  selectedCustomer: null,
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
const customerSlice = createSlice({
  name: "customer",
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
    // Clear selected customer
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    // Clear customers list
    clearCustomers: (state) => {
      state.customers = [];
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
    // Fetch All Customers
    builder
      .addCase(fetchAllCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllCustomers.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Customer By ID
    builder
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state) => {
        state.loading = false;
        state.selectedCustomer = null;
      });

    // Create Customer
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.unshift(action.payload); // Add new customer to the beginning
        state.pagination.total += 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createCustomer.rejected, (state) => {
        state.loading = false;
      });

    // Update Customer
    builder
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(
          (customer) => customer.id === action.payload.id
        );
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        state.selectedCustomer = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateCustomer.rejected, (state) => {
        state.loading = false;
      });

    // Delete Customer
    builder
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter(
          (customer) => customer.id !== action.payload
        );
        state.selectedCustomer = null;
        state.pagination.total -= 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteCustomer.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedCustomer,
  clearCustomers,
  setSortConfig,
  resetSortConfig,
  resetPagination,
} = customerSlice.actions;

export default customerSlice.reducer;