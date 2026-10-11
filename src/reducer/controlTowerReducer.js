import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllControlTowerDepts = createAsyncThunk(
  "controlTower/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/controltower", { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch control tower departments");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createControlTowerDept = createAsyncThunk(
  "controlTower/create",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/controltower/", formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || "Failed to create control tower department");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateControlTowerDept = createAsyncThunk(
  "controlTower/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/controltower/${id}`, formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || "Failed to update control tower department");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteControlTowerDept = createAsyncThunk(
  "controlTower/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/controltower/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || "Failed to delete control tower department");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

const initialState = {
  depts: [],
  isLoading: false,
  error: null,
  successMessage: null,
};

const controlTowerSlice = createSlice({
  name: "controlTower",
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.successMessage = null; },
  },
  extraReducers: (builder) => {
    // Get All
    builder
      .addCase(getAllControlTowerDepts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllControlTowerDepts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.depts = action.payload.data || [];
        state.successMessage = "Control tower departments fetched successfully";
      })
      .addCase(getAllControlTowerDepts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create
    builder
      .addCase(createControlTowerDept.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createControlTowerDept.fulfilled, (state, action) => {
        state.isLoading = false;
        state.depts.push(action.payload.data || action.payload);
        state.successMessage = action.payload.message || "Control tower department created successfully";
      })
      .addCase(createControlTowerDept.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateControlTowerDept.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateControlTowerDept.fulfilled, (state, action) => {
        state.isLoading = false;
        const updated = action.payload.data || action.payload;
        const index = state.depts.findIndex((d) => d.id === updated.id);
        if (index !== -1) state.depts[index] = updated;
        state.successMessage = action.payload.message || "Control tower department updated successfully";
      })
      .addCase(updateControlTowerDept.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteControlTowerDept.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteControlTowerDept.fulfilled, (state, action) => {
        state.isLoading = false;
        state.depts = state.depts.filter((d) => d.id !== action.payload.id);
        state.successMessage = action.payload.message || "Control tower department deleted successfully";
      })
      .addCase(deleteControlTowerDept.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = controlTowerSlice.actions;
export default controlTowerSlice.reducer;
