import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteTeam, getAllTeams, removeMemberFromTeam } from '../../../reducer/teamReducer';
import { fetchAllUsers } from '../../../reducer/userReducer';
import { toast } from 'react-toastify';
import ProfileImage from '../../users/ProfileImage';
import DeleteModal from '../../components/DeleteModal';

import { teamColors } from '../../../utils/teamColors';

const TeamCard = ({ team, index, selectedTeam }) => {
    const dispatch = useDispatch();
    // Backend returns member_list, not members
    const members = team.member_list || [];

    // Determine color theme based on index
    const colorTheme = teamColors[index % teamColors.length];

    const handleShare = () => {
        const memberNames = members.map(m => m.name).join(', ');
        // const message = `*Team Details*\n\n*Name:* ${team.team_name || team.name}\n*Code:* ${team.code}\n*Shift:* ${team.shift_timing || team.timing}\n*Members:* ${memberNames}`;
        const message = `*Team Details*\n*Name:* ${team.team_name || team.name}\n*Code:* ${team.code}\n*Shift:* ${typeof team.shift_timing === 'object' && team.shift_timing !== null
            ? `${team.shift_timing.start_time} - ${team.shift_timing.end_time} (${team.shift_timing.name})`
            : (team.shift_timing || team.timing)}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'team' or 'member'
    const [selectedMember, setSelectedMember] = useState(null);

    const handleDeleteClick = () => {
        setDeleteType('team');
        setShowDeleteModal(true);
    };

    const handleRemoveMemberClick = (member) => {
        setDeleteType('member');
        setSelectedMember(member);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            if (deleteType === 'team') {
                const teamId = team._id || team.id;
                await dispatch(deleteTeam(teamId)).unwrap();
                toast.success("Team deleted successfully");
                dispatch(getAllTeams({ is_active: true, department: selectedTeam._id, page: 1, limit: 8 }));
                // Also refresh users as they are now unassigned
                dispatch(fetchAllUsers({ is_active: true }));
            } else if (deleteType === 'member') {
                const teamId = team._id || team.id;
                const userId = selectedMember._id || selectedMember.id;
                await dispatch(removeMemberFromTeam({ teamId, userId })).unwrap();
                toast.success("Member removed successfully");
                dispatch(getAllTeams({ is_active: true, department: selectedTeam._id, page: 1, limit: 8 }));
                // Refresh users so the removed user appears in the list again
                dispatch(fetchAllUsers({ is_active: true }));
            }
        } catch (error) {
            console.error("Failed to action:", error);
            toast.error(typeof error === 'string' ? error : "Failed to perform action");
        } finally {
            setShowDeleteModal(false);
            setDeleteType(null);
            setSelectedMember(null);
        }
    };

    const customColor = team.color && team.color !== '#cbd5e1' ? team.color : null;

    return (
        <div
            className={`bg-white border text-sm rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group w-full ${!customColor ? colorTheme.border : ''}`}
            style={customColor ? { borderColor: customColor } : {}}
        >
            {/* Header */}
            <div
                className={`px-3 py-2 flex justify-between items-start text-white relative ${!customColor ? colorTheme.header : ''}`}
                style={customColor ? { backgroundColor: customColor } : {}}
            >
                <div>
                    <h3 className="font-bold text-base capitalize mb-0.5">{team.team_name || team.name} {team.type === "float" ? " - (Floating Team)" : ""}</h3>
                    <div
                        className={`backdrop-blur-sm inline-block px-2 py-0.5 rounded text-sm font-bold font-mono tracking-widest shadow-inner border ${!customColor ? `${colorTheme.pill} ${colorTheme.pillBorder}` : ''}`}
                        style={customColor ? { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.3)' } : {}}
                    >
                        {team.code}
                    </div>
                </div>
                <div
                    className={`rounded-full w-9 h-9 flex flex-col items-center justify-center shadow-lg border-2 ${!customColor ? `${colorTheme.badgeBg} ${colorTheme.badgeText} ${colorTheme.badgeBorder}` : ''}`}
                    style={customColor ? { backgroundColor: 'white', color: customColor, borderColor: 'rgba(255,255,255,0.5)' } : {}}
                >
                    <span className="text-sm font-extrabold leading-none mt-0.5">{members.length}</span>
                    <span className="text-[6px] font-bold uppercase tracking-tighter">STAFF</span>
                </div>
            </div>

            {/* Body */}
            <div className="p-3">
                {/* Time */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                    <i className="fa-regular fa-clock text-slate-400 text-sm"></i>
                    <span className="tracking-wide">
                        {typeof team.shift_timing === 'object' && team.shift_timing !== null
                            ? `${team.shift_timing.start_time} - ${team.shift_timing.end_time} (${team.shift_timing.name})`
                            : (team.shift_timing || team.timing)}
                    </span>
                </div>

                <div className="border-b border-dashed border-gray-200 mb-2"></div>

                {/* Members */}
                <div className="mb-1">
                    <div className="text-[10px] text-slate-400 mb-1 font-normal">Team Members:</div>
                    <div className="flex flex-wrap gap-2">
                        {members.map((member, index) => (
                            <div key={member.id || member._id || index} className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm rounded-full pl-1 pr-2 py-0.5 hover:shadow-md transition-all">
                                <span className="block h-6 w-6 [&>div]:w-6 [&>div]:h-6 [&>div]:text-[10px] [&>img]:w-6 [&>img]:h-6">
                                    <ProfileImage
                                        src={member.image}
                                        alt={member.first_name || member.name || "Member"}
                                        name={member.first_name || member.name || "Member"}
                                        size="default"
                                    />
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold capitalize text-gray-700 leading-tight">
                                        {member.first_name || member.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRemoveMemberClick(member)}
                                    className={`w-4 h-4 flex items-center justify-center rounded-full hover:text-red-500 hover:bg-red-50 ml-1 transition-colors ${!customColor ? colorTheme.textLight : ''}`}
                                    style={customColor ? { color: customColor } : {}}
                                >
                                    <i className="fa-solid fa-xmark text-[10px] font-bold"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-3 pb-2 flex justify-end gap-2">
                <button
                    onClick={handleShare}
                    className="w-8 h-8 rounded flex items-center justify-center bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all shadow-sm hover:translate-y-[-1px]"
                    title="Share on WhatsApp"
                >
                    <i className="fa-brands fa-whatsapp text-sm"></i>
                </button>
                <button
                    onClick={() => window.open(`/print/team/single/${team.id || team._id}`, '_blank')}
                    className="w-8 h-8 rounded flex items-center justify-center bg-white border border-slate-200 text-[#5B6B79] hover:border-slate-300 transition-all shadow-sm hover:translate-y-[-1px]"
                    title="Print"
                >
                    <i className="fa-solid fa-print text-xs"></i>
                </button>
                <button
                    onClick={handleDeleteClick}
                    className="w-8 h-8 rounded flex items-center justify-center bg-[#FFE5E5] text-[#FF4D4F] hover:bg-[#ffd6d6] transition-all shadow-sm hover:translate-y-[-1px]"
                    title="Delete"
                >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>

            {showDeleteModal && (
                <DeleteModal
                    deleteModalData={deleteType === 'team' ? team : selectedMember}
                    onCancel={() => setShowDeleteModal(false)}
                    confirmDelete={confirmDelete}
                    message={
                        deleteType === 'team'
                            ? `Are you sure you want to delete the team "${team.team_name || team.name}"? This action cannot be undone.`
                            : `Are you sure you want to remove "${selectedMember?.first_name || selectedMember?.name}" from the team "${team.team_name || team.name}"?`
                    }
                />
            )}
        </div>
    );
};

export default TeamCard;
