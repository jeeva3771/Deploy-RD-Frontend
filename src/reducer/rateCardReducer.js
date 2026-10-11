import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllRateCards = createAsyncThunk(
	"rateCard/getAllRateCards",
	async ({ is_active, order, params = {} } = {}, { rejectWithValue }) => {
		try {
			const config = {
				params,
			};

			let url = "/ratecard";
			const queryParams = [];
			if (is_active !== undefined) queryParams.push(`is_active=${is_active}`);
			if (order) queryParams.push(`order=${order}`);
			if (queryParams.length > 0) url += `?${queryParams.join("&")}`;

			const response = await axiosInstance.get(url, config);
			return response.data;
		} catch (error) {
			if (error instanceof AxiosError) {
				return rejectWithValue(
					error.response?.data?.message || "Failed to fetch rate cards"
				);
			}
			return rejectWithValue("An unexpected error occurred");
		}
	}
);

export const getRateCardById = createAsyncThunk(
	"rateCard/getRateCardById",
	async (rateCardId, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.get(`/ratecard/${rateCardId}`);
			return response.data;
		} catch (error) {
			if (error instanceof AxiosError) {
				return rejectWithValue(
					error.response?.data?.message || "Failed to fetch rate card"
				);
			}
			return rejectWithValue("An unexpected error occurred");
		}
	}
);

export const getRateCardsByProcessId = createAsyncThunk(
	"rateCard/getRateCardsByProcessId",
	async (processId, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.get(`/ratecard/process/${processId}`);
			return response.data;
		} catch (error) {
			if (error instanceof AxiosError) {
				return rejectWithValue(
					error.response?.data?.message || "Failed to fetch rate cards by process"
				);
			}
			return rejectWithValue("An unexpected error occurred");
		}
	}
);

export const createRateCard = createAsyncThunk(
	"rateCard/createRateCard",
	async (formData, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.post("/ratecard/", formData);
			return response.data;
		} catch (error) {
			if (error instanceof AxiosError) {
				return rejectWithValue(
					error.response?.data?.message || "Failed to create rate card"
				);
			}
			return rejectWithValue("An unexpected error occurred");
		}
	}
);

export const updateRateCard = createAsyncThunk(
	"rateCard/updateRateCard",
	async ({ id, formData }, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.put(`/ratecard/${id}`, formData);
			return response.data;
		} catch (error) {
			if (error instanceof AxiosError) {
				return rejectWithValue(
					error.response?.data?.message || "Failed to update rate card"
				);
			}
			return rejectWithValue("An unexpected error occurred");
		}
	}
);

export const deleteRateCard = createAsyncThunk(
	"rateCard/deleteRateCard",
	async (rateCardId, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.delete(`/ratecard/${rateCardId}`);
			return { rateCardId, message: response.data.message };
		} catch (error) {
			if (error instanceof AxiosError) {
				return rejectWithValue(
					error.response?.data?.message || "Failed to delete rate card"
				);
			}
			return rejectWithValue("An unexpected error occurred");
		}
	}
);

// Async thunk to check if rate card exists
export const checkRateCardExists = createAsyncThunk(
  'rateCard/checkExists',
  async ({ process_id, is_internal, vendor }, { rejectWithValue }) => {
    try {
      const params = {
				process_id,
				is_internal,
				vendor
			}

      const response = await axiosInstance.get(`/ratecard/check-exists`, {params});
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Initial State
const initialState = {
	rateCards: [],
	rateCardsByProcess: [],
	singleRateCard: null,
	isLoading: false,
	error: null,
	successMessage: null,
	existsData: null,
	pagination: {
		page: 1,
		limit: 5,
		total: 0,
		totalPages: 0,
	},
	filters: {
		search: "",
		processId: "",
		is_active: "",
	},
	sortConfig: {
		key: null,
		direction: "asc",
	},
};

// Rate Card Slice
const rateCardSlice = createSlice({
	name: "rateCard",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		clearSuccess: (state) => {
			state.successMessage = null;
		},
		clearSingleRateCard: (state) => {
			state.singleRateCard = null;
		},
		clearRateCardsByProcess: (state) => {
			state.rateCardsByProcess = [];
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
			};
		},
		// Set filters
		setFilters: (state, action) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		// Reset filters
		resetFilters: (state) => {
			state.filters = {
				search: "",
				processId: "",
				is_active: "",
			};
		},
		// Set pagination
		setPagination: (state, action) => {
			state.pagination = { ...state.pagination, ...action.payload };
		},
		clearExistsData: (state) => {
      state.existsData = null;
    },
	},
	extraReducers: (builder) => {
		// Get All Rate Cards
		builder
			.addCase(getAllRateCards.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(getAllRateCards.fulfilled, (state, action) => {
				state.isLoading = false;
				state.rateCards = action.payload.data || [];
				state.pagination = {
					page: action.payload.page || state.pagination.page,
					limit: action.payload.limit || state.pagination.limit,
					total: action.payload.total || 0,
					totalPages: action.payload.totalPages || 0,
				};
				state.successMessage = "Rate cards fetched successfully";
			})
			.addCase(getAllRateCards.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			});

		// Get Rate Card By ID
		builder
			.addCase(getRateCardById.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(getRateCardById.fulfilled, (state, action) => {
				state.isLoading = false;
				state.singleRateCard = action.payload.data || action.payload;
				state.successMessage = "Rate card fetched successfully";
			})
			.addCase(getRateCardById.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			});

		// Get Rate Cards By Process ID
		builder
			.addCase(getRateCardsByProcessId.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(getRateCardsByProcessId.fulfilled, (state, action) => {
				state.isLoading = false;
				state.rateCardsByProcess = action.payload.data || [];
				state.successMessage = "Rate cards by process fetched successfully";
			})
			.addCase(getRateCardsByProcessId.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			});

		// Create Rate Card
		builder
			.addCase(createRateCard.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(createRateCard.fulfilled, (state, action) => {
				state.isLoading = false;
				state.rateCards.push(action.payload.data || action.payload);
				state.successMessage =
					action.payload.message || "Rate card created successfully";
			})
			.addCase(createRateCard.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			});

		// Update Rate Card
		builder
			.addCase(updateRateCard.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(updateRateCard.fulfilled, (state, action) => {
				state.isLoading = false;
				const updatedRateCardData = action.payload.data || action.payload;
				const index = state.rateCards.findIndex(
					(card) => card.id === updatedRateCardData.id
				);
				if (index !== -1) {
					state.rateCards[index] = updatedRateCardData;
				}
				state.singleRateCard = updatedRateCardData;
				state.successMessage =
					action.payload.message || "Rate card updated successfully";
			})
			.addCase(updateRateCard.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			});

		// Delete Rate Card
		builder
			.addCase(deleteRateCard.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(deleteRateCard.fulfilled, (state, action) => {
				state.isLoading = false;
				state.rateCards = state.rateCards.filter(
					(card) => card.id !== action.payload.rateCardId
				);
				state.successMessage =
					action.payload.message || "Rate card deleted successfully";
			})
			.addCase(deleteRateCard.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			});
		
			// Check Rate Card Exists
    builder
			.addCase(checkRateCardExists.pending, (state) => {
        state.checkExistsLoading = true;
        state.error = null;
      })
      .addCase(checkRateCardExists.fulfilled, (state, action) => {
        state.checkExistsLoading = false;
        state.existsData = action.payload;
      })
      .addCase(checkRateCardExists.rejected, (state, action) => {
        state.checkExistsLoading = false;
        state.error = action.payload?.message || 'Failed to check rate card existence';
      })
	},
});

export const {
	clearError,
	clearSuccess,
	clearSingleRateCard,
	clearRateCardsByProcess,
	setFilters,
	resetFilters,
	setPagination,
	setSortConfig,
	resetSortConfig,
	resetPagination,
} = rateCardSlice.actions;

export default rateCardSlice.reducer;
