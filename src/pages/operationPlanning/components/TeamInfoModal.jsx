import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

const AVATAR_COLORS = [
    { bg: '#eef2ff', text: '#4338ca' },
    { bg: '#f0fdf4', text: '#16a34a' },
    { bg: '#fdf4ff', text: '#9333ea' },
    { bg: '#fff7ed', text: '#c2410c' },
    { bg: '#f0f9ff', text: '#0369a1' },
    { bg: '#fef9c3', text: '#92400e' },
];

const getInitials = (name = '') =>
    name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const TeamInfoModal = ({ team, onClose }) => {
    if (!team) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-xl shadow-2xl w-full flex flex-col"
                style={{ maxWidth: '780px', maxHeight: '90vh' }}
            >
                {/* Title Bar */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <InfoOutlinedIcon className="text-blue-600" fontSize="small" />
                        <h3 className="text-base font-semibold text-slate-800">
                            Team Overview: {team.team_name}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-5">

                    {/* Basic Information */}
                    <div className="rounded-lg overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-2">
                            <InfoOutlinedIcon sx={{ fontSize: 15, color: 'white' }} />
                            <span className="text-white text-xs font-bold uppercase tracking-wider">Basic Information</span>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                            <Row label="Team Name" value={team.team_name} />
                            <Row label="Code" value={<span className="text-blue-600 font-bold">{team.code || '—'}</span>} />
                            <Row label="Status" value={
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                    <span className="text-emerald-600 font-semibold">Active</span>
                                </span>
                            } />
                            <Row label="Department" value={team.department_id?.name || '—'} />
                        </div>
                    </div>

                    {/* Shift Information */}
                    <div className="rounded-lg overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-2">
                            <InfoOutlinedIcon sx={{ fontSize: 15, color: 'white' }} />
                            <span className="text-white text-xs font-bold uppercase tracking-wider">Shift Information</span>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                            <Row label="Shift" value={team.shift_timing?.name || '—'} />
                            <Row label="Start Time" value={team.shift_timing?.start_time || '—'} />
                            <Row label="End Time" value={team.shift_timing?.end_time || '—'} />
                            <Row label="Total Members" value={
                                <span className="font-bold text-slate-800">{team.member_list?.length || 0}</span>
                            } />
                        </div>
                    </div>

                    {/* Members — full width */}
                    <div className="col-span-2 rounded-lg overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-2">
                            <GroupsOutlinedIcon sx={{ fontSize: 15, color: 'white' }} />
                            <span className="text-white text-xs font-bold uppercase tracking-wider">
                                Team Members ({team.member_list?.length || 0})
                            </span>
                        </div>
                        <div className="p-4">
                            {team.member_list?.length > 0 ? (
                                <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {team.member_list.map((member, idx) => {
                                            const palette = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                            return (
                                                <div
                                                    key={member._id}
                                                    className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100"
                                                >
                                                    {member.image ? (
                                                        <img
                                                            src={member.image}
                                                            alt={member.name}
                                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                                            style={{ background: palette.bg, color: palette.text }}
                                                        >
                                                            {getInitials(member.name)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                                                        {/* <p className="text-xs text-slate-400 truncate">{team.member_list.role}</p> */}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-300 text-sm italic">No members assigned</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper row component
const Row = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500 font-medium">{label}:</span>
        <span className="text-slate-800 font-semibold text-right">{value || '—'}</span>
    </div>
);

export default TeamInfoModal;