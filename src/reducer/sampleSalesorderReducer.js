import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// ======================
// Async Thunks
// ======================

// Fetch all sample orders with filters & pagination
export const fetchAllSampleOrders = createAsyncThunk(
  "sampleorder/fetchAllSampleOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/sampleorderlist", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSampleSalesOrderCounts = createAsyncThunk(
  "enquiry/fetchSampleSalesOrderCounts",
  async (prefix = "dn", { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().sampleSalesOrders;
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
        dn: [
          // DESIGNER NEEDED 
          { key: "dn_approved_design", params: { status: "approveddesigns", is_client_design: false } },
          { key: "dn_approved_quotation", params: { status: "approvedquotation", is_client_design: false } },
          { key: "dn_reprocessed_quotation", params: { status: "reprocessedquotation", is_client_design: false } },
          { key: "dn_approveddesign_accounts", params: { status: "approveddesignsaccounts", is_client_design: false } },

          { key: "dn_approveddesign_production", params: { status: "approveddesigns", is_client_design: false, type: "production" } },
          { key: "dn_approverddesign_sample", params: { status: "approveddesigns", is_client_design: false, type: "sample" } },

          { key: "dn_approvedquotation_production", params: { status: "approvedquotation", is_client_design: false, type: "production" } },
          { key: "dn_approvedquotation_sample", params: { status: "approvedquotation", is_client_design: false, type: "sample" } },

          { key: "dn_reprocessedquotation_production", params: { status: "reprocessedquotation", is_client_design: false, type: "production" } },
          { key: "dn_reprocessedquotation_sample", params: { status: "reprocessedquotation", is_client_design: false, type: "sample" } },

          { key: "dn_approveddesignsaccounts_production", params: { status: "approveddesignsaccounts", is_client_design: false, type: "production" } },
          { key: "dn_approveddesignsaccounts_sample", params: { status: "approveddesignsaccounts", is_client_design: false, type: "sample" } },

          { key: "dn_designerfilesupload", params: { status: "designserfilesupload" } },
          { key: "dn_jobinprogress", params: { status: "jobinprogress", is_client_design: false } },
          { key: "dn_dispatch", params: { status: "dispatch", is_client_design: false } },
          { key: "dn_order_on_hold", params: { status: "on_hold", is_on_hold: true, is_client_design: false } },
          { key: "dn_sample_on_hold", params: { status: "on_hold", is_on_hold: true, is_client_design: false, type: "sample" } },
          { key: "dn_production_on_hold", params: { status: "on_hold", is_on_hold: true, is_client_design: false, type: "production" } },
        ],


        // WITH DESIGNER


        // ClIENT DESIGN
        // { key: "cd_approved_design", params: { status: "approveddesigns", is_client_design: true } },
        // { key: "cd_approved_quotation", params: { status: "approvedquotation", is_client_design: true } },
        // { key: "cd_approveddesign_accounts", params: { status: "approveddesignsaccounts", is_client_design: true } },

        accounts: [
          // Accounts
          { key: "all_requestedAccountsFiles", params: { status: "requestedaccountsfiles" } },
          { key: "prod_requestedAccountsFiles", params: { status: "requestedaccountsfiles", type: "production" } },
          { key: "sample_requestedAccountsFiles", params: { status: "requestedaccountsfiles", type: "sample" } }
        ],

        // PRODUCTION FLOOR - ALL TYPES
        production: [
          // ALL orders (no type filter)
          { key: "all_all", params: { status: "" } },
          { key: "all_pending", params: { status: "pending" } },
          { key: "all_process", params: { status: "process" } },
          { key: "all_complete", params: { status: "complete" } },

          // PRODUCTION orders
          { key: "prod_all", params: { status: "", type: "production", category: "Production" } },
          { key: "prod_pending", params: { status: "pending", type: "production", category: "Production" } },
          { key: "prod_process", params: { status: "process", type: "production", category: "Production" } },
          { key: "prod_complete", params: { status: "complete", type: "production", category: "Production" } },

          // SAMPLE orders
          { key: "sample_all", params: { status: "", type: "sample", category: "Sample" } },
          { key: "sample_pending", params: { status: "pending", type: "sample", category: "Sample" } },
          { key: "sample_process", params: { status: "process", type: "sample", category: "Sample" } },
          { key: "sample_complete", params: { status: "complete", type: "sample", category: "Sample" } },
        ],

        quotation: [
          // ALL orders
          { key: "all_quotation_all", params: { status: "quotation_all" } },
          { key: "all_requestedquotaion", params: { status: "requestedquotaion" } },
          { key: "all_newbom", params: { status: "newbom" } },
          { key: "all_bomdraft", params: { status: "bomdraft" } },
          { key: "all_bomrework", params: { status: "bomrework" } },
          { key: "all_approvedquotation", params: { status: "approvedquotation" } },
          { key: "all_completedandverified", params: { status: "completedandverified" } },

          // PRODUCTION orders
          { key: "prod_quotation_all", params: { status: "quotation_all", type: "production" } },
          { key: "prod_requestedquotaion", params: { status: "requestedquotaion", type: "production" } },
          { key: "prod_newbom", params: { status: "newbom", type: "production" } },
          { key: "prod_bomdraft", params: { status: "bomdraft", type: "production" } },
          { key: "prod_bomrework", params: { status: "bomrework", type: "production" } },
          { key: "prod_approvedquotation", params: { status: "approvedquotation", type: "production" } },
          { key: "prod_completedandverified", params: { status: "completedandverified", type: "production" } },

          // SAMPLE orders
          { key: "sample_quotation_all", params: { status: "quotation_all", type: "sample" } },
          { key: "sample_requestedquotaion", params: { status: "requestedquotaion", type: "sample" } },
          { key: "sample_newbom", params: { status: "newbom", type: "sample" } },
          { key: "sample_bomdraft", params: { status: "bomdraft", type: "sample" } },
          { key: "sample_bomrework", params: { status: "bomrework", type: "sample" } },
          { key: "sample_approvedquotation", params: { status: "approvedquotation", type: "sample" } },
          { key: "sample_completedandverified", params: { status: "completedandverified", type: "sample" } },
        ]
      };

      const COUNT_CONFIG = COUNT_CONFIGS[prefix] || COUNT_CONFIGS.dn;

      const responses = await Promise.all(
        COUNT_CONFIG.map(cfg =>
          axiosInstance.get("/sampleorderlist", {
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

//  Fetch Marketing Team (Managers/Executives)
export const fetchMarketingCoordinators = createAsyncThunk(
  "sampleorder/fetchMarketingCoordinators",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/user?roleName=Marketing Manager,Marketing Executive&order=asc&is_active=true`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

//  Fetch single sample order by ID
export const fetchSamplesalesOrderById = createAsyncThunk(
  "samplesalesorder/fetchSamplesalesOrderById",
  async (ssoid, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/samplesalesorder/sso/${ssoid}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update Sample Sales Order (PUT)
export const updateSampleSalesOrder = createAsyncThunk(
  "samplesalesorder/updateSampleSalesOrder",
  async ({ sampleOrderid, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/samplesalesorder/${sampleOrderid}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSampleOrderById = createAsyncThunk(
  "sampleorder/updateSampleOrderById",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/sampleorderlist/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const sendsampleorderMail = createAsyncThunk(
  "sampleorder/sendsampleorderMail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/sampleorderlist/mail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendSampleSalesOrderMail = createAsyncThunk(
  "samplesalesorder/sendSampleSalesOrderMail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/samplesalesorder/mail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendsampleorderMailQuoatation = createAsyncThunk(
  "sampleorder/sendsampleorderMailQuoatation",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/sampleorderlist/quotationmail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendSampleOrderMailDtp = createAsyncThunk(
  "sampleorder/sendSampleOrderMailDtp",
  async ({ id, type, dtpId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/sampleorderlist/dtpmail/${id}`, {
        params: { type, dtpId }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendSampleOrderWhatsAppDtp = createAsyncThunk(
  "sampleorder/sendSampleOrderWhatsAppDtp",
  async ({ id, type, dtpId, phone }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/sampleorderlist/dtpwhatsapp/${id}`,
        null,
        { params: { type, dtpId, phone } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


//  Fetch Production team
export const fetchproductionTeam = createAsyncThunk(
  "sampleorder/fetchproductionTeam",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/user?roleName=production&order=asc`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);




export const updateSampleOrderByIdClientscreen = createAsyncThunk(
  "sampleorder/updateSampleOrderByIdClientscreen",
  async ({ csid, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/sampleorderlist/clientscreen/${csid}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const deleteSampleOrderFile = createAsyncThunk(
  "sampleorder/deleteFile",
  async ({ id, fileUrl, fileId }, { rejectWithValue }) => {
    try {
      const payload = {};
      if (fileId) payload.file_id = fileId;
      if (fileUrl) payload.file_url = fileUrl;

      const response = await axiosInstance.post(`/sampleorderlist/${id}/delete-file`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Hold Sample Order
export const holdSampleOrder = createAsyncThunk(
  "sampleorder/holdSampleOrder",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/sampleorderlist/${id}`, {
        is_on_hold: true,
        hold_reason: reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Unhold Sample Order
export const unholdSampleOrder = createAsyncThunk(
  "sampleorder/unholdSampleOrder",
  async ({ id, delivery_date, job_completion_datetime }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/sampleorderlist/${id}`, {
        is_on_hold: false,
        delivery_date,
        job_completion_datetime,
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
  sampleSalesOrders: [],
  sampleSalesOrderCounts: {}, // to hold counts
  singleSamplesalesOrder: null, //  added
  loadingSingle: false,
  loading: false,
  updateLoading: false,
  updateSuccess: false,
  updateError: null,

  //   deliveryModes: [],
  // loadingDeliveryModes: false,

  // deliveryTypes: [],
  // loadingDeliveryTypes: false,

  // whoWillPayOptions: [],
  // loadingWhoWillPay: false,

  updateSampleOrderLoading: false,
  updateSampleOrderSuccess: false,
  updateSampleOrderError: null,


  pagination: {
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  },

  filters: {
    search: "",
    status: "",
    createdById: "",
  },

  // ⭐ Coordinator-related state
  coordinators: [],
  loadingCoordinators: false,
  coordinatorId: "", // selected coordinator

  Productionteammembers: [],

};

// ======================
// Slice
// ======================
const sampleOrderSlice = createSlice({
  name: "sampleorder",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: (state) => {
      state.filters = { search: "", status: "", createdById: "" };
    },

    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    resetPagination: (state) => {
      state.pagination = { page: 1, limit: 8 };
    },

    clearSampleOrders: (state) => {
      state.sampleSalesOrders = [];
      state.pagination = { page: 1, limit: state.pagination.limit || 8, total: 0, totalPages: 1 };
    },

    // ⭐ Save selected marketing coordinator
    setCoordinator: (state, action) => {
      state.coordinatorId = action.payload;
    },
  },

  // ======================
  // Handle Async Reducers
  // ======================
  extraReducers: (builder) => {
    builder
      // ------------ Sample Orders -------------
      .addCase(fetchAllSampleOrders.pending, (state) => {
        state.loading = true;
        state.sampleSalesOrders = [];
      })
      .addCase(fetchAllSampleOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.sampleSalesOrders = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
        };
      })
      .addCase(fetchAllSampleOrders.rejected, (state) => {
        state.loading = false;
      })

      .addCase(fetchSampleSalesOrderCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSampleSalesOrderCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.sampleSalesOrderCounts = action.payload;
      })
      .addCase(fetchSampleSalesOrderCounts.rejected, (state) => {
        state.loading = false;
      })

      // ------------ Coordinators API -------------
      .addCase(fetchMarketingCoordinators.pending, (state) => {
        state.loadingCoordinators = true;
      })
      .addCase(fetchMarketingCoordinators.fulfilled, (state, action) => {
        state.loadingCoordinators = false;
        state.coordinators = action.payload.data || [];
      })
      .addCase(fetchMarketingCoordinators.rejected, (state) => {
        state.loadingCoordinators = false;
      })
      // -------- Fetch Sample Order By ID -------------
      .addCase(fetchSamplesalesOrderById.pending, (state) => {
        state.loadingSingle = true;
      })
      .addCase(fetchSamplesalesOrderById.fulfilled, (state, action) => {
        state.loadingSingle = false;
        state.singleSamplesalesOrder = action.payload.data || null; // backend returns {data: {...}}
      })
      .addCase(fetchSamplesalesOrderById.rejected, (state) => {
        state.loadingSingle = false;
        state.singleSamplesalesOrder = null;
      })

      // UPDATE SAMPLE ORDER
      .addCase(updateSampleSalesOrder.pending, (state) => {
        state.updateLoading = true;
        state.updateSuccess = false;
        state.updateError = null;
      })

      .addCase(updateSampleSalesOrder.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;

        // Update single record instantly in Redux
        state.singleSamplesalesOrder = action.payload.data || state.singleSamplesalesOrder;
      })

      .addCase(updateSampleSalesOrder.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = false;
        state.updateError = action.payload;
      })

      // // -------- Fetch Delivery Modes -------------
      // .addCase(fetchDeliveryModes.pending, (state) => {
      //   state.loadingDeliveryModes = true;
      // })
      // .addCase(fetchDeliveryModes.fulfilled, (state, action) => {
      //   state.loadingDeliveryModes = false;
      //   state.deliveryModes = action.payload.data || [];
      // })
      // .addCase(fetchDeliveryModes.rejected, (state) => {
      //   state.loadingDeliveryModes = false;
      // })

      // // -------- Fetch Delivery Types -------------
      // .addCase(fetchDeliveryTypes.pending, (state) => {
      //   state.loadingDeliveryTypes = true;
      // })
      // .addCase(fetchDeliveryTypes.fulfilled, (state, action) => {
      //   state.loadingDeliveryTypes = false;
      //   state.deliveryTypes = action.payload.data || [];
      // })
      // .addCase(fetchDeliveryTypes.rejected, (state) => {
      //   state.loadingDeliveryTypes = false;
      // })

      // // -------- Fetch Who Will Pay -------------
      // .addCase(fetchWhoWillPay.pending, (state) => {
      //   state.loadingWhoWillPay = true;
      // })
      // .addCase(fetchWhoWillPay.fulfilled, (state, action) => {
      //   state.loadingWhoWillPay = false;
      //   state.whoWillPayOptions = action.payload.data || [];
      // })
      // .addCase(fetchWhoWillPay.rejected, (state) => {
      //   state.loadingWhoWillPay = false;
      // })

      // -------- Update Sample Order (PUT) ----------
      .addCase(updateSampleOrderById.pending, (state) => {
        state.updateSampleOrderLoading = true;
        state.updateSampleOrderSuccess = false;
        state.updateSampleOrderError = null;
      })

      .addCase(updateSampleOrderById.fulfilled, (state, action) => {
        state.updateSampleOrderLoading = false;
        state.updateSampleOrderSuccess = true;

        // Update the record in the list so cards re-render with correct data immediately
        const updatedOrder = action.payload.data;
        if (updatedOrder) {
          const idx = state.sampleSalesOrders.findIndex(
            (o) => o.id === updatedOrder.id || o._id === updatedOrder._id
          );
          if (idx !== -1) {
            state.sampleSalesOrders[idx] = {
              ...state.sampleSalesOrders[idx],
              ...updatedOrder,
            };
          }
        }
      })

      .addCase(updateSampleOrderById.rejected, (state, action) => {
        state.updateSampleOrderLoading = false;
        state.updateSampleOrderSuccess = false;
        state.updateSampleOrderError = action.payload;
      })

      .addCase(sendsampleorderMail.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendsampleorderMail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendsampleorderMail.rejected, (state) => {
        state.loading = false;
      })

      .addCase(sendSampleSalesOrderMail.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendSampleSalesOrderMail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendSampleSalesOrderMail.rejected, (state) => {
        state.loading = false;
      })

      //Producrtion team
      .addCase(fetchproductionTeam.pending, (state) => {
        state.loadingCoordinators = true;
      })
      .addCase(fetchproductionTeam.fulfilled, (state, action) => {
        state.loadingCoordinators = false;
        state.Productionteammembers = action.payload.data || [];
      })
      .addCase(fetchproductionTeam.rejected, (state) => {
        state.loadingCoordinators = false;
      })

      //client scrren
      .addCase(updateSampleOrderByIdClientscreen.pending, (state) => {
        state.updateSampleOrderLoading = true;
        state.updateSampleOrderSuccess = false;
        state.updateSampleOrderError = null;
      })

      .addCase(updateSampleOrderByIdClientscreen.fulfilled, (state, action) => {
        state.updateSampleOrderLoading = false;
        state.updateSampleOrderSuccess = true;

        // Update immediately in redux
        state.singleSampleOrder = action.payload.data || state.singleSampleOrder;
      })

      .addCase(updateSampleOrderByIdClientscreen.rejected, (state, action) => {
        state.updateSampleOrderLoading = false;
        state.updateSampleOrderSuccess = false;
        state.updateSampleOrderError = action.payload;
      })
    // Hold/Unhold Sample Order
    // .addCase(holdSampleOrder.fulfilled, (state, action) => {
    //   const updatedOrder = action.payload.data;
    //   if (updatedOrder) {
    //     const idx = state.sampleSalesOrders.findIndex(
    //       (o) => o.id === updatedOrder.id || o._id === updatedOrder._id
    //     );
    //     if (idx !== -1) {
    //       state.sampleSalesOrders[idx] = {
    //         ...state.sampleSalesOrders[idx],
    //         ...updatedOrder,
    //       };
    //     }
    //     if (state.singleSamplesalesOrder && (state.singleSamplesalesOrder.id === updatedOrder.id || state.singleSamplesalesOrder._id === updatedOrder._id)) {
    //       state.singleSamplesalesOrder = { ...state.singleSamplesalesOrder, ...updatedOrder };
    //     }
    //   }
    // })
    // .addCase(unholdSampleOrder.fulfilled, (state, action) => {
    //   const updatedOrder = action.payload.data;
    //   if (updatedOrder) {
    //     const idx = state.sampleSalesOrders.findIndex(
    //       (o) => o.id === updatedOrder.id || o._id === updatedOrder._id
    //     );
    //     if (idx !== -1) {
    //       state.sampleSalesOrders[idx] = {
    //         ...state.sampleSalesOrders[idx],
    //         ...updatedOrder,
    //       };
    //     }
    //     if (state.singleSamplesalesOrder && (state.singleSamplesalesOrder.id === updatedOrder.id || state.singleSamplesalesOrder._id === updatedOrder._id)) {
    //       state.singleSamplesalesOrder = { ...state.singleSamplesalesOrder, ...updatedOrder };
    //     }
    //   }
    // });


  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  resetPagination,
  clearSampleOrders,
  setCoordinator, // ⭐ export new action
} = sampleOrderSlice.actions;

export default sampleOrderSlice.reducer;
