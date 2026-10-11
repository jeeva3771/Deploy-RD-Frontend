import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks for Job Ledger
export const fetchJobLedgerList = createAsyncThunk(
    "jobLedger/fetchList",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/job-ledger/jobs", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch Job Ledger records");
        }
    }
);

export const fetchJobLedgerByJobNo = createAsyncThunk(
    "jobLedger/fetchByJobNo",
    async (jobNo, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/job-ledger/${jobNo}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || `Failed to fetch details for job ${jobNo}`);
        }
    }
);

const initialState = {
    jobs: [],
    selectedJobDetails: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    }
};

const jobLedgerSlice = createSlice({
    name: "jobLedger",
    initialState,
    reducers: {
        clearJobLedgerError: (state) => {
            state.error = null;
        },
        setJobLedgerPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        resetJobLedgerPagination: (state) => {
            state.pagination = {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 1,
            };
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch List
            .addCase(fetchJobLedgerList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchJobLedgerList.fulfilled, (state, action) => {
                state.loading = false;
                state.jobs = action.payload.data || [];
                if (action.payload.total !== undefined) {
                    state.pagination = {
                        page: action.payload.page || state.pagination.page,
                        limit: action.payload.limit || state.pagination.limit,
                        total: action.payload.total,
                        totalPages: action.payload.totalPages || 1,
                    };
                }
            })
            .addCase(fetchJobLedgerList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Single Job
            .addCase(fetchJobLedgerByJobNo.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchJobLedgerByJobNo.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedJobDetails = action.payload.data || null;
            })
            .addCase(fetchJobLedgerByJobNo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearJobLedgerError, setJobLedgerPagination, resetJobLedgerPagination } = jobLedgerSlice.actions;
export default jobLedgerSlice.reducer;
