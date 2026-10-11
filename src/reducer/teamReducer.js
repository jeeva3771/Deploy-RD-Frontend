import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, AxiosError } from "../utils/url/config";

// Async Thunks
export const getAllTeams = createAsyncThunk(
    "teams/getAllTeams",
    async ({
        page = 1,
        limit = 8,
        search = "",
        department = "",
        is_active = "",
    } = {}, { rejectWithValue }) => {
        try {
            const query = `?page=${page}&limit=${limit}&search=${search}&department=${department}&is_active=${is_active}`;
            const response = await axiosInstance.get(`/teams${query}`);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(
                    error.response?.data?.message || "Failed to fetch teams"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const getTeamById = createAsyncThunk(
    "teams/getTeamById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/teams/${id}`);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(
                    error.response?.data?.message || "Failed to fetch team"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const createTeam = createAsyncThunk(
    "teams/createTeam",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/teams/create", formData);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(
                    error.response?.data?.message || "Failed to create team"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const updateTeam = createAsyncThunk(
    "teams/updateTeam",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/teams/${id}`, formData);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(
                    error.response?.data?.message || "Failed to update team"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const deleteTeam = createAsyncThunk(
    "teams/deleteTeam",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/teams/${id}`);
            return { id, message: response.data.message };
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(
                    error.response?.data?.message || "Failed to delete team"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const removeMemberFromTeam = createAsyncThunk(
    "teams/removeMember",
    async ({ teamId, userId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/teams/remove-member/${teamId}`, { userId });
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(
                    error.response?.data?.message || "Failed to remove member"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

// Initial State
const initialState = {
    teams: [],
    singleTeam: null,
    isLoading: false,
    error: null,
    successMessage: null,
    pagination: {
        page: 1,
        limit: 8,
        total: 0,
        totalPages: 0,
    },
    filters: {
        search: "",
        department: "",
        is_active: "",
    },
};

// Team Slice
const teamSlice = createSlice({
    name: "teams",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.successMessage = null;
        },
        clearSingleTeam: (state) => {
            state.singleTeam = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = {
                search: "",
                department: "",
                is_active: "",
            };
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        resetPagination: (state) => {
            state.pagination = {
                page: 1,
                limit: 8,
                total: 0,
                totalPages: 0,
            };
        },
    },
    extraReducers: (builder) => {
        // Get All Teams
        builder
            .addCase(getAllTeams.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllTeams.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teams = action.payload.data || [];
                state.pagination = {
                    page: action.payload.currentPage || 1,
                    limit: action.payload.limit || 8,
                    total: action.payload.total || 0,
                    totalPages: action.payload.totalPages || 0,
                };
                state.successMessage = "Teams fetched successfully";
            })
            .addCase(getAllTeams.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });

        // Get Team By ID
        builder
            .addCase(getTeamById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getTeamById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.singleTeam = action.payload.data || action.payload;
                state.successMessage = "Team fetched successfully";
            })
            .addCase(getTeamById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });

        // Create Team
        builder
            .addCase(createTeam.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createTeam.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teams.push(action.payload.data || action.payload);
                state.successMessage = action.payload.message || "Team created successfully";
            })
            .addCase(createTeam.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });

        // Update Team
        builder
            .addCase(updateTeam.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateTeam.fulfilled, (state, action) => {
                state.isLoading = false;
                const updatedTeamData = action.payload.data || action.payload;
                const index = state.teams.findIndex(
                    (team) => team.id === updatedTeamData.id
                );
                if (index !== -1) {
                    state.teams[index] = updatedTeamData;
                }
                state.singleTeam = updatedTeamData;
                state.successMessage = action.payload.message || "Team updated successfully";
            })
            .addCase(updateTeam.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });

        // Delete Team
        builder
            .addCase(deleteTeam.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteTeam.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teams = state.teams.filter(
                    (team) => team.id !== action.payload.id
                );
                state.successMessage = action.payload.message || "Team deleted successfully";
            })
            .addCase(deleteTeam.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });

        // Remove User From Team
        builder
            .addCase(removeMemberFromTeam.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(removeMemberFromTeam.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teams = state.teams.filter(
                    (team) => team.id !== action.payload.id
                );
                state.successMessage = action.payload.message || "Member removed successfully";
            })
            .addCase(removeMemberFromTeam.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearError,
    clearSuccess,
    clearSingleTeam,
    setFilters,
    resetFilters,
    setPagination,
    resetPagination
} = teamSlice.actions;
export default teamSlice.reducer;
