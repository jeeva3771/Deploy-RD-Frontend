import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Fetch requisitions
export const fetchRequisitionsThunk = createAsyncThunk(
    "shopfloorRequisition/fetchList",
    async (params, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params || {}).toString();
            const response = await axiosInstance.get(`/shop-floor/requisitions?${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Create a new requisition
export const createRequisitionThunk = createAsyncThunk(
    "shopfloorRequisition/create",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/requisitions", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Update requisition status
export const updateRequisitionStatusThunk = createAsyncThunk(
    "shopfloorRequisition/updateStatus",
    async ({ id, status, issued_qty }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/requisitions/${id}/status`, { status, issued_qty });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const shopfloorRequisitionSlice = createSlice({
    name: "shopfloorRequisition",
    initialState: {
        requisitions: [],
        loading: false,
        submitting: false,
        error: null
    },
    reducers: {
        clearRequisitionError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Requisitions
            .addCase(fetchRequisitionsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRequisitionsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.requisitions = action.payload.data || [];
            })
            .addCase(fetchRequisitionsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to fetch requisitions";
            })
            // Create Requisition
            .addCase(createRequisitionThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(createRequisitionThunk.fulfilled, (state, action) => {
                state.submitting = false;
                state.requisitions.unshift(action.payload.data);
            })
            .addCase(createRequisitionThunk.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload?.message || "Failed to raise requisition";
            })
            // Update Status
            .addCase(updateRequisitionStatusThunk.fulfilled, (state, action) => {
                const updated = action.payload.data;
                const index = state.requisitions.findIndex(r => r._id === updated._id);
                if (index !== -1) {
                    state.requisitions[index] = updated;
                }
            });
    }
});

export const { clearRequisitionError } = shopfloorRequisitionSlice.actions;
export default shopfloorRequisitionSlice.reducer;
