import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, ShoppingCart, Factory, Calendar, Clock, CheckCircle2, ChevronRight, Package, Printer, Monitor, Scissors, User, Plus, History, ChevronDown, AlertTriangle } from 'lucide-react';
import { updateShopFloorJobStatus, fetchShopFloorJobs } from '../../../reducer/shopFloorReducer';
import { toast } from 'react-toastify';

const OutsourceManager = ({ isOpen, onClose, jobs = [] }) => {
    const dispatch = useDispatch();
    const getCurrentDateTime = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        const time = d.toTimeString().slice(0, 5);
        return { date, time };
    };

    const formatDateForBackend = (dateStr) => {
        if (!dateStr || !dateStr.includes('-')) return dateStr;
        const parts = dateStr.split('-');
        if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateStr;
    };

    const formatTimeForBackend = (timeStr) => {
        if (!timeStr || !timeStr.includes(':')) return timeStr;
        let [h, m] = timeStr.split(':');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    };

    const [batchInputs, setBatchInputs] = useState(() => {
        const { date, time } = getCurrentDateTime();
        return { qty: '', date, time, type: 'actual' };
    });

    const [invoiceInputs, setInvoiceInputs] = useState(() => {
        const { date } = getCurrentDateTime();
        return { no: '', date, amt: '' };
    });

    const [showHistory, setShowHistory] = useState(null); // { id: string, type: 'stage' | 'batch' }

    if (!isOpen) return null;

    // Flatten all outsource assignments from all jobs
    const allAssignments = [];
    jobs.forEach(job => {
        (job.material_groups || []).forEach(mg => {
            const assignments = mg.outsource_assignments?.length > 0
                ? mg.outsource_assignments
                : (mg.vendor_name && mg.assigned_outsource_sheets > 0 ? [{
                    vendor_name: mg.vendor_name,
                    outsource_sheets: mg.assigned_outsource_sheets,
                    outsource_qty: mg.assigned_outsource_ups,
                    outsource_rate: mg.outsource_rate,
                    outsource_delivery_date: mg.outsource_delivery_date,
                    vendor_id: mg.vendor_id,
                    current_stage_idx: 0,
                    status: mg.status || 'Pending'
                }] : []);

            assignments.forEach((assign, idx) => {
                const uniqueKey = `${job._id}-${mg._id || mg.group_id}-${idx}`;
                allAssignments.push({
                    ...assign,
                    job_no: job.job_no,
                    sub_job_no: job.sub_job_no,
                    client_name: job.client_name,
                    process_name: job.process_name,
                    group_name: mg.group_name,
                    materials: mg.materials,
                    job_id: job._id,
                    mg_id: mg._id || mg.group_id,
                    assign_idx: idx,
                    uniqueKey,
                    is_hold: job.is_hold,
                    hold_remarks: job.hold_remarks,
                    mg_input: mg.input,
                    mg_sides: mg.sides
                });
            });
        });
    });

    const timelineSteps = [
        { label: 'Material Delivered', key: 'material_delivered', btn: 'MARK: PROOF APPROVED' },
        { label: 'Proof Approved', key: 'proof_approved', btn: 'MARK: JOB INITIATED' },
        { label: 'Job Initiated', key: 'job_initiated', btn: 'MARK: QTY RECD (BATCH 1)' },
        { label: 'Qty Recd (Batch 1)', key: 'qty_recd_1', btn: 'MARK: QTY RECD (BATCH 2)' },
        { label: 'Qty Recd (Batch 2)', key: 'qty_recd_2', btn: 'MARK: JOB CLOSURE' },
        { label: 'Job Closure', key: 'job_closure', btn: 'MARK: INVOICE APPROVED' },
        { label: 'Invoice Approved', key: 'invoice_approved', btn: 'COMPLETED' }
    ];

    const handleNextStage = async (assign) => {
        if (assign.is_hold) {
            toast.error("Cannot transition stage: Job is currently on hold.");
            return;
        }
        const nextIdx = (assign.current_stage_idx || 0) + 1;
        if (nextIdx >= timelineSteps.length) return;

        // Validation: Job Closure only allowed if received quantity is at least 50% of ordered quantity
        if (nextIdx === 5) {
            const orderedQty = assign.outsource_qty || 0;
            const recdQty = assign.batch_receipts?.filter(b => b.type === 'actual').reduce((sum, b) => sum + (b.qty || 0), 0) || 0;
            if (recdQty < (orderedQty * 0.5)) {
                toast.error(`Job closure not allowed. Received quantity (${recdQty.toLocaleString()}) must be at least 50% of ordered quantity (${orderedQty.toLocaleString()}).`);
                return;
            }
        }

        // Validation for invoice details if moving from Job Closure to Invoice Approved
        if (assign.current_stage_idx === 5) {
            if (!invoiceInputs.no || !invoiceInputs.date || !invoiceInputs.amt) {
                toast.warning("Please fill all invoice details");
                return;
            }
        }

        const payload = {
            material_group_id: assign.mg_id,
            is_outsource: true,
            outsource_details: {
                assignment_index: assign.assign_idx,
                stage_update: {
                    stage_idx: nextIdx,
                    stage_label: timelineSteps[nextIdx].label,
                    // Include invoice data if in closure stage
                    ...(assign.current_stage_idx === 5 ? {
                        invoice_no: invoiceInputs.no,
                        invoice_date: formatDateForBackend(invoiceInputs.date),
                        invoice_amt: invoiceInputs.amt
                    } : {})
                }
            }
        };

        try {
            await dispatch(updateShopFloorJobStatus({ id: assign.job_id, payload })).unwrap();
            toast.success(`Stage updated to ${timelineSteps[nextIdx].label}`);

            // Reset invoice inputs if they were just submitted
            if (assign.current_stage_idx === 5) {
                const { date } = getCurrentDateTime();
                setInvoiceInputs({ no: '', date, amt: '' });
            }

            dispatch(fetchShopFloorJobs());
        } catch (err) {
            toast.error(err?.message || "Failed to update stage");
        }
    };

    const handleAddBatch = async (assign) => {
        if (assign.is_hold) {
            toast.error("Cannot add batch receipt: Job is currently on hold.");
            return;
        }
        if (!batchInputs.qty || !batchInputs.date || !batchInputs.time) {
            toast.warning("Please fill all batch details");
            return;
        }

        const inputQty = Number(batchInputs.qty);
        const currentRecd = assign.batch_receipts?.filter(b => b.type === 'actual').reduce((sum, b) => sum + (b.qty || 0), 0) || 0;
        const totalOrdered = assign.outsource_qty || 0;

        if (batchInputs.type === 'actual' && (currentRecd + inputQty) > totalOrdered) {
            toast.error(`Cannot exceed ordered quantity. Remaining balance: ${(totalOrdered - currentRecd).toLocaleString()} pcs`);
            return;
        }

        if (inputQty > totalOrdered) {
            toast.error(`Batch quantity cannot exceed total ordered (${totalOrdered.toLocaleString()} pcs)`);
            return;
        }

        const { date: today, time: now } = getCurrentDateTime();
        if (batchInputs.date < today) {
            toast.error("Cannot select a past date");
            return;
        }
        if (batchInputs.date === today && batchInputs.time < now) {
            toast.error("Cannot select a past time for today");
            return;
        }

        const payload = {
            material_group_id: assign.mg_id,
            is_outsource: true,
            outsource_details: {
                assignment_index: assign.assign_idx,
                batch_add: {
                    type: batchInputs.type,
                    qty: batchInputs.qty,
                    date: formatDateForBackend(batchInputs.date),
                    time: formatTimeForBackend(batchInputs.time)
                }
            }
        };

        try {
            await dispatch(updateShopFloorJobStatus({ id: assign.job_id, payload })).unwrap();
            toast.success("Batch added successfully");
            const { date, time } = getCurrentDateTime();
            setBatchInputs({ qty: '', date, time, type: 'actual' });
            dispatch(fetchShopFloorJobs());
        } catch (err) {
            toast.error(err?.message || "Failed to add batch");
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[650px] max-w-full bg-[#f8fafc] shadow-2xl z-[100] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-1.5 bg-[#1e293b] text-white flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <ShoppingCart className="w-5 h-4 text-slate-100" />
                    </div>
                    <div>
                        <span className="text-lg font-[1000] text-slate-100 tracking-widest uppercase italic">OUTSOURCE MANAGER</span><br />
                        <span className="text-[10px] font-[1000] text-slate-100 uppercase tracking-tight">{allAssignments.length} ASSIGNMENTS ACTIVE</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 bg-white">
                {allAssignments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 italic">
                        <Package className="w-12 h-12 mb-3 stroke-1" />
                        <p className="text-xs font-black uppercase tracking-widest">No active outsource assignments</p>
                    </div>
                ) : (
                    allAssignments.map((assign, idx) => {
                        const isCompleted = assign.status === 'Completed' || assign.current_stage_idx === 6;
                        const mainMat = assign.materials?.find(m => m.type === 'Main') || assign.materials?.[0];
                        const isUv = assign.process_name?.toUpperCase().includes('PRINTING') || assign.process_name?.toUpperCase().includes('UV');

                        const getPieceDimsLocal = (mgInput, mat) => {
                            const isSheet = mat?.material_type === 'sheet';
                            if (!isSheet) {
                                if (mgInput?.length && mgInput?.width) {
                                    return { l: mgInput.length, w: mgInput.width };
                                }
                                if (mgInput?.baselength && mgInput?.basewidth) {
                                    return { l: mgInput.baselength, w: mgInput.basewidth };
                                }
                            } else {
                                if (mat?.material_input?.one_up_length && mat?.material_input?.one_up_width) {
                                    return { l: mat.material_input.one_up_length, w: mat.material_input.one_up_width };
                                }
                                if (mat?.material_input?.size) {
                                    const parts = mat.material_input.size.toLowerCase().split('x').map(p => parseFloat(p.replace(/[^0-9.]/g, '')) || 0);
                                    if (parts.length >= 2) return { l: parts[0], w: parts[1] };
                                }
                            }
                            // Fallbacks
                            if (mgInput?.length && mgInput?.width) {
                                return { l: mgInput.length, w: mgInput.width };
                            }
                            if (mgInput?.baselength && mgInput?.basewidth) {
                                return { l: mgInput.baselength, w: mgInput.basewidth };
                            }
                            if (mat?.material_input?.one_up_length && mat?.material_input?.one_up_width) {
                                return { l: mat.material_input.one_up_length, w: mat.material_input.one_up_width };
                            }
                            return { l: 0, w: 0 };
                        };

                        const printableMat = assign.materials?.find(m => {
                            const cat = m.category_type?.toLowerCase() || "";
                            return !cat.includes('consumable') && !cat.includes('hardware');
                        }) || assign.materials?.[0];

                        const { l: pieceLength, w: pieceWidth } = getPieceDimsLocal(assign.mg_input, printableMat);
                        const sqInPerPiece = parseFloat(pieceLength) * parseFloat(pieceWidth) || 0;
                        const totalSqIn = sqInPerPiece * (parseFloat(assign.outsource_qty) || 0);
                        const totalCost = isUv
                            ? totalSqIn * (parseFloat(assign.outsource_rate) || 0)
                            : (parseFloat(assign.outsource_sheets) || 0) * (parseFloat(assign.outsource_rate) || 0);

                        return (
                            <div key={assign.uniqueKey} className={`rounded-[2.5rem] border ${assign.is_hold ? 'border-amber-400 bg-amber-50/10' : isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-purple-200 bg-purple-50/20'} overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 group mb-6`}>
                                {/* Header */}
                                <div className={`px-6 py-4 border-b ${assign.is_hold ? 'border-amber-100 bg-amber-50/50' : isCompleted ? 'border-emerald-100' : 'border-purple-100'} flex justify-between items-center`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black ${assign.is_hold ? 'text-amber-700' : isCompleted ? 'text-emerald-700' : 'text-purple-700'} uppercase tracking-widest`}>
                                                JOB: {assign.job_no} — {assign.sub_job_no}
                                            </span>
                                            {/* Vendor Outsource Status Badge */}
                                            {(!assign.status || assign.status === 'Pending') && (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black uppercase tracking-widest shadow-sm">
                                                    ⏳ Pending Vendor
                                                </span>
                                            )}
                                            {(assign.status === 'Confirmed' || assign.status === 'In Progress') && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] font-black uppercase tracking-widest shadow-sm">
                                                    ✓ Confirmed
                                                </span>
                                            )}
                                            {assign.status === 'Rejected' && (
                                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[8px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                                                    ✗ Declined
                                                </span>
                                            )}
                                            {assign.is_hold && (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-sm">
                                                    On Hold
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[9px] font-black ${assign.is_hold ? 'text-amber-500' : isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-tight mt-0.5`}>
                                            {assign.is_hold ? 'OPERATION PAUSED' : isCompleted ? 'INVOICE APPROVED — STAGE 7/7' : `${timelineSteps[assign.current_stage_idx || 0]?.label.toUpperCase()} — STAGE ${(assign.current_stage_idx || 0) + 1}/7`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setShowHistory({ id: assign.uniqueKey, type: 'stage', data: assign.stage_history })}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                        <div className="text-right">
                                            {isCompleted ? (
                                                <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-emerald-200 rounded-xl text-emerald-600 text-[10px] font-black uppercase shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    JOB CLOSED
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-[1000] text-purple-700 uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-lg border border-purple-200/30 shadow-sm block">
                                                    {timelineSteps[assign.current_stage_idx || 0]?.label.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {assign.is_hold && (
                                        <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-inner">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 animate-pulse" />
                                            <div>
                                                <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-0.5">THIS OUTSOURCE ASSIGNMENT IS ON HOLD</h5>
                                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wide leading-tight">
                                                    Reason: {assign.hold_remarks || "Hold active from Production Floor or DTP studio"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {assign.status === 'Rejected' && (
                                        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-inner">
                                            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 animate-pulse" />
                                            <div>
                                                <h5 className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-0.5">THIS ASSIGNMENT WAS DECLINED BY THE VENDOR</h5>
                                                <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wide leading-tight">
                                                    Reason: {assign.rejection_reason || "No reason provided"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-5">
                                        <h4 className={`text-[10px] font-black ${isCompleted ? 'text-emerald-700' : 'text-purple-700'} uppercase tracking-[0.2em] mb-3`}>OUTSOURCED MATERIALS</h4>
                                        <div className="flex gap-12">
                                            <div>
                                                <p className={`text-[8px] font-[1000] ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-tight mb-0.5`}>CUSTOMER</p>
                                                <p className={`text-[11px] font-[1000] ${isCompleted ? 'text-emerald-900' : 'text-purple-900'} uppercase`}>{assign.client_name}</p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-[1000] ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-tight mb-0.5`}>DUE DATE</p>
                                                <p className={`text-[11px] font-[1000] ${isCompleted ? 'text-emerald-900' : 'text-purple-900'} uppercase`}>30-Mar-2026</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specs Card */}
                                    <div className={`bg-white rounded-2xl border ${isCompleted ? 'border-emerald-100 shadow-emerald-50/50' : 'border-purple-100 shadow-sm'} p-5 mb-6 transition-colors duration-500`}>
                                        <h5 className={`text-[11px] font-[1000] ${isCompleted ? 'text-emerald-900' : 'text-purple-900'} uppercase mb-4`}>
                                            {assign.group_name} — {mainMat?.material_input?.size || '-'}
                                        </h5>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-3">
                                            {/* Row 1 */}
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>SIZE</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">{mainMat?.material_input?.size || '-'}</p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>SQ.IN</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">
                                                    {isUv && totalSqIn > 0
                                                        ? (totalSqIn > 1000 ? (totalSqIn / 1000).toFixed(1) + 'k' : Math.round(totalSqIn).toLocaleString())
                                                        : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>PRINT SIDES</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">
                                                    {isUv ? `${assign.mg_sides || 1} side` : '-'}
                                                </p>
                                            </div>

                                            {/* Row 2 */}
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>{isUv ? 'PIECES SENT' : 'SHEETS SENT'}</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">
                                                    {isUv ? `${(assign.outsource_qty || 0).toLocaleString()} pcs` : `${assign.outsource_sheets} sheets = ${(assign.outsource_qty || 0).toLocaleString()} pcs`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>RATE</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">₹{assign.outsource_rate || 0}/{isUv ? 'sq. in' : 'min'}</p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>
                                                    {isUv ? 'CYCLES' : 'UPS'}
                                                </p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">
                                                    {isUv ? '20' : (mainMat?.material_input?.ups || '-')}
                                                </p>
                                            </div>

                                            {/* Row 3 */}
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>DELIVERY</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">{assign.outsource_delivery_date || '-'}</p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>RATE/UNIT</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">
                                                    {isUv ? `₹${(sqInPerPiece * (parseFloat(assign.outsource_rate) || 0)).toFixed(2)}` : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className={`text-[8px] font-black ${isCompleted ? 'text-emerald-400' : 'text-purple-400'} uppercase tracking-widest mb-1`}>TOTAL VALUE</p>
                                                <p className="text-[11px] font-[1000] text-slate-800 uppercase">
                                                    {totalCost > 0 ? `₹${Math.round(totalCost)}` : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Vendor Footer */}
                                        <div className={`mt-6 pt-3 border-t ${isCompleted ? 'border-emerald-50' : 'border-purple-50'} flex justify-between items-center`}>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-md">
                                                    <Factory className="w-3 h-3 text-slate-600" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-700 uppercase italic">
                                                    {assign.vendor_name || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase">
                                                    Del: {assign.outsource_delivery_date || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Timeline */}
                                    <div className="px-2 mb-8 overflow-x-auto no-scrollbar pb-6">
                                        <div className="flex items-center justify-between min-w-[480px]">
                                            {timelineSteps.map((step, sIdx) => (
                                                <React.Fragment key={sIdx}>
                                                    <div className="flex flex-col items-center gap-2 relative">
                                                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 z-10 transition-all duration-300 ${sIdx <= (assign.current_stage_idx || 0) ? (isCompleted || sIdx < (assign.current_stage_idx || 0) ? 'bg-emerald-500 border-emerald-500' : 'bg-purple-600 border-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.4)]') : 'bg-white border-slate-200'}`}>
                                                            {(isCompleted || sIdx < (assign.current_stage_idx || 0)) && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
                                                        </div>
                                                        <span className={`text-[7px] font-black text-center leading-none uppercase absolute top-6 w-[60px] transition-colors duration-300 ${sIdx <= (assign.current_stage_idx || 0) ? (isCompleted || sIdx < (assign.current_stage_idx || 0) ? 'text-emerald-600' : 'text-purple-700') : 'text-slate-400'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    {sIdx < timelineSteps.length - 1 && (
                                                        <div className={`h-[1.5px] flex-1 mx-[-2px] mt-0.5 mb-0.5 transition-colors duration-300 ${sIdx < (assign.current_stage_idx || 0) || isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>


                                    {/* Batch Receipts Section - Only for Stage 4-6 (not completed) */}
                                    {(assign.current_stage_idx || 0) >= 3 && !isCompleted && (
                                        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h4 className="text-[10px] font-black text-purple-700 uppercase tracking-[0.2em] mb-4">BATCH RECEIPTS</h4>

                                            {/* Batch Stats Summary - Only show if batches exist */}
                                            {assign.batch_receipts?.length > 0 && (
                                                <div className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 shadow-xl mb-6 grid grid-cols-3 divide-x divide-slate-800/50">
                                                    <div className="px-4">
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">ORDERED</p>
                                                        <p className="text-xl font-[1000] text-white italic tracking-tighter">{(assign.outsource_qty || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="px-4">
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">RECD</p>
                                                        <p className="text-xl font-[1000] text-emerald-400 italic tracking-tighter">
                                                            {(assign.batch_receipts?.filter(b => b.type === 'actual').reduce((sum, b) => sum + (b.qty || 0), 0) || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="px-4">
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">BALANCE</p>
                                                        <p className="text-xl font-[1000] text-amber-400 italic tracking-tighter">
                                                            {(assign.outsource_qty - (assign.batch_receipts?.filter(b => b.type === 'actual').reduce((sum, b) => sum + (b.qty || 0), 0) || 0)).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100 p-6 shadow-sm mb-6">
                                                <h5 className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-4 ml-1">ADD BATCH</h5>

                                                {/* Tabs */}
                                                <div className="grid grid-cols-2 gap-2 mb-5">
                                                    <button
                                                        disabled={assign.is_hold}
                                                        onClick={() => !assign.is_hold && setBatchInputs(prev => ({ ...prev, type: 'actual' }))}
                                                        className={`py-2.5 rounded-xl border text-[10px] font-[1000] uppercase tracking-widest shadow-sm transition-all ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${batchInputs.type === 'actual' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                                    >
                                                        Actual
                                                    </button>
                                                    <button
                                                        disabled={assign.is_hold}
                                                        onClick={() => !assign.is_hold && setBatchInputs(prev => ({ ...prev, type: 'expected' }))}
                                                        className={`py-2.5 rounded-xl border text-[10px] font-[1000] uppercase tracking-widest shadow-sm transition-all ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${batchInputs.type === 'expected' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                                    >
                                                        Expected
                                                    </button>
                                                </div>

                                                {/* Form Fields */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                                                    <div>
                                                        <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest ml-1 mb-1.5 block">QTY</label>
                                                        <input
                                                            type="number"
                                                            disabled={assign.is_hold}
                                                            value={batchInputs.qty}
                                                            onChange={(e) => setBatchInputs(prev => ({ ...prev, qty: e.target.value }))}
                                                            placeholder="50"
                                                            className={`w-full px-3 py-2 bg-white border border-emerald-100 rounded-xl text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest ml-1 mb-1.5 block">DATE</label>
                                                        <div className="relative">
                                                            <input
                                                                type="date"
                                                                disabled={assign.is_hold}
                                                                min={getCurrentDateTime().date}
                                                                value={batchInputs.date}
                                                                onChange={(e) => setBatchInputs(prev => ({ ...prev, date: e.target.value }))}
                                                                className={`w-full px-3 py-2 bg-white border border-emerald-100 rounded-xl text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest ml-1 mb-1.5 block">TIME</label>
                                                        <div className="relative">
                                                            <input
                                                                type="time"
                                                                disabled={assign.is_hold}
                                                                min={batchInputs.date === getCurrentDateTime().date ? getCurrentDateTime().time : undefined}
                                                                value={batchInputs.time}
                                                                onChange={(e) => setBatchInputs(prev => ({ ...prev, time: e.target.value }))}
                                                                className={`w-full px-3 py-2 bg-white border border-emerald-100 rounded-xl text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={assign.is_hold}
                                                    onClick={() => !assign.is_hold && handleAddBatch(assign)}
                                                    className={`w-full py-2.5 rounded-xl text-[10px] font-[1000] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${assign.is_hold ? 'bg-amber-500/20 text-amber-600 border border-amber-200 cursor-not-allowed shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}`}
                                                >
                                                    {assign.is_hold ? '⚠️ JOB ON HOLD' : <><Plus className="w-4 h-4" /> ADD BATCH</>}
                                                </button>
                                            </div>

                                            {/* Batch Cards */}
                                            <div className="space-y-4">
                                                {assign.batch_receipts?.slice().reverse().map((batch, bIdx) => (
                                                    <div key={bIdx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group relative">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <span className="text-xl font-[1000] text-slate-800 italic">{batch.qty}</span>
                                                                <span className="text-[10px] font-black text-slate-400 ml-1 uppercase">PCS</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${batch.type === 'actual' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                    {batch.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                <span className="text-[10px] font-bold text-slate-600">{batch.date}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                                <span className="text-[10px] font-bold text-slate-600">{batch.time}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                                            <button className="text-[9px] font-black text-purple-600 uppercase tracking-widest hover:underline px-3 py-1 bg-purple-50 rounded-lg">
                                                                NOTIFY TEAM
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Invoice Details Section - Only for Stage 5 (Job Closure) */}
                                    {(assign.current_stage_idx || 0) === 5 && (
                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 mt-4 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">INVOICE NO.</label>
                                                    <input
                                                        type="text"
                                                        disabled={assign.is_hold}
                                                        value={invoiceInputs.no}
                                                        onChange={(e) => setInvoiceInputs(prev => ({ ...prev, no: e.target.value }))}
                                                        placeholder="INV/001"
                                                        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">INVOICE DATE</label>
                                                    <input
                                                        type="date"
                                                        disabled={assign.is_hold}
                                                        value={invoiceInputs.date}
                                                        onChange={(e) => setInvoiceInputs(prev => ({ ...prev, date: e.target.value }))}
                                                        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">INVOICE AMT (₹)</label>
                                                    <input
                                                        type="number"
                                                        disabled={assign.is_hold}
                                                        value={invoiceInputs.amt}
                                                        onChange={(e) => setInvoiceInputs(prev => ({ ...prev, amt: e.target.value }))}
                                                        placeholder="0.00"
                                                        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm ${assign.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isCompleted ? (
                                        <div className="mt-4 p-5 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex flex-col gap-4 shadow-sm animate-in zoom-in-95 duration-500">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                                                    <CheckCircle2 className="w-7 h-7 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-[1000] text-emerald-800 uppercase tracking-widest mb-0.5">OUTSOURCE COMPLETE</h4>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight opacity-80 italic">Invoice Approved — Job Closed & Archived</p>
                                                </div>
                                            </div>

                                            {assign.invoice_no && (
                                                <div className="bg-white/60 rounded-xl p-3 border border-emerald-100 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">INVOICE NO.</p>
                                                        <p className="text-[10px] font-bold text-emerald-900 uppercase">{assign.invoice_no}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">DATE</p>
                                                        <p className="text-[10px] font-bold text-emerald-900 uppercase">{assign.invoice_date}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">AMOUNT</p>
                                                        <p className="text-[10px] font-bold text-emerald-900 uppercase">₹{assign.invoice_amt || 0}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (() => {
                                        const isNextDisabled = assign.is_hold || (assign.status !== 'Confirmed' && assign.status !== 'In Progress');
                                        const buttonText = assign.is_hold
                                            ? '⚠️ JOB ON HOLD'
                                            : ((assign.status !== 'Confirmed' && assign.status !== 'In Progress')
                                                ? '⏳ AWAITING VENDOR CONFIRMATION'
                                                : `→ ${timelineSteps[assign.current_stage_idx || 0]?.btn || 'COMPLETED'}`);
                                        const buttonColorClasses = assign.is_hold
                                            ? 'bg-amber-500/20 text-amber-600 border border-amber-200 cursor-not-allowed shadow-none'
                                            : ((assign.status !== 'Confirmed' && assign.status !== 'In Progress')
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100');

                                        return (
                                            <button
                                                disabled={isNextDisabled}
                                                onClick={() => !isNextDisabled && handleNextStage(assign)}
                                                className={`w-full mt-6 py-3 rounded-2xl text-[11px] font-[1000] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${buttonColorClasses}`}
                                            >
                                                {buttonText}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* History Sidebar/Overlay */}
            {showHistory && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[110] animate-in fade-in slide-in-from-right duration-300 flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <History className="w-5 h-5 text-purple-600" />
                            <h3 className="text-sm font-[1000] text-slate-800 uppercase tracking-widest">
                                {showHistory.type.toUpperCase()} HISTORY
                            </h3>
                        </div>
                        <button onClick={() => setShowHistory(null)} className="p-2 hover:bg-white rounded-full shadow-sm">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {showHistory.data?.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-xs uppercase tracking-widest">
                                No history records found
                            </div>
                        ) : (
                            showHistory.data?.slice().reverse().map((entry, hIdx) => (
                                <div key={hIdx} className="relative pl-6 border-l-2 border-purple-100 py-1">
                                    <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    </div>
                                    <div className="mb-1">
                                        <span className="text-[10px] font-[1000] text-slate-800 uppercase tracking-tight">
                                            {entry.stage_label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-2.5 h-2.5" /> {entry.updated_at || entry.date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="w-2.5 h-2.5" /> {entry.updated_by?.name || 'System User'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutsourceManager;
