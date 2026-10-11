import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const fetchCtQcJobs = createAsyncThunk(
    "ctQc/fetchJobs",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/ct-qc", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitCtQcArrival = createAsyncThunk(
    "ctQc/arrival",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/ct-qc/arrival/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitCtQcInward = createAsyncThunk(
    "ctQc/inward",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/ct-qc/inward/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitCtQcHandover = createAsyncThunk(
    "ctQc/handover",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/ct-qc/handover-packing/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitCtQcRejectionHandover = createAsyncThunk(
    "ctQc/rejectionHandover",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/ct-qc/handover-rejection/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    jobs: [],
    counts: { 'Pending': 0, 'In QC': 0, 'QC Completed': 0, 'ALL': 0 },
    pagination: { page: 1, limit: 8, total: 0, totalPages: 1 },
    filters: { status: 'ALL', search: '' },
    loading: false,
    error: null,
};

const ctQcSlice = createSlice({
    name: "ctQc",
    initialState,
    reducers: {
        setCtQcFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setCtQcPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        clearCtQcError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCtQcJobs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCtQcJobs.fulfilled, (state, action) => {
                state.loading = false;
                const { data, counts, pagination } = action.payload || {};
                
                if (counts) state.counts = counts;
                if (pagination) state.pagination = pagination;
                
                // Map the data right in the reducer
                state.jobs = (data || action.payload || []).map(j => ({
                    id: j._id,
                    job_no: j.sub_job_no,
                    client_name: j.client_name,
                    product: j.product_name,
                    product_image: j.product_image,
                    order_qty: j.total_qty,
                    uom: 'pcs',
                    priority: j.priority || 'NORMAL',
                    stage: j.stage,
                    status: j.status,
                    job_completion_date: j.job_completion_date,
                    delivery_date: j.delivery_date,
                    qc: {
                        pendingArrival: (j.received_from_inward || 0) - (j.arrived_qty || 0),
                        pending: (j.arrived_qty || 0) - (j.qc_good_qty || 0) - (j.qc_bad_qty || 0),
                        good: j.qc_good_qty || 0,
                        bad: j.qc_bad_qty || 0,
                        rejectedHandover: j.rejected_handover_qty || 0,
                        received: j.received_from_inward || 0,
                        arrived: j.arrived_qty || 0
                    },
                    packing: { packed: j.released_to_packing_qty || 0 },
                    logs: j.logs || []
                }));
            })
            .addCase(fetchCtQcJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setCtQcFilters, setCtQcPagination, clearCtQcError } = ctQcSlice.actions;
export default ctQcSlice.reducer;
