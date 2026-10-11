import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const fetchCompaniesList = createAsyncThunk(
  "company/fetchCompaniesList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/company/get`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch company list"
      );
    }
  }
);

export const getCompanyById = createAsyncThunk(
  "company/getCompanyById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/company/get/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch company details"
      );
    }
  }
);

export const createCompany = createAsyncThunk(
  "company/createCompany",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/company/create`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create company"
      );
    }
  }
);

export const updateCompany = createAsyncThunk(
  "company/updateCompany",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/company/update/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update company"
      );
    }
  }
);

export const deleteCompany = createAsyncThunk(
  "company/deleteCompany",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/company/delete/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete company"
      );
    }
  }
);

const initialState = {
  companiesList: [],
  companyDetails: null,
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompanyError: (state) => {
      state.error = null;
    },
    clearCompanyDetails: (state) => {
      state.companyDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Companies
      .addCase(fetchCompaniesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompaniesList.fulfilled, (state, action) => {
        state.loading = false;
        state.companiesList = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchCompaniesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get by ID
      .addCase(getCompanyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompanyById.fulfilled, (state, action) => {
        state.loading = false;
        state.companyDetails = action.payload;
      })
      .addCase(getCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companiesList = state.companiesList.filter(
          (c) => c._id !== action.payload.id
        );
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCompanyError, clearCompanyDetails } = companySlice.actions;
export default companySlice.reducer;
