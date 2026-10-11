import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { createTeam, getAllTeams } from "../../../reducer/teamReducer";
import { getAllDepartments } from "../../../reducer/departmentReducer";
import { fetchAllShiftTimes } from "../../../reducer/masters/shiftTimeReducer";
import { fetchAllUsers } from "../../../reducer/userReducer";

const FloatingTeamModal = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const { teams } = useSelector(state => state.team);
    const { departments } = useSelector(state => state.department);
    const { shiftTimes } = useSelector(state => state.shiftTime);
    const { users } = useSelector(state => state.user);

    const [teamName, setTeamName] = useState("");
    const [shiftId, setShiftId] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        if (open) {
            dispatch(getAllDepartments({ is_active: true }));
            dispatch(fetchAllShiftTimes());
            dispatch(fetchAllUsers({ is_active: true }));
        }
    }, [dispatch, open]);

    const handleClose = () => {
        setTeamName("");
        setShiftId("");
        setSelectedMembers([]);
        onClose();
    };

    const assemblyDept = departments.find(d => d.name?.toLowerCase().includes("assembly"));

    const handleMemberToggle = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleCreate = async () => {
        if (!teamName) {
            toast.error("Please enter a team name.");
            return;
        }
        if (!shiftId) {
            toast.error("Please select a shift.");
            return;
        }
        if (!assemblyDept) {
            toast.error("Assembly department not found.");
            return;
        }

        // Check for duplicate team name (case-insensitive) against existing teams
        const isDuplicate = (teams || []).some(
            t => t.team_name?.toLowerCase().trim() === teamName.toLowerCase().trim()
        );
        if (isDuplicate) {
            toast.error(`A team named "${teamName}" already exists. Please choose a different name.`);
            return;
        }

        const formData = {
            team_name: teamName,
            department_id: assemblyDept._id,
            shift_timing: shiftId,
            member_list: selectedMembers,
            type: "float",
            is_active: true
        };

        try {
            const res = await dispatch(createTeam(formData));
            if (createTeam.fulfilled.match(res)) {
                toast.success("Floating team created successfully!");
                dispatch(getAllTeams({ is_active: true }));
                handleClose();
            } else {
                toast.error(res.payload || "Failed to create team.");
            }
        } catch (error) {
            toast.error("An error occurred.");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
            <div
                className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full flex flex-col animate-in zoom-in-95 duration-300 my-auto overflow-hidden"
                style={{ maxWidth: '520px', maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Create Floating Team</h3>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Setup new assembly unit</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-800 flex-shrink-0"
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0 scrollbar-thin scrollbar-thumb-gray-300">

                    {/* Team Name & Shift */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Team Name</label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-black text-slate-700 placeholder:text-slate-300"
                                placeholder="e.g. ALPHA TEAM"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Shift Schedule</label>
                            <select
                                value={shiftId}
                                onChange={(e) => setShiftId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-black text-slate-700 cursor-pointer appearance-none"
                            >
                                <option value="">Select Shift</option>
                                {shiftTimes.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} ({s.start_time}-{s.end_time})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Members Selection */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Staff Registry</label>
                            <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                {selectedMembers.length} Selected
                            </span>
                        </div>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <div
                                className="overflow-y-auto divide-y divide-slate-100/50"
                                style={{ maxHeight: '38vh' }}
                            >
                                {/* Unassigned Assembly Members */}
                                {(() => {
                                    const unassignedAssemblyUsers = users.filter(u => {
                                        const isAssemblyDept = (u.department_id?._id || u.department_id) === assemblyDept?._id ||
                                            u.department_id?.name?.toLowerCase().includes("assembly");
                                        const isUnassigned = !u.team_id;
                                        return isAssemblyDept && isUnassigned;
                                    });

                                    if (unassignedAssemblyUsers.length === 0) return null;

                                    return (
                                        <div>
                                            <div className="bg-amber-50/80 px-4 py-2 sticky top-0 z-10 flex items-center justify-between border-y border-amber-200/50">
                                                <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Unassigned Members</span>
                                                <span className="text-[11px] font-bold text-amber-500">{unassignedAssemblyUsers.length} Members</span>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {unassignedAssemblyUsers.map(m => (
                                                    <div
                                                        key={m._id}
                                                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-white group ${selectedMembers.includes(m._id) ? 'bg-indigo-50/30' : ''}`}
                                                        onClick={() => handleMemberToggle(m._id)}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="relative flex-shrink-0">
                                                                {m.image ? (
                                                                    <img
                                                                        src={m.image}
                                                                        alt=""
                                                                        className={`w-9 h-9 rounded-xl border-2 object-cover transition-all ${selectedMembers.includes(m._id) ? 'border-indigo-500 shadow-md' : 'border-white shadow-sm'}`}
                                                                    />
                                                                ) : (
                                                                    <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-xs font-black uppercase transition-all ${selectedMembers.includes(m._id)
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                                        : 'bg-slate-100 border-white text-slate-400 shadow-sm'
                                                                        }`}>
                                                                        {m.firstName?.charAt(0) || m.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                )}
                                                                {selectedMembers.includes(m._id) && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                                                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className={`text-sm font-black truncate transition-colors ${selectedMembers.includes(m._id) ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                                    {m.name || m.username || `${m.firstName} ${m.lastName}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 transition-all flex items-center justify-center ml-3 ${selectedMembers.includes(m._id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                                                            {selectedMembers.includes(m._id) && (
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {teams.filter(t => {
                                    const deptName = t.department_id?.name || departments.find(d => d._id === (t.department_id?._id || t.department_id))?.name;
                                    const isAssembly = deptName?.toLowerCase().includes("assembly");
                                    const isFloating = t.type === "float" || t.team_name?.toLowerCase().includes("floating");
                                    return isAssembly && !isFloating;
                                }).map(t => (
                                    <div key={t._id}>
                                        <div className="bg-slate-100/80 px-4 py-2 sticky top-0 z-10 flex items-center justify-between border-y border-slate-200/50">
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.team_name}</span>
                                            <span className="text-[11px] font-bold text-slate-400">{t.member_list?.length || 0} Members</span>
                                        </div>

                                        <div className="divide-y divide-slate-50">
                                            {t.member_list?.map(m => (
                                                <div
                                                    key={m._id}
                                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-white group ${selectedMembers.includes(m._id) ? 'bg-indigo-50/30' : ''}`}
                                                    onClick={() => handleMemberToggle(m._id)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="relative flex-shrink-0">
                                                            {m.image ? (
                                                                <img
                                                                    src={m.image}
                                                                    alt=""
                                                                    className={`w-9 h-9 rounded-xl border-2 object-cover transition-all ${selectedMembers.includes(m._id) ? 'border-indigo-500 shadow-md' : 'border-white shadow-sm'}`}
                                                                />
                                                            ) : (
                                                                <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-xs font-black uppercase transition-all ${selectedMembers.includes(m._id)
                                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                                    : 'bg-slate-100 border-white text-slate-400 shadow-sm'
                                                                    }`}>
                                                                    {m.name?.charAt(0)}
                                                                </div>
                                                            )}
                                                            {selectedMembers.includes(m._id) && (
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-sm font-black truncate transition-colors ${selectedMembers.includes(m._id) ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                                {m.name}
                                                            </span>
                                                            {/* <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                                                                {m.designation || 'Specialist'}
                                                            </span> */}
                                                        </div>
                                                    </div>

                                                    <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 transition-all flex items-center justify-center ml-3 ${selectedMembers.includes(m._id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                                                        {selectedMembers.includes(m._id) && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!t.member_list || t.member_list.length === 0) && (
                                                <div className="p-4 text-center text-[10px] font-bold text-slate-300 italic">
                                                    No available staff in this unit
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-black text-xs tracking-widest transition-all uppercase whitespace-nowrap"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={selectedMembers.length === 0 || !teamName}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-slate-800 text-white rounded-xl font-black text-xs tracking-widest shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none uppercase whitespace-nowrap"
                        >
                            Create Floating Unit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloatingTeamModal;