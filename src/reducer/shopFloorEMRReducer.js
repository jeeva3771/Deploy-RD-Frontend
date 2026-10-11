import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Raise a new EMR request
export const submitExtraMaterialEMRThunk = createAsyncThunk(
    "shopfloorEMR/submit",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/emr", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Fetch all EMR records (the ledger)
export const fetchExtraMaterialEMRListThunk = createAsyncThunk(
    "shopfloorEMR/fetchList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/emr/list", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Confirm operator receipt of EMR sheets
export const confirmEMRReceiptThunk = createAsyncThunk(
    "shopfloorEMR/confirmReceipt",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/emr/${id}/receive`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Approve EMR request
export const approveExtraMaterialEMRThunk = createAsyncThunk(
    "shopfloorEMR/approve",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/emr/${id}/approve`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Reject EMR request
export const rejectExtraMaterialEMRThunk = createAsyncThunk(
    "shopfloorEMR/reject",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/emr/${id}/reject`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    emrs: [],
    loading: false,
    submitting: false,
    error: null
};

const shopfloorEMRSlice = createSlice({
    name: "shopfloorEMR",
    initialState,
    reducers: {
        clearEMRError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch EMR List
            .addCase(fetchExtraMaterialEMRListThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExtraMaterialEMRListThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.emrs = action.payload.data || [];
            })
            .addCase(fetchExtraMaterialEMRListThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Submit EMR Request
            .addCase(submitExtraMaterialEMRThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(submitExtraMaterialEMRThunk.fulfilled, (state, action) => {
                state.submitting = false;
                if (action.payload.data) {
                    state.emrs.unshift(action.payload.data);
                }
            })
            .addCase(submitExtraMaterialEMRThunk.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // Confirm EMR Receipt
            .addCase(confirmEMRReceiptThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(confirmEMRReceiptThunk.fulfilled, (state, action) => {
                state.submitting = false;
                if (action.payload.data) {
                    state.emrs = state.emrs.map(emr => 
                        emr._id === action.payload.data._id ? action.payload.data : emr
                    );
                }
            })
            .addCase(confirmEMRReceiptThunk.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // Approve EMR
            .addCase(approveExtraMaterialEMRThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(approveExtraMaterialEMRThunk.fulfilled, (state, action) => {
                state.submitting = false;
                if (action.payload.data) {
                    state.emrs = state.emrs.map(emr => 
                        emr._id === action.payload.data._id ? action.payload.data : emr
                    );
                }
            })
            .addCase(approveExtraMaterialEMRThunk.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // Reject EMR
            .addCase(rejectExtraMaterialEMRThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(rejectExtraMaterialEMRThunk.fulfilled, (state, action) => {
                state.submitting = false;
                if (action.payload.data) {
                    state.emrs = state.emrs.map(emr => 
                        emr._id === action.payload.data._id ? action.payload.data : emr
                    );
                }
            })
            .addCase(rejectExtraMaterialEMRThunk.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });
    }
});

export const { clearEMRError } = shopfloorEMRSlice.actions;
export default shopfloorEMRSlice.reducer;
