import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../utils/url/config";

// ASYNC THUNKS
// Fetch all material categories
export const fetchAllCategories = createAsyncThunk(
  "materialCategories/fetchAllCategories",
  async (params = {}, { rejectWithValue }) => {
    try {
      // Pass query params to the GET request
      const response = await axiosInstance.get("/materialcategory", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single category by ID
export const fetchCategoryById = createAsyncThunk(
  "materialCategories/fetchCategoryById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/materialcategory/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new category
export const createCategory = createAsyncThunk(
  "materialCategories/createCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/materialcategory`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk(
  "materialCategories/updateCategory",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/materialcategory/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk(
  "materialCategories/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/materialcategory/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// INITIAL STATE
const initialState = {
  categories: [],
  selectedCategory: null,
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
const materialCategoriesSlice = createSlice({
  name: "materialCategories",
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

    // Clear selected category
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
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
    // Fetch All Categories
    builder
      .addCase(fetchAllCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data || [];
        state.pagination.total = action.payload.count || 0;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Fetch Category By ID
    builder
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.selectedCategory = null;
        state.error = action.payload || action.error?.message;
      });

    // Create Category
    builder
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally add to list immediately
        if (action.payload.data) {
          state.categories.unshift(action.payload.data);
          state.pagination.total += 1;
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Update Category
    builder
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update in list immediately
        if (action.payload.data) {
          const index = state.categories.findIndex(
            (category) => category.id === action.payload.data.id
          );
          if (index !== -1) {
            state.categories[index] = action.payload.data;
          }
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });

    // Delete Category
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from list immediately
        state.categories = state.categories.filter(
          (category) => category.id !== action.payload.id
        );
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
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
  clearSelectedCategory,
  setSortConfig,
  resetSortConfig,
  clearError,
} = materialCategoriesSlice.actions;

// SELECTORS (Optional but useful)
export const selectAllCategories = (state) =>
  state.materialCategories.categories;
export const selectCategoriesLoading = (state) =>
  state.materialCategories.loading;
export const selectCategoriesError = (state) => state.materialCategories.error;
export const selectSelectedCategory = (state) =>
  state.materialCategories.selectedCategory;
export const selectCategoriesFilters = (state) =>
  state.materialCategories.filters;
export const selectCategoriesPagination = (state) =>
  state.materialCategories.pagination;

// Filtered categories selector (with search)
export const selectFilteredCategories = (state) => {
  const { categories, filters } = state.materialCategories;

  if (!filters.search) return categories;

  const searchLower = filters.search.toLowerCase();
  return categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
  );
};


// EXPORT REDUCER
export default materialCategoriesSlice.reducer;