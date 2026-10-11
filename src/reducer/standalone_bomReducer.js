import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";
import { getFileNamev2 } from "../utils/helper/FilenameURL";

// ======================
// Async Thunks
// ======================

// Fetch all BOMs with optional query params
export const fetchAllBOMs = createAsyncThunk(
  "bom/fetchAllBOMs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/standalone-bom", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchAllStandaloneBOMsCounts = createAsyncThunk(
  "bom/fetchAllStandaloneBOMsCounts",
  async (_, { rejectWithValue }) => {
    try {
      const baseParams = {
        page: 1,
        limit: 1,
        search: "",
        countOnly: true,
      };

      const COUNT_CONFIG = [
        { key: "requestedquotaion", params: { status: "requestedquotaion" } },
        { key: "drafts", params: { status: "draft" } },
      ];

      const responses = await Promise.all(
        COUNT_CONFIG.map((cfg) =>
          axiosInstance.get("/standalone-bom", {
            params: { ...baseParams, ...cfg.params },
          }),
        ),
      );

      // Build result object
      const counts = {};
      COUNT_CONFIG.forEach((cfg, index) => {
        counts[cfg.key] = responses[index].data.totalBOMs || 0;
      });

      return counts;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

// Fetch BOM by ID
export const fetchBOMById = createAsyncThunk(
  "bom/fetchBOMById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/standalone-bom/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Create new BOM
export const createBOM = createAsyncThunk(
  "bom/createBOM",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/standalone-bom", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Save BOM as Draft
export const saveBOMDraft = createAsyncThunk(
  "bom/saveBOMDraft",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/standalone-bom/save-draft", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Update BOM by ID
export const updateBOM = createAsyncThunk(
  "bom/updateBOM",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/standalone-bom/${id}`,
        payload,
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Delete BOM by ID
export const deleteBOM = createAsyncThunk(
  "bom/deleteBOM",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/standalone-bom/${id}`);
      if (response.data.success) {
        return id;
      } else {
        return rejectWithValue("Failed to delete BOM");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const downloadQuotationPDF = createAsyncThunk(
  "bom/downloadQuotationPDF",
  async ({ payload, mode = "download" }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/standalone-bom/downloadquote?mode=${mode}`,
        payload,
        {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (mode === "print") {
        const printWindow = window.open(url);
        if (!printWindow) throw new Error("Popup blocked");

        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        const link = document.createElement("a");
        link.href = url;
        const subJobNo =
          payload instanceof FormData
            ? payload.get("sub_job_no")
            : payload.sub_job_no;

        const referenceNo =
          payload instanceof FormData
            ? payload.get("reference_no")
            : payload.reference_no;

        const fileName = referenceNo 
          ? `quotation-${subJobNo}-${referenceNo}.pdf` 
          : `quotation-${subJobNo}.pdf`;
        link.download = fileName;
        // link.download = `quotation-${payload.sub_job_no}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      return true;
    } catch (error) {
      return rejectWithValue("Failed to generate quotation PDF");
    }
  },
);

export const downloadHonsheetPDF = createAsyncThunk(
  "bom/downloadHonsheetPDF",
  async ({ payload, mode = "download" }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/standalone-bom/downloadjobsheet?mode=${mode}`,
        payload,
        {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (mode === "print") {
        const printWindow = window.open(url);
        if (!printWindow) throw new Error("Popup blocked");

        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        const link = document.createElement("a");
        link.href = url;
        const subJobNo =
          payload instanceof FormData
            ? payload.get("sub_job_no")
            : payload.sub_job_no;

        const referenceNo =
          payload instanceof FormData
            ? payload.get("reference_no")
            : payload.reference_no;

        const fileName = referenceNo 
          ? `jobsheet-${subJobNo}-${referenceNo}.pdf` 
          : `jobsheet-${subJobNo}.pdf`;
        link.download = fileName;
        // link.download = `jobsheet-${payload.sub_job_no}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      return true;
    } catch (error) {
      return rejectWithValue("Failed to generate Jobsheet PDF");
    }
  },
);

// Download file via /download API
export const downloadFile = createAsyncThunk(
  "bom/downloadFile",
  async (url, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/image/download`, {
        params: { url },
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      const fileName = getFileNamev2(url) || "file";
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 5000);

      return true;
    } catch (error) {
      return rejectWithValue("Failed to download file");
    }
  },
);

// ======================
// Initial State
// ======================
const initialState = {
  boms: [],
  standaloneBOMCounts: {},
  selectedBOM: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  filters: {},
  downloadLoading: false,
  downloadError: null,
};

// ======================
// Slice
// ======================
const bomSlice = createSlice({
  name: "bom",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination: (state) => {
      state.pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
    },
    clearSelectedBOM: (state) => {
      state.selectedBOM = null;
    },
    clearBOMs: (state) => {
      state.boms = [];
      state.pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch all BOMs
      .addCase(fetchAllBOMs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllBOMs.fulfilled, (state, action) => {
        state.loading = false;
        state.boms = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
        };
      })
      .addCase(fetchAllBOMs.rejected, (state) => {
        state.loading = false;
      })

      // Counts
      .addCase(fetchAllStandaloneBOMsCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStandaloneBOMsCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.standaloneBOMCounts = action.payload;
      })
      .addCase(fetchAllStandaloneBOMsCounts.rejected, (state) => {
        state.loading = false;
      })
      
      // Fetch BOM by ID
      .addCase(fetchBOMById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBOMById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBOM = action.payload;
      })
      .addCase(fetchBOMById.rejected, (state) => {
        state.loading = false;
        state.selectedBOM = null;
      })

      // Create BOM
      .addCase(createBOM.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBOM.fulfilled, (state, action) => {
        state.loading = false;
        state.boms.unshift(action.payload); // add new BOM to top
      })
      .addCase(createBOM.rejected, (state) => {
        state.loading = false;
      })

      // Update BOM
      .addCase(updateBOM.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBOM.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.boms.findIndex((b) => b.id === updated.id);
        if (index !== -1) {
          state.boms[index] = updated;
        }
        if (state.selectedBOM?.id === updated.id) {
          state.selectedBOM = updated;
        }
      })
      .addCase(updateBOM.rejected, (state) => {
        state.loading = false;
      })

      // Delete BOM
      .addCase(deleteBOM.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteBOM.fulfilled, (state, action) => {
        state.loading = false;
        state.boms = state.boms.filter((b) => b.id !== action.payload);
        if (state.selectedBOM?.id === action.payload) {
          state.selectedBOM = null;
        }
      })
      .addCase(deleteBOM.rejected, (state) => {
        state.loading = false;
      })

      // Save BOM Draft
      .addCase(saveBOMDraft.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveBOMDraft.fulfilled, (state, action) => {
        state.loading = false;
        const saved = action.payload;
        const index = state.boms.findIndex((b) => b.id === saved.id);
        if (index !== -1) {
          state.boms[index] = saved;
        } else {
          state.boms.unshift(saved);
        }
      })
      .addCase(saveBOMDraft.rejected, (state) => {
        state.loading = false;
      })
      .addCase(downloadFile.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = null;
      })
      .addCase(downloadFile.fulfilled, (state) => {
        state.downloadLoading = false;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  resetPagination,
  clearSelectedBOM,
  clearBOMs,
} = bomSlice.actions;

export default bomSlice.reducer;
