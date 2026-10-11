import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Factory, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchShopFloorJobs } from '../../../../reducer/shopFloorReducer';

const Outsource = ({ isUv, department, processNames }) => {
    const dispatch = useDispatch();
    
    // Select shop floor jobs from Redux
    const { jobs, loading } = useSelector((state) => state.shopFloor);

    // Accordion toggle state: maps assignKey -> { assignmentHistory: boolean, processFlow: boolean }
    const [openToggles, setOpenToggles] = useState({});

    const dept = department || (isUv ? 'Print' : 'Laser');

    const toggleSection = (assignKey, section) => {
        setOpenToggles(prev => ({
            ...prev,
            [assignKey]: {
                ...prev[assignKey],
                [section]: !prev[assignKey]?.[section] // explicitly toggles, defaults to false (closed)
            }
        }));
    };

    const isSectionOpen = (assignKey, section) => {
        return !!openToggles[assignKey]?.[section]; // defaults to false (collapsed)
    };

    // Fetch jobs when component mounts to ensure latest live data
    useEffect(() => {
        const jobParams = processNames
            ? { process_name: processNames, exclude_completed: 'true' }
            : { department: dept, exclude_completed: 'true' };
        dispatch(fetchShopFloorJobs(jobParams));
    }, [dispatch, dept, processNames]);

    // Parse jobs to construct outsource ledger cards dynamically
    const outsourceJobs = [];

    (jobs || []).forEach(job => {
        (job.material_groups || []).forEach(group => {
            const assignments = group.outsource_assignments?.length > 0
                ? group.outsource_assignments
                : (group.vendor_name && group.assigned_outsource_sheets > 0 ? [{
                    vendor_name: group.vendor_name,
                    outsource_sheets: group.assigned_outsource_sheets,
                    outsource_qty: group.assigned_outsource_ups,
                    outsource_rate: group.outsource_rate,
                    outsource_delivery_date: group.outsource_delivery_date,
                    vendor_id: group.vendor_id,
                    current_stage_idx: 0,
                    status: group.sheet_issue_status || 'Active'
                }] : []);

            assignments.forEach(assignment => {
                // Find primary printable material details
                const printableMaterial = group.materials?.find(m => {
                    const cat = m.category_type?.toLowerCase() || '';
                    return !cat.includes('consumable') && !cat.includes('hardware');
                });
                
                const materialName = printableMaterial?.material_name || group.group_name || 'N/A';
                const sizeStr = printableMaterial?.material_input?.size || printableMaterial?.size || 'N/A';
                const upsStr = printableMaterial?.material_input?.ups ? `${printableMaterial.material_input.ups} pcs` : 'N/A';

                // Calculate total quantity received back
                const recdBackQty = (assignment.batch_receipts || [])
                    .filter(r => r.type === 'actual')
                    .reduce((sum, r) => sum + (r.qty || 0), 0);

                // Determine display status
                let statusStr = assignment.status || 'Pending';
                if (assignment.current_stage_idx !== undefined) {
                    const latestStage = (assignment.stage_history || []).slice(-1)[0];
                    if (latestStage) {
                        statusStr = latestStage.stage_label || statusStr;
                    }
                }

                // Calculate progress percentage
                let progressPct = 0;
                if (assignment.outsource_qty > 0) {
                    progressPct = Math.min(100, Math.round((recdBackQty / assignment.outsource_qty) * 100));
                }
                if (assignment.current_stage_idx === 6 || statusStr === 'Completed') {
                    progressPct = 100;
                }

                // Split flow logs: Highlights (Above) vs Accordion 1 (Assignment) vs Accordion 2 (Process)
                const assignmentHistory = [];
                const processFlow = [];
                const partsReturnedLogs = [];

                // 1. Historical logs from job's assign_history (Assignment History Accordion)
                const groupLogs = (job.assign_history || []).filter(h => 
                    (String(h.group_id) === String(group._id) || String(h.group_id) === String(group.group_id)) &&
                    String(h.vendor_id) === String(assignment.vendor_id)
                );

                groupLogs.forEach(log => {
                    if (log.status === 'Confirmed') {
                        assignmentHistory.push({
                            type: 'in',
                            label: 'Vendor Confirmed',
                            detail: 'VENDOR → SYSTEM',
                            note: `Committed Delivery Date: ${log.outsource_delivery_date || 'N/A'}`
                        });
                    } else if (log.status === 'Rejected') {
                        assignmentHistory.push({
                            type: 'out',
                            label: 'Vendor Rejected',
                            detail: 'VENDOR → SYSTEM',
                            note: `Reason: ${log.rejection_reason || 'N/A'}`
                        });
                    } else if (log.status === 'Removed') {
                        assignmentHistory.push({
                            type: 'out',
                            label: 'Outsource Removed',
                            detail: 'SYSTEM → VENDOR',
                            note: `Assignment cancelled`
                        });
                    }
                });

                // 2. Workflow stages from stage_history (Process Flow Accordion)
                (assignment.stage_history || []).forEach(stage => {
                    processFlow.push({
                        type: 'in', 
                        label: stage.stage_label,
                        detail: `OUTSOURCE STAGE — ${(stage.stage_idx || 0) + 1}/7`,
                        note: `Completed on ${stage.updated_at || 'N/A'}`
                    });
                });

                // 3. Batch receipts for parts returned (Aggregated ABOVE accordions for clean combined display)
                const actualReceipts = (assignment.batch_receipts || []).filter(r => r.type === 'actual');
                if (actualReceipts.length > 0) {
                    const totalQty = actualReceipts.reduce((sum, r) => sum + (r.qty || 0), 0);
                    partsReturnedLogs.push({
                        detail: `${assignment.vendor_name || 'VENDOR'} → WIP READY`,
                        note: `${totalQty} pcs received (${actualReceipts.length} ${actualReceipts.length === 1 ? 'batch' : 'batches'})`
                    });
                }

                // Construct unique key for card toggles
                const assignKey = `${job.sub_job_no || job.job_no}-${group._id || group.group_id}-${assignment.vendor_id}`;
                const isUv = job.process_name?.toUpperCase().includes('PRINTING') || job.process_name?.toUpperCase().includes('UV');

                outsourceJobs.push({
                    id: job.sub_job_no || job.job_no,
                    vendor: assignment.vendor_name || 'N/A',
                    progress: progressPct,
                    status: statusStr,
                    material: materialName,
                    size: sizeStr,
                    ups: isUv ? '20' : upsStr,
                    issued: isUv ? `${assignment.outsource_sheets || 0} pcs` : `${assignment.outsource_sheets || 0} sheets`,
                    reqd: `${assignment.outsource_qty || 0} pcs`,
                    back: `${recdBackQty} pcs`,
                    complete: progressPct === 100 || statusStr === 'Completed',
                    assignKey,
                    assignmentHistory,
                    processFlow,
                    partsReturnedLogs,
                    isUv
                });
            });
        });
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Godown Records...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Factory className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-[12px] font-[1000] text-indigo-800 uppercase tracking-tight italic">JOB WORK / OUTSOURCE — MATERIAL GODOWN</h3>
                </div>
            </div>

            <div className="space-y-6">
                {outsourceJobs.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">No job work or outsource records found</p>
                    </div>
                ) : (
                    outsourceJobs.map((job, i) => (
                        <div key={i} className={`bg-white rounded-3xl shadow-sm border-2 ${job.complete ? 'border-purple-600 shadow-purple-100' : 'border-purple-200'} overflow-hidden`}>
                            {/* Card Header */}
                            <div className={`p-5 px-8 ${job.complete ? 'bg-purple-600' : 'bg-white border-b border-slate-100'} flex items-center justify-between`}>
                                <div>
                                    <h4 className={`text-xl font-[1000] italic tracking-tight ${job.complete ? 'text-white' : 'text-slate-800'}`}>{job.id}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Factory className={`w-3.5 h-3.5 ${job.complete ? 'text-purple-200' : 'text-indigo-400'}`} />
                                        <span className={`text-[10px] font-[1000] uppercase tracking-tight ${job.complete ? 'text-purple-100' : 'text-indigo-600'}`}>{job.vendor} · {job.status}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`px-3 py-1.5 rounded-full ${job.complete ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'} text-[10px] font-black`}>
                                        {job.progress}%
                                    </div>
                                    {job.complete && (
                                        <div className="px-3 py-1.5 bg-white text-purple-600 text-[10px] font-black rounded-full flex items-center gap-2 shadow-sm">
                                            ✓ Complete
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Details Grid */}
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-3 gap-y-6 border-b border-slate-100 pb-8">
                                    {[
                                        { label: 'MATERIAL', value: job.material },
                                        { label: job.isUv ? 'PIECE SIZE' : 'SHEET SIZE', value: job.size },
                                        { label: job.isUv ? 'CYCLES' : 'UPS/SHEET', value: job.ups },
                                        { label: job.isUv ? 'PIECES ISSUED' : 'SHEETS ISSUED', value: job.issued },
                                        { label: 'OUTPUT REQD', value: job.reqd },
                                        { label: 'RECD BACK', value: job.back },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{stat.label}</span>
                                            <span className="text-[13px] font-[1000] text-slate-800 uppercase tracking-tight">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CRITICAL HIGHLIGHT CARDS (Material Issued & Finished Parts Returned - ALWAYS VISIBLE ABOVE ACCORDIONS) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                    {/* Left: Material Issued Card */}
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="mt-1 flex-shrink-0 text-amber-600">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-[1000] text-amber-800 uppercase tracking-tight">Material Issued</span>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                                MAIN STORES → {job.vendor}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">
                                                {job.issued} = {job.reqd}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Finished Parts Returned Cards List */}
                                    <div className="flex flex-col gap-3">
                                        {job.partsReturnedLogs.length === 0 ? (
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center h-full min-h-[70px]">
                                                <span className="text-[9px] font-black text-slate-400 uppercase italic">
                                                    No parts returned yet
                                                </span>
                                            </div>
                                        ) : (
                                            job.partsReturnedLogs.map((log, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="mt-1 flex-shrink-0 text-emerald-600">
                                                        <ArrowDownLeft className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-[1000] text-emerald-800 uppercase tracking-tight">{job.isUv ? 'Printed Parts Returned' : 'Cut Parts Returned'}</span>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                                            {log.detail}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">
                                                            {log.note}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Collapsible Audit Timeline & Stage History Accordions */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    {/* Accordion 1: Assignment History */}
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <button
                                            onClick={() => toggleSection(job.assignKey, 'assignmentHistory')}
                                            className="w-full px-6 py-4 bg-slate-50/50 hover:bg-slate-100/50 flex items-center justify-between transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] font-[1000] text-indigo-800 uppercase tracking-widest">Assignment Audit History</span>
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[8px] font-black text-indigo-600">
                                                    {job.assignmentHistory.length} logs
                                                </span>
                                            </div>
                                            {isSectionOpen(job.assignKey, 'assignmentHistory') ? (
                                                <ChevronDown className="w-4 h-4 text-indigo-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-indigo-400" />
                                            )}
                                        </button>
                                        
                                        {isSectionOpen(job.assignKey, 'assignmentHistory') && (
                                            <div className="p-5 space-y-3 bg-white border-t border-slate-50 transition-all duration-300">
                                                {job.assignmentHistory.length === 0 ? (
                                                    <span className="text-[9px] font-black text-slate-400 uppercase italic p-2 block">No assignment history logged yet</span>
                                                ) : (
                                                    job.assignmentHistory.map((f, idx) => (
                                                        <div key={idx} className={`p-4 rounded-2xl flex items-start justify-between ${f.type === 'out' ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                                                            <div className="flex gap-4">
                                                                <div className={`mt-1 flex items-center gap-2 ${f.type === 'out' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                    {f.type === 'out' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                                                                    <span className="text-[11px] font-[1000] uppercase tracking-tight">{f.label}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{f.detail}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">{f.note}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Accordion 2: Process Flow / Stage History */}
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <button
                                            onClick={() => toggleSection(job.assignKey, 'processFlow')}
                                            className="w-full px-6 py-4 bg-slate-50/50 hover:bg-slate-100/50 flex items-center justify-between transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] font-[1000] text-purple-800 uppercase tracking-widest">Process Flow & Stage History</span>
                                                <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-[8px] font-black text-purple-600">
                                                    {job.processFlow.length} stages
                                                </span>
                                            </div>
                                            {isSectionOpen(job.assignKey, 'processFlow') ? (
                                                <ChevronDown className="w-4 h-4 text-purple-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-purple-400" />
                                            )}
                                        </button>
                                        
                                        {isSectionOpen(job.assignKey, 'processFlow') && (
                                            <div className="p-5 space-y-3 bg-white border-t border-slate-50 transition-all duration-300">
                                                {job.processFlow.length === 0 ? (
                                                    <span className="text-[9px] font-black text-slate-400 uppercase italic block p-2">No process milestones or stages reached yet</span>
                                                ) : (
                                                    job.processFlow.map((f, idx) => (
                                                        <div key={idx} className={`p-4 rounded-2xl flex items-start justify-between ${f.type === 'out' ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                                                            <div className="flex gap-4">
                                                                <div className={`mt-1 flex items-center gap-2 ${f.type === 'out' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                    {f.type === 'out' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                                                                    <span className="text-[11px] font-[1000] uppercase tracking-tight">{f.label}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{f.detail}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">{f.note}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Outsource;
