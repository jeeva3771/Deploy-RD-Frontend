import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

// Async Thunks

// Get all machines with filters and pagination
export const fetchAllMachines = createAsyncThunk(
  "machine/fetchAllMachines",
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      const response = await axiosInstance.get(`/machine`, { 
        params,
        signal
      });
      return response.data;
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        throw error; // Let RTK handle the aborted action
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single machine by ID
export const fetchMachineById = createAsyncThunk(
  "machine/fetchMachineById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/machine/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new machine
export const createMachine = createAsyncThunk(
  "machine/createMachine",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/machine`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update machine
export const updateMachine = createAsyncThunk(
  "machine/updateMachine",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/machine/${id}`, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete machine
export const deleteMachine = createAsyncThunk(
  "machine/deleteMachine",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/machine/${id}`);
      return id; // Return the ID of deleted machine
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState = {
  machines: [],
  selectedMachine: null,
  loading: false,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    department: "",
    is_active: "",
    type: "",
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },
};

// Slice
const machineSlice = createSlice({
  name: "machine",
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
        department: "",
        is_active: "",
        type: "",
      };
    },
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Clear selected machine
    clearSelectedMachine: (state) => {
      state.selectedMachine = null;
    },
    // Clear machines list
    clearMachines: (state) => {
      state.machines = [];
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
    // Reset pagination
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 5,
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch All Machines
    builder
      .addCase(fetchAllMachines.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllMachines.fulfilled, (state, action) => {
        state.loading = false;
        state.machines = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchAllMachines.rejected, (state) => {
        state.loading = false;
      });

    // Fetch Machine By ID
    builder
      .addCase(fetchMachineById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMachineById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMachine = action.payload;
      })
      .addCase(fetchMachineById.rejected, (state) => {
        state.loading = false;
        state.selectedMachine = null;
      });

    // Create Machine
    builder
      .addCase(createMachine.pending, (state) => {
        state.loading = true;
      })
      .addCase(createMachine.fulfilled, (state, action) => {
        state.loading = false;
        state.machines.unshift(action.payload); // Add new machine to the beginning
        state.pagination.total += 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(createMachine.rejected, (state) => {
        state.loading = false;
      });

    // Update Machine
    builder
      .addCase(updateMachine.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateMachine.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.machines.findIndex(
          (machine) => machine.id === action.payload.id
        );
        if (index !== -1) {
          state.machines[index] = action.payload;
        }
        state.selectedMachine = action.payload;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(updateMachine.rejected, (state) => {
        state.loading = false;
      });

    // Delete Machine
    builder
      .addCase(deleteMachine.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteMachine.fulfilled, (state, action) => {
        state.loading = false;
        state.machines = state.machines.filter(
          (machine) => machine.id !== action.payload
        );
        state.selectedMachine = null;
        state.pagination.total -= 1;
        state.sortConfig = { key: "createdAt", direction: "desc" };
      })
      .addCase(deleteMachine.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPagination,
  clearSelectedMachine,
  clearMachines,
  setSortConfig,
  resetSortConfig,
  resetPagination,
} = machineSlice.actions;

export default machineSlice.reducer;