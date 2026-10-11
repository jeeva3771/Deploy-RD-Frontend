import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const fetchFgStoreJobs = createAsyncThunk(
    "fgStore/fetchJobs",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/fg-store", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const syncFgStoreJobs = createAsyncThunk(
    "fgStore/syncJobs",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/fg-store/sync");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitFgStoreInward = createAsyncThunk(
    "fgStore/inward",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/fg-store/inward/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitFgStoreHandover = createAsyncThunk(
    "fgStore/handover",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/fg-store/handover/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitFgStoreInvoice = createAsyncThunk(
    "fgStore/invoice",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/fg-store/invoice/${jobId}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    jobs: [],
    counts: { INWARD: 0, QC: 0, PACKING: 0, INVOICE: 0, DISPATCHED: 0, ALL: 0 },
    pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
    filters: { stage: 'ALL', search: '' },
    loading: false,
    error: null,
};

const fgStoreSlice = createSlice({
    name: "fgStore",
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        clearFgStoreError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFgStoreJobs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchFgStoreJobs.fulfilled, (state, action) => {
                state.loading = false;
                const { data, counts, pagination } = action.payload || {};
                
                if (counts) state.counts = counts;
                if (pagination) state.pagination = pagination;

                state.jobs = (data || action.payload || []).map(j => ({
                    id: j._id,
                    job_no: j.sub_job_no,
                    client_name: j.client_name,
                    client_phone: j.client_phone,
                    client_email: j.client_email,
                    client_address: j.client_address,
                    product: j.product_name,
                    product_image: j.product_image,
                    order_qty: j.total_qty,
                    shopfloor_handed_over_qty: j.shopfloor_handed_over_qty || 0,
                    unit_price: j.unit_price,
                    uom: 'pcs',
                    stage: j.stage,
                    job_completion_date: j.job_completion_date,
                    delivery_date: j.delivery_date,
                    inward: { received: j.inward_qty || 0, good: j.qc_qty || 0, bad: j.qc_bad_qty || 0 },
                    qc: j.qc || { pending: 0, good: 0, bad: 0, received: 0 },
                    pack: j.pack || null,
                    packing: { packed: j.packed_qty || 0 },
                    invoice: { qty: j.invoiced_qty || 0 },
                    dispatch: { qty: j.dispatched_qty || 0 },
                    invoices: j.invoices || [],
                    logs: j.logs || []
                }));
            })
            .addCase(fetchFgStoreJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setFilters, setPagination, clearFgStoreError } = fgStoreSlice.actions;
export default fgStoreSlice.reducer;
