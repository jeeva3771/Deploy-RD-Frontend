import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";


export const fetchReadyJobs = createAsyncThunk(
    "readyJobs/fetchAll",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shop-floor/ready-jobs", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createReadyJob = createAsyncThunk(
    "readyJobs/create",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop-floor/ready-jobs", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const confirmHandoverThunk = createAsyncThunk(
    "readyJobs/confirmHandover",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/shop-floor/ready-jobs/${id}/handover`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    items: [],
    loading: false,
    submitting: false,
    error: null
};

const readyJobsSlice = createSlice({
    name: "readyJobs",
    initialState,
    reducers: {
        clearReadyJobsError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchReadyJobs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReadyJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data || [];
            })
            .addCase(fetchReadyJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create (triggered on Hand Over click in ProcessInputForm)
            .addCase(createReadyJob.pending, (state) => {
                state.submitting = true;
            })
            .addCase(createReadyJob.fulfilled, (state, action) => {
                state.submitting = false;
                // Optimistically prepend to items list
                if (action.payload.data) {
                    const exists = state.items.find(i => i._id === action.payload.data._id);
                    if (!exists) {
                        state.items.unshift(action.payload.data);
                    }
                }
            })
            .addCase(createReadyJob.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // Confirm Handover (removes the item from the pending list)
            .addCase(confirmHandoverThunk.pending, (state) => {
                state.submitting = true;
            })
            .addCase(confirmHandoverThunk.fulfilled, (state, action) => {
                state.submitting = false;
                // Remove the handed-over item from the items list
                if (action.payload.data) {
                    state.items = state.items.filter(
                        (item) => item._id !== action.payload.data._id
                    );
                }
            })
            .addCase(confirmHandoverThunk.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });
    }
});

export const { clearReadyJobsError } = readyJobsSlice.actions;
export default readyJobsSlice.reducer;
