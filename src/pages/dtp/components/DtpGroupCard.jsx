import React from 'react';
import { getUser } from '../../../utils/permission/auth';

const DtpGroupCard = ({ group, columnType, onOpenDetails }) => {
    const currentUser = getUser();
    const isSalesPerson = (currentUser?.role === "Client Servicing Manager" || currentUser?.role === "Client Servicing Executive");
    return (
        <div
            onClick={() => onOpenDetails(group.id, false, true, group.status)} // Added status as 4th arg
            className="relative bg-white p-5 rounded-xl shadow-sm border-2 border-slate-100 hover:shadow-md transition-all cursor-pointer group"
        >
            {group.is_on_hold && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg z-20 border border-amber-400">
                    ON HOLD
                </div>
            )}
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest font-primary">Folder</span>
                        <div className="h-1 flex-1 bg-pink-100 rounded-full" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-1 font-primary group-hover:text-pink-600 transition-colors">
                        {group.folder_name}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-xs font-medium font-primary">{group.jobs.length} Jobs</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold font-primary">{group.job_no}</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-50">
                {group.assigned_to_name && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                            <i className="fa-solid fa-user text-[10px] text-slate-400"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-500 font-primary">{group.assigned_to_name}</span>
                    </div>
                )}

                {!isSalesPerson && (
                    <button
                        className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm font-primary"
                    >
                        Process
                    </button>
                )}
            </div>
        </div>
    );
};

export default DtpGroupCard;
