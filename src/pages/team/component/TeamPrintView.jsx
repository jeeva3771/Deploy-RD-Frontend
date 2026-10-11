import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getAllTeams, getTeamById } from '../../../reducer/teamReducer';
import TeamCard from './TeamCard';

const TeamPrintView = () => {
    const { type, id } = useParams(); // type: 'single', 'department', 'master'
    const dispatch = useDispatch();
    const { teams, singleTeam, isLoading } = useSelector((state) => state.team);

    useEffect(() => {
        const fetchData = async () => {
            if (type === 'single' && id) {
                await dispatch(getTeamById(id));
            } else if (type === 'department' && id) {
                await dispatch(getAllTeams({ department: id, is_active: true, limit: 1000 })); // Fetch all for print
            } else if (type === 'master') {
                await dispatch(getAllTeams({ is_active: true, limit: 1000 })); // Fetch all for master schedule
            }
        };

        fetchData().then(() => {
            // Give a slight delay for images to load before printing
            setTimeout(() => {
                window.print();
            }, 1000);
        });
    }, [dispatch, type, id]);

    // Grouping for Master Schedule
    const groupedTeams = useMemo(() => {
        if (type !== 'master') return {};

        const groups = {};
        teams.forEach(team => {
            const deptName = team.department_id?.name || "Other";
            if (!groups[deptName]) {
                groups[deptName] = [];
            }
            groups[deptName].push(team);
        });
        return groups;
    }, [teams, type]);

    const titleDate = new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' });
    const headerDate = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading print view...</div>;
    }

    return (
        <div className="bg-white min-h-screen p-8 print:p-0">
            {/* Print Header */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 mb-6 border-b border-gray-200 pb-2">
                <span>{headerDate}</span>
                <span className="uppercase tracking-widest">Work Schedule - {titleDate}</span>
            </div>

            {/* Content Based on Mode */}

            {/* 1. Single Team Mode */}
            {type === 'single' && singleTeam && (
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-8">{singleTeam.department_id?.name || 'Team'}</h1>
                    <div className="w-[350px]">
                        <TeamCard team={singleTeam} index={0} />
                    </div>
                </div>
            )}

            {/* 2. Department Mode */}
            {type === 'department' && (
                <div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2 uppercase">{teams[0]?.department_id?.name || 'Department'} Schedule</h1>
                    <p className="text-sm text-gray-600 mb-6">{teams.length} Active Teams</p>

                    <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
                        {teams.map((team, index) => (
                            <div key={team.id || team._id} className="break-inside-avoid">
                                <TeamCard team={team} index={index} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Master Schedule Mode */}
            {type === 'master' && (
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-black pb-2 mb-8 text-center uppercase">Master Team Schedule</h1>

                    {Object.keys(groupedTeams).sort().map((deptName) => (
                        <div key={deptName} className="mb-10 break-inside-avoid">
                            <h2 className="text-sm font-bold text-gray-700 uppercase mb-4 pl-1 border-l-4 border-gray-800">{deptName}</h2>
                            <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
                                {groupedTeams[deptName].map((team, index) => (
                                    <div key={team.id || team._id} className="break-inside-avoid">
                                        <TeamCard team={team} index={index} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Data State */}
            {((type === 'single' && !singleTeam) || (type !== 'single' && teams.length === 0)) && !isLoading && (
                <div className="text-center text-gray-400 py-20">No data available for print.</div>
            )}
        </div>
    );
};

export default TeamPrintView;
