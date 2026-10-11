import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../utils/url/config";

// ASYNC THUNKS
// Fetch all material types
export const fetchAllTypes = createAsyncThunk(
  "materialTypes/fetchAllTypes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/materialtype", {
        params, 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Get single type by ID
export const fetchTypeById = createAsyncThunk(
  "materialTypes/fetchTypeById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/materialtype/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new type
export const createType = createAsyncThunk(
  "materialTypes/createType",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/materialtype`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update type
export const updateType = createAsyncThunk(
  "materialTypes/updateType",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/materialtype/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete type
export const deleteType = createAsyncThunk(
  "materialTypes/deleteType",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/materialtype/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// INITIAL STATE
const initialState = {
  types: [],
  selectedType: null,
  loading: false,

  // Pagination (if needed in future)
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  // Filters (if needed in future)
  filters: {
    search: "",
  },

  // Sorting (if needed in future)
  sortConfig: {
    key: "created_at",
    direction: "desc",
  },

  error: null,
};

// SLICE
const materialTypesSlice = createSlice({
  name: "materialTypes",
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
      };
    },

    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Reset pagination
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },

    // Clear selected type
    clearSelectedType: (state) => {
      state.selectedType = null;
    },

    // Set sort configuration
    setSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },

    // Reset sort configuration
    resetSortConfig: (state) => {
      state.sortConfig = {
        key: "created_at",
        direction: "desc",
      };
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch All Types
    builder
      .addCase(fetchAllTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.types = action.payload.data || [];
        state.pagination.total = action.payload.count || 0;
      })
      .addCase(fetchAllTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Fetch Type By ID
    builder
      .addCase(fetchTypeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTypeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedType = action.payload;
      })
      .addCase(fetchTypeById.rejected, (state, action) => {
        state.loading = false;
        state.selectedType = null;
        state.error = action.payload || action.error?.message;
      });

    // Create Type
    builder
      .addCase(createType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createType.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally add to list immediately
        if (action.payload.data) {
          state.types.unshift(action.payload.data);
          state.pagination.total += 1;
        }
      })
      .addCase(createType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Update Type
    builder
      .addCase(updateType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateType.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update in list immediately
        if (action.payload.data) {
          const index = state.types.findIndex(
            (type) => type.id === action.payload.data.id
          );
          if (index !== -1) {
            state.types[index] = action.payload.data;
          }
        }
      })
      .addCase(updateType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Delete Type
    builder
      .addCase(deleteType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteType.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from list immediately
        state.types = state.types.filter(
          (type) => type.id !== action.payload.id
        );
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteType.rejected, (state, action) => {
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
  clearSelectedType,
  setSortConfig,
  resetSortConfig,
  clearError,
} = materialTypesSlice.actions;

// SELECTORS (Optional but useful)

export const selectAllTypes = (state) => state.materialTypes.types;
export const selectTypesLoading = (state) => state.materialTypes.loading;
export const selectTypesError = (state) => state.materialTypes.error;
export const selectSelectedType = (state) => state.materialTypes.selectedType;
export const selectTypesFilters = (state) => state.materialTypes.filters;
export const selectTypesPagination = (state) => state.materialTypes.pagination;

// Filtered types selector (with search)
export const selectFilteredTypes = (state) => {
  const { types, filters } = state.materialTypes;

  if (!filters.search) return types;

  const searchLower = filters.search.toLowerCase();
  return types.filter((type) => type.name?.toLowerCase().includes(searchLower));
};

// EXPORT REDUCER
export default materialTypesSlice.reducer;