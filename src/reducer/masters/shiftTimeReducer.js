import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../utils/url/config";

// ASYNC THUNKS
// Fetch all shift times
export const fetchAllShiftTimes = createAsyncThunk(
    "shiftTime/fetchAllShiftTimes",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/shifttime/get-all", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Create new shift time
export const createShiftTime = createAsyncThunk(
    "shiftTime/createShiftTime",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/shifttime/create`, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Update shift time
export const updateShiftTime = createAsyncThunk(
    "shiftTime/updateShiftTime",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                `/shifttime/update/${id}`,
                formData
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Delete shift time
export const deleteShiftTime = createAsyncThunk(
    "shiftTime/deleteShiftTime",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/shifttime/delete/${id}`);
            return { id, ...response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// INITIAL STATE
const initialState = {
    shiftTimes: [],
    selectedShiftTime: null,
    loading: false,
    pagination: {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
    },
    filters: {
        search: "",
    },
    sortConfig: {
        key: "created_at",
        direction: "desc",
    },
    error: null,
};

// SLICE
const shiftTimeSlice = createSlice({
    name: "shiftTime",
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = { search: "" };
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        resetPagination: (state) => {
            state.pagination = {
                page: 1,
                limit: 5,
                total: 0,
                totalPages: 0,
            };
        },
        setSortConfig: (state, action) => {
            state.sortConfig = { ...state.sortConfig, ...action.payload };
        },
        resetSortConfig: (state) => {
            state.sortConfig = {
                key: "created_at",
                direction: "desc",
            };
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch All
        builder
            .addCase(fetchAllShiftTimes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllShiftTimes.fulfilled, (state, action) => {
                state.loading = false;
                state.shiftTimes = action.payload.data || [];
                state.pagination.total = action.payload.totalCount || 0;
                state.pagination.totalPages = action.payload.totalPages || 0;
            })
            .addCase(fetchAllShiftTimes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error?.message;
            });

        // Create
        builder
            .addCase(createShiftTime.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createShiftTime.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(createShiftTime.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error?.message;
            });

        // Update
        builder
            .addCase(updateShiftTime.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateShiftTime.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(updateShiftTime.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error?.message;
            });

        // Delete
        builder
            .addCase(deleteShiftTime.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteShiftTime.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(deleteShiftTime.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error?.message;
            });
    },
});

export const {
    setFilters,
    resetFilters,
    setPagination,
    resetPagination,
    setSortConfig,
    resetSortConfig,
    clearError,
} = shiftTimeSlice.actions;

export default shiftTimeSlice.reducer;
