import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

export const fetchAllStoreIssues = createAsyncThunk(
    "store/fetchAll",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/store-issue/all", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const logMaterialIssue = createAsyncThunk(
    "store/logIssue",
    async ({ id, materialId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/store-issue/log/${id}/${materialId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const escalateStoreIssue = createAsyncThunk(
    "store/escalate",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/store-issue/escalate/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const authorizeStoreIssue = createAsyncThunk(
    "store/authorize",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/store-issue/authorize/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const migrateExistingStoreJobs = createAsyncThunk(
    "store/migrate",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/store-issue/migrate");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const clearStoreFlags = createAsyncThunk(
    "store/clearFlags",
    async ({ id, type }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/store-issue/clear-flags/${id}`, { type });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    issues: [],
    loading: false,
    error: null,
};

const storeSlice = createSlice({
    name: "store",
    initialState,
    reducers: {
        clearStoreError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchAllStoreIssues.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllStoreIssues.fulfilled, (state, action) => {
                state.loading = false;
                state.issues = action.payload.data || [];
            })
            .addCase(fetchAllStoreIssues.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Log Issue
            .addCase(logMaterialIssue.fulfilled, (state, action) => {
                const index = state.issues.findIndex(i => i._id === action.payload.data._id);
                if (index !== -1) {
                    state.issues[index] = action.payload.data;
                }
            })
            // Escalate
            .addCase(escalateStoreIssue.fulfilled, (state, action) => {
                const index = state.issues.findIndex(i => i._id === action.payload.data._id);
                if (index !== -1) {
                    state.issues[index] = action.payload.data;
                }
            })
            // Authorize
            .addCase(authorizeStoreIssue.fulfilled, (state, action) => {
                const index = state.issues.findIndex(i => i._id === action.payload.data._id);
                if (index !== -1) {
                    state.issues[index] = action.payload.data;
                }
            })
            // Clear Flags
            .addCase(clearStoreFlags.fulfilled, (state, action) => {
                const index = state.issues.findIndex(i => i._id === action.payload.data._id);
                if (index !== -1) {
                    state.issues[index] = action.payload.data;
                }
            })
            // Migrate
            .addCase(migrateExistingStoreJobs.pending, (state) => {
                state.loading = true;
            })
            .addCase(migrateExistingStoreJobs.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(migrateExistingStoreJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearStoreError } = storeSlice.actions;
export default storeSlice.reducer;
