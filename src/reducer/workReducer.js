import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const fetchWorksList = createAsyncThunk(
  "work/fetchWorksList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/work/get`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch work list"
      );
    }
  }
);

export const getWorkById = createAsyncThunk(
  "work/getWorkById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/work/get/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch work details"
      );
    }
  }
);

export const createWork = createAsyncThunk(
  "work/createWork",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/work/create`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create work"
      );
    }
  }
);

export const updateWork = createAsyncThunk(
  "work/updateWork",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/work/update/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update work"
      );
    }
  }
);

export const deleteWork = createAsyncThunk(
  "work/deleteWork",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/work/delete/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete work"
      );
    }
  }
);

const initialState = {
  worksList: [],
  workDetails: null,
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

const workSlice = createSlice({
  name: "work",
  initialState,
  reducers: {
    clearWorkError: (state) => {
      state.error = null;
    },
    clearWorkDetails: (state) => {
      state.workDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Works
      .addCase(fetchWorksList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorksList.fulfilled, (state, action) => {
        state.loading = false;
        state.worksList = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchWorksList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get by ID
      .addCase(getWorkById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWorkById.fulfilled, (state, action) => {
        state.loading = false;
        state.workDetails = action.payload;
      })
      .addCase(getWorkById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWork.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWork.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWork.fulfilled, (state, action) => {
        state.loading = false;
        state.worksList = state.worksList.filter(
          (w) => w._id !== action.payload.id
        );
      })
      .addCase(deleteWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWorkError, clearWorkDetails } = workSlice.actions;
export default workSlice.reducer;
