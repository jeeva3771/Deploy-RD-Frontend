import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all contract types with filters and sorting
export const fetchAllContractTypes = createAsyncThunk(
  "contractType/fetchAllContractTypes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/contracttype', { params });
      console.log("contract:",response)
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single contract type by ID
// export const fetchContractTypeById = createAsyncThunk(
//   "contractType/fetchContractTypeById",
//   async (id, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.get(`/contracttype/${id}`);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// Create new contract type
export const createContractType = createAsyncThunk(
  "contractType/createContractType",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/contracttype`', formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update contract type
// export const updateContractType = createAsyncThunk(
//   "contractType/updateContractType",
//   async ({ id, formData }, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.put(`/contracttype/${id}`, formData);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// Delete contract type
export const deleteContractType = createAsyncThunk(
  "contractType/deleteContractType",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/contracttype/${id}`);
      return id; // Return the ID of deleted contract type
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all contract types (for dropdowns)
// export const getAllContractTypes = createAsyncThunk(
//   "contractType/getAllContractTypes",
//   async (params = {}, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.get(`/contracttype`, { params });
//       return response.data.data || [];
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// Initial State
const initialState = {
  contractTypes: [],
  selectedContractType: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    is_active: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Slice
const contractTypeSlice = createSlice({
  name: "contractType",
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        search: "",
        is_active: "",
      };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Clear selected contract type
    clearSelectedContractType: (state) => {
      state.selectedContractType = null;
    },
    // Clear contract types list
    clearContractTypes: (state) => {
      state.contractTypes = [];
    },
    // Set sort configuration
    setSortConfig: (state, action) => {
      state.sortConfig = { ...state.sortConfig, ...action.payload };
    },
    // Reset sort configuration
    resetSortConfig: (state) => {
      state.sortConfig = {
        key: null,
        direction: "asc",
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch All Contract Types
    builder
      .addCase(fetchAllContractTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllContractTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.contractTypes = action.payload.data || [];
        // Note: Backend doesn't return pagination, so we calculate it
        state.pagination = {
          page: 1,
          limit: action.payload.count || state.contractTypes.length,
          total: action.payload.count || 0,
          totalPages: 1,
        };
      })
      .addCase(fetchAllContractTypes.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Contract Type By ID
    // builder
    //   .addCase(fetchContractTypeById.pending, (state) => {
    //     state.loading = true;
    //   })
    //   .addCase(fetchContractTypeById.fulfilled, (state, action) => {
    //     state.loading = false;
    //     state.selectedContractType = action.payload;
    //   })
    //   .addCase(fetchContractTypeById.rejected, (state) => {
    //     state.loading = false;
    //     state.selectedContractType = null;
    //   });

    // Create Contract Type
    builder
      .addCase(createContractType.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContractType.fulfilled, (state, action) => {
        state.loading = false;
        state.contractTypes.unshift(action.payload); // Add new contract type to the beginning
        state.pagination.total += 1;
      })
      .addCase(createContractType.rejected, (state) => {
        state.loading = false;
      });

    // Update Contract Type
    // builder
    //   .addCase(updateContractType.pending, (state) => {
    //     state.loading = true;
    //   })
    //   .addCase(updateContractType.fulfilled, (state, action) => {
    //     state.loading = false;
    //     const index = state.contractTypes.findIndex(
    //       (ct) => ct._id === action.payload._id
    //     );
    //     if (index !== -1) {
    //       state.contractTypes[index] = action.payload;
    //     }
    //     state.selectedContractType = action.payload;
    //   })
    //   .addCase(updateContractType.rejected, (state) => {
    //     state.loading = false;
    //   });

    // Delete Contract Type
    builder
      .addCase(deleteContractType.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContractType.fulfilled, (state, action) => {
        state.loading = false;
        state.contractTypes = state.contractTypes.filter(
          (ct) => ct.id !== action.payload
        );
        state.selectedContractType = null;
        state.pagination.total -= 1;
      })
      .addCase(deleteContractType.rejected, (state) => {
        state.loading = false;
      });

    // Get All Contract Types (for dropdowns)
    // builder
    //   .addCase(getAllContractTypes.pending, (state) => {
    //     state.loading = true;
    //   })
    //   .addCase(getAllContractTypes.fulfilled, (state, action) => {
    //     state.loading = false;
    //     state.contractTypes = action.payload;
    //   })
    //   .addCase(getAllContractTypes.rejected, (state) => {
    //     state.loading = false;
    //   });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedContractType,
  clearContractTypes,
  setSortConfig,
  resetSortConfig,
} = contractTypeSlice.actions;

export default contractTypeSlice.reducer;