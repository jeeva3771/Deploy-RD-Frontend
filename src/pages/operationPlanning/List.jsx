                            import React, { useState, useEffect } from 'react';
import UnassignedJobs from './components/UnassignedJobs';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTeams } from '../../reducer/teamReducer';
import { getAllDepartments } from '../../reducer/departmentReducer';
import { fetchTeamProductionJobs } from '../../reducer/assemblyTeamJobReducer';
import TeamLane from './components/TeamLane';
import FloatingTeamModal from './components/FloatingTeamModal';
import AssignProductionModal from './components/AssignProductionModal';

const OperationPlanningList = () => {
    const dispatch = useDispatch();
    const { teams } = useSelector(state => state.team);
    const { teamJobs } = useSelector(state => state.assemblyTeamJob);
    const { departments } = useSelector(state => state.department);
    const { user } = useSelector(state => state.auth);
    const [openFloatingModal, setOpenFloatingModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [unassignedRefreshKey, setUnassignedRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(getAllTeams({ is_active: true }));
        dispatch(getAllDepartments({ is_active: true }));
        dispatch(fetchTeamProductionJobs({ search: searchTerm }));
    }, [dispatch, searchTerm]);

    const assemblyDeptId = departments.find(d => d.name?.toLowerCase().includes("assembly"))?._id;

    const role = user?.role?.toLowerCase() || '';
    const isAdmin = role === 'admin executive';
    const isOperatingDirector = role.includes('operation');
    const isHead = !!user?.is_head;

    const isAssembly = role.includes('assembly') || user?.department?.name?.toLowerCase().includes("assembly");
    const isOpDirOrAdmin = isAdmin || isOperatingDirector;
    const canSeeLanes = isOpDirOrAdmin || (isAssembly && isHead);
    const canManageUnassigned = isOpDirOrAdmin; // Assembly head sees lanes but NOT unassigned queue
    const isSpecificTeamView = !canSeeLanes;

    const filteredTeams = (teams || []).filter(t => {

        const tDeptId = t.department_id?._id || t.department_id;
        const reflectsAssembly = t.department_id?.name?.toLowerCase().includes("assembly") || tDeptId === assemblyDeptId;
        const isFloating = t.team_name?.toLowerCase().includes("floating");

        let teamMatchesRules = reflectsAssembly || isFloating;

        // If specific team view, only show the team the user belongs to
        if (isSpecificTeamView) {
            const isMember = t.member_list?.some(m => m === user?._id || m?._id === user?._id);
            const isCreator = t.created_by === user?._id;

            // Include only if they are associated with the team
            teamMatchesRules = teamMatchesRules && (isMember || isCreator);
        }

        return teamMatchesRules;
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-[#1e293b]">Operations Planning</h2>
                        {/* <p className="text-sm text-slate-400 font-medium">Manage and track production schedules across assembly teams</p> */}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Search Bar (Inspired by Production Hub) */}
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Search Job No, Sub Job, Reference..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto mr-3">
                            {canManageUnassigned && (
                                <button
                                    onClick={() => setOpenFloatingModal(true)}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 hide-on-print"
                                >
                                    + Floating Team
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {canManageUnassigned && (
                    <UnassignedJobs
                        refreshKey={unassignedRefreshKey}
                        searchTerm={searchTerm}
                        onAssignClick={(job) => { setSelectedJob(job); setOpenAssignModal(true); }}
                    />
                )}

                <div className="space-y-6">
                    {filteredTeams.map((team) => (
                        <TeamLane
                            key={team._id}
                            team={team}
                            canReassign={canManageUnassigned}
                            onReassignClick={(job) => { setSelectedJob(job); setOpenAssignModal(true); }}
                        />
                    ))}
                </div>
            </div>

            {openFloatingModal && (
                <FloatingTeamModal
                    open={openFloatingModal}
                    onClose={() => setOpenFloatingModal(false)}
                />
            )}

            {openAssignModal && (
                <AssignProductionModal
                    open={openAssignModal}
                    onClose={() => { setOpenAssignModal(false); setSelectedJob(null); }}
                    onAssigned={() => {
                        setUnassignedRefreshKey(k => k + 1);
                        setSearchTerm('');
                    }}
                    job={selectedJob}
                    totalQuantity={selectedJob?.job_quantity || selectedJob?.quantity || selectedJob?.qty}
                    reassignmentMode={!!selectedJob?.production_assignments?.length || !!selectedJob?.team_id}
                />
            )}
        </div>
    );
};

export default OperationPlanningList;
