import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTeams } from '../../../reducer/teamReducer';
import TeamCard from './TeamCard';
import Pagination from '../../components/Pagination';

const ActiveTeamsList = ({ selectedTeam }) => {
    const dispatch = useDispatch();
    const { teams, isLoading, pagination } = useSelector((state) => state.team);

    // Common fetch function
    const fetchTeams = useCallback(({ page = 1, limit = 8 } = {}) => {
        // Wait for selectedTeam to have a value
        if (!selectedTeam) return;

        const params = {
            is_active: true,
            department: selectedTeam._id || selectedTeam.id,
            page,
            limit,
        };

        dispatch(getAllTeams(params));
    }, [dispatch, selectedTeam]);

    // Initial fetch and fetch on category change
    useEffect(() => {
        fetchTeams({ page: 1, limit: pagination?.limit || 8 });
    }, [fetchTeams, selectedTeam, pagination?.limit]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchTeams({ page: newPage, limit: pagination.limit || 8 });
        }
    };

    const handleLimitChange = (newLimit) => {
        fetchTeams({ page: 1, limit: newLimit });
    };

    const handlePrint = () => {
        if (selectedTeam && selectedTeam._id) {
            // Department Print
            window.open(`/print/team/department/${selectedTeam._id}`, '_blank');
        } else {
            // Master Schedule Print
            window.open(`/print/team/master`, '_blank');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{teams.length}</span>
                    <span className="text-gray-500 text-sm">Active Teams</span>
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold px-4 py-2 rounded shadow-md transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-print"></i>
                    Print Current View
                </button>
            </div>

            <div className="overflow-y-auto flex-1 pb-4">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Loading teams...</div>
                ) : teams.length === 0 ? (
                    <div className="text-gray-400 text-sm mt-10 ml-2">No teams active.</div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {teams.map((team, index) => (
                            <TeamCard key={team.id || team._id} team={team} index={index} selectedTeam={selectedTeam} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={pagination.limit || 8}
                    onItemsPerPageChange={handleLimitChange}
                    totalCount={pagination.total || 0}
                    startIndex={(pagination.page - 1) * (pagination.limit || 8)}
                    visibleItemCount={teams.length}
                />
            )}
        </div>
    );
};

export default ActiveTeamsList;
