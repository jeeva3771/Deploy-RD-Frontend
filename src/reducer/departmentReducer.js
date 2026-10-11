import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllDepartments = createAsyncThunk(
  "department/getAllDepartments",
  async ({is_active, order, params = {}}, { rejectWithValue }) => {
    try {
      const config = {
        params,
      };

      const response = await axiosInstance.get(`/department?is_active=${is_active}&order=${order}`, config);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch departments"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const getDepartmentById = createAsyncThunk(
  "department/getDepartmentById",
  async (departmentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/department/${departmentId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch department"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createDepartment = createAsyncThunk(
  "department/createDepartment",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/department/", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to create department"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "department/updateDepartment",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/department/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update department"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "department/deleteDepartment",
  async (departmentId, { rejectWithValue, getState }) => {
    try {
      const response = await axiosInstance.delete(
        `/department/${departmentId}`
      );
      
      if (response.data.success === false) {
        return rejectWithValue(response.data.message || "Failed to delete department");
      }

      return { departmentId, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete department"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  departments: [],
  singleDepartment: null,
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
    department: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Department Slice
const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSingleDepartment: (state) => {
      state.singleDepartment = null;
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
        department: "",
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
    // Get All Departments
    builder
      .addCase(getAllDepartments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllDepartments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departments = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        state.successMessage = "Departments fetched successfully";
      })
      .addCase(getAllDepartments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Department By ID
    builder
      .addCase(getDepartmentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDepartmentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleDepartment = action.payload.data || action.payload;
        state.successMessage = "Department fetched successfully";
      })
      .addCase(getDepartmentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Department
    builder
      .addCase(createDepartment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departments.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "Department created successfully";
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Department
    builder
      .addCase(updateDepartment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedDepartmentData = action.payload.data || action.payload;
        const index = state.departments.findIndex(
          (dept) => dept.id === updatedDepartmentData.id
        );
        if (index !== -1) {
          state.departments[index] = updatedDepartmentData;
        }
        state.singleDepartment = updatedDepartmentData;
        state.successMessage =
          action.payload.message || "Department updated successfully";
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Department
    builder
      .addCase(deleteDepartment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departments = state.departments.filter(
          (dept) => dept.id !== action.payload.departmentId
        );
        state.successMessage =
          action.payload.message || "Department deleted successfully";
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError,
  clearSuccess,
  clearSingleDepartment,
  setFilters,
  resetFilters,
  setPagination,
  setSortConfig,
  resetSortConfig,
  resetPagination } = departmentSlice.actions;
export default departmentSlice.reducer;
