// src/reducer/serviceCategoryReducer.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Thunks
export const fetchAllServiceCategories = createAsyncThunk(
  "serviceCategory/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/servicecategory`, { params });
      // expecting response.data: { success, data, total, page, limit, totalPages }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchServiceCategoryById = createAsyncThunk(
  "serviceCategory/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/servicecategory/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createServiceCategory = createAsyncThunk(
  "serviceCategory/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/servicecategory`, payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateServiceCategory = createAsyncThunk(
  "serviceCategory/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/servicecategory/${id}`, payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteServiceCategory = createAsyncThunk(
  "serviceCategory/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/servicecategory/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// initial state
const initialState = {
  serviceCategory: [],
  singleCategory: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
  error: null,
};

const slice = createSlice({
  name: "serviceCategory",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = { search: "" };
    },
    setPagination(state, action) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination(state) {
      state.pagination = { page: 1, limit: 5 };
    },
    setSortConfig(state, action) {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },
    resetSortConfig(state) {
      state.sortConfig = { key: null, direction: "asc" };
    },
    clearSelected(state) {
      state.selected = null;
    },
    clearItems(state) {
      state.items = [];
      state.pagination = { ...state.pagination, total: 0, totalPages: 0 };
    },
  },
  extraReducers(builder) {
    builder
      // fetch all
      .addCase(fetchAllServiceCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllServiceCategories.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        state.serviceCategory = payload.data || [];
        state.pagination = {
          page: payload.page || state.pagination.page,
          limit: payload.limit || state.pagination.limit,
          total: payload.total || 0,
          totalPages: payload.totalPages || 0,
        };
      })
      .addCase(fetchAllServiceCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // fetch by id
      .addCase(fetchServiceCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleCategory = action.payload;
      })
      .addCase(fetchServiceCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.singleCategory = null;
        state.error = action.payload || action.error?.message;
      })

      // create
      .addCase(createServiceCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createServiceCategory.fulfilled, (state, action) => {
        state.loading = false;
        // add new to top
        state.serviceCategory.unshift(action.payload);
        state.pagination.total = (state.pagination.total || 0) + 1;
        // optional: adjust sort to newest
        state.sortConfig = { key: "created_at", direction: "desc" };
      })
      .addCase(createServiceCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // update
      .addCase(updateServiceCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateServiceCategory.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.serviceCategory.findIndex(
          (it) => it.id === action.payload.id || it._id === action.payload._id
        );
        if (idx !== -1) state.serviceCategory[idx] = action.payload;
        state.singleCategory = action.payload;
      })
      .addCase(updateServiceCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // delete
      .addCase(deleteServiceCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteServiceCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCategory = state.serviceCategory.filter(
          (it) => it.id !== action.payload && it._id !== action.payload
        );
        state.pagination.total = Math.max(0, (state.pagination.total || 1) - 1);
      })
      .addCase(deleteServiceCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  resetPagination,
  setSortConfig,
  resetSortConfig,
  clearSelected,
  clearItems,
} = slice.actions;

export default slice.reducer;
