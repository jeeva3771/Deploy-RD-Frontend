import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const fetchClientOutstanding = createAsyncThunk(
  "accounts/fetchClientOutstanding",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/accounts/client-outstanding");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch client outstanding");
    }
  }
);

export const fetchVendorOutstanding = createAsyncThunk(
  "accounts/fetchVendorOutstanding",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/accounts/vendor-outstanding");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch vendor outstanding");
    }
  }
);

export const fetchBankMaster = createAsyncThunk(
  "accounts/fetchBankMaster",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/accounts/bank-master");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bank master");
    }
  }
);

export const fetchSalesOrders = createAsyncThunk(
  "accounts/fetchSalesOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/accounts/sales-orders");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch sales orders");
    }
  }
);

export const submitQuickAction = createAsyncThunk(
  "accounts/submitQuickAction",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/accounts/quick-action", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit quick action");
    }
  }
);

const accountsSlice = createSlice({
  name: "accounts",
  initialState: {
    clientData: [],
    vendorData: [],
    banks: [],
    jobsData: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Client Outstanding
      .addCase(fetchClientOutstanding.pending, (state) => { state.loading = true; })
      .addCase(fetchClientOutstanding.fulfilled, (state, action) => {
        state.loading = false;
        state.clientData = action.payload || [];
      })
      .addCase(fetchClientOutstanding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Vendor Outstanding
      .addCase(fetchVendorOutstanding.pending, (state) => { state.loading = true; })
      .addCase(fetchVendorOutstanding.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorData = action.payload || [];
      })
      .addCase(fetchVendorOutstanding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Bank Master
      .addCase(fetchBankMaster.pending, (state) => { state.loading = true; })
      .addCase(fetchBankMaster.fulfilled, (state, action) => {
        state.loading = false;
        state.banks = action.payload || [];
      })
      .addCase(fetchBankMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sales Orders
      .addCase(fetchSalesOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.jobsData = action.payload || [];
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default accountsSlice.reducer;
