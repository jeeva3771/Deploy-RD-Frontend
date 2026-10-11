import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Zap, Monitor, Clock, Moon, Package, CheckSquare, CheckCircle2, Sun, Factory, MessageSquare, Circle, ShoppingCart, AlertTriangle, Flag, CheckCircle, User as UserIcon, Play } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { updateShopFloorJobStatus, clearShopFloorFlags, escalateShopFloorJob, deEscalateShopFloorJob } from '../../../reducer/shopFloorReducer';
import { toast } from 'react-toastify';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
import { getOutsourceVendorNameList } from '../../../reducer/outsourceVendorReducer';

const isShiftActive = (shiftsArr, shift) => Array.isArray(shiftsArr) ? shiftsArr.includes(shift) : shiftsArr === shift;

const ReassignModal = ({ show, onClose, onConfirm, remark, setRemark, newShift, currentShift, isUv = false }) => {
    if (!show) return null;

    const getShiftName = (s) => {
        if (isUv) {
            return s === 1 ? 'Hantop' : s === 2 ? 'Mimaki' : 'Outsource';
        }
        return s === 4 ? 'Outsource' : `S${s}`;
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-cyan-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 italic tracking-tighter uppercase mb-1">Reassign Job</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                        Moving from <span className="text-slate-600 font-black">{getShiftName(currentShift)}</span> <br />
                        to <span className="text-cyan-600 font-black">{getShiftName(newShift)}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for change (Optional)</label>
                    <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Why is this job being moved?"
                        className="w-full h-32 p-4 rounded-[24px] bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white outline-none transition-all text-xs font-bold text-gray-700 placeholder:text-gray-300 resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="py-4 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={onConfirm}
                        className="py-4 rounded-full bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-100 hover:bg-cyan-500 active:scale-95 transition-all"
                    >
                        CONFIRM
                    </button>
                </div>
            </div>
        </div>
    );
};

const LaserJobDetail = ({ job, onClose, refreshData, onImageClick }) => {
    console.log("job", job)
    const dispatch = useDispatch();
    const [reassignModal, setReassignModal] = useState({ show: false, newShift: null, currentShift: null, groupId: null });
    const [reassignRemark, setReassignRemark] = useState("");
    const [outsourceMode, setOutsourceMode] = useState({ show: false, groupId: null, editIndex: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, groupId: null, index: null });
    const [warningModal, setWarningModal] = useState({ show: false, message: "" });
    const [escalateModal, setEscalateModal] = useState(false);
    const [deEscalateModal, setDeEscalateModal] = useState(false);
    const { outsourceVendors: vendors } = useSelector((state) => state.outsourceVendor);

    const getFilteredVendors = () => {
        if (!job?.process_name) return vendors;
        const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, "");
        const jobProcess = normalize(job.process_name);
        return vendors.filter(v =>
            v.process_type && (
                Array.isArray(v.process_type)
                    ? v.process_type.some(p => normalize(p.name) === jobProcess)
                    : normalize(v.process_type.name) === jobProcess
            )
        );
    };
    const [outsourceForm, setOutsourceForm] = useState({
        vendor_id: "",
        vendor_name: "",
        outsource_rate: "",
        outsource_qty: "",
        outsource_sheets: "",
        outsource_delivery_date: "",
        communication_mode: "whatsapp_and_email"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Per-group per-shift sheet input state: { "groupId_shift": number }
    const [shiftSheetInputs, setShiftSheetInputs] = useState({});
    const getShiftSheets = (groupId, shift, defaultVal = 0) => {
        const raw = shiftSheetInputs[`${groupId}_${shift}`];
        return raw !== undefined ? (parseFloat(raw) || 0) : defaultVal;
    };
    const setShiftSheets = (groupId, shift, val) =>
        setShiftSheetInputs(prev => ({ ...prev, [`${groupId}_${shift}`]: val }));

    const handleClearFlag = async (type) => {
        try {
            await dispatch(clearShopFloorFlags({ id: job._id, type })).unwrap();
            refreshData();
        } catch (error) {
            toast.error("Failed to clear notification");
        }
    };

    const isAssigned = (job?.assigned_shifts && job.assigned_shifts.some(s => s === 1 || s === 2 || s === 3)) ||
        (job?.material_groups && job.material_groups.some(mg =>
            mg.assigned_shifts && mg.assigned_shifts.some(s => s === 1 || s === 2 || s === 3)
        ));

    useEffect(() => {
        dispatch(getOutsourceVendorNameList());
    }, [dispatch]);

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
                if (extra.is_outsource) setOutsourceMode({ show: false, groupId: null });
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

    const onShiftClick = (shift, uniqueId) => {
        const group = job.material_groups?.find(g =>
            String(g._id) === String(uniqueId) ||
            (g.group_id && String(g.group_id) === String(uniqueId))
        );

        // Validation: If trying to assign in-house shift (1,2,3) to a fully outsourced job
        if ([1, 2, 3].includes(shift)) {
            const totalSheets = group?.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            })?.quantity || 0;

            const assignedOutsource = group?.assigned_outsource_sheets || 0;

            if (assignedOutsource >= totalSheets && totalSheets > 0) {
                setWarningModal({
                    show: true,
                    message: "The entire job assigned to outsource if you need to assign shift reduce the assigned outsource qty or remove the outsource assign."
                });
                return;
            }
        }

        if (shift === 4) {
            // No need to select Outsource in overall assignment
            if (uniqueId === 'GLOBAL') return;

            // If already assigned, do not open the form again via the shift button
            if (isShiftActive(group?.assigned_shifts, 4)) return;

            // Outsource: show form
            if (outsourceMode.show && String(outsourceMode.groupId) === String(uniqueId)) {
                setOutsourceMode({ show: false, groupId: null, group: null });
                return;
            }

            let initialData = {
                vendor_id: "",
                vendor_name: "",
                outsource_rate: "",
                outsource_qty: "",
                outsource_sheets: "",
                outsource_delivery_date: "",
                communication_mode: "whatsapp_and_email"
            };

            if (uniqueId === 'GLOBAL') {
                initialData = {
                    vendor_id: job.outsource_details?.vendor_id || job.vendor_id || "",
                    vendor_name: job.outsource_details?.vendor_name || job.vendor_name || "",
                    outsource_rate: job.outsource_details?.outsource_rate || "",
                    outsource_qty: job.outsource_details?.outsource_qty || job.total_qty || "",
                    outsource_sheets: job.outsource_details?.outsource_sheets || "",
                    outsource_delivery_date: job.outsource_details?.outsource_delivery_date || "",
                    communication_mode: job.outsource_details?.communication_mode || "whatsapp_and_email"
                };
            } else if (group && !isShiftActive(group.assigned_shifts, 4)) {
                // Only pre-fill if NOT already outsourced (first time assignment)
                initialData = {
                    vendor_id: group.vendor_id || group.outsource_details?.vendor_id || "",
                    vendor_name: group.vendor_name || group.outsource_details?.vendor_name || "",
                    outsource_rate: group.outsource_rate || group.outsource_details?.outsource_rate || "",
                    outsource_qty: group.outsource_qty || group.outsource_details?.outsource_qty || group.quantity || "",
                    outsource_sheets: group.assigned_outsource_sheets || "",
                    outsource_delivery_date: group.outsource_delivery_date || group.outsource_details?.outsource_delivery_date || "",
                    communication_mode: group.outsource_details?.communication_mode || "whatsapp_and_email"
                };
            }

            setOutsourceForm(initialData);
            setOutsourceMode({ show: true, groupId: uniqueId, group, editIndex: null });
            return;
        }

        // Shifts 1/2/3: toggle directly, no reassign modal
        if (uniqueId && uniqueId !== 'GLOBAL') {
            handleUpdateGroupShift(uniqueId, shift);
        } else {
            handleUpdateStatus('In Progress', shift);
        }
    };

    const submitOutsource = async (uniqueId) => {
        if (isSubmitting) return;
        if (!outsourceForm.vendor_id) return toast.warning("Please select a vendor");
        if (!outsourceForm.outsource_sheets || outsourceForm.outsource_sheets <= 0) return toast.warning("Please enter sheets to outsource");
        if (!outsourceForm.outsource_rate || outsourceForm.outsource_rate <= 0) return toast.warning("Please enter the rate");
        if (!outsourceForm.outsource_delivery_date) return toast.warning("Please select a delivery date");

        const parseDateHelper = (dateStr) => {
            if (!dateStr) return null;
            if (typeof dateStr !== 'string') return new Date(dateStr);
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                // If it's DD-MM-YYYY (e.g. 09-05-2026), flip it to YYYY-MM-DD
                if (parts[0].length === 2 && parts[2].length === 4) {
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
            }
            return new Date(dateStr);
        };

        if (outsourceForm.outsource_delivery_date) {
            const delDate = parseDateHelper(outsourceForm.outsource_delivery_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (delDate && delDate < today) {
                return toast.warning("Delivery date cannot be in the past");
            }

            if (job.job_completion_date) {
                const jobDate = parseDateHelper(job.job_completion_date);
                if (delDate && jobDate) {
                    delDate.setHours(0, 0, 0, 0);
                    jobDate.setHours(0, 0, 0, 0);
                    if (delDate > jobDate) {
                        return toast.warning(`Delivery date cannot be after job completion date (${job.job_completion_date})`);
                    }
                }
            }
        }

        setIsSubmitting(true);
        try {
            if (uniqueId === 'GLOBAL') {
                await handleUpdateStatus('In Progress', 4, "", {
                    is_outsource: true,
                    outsource_details: {
                        vendor_id: outsourceForm.vendor_id,
                        vendor_name: outsourceForm.vendor_name,
                        outsource_rate: outsourceForm.outsource_rate,
                        outsource_sheets: outsourceForm.outsource_sheets,
                        outsource_ups: outsourceForm.outsource_qty,  // auto-calculated UPS
                        outsource_delivery_date: outsourceForm.outsource_delivery_date,
                        communication_mode: outsourceForm.communication_mode
                    }
                });
            } else {
                await handleUpdateGroupShift(uniqueId, 4, "", {
                    is_outsource: true,
                    outsource_details: {
                        vendor_id: outsourceForm.vendor_id,
                        vendor_name: outsourceForm.vendor_name,
                        outsource_rate: outsourceForm.outsource_rate,
                        outsource_sheets: outsourceForm.outsource_sheets,
                        outsource_ups: outsourceForm.outsource_qty,  // auto-calculated UPS
                        outsource_delivery_date: outsourceForm.outsource_delivery_date,
                        communication_mode: outsourceForm.communication_mode,
                        assignment_index: outsourceMode.editIndex
                    }
                });
            }
            setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null });
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeOutsource = (uniqueId, index) => {
        setDeleteConfirm({ show: true, groupId: uniqueId, index });
    };

    const confirmRemove = () => {
        if (!deleteConfirm.groupId || deleteConfirm.index === null) return;

        handleUpdateGroupShift(deleteConfirm.groupId, 4, "", {
            is_outsource: true,
            outsource_details: {
                is_remove: true,
                assignment_index: deleteConfirm.index
            }
        });

        setDeleteConfirm({ show: false, groupId: null, index: null });
        setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null });
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
                                {job.is_reprocess && (
                                    <span className="text-[8px] font-black py-1 px-2 bg-red-600 text-white italic uppercase rounded-md shadow-sm">Reprocess</span>
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
                                {!isAssigned ? (
                                    <button
                                        onClick={() => handleClearFlag('qty')}
                                        disabled={job.is_hold}
                                        className={`px-4 py-1.5 rounded-full bg-[#9333ea] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-[#7e22ce] transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        ACKNOWLEDGE
                                    </button>
                                ) : (
                                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest italic bg-purple-100/50 px-3 py-1 rounded-full">
                                        Awaiting Operator ACK
                                    </span>
                                )}
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
                                {!isAssigned ? (
                                    <button
                                        onClick={() => handleClearFlag('date')}
                                        disabled={job.is_hold}
                                        className={`px-4 py-1.5 rounded-full bg-[#d97706] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-[#b45309] transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        ACKNOWLEDGE
                                    </button>
                                ) : (
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic bg-amber-100/50 px-3 py-1 rounded-full">
                                        Awaiting Operator ACK
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-[12px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">ASSIGN ENTIRE JOB TO MACHINE</h4>
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3].map(s => {
                            const colors = {
                                1: "bg-blue-600 border-blue-600 text-white shadow-md",
                                2: "bg-orange-500 border-orange-500 text-white shadow-md",
                                3: "bg-purple-600 border-purple-600 text-white shadow-md"
                            };
                            const isActive = isShiftActive(job.assigned_shifts, s);
                            return (
                                <AssignButton
                                    key={s}
                                    label={`S${s}`}
                                    icon={s === 1 ? <Monitor className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} /> : s === 2 ? <Sun className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-500'}`} /> : <Moon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-400'}`} />}
                                    onClick={() => !job.is_hold && onShiftClick(s, 'GLOBAL')}
                                    isActive={isActive}
                                    disabled={job.is_hold}
                                    activeClass={colors[s]}
                                />
                            );
                        })}
                        {/* <AssignButton
              label="OUTSOURCE"
              icon={<Factory className={`w-4 h-4 ${isShiftActive(job.assigned_shifts, 4) ? 'text-white' : 'text-rose-500'}`} />}
              onClick={() => onShiftClick(4, 'GLOBAL')}
              isActive={isShiftActive(job.assigned_shifts, 4)}
              activeClass="bg-rose-600 border-rose-600 text-white shadow-md"
            /> */}
                    </div>
                </section>

                <section>
                    {/* Global Outsource Form */}
                    {outsourceMode.show && outsourceMode.groupId === 'GLOBAL' && (
                        <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-100 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Factory className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <h6 className="text-[11px] font-black text-purple-900 uppercase italic tracking-tight leading-none">Global Outsource</h6>
                                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mt-1">Assigning entire job to vendor</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest ml-1">SELECT VENDOR</label>
                                    <select
                                        value={outsourceForm.vendor_id}
                                        onChange={(e) => {
                                            const v = vendors.find(v => v._id === e.target.value);
                                            setOutsourceForm({ ...outsourceForm, vendor_id: e.target.value, vendor_name: v?.name || "" });
                                        }}
                                        className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-500 transition-all shadow-sm"
                                    >
                                        <option value="">Choose partner...</option>
                                        {getFilteredVendors().map(v => (
                                            <option key={v._id} value={v._id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">TOTAL QTY</label>
                                        <input
                                            type="number"
                                            value={outsourceForm.outsource_qty}
                                            onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_qty: e.target.value })}
                                            placeholder={`Max:${job.total_qty || 0}`}
                                            className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">RATE (₹)</label>
                                        <input
                                            type="number"
                                            value={outsourceForm.outsource_rate}
                                            onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_rate: e.target.value })}
                                            placeholder="Unit Rate"
                                            className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">ESTIMATED DELIVERY</label>
                                    <input
                                        type="date"
                                        value={outsourceForm.outsource_delivery_date}
                                        onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_delivery_date: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">NOTIFY VENDOR VIA</label>
                                    <select
                                        value={outsourceForm.communication_mode}
                                        onChange={(e) => setOutsourceForm({ ...outsourceForm, communication_mode: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-500 transition-all shadow-sm"
                                    >
                                        <option value="whatsapp_and_email">WhatsApp & Email</option>
                                        <option value="whatsapp">WhatsApp Only</option>
                                        <option value="email">Email Only</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 pt-3">
                                    <button
                                        onClick={() => setOutsourceMode({ show: false, groupId: null, group: null })}
                                        className="flex-1 py-3 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-white transition-all"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={() => submitOutsource('GLOBAL')}
                                        disabled={isSubmitting}
                                        className={`flex-[2] py-3 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-100 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500 active:scale-95'}`}
                                    >
                                        {isSubmitting ? 'PROCESSING...' : '✓ CONFIRM JOB'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-[12px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">Assign by Line Item</h4>
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
                                                                        <div className="space-y-1">
                                                                            <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">CUT TIME/SHEET</span>
                                                                            <span className="block text-[13px] font-black text-slate-800 leading-none">{`${mg.input?.actual_input ? `${mg.input.actual_input}m` : ''}`}</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">TOTAL CUT TIME</span>
                                                                            <span className="block text-[13px] font-black text-slate-800 leading-none">
                                                                                {mg.input?.actual_input ? `${Math.round(parseFloat(mg.input.actual_input) * (parseFloat(m.quantity) || 0))}m` : '-'}
                                                                            </span>
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

                                        <div className="grid grid-cols-4 gap-2 mt-6">
                                            {[1, 2, 3].map(s => {
                                                const grpActive = isShiftActive(mg.assigned_shifts, s);
                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => !job.is_hold && onShiftClick(s, mg._id || mg.group_id)}
                                                        disabled={job.is_hold}
                                                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border text-[12px] font-black transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''} ${grpActive
                                                            ? s === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                                                : s === 2 ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                                                                    : 'bg-purple-600 border-purple-600 text-white shadow-lg'
                                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                                                            }`}
                                                    >
                                                        {s === 1 && <Monitor className={`w-3.5 h-3.5 ${grpActive ? 'text-white' : 'text-blue-500'}`} />}
                                                        {s === 2 && <Sun className={`w-3.5 h-3.5 ${grpActive ? 'text-white' : 'text-orange-500'}`} />}
                                                        {s === 3 && <Moon className={`w-3.5 h-3.5 ${grpActive ? 'text-white' : 'text-purple-400'}`} />}
                                                        S{s}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => !job.is_hold && onShiftClick(4, mg._id || mg.group_id)}
                                                disabled={job.is_hold}
                                                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border text-[12px] font-black transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''} ${isShiftActive(mg.assigned_shifts, 4)
                                                    ? 'bg-rose-600 border-rose-600 text-white shadow-lg'
                                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                                                    }`}
                                            >
                                                <Factory className={`w-3.5 h-3.5 ${isShiftActive(mg.assigned_shifts, 4) ? 'text-white' : 'text-rose-400'}`} />
                                                Out
                                            </button>
                                        </div>

                                        {/* // QTY SPLIT SECTION
                    {mg.outsource_qty > 0 && (
                      <div className="mt-6 p-4 rounded-[20px] bg-gray-50/50 border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">QTY SPLIT — TOTAL: {mg.total_process_qty}U</span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2.5 w-24 flex-shrink-0">
                              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Factory className="w-3.5 h-3.5 text-indigo-500" />
                              </div>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">OUTSOURCE</span>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              <div className="px-6 py-2.5 rounded-xl bg-indigo-100/50 border-2 border-indigo-200 text-sm font-black text-indigo-700 min-w-[70px] text-center shadow-inner">
                                {mg.outsource_qty}
                              </div>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">of {mg.total_process_qty}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2.5 w-24 flex-shrink-0">
                              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Monitor className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">IN-HOUSE</span>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              <div className="px-6 py-2.5 rounded-xl bg-blue-50 border-2 border-blue-100 text-sm font-black text-blue-400 min-w-[70px] text-center shadow-inner opacity-60">
                                {mg.inhouse_qty}
                              </div>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">of {mg.total_process_qty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 py-2.5 px-4 rounded-xl bg-green-50/50 border border-green-100 flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-[9px] font-black text-green-700 uppercase tracking-tight">
                            FULLY ALLOCATED — <span className="italic">{mg.outsource_qty}U OUTSOURCE</span> + <span className="italic">{mg.inhouse_qty}U IN-HOUSE</span>
                          </span>
                        </div>
                      </div>
                    )} */}

                                        {/* QTY SPLIT display — shown once outsource is assigned */}
                                        {((mg.outsource_assignments?.length > 0) || (mg.vendor_name && mg.assigned_outsource_sheets > 0)) && (() => {
                                            // BOM planned sheets for outsource = outsource_qty / ups
                                            const bomSheets = mg.outsource_qty > 0 ? Math.round(mg.outsource_qty / upsPerSheet) : 0;
                                            const assignedUps = mg.assigned_outsource_ups || (assignedSheets * upsPerSheet);
                                            const totalBomSheets = bomSheets + Math.round((mg.inhouse_qty || 0) / upsPerSheet);
                                            const inhouseSheets = totalBomSheets - assignedSheets;

                                            // Active in-house shifts (exclude outsource=4)
                                            const activeShifts = Array.isArray(mg.assigned_shifts)
                                                ? mg.assigned_shifts.filter(s => s !== 4)
                                                : [];

                                            const shiftColors = {
                                                1: { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', pill: 'bg-blue-50 border-blue-100 text-blue-600' },
                                                2: { bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500', pill: 'bg-orange-50 border-orange-100 text-orange-600' },
                                                3: { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', pill: 'bg-purple-50 border-purple-100 text-purple-600' },
                                            };
                                            const shiftIcons = { 1: Monitor, 2: Sun, 3: Moon };

                                            return (
                                                <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/40 overflow-hidden">
                                                    {/* Header */}
                                                    <div className="px-4 py-2 bg-purple-100/50 border-b border-purple-100">
                                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                                            QTY SPLIT — {bomSheets > 0 ? `${totalBomSheets} SHEETS = ${(totalBomSheets * upsPerSheet).toLocaleString()} UPS` : `${assignedSheets} SHEETS ASSIGNED`}
                                                        </span>
                                                    </div>

                                                    <div className="px-4 py-3">
                                                        {/* Outsource Assignments List */}
                                                        {(mg.outsource_assignments?.length > 0 ? mg.outsource_assignments : (mg.vendor_name ? [{
                                                            vendor_id: mg.vendor_id,
                                                            vendor_name: mg.vendor_name,
                                                            outsource_rate: mg.outsource_rate,
                                                            outsource_sheets: mg.assigned_outsource_sheets,
                                                            outsource_qty: mg.assigned_outsource_ups,
                                                            outsource_delivery_date: mg.outsource_delivery_date
                                                        }] : [])).map((assignment, aIdx) => (
                                                            <div key={aIdx} className="mb-4 last:mb-0 pb-4 border-b border-slate-100 last:border-0">
                                                                {/* Sheets Row */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                                                                            <Factory className="w-3 h-3 text-purple-400" />
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">OUTSOURCE</span>
                                                                        </div>
                                                                        <div className="px-4 py-1.5 rounded-xl bg-purple-100 border border-purple-200 text-[11px] font-black text-purple-700 min-w-[70px] text-center">
                                                                            {assignment.outsource_sheets} sheets
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-slate-400 italic">of {totalMaterialSheets} sheets</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => !job.is_hold && (() => {
                                                                                setOutsourceForm({
                                                                                    vendor_id: assignment.vendor_id,
                                                                                    vendor_name: assignment.vendor_name,
                                                                                    outsource_rate: assignment.outsource_rate || "",
                                                                                    outsource_sheets: assignment.outsource_sheets || "",
                                                                                    outsource_qty: assignment.outsource_qty || "",
                                                                                    outsource_delivery_date: assignment.outsource_delivery_date || "",
                                                                                    communication_mode: assignment.communication_mode || "whatsapp_and_email"
                                                                                });
                                                                                setOutsourceMode({ show: true, groupId: mg._id || mg.group_id, group: mg, editIndex: aIdx });
                                                                            })()}
                                                                            disabled={job.is_hold}
                                                                            className={`px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-[9px] font-black uppercase transition-all border border-purple-100 ${job.is_hold ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-100'}`}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => !job.is_hold && removeOutsource(mg._id || mg.group_id, aIdx)}
                                                                            disabled={job.is_hold}
                                                                            className={`px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[9px] font-black uppercase transition-all border border-rose-100 ${job.is_hold ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-100'}`}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* UPS Output Row */}
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                                                                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">UPS OUTPUT</span>
                                                                    </div>
                                                                    <div className="px-4 py-1.5 rounded-xl bg-teal-50 border border-teal-100 text-[11px] font-black text-teal-700 min-w-[70px] text-center">
                                                                        {(assignment.outsource_qty || 0).toLocaleString()} ups
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-400 italic">auto</span>
                                                                </div>

                                                                {/* Vendor Info Row */}
                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-tight">
                                                                        <Factory className="w-2.5 h-2.5" /> {assignment.vendor_name}
                                                                    </span>
                                                                    {assignment.outsource_rate > 0 && (
                                                                        <>
                                                                            <span className="text-slate-200">|</span>
                                                                            <span className="text-[10px] font-bold text-indigo-500 tracking-tight">₹{assignment.outsource_rate}/min</span>
                                                                        </>
                                                                    )}
                                                                    {assignment.outsource_delivery_date && (
                                                                        <>
                                                                            <span className="text-slate-200">|</span>
                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 tracking-tight">
                                                                                <Clock className="w-2.5 h-2.5" /> {assignment.outsource_delivery_date}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Add Vendor Button */}
                                                        {(() => {
                                                            const currentInhouseSheets = (mg.inhouse_qty || 0) / (upsPerSheet || 1);
                                                            const liveInhouseSheets = getShiftSheets(groupKey, 'combined', currentInhouseSheets);
                                                            const totalAssignedSoFar = assignedSheets + liveInhouseSheets;
                                                            const remainingToAllocate = Math.max(0, totalMaterialSheets - assignedSheets);

                                                            const groupShifts = mg.assigned_shifts?.filter(s => s !== 4) || [];
                                                            if (totalAssignedSoFar >= totalMaterialSheets || groupShifts.length > 0 || outsourceMode.show) return null;

                                                            return (
                                                                <button
                                                                    onClick={() => {
                                                                        setOutsourceForm({
                                                                            vendor_id: "",
                                                                            vendor_name: "",
                                                                            outsource_rate: "",
                                                                            outsource_qty: String(Math.round(remainingToAllocate * upsPerSheet)),
                                                                            outsource_sheets: String(remainingToAllocate),
                                                                            outsource_delivery_date: "",
                                                                            communication_mode: "whatsapp_and_email"
                                                                        });
                                                                        setOutsourceMode({ show: true, groupId: mg._id || mg.group_id, group: mg, editIndex: null });
                                                                    }}
                                                                    className="w-full mt-2 py-2.5 rounded-xl border-2 border-dashed border-purple-200 text-purple-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">+ Add Vendor</span>
                                                                </button>
                                                            );
                                                        })()}

                                                        {/* Divider
                            {activeShifts.length > 0 && (
                              <div className="border-t border-slate-100 my-4 mt-2" />
                            )} */}

                                                        {/* Shift Row — combined with editable remaining qty */}
                                                        {activeShifts.length > 0 && (() => {
                                                            const remainingSheets = Math.max(0, totalMaterialSheets - assignedSheets);
                                                            const groupKey = mg._id || mg.group_id;
                                                            const shiftInput = getShiftSheets(groupKey, 'combined', remainingSheets);
                                                            const shiftUps = Math.round(shiftInput * upsPerSheet);
                                                            const isFullyAllocated = totalMaterialSheets > 0 && (assignedSheets + shiftInput) >= totalMaterialSheets;
                                                            return (
                                                                <div>
                                                                    {/* Shift label + input row */}
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex items-center gap-1.5 w-28 flex-shrink-0 flex-wrap">
                                                                            {activeShifts.map(s => {
                                                                                const ShiftIcon = shiftIcons[s] || Monitor;
                                                                                const c = shiftColors[s] || shiftColors[1];
                                                                                return (
                                                                                    <span key={s} className={`inline-flex items-center gap-1 text-[10px] font-black ${c.icon} uppercase tracking-tight`}>
                                                                                        <ShiftIcon className={`w-3 h-3 ${c.icon}`} />
                                                                                        S{s}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max={remainingSheets}
                                                                            disabled={job.is_hold}
                                                                            value={shiftInput || ''}
                                                                            onChange={e => {
                                                                                const raw = parseFloat(e.target.value);
                                                                                if (isNaN(raw)) { setShiftSheets(groupKey, 'combined', ''); return; }
                                                                                setShiftSheets(groupKey, 'combined', Math.min(Math.max(0, raw), remainingSheets));
                                                                            }}
                                                                            placeholder="0"
                                                                            className={`w-[70px] px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-100 text-[11px] font-black text-blue-700 text-center outline-none focus:ring-2 focus:ring-blue-200 transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                        />
                                                                        <span className="text-[10px] font-bold text-slate-400 italic">of {totalMaterialSheets} sheets</span>
                                                                    </div>
                                                                    {/* ↑ UPS auto row */}
                                                                    {shiftInput > 0 && (
                                                                        <div className="flex items-center gap-3 mt-1.5">
                                                                            <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                                                                                <CheckCircle2 className="w-3 h-3 text-slate-300" />
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">UPS OUTPUT</span>
                                                                            </div>
                                                                            <div className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500 min-w-[70px] text-center">
                                                                                {shiftUps.toLocaleString()} ups
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-slate-400 italic">auto</span>
                                                                        </div>
                                                                    )}
                                                                    {/* FULLY ALLOCATED badge */}
                                                                    {isFullyAllocated && (
                                                                        <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-xl bg-green-50 border border-green-100">
                                                                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                                            <span className="text-[9px] font-black text-green-700 uppercase tracking-tight">
                                                                                FULLY ALLOCATED — {assignedSheets}SH OUTSOURCE + {shiftInput}SH SHIFT
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    {/* Footer: Combined Shift pill + vendor info */}
                                                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                                                        {activeShifts.length > 0 && (() => {
                                                            const groupKey = mg._id || mg.group_id;
                                                            const remainingSheets = Math.max(0, totalMaterialSheets - assignedSheets);
                                                            const shiftInput = getShiftSheets(groupKey, 'combined', remainingSheets);
                                                            const shiftUps = Math.round(shiftInput * upsPerSheet);
                                                            return (
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-100 shadow-sm">
                                                                    <div className="flex items-center gap-1">
                                                                        {activeShifts.map(s => {
                                                                            const ShiftIcon = shiftIcons[s] || Monitor;
                                                                            const c = shiftColors[s] || shiftColors[1];
                                                                            return <ShiftIcon key={s} className={`w-3 h-3 ${c.icon}`} />;
                                                                        })}
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase italic tracking-tight text-blue-600">
                                                                        {activeShifts.map(s => `S${s}`).join(' ')}
                                                                        {shiftUps > 0 ? ` (${shiftUps.toLocaleString()}U)` : ''}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Vendor pill */}
                                                        {/* {mg.vendor_name && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-purple-100 shadow-sm">
                                <Factory className="w-3 h-3 text-purple-500" />
                                <span className="text-[9px] font-black text-purple-600 uppercase italic tracking-tight">{mg.vendor_name}</span>
                              </div>
                            )}
                            {assignedUps > 0 && mg.outsource_rate > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-indigo-100 shadow-sm">
                                <ShoppingCart className="w-3 h-3 text-indigo-400" />
                                <span className="text-[9px] font-black text-indigo-600 uppercase italic tracking-tight">
                                  {assignedUps.toLocaleString()}U @ ₹{mg.outsource_rate}/{mg.material_groups?.[0]?.materials?.[0]?.material_input?.one_up_width ? 'SQ.IN' : 'min'}
                                </span>
                              </div>
                            )}
                            {mg.outsource_delivery_date && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-rose-100 shadow-sm">
                                <Clock className="w-3 h-3 text-rose-400" />
                                <span className="text-[9px] font-black text-rose-600 uppercase italic tracking-tight">{mg.outsource_delivery_date}</span>
                              </div>
                            )} */}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {/* Outsource Form */}
                                        {outsourceMode.show && String(outsourceMode.groupId) === String(mg._id || mg.group_id) && (() => {
                                            const sheets = parseFloat(outsourceForm.outsource_sheets) || 0;
                                            const autoUps = sheets * upsPerSheet;

                                            const parseDateHelper = (dateStr) => {
                                                if (!dateStr || typeof dateStr !== 'string') return null;
                                                const parts = dateStr.split('-');
                                                if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
                                                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                                }
                                                return new Date(dateStr);
                                            };

                                            const d1 = parseDateHelper(outsourceForm.outsource_delivery_date);
                                            const d2 = job.job_completion_date ? parseDateHelper(job.job_completion_date) : null;
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);

                                            let dateError = null;
                                            if (d1) {
                                                if (d1 < today) {
                                                    dateError = "Outsource delivery date cannot be in the past";
                                                } else if (d2) {
                                                    d1.setHours(0, 0, 0, 0);
                                                    d2.setHours(0, 0, 0, 0);
                                                    if (d1 > d2) {
                                                        dateError = `Outsource delivery date cannot be after finish-by date (${job.job_completion_date})`;
                                                    }
                                                }
                                            }

                                            return (
                                                <div className="mt-4 rounded-2xl bg-purple-50 border border-purple-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {/* Form Header */}
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-purple-100/60 border-b border-purple-100">
                                                        <Factory className="w-3.5 h-3.5 text-purple-600" />
                                                        <h6 className="text-[10px] font-black text-purple-900 uppercase tracking-widest">OUTSOURCE — {mg.group_name}</h6>
                                                    </div>

                                                    <div className="p-4 space-y-3">
                                                        {/* Vendor */}
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">SELECT VENDOR</label>
                                                            <select
                                                                value={outsourceForm.vendor_id}
                                                                onChange={(e) => {
                                                                    const v = vendors.find(v => v._id === e.target.value);
                                                                    setOutsourceForm({ ...outsourceForm, vendor_id: e.target.value, vendor_name: v?.name || '' });
                                                                }}
                                                                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none shadow-sm focus:border-purple-400 transition-all"
                                                            >
                                                                <option value="">Select vendor...</option>
                                                                {getFilteredVendors().filter(v => {
                                                                    // If editing, allow the currently selected vendor for this specific assignment
                                                                    const currentAssignmentVendorId = outsourceMode.editIndex !== null
                                                                        ? mg.outsource_assignments?.[outsourceMode.editIndex]?.vendor_id
                                                                        : null;

                                                                    if (v._id === currentAssignmentVendorId) return true;

                                                                    // Otherwise, exclude vendors already present in OTHER assignments for this group
                                                                    const isAlreadyAssigned = mg.outsource_assignments?.some(a => a.vendor_id === v._id);
                                                                    return !isAlreadyAssigned;
                                                                }).map(v => (
                                                                    <option key={v._id} value={v._id}>{v.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Sheets + Auto UPS */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">SHEETS TO OUTSOURCE</label>
                                                                <input
                                                                    type="number"
                                                                    value={outsourceForm.outsource_sheets}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        const otherSheets = (mg.outsource_assignments || []).reduce((sum, a, idx) => {
                                                                            if (idx === outsourceMode.editIndex) return sum;
                                                                            return sum + (parseFloat(a.outsource_sheets) || 0);
                                                                        }, 0);
                                                                        const maxAllowed = totalMaterialSheets - otherSheets;
                                                                        const finalVal = Math.min(val, maxAllowed);
                                                                        setOutsourceForm({
                                                                            ...outsourceForm,
                                                                            outsource_sheets: e.target.value === '' ? '' : finalVal,
                                                                            outsource_qty: String(finalVal * upsPerSheet)
                                                                        });
                                                                    }}
                                                                    placeholder={`Max: ${totalMaterialSheets - (mg.outsource_assignments || []).reduce((sum, a, idx) => idx === outsourceMode.editIndex ? sum : sum + (parseFloat(a.outsource_sheets) || 0), 0)}`}
                                                                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">OUTPUT UPS (AUTO)</label>
                                                                <div className="w-full p-2.5 rounded-xl border border-purple-100 bg-purple-100/40 text-[11px] font-black text-purple-700">
                                                                    {autoUps > 0 ? autoUps.toLocaleString() : '—'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Rate + Date */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">RATE / MIN (₹)</label>
                                                                <input
                                                                    type="number"
                                                                    value={outsourceForm.outsource_rate}
                                                                    onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_rate: e.target.value })}
                                                                    placeholder="0.00"
                                                                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">ESTIMATED DELIVERY</label>
                                                                <input
                                                                    type="date"
                                                                    value={outsourceForm.outsource_delivery_date}
                                                                    onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_delivery_date: e.target.value })}
                                                                    className={`w-full p-2.5 rounded-xl border ${dateError ? 'border-red-400' : 'border-purple-200'} bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all`}
                                                                />
                                                                {dateError && (
                                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">{dateError}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Communication Mode */}
                                                        <div className="space-y-1 mb-3">
                                                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">NOTIFY VENDOR VIA</label>
                                                            <select
                                                                value={outsourceForm.communication_mode}
                                                                onChange={(e) => setOutsourceForm({ ...outsourceForm, communication_mode: e.target.value })}
                                                                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all shadow-sm"
                                                            >
                                                                <option value="whatsapp_and_email">WhatsApp & Email</option>
                                                                <option value="whatsapp">WhatsApp Only</option>
                                                                <option value="email">Email Only</option>
                                                            </select>
                                                        </div>

                                                        {/* Summary Line */}
                                                        {(sheets > 0 || outsourceForm.outsource_rate || outsourceForm.outsource_delivery_date) && (
                                                            <div className="px-3 py-2 rounded-xl bg-white border border-purple-100 text-[11px] font-black text-slate-500 tracking-tight">
                                                                {sheets > 0 && <span className="text-purple-700">{sheets} sheets = {autoUps.toLocaleString()} UPS</span>}
                                                                {outsourceForm.vendor_name && <span className="text-slate-400"> · {outsourceForm.vendor_name}</span>}
                                                                {outsourceForm.outsource_rate && <span className="text-slate-400"> @ ₹{outsourceForm.outsource_rate}/min</span>}
                                                                {outsourceForm.outsource_delivery_date && <span className="text-slate-400"> · Del: {outsourceForm.outsource_delivery_date}</span>}
                                                            </div>
                                                        )}

                                                        {/* Actions */}
                                                        <div className="flex gap-2 pt-1">
                                                            <button
                                                                onClick={() => setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null })}
                                                                className="flex-1 py-2.5 rounded-xl text-[9px] font-black text-purple-400 border border-purple-100 hover:bg-white transition-all"
                                                            >
                                                                CLOSE
                                                            </button>

                                                            {(() => {
                                                                const isFormInvalid = !outsourceForm.vendor_id ||
                                                                    !outsourceForm.outsource_sheets ||
                                                                    !outsourceForm.outsource_rate ||
                                                                    !outsourceForm.outsource_delivery_date ||
                                                                    !!dateError;

                                                                return (
                                                                    <button
                                                                        onClick={() => submitOutsource(mg._id || mg.group_id)}
                                                                        disabled={isFormInvalid || isSubmitting}
                                                                        className={`flex-[2] py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-lg transition-all ${(isFormInvalid || isSubmitting)
                                                                            ? 'bg-slate-300 shadow-none cursor-not-allowed opacity-60'
                                                                            : 'bg-purple-600 shadow-purple-100 hover:bg-purple-500 active:scale-95'
                                                                            }`}
                                                                    >
                                                                        {isSubmitting ? 'PROCESSING...' : '✓ CONFIRM'}
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
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

            {/* Custom Delete Confirmation Modal (DTP Style) */}
            <ConfirmationModal
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, groupId: null, index: null })}
                onConfirm={confirmRemove}
                title="Remove Vendor?"
                message="Are you sure you want to remove this outsource assignment? This action cannot be undone."
                confirmText="Remove"
                confirmColor="bg-rose-500 hover:bg-rose-600"
            />

            {/* ReassignModal removed — shifts now toggle directly */}
        </div>
    );
};

const AssignButton = ({ label, icon, onClick, isActive, activeClass, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all group ${disabled ? 'opacity-50 cursor-not-allowed border-gray-100' : (isActive ? activeClass : 'border-gray-200 bg-white shadow-sm hover:border-cyan-500 hover:shadow-md')}`}
    >
        <div>{icon}</div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-700'}`}>{label}</span>
    </button>
);

export default LaserJobDetail;
