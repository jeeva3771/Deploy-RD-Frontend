import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../../utils/url/config";

// Async Thunks
export const getAllinnerpackingtypeCategories = createAsyncThunk(
  "innerpackingtype/getAllinnerpackingtypeCategories",
  async ({is_active, order, params = {}}, { rejectWithValue }) => {
    try {
      const config = {
        params,
      };

      const response = await axiosInstance.get(`/innerpackingtype?is_active=${is_active}&order=${order}`, config);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch innerpackingtype categories"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const getinnerpackingtypeById = createAsyncThunk(
  "innerpackingtype/getinnerpackingtypeById",
  async (innerpackingtypeId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/innerpackingtype/${innerpackingtypeId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch innerpackingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createinnerpackingtype = createAsyncThunk(
  "innerpackingtype/createinnerpackingtype",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/innerpackingtype", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to create innerpackingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateinnerpackingtype = createAsyncThunk(
  "innerpackingtype/updateinnerpackingtype",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/innerpackingtype/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update innerpackingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteinnerpackingtype = createAsyncThunk(
  "innerpackingtype/deleteinnerpackingtype",
  async (innerpackingtypeId, { rejectWithValue, getState }) => {
    try {
      const response = await axiosInstance.delete(
        `/innerpackingtype/${innerpackingtypeId}`
      );
      return { innerpackingtypeId, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete innerpackingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  innerpackingtypeCategories: [],
  singleinnerpackingtype: null,
  isLoading: false,
  error: null,
  successMessage: null,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    innerpackingtype: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// innerpackingtype Category Slice
const innerpackingtypeSlice = createSlice({
  name: "innerpackingtype",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSingleinnerpackingtype: (state) => {
      state.singleinnerpackingtype = null;
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
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        search: "",
        innerpackingtype: "",
        is_active: "",
        type: "",
      };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Get All innerpackingtype Categories
    builder
      .addCase(getAllinnerpackingtypeCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllinnerpackingtypeCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.innerpackingtypeCategories = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        state.successMessage = "innerpackingtype categories fetched successfully";
      })
      .addCase(getAllinnerpackingtypeCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get innerpackingtype Category By ID
    builder
      .addCase(getinnerpackingtypeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getinnerpackingtypeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleinnerpackingtype = action.payload.data || action.payload;
        state.successMessage = "innerpackingtype category fetched successfully";
      })
      .addCase(getinnerpackingtypeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create innerpackingtype Category
    builder
      .addCase(createinnerpackingtype.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createinnerpackingtype.fulfilled, (state, action) => {
        state.isLoading = false;
        state.innerpackingtypeCategories.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "innerpackingtype category created successfully";
      })
      .addCase(createinnerpackingtype.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update innerpackingtype Category
    builder
      .addCase(updateinnerpackingtype.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateinnerpackingtype.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedinnerpackingtypeData = action.payload.data || action.payload;
        const index = state.innerpackingtypeCategories.findIndex(
          (cat) => cat.id === updatedinnerpackingtypeData.id
        );
        if (index !== -1) {
          state.innerpackingtypeCategories[index] = updatedinnerpackingtypeData;
        }
        state.singleinnerpackingtype = updatedinnerpackingtypeData;
        state.successMessage =
          action.payload.message || "innerpackingtype category updated successfully";
      })
      .addCase(updateinnerpackingtype.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete innerpackingtype Category
    builder
      .addCase(deleteinnerpackingtype.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteinnerpackingtype.fulfilled, (state, action) => {
        state.isLoading = false;
        state.innerpackingtypeCategories = state.innerpackingtypeCategories.filter(
          (cat) => cat.id !== action.payload.innerpackingtypeId
        );
        state.successMessage =
          action.payload.message || "innerpackingtype category deleted successfully";
      })
      .addCase(deleteinnerpackingtype.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError,
  clearSuccess,
  clearSingleinnerpackingtype,
  setFilters,
  resetFilters,
  setPagination,
  setSortConfig,
  resetSortConfig,
  resetPagination 
} = innerpackingtypeSlice.actions;

export default innerpackingtypeSlice.reducer;
