import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// ======================
// Async Thunks
// ======================

//  Fetch Delivery Modes
export const fetchDeliveryModes = createAsyncThunk(
  "common/fetchDeliveryModes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/deliverymode?order=asc`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Delivery Types
export const fetchDeliveryTypes = createAsyncThunk(
  "common/fetchDeliveryTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/deliverytype?order=asc`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Who Will Pay Options
export const fetchWhoWillPay = createAsyncThunk(
  "common/fetchWhoWillPay",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/whowillpay?is_active=true&order=asc`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchpackingtype = createAsyncThunk(
  "common/fetchpackingtype",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/packingtype?is_active=true&order=asc`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchinnerpackingtype = createAsyncThunk(
  "common/innerpackingtype",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/innerpackingtype?is_active=true&order=asc`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchpremiumpackingtype = createAsyncThunk(
  "common/premiumpackingtype",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/premiumpackingtype?is_active=true&order=asc`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchppayment = createAsyncThunk(
  "common/payment",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/payment?is_active=true&order=asc`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);




// ======================
// Initial State
// ======================
const initialState = {
  deliveryModes: [],
  loadingDeliveryModes: false,

  deliveryTypes: [],
  loadingDeliveryTypes: false,

  whoWillPayOptions: [],
  loadingWhoWillPay: false,

  packingTypes: [],
  loadingPackingTypes: false,

  innerpackingTypes: [],
  loadinginnerPackingTypes: false,

  premiumpackingtype: [],
  loadingpremiumpackingtype: false,

  payments: [],
  loadingppaymenta: false,


};

// ======================
// Slice
// ======================
const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // Delivery Modes
      .addCase(fetchDeliveryModes.pending, (state) => {
        state.loadingDeliveryModes = true;
      })
      .addCase(fetchDeliveryModes.fulfilled, (state, action) => {
        state.loadingDeliveryModes = false;
        state.deliveryModes = action.payload.data || [];
      })
      .addCase(fetchDeliveryModes.rejected, (state) => {
        state.loadingDeliveryModes = false;
      })

      // Delivery Types
      .addCase(fetchDeliveryTypes.pending, (state) => {
        state.loadingDeliveryTypes = true;
      })
      .addCase(fetchDeliveryTypes.fulfilled, (state, action) => {
        state.loadingDeliveryTypes = false;
        state.deliveryTypes = action.payload.data || [];
      })
      .addCase(fetchDeliveryTypes.rejected, (state) => {
        state.loadingDeliveryTypes = false;
      })

      // Who Will Pay Options
      .addCase(fetchWhoWillPay.pending, (state) => {
        state.loadingWhoWillPay = true;
      })
      .addCase(fetchWhoWillPay.fulfilled, (state, action) => {
        state.loadingWhoWillPay = false;
        state.whoWillPayOptions = action.payload.data || [];
      })
      .addCase(fetchWhoWillPay.rejected, (state) => {
        state.loadingWhoWillPay = false;
      })
      
         // Packing Types
      .addCase(fetchpackingtype.pending, (state) => {
        state.loadingPackingTypes = true;
      })
      .addCase(fetchpackingtype.fulfilled, (state, action) => {
        state.loadingPackingTypes = false;
        state.packingTypes = action.payload.data || [];
      })
      .addCase(fetchpackingtype.rejected, (state) => {
        state.loadingPackingTypes = false;
      })

      .addCase(fetchinnerpackingtype.pending, (state) => {
        state.loadinginnerPackingTypes = true;
      })
      .addCase(fetchinnerpackingtype.fulfilled, (state, action) => {
        state.loadinginnerPackingTypes = false;
        state.innerpackingTypes = action.payload.data || [];
      })
      .addCase(fetchinnerpackingtype.rejected, (state) => {
        state.loadinginnerPackingTypes = false;
      })

       .addCase(fetchpremiumpackingtype.pending, (state) => {
        state.loadingpremiumpackingtype = true;
      })
      .addCase(fetchpremiumpackingtype.fulfilled, (state, action) => {
        state.loadingpremiumpackingtype = false;
        state.premiumpackingtype = action.payload.data || [];
      })
      .addCase(fetchpremiumpackingtype.rejected, (state) => {
        state.loadingpremiumpackingtype = false;
      })
      
       .addCase(fetchppayment.pending, (state) => {
        state.loadingppaymenta = true;
      })
      .addCase(fetchppayment.fulfilled, (state, action) => {
        state.loadingppaymenta = false;
        state.payments = action.payload.data || [];
      })
      .addCase(fetchppayment.rejected, (state) => {
        state.loadingppaymenta = false;
      });
  },
});

export default commonSlice.reducer;
