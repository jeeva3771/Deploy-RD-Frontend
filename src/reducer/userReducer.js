import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks

// Get all users with filters and pagination
export const fetchAllUsers = createAsyncThunk(
  "user/fetchAllUsers",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/user`, { params });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single user by ID
export const fetchUserById = createAsyncThunk(
  "user/fetchUserById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/user/${id}`);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new user
export const createUser = createAsyncThunk(
  "user/createUser",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/user`, formData);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/user/${id}`, formData);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/user/${id}`);
      return id; // Return the ID of deleted user
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Bulk upload users
export const bulkUploadUsers = createAsyncThunk(
  "user/bulkUploadUsers",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/user/bulk-upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get user counts
export const fetchUserCounts = createAsyncThunk(
  "user/fetchUserCounts",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/user/counts`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  success: false,
  successMessage: "",
  userCounts: {
    all: 0,
    active: 0,
    inactive: 0,
    byCompany: {},
  },
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    roleName: "",
    departmentName: "",
    is_active: "",
    company_id: "",
    department_id: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Clear success message
    clearSuccess: (state) => {
      state.success = false;
      state.successMessage = "";
    },
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        search: "",
        roleName: "",
        departmentName: "",
        is_active: "",
        company_id: "",
        department_id: "",
      };
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
    // Set sort configuration
    setSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Clear selected user
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    // Clear users list
    clearUsers: (state) => {
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch All Users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || [];
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.success = true;
        state.successMessage = "Users fetched successfully";
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch users";
        state.success = false;
      });

    // Fetch User By ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
        state.success = true;
        state.successMessage = "User fetched successfully";
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch user";
        state.selectedUser = null;
        state.success = false;
      });

    // Create User
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        // state.users.unshift(action.payload); // Add new user to the beginning
        state.success = true;
        state.successMessage = "User created successfully";
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create user";
        state.success = false;
      });

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.selectedUser = action.payload;
        state.success = true;
        state.successMessage = "User updated successfully";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update user";
        state.success = false;
      })
      .addCase(fetchUserCounts.fulfilled, (state, action) => {
        state.userCounts = action.payload || { all: 0, active: 0, inactive: 0, byCompany: {} };
      });

    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.selectedUser = null;
        state.success = true;
        state.successMessage = "User deleted successfully";
        state.pagination.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete user";
        state.success = false;
      });

    // Bulk Upload Users
    builder
      .addCase(bulkUploadUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(bulkUploadUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.successMessage = action.payload.message || "Bulk upload successful";
      })
      .addCase(bulkUploadUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Bulk upload failed";
        state.success = false;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setFilters,
  setSortConfig,
  resetFilters,
  setPagination,
  clearSelectedUser,
  clearUsers,
  resetSortConfig,
  resetPagination,
} = userSlice.actions;

export default userSlice.reducer;