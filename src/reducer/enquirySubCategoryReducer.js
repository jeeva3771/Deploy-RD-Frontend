import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllEnquirySubCategories = createAsyncThunk(
  "enquirySubCategory/getAllEnquirySubCategories",
  async ({is_active, order, params = {}}, { rejectWithValue }) => {
    try {
      const config = {
        params,
      };

      const response = await axiosInstance.get(`/enquirysubcategory?is_active=${is_active}&order=${order}`, config);
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

export const getEnquirySubCategoryById = createAsyncThunk(
  "enquirySubCategory/getEnquirySubCategoryById",
  async (enquirySubCategoryId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquirysubcategory/${enquirySubCategoryId}`);
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

export const createEnquirySubCategory = createAsyncThunk(
  "enquirySubCategory/createEnquirySubCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/enquirysubcategory/", formData);
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

export const updateEnquirySubCategory = createAsyncThunk(
  "enquirySubCategory/updateEnquirySubCategory",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/enquirysubcategory/${id}`,
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

export const deleteEnquirySubCategory = createAsyncThunk(
  "enquirySubCategory/deleteEnquirySubCategory",
  async (enquirySubCategoryId, { rejectWithValue, getState }) => {
    try {
      const response = await axiosInstance.delete(
        `/enquirysubcategory/${enquirySubCategoryId}`
      );
      return { enquirySubCategoryId, message: response.data.message };
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
  enquirySubCategories: [],
  singleEnquirySubCategory: null,
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
    enquirySubCategory: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Enquiry Category Slice
const enquirySubCategorySlice = createSlice({
  name: "enquirySubCategory",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSingleEnquirySubCategory: (state) => {
      state.singleEnquirySubCategory = null;
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
        enquirySubCategory: "",
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
      .addCase(getAllEnquirySubCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllEnquirySubCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enquirySubCategories = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        state.successMessage = "Enquiry categories fetched successfully";
      })
      .addCase(getAllEnquirySubCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Enquiry Category By ID
    builder
      .addCase(getEnquirySubCategoryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEnquirySubCategoryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleEnquirySubCategory = action.payload.data || action.payload;
        state.successMessage = "Enquiry category fetched successfully";
      })
      .addCase(getEnquirySubCategoryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Enquiry Category
    builder
      .addCase(createEnquirySubCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEnquirySubCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enquirySubCategories.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "Enquiry category created successfully";
      })
      .addCase(createEnquirySubCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Enquiry Category
    builder
      .addCase(updateEnquirySubCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEnquirySubCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEnquirySubCategoryData = action.payload.data || action.payload;
        const index = state.enquirySubCategories.findIndex(
          (cat) => cat.id === updatedEnquirySubCategoryData.id
        );
        if (index !== -1) {
          state.enquirySubCategories[index] = updatedEnquirySubCategoryData;
        }
        state.singleEnquirySubCategory = updatedEnquirySubCategoryData;
        state.successMessage =
          action.payload.message || "Enquiry category updated successfully";
      })
      .addCase(updateEnquirySubCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Enquiry Category
    builder
      .addCase(deleteEnquirySubCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEnquirySubCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enquirySubCategories = state.enquirySubCategories.filter(
          (cat) => cat.id !== action.payload.enquirySubCategoryId
        );
        state.successMessage =
          action.payload.message || "Enquiry category deleted successfully";
      })
      .addCase(deleteEnquirySubCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError,
  clearSuccess,
  clearSingleEnquirySubCategory,
  setFilters,
  resetFilters,
  setPagination,
  setSortConfig,
  resetSortConfig,
  resetPagination 
} = enquirySubCategorySlice.actions;

export default enquirySubCategorySlice.reducer;
