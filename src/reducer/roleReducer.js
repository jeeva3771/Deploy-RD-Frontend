import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllRoles = createAsyncThunk(
  "role/getAllRoles",
  async ({is_active, params= {}}, { rejectWithValue }) => {
		console.log('is_active', is_active)
    try {
      const response = await axiosInstance.get(`/role?is_active=${is_active}`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch roles"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const getRoleById = createAsyncThunk(
  "role/getRoleById",
  async (roleId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/role/${roleId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch role"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createRole = createAsyncThunk(
  "role/createRole",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/role/", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to create role"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateRole = createAsyncThunk(
  "role/updateRole",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/role/${id}`, formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update role"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteRole = createAsyncThunk(
  "role/deleteRole",
  async (roleId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/role/${roleId}`);
      return { roleId, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete role"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

// Initial State
const initialState = {
  roles: [],
  singleRole: null,
  isLoading: false,
  error: null,
  successMessage: null,
  pagination: {
    page: 1,
    totalPages: 0,
    total: 0,
    count: 0,
  },
};

// Role Slice
const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearSingleRole: (state) => {
      state.singleRole = null;
    },
  },
  extraReducers: (builder) => {
    // Get All Roles
    builder
      .addCase(getAllRoles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllRoles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          totalPages: action.payload.totalPages || 0,
          total: action.payload.total || 0,
          count: action.payload.count || 0,
        };
        state.successMessage = "Roles fetched successfully";
      })
      .addCase(getAllRoles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Role By ID
    builder
      .addCase(getRoleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRoleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleRole = action.payload.data || action.payload;
        state.successMessage = "Role fetched successfully";
      })
      .addCase(getRoleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Role
    builder
      .addCase(createRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles.push(action.payload.data || action.payload);
        state.successMessage =
          action.payload.message || "Role created successfully";
      })
      .addCase(createRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Role
    builder
      .addCase(updateRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedRoleData = action.payload.data || action.payload;
        const index = state.roles.findIndex(
          (role) => role.id === updatedRoleData.id
        );
        if (index !== -1) {
          state.roles[index] = updatedRoleData;
        }
        state.singleRole = updatedRoleData;
        state.successMessage =
          action.payload.message || "Role updated successfully";
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Role
    builder
      .addCase(deleteRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = state.roles.filter(
          (role) => role.id !== action.payload.roleId
        );
        state.successMessage =
          action.payload.message || "Role deleted successfully";
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, clearSingleRole } = roleSlice.actions;
export default roleSlice.reducer;