import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// ─── Procurement Coordination Thunks ─────────────────────────────────────────

export const fetchCoordRFQs = createAsyncThunk(
    "rfq/fetchCoordRFQs",
    async (params = {}, { rejectWithValue }) => {
        try {
            // If params is a string/id (legacy support), convert to object
            const queryParams = typeof params === 'string' ? { creatorId: params } : params;
            const { data } = await axiosInstance.get("/rfq/coord/list", { params: queryParams });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to fetch coordination RFQs");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to fetch coordination RFQs");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateAwardCoordStage = createAsyncThunk(
    "rfq/updateAwardCoordStage",
    async ({ rfqId, poNumber, coordStage, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/stage`, { coordStage, note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to update PO stage");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to update PO stage");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateAwardCoordETA = createAsyncThunk(
    "rfq/updateAwardCoordETA",
    async ({ rfqId, poNumber, deliveryDate, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/eta`, { deliveryDate, note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to update PO ETA");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to update PO ETA");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const restoreAwardCoordETA = createAsyncThunk(
    "rfq/restoreAwardCoordETA",
    async ({ rfqId, poNumber }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/restore-eta`);
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to restore PO ETA");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to restore PO ETA");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const addAwardCoordRemark = createAsyncThunk(
    "rfq/addAwardCoordRemark",
    async ({ rfqId, poNumber, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/remark`, { note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to add PO remark");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to add PO remark");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateAwardInwardAccounting = createAsyncThunk(
    "rfq/updateAwardInwardAccounting",
    async ({ rfqId, poNumber, ordered, inwardGood, rejected, reinward }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/inward`, { ordered, inwardGood, rejected, reinward });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to update PO inward");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to update PO inward");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const awardInwardAction = createAsyncThunk(
    "rfq/awardInwardAction",
    async ({ rfqId, poNumber, action, qty, qtyPassed, qtyFailed, challan, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/inward-action`, { action, qty, qtyPassed, qtyFailed, challan, note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Action failed");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Action failed");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const acceptAwardQtyChange = createAsyncThunk(
    "rfq/acceptAwardQtyChange",
    async ({ rfqId, poNumber }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/accept-qty`);
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to accept qty change");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to accept qty change");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const acceptAwardDateChange = createAsyncThunk(
    "rfq/acceptAwardDateChange",
    async ({ rfqId, poNumber }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${rfqId}/award/${poNumber}/accept-date`);
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to accept date change");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to accept date change");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateCoordStage = createAsyncThunk(
    "rfq/updateCoordStage",
    async ({ id, coordStage, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${id}/stage`, { coordStage, note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to update stage");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to update stage");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateCoordETA = createAsyncThunk(
    "rfq/updateCoordETA",
    async ({ id, deliveryDate, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${id}/eta`, { deliveryDate, note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to update ETA");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to update ETA");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const addCoordRemark = createAsyncThunk(
    "rfq/addCoordRemark",
    async ({ id, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${id}/remark`, { note });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to add remark");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to add remark");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateInwardAccounting = createAsyncThunk(
    "rfq/updateInwardAccounting",
    async ({ id, ordered, inwardGood, rejected, reInward }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/coord/${id}/inward`, { ordered, inwardGood, rejected, reInward });
            if (data.success) return data.data;
            return rejectWithValue(data.message || "Failed to update inward");
        } catch (error) {
            if (error instanceof AxiosError)
                return rejectWithValue(error.response?.data?.message || "Failed to update inward");
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Fetch all RFQs
export const fetchItems = createAsyncThunk(
    "rfq/fetchItems",
    async (params = {}, { rejectWithValue }) => {
        try {
            // If params is a string/id (legacy support), convert to object
            const queryParams = typeof params === 'string' ? { creatorId: params } : params;
            const { data } = await axiosInstance.get("/rfq", { params: queryParams });
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to fetch RFQs");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to fetch RFQs");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Fetch Available Jobs
export const fetchAvailableJobs = createAsyncThunk(
    "rfq/fetchAvailableJobs",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/rfq/jobs-list');
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to fetch available jobs");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to fetch available jobs");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Add Multiple RFQs
export const addRFQs = createAsyncThunk(
    "rfq/addRFQs",
    async (rfqs, { dispatch, rejectWithValue }) => {
        try {
            const createdRFQs = [];
            for (const rfq of rfqs) {
                let payload = rfq;
                let headers = {};

                // If image is a File object, use FormData
                if (rfq.image instanceof File) {
                    const formData = new FormData();
                    Object.keys(rfq).forEach(key => {
                        if (key === 'image') {
                            formData.append('image', rfq.image);
                        } else if (Array.isArray(rfq[key]) || typeof rfq[key] === 'object') {
                            formData.append(key, JSON.stringify(rfq[key]));
                        } else {
                            formData.append(key, rfq[key]);
                        }
                    });
                    payload = formData;
                    headers = { "Content-Type": "multipart/form-data" };
                }

                const { data } = await axiosInstance.post('/rfq', payload, { headers });
                if (data.success) {
                    createdRFQs.push(data.data);
                }
            }
            // Refresh after adding and wait for completion to ensure UI sync
            await dispatch(fetchItems()).unwrap();
            await dispatch(fetchAvailableJobs()).unwrap();
            return createdRFQs;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to create RFQs");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Update RFQ
export const updateRFQ = createAsyncThunk(
    "rfq/updateRFQ",
    async (updatedItem, { dispatch, rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put(`/rfq/${updatedItem._id}`, updatedItem);
            if (data.success) {
                dispatch(fetchAvailableJobs());
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to update RFQ");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to update RFQ");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Patch RFQ Image
export const patchRFQImage = createAsyncThunk(
    "rfq/patchRFQImage",
    async ({ id, img }, { rejectWithValue }) => {
        try {
            let payload = { image: img };
            let headers = {};

            if (img instanceof File) {
                const formData = new FormData();
                formData.append('image', img);
                payload = formData;
            }

            const { data } = await axiosInstance.put(`/rfq/${id}`, payload, { headers });
            return { id, image: data.data?.image || (typeof img === 'string' ? img : '') };
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to patch RFQ image");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Fetch Packing Available Jobs
export const fetchPackingAvailableJobs = createAsyncThunk(
    "rfq/fetchPackingAvailableJobs",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/rfq/packing-jobs-list');
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to fetch packing jobs");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to fetch packing jobs");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Fetch Sub Jobs
export const fetchSubJobs = createAsyncThunk(
    "rfq/fetchSubJobs",
    async ({ jobNo, tab }, { rejectWithValue }) => {
        try {
            const endpoint = tab === 'AI' ? `/rfq/packing-sub-jobs/${jobNo}` : `/rfq/sub-jobs/${jobNo}`;
            const { data } = await axiosInstance.get(endpoint);
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to fetch sub-jobs");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to fetch sub-jobs");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Fetch Job Details
export const fetchJobDetails = createAsyncThunk(
    "rfq/fetchJobDetails",
    async ({ id, tab }, { rejectWithValue }) => {
        try {
            const endpoint = tab === 'AI' ? `/rfq/packing-details/${id}`
                : tab === 'STORE' ? `/rfq/store-request-details/${id}`
                    : `/rfq/job-details/${id}`;
            const { data } = await axiosInstance.get(endpoint);
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to fetch job details");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to fetch job details");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Fetch Store Pending Requests
export const fetchStorePendingRequests = createAsyncThunk(
    "rfq/fetchStorePendingRequests",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/rfq/store-requests');
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to fetch store requests");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to fetch store requests");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Mark Pack Purchased
export const markPackPurchased = createAsyncThunk(
    "rfq/markPackPurchased",
    async (salesOrderId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/rfq/mark-pack-purchased/${salesOrderId}`);
            if (data.success) {
                return data.data;
            }
            return rejectWithValue(data.message || "Failed to mark pack purchased");
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data?.message || "Failed to mark pack");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Broadcast RFQ to selected vendors
export const broadcastRFQ = createAsyncThunk(
    "rfq/broadcastRFQ",
    async ({ id, vendorIds, deliveryDate, deliveryTime, isSplit, schedule, linksDuration, remarks, sendEmail, sendWhatsapp }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/rfq/broadcast/${id}`, {
                vendorIds, deliveryDate, deliveryTime, isSplit, schedule, linksDuration, remarks, sendEmail, sendWhatsapp
            });
            if (data.success) {
                return { id, quoteLink: data.data.quoteLink, vendorTokens: data.data.vendorTokens };
            }
            return rejectWithValue(data.message || "Broadcast failed");
        } catch (error) {
            if (error.isAxiosError || error.response) {
                return rejectWithValue(error.response?.data?.message || error.message || "Broadcast failed");
            }
            return rejectWithValue(error.message || "An unexpected error occurred");
        }
    }
);

const initialState = {
    items: [],
    coordRFQs: [],          // Active POs for Procurement Coordination
    availableJobs: [],
    packingAvailableJobs: [],
    storeAvailableRequests: [],
    subJobs: [],
    jobDetails: null,
    isLoading: false,
    coordLoading: false,
    error: null,
};

const rfqSlice = createSlice({
    name: "rfq",
    initialState,
    reducers: {
        clearJobDetails: (state) => {
            state.jobDetails = null;
        },
        clearSubJobs: (state) => {
            state.subJobs = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Items
            .addCase(fetchItems.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchItems.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
            })
            .addCase(fetchItems.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch Available Jobs
            .addCase(fetchAvailableJobs.fulfilled, (state, action) => {
                state.availableJobs = action.payload;
            })

            // Fetch Packing Available Jobs
            .addCase(fetchPackingAvailableJobs.fulfilled, (state, action) => {
                state.packingAvailableJobs = action.payload;
            })

            // Fetch Store Available Requests
            .addCase(fetchStorePendingRequests.fulfilled, (state, action) => {
                state.storeAvailableRequests = action.payload;
            })

            // Fetch Sub Jobs
            .addCase(fetchSubJobs.fulfilled, (state, action) => {
                state.subJobs = action.payload;
            })

            // Fetch Job Details
            .addCase(fetchJobDetails.fulfilled, (state, action) => {
                state.jobDetails = action.payload;
            })

            // Update RFQ (optimistic or payload merge)
            .addCase(updateRFQ.fulfilled, (state, action) => {
                const updated = action.payload;
                state.items = state.items.map(i => i._id === updated._id ? updated : i);
            })

            // Patch Image (optimistic merge)
            .addCase(patchRFQImage.fulfilled, (state, action) => {
                const { id, image } = action.payload;
                state.items = state.items.map(i => i._id === id ? { ...i, image } : i);
            })

            // Broadcast RFQ — update stage in Redux store
            .addCase(broadcastRFQ.fulfilled, (state, action) => {
                const { id } = action.payload;
                state.items = state.items.map(i =>
                    i._id === id
                        ? { ...i, stage: '2. Assign Vendors' }
                        : i
                );
            })

            // ── Procurement Coordination ──────────────────────────────────
            .addCase(fetchCoordRFQs.pending, (state) => {
                state.coordLoading = true;
            })
            .addCase(fetchCoordRFQs.fulfilled, (state, action) => {
                state.coordLoading = false;
                state.coordRFQs = action.payload;
            })
            .addCase(fetchCoordRFQs.rejected, (state) => {
                state.coordLoading = false;
            })

            // Helper: merge a single updated RFQ into coordRFQs
            .addCase(updateAwardCoordStage.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(updateAwardCoordETA.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
                state.items = state.items.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(restoreAwardCoordETA.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
                state.items = state.items.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(addAwardCoordRemark.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(updateAwardInwardAccounting.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(awardInwardAction.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(acceptAwardQtyChange.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
            })
            .addCase(acceptAwardDateChange.fulfilled, (state, action) => {
                const upd = action.payload;
                state.coordRFQs = state.coordRFQs.map(r => r._id === upd._id ? upd : r);
            });
    },
});

export const { clearJobDetails, clearSubJobs } = rfqSlice.actions;
export default rfqSlice.reducer;
