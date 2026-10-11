import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// ======================
// Async Thunks
// ======================

// Fetch all enquiries with filters & pagination
export const fetchAllEnquiries = createAsyncThunk(
  "enquiry/fetchAllEnquiries",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch unique clients list
export const fetchUniqueClients = createAsyncThunk(
  "enquiry/fetchUniqueClients",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry/clients`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch unique products list
export const fetchUniqueProducts = createAsyncThunk(
  "enquiry/fetchUniqueProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry/products`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch enquiry counts grouped by user
export const fetchEnquiryCountsByUser = createAsyncThunk(
  "enquiry/fetchEnquiryCountsByUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry/user-counts`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch enquiry KPI stats for Client Servicing dashboard
export const fetchEnquiryKPIStats = createAsyncThunk(
  "enquiry/fetchEnquiryKPIStats",
  async (client, { rejectWithValue }) => {
    try {
      const params = {};
      if (client) {
        params.client = client;
      }
      const response = await axiosInstance.get(`/enquiry/kpi-stats`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



// export const fetchEnquiryCounts = createAsyncThunk(
//   "enquiry/fetchEnquiryCounts",
//   async (_, { rejectWithValue }) => {
//     try {
//       const baseParams = {
//         page: 1,
//         limit: 1,
//         search: "",
//         designerneeded: true,
//         countOnly: true,
//       };

//       const [
//         allRes,
//         enquiryRes,
//         designerAllocationRes,
//       ] = await Promise.all([
//         axiosInstance.get("/enquiry", {
//           params: { ...baseParams, status: "" },
//         }),
//         axiosInstance.get("/enquiry", {
//           params: { ...baseParams, status: "enquiry" },
//         }),
//         axiosInstance.get("/enquiry", {
//           params: { ...baseParams, status: "", designerallocation: true },
//         }),
//       ]);

//       return {
//         all: allRes.data.total,
//         enquiry: enquiryRes.data.total,
//         designerAllocation: designerAllocationRes.data.total,
//       };
//     } catch (err) {
//       return rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );

export const fetchEnquiryCounts = createAsyncThunk(
  "enquiry/fetchEnquiryCounts",
  async (prefix = "dn", { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().enquiry;
      const baseParams = {
        page: 1,
        limit: 1,
        search: "",
        countOnly: true,
      };

      if (filters.designerId) {
        baseParams.designerId = filters.designerId;
      }

      if (filters.createdById) {
        baseParams.createdById = filters.createdById;
      }


      const COUNT_CONFIGS = {
        // DESIGNER NEEDED 
        dn: [
          { key: "dn_all", params: { designerneeded: true } },
          { key: "dn_enquiry", params: { designerneeded: true, status: "enquiry" } },
          { key: "dn_design", params: { designerneeded: true, status: "design" } },
          { key: "dn_design_processing", params: { designerneeded: true, status: "design", is_design_processing: true } },
          { key: "dn_design_pending", params: { designerneeded: true, status: "design", is_design_processing: false } },
          { key: "dn_design_complete", params: { designerneeded: true, design_complete: true } },
          { key: "dn_rework", params: { designerneeded: true, status: "design", rework: true } },
          { key: "dn_designer_allocation", params: { designerneeded: true, designerallocation: true } },
          { key: "dn_abandon", params: { designerneeded: true, status: "abandon" } },
          { key: "dn_on_hold", params: { designerneeded: true, status: "on_hold" } },
          { key: "dn_submit_button", params: { designerneeded: true, status: "design", submit_button: true } },
          { key: "dn_jobinprogress", params: { designerneeded: true, status: "jobinprogress" } },
        ],

        // WITHOUT DESIGNER 
        wd: [
          { key: "wd_all", params: { designerneeded: false } },

          { key: "wd_enquiry", params: { designerneeded: false, status: "enquiry" } },
          { key: "wd_abandon", params: { designerneeded: false, status: "abandon" } },
          { key: "wd_on_hold", params: { designerneeded: false, status: "on_hold" } },

          { key: "wd_designer_allocation", params: { designerneeded: false, status: "design", is_design_processing: false } },
          { key: "wd_design", params: { designerneeded: false, status: "design", is_design_processing: true } },
          { key: "wd_submit_button", params: { designerneeded: false, status: "design", submit_button: true } },
          { key: "wd_design_complete", params: { designerneeded: false, design_complete: true } },
          { key: "wd_rework", params: { designerneeded: false, status: "design", rework: true } },
          { key: "wd_design_processing", params: { designerneeded: false, status: "design", is_design_processing: true } },
          { key: "wd_design_pending", params: { designerneeded: false, status: "design", is_design_processing: false } },
        ],

        // Client Design
        cd: [
          { key: "cd_all", params: { is_client_design: true } },
          { key: "cd_enquiry", params: { is_client_design: true, status: "enquiry" } },
          { key: "cd_designer_allocation", params: { is_client_design: true, designerallocation: true } },
          { key: "cd_design", params: { is_client_design: true, status: "design" } },
          { key: "cd_design_complete", params: { is_client_design: true, design_complete: true } },
          { key: "cd_abandon", params: { is_client_design: true, status: "abandon" } },
          { key: "cd_on_hold", params: { is_client_design: true, status: "on_hold" } },
          { key: "cd_approveddesign", params: { is_client_design: true, status: "approveddesigns" } },
          { key: "cd_quotation", params: { is_client_design: true, status: "approvedquotation" } },
          { key: "cd_approveddesigns_accounts", params: { is_client_design: true, status: "approveddesignsaccounts" } },
          { key: "cd_jobinprogress", params: { is_client_design: true, status: "jobinprogress" } },
          { key: "cd_rework", params: { is_client_design: true, status: "design", rework: true } },
          { key: "cd_design_processing", params: { is_client_design: true, status: "design", is_design_processing: true } },
          { key: "cd_design_pending", params: { is_client_design: true, status: "design", is_design_processing: false } },
          { key: "cd_submit_button", params: { is_client_design: true, status: "design", submit_button: true } },
        ]
      };

      const COUNT_CONFIG = COUNT_CONFIGS[prefix] || COUNT_CONFIGS.dn;

      const responses = await Promise.all(
        COUNT_CONFIG.map(cfg =>
          axiosInstance.get("/enquiry", {
            params: { ...baseParams, ...cfg.params },
          })
        )
      );

      // Build result object
      const counts = {};
      COUNT_CONFIG.forEach((cfg, index) => {
        counts[cfg.key] = responses[index].data.total || 0;
      });

      return counts;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);



// Fetch single enquiry by ID
export const fetchEnquiryById = createAsyncThunk(
  "enquiry/fetchEnquiryById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Approve/reject image
export const approveRejectImage = createAsyncThunk(
  "enquiry/approveRejectImage",
  async ({ enquiryId, imageId, isAccepted }, { rejectWithValue }) => {
    try {
      await axiosInstance.put(
        `/enquiry/${enquiryId}/?inside_images_id=${imageId}`,
        { is_accepted: isAccepted }
      );

      return { enquiryId, imageId, isAccepted };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Designers
export const fetchDesigners = createAsyncThunk(
  "enquiry/fetchDesigners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/user?roleName=design&is_active=true&departmentName=Design`);
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Creators (Admins and Sales Coordinators)
export const fetchCreators = createAsyncThunk(
  "enquiry/fetchCreators",
  async (_, { rejectWithValue }) => {
    try {
      const [adminsRes, salesRes] = await Promise.all([
        axiosInstance.get(`/user?roleName=admin executive&is_active=true`),
        axiosInstance.get(`/user?roleName=Client Servicing Manager,Client Servicing Executive&is_active=true`)
      ]);

      const admins = adminsRes.data.data || [];
      const sales = salesRes.data.data || [];

      return [...admins, ...sales];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Assign Designer (from modal)
export const assignDesignerToEnquiry = createAsyncThunk(
  "enquiry/assignDesignerToEnquiry",
  async ({ enquiryId, selectedPerson, remarks, isReassignDesigner }, { rejectWithValue }) => {
    try {
      const payload = {
        designer_person: [{ user: selectedPerson }],
        designer_remarks: remarks,
        status: "design",
        designerreassign: isReassignDesigner || false
      };

      const response = await axiosInstance.put(`/enquiry/${enquiryId}`, payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Designer Summary
export const fetchDesignerSummary = createAsyncThunk(
  "enquiry/fetchDesignerSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry/designersummary`);
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue("Failed to fetch designer summary");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const sendEnquiryMail = createAsyncThunk(
  "enquiry/sendEnquiryMail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/enquiry/mail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendEnquiryWhatsAppTemplate = createAsyncThunk(
  "enquiry/sendEnquiryWhatsAppTemplate",
  async ({ phone_number, values }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/enquiry/send-enquiry-template`, {
        phone_number,
        values
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Mark enquiry as redo
export const markEnquiryRedo = createAsyncThunk(
  "enquiry/markEnquiryRedo",
  async (enquiryId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/enquiry/${enquiryId}`, {
        redo: true,
      });

      if (response.data.success) {
        return { id: enquiryId }; // return the id to update state if needed
      } else {
        return rejectWithValue(response.data.message || "Failed to mark redo");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Abandon
export const markEnquiryAbandon = createAsyncThunk(
  "enquiry/markEnquiryAbandon",
  async (enquiryId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/enquiry/${enquiryId}`, {
        is_cancelled: true,
      });

      if (response.data.success) {
        return { id: enquiryId };
      } else {
        return rejectWithValue(response.data.message || "Failed to mark redo");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


// Hold Enquiry
export const holdEnquiry = createAsyncThunk(
  "enquiry/holdEnquiry",
  async ({ id, reason, hold_all_sub_jobs }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/enquiry/${id}`, {
        is_on_hold: true,
        hold_reason: reason,
        hold_all_sub_jobs,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Unhold Enquiry
export const unholdEnquiry = createAsyncThunk(
  "enquiry/unholdEnquiry",
  async ({ id, delivery_date, hold_all_sub_jobs }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/enquiry/${id}`, {
        is_on_hold: false,
        delivery_date,
        hold_all_sub_jobs,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);




// ======================
// Initial State
// ======================
const initialState = {
  enquiries: [],
  clients: [],
  products: [],
  userEnquiryCounts: {},
  enquiryKPIStats: null,
  selectedEnquiry: null,
  designers: [],
  creators: [],
  designerSummary: [],
  loading: false,
  pagination: {
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  },
  filters: {
    search: "",
    status: "",
    designerId: "",
    createdById: "",
  },
  enquiryCounts: {
    all: 0,
    enquiry: 0,
    designerAllocation: 0,
  },
};

// ======================
// Slice
// ======================
const enquirySlice = createSlice({
  name: "enquiry",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { search: "", status: "", designerId: "", createdById: "" };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination: (state) => {
      state.pagination = { page: 1, limit: 8 };
    },
    clearSelectedEnquiry: (state) => {
      state.selectedEnquiry = null;
    },
    clearEnquiries: (state) => {
      state.enquiries = [];
      state.pagination = { page: 1, limit: 8, total: 0, totalPages: 1 };
    },
  },

  // ======================
  // Handle Async Reducers
  // ======================
  extraReducers: (builder) => {
    builder

      // Fetch all enquiries
      .addCase(fetchAllEnquiries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiries = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
        };
      })
      .addCase(fetchAllEnquiries.rejected, (state) => {
        state.loading = false;
      })

      // Fetch unique clients
      .addCase(fetchUniqueClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUniqueClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.data || [];
      })
      .addCase(fetchUniqueClients.rejected, (state) => {
        state.loading = false;
      })

      // Fetch unique products
      .addCase(fetchUniqueProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUniqueProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data || [];
      })
      .addCase(fetchUniqueProducts.rejected, (state) => {
        state.loading = false;
      })

      // Fetch enquiry counts grouped by user
      .addCase(fetchEnquiryCountsByUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEnquiryCountsByUser.fulfilled, (state, action) => {
        state.loading = false;
        const countsMap = {};
        if (action.payload && action.payload.data) {
          action.payload.data.forEach(item => {
            if (item._id) {
              countsMap[item._id] = item.count;
            }
          });
        }
        state.userEnquiryCounts = countsMap;
      })
      .addCase(fetchEnquiryCountsByUser.rejected, (state) => {
        state.loading = false;
      })

      // Fetch enquiry KPI stats
      .addCase(fetchEnquiryKPIStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEnquiryKPIStats.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiryKPIStats = action.payload.data || null;
      })
      .addCase(fetchEnquiryKPIStats.rejected, (state) => {
        state.loading = false;
      })

      .addCase(fetchEnquiryCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEnquiryCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiryCounts = action.payload;
      })
      .addCase(fetchEnquiryCounts.rejected, (state) => {
        state.loading = false;
      })


      // Fetch enquiry by ID
      .addCase(fetchEnquiryById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEnquiryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEnquiry = action.payload;
      })
      .addCase(fetchEnquiryById.rejected, (state) => {
        state.loading = false;
        state.selectedEnquiry = null;
      })

      // Approve/Reject image
      .addCase(approveRejectImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveRejectImage.fulfilled, (state, action) => {
        state.loading = false;
        const { enquiryId, imageId, isAccepted } = action.payload;

        const enquiry = state.enquiries.find((e) => e.id === enquiryId);
        if (enquiry?.images) {
          const index = enquiry.images.findIndex((img) => img._id === imageId);
          if (index !== -1) {
            enquiry.images[index].is_accepted = isAccepted;
          }
        }
      })
      .addCase(approveRejectImage.rejected, (state) => {
        state.loading = false;
      })

      // Fetch Designers
      .addCase(fetchDesigners.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDesigners.fulfilled, (state, action) => {
        state.loading = false;
        state.designers = action.payload;
      })
      .addCase(fetchDesigners.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchCreators.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCreators.fulfilled, (state, action) => {
        state.loading = false;
        state.creators = action.payload;
      })
      .addCase(fetchCreators.rejected, (state) => {
        state.loading = false;
      })

      // Assign Designer
      .addCase(assignDesignerToEnquiry.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignDesignerToEnquiry.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload;

        // update in list
        const index = state.enquiries.findIndex((e) => e.id === updated.id);
        if (index !== -1) {
          state.enquiries[index] = updated;
        }

        // update selected
        if (state.selectedEnquiry?.id === updated.id) {
          state.selectedEnquiry = updated;
        }
      })
      .addCase(assignDesignerToEnquiry.rejected, (state) => {
        state.loading = false;
      })

      // Designer Summary
      .addCase(fetchDesignerSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDesignerSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.designerSummary = action.payload;
      })
      .addCase(fetchDesignerSummary.rejected, (state) => {
        state.loading = false;
        state.designerSummary = [];
      })
      .addCase(sendEnquiryMail.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendEnquiryMail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendEnquiryMail.rejected, (state) => {
        state.loading = false;
      })
      // Mark Enquiry Redo
      .addCase(markEnquiryRedo.pending, (state) => {
        state.loading = true;
      })
      .addCase(markEnquiryRedo.fulfilled, (state, action) => {
        state.loading = false;

        // Optional: update the enquiry in the list
        const index = state.enquiries.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.enquiries[index].redo = true;
        }

        if (state.selectedEnquiry?.id === action.payload.id) {
          state.selectedEnquiry.redo = true;
        }
      })
      .addCase(markEnquiryRedo.rejected, (state) => {
        state.loading = false;
      });

  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  resetPagination,
  clearSelectedEnquiry,
  clearEnquiries,
} = enquirySlice.actions;

export default enquirySlice.reducer;
