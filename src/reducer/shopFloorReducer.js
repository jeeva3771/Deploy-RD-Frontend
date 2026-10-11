import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks
export const fetchShopFloorJobs = createAsyncThunk(
    "shopFloor/fetchJobs",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/jobs", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchShopFloorJobById = createAsyncThunk(
    "shopFloor/fetchJobById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/shop-floor/jobs/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateShopFloorJobStatus = createAsyncThunk(
    "shopFloor/updateStatus",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/jobs/${id}/status`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const syncShopFloorJobs = createAsyncThunk(
    "shopFloor/syncJobs",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/sync");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const recordMaterialInward = createAsyncThunk(
    "shopFloor/recordInward",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/jobs/${id}/inward`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchInwardLogs = createAsyncThunk(
    "shopFloor/fetchInwardLogs",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/inward-logs", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const clearShopFloorFlags = createAsyncThunk(
    "shopFloor/clearFlags",
    async ({ id, type }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/jobs/${id}/clear-flags`, { type });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
export const logShopFloorActivityApi = createAsyncThunk(
    "shopFloor/logActivity",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/jobs/${id}/log-activity`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


export const escalateShopFloorJob = createAsyncThunk(
    "shopFloor/escalateJob",
    async ({ id, payload = {} }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/jobs/${id}/escalate`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deEscalateShopFloorJob = createAsyncThunk(
    "shopFloor/deEscalateJob",
    async ({ id, payload = {} }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shop-floor/jobs/${id}/de-escalate`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const holdUnholdShopFloorJob = createAsyncThunk(
    "shopFloor/holdUnholdJob",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/jobs/${id}/hold`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchMaterialReturns = createAsyncThunk(
    "shopFloor/fetchMaterialReturns",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/material-returns", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const logMaterialReturn = createAsyncThunk(
    "shopFloor/logMaterialReturn",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/material-returns", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


const initialState = {
    jobs: [],
    completedCount: 0,
    loading: false,
    error: null,
};



const shopFloorSlice = createSlice({
    name: "shopFloor",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Jobs
            .addCase(fetchShopFloorJobs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchShopFloorJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.jobs = action.payload.data || [];
                state.completedCount = action.payload.completed_count || 0;
            })
            .addCase(fetchShopFloorJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Job By ID
            .addCase(fetchShopFloorJobById.pending, (state) => {
                // No-op: Do not set global loading state to prevent board flickering
            })
            .addCase(fetchShopFloorJobById.fulfilled, (state, action) => {
                if (action.payload.data) {
                    const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                    if (index !== -1) {
                        state.jobs[index] = action.payload.data;
                    }
                }
            })
            .addCase(fetchShopFloorJobById.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Update Status
            .addCase(updateShopFloorJobStatus.pending, (state) => {
                // No-op: Do not set global loading state to prevent board flickering
            })
            .addCase(updateShopFloorJobStatus.fulfilled, (state, action) => {
                const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            .addCase(updateShopFloorJobStatus.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Sync Jobs
            .addCase(syncShopFloorJobs.pending, (state) => {
                // No-op: Do not set global loading state to prevent board flickering
            })
            .addCase(syncShopFloorJobs.fulfilled, (state) => {
                // No-op
            })
            .addCase(syncShopFloorJobs.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Clear Flags
            .addCase(clearShopFloorFlags.fulfilled, (state, action) => {
                if (action.payload.data) {
                    const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                    if (index !== -1) {
                        state.jobs[index] = action.payload.data;
                    }
                }
            })
            // Escalate Job
            .addCase(escalateShopFloorJob.pending, (state) => {
                // No-op
            })
            .addCase(escalateShopFloorJob.fulfilled, (state, action) => {
                if (action.payload.data) {
                    const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                    if (index !== -1) {
                        state.jobs[index] = action.payload.data;
                    }
                }
            })
            .addCase(escalateShopFloorJob.rejected, (state, action) => {
                state.error = action.payload;
            })
            // De-escalate Job
            .addCase(deEscalateShopFloorJob.pending, (state) => {
                // No-op
            })
            .addCase(deEscalateShopFloorJob.fulfilled, (state, action) => {
                if (action.payload.data) {
                    const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                    if (index !== -1) {
                        state.jobs[index] = action.payload.data;
                    }
                }
            })
            .addCase(deEscalateShopFloorJob.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Record Inward
            .addCase(recordMaterialInward.pending, (state) => {
                // No-op
            })
            .addCase(recordMaterialInward.fulfilled, (state, action) => {
                if (action.payload.data) {
                    const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                    if (index !== -1) {
                        state.jobs[index] = action.payload.data;
                    }
                }
            })
            .addCase(recordMaterialInward.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Log Activity
            .addCase(logShopFloorActivityApi.fulfilled, (state, action) => {
                if (action.payload.data) {
                    const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                    if (index !== -1) {
                        state.jobs[index] = action.payload.data;
                    }
                }
            });
    },
});

export const { clearError } = shopFloorSlice.actions;
export default shopFloorSlice.reducer;
