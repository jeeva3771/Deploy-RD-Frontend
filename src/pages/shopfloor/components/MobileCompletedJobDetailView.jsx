import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    Package,
    Calendar,
    ShoppingCart,
    Clock,
    User,
    ArrowDownLeft,
    FileText,
    TrendingUp,
    Check
} from 'lucide-react';
import { axiosInstance } from '../../../utils/url/config';

const MobileCompletedJobDetailView = ({ job, onBack, onImageClick }) => {
    const [inHouseCycles, setInHouseCycles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!job) return;
        let active = true;

        const loadJobFlow = async () => {
            setLoading(true);
            try {
                const nonOutsourcedGroups = job.material_groups?.filter(mg =>
                    !mg.is_outsource || (mg.assigned_outsource_sheets < (mg.materials?.find(m => {
                        const cat = m.category_type?.toLowerCase() || '';
                        return !cat.includes('consumable') && !cat.includes('hardware');
                    })?.quantity || mg.sheets_required || 0))
                ) || [];

                let allCycles = [];
                await Promise.all(nonOutsourcedGroups.map(async (mg) => {
                    try {
                        const gid = mg.group_id || mg._id;
                        const res = await axiosInstance.get(`/shop-floor/process-flow/${job._id}/${gid}`);
                        if (res.data && res.data.success && res.data.flow) {
                            const ss = res.data.flow.session_state || {};
                            const pCycles = ss.primary_cycles || [];
                            const sCycles = ss.sample_cycles || [];
                            const rCycles = ss.recut_cycles || [];

                            sCycles.forEach(c => allCycles.push({ group: mg.group_name, cycle_number: `Sample ${c.cycle_number}`, good_qty: c.good_qty || 0, bad_qty: c.bad_qty || 0, by: c.started_by_name || 'Operator' }));
                            pCycles.forEach(c => allCycles.push({ group: mg.group_name, cycle_number: `Cycle ${c.cycle_number}`, good_qty: c.good_qty || 0, bad_qty: c.bad_qty || 0, by: c.started_by_name || 'Operator' }));
                            rCycles.forEach(c => allCycles.push({ group: mg.group_name, cycle_number: `Recut ${c.cycle_number}`, good_qty: c.good_qty || 0, bad_qty: c.bad_qty || 0, by: c.started_by_name || 'Operator' }));
                        }
                    } catch (e) {
                        console.error("Error fetching mobile process flow:", e);
                    }
                }));

                if (active) setInHouseCycles(allCycles);
            } catch (err) {
                console.error("Error loading job details:", err);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadJobFlow();
        return () => { active = false; };
    }, [job]);

    if (!job) return null;

    const mgList = job.material_groups || [];
    const mainMat = mgList[0]?.materials?.find(m => {
        const cat = m.category_type?.toLowerCase() || '';
        return !cat.includes('consumable') && !cat.includes('hardware');
    });

    const isUv = job.process_name?.toUpperCase().includes('PRINTING') || job.process_name?.toUpperCase().includes('UV');

    // Cost calculations
    let totalMaterialCost = 0;
    mgList.forEach(mg => {
        const inwardCost = mg.inward_history?.reduce((acc, log) => acc + (log.accepted_value || 0), 0) || 0;
        const assignments = mg.outsource_assignments || [];
        const outsourceCost = assignments.reduce((acc, assign) => acc + (assign.invoice_amt || (assign.outsource_qty * assign.outsource_rate) || 0), 0) || 0;
        totalMaterialCost += (inwardCost + outsourceCost);
    });
    totalMaterialCost = Math.round(totalMaterialCost);
    const costPerUnit = (totalMaterialCost / (job.total_qty || 1)).toFixed(2);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] select-none overflow-hidden">
            {/* Top Navigation Header */}
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs font-black text-white hover:text-emerald-400 active:scale-95 transition-all uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <span>Back to Completed List</span>
                </button>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40">
                    {job.job_no}/{job.sub_job_no}
                </span>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 touch-pan-y overscroll-contain">

                {/* Main Header Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 mb-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {(job.product_image || job.product_image_url || mainMat?.material_image) && (
                                <img
                                    src={job.product_image || job.product_image_url || mainMat?.material_image}
                                    alt={job.product_name || "product"}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 cursor-zoom-in"
                                    onClick={() => onImageClick && onImageClick(job.product_image || job.product_image_url || mainMat?.material_image)}
                                />
                            )}
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                                    {job.job_no}/{job.sub_job_no}
                                </h2>
                                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                                    {job.client_name}
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">PROCESS</span>
                            <span className="text-[10px] font-black text-slate-800 uppercase truncate block">{job.process_name || 'ASSEMBLY'}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">TARGET QTY</span>
                            <span className="text-[10px] font-black text-slate-800 uppercase block">{job.total_qty || 100} PCS</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">DELIVERY DATE</span>
                            <span className="text-[10px] font-black text-rose-600 uppercase block">{job.job_completion_date || '—'}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">DEPARTMENT</span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase block">{job.department || 'ASSEMBLY LABOUR'}</span>
                        </div>
                    </div>
                </div>

                {/* Material Cost Analysis Hero Card */}
                <div className="bg-[#0f172a] text-white rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden mb-4">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#e2e8f0' }}>MATERIAL COST ANALYSIS</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-800">
                        <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">TOTAL MATERIAL COST</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">₹{totalMaterialCost.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">COST PER UNIT</span>
                            <span className="text-2xl font-black text-sky-400 font-mono tracking-tight">₹{costPerUnit}</span>
                        </div>
                    </div>
                </div>

                {/* Material Groups Breakdown */}
                {mgList.map((mg, i) => {
                    const isOutsource = mg.is_outsource || (mg.assigned_outsource_sheets > 0);
                    return (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 mb-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">{mg.group_name}</h4>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                        {mainMat?.material_input?.size || 'STANDARD SIZE'}
                                    </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${isOutsource ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-teal-100 text-teal-700 border border-teal-200'}`}>
                                    {isOutsource ? 'OUTSOURCED' : 'IN-HOUSE'}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <span className="text-[7.5px] font-black text-slate-400 uppercase block">REQ SHEETS</span>
                                    <span className="text-[10px] font-black text-slate-800">{mg.sheets_required || 0} SH</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <span className="text-[7.5px] font-black text-slate-400 uppercase block">INWARDED</span>
                                    <span className="text-[10px] font-black text-teal-600">{(mg.inward_history || []).reduce((acc, l) => acc + (l.good_qty || 0), 0)} SH</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <span className="text-[7.5px] font-black text-slate-400 uppercase block">STATUS</span>
                                    <span className="text-[10px] font-black text-emerald-600">COMPLETED</span>
                                </div>
                            </div>

                            {/* Outsource Invoice Info */}
                            {isOutsource && (mg.outsource_assignments || []).map((assign, aIdx) => (
                                <div key={aIdx} className="bg-purple-50/50 rounded-xl p-3 border border-purple-100 space-y-1.5 text-[9.5px] font-bold">
                                    <div className="flex justify-between items-center text-purple-900">
                                        <span className="font-black uppercase">{assign.vendor_name || 'Vendor'}</span>
                                        <span className="font-black text-purple-700">₹{assign.invoice_amt || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-purple-600 text-[8.5px]">
                                        <span>Invoice No: {assign.invoice_no || '-'}</span>
                                        <span>Date: {assign.invoice_date || '-'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}

                {/* In-House Cycle History */}
                {inHouseCycles.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5 mb-4">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">PRODUCTION RUN LOGS ({inHouseCycles.length} CYCLES)</h4>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {inHouseCycles.map((c, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[9.5px]">
                                    <div>
                                        <span className="font-black text-slate-800 uppercase block">{c.cycle_number} ({c.group})</span>
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase">By {c.by}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-emerald-600 block">+{c.good_qty} Good</span>
                                        {c.bad_qty > 0 && <span className="text-[8px] font-black text-rose-500">-{c.bad_qty} Bad</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Spacer */}
                <div className="h-12 shrink-0" />
            </div>
        </div>
    );
};

export default MobileCompletedJobDetailView;
