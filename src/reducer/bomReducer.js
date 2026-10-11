import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// ======================
// Async Thunks
// ======================

// Fetch all BOMs with optional query params
export const fetchAllBOMs = createAsyncThunk(
  "bom/fetchAllBOMs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/bom", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch BOM by ID
export const fetchBOMById = createAsyncThunk(
  "bom/fetchBOMById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/bom/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new BOM
export const createBOM = createAsyncThunk(
  "bom/createBOM",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/bom", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Save BOM as Draft (upsert — no duplicate records)
export const saveBOMDraft = createAsyncThunk(
  "bom/saveBOMDraft",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/bom/savedraft", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Update BOM by ID
export const updateBOM = createAsyncThunk(
  "bom/updateBOM",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/bom/${id}`, payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete BOM by ID
export const deleteBOM = createAsyncThunk(
  "bom/deleteBOM",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/bom/${id}`);
      if (response.data.success) {
        return id;
      } else {
        return rejectWithValue("Failed to delete BOM");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const downloadQuotationPDF = createAsyncThunk(
  "bom/downloadQuotationPDF",
  async ({ payload, mode = "download" }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/bom/downloadquote?mode=${mode}`,
        payload,
        { responseType: "blob" }
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
        const fileName = payload.reference_no 
          ? `quotation-${payload.sub_job_no}-${payload.reference_no}.pdf` 
          : `quotation-${payload.sub_job_no}.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      return true;
    } catch (error) {
      return rejectWithValue("Failed to generate quotation PDF");
    }
  }
);

export const downloadHonsheetPDF = createAsyncThunk(
  "bom/downloadHonsheetPDF",
  async ({ payload, mode = "download" }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/bom/downloadjobsheet?mode=${mode}`,
        payload,
        { responseType: "blob" }
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
        const fileName = payload.reference_no 
          ? `jobsheet-${payload.sub_job_no}-${payload.reference_no}.pdf` 
          : `jobsheet-${payload.sub_job_no}.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      return true;
    } catch (error) {
      return rejectWithValue("Failed to generate Jobsheet PDF");
    }
  }
);




// ======================
// Initial State
// ======================
const initialState = {
  boms: [],
  selectedBOM: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  filters: {},
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
