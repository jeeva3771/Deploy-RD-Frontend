import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllEnquiryCategories = createAsyncThunk(
  "enquiryCategory/getAllEnquiryCategories",
  async ({is_active, order, params = {}}, { rejectWithValue }) => {
    try {
      const config = {
        params,
      };

      const response = await axiosInstance.get(`/enquirycategory?is_active=${is_active}&order=${order}`, config);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch enquiry categories"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const getEnquiryCategoryById = createAsyncThunk(
  "enquiryCategory/getEnquiryCategoryById",
  async (enquiryCategoryId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquirycategory/${enquiryCategoryId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch enquiry category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createEnquiryCategory = createAsyncThunk(
  "enquiryCategory/createEnquiryCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/enquirycategory/", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to create enquiry category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateEnquiryCategory = createAsyncThunk(
  "enquiryCategory/updateEnquiryCategory",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/enquirycategory/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update enquiry category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteEnquiryCategory = createAsyncThunk(
  "enquiryCategory/deleteEnquiryCategory",
  async (enquiryCategoryId, { rejectWithValue, getState }) => {
    try {
      const response = await axiosInstance.delete(
        `/enquirycategory/${enquiryCategoryId}`
      );
      return { enquiryCategoryId, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete enquiry category"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  enquiryCategories: [],
  singleEnquiryCategory: null,
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
    enquiryCategory: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Enquiry Category Slice
const enquiryCategorySlice = createSlice({
  name: "enquiryCategory",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSingleEnquiryCategory: (state) => {
      state.singleEnquiryCategory = null;
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
        enquiryCategory: "",
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
    // Get All Enquiry Categories
    builder
      .addCase(getAllEnquiryCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllEnquiryCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enquiryCategories = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        state.successMessage = "Enquiry categories fetched successfully";
      })
      .addCase(getAllEnquiryCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Enquiry Category By ID
    builder
      .addCase(getEnquiryCategoryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEnquiryCategoryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleEnquiryCategory = action.payload.data || action.payload;
        state.successMessage = "Enquiry category fetched successfully";
      })
      .addCase(getEnquiryCategoryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Enquiry Category
    builder
      .addCase(createEnquiryCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEnquiryCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enquiryCategories.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "Enquiry category created successfully";
      })
      .addCase(createEnquiryCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Enquiry Category
    builder
      .addCase(updateEnquiryCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEnquiryCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEnquiryCategoryData = action.payload.data || action.payload;
        const index = state.enquiryCategories.findIndex(
          (cat) => cat.id === updatedEnquiryCategoryData.id
        );
        if (index !== -1) {
          state.enquiryCategories[index] = updatedEnquiryCategoryData;
        }
        state.singleEnquiryCategory = updatedEnquiryCategoryData;
        state.successMessage =
          action.payload.message || "Enquiry category updated successfully";
      })
      .addCase(updateEnquiryCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Enquiry Category
    builder
      .addCase(deleteEnquiryCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEnquiryCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enquiryCategories = state.enquiryCategories.filter(
          (cat) => cat.id !== action.payload.enquiryCategoryId
        );
        state.successMessage =
          action.payload.message || "Enquiry category deleted successfully";
      })
      .addCase(deleteEnquiryCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError,
  clearSuccess,
  clearSingleEnquiryCategory,
  setFilters,
  resetFilters,
  setPagination,
  setSortConfig,
  resetSortConfig,
  resetPagination 
} = enquiryCategorySlice.actions;

export default enquiryCategorySlice.reducer;
