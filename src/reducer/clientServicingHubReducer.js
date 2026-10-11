import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Fetch aggregated summary counts for all lanes & stations
export const fetchClientServicingCounts = createAsyncThunk(
    "clientServicingHub/fetchCounts",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/client-servicing-hub/counts", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Fetch lazy-loaded paginated station jobs list for popup drawer
export const fetchStationJobs = createAsyncThunk(
    "clientServicingHub/fetchStationJobs",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/client-servicing-hub/station-jobs", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    counts: null,
    stats: null,
    ownerCounts: null,
    dueTodayFloor: null,
    loadingCounts: false,

    stationJobs: [],
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    },
    loadingStationJobs: false,
    error: null
};

const clientServicingHubSlice = createSlice({
    name: "clientServicingHub",
    initialState,
    reducers: {
        clearStationJobs: (state) => {
            state.stationJobs = [];
            state.pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
        }
    },
    extraReducers: (builder) => {
        builder
            // Counts
            .addCase(fetchClientServicingCounts.pending, (state) => {
                state.loadingCounts = true;
            })
            .addCase(fetchClientServicingCounts.fulfilled, (state, action) => {
                state.loadingCounts = false;
                state.counts = action.payload?.counts || null;
                state.stats = action.payload?.stats || null;
                state.ownerCounts = action.payload?.ownerCounts || null;
                state.dueTodayFloor = action.payload?.dueTodayFloor || null;
            })
            .addCase(fetchClientServicingCounts.rejected, (state, action) => {
                state.loadingCounts = false;
                state.error = action.payload;
            })
            // Station Jobs
            .addCase(fetchStationJobs.pending, (state) => {
                state.loadingStationJobs = true;
            })
            .addCase(fetchStationJobs.fulfilled, (state, action) => {
                state.loadingStationJobs = false;
                state.stationJobs = action.payload?.data || [];
                state.pagination = {
                    page: action.payload?.page || 1,
                    limit: action.payload?.limit || 10,
                    total: action.payload?.total || 0,
                    totalPages: action.payload?.totalPages || 1
                };
            })
            .addCase(fetchStationJobs.rejected, (state, action) => {
                state.loadingStationJobs = false;
                state.error = action.payload;
            });
    }
});

export const { clearStationJobs } = clientServicingHubSlice.actions;
export default clientServicingHubSlice.reducer;
