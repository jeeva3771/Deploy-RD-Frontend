import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

export const fetchAllDTPJobs = createAsyncThunk(
    "dtpStudio/fetchAll",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/dtp-studio", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchDTPJobById = createAsyncThunk(
    "dtpStudio/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/dtp-studio/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateDTPStage = createAsyncThunk(
    "dtpStudio/updateStage",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                `/dtp-studio/stage/${id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const reworkDTPJob = createAsyncThunk(
    "dtpStudio/rework",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/rework/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const assignDTPJob = createAsyncThunk(
    "dtpStudio/assign",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/assign/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadProof = createAsyncThunk(
    "dtpStudio/uploadProof",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                `/dtp-studio/upload-proof/${id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const approveRejectProof = createAsyncThunk(
    "dtpStudio/approveRejectProof",
    async ({ id, fileId, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                `/dtp-studio/approve-reject-proof/${id}/${fileId}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteProof = createAsyncThunk(
    "dtpStudio/deleteProof",
    async ({ id, fileId, type }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/dtp-studio/proof/${id}/${type}/${fileId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateJobStatus = createAsyncThunk(
    "dtpStudio/updateStatus",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/update-status/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createDTPJobGroup = createAsyncThunk(
    "dtpStudio/createGroup",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/dtp-studio/create-group", payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchDTPGroupById = createAsyncThunk(
    "dtpStudio/fetchGroupById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/dtp-studio/group/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadFinalPrepFile = createAsyncThunk(
    "dtpStudio/uploadFinalPrepFile",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                `/dtp-studio/upload-final-prep/${id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteFinalPrepFile = createAsyncThunk(
    "dtpStudio/deleteFinalPrepFile",
    async ({ id, materialGroupId, fileType, fileId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/dtp-studio/delete-final-prep/${id}/${materialGroupId}/${fileType}/${fileId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateFinalPrepSectionStatus = createAsyncThunk(
    "dtpStudio/updateFinalPrepSectionStatus",
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/update-final-prep-section-status/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateAccountingDetails = createAsyncThunk(
    "dtpStudio/updateAccountingDetails",
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/update-accounting-details/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadAccountingFile = createAsyncThunk(
    "dtpStudio/uploadAccountingFile",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                `/dtp-studio/upload-accounting-file/${id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteAccountingFile = createAsyncThunk(
    "dtpStudio/deleteAccountingFile",
    async ({ id, fileId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/dtp-studio/delete-accounting-file/${id}/${fileId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const holdUnholdDTPJob = createAsyncThunk(
    "dtpStudio/holdUnholdJob",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/hold-unhold/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const holdUnholdDTPGroup = createAsyncThunk(
    "dtpStudio/holdUnholdGroup",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/group/hold-unhold/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const sendUrgencyPrompt = createAsyncThunk(
    "dtpStudio/sendUrgencyPrompt",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/send-urgency-prompt/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const rollbackToContentProofing = createAsyncThunk(
    "dtpStudio/rollbackToContentProofing",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/rollback/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const clearDTPChangeFlag = createAsyncThunk(
    "dtpStudio/clearChangeFlag",
    async ({ id, type }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/clear-flags/${id}`, { type });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateDTPJobDetails = createAsyncThunk(
    "dtpStudio/updateDetails",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/dtp-studio/update-details/${id}`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


const initialState = {
    jobs: [],
    currentJob: null,
    loading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        totalPages: 1
    }
};

const dtpStudioSlice = createSlice({
    name: "dtpStudio",
    initialState,
    reducers: {
        clearCurrentJob: (state) => {
            state.currentJob = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchAllDTPJobs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllDTPJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.jobs = action.payload.data || [];
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchAllDTPJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch By ID
            .addCase(fetchDTPJobById.pending, (state) => {
                // No-op: Do not set global loading state to prevent dashboard flickering
            })
            .addCase(fetchDTPJobById.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
            })
            .addCase(fetchDTPJobById.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Update Stage
            .addCase(updateDTPStage.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                // Optionally update the job in the list as well
                const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Rework
            .addCase(reworkDTPJob.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Assign Job
            .addCase(assignDTPJob.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Update Job Status
            .addCase(updateJobStatus.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // // Upload Master Proof
            // .addCase(uploadMasterProof.fulfilled, (state, action) => {
            //     state.currentJob = action.payload.data;
            //     const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
            //     if (index !== -1) {
            //         state.jobs[index] = action.payload.data;
            //     }
            // })
            // // Approve/Reject Master Proof
            // .addCase(approveRejectMasterProof.fulfilled, (state, action) => {
            //     state.currentJob = action.payload.data;
            //     const index = state.jobs.findIndex(j => j._id === action.payload.data._id);
            //     if (index !== -1) {
            //         state.jobs[index] = action.payload.data;
            //     }
            // })
            // Upload Proof (Generic)
            .addCase(uploadProof.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Approve/Reject Proof (Generic)
            .addCase(approveRejectProof.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Delete Proof
            .addCase(deleteProof.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Upload Final Prep File
            .addCase(uploadFinalPrepFile.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Delete Final Prep File
            .addCase(deleteFinalPrepFile.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Update Final Prep Section Status
            .addCase(updateFinalPrepSectionStatus.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Update Accounting Details
            .addCase(updateAccountingDetails.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Upload Accounting File
            .addCase(uploadAccountingFile.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Delete Accounting File
            .addCase(deleteAccountingFile.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Hold/Unhold Job
            .addCase(holdUnholdDTPJob.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Hold/Unhold Group
            .addCase(holdUnholdDTPGroup.fulfilled, (state, action) => {
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                // Since group hold cascades to jobs, we might need to refresh the whole list if we want immediate consistency in UI, 
                // but usually the backend returns the updated group object. 
                // If it's a group cards list, we update the group card.
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Send Urgency Prompt
            .addCase(sendUrgencyPrompt.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Rollback to Content Proofing
            .addCase(rollbackToContentProofing.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            })
            // Clear Change Flags
            .addCase(clearDTPChangeFlag.fulfilled, (state, action) => {
                const { id, type } = action.meta.arg;
                const index = state.jobs.findIndex(j => (j._id || j.id) === id);
                if (index !== -1) {
                    if (type === 'qty') {
                        state.jobs[index].is_qty_changed = false;
                    } else if (type === 'date') {
                        state.jobs[index].is_date_changed = false;
                    } else {
                        state.jobs[index].is_qty_changed = false;
                        state.jobs[index].is_date_changed = false;
                    }
                }
            })
            // Update Details
            .addCase(updateDTPJobDetails.fulfilled, (state, action) => {
                state.currentJob = action.payload.data;
                const index = state.jobs.findIndex(j => (j._id || j.id) === (action.payload.data._id || action.payload.data.id));
                if (index !== -1) {
                    state.jobs[index] = action.payload.data;
                }
            });
    },
});

export const { clearCurrentJob } = dtpStudioSlice.actions;
export default dtpStudioSlice.reducer;
