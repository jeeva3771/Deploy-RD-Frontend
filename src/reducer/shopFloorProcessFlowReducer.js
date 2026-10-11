import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks
export const fetchProcessFlow = createAsyncThunk(
    "shopFloorProcessFlow/fetchProcessFlow",
    async ({ shopfloor_job_id, group_id }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/shop-floor/process-flow/${shopfloor_job_id}/${group_id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const startSampleCycleApi = createAsyncThunk(
    "shopFloorProcessFlow/startSampleCycle",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/process-flow/start-sample", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const completeSampleCycleApi = createAsyncThunk(
    "shopFloorProcessFlow/completeSampleCycle",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/process-flow/complete-sample", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitSampleForApprovalApi = createAsyncThunk(
    "shopFloorProcessFlow/submitSampleApproval",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/process-flow/submit-approval", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const processSampleActionApi = createAsyncThunk(
    "shopFloorProcessFlow/processSampleAction",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/process-flow/process-action", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchSalesSampleQueueApi = createAsyncThunk(
    "shopFloorProcessFlow/fetchSalesSampleQueue",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/process-flow/sales-sample-queue");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const startPrimaryCycleApi = createAsyncThunk(
    "shopFloorProcessFlow/startPrimaryCycle",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/process-flow/start-primary", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const syncSessionStateApi = createAsyncThunk(
    "shopFloorProcessFlow/syncSessionState",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put("/shop-floor/process-flow/sync-session", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const confirmCompletionPopupApi = createAsyncThunk(
    "shopFloorProcessFlow/confirmCompletionPopup",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/process-flow/confirm-completion-popup", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchRejectedMaterialsApi = createAsyncThunk(
    "shopFloorProcessFlow/fetchRejectedMaterials",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/rejected-materials");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchInventoryLogsApi = createAsyncThunk(
    "shopFloorProcessFlow/fetchInventoryLogs",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/inventory-registers/logs");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


export const updateDisposalStatusApi = createAsyncThunk(
    "shopFloorProcessFlow/updateDisposalStatus",
    async ({ id, is_dispose }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/rejected-materials/${id}/dispose`, { is_dispose });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateResoldStatusApi = createAsyncThunk(
    "shopFloorProcessFlow/updateResoldStatus",
    async ({ id, resold }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/rejected-materials/${id}/resold`, { resold });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createRejectedMaterialDisposalApi = createAsyncThunk(
    "shopFloorProcessFlow/createRejectedMaterialDisposal",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/rejected-materials/disposal", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    processFlows: {}, // Store flows keyed by group_id
    rejectedMaterials: [],
    processFlowRejections: [],
    loading: false,
    error: null,
};

const shopFloorProcessFlowSlice = createSlice({
    name: "shopFloorProcessFlow",
    initialState,
    reducers: {
        clearProcessFlowError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Rejected Materials
            .addCase(fetchRejectedMaterialsApi.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRejectedMaterialsApi.fulfilled, (state, action) => {
                state.loading = false;
                state.rejectedMaterials = action.payload.list || [];
            })
            .addCase(fetchRejectedMaterialsApi.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Inventory Logs
            .addCase(fetchInventoryLogsApi.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInventoryLogsApi.fulfilled, (state, action) => {
                state.loading = false;
                state.processFlowRejections = action.payload.rejections || [];
            })
            .addCase(fetchInventoryLogsApi.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Disposal Status
            .addCase(updateDisposalStatusApi.pending, (state) => {
                state.error = null;
            })
            .addCase(updateDisposalStatusApi.fulfilled, (state, action) => {
                if (action.payload.success && action.payload.record) {
                    const record = action.payload.record;
                    state.rejectedMaterials = state.rejectedMaterials.map(item =>
                        item._id === record._id ? record : item
                    );
                }
            })
            .addCase(updateDisposalStatusApi.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Update Resold Status
            .addCase(updateResoldStatusApi.pending, (state) => {
                state.error = null;
            })
            .addCase(updateResoldStatusApi.fulfilled, (state, action) => {
                if (action.payload.success && action.payload.record) {
                    const record = action.payload.record;
                    state.rejectedMaterials = state.rejectedMaterials.map(item =>
                        item._id === record._id ? record : item
                    );
                }
            })
            .addCase(updateResoldStatusApi.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Create Disposal
            .addCase(createRejectedMaterialDisposalApi.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createRejectedMaterialDisposalApi.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success && action.payload.record) {
                    state.rejectedMaterials.unshift(action.payload.record);
                }
            })
            .addCase(createRejectedMaterialDisposalApi.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addMatcher(
                (action) => [
                    fetchProcessFlow.fulfilled.type,
                    startSampleCycleApi.fulfilled.type,
                    completeSampleCycleApi.fulfilled.type,
                    submitSampleForApprovalApi.fulfilled.type,
                    processSampleActionApi.fulfilled.type,
                    startPrimaryCycleApi.fulfilled.type,
                    syncSessionStateApi.fulfilled.type,
                    confirmCompletionPopupApi.fulfilled.type
                ].includes(action.type),
                (state, action) => {
                    const { flow } = action.payload;
                    if (flow) {
                        state.processFlows[flow.group_id] = flow;
                    }
                }
            )
            .addMatcher(
                (action) => [
                    fetchProcessFlow.pending.type,
                    startSampleCycleApi.pending.type,
                    completeSampleCycleApi.pending.type,
                    submitSampleForApprovalApi.pending.type,
                    processSampleActionApi.pending.type,
                    startPrimaryCycleApi.pending.type,
                    syncSessionStateApi.pending.type,
                    confirmCompletionPopupApi.pending.type
                ].includes(action.type),
                (state) => {
                    state.loading = true;
                }
            )
            .addMatcher(
                (action) => [
                    fetchProcessFlow.fulfilled.type,
                    startSampleCycleApi.fulfilled.type,
                    completeSampleCycleApi.fulfilled.type,
                    submitSampleForApprovalApi.fulfilled.type,
                    processSampleActionApi.fulfilled.type,
                    startPrimaryCycleApi.fulfilled.type,
                    syncSessionStateApi.fulfilled.type,
                    confirmCompletionPopupApi.fulfilled.type,
                    fetchProcessFlow.rejected.type,
                    startSampleCycleApi.rejected.type,
                    completeSampleCycleApi.rejected.type,
                    submitSampleForApprovalApi.rejected.type,
                    processSampleActionApi.rejected.type,
                    startPrimaryCycleApi.rejected.type,
                    syncSessionStateApi.rejected.type,
                    confirmCompletionPopupApi.rejected.type
                ].includes(action.type),
                (state) => {
                    state.loading = false;
                }
            )
            .addMatcher(
                (action) => [
                    fetchProcessFlow.rejected.type,
                    startSampleCycleApi.rejected.type,
                    completeSampleCycleApi.rejected.type,
                    submitSampleForApprovalApi.rejected.type,
                    processSampleActionApi.rejected.type,
                    startPrimaryCycleApi.rejected.type,
                    syncSessionStateApi.rejected.type,
                    confirmCompletionPopupApi.rejected.type
                ].includes(action.type),
                (state, action) => {
                    state.error = action.payload;
                }
            );
    },
});

export const { clearProcessFlowError } = shopFloorProcessFlowSlice.actions;
export default shopFloorProcessFlowSlice.reducer;
