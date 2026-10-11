import React from 'react';
import { X, FileText, Printer, Activity, Package, LayoutGrid, Clock } from 'lucide-react';

const ActivityLogModal = ({ isOpen, onClose, job, materialGroup, isPrintInstance = false }) => {
    if (!isOpen) return null;

    const processHistory = job?.process_history || [];

    // Summary calculations (placeholders or from job data)
    // In a real app, these would come from the job/materialGroup data
    const mainMat = materialGroup?.materials?.find(m => {
        const cat = m.category_type?.toLowerCase() || '';
        return !cat.includes('consumable') && !cat.includes('hardware');
    });
    const size = mainMat?.material_input?.size || '18X12IN';
    const ups = mainMat?.material_input?.ups || materialGroup?.ups || 0;

    // QUANTITY CALCULATION: Total Sheets - Outsourced Sheets
    const totalSheets = mainMat?.quantity || materialGroup?.sheets_required || 0;
    const outsourcedSheets = materialGroup?.assigned_outsource_sheets || 0;
    const inHouseSheets = totalSheets - outsourcedSheets;

    const inHouseQty = inHouseSheets * ups;

    const inwardGood = (materialGroup?.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
    const goodIssuedPcs = inwardGood * ups;

    const processLogs = job?.process_history?.filter(log => log.affected_groups?.includes(materialGroup?.group_id || materialGroup?._id)) || [];
    const relevantLogs = processLogs.length > 0 ? processLogs : processHistory;

    const totalPrinted = relevantLogs.reduce((acc, log) => acc + (log.details?.good_qty || 0), 0);
    const InwardBadQty = (materialGroup?.inward_history || []).reduce((acc, log) => acc + (log.bad_qty || 0), 0);
    const rejects = 0;
    const recuts = 0; // Not actively tracked in current schema
    const totalTime = '00:00'; // Timer state not present in historical modal

    const stats = [
        { label: 'REQUIRED', value: `${inHouseSheets} sheets`, color: 'text-white' },
        { label: 'Inward Good', value: `${inwardGood} pcs`, color: 'text-emerald-400' },
        { label: 'Inward Bad', value: `${InwardBadQty} pcs`, color: 'text-red-400' },
        { label: 'Recuts', value: `${recuts} pcs`, color: 'text-yellow-400' },
        { label: 'Rejects', value: `${rejects} pcs`, color: 'text-slate-400' },
        { label: 'Total Time', value: totalTime, color: 'text-cyan-400' },
    ];

    const handlePrint = () => {
        window.print();
    };
    return (
        <div id={isPrintInstance ? "activity-log-print-wrapper" : "activity-log-modal-wrapper"} className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 ${isPrintInstance ? 'opacity-0 pointer-events-none print:opacity-100 print:bg-white print:p-0' : 'bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 print:bg-white print:p-0'}`}>
            <div id={isPrintInstance ? "activity-log-print-instance" : "activity-log-modal"} className={`bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-4xl flex flex-col ${isPrintInstance ? 'overflow-visible h-max max-h-none print:shadow-none print:border-none print:rounded-none' : 'overflow-hidden max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-lg font-black text-white tracking-tight">
                                Activity Log — <span className="text-slate-400">{job?.job_no}/{job?.sub_job_no}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>LASER CUT CO</span>
                            <span>•</span>
                            <span>{materialGroup?.group_name}</span>
                            <span>•</span>
                            <span>{size}</span>
                            <span>•</span>
                            <span>{inHouseQty} units</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 print-hide">
                            <Printer className="w-3.5 h-3.5" />
                            Print PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all border border-white/10 print-hide"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="px-6 py-4 grid grid-cols-6 border-b border-white/5 bg-white/[0.02]">
                    {stats.map((s, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{s.label}</span>
                            <span className={`text-lg font-black tracking-tighter ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Primary Cycle Context */}
                <div className="px-6 py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">PRIMARY CYCLE</span>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                                {ups} UPS × 0 cycles = 0 pcs
                            </span>
                        </div>
                    </div>
                </div>
                {/* Log List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-modal-scroll">
                    {processHistory.length > 0 ? (
                        processHistory.map((log, idx) => (
                            <div key={idx} className="flex gap-6 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex flex-col items-center gap-2 pt-1">
                                    <span className="text-[11px] font-black text-slate-600 font-mono">
                                        {log.timestamp?.split(' ')?.pop() || '00:00'}
                                    </span>
                                    <div className="w-0.5 flex-1 bg-white/5 rounded-full"></div>
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                            ${log.activity_type === 'System' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                log.activity_type === 'Sampling' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {log.action || log.activity_type}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {log.operator_name}
                                        </span>
                                    </div>
                                    {log.details?.remarks && (
                                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                            <p className="text-[11px] font-medium text-slate-400 italic">
                                                "{log.details.remarks}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40 py-20">
                            <Activity className="w-12 h-12 mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">No activity recorded yet</span>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
                .custom-modal-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-modal-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-modal-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-modal-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    /* Allow wrapper and modal to be visible */
                    #activity-log-print-wrapper, #activity-log-print-wrapper *,
                    #activity-log-modal-wrapper, #activity-log-modal-wrapper * {
                        visibility: visible;
                    }
                    #activity-log-print-wrapper, #activity-log-modal-wrapper {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100vw !important;
                        height: max-content !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                        opacity: 1 !important;
                        display: block !important; /* Overrides flex centering */
                    }
                    #activity-log-modal, #activity-log-print-instance {
                        position: relative !important;
                        width: 100% !important;
                        max-width: none !important; /* Removes max-w-4xl constraint */
                        height: max-content !important;
                        background-color: #0f172a !important; /* Force dark bg in some browsers */
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                    }
                    .print-hide, #activity-log-modal button, #activity-log-print-instance button {
                        display: none !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default ActivityLogModal;
