import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../../utils/url/config";

// Async Thunks
export const getAllpackingtypeCategories = createAsyncThunk(
  "packingtype/getAllpackingtypeCategories",
  async ({is_active, order, params = {}}, { rejectWithValue }) => {
    try {
      const config = {
        params,
      };

      const response = await axiosInstance.get(`/packingtype?is_active=${is_active}&order=${order}`, config);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch packingtype categories"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const getpackingtypeById = createAsyncThunk(
  "packingtype/getpackingtypeById",
  async (packingtypeId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/packingtype/${packingtypeId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch packingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createpackingtype = createAsyncThunk(
  "packingtype/createpackingtype",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/packingtype/", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to create packingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updatepackingtype = createAsyncThunk(
  "packingtype/updatepackingtype",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/packingtype/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update packingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deletepackingtype = createAsyncThunk(
  "packingtype/deletepackingtype",
  async (packingtypeId, { rejectWithValue, getState }) => {
    try {
      const response = await axiosInstance.delete(
        `/packingtype/${packingtypeId}`
      );
      return { packingtypeId, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete packingtype category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  packingtypeCategories: [],
  singlepackingtype: null,
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
    packingtype: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// packingtype Category Slice
const packingtypeSlice = createSlice({
  name: "packingtype",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSinglepackingtype: (state) => {
      state.singlepackingtype = null;
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
        packingtype: "",
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
    // Get All packingtype Categories
    builder
      .addCase(getAllpackingtypeCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllpackingtypeCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packingtypeCategories = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        state.successMessage = "packingtype categories fetched successfully";
      })
      .addCase(getAllpackingtypeCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get packingtype Category By ID
    builder
      .addCase(getpackingtypeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getpackingtypeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singlepackingtype = action.payload.data || action.payload;
        state.successMessage = "packingtype category fetched successfully";
      })
      .addCase(getpackingtypeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create packingtype Category
    builder
      .addCase(createpackingtype.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createpackingtype.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packingtypeCategories.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "packingtype category created successfully";
      })
      .addCase(createpackingtype.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update packingtype Category
    builder
      .addCase(updatepackingtype.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatepackingtype.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedpackingtypeData = action.payload.data || action.payload;
        const index = state.packingtypeCategories.findIndex(
          (cat) => cat.id === updatedpackingtypeData.id
        );
        if (index !== -1) {
          state.packingtypeCategories[index] = updatedpackingtypeData;
        }
        state.singlepackingtype = updatedpackingtypeData;
        state.successMessage =
          action.payload.message || "packingtype category updated successfully";
      })
      .addCase(updatepackingtype.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete packingtype Category
    builder
      .addCase(deletepackingtype.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletepackingtype.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packingtypeCategories = state.packingtypeCategories.filter(
          (cat) => cat.id !== action.payload.packingtypeId
        );
        state.successMessage =
          action.payload.message || "packingtype category deleted successfully";
      })
      .addCase(deletepackingtype.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError,
  clearSuccess,
  clearSinglepackingtype,
  setFilters,
  resetFilters,
  setPagination,
  setSortConfig,
  resetSortConfig,
  resetPagination 
} = packingtypeSlice.actions;

export default packingtypeSlice.reducer;
