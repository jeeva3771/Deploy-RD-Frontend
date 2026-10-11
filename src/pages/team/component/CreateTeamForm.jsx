import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../../reducer/userReducer';
import { createTeam, getAllTeams } from '../../../reducer/teamReducer';
import { fetchAllShiftTimes } from '../../../reducer/masters/shiftTimeReducer';
import TeamMemberItem from './TeamMemberItem';
import { toast } from 'react-toastify';

const CreateTeamForm = ({ selectedTeam }) => {
    const dispatch = useDispatch();
    const { teams } = useSelector((state) => state.team);
    const { shiftTimes } = useSelector((state) => state.shiftTime);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Form State
    const [shiftName, setShiftName] = useState("");
    const [shiftTiming, setShiftTiming] = useState("");

    useEffect(() => {
        const loadUsers = async () => {
            // ... existing user loading logic ...
            if (selectedTeam && (selectedTeam.id || selectedTeam._id)) {
                setIsLoadingUsers(true);
                try {
                    const params = {
                        department: selectedTeam._id,
                        is_active: "true",
                        available_for_team: "true"
                    };

                    if (shiftTiming) {
                        params.shift_time_id = shiftTiming;
                    }

                    const result = await dispatch(fetchAllUsers(params)).unwrap();

                    if (result && result.data) {
                        setAvailableMembers(result.data);
                    } else {
                        setAvailableMembers([]);
                    }

                } catch (error) {
                    console.error("Failed to fetch users:", error);
                    toast.error("Failed to load team members.");
                    setAvailableMembers([]);
                } finally {
                    setIsLoadingUsers(false);
                }
            } else {
                setAvailableMembers([]);
            }
        };

        loadUsers();
        // We only want to refetch when shiftTiming changes IF we are already in a team context
        // But the original code was also fetching blindly on mount/change.
        
    }, [dispatch, selectedTeam, teams, shiftTiming]);

    useEffect(() => {
         dispatch(fetchAllShiftTimes({ is_active: true }));
         setSelectedMembers([]);
         setShiftName(""); 
         setShiftTiming(""); 
    }, [dispatch, selectedTeam, teams]);


    const toggleMember = (member) => {
        if (selectedMembers.find(m => m.id === member.id)) {
            setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
        } else {
            setSelectedMembers([...selectedMembers, member]);
        }
    };

    const handleCreateTeam = async () => {
        // Validation
        if (!shiftName.trim() && !shiftTiming) {
            toast.error("Please enter shift name and select shift timing");
            return;
        }

        if (!shiftName.trim()) {
            toast.error("Please enter a shift name");
            return;
        }

        if (!shiftTiming) {
            toast.error("Please select a shift timing");
            return;
        }

        if (selectedMembers.length === 0) {
            toast.error("Please select at least one member");
            return;
        }

        if (!selectedTeam) {
            toast.error("Please select a category/department");
            return;
        }

        // Proceed with creation logic
        const teamData = {
            team_name: shiftName,
            shift_timing: shiftTiming,
            member_list: selectedMembers.map(m => m._id),
            department_id: selectedTeam._id
        };

        try {
            await dispatch(createTeam(teamData)).unwrap();
            toast.success("Team created successfully");

            // Refresh the teams list
            dispatch(getAllTeams({ is_active: true, department: selectedTeam._id }));

            // Reset form
            setShiftName("");
            setSelectedMembers([]);

        } catch (error) {
            console.error("Failed to create team:", error);
            // toast.error(error || "Failed to create team"); // Error is handled by reducer/toast usually, but good to have fallback
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-6 flex-1 overflow-y-auto">
                <h2 className="text-purple-700 font-bold mb-1">Create New Team</h2>

                <div className="space-y-5 mt-4">
                    {/* Shift Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Shift Name</label>
                        <input
                            type="text"
                            value={shiftName}
                            onChange={(e) => setShiftName(e.target.value)}
                            placeholder="e.g. Red Squad"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-300"
                        />
                    </div>

                    {/* Shift Timing */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Shift Timing</label>
                        <div className="relative">
                            <select
                                value={shiftTiming}
                                onChange={(e) => setShiftTiming(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-700 cursor-pointer"
                            >
                                <option value="">Select Shift Timing</option>
                                {shiftTimes.map((st) => (
                                    <option key={st.id} value={st._id || st.id}>
                                        {`${st.start_time} - ${st.end_time} (${st.name})`}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <i className="fa-solid fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>

                    {/* Select Members */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Select Members <span className="text-gray-400 font-normal">({availableMembers.length} Available)</span>
                        </label>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {isLoadingUsers ? (
                                <div className="text-center py-4 text-gray-400 text-sm">Loading members...</div>
                            ) : availableMembers.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm">No members found in this department.</div>
                            ) : (
                                availableMembers.map(member => (
                                    <TeamMemberItem
                                        key={member.id || member._id}
                                        member={member}
                                        isSelected={!!selectedMembers.find(m => m.id === member.id)}
                                        onClick={toggleMember}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-50">
                <button
                    onClick={handleCreateTeam}
                    className="w-full bg-[#00bfa5] hover:bg-[#00a891] text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                >
                    <i className="fa-solid fa-plus"></i>
                    Create Team
                </button>
            </div>
        </div>
    );
};

export default CreateTeamForm;
