import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Zap, Monitor, Clock, Moon, Package, CheckSquare, CheckCircle2, Sun, Factory, MessageSquare, Circle, ShoppingCart, AlertTriangle, Flag, CheckCircle, User as UserIcon, Play } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { updateShopFloorJobStatus, clearShopFloorFlags, escalateShopFloorJob, deEscalateShopFloorJob } from '../../../reducer/shopFloorReducer';
import { toast } from 'react-toastify';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
import { getOutsourceVendorNameList } from '../../../reducer/outsourceVendorReducer';

const isShiftActive = (shiftsArr, shift) => Array.isArray(shiftsArr) ? shiftsArr.includes(shift) : shiftsArr === shift;


const AssemblyJobDetail = ({ job, onClose, refreshData, onImageClick, machines = [] }) => {
    console.log("job", job)
    const dispatch = useDispatch();
    const [warningModal, setWarningModal] = useState({ show: false, message: "" });
    const [escalateModal, setEscalateModal] = useState(false);
    const [deEscalateModal, setDeEscalateModal] = useState(false);

    const handleClearFlag = async (type) => {
        try {
            await dispatch(clearShopFloorFlags({ id: job._id, type })).unwrap();
            refreshData();
        } catch (error) {
            toast.error("Failed to clear notification");
        }
    };

    if (!job) return null;

    const theme = job.theme || { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-600', pill: 'bg-slate-100', bar: 'bg-cyan-500' };
    const accentBg = theme.bar || 'bg-cyan-500';

    const handleUpdateStatus = async (status, assigned_shift = null, remark = "", extra = {}) => {
        try {
            const response = await dispatch(updateShopFloorJobStatus({
                id: job._id,
                payload: {
                    status: status || job.status,
                    assigned_shift,
                    remark,
                    ...extra
                }
            })).unwrap();

            if (response.success) {
                toast.success(`Job updated successfully`);
                refreshData();
            }
        } catch (error) {
            console.error("Error updating job:", error);
            toast.error("Failed to update job");
        }
    };

    const handleUpdateGroupShift = async (groupId, shift, remark = "", extra = {}) => {
        try {
            const response = await dispatch(updateShopFloorJobStatus({
                id: job._id,
                payload: {
                    material_group_id: groupId,
                    group_shift: shift,
                    remark,
                    ...extra
                } 
            })).unwrap();

            if (response.success) {
                const message = extra.is_outsource
                    ? (extra.outsource_details?.is_remove ? `Outsource removed successfully` : `Outsource assigned successfully`)
                    : `Group assigned successfully`;
                toast.success(message);
                refreshData();
            }
        } catch (error) {
            console.error("Error updating group shift:", error);
            toast.error("Failed to update group shift");
        }
    };

    const handleEscalate = async () => {
        try {
            const response = await dispatch(escalateShopFloorJob({
                id: job._id
            })).unwrap();

            if (response.success) {
                toast.success("Job escalated to management");
                setEscalateModal(false);
                refreshData();
            }
        } catch (error) {
            console.error("Error escalating job:", error);
            toast.error("Failed to escalate job");
        }
    };

    const handleDeEscalate = async () => {
        try {
            const response = await dispatch(deEscalateShopFloorJob({
                id: job._id
            })).unwrap();

            if (response.success) {
                toast.success("Job de-escalated successfully");
                setDeEscalateModal(false);
                refreshData();
            }
        } catch (error) {
            console.error("Error de-escalating job:", error);
            toast.error("Failed to de-escalate job");
        }
    };



    const handleUpdateGroupProgress = async (groupId, progress) => {
        try {
            const response = await dispatch(updateShopFloorJobStatus({
                id: job._id,
                payload: {
                    material_group_id: groupId,
                    group_progress: progress
                }
            })).unwrap();

            if (response.success) {
                toast.success("Group progress updated");
                refreshData();
            }
        } catch (error) {
            console.error("Error updating group progress:", error);
            toast.error("Failed to update group progress");
        }
    };

    return (
        <div className={`fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-[1040] flex flex-col animate-in slide-in-from-right duration-300 ${job.is_hold ? 'border-l-4 border-amber-500' : ''}`}>
            {job.is_hold && (
                <div className="absolute inset-x-0 top-0 h-1 bg-amber-500 animate-pulse z-[1050]" />
            )}
            {/* Panel Header */}
            <div className={`p-6 border-b border-gray-100 transition-colors duration-500 ${theme.bg}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                        <div
                            onClick={() => onImageClick?.(job.product_image)}
                            className="w-20 h-20 rounded-2xl bg-white border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm cursor-pointer relative group/img"
                        >
                            {job.product_image ? (
                                <img src={job.product_image} alt={job.product_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-200" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">PREVIEW</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-[#0f172a] italic tracking-tighter leading-none">{job.job_no}/{job.sub_job_no}</h2>
                                <div className="flex gap-1.5">
                                    {job.job_type === 'sample' ? (
                                        <span className="text-[8px] font-black py-1 px-2 bg-amber-500 text-white italic rounded-md shadow-sm">Sample</span>
                                    ) : (
                                        <span className="text-[8px] font-black py-1 px-2 bg-indigo-500 text-white italic rounded-md shadow-sm">Production</span>
                                    )}
                                    {job.is_reprocess && (
                                        <span className="text-[8px] font-black py-1 px-2 bg-red-600 text-white italic uppercase rounded-md shadow-sm">Reprocess</span>
                                    )}
                                    {/* {job.sample_required && (
                    <span className="text-[8px] font-black py-1 px-2 bg-rose-600 text-white italic uppercase rounded-md shadow-sm animate-pulse">SAMPLE REQ.</span>
                  )} */}
                                </div>
                            </div>
                            {job.reference_no && (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">REF: {job.reference_no}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <p className={`text-[10px] font-[1000] ${theme.text} uppercase tracking-widest`}>{job.client_name}</p>
                                <DeliveryPriorityColor
                                    deliveryDate={job.job_completion_date}
                                    showPriorityName={true}
                                    badgeClassName="!text-[8px] !font-black !py-0.5 !px-2 italic uppercase"
                                />
                                <span className="text-[8px] font-black uppercase italic tracking-tight bg-blue-100 text-blue-600 py-1 px-2 rounded-md shadow-sm">{job.status}</span>

                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <h3 className="text-sm font-black text-[#1e293b] uppercase">{job.product_name}</h3>
                                {job.is_hold && (
                                    <span className="text-[11px] font-black uppercase italic tracking-tight bg-amber-100 text-amber-600 py-1 px-2 rounded-md shadow-sm flex items-center gap-1 animate-pulse w-fit">
                                        <Clock className="w-3 h-3" />
                                        ON HOLD
                                    </span>
                                )}
                            </div>

                            {/* {job.is_hold && job.hold_remarks && (
                                <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Hold Reason:</p>
                                    <p className="text-[11px] font-medium text-amber-700 italic">"{job.hold_remarks}"</p>
                                </div>
                            )} */}

                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {job.is_escalated ? (
                            <button
                                onClick={() => setDeEscalateModal(true)}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all group"
                            // disabled={job?.is_hold}
                            >
                                <CheckCircle className="w-3 h-3 fill-emerald-600 group-hover:scale-110 transition-transform" />
                                DE-ESCALATE
                            </button>
                        ) : (
                            <button
                                onClick={() => setEscalateModal(true)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all group ${job?.is_hold ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : ""}`}
                                disabled={job?.is_hold}
                            >
                                <Flag className="w-3 h-3 fill-rose-600 group-hover:scale-110 transition-transform" />
                                ESCALATE
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-black/5 transition-colors text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {job.is_escalated && (
                    <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 animate-pulse-red">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                                </div>
                                <div>
                                    <h6 className="text-[11px] font-black text-rose-900 uppercase italic tracking-tight leading-none">Job Escalated</h6>
                                    {(() => {
                                        const lastEsc = [...(job.escalation_hold_history || [])].reverse().find(h => h.type === 'Escalated');
                                        if (lastEsc) {
                                            return (
                                                <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-1">
                                                    By {lastEsc.by?.name || "Admin"} · {lastEsc.at}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                            <button
                                onClick={() => setDeEscalateModal(true)}
                                className="px-4 py-2 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-500 transition-all"
                            >
                                DE-ESCALATE
                            </button>
                        </div>
                    </div>
                )}

                {/* {job.is_hold && (
                    <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 animate-pulse-amber">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <h6 className="text-[11px] font-black text-amber-900 uppercase italic tracking-tight leading-none">Job On Hold</h6>
                                    {(() => {
                                        const lastHold = [...(job.escalation_hold_history || [])].reverse().find(h => h.type === 'Hold');
                                        if (lastHold) {
                                            return (
                                                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mt-1">
                                                    By {lastHold.by?.name || "Admin"} · {lastHold.at}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                            <div className="px-4 py-2 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-100">
                                PAUSED
                            </div>
                        </div>
                        {job.hold_remarks && (
                            <p className="mt-3 text-[10px] font-bold text-amber-800 italic leading-snug">
                                "{job.hold_remarks}"
                            </p>
                        )}
                    </div>
                )} */}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-white/60 rounded-xl p-3 border border-black/5 flex flex-col items-center">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL QTY</span>
                        <span className="text-[11px] font-black text-slate-700 leading-none">{job.total_qty || 0}</span>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 border border-black/5 flex flex-col items-center">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">FINISH BY</span>
                        <span className="text-[11px] font-black text-slate-700 leading-none">{job.job_completion_date || '-'}</span>
                    </div>
                </div>



                {/* Progress Bars */}
                <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className={`w-4 h-4 ${theme.text} fill-current`} />
                            <span className={`text-[9px] font-black ${theme.text} uppercase tracking-widest`}>{job.process_name}</span>
                        </div>
                        <div className={`text-[9px] font-black ${theme.text} uppercase ${theme.pill} px-2 py-0.5 rounded-full border ${theme.border}`}>
                            OVERALL: {job.progress || 0}%
                        </div>
                    </div>
                    <div className="space-y-4">
                        {Object.values(job.material_groups?.reduce((acc, mg) => {
                            const key = mg.group_id || mg.group_name;
                            if (!acc[key]) acc[key] = { ...mg, totalProg: 0, count: 0 };
                            acc[key].totalProg += (mg.progress || 0);
                            acc[key].count += 1;
                            return acc;
                        }, {}) || {}).map((mg, idx) => {
                            const displayProgress = Math.round(mg.totalProg / mg.count);
                            return (
                                <div key={idx} className="group/prog">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight">{mg.group_name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-gray-400">{displayProgress}%</span>
                                            {displayProgress < 100 ? (
                                                <button
                                                    onClick={() => !job.is_hold && handleUpdateGroupProgress(mg.group_id, 100)}
                                                    disabled={job.is_hold}
                                                    className={`p-1 rounded-md hover:bg-green-50 transition-all ${job.is_hold ? 'text-gray-200 cursor-not-allowed' : 'text-gray-300 hover:text-green-500'}`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-2 bg-black/5 rounded-full overflow-hidden border border-black/5 shadow-inner relative">
                                        <div
                                            className={`h-full transition-all duration-700 ease-out ${displayProgress === 100 ? 'bg-green-500' : accentBg}`}
                                            style={{ width: `${displayProgress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f8fafc]/50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                {(job.is_qty_changed || job.is_date_changed) && (
                    <div className="mb-6 space-y-3">
                        {job.is_qty_changed && (
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50 border border-purple-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Package className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <h6 className="text-[11px] font-black text-purple-900 uppercase italic tracking-tight leading-none">Quantity Changed</h6>
                                        <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mt-1">New Total Qty: {job.total_qty}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleClearFlag('qty')}
                                    disabled={job.is_hold}
                                    className={`px-4 py-1.5 rounded-full bg-[#9333ea] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-[#7e22ce] transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    ACKNOWLEDGE
                                </button>
                            </div>
                        )}
                        {job.is_date_changed && (
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <h6 className="text-[11px] font-black text-amber-900 uppercase italic tracking-tight leading-none">Delivery Date Preponed</h6>
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mt-1">New Date: {job.job_completion_date}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleClearFlag('date')}
                                    disabled={job.is_hold}
                                    className={`px-4 py-1.5 rounded-full bg-[#d97706] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-[#b45309] transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    ACKNOWLEDGE
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Team Allocations (Moved to scrollable area above Line Items) */}
                {job.team_allocations && job.team_allocations.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-slate-600" />
                                </div>
                                <h6 className="text-[11px] font-black text-slate-700 uppercase italic tracking-tight leading-none">Team Allocations</h6>
                            </div>
                            {job.team_allocations.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[8px] font-black uppercase tracking-widest border border-cyan-200">Split Job</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {job.team_allocations.map((alloc, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col items-center relative overflow-hidden group">
                                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1 z-10">{alloc.team_name}</span>
                                    <div className="flex items-end gap-1 z-10">
                                        <span className="text-xl font-black text-slate-800 leading-none">{alloc.allocated_qty}</span>
                                        <span className="text-[9px] font-bold text-slate-400 mb-0.5">Pcs</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden z-10">
                                        <div 
                                            className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, (alloc.completed_qty / (alloc.allocated_qty || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 z-10">
                                        {alloc.completed_qty} Completed
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-[12px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">Line Items</h4>
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                    </div>

                    <div className="space-y-4">
                        {(() => {
                            const grouped = job.material_groups?.reduce((acc, mg) => {
                                const key = mg.group_id || mg.group_name || mg._id;
                                if (!acc[key]) {
                                    acc[key] = {
                                        ...mg,
                                        total_process_qty: 0,
                                        outsource_qty: 0,
                                        inhouse_qty: 0,
                                        process_qty: 0,
                                        assigned_outsource_sheets: 0,
                                        assigned_outsource_ups: 0,
                                        outsource_assignments: [],
                                        assigned_shifts: [],
                                        instanceIds: []
                                    };
                                }

                                // Sum Quantities
                                acc[key].total_process_qty += (mg.total_process_qty || mg.process_qty || 0);
                                acc[key].outsource_qty += (mg.outsource_qty || 0);
                                acc[key].inhouse_qty += (mg.inhouse_qty || 0);
                                acc[key].process_qty += (mg.process_qty || 0);
                                acc[key].assigned_outsource_sheets += (mg.assigned_outsource_sheets || 0);
                                acc[key].assigned_outsource_ups += (mg.assigned_outsource_ups || 0);

                                // Merge Arrays
                                if (mg.outsource_assignments?.length > 0) {
                                    acc[key].outsource_assignments = [...acc[key].outsource_assignments, ...mg.outsource_assignments];
                                }
                                if (mg.assigned_shifts?.length > 0) {
                                    acc[key].assigned_shifts = [...new Set([...acc[key].assigned_shifts, ...mg.assigned_shifts])];
                                }
                                acc[key].instanceIds.push(mg._id);

                                // Keep newest vendor info if present
                                if (mg.vendor_name) {
                                    acc[key].vendor_id = mg.vendor_id;
                                    acc[key].vendor_name = mg.vendor_name;
                                    acc[key].outsource_rate = mg.outsource_rate;
                                    acc[key].outsource_delivery_date = mg.outsource_delivery_date;
                                }

                                return acc;
                            }, {});

                            return Object.values(grouped || {}).map((mg, idx) => {
                                const groupKey = mg._id || mg.group_id;
                                const hasPrintableMaterial = mg.materials?.some(m => {
                                    const cat = m.category_type?.toLowerCase() || "";
                                    return !cat.includes('consumable') && !cat.includes('hardware');
                                });

                                if (!hasPrintableMaterial) return null;

                                const totalMaterialSheets = mg.materials?.find(m => {
                                    const cat = m.category_type?.toLowerCase() || '';
                                    return !cat.includes('consumable') && !cat.includes('hardware');
                                })?.quantity || 0;

                                const upsPerSheet = mg.materials?.find(m => {
                                    const cat = m.category_type?.toLowerCase() || '';
                                    return !cat.includes('consumable') && !cat.includes('hardware');
                                })?.material_input?.ups || 1;

                                const assignedSheets = mg.assigned_outsource_sheets || 0;

                                const primaryShift = mg.items?.[0]?.assigned_shift || mg.assigned_shift;

                                return (
                                    <div key={idx} className={`bg-white rounded-3xl border ${mg.progress === 100 ? 'border-green-200 bg-green-50/20' : 'border-gray-200'} p-6 shadow-sm transition-all hover:shadow-md`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex flex-col gap-1.5">
                                                    <h5 className="text-base font-[1000] text-[#0f172a] uppercase tracking-tight leading-none">{mg.group_name}</h5>
                                                    {(() => {
                                                        const m = mg.materials?.find(m => {
                                                            const cat = m.category_type?.toLowerCase() || "";
                                                            return !cat.includes('consumable') && !cat.includes('hardware');
                                                        });
                                                        if (!m) return null;

                                                        let totalSqInch = 0;
                                                        if (m.material_type === "sheet" && m.material_input?.size) {
                                                            const dims = m.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                                                            if (dims.length >= 2) totalSqInch = dims[0] * dims[1] * (m.quantity || 1);
                                                        }
                                                        const formatSqInch = (val) => val > 1000 ? (val / 1000).toFixed(1) + 'k' : Math.round(val);

                                                        return (
                                                            <div className="mt-1">
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-4">
                                                                    {m.material_input?.one_up_length && m.material_input?.one_up_width
                                                                        ? `${m.material_input.one_up_length}x${m.material_input.one_up_width}in`
                                                                        : m.material_input?.size || ''}
                                                                    {' '}· {(parseFloat(m.quantity) || 0) * (parseFloat(m.material_input?.ups) || 0)} units
                                                                    {' '}· {totalSqInch ? `${formatSqInch(totalSqInch)} sq.in` : ''}
                                                                </p>



                                                                <div className="w-full p-5 rounded-[24px] bg-[#f0fdfa] border border-[#2dd4bf] mb-4 shadow-sm">
                                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                                                        <div className="space-y-1">
                                                                            <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">SHEET SIZE</span>
                                                                            <span className="block text-[13px] font-black text-slate-800 leading-none">{m.material_input?.size || '-'}</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">UPS / SHEET</span>
                                                                            <span className="block text-[13px] font-black text-slate-800 leading-none">{m.material_input?.ups || '-'} pcs</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">TOTAL OUTPUT</span>
                                                                            <span className="block text-[13px] font-black text-slate-800 leading-none">{(parseFloat(m.quantity) || 0) * (parseFloat(m.material_input?.ups) || 0)} pcs</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">SHEETS REQD</span>
                                                                            <span className="block text-[13px] font-black text-slate-800 leading-none">{m.quantity || 0} sheets</span>
                                                                          </div>
                                                                        {/* <div className="space-y-1">
                                      <span className="block text-[8px] font-black text-[#0d9488] uppercase tracking-widest leading-none">EST HEADS</span>
                                      <span className="block text-[11px] font-black text-slate-800 leading-none">{m.material_input?.estimated_heads || '1'} head</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[8px] font-black text-[#0d9488] uppercase tracking-widest leading-none">EST MACHINES</span>
                                      <span className="block text-[11px] font-black text-slate-800 leading-none">{m.material_input?.estimated_machines || '1'} machine</span>
                                    </div> */}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* BOM Plan: Outsource / Inhouse split — derived from aggregated row data */}
                                                    {(() => {
                                                        const bomOut = mg.outsource_qty || 0;
                                                        const bomIn = mg.inhouse_qty || 0;
                                                        const total = bomOut + bomIn;
                                                        if (total === 0) return null;

                                                        const isFullOut = bomOut > 0 && bomIn === 0;
                                                        const isPartial = bomOut > 0 && bomIn > 0;
                                                        const outPct = total > 0 ? Math.round((bomOut / total) * 100) : 0;

                                                        return (
                                                            <div className="mb-4">
                                                                {isFullOut && (
                                                                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                                                                        <div className="w-7 h-7 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                                                            <Factory className="w-3.5 h-3.5 text-rose-500" />
                                                                        </div>
                                                                        <div>
                                                                            <span className="block text-[7px] font-black text-rose-300 uppercase tracking-[0.15em] leading-none mb-0.5">BOM PLAN</span>
                                                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Fully Outsource — {bomOut} units</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {isPartial && (
                                                                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 overflow-hidden">
                                                                        {/* Header */}
                                                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-100/60 border-b border-slate-200">
                                                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.15em]">BOM PLAN</span>
                                                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{total} TOTAL PCS</span>
                                                                        </div>
                                                                        {/* Split Bar */}
                                                                        {/* <div className="px-3 pt-2.5 pb-1">
                                      <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
                                        <div
                                          className="h-full rounded-full bg-rose-400 transition-all duration-700"
                                          style={{ width: `${outPct}%` }}
                                        />
                                        <div className="h-full rounded-full flex-1 bg-blue-300" />
                                      </div>
                                    </div> */}
                                                                        {/* Pills */}
                                                                        <div className="flex gap-2 px-3 pb-3 pt-1.5">
                                                                            <div className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-rose-50 border border-rose-100">
                                                                                <div className="w-5 h-5 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                                                                                    <Factory className="w-3 h-3 text-rose-500" />
                                                                                </div>
                                                                                <div>
                                                                                    <span className="block text-[7px] font-black text-rose-300 uppercase tracking-widest leading-none">OUTSOURCE</span>
                                                                                    <span className="text-[12px] font-black text-rose-600 leading-tight">{bomOut} <span className="text-[8px] font-bold">pcs</span></span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-blue-50 border border-blue-100">
                                                                                <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                                                    <Monitor className="w-3 h-3 text-blue-500" />
                                                                                </div>
                                                                                <div>
                                                                                    <span className="block text-[7px] font-black text-blue-300 uppercase tracking-widest leading-none">IN-HOUSE</span>
                                                                                    <span className="text-[12px] font-black text-blue-600 leading-tight">{bomIn} <span className="text-[8px] font-bold">pcs</span></span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}

                                                    {mg.status === 'Pending' && (
                                                        <div className="mb-4">
                                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-400 border border-purple-100 text-[9px] font-black uppercase tracking-widest italic">
                                                                <div className="w-2.5 h-2.5 rounded bg-purple-200" />
                                                                MATERIAL PENDING
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {mg.progress === 100 && (
                                                <span className="text-[8px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest italic">DONE</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-6">
                                            {mg.assigned_shifts && mg.assigned_shifts.length > 0 ? (
                                                mg.assigned_shifts.map((teamName, index) => {
                                                    const activeClass = ["bg-blue-600 border-blue-600", "bg-emerald-500 border-emerald-500", "bg-violet-600 border-violet-600", "bg-amber-500 border-amber-500"][index % 4];
                                                    return (
                                                        <div
                                                            key={teamName}
                                                            className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-full border text-[10px] font-black text-white shadow-sm ${activeClass}`}
                                                        >
                                                            <Monitor className="w-3 h-3 text-white" />
                                                            {String(teamName).toUpperCase()}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-400 italic">No team assigned</span>
                                            )}
                                        </div>


                                    </div>
                                );
                            });
                        })()}
                    </div>
                </section>
                {/* Escalation & Hold History Section */}
                <section className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2.5 mb-4">
                        <h4 className="text-[12px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">
                            Escalation & Hold History
                        </h4>
                        <div className="h-px flex-1 bg-gray-100" />
                    </div>

                    {job.escalation_hold_history && job.escalation_hold_history.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {job.escalation_hold_history.slice().reverse().map((hist, hIdx) => (
                                <div
                                    key={hIdx}
                                    className={`flex flex-col gap-2 px-3 py-2.5 rounded-[10px] border transition-all
                                            ${hist.type === 'Escalated'
                                            ? 'bg-red-50 border-red-200'
                                            : hist.type === 'Hold'
                                                ? 'bg-amber-50 border-amber-200'
                                                : hist.type === 'Resume'
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-green-50 border-green-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0
                                                    ${hist.type === 'Escalated'
                                                    ? 'bg-red-200 text-red-700'
                                                    : hist.type === 'Hold'
                                                        ? 'bg-amber-200 text-amber-700'
                                                        : hist.type === 'Resume'
                                                            ? 'bg-blue-200 text-blue-700'
                                                            : 'bg-green-200 text-green-700'
                                                }`}
                                            >
                                                {hist.type === 'Escalated' ? <Flag className="w-3.5 h-3.5" /> :
                                                    hist.type === 'Hold' ? <Clock className="w-3.5 h-3.5" /> :
                                                        hist.type === 'Resume' ? <Zap className="w-3.5 h-3.5" /> :
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                }
                                            </div>
                                            <div>
                                                <p className={`text-[11px] font-black uppercase tracking-wide leading-none
                                                        ${hist.type === 'Escalated' ? 'text-red-800' :
                                                        hist.type === 'Hold' ? 'text-amber-800' :
                                                            hist.type === 'Resume' ? 'text-blue-800' :
                                                                'text-green-800'}`}>
                                                    {hist.type}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{hist.at}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-2.5 py-1 shrink-0">
                                            <UserIcon className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                                {hist.by?.name || 'Admin'}
                                            </span>
                                        </div>
                                    </div>

                                    {hist.remarks && (
                                        <div className="pl-9 pr-2">
                                            <p className={`text-[11px] font-bold italic leading-tight
                                                    ${hist.type === 'Escalated' ? 'text-red-600' :
                                                    hist.type === 'Hold' ? 'text-amber-600' :
                                                        hist.type === 'Resume' ? 'text-blue-600' :
                                                            'text-green-600'}`}>
                                                "{hist.remarks}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-gray-50 border border-dashed border-gray-100">
                            <Clock className="w-8 h-8 text-gray-200 mb-2" />
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest italic">
                                No Escalation & Hold Logs
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <div className="p-4 bg-[#0a101f] text-white flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-40 mb-1">TOTAL AREA</span>
                    <span className="text-sm font-black italic tracking-tighter uppercase text-cyan-400">
                        {(() => {
                            let total = 0;
                            job.material_groups?.forEach(mg => {
                                mg.materials?.forEach(m => {
                                    const isConsumable = m.category_type?.toLowerCase() === "consumable" || m.category_type?.toLowerCase() === "hardware";
                                    if (!isConsumable && m.material_type === "sheet" && m.material_input?.size) {
                                        const dims = m.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                                        if (dims.length >= 2) {
                                            total += dims[0] * dims[1] * (m.quantity || 1);
                                        }
                                    }
                                });
                            });
                            return total > 1000 ? (total / 1000).toFixed(1) + 'k' : Math.round(total);
                        })()} <span className="text-[10px] not-italic opacity-60 ml-0.5">SQ.IN</span>
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-40 mb-1 text-right">STATUS</span>
                    <span className="text-sm font-black italic tracking-tighter uppercase">{job.status}</span>
                </div>
            </div>

            {/* Warning Alert Modal (DTP Style) */}
            <ConfirmationModal
                isOpen={warningModal.show}
                onClose={() => setWarningModal({ show: false, message: "" })}
                onConfirm={() => setWarningModal({ show: false, message: "" })}
                title="Action Required"
                message={warningModal.message}
                confirmText="Got it"
                confirmColor="bg-purple-600 hover:bg-purple-700"
            />

            {/* Escalation Modal */}
            <ConfirmationModal
                isOpen={escalateModal}
                onClose={() => setEscalateModal(false)}
                onConfirm={handleEscalate}
                title={`Escalate Job - ${job.sub_job_no}`}
                message="Are you sure you want to escalate this job for management attention?"
                confirmText="ESCALATE"
                confirmColor="bg-rose-600 shadow-rose-100"
            />

            {/* De-Escalation Modal */}
            <ConfirmationModal
                isOpen={deEscalateModal}
                onClose={() => setDeEscalateModal(false)}
                onConfirm={handleDeEscalate}
                title={`De-Escalate Job - ${job.sub_job_no}`}
                message="Are you sure you want to de-escalate this job?"
                confirmText="DE-ESCALATE"
                confirmColor="bg-emerald-600 shadow-emerald-100"
            />
        </div>
    );
};

export default AssemblyJobDetail;
