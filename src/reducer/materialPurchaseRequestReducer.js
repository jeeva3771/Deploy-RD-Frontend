import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// THUNKS
export const fetchAllMaterialPurchaseRequests = createAsyncThunk("materialPurchaseRequest/fetchAll", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/store/material-purchase-request");
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
    }
});

export const createMaterialPurchaseRequest = createAsyncThunk("materialPurchaseRequest/create", async (requestData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post("/store/material-purchase-request", requestData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
    }
});

export const approveMaterialPurchaseRequest = createAsyncThunk("materialPurchaseRequest/approve", async ({ requestId, remark }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(`/store/material-purchase-request/approve/${requestId}`, { remark });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
    }
});

export const rejectMaterialPurchaseRequest = createAsyncThunk("materialPurchaseRequest/reject", async ({ requestId, remark }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(`/store/material-purchase-request/reject/${requestId}`, { remark });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
    }
});

export const updateMaterialPurchaseRequest = createAsyncThunk("materialPurchaseRequest/update", async ({ requestId, items }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(`/store/material-purchase-request/${requestId}`, { items });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
    }
});

const materialPurchaseRequestSlice = createSlice({
    name: "materialPurchaseRequest",
    initialState: {
        requests: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllMaterialPurchaseRequests.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllMaterialPurchaseRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload.data;
            })
            .addCase(fetchAllMaterialPurchaseRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to fetch requests";
            })
            .addCase(createMaterialPurchaseRequest.fulfilled, (state, action) => {
                state.requests.unshift(action.payload.data);
            })
            .addCase(approveMaterialPurchaseRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex(m => m._id === action.payload.data._id);
                if (index !== -1) {
                    state.requests[index] = action.payload.data;
                }
            })
            .addCase(rejectMaterialPurchaseRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex(m => m._id === action.payload.data._id);
                if (index !== -1) {
                    state.requests[index] = action.payload.data;
                }
            })
            .addCase(updateMaterialPurchaseRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex(m => m._id === action.payload.data._id);
                if (index !== -1) {
                    state.requests[index] = action.payload.data;
                }
            });
    },
});

export default materialPurchaseRequestSlice.reducer;
