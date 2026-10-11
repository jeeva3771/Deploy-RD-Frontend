import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Clock, AlertTriangle, RefreshCw, Sparkles, Send, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { axiosInstance } from '../../../../utils/url/config';
import {
    fetchExtraMaterialEMRListThunk,
    submitExtraMaterialEMRThunk,
    confirmEMRReceiptThunk,
    approveExtraMaterialEMRThunk,
    rejectExtraMaterialEMRThunk
} from '../../../../reducer/shopFloorEMRReducer';

const ExtraMaterial = ({ isUv, department, processNames }) => {
    const dispatch = useDispatch();

    const dept = department || (isUv ? 'Print' : 'Laser');

    // Form state
    const [jobs, setJobs] = useState([]);
    const [emrs, setEmrs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [loadingEmrs, setLoadingEmrs] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoadingEmrId, setActionLoadingEmrId] = useState(null);
    const [selectedEmrForMaterialsModal, setSelectedEmrForMaterialsModal] = useState(null);

    const [selectedJobId, setSelectedJobId] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');

    const [qty, setQty] = useState('');
    const [unit, setUnit] = useState(dept === 'Print' ? 'pcs' : 'sheets');
    const [urgent, setUrgent] = useState(false);
    const [reason, setReason] = useState(dept === 'Print' ? 'Print alignment / offset issue' : 'Cut failed / sheet damaged');

    useEffect(() => {
        setUnit(dept === 'Print' ? 'pcs' : 'sheets');
        setReason(dept === 'Print' ? 'Print alignment / offset issue' : 'Cut failed / sheet damaged');
    }, [dept]);

    // Fetch active jobs & EMR list
    const fetchData = useCallback(async () => {
        try {
            setLoadingJobs(true);
            setLoadingEmrs(true);

            const jobParams = processNames
                ? { process_name: processNames }
                : { department: dept };
            const jobsResponse = await axiosInstance.get('/shop-floor/jobs', { params: jobParams });
            if (jobsResponse.data?.success) {
                // Filter jobs that are not completely completed
                const activeJobs = (jobsResponse.data.data || []).filter(j => j.status !== 'Completed');
                setJobs(activeJobs);
            }

            const emrsResponse = await dispatch(fetchExtraMaterialEMRListThunk({ department: dept })).unwrap();
            if (emrsResponse?.success) {
                setEmrs(emrsResponse.data || []);
            }
        } catch (error) {
            console.error("fetchData error:", error);
            toast.error("Failed to load active jobs or EMR ledger");
        } finally {
            setLoadingJobs(false);
            setLoadingEmrs(false);
        }
    }, [dispatch, dept, processNames]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Get selected job details
    const selectedJob = jobs.find(j => j._id === selectedJobId);
    const materialGroups = selectedJob?.material_groups || [];
    const selectedGroup = materialGroups.find(g => (g._id || g.group_id) === selectedGroupId);

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedJobId) {
            toast.warn("Please select an active Job");
            return;
        }
        if (!selectedGroupId) {
            toast.warn("Please select a Material / Group");
            return;
        }
        if (!qty || parseFloat(qty) <= 0) {
            toast.warn("Please enter a valid quantity greater than zero");
            return;
        }

        try {
            setSubmitting(true);

            // Extract materials details for the EMR
            const payloadMaterials = (selectedGroup?.materials || []).map(m => ({
                material_name: m.material_name || m.name || selectedGroup.group_name || "Unknown Material",
                material_id: m.material_id || m._id || m.item_id || null
            }));

            // Sheet size extraction
            const mainMat = selectedGroup?.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            });
            const sheetSize = mainMat?.material_input?.size || mainMat?.size || "Standard";

            const payload = {
                shopfloor_job_id: selectedJobId,
                group_id: selectedGroupId,
                sheet_size: sheetSize,
                qty: parseFloat(qty),
                unit,
                urgent,
                reason,
                materials: payloadMaterials
            };

            const response = await dispatch(submitExtraMaterialEMRThunk(payload)).unwrap();
            if (response?.success) {
                toast.success("Extra Material EMR raised successfully!");
                // Reset form
                setSelectedJobId('');
                setSelectedGroupId('');
                setQty('');
                setUnit(isUv ? 'pcs' : 'sheets');
                setUrgent(false);
                setReason(isUv ? 'Print alignment / offset issue' : 'Cut failed / sheet damaged');
                // Reload list
                fetchData();
            } else {
                toast.error(response?.message || "Failed to submit request");
            }
        } catch (error) {
            console.error("handleSubmit error:", error);
            toast.error(error.message || "Server error raising manual EMR");
        } finally {
            setSubmitting(false);
        }
    };

    // Confirm receipt handler
    const handleConfirmReceipt = async (emrId) => {
        if (actionLoadingEmrId) return;
        try {
            setActionLoadingEmrId(emrId);
            const response = await dispatch(confirmEMRReceiptThunk(emrId)).unwrap();
            if (response?.success) {
                toast.success("Confirmed receipt of extra material!");
                fetchData();
            } else {
                toast.error(response?.message || "Failed to confirm receipt");
            }
        } catch (error) {
            console.error("handleConfirmReceipt error:", error);
            toast.error("Error receiving material: " + (error.message || error));
        } finally {
            setActionLoadingEmrId(null);
        }
    };

    // Approve EMR handler
    const handleApproveEMR = async (emrId) => {
        if (actionLoadingEmrId) return;
        try {
            setActionLoadingEmrId(emrId);
            const response = await dispatch(approveExtraMaterialEMRThunk(emrId)).unwrap();
            if (response?.success) {
                toast.success("Extra material request approved!");
                fetchData();
            } else {
                toast.error(response?.message || "Failed to approve request");
            }
        } catch (error) {
            console.error("handleApproveEMR error:", error);
            toast.error("Error approving request: " + (error.message || error));
        } finally {
            setActionLoadingEmrId(null);
        }
    };

    // Reject EMR handler
    const handleRejectEMR = async (emrId) => {
        if (actionLoadingEmrId) return;
        try {
            setActionLoadingEmrId(emrId);
            const response = await dispatch(rejectExtraMaterialEMRThunk(emrId)).unwrap();
            if (response?.success) {
                toast.success("Extra material request rejected!");
                fetchData();
            } else {
                toast.error(response?.message || "Failed to reject request");
            }
        } catch (error) {
            console.error("handleRejectEMR error:", error);
            toast.error("Error rejecting request: " + (error.message || error));
        } finally {
            setActionLoadingEmrId(null);
        }
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Top section: Header & manual trigger */}
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-purple-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <h4 className="text-[11px] font-[1000] text-purple-600 uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-4 h-4" /> RAISE EXTRA MATERIAL REQUISITION (EMR)
                        </h4>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-purple-600"
                        title="Reload Ledger"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 bg-purple-50/10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                        {/* Job Select */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">ACTIVE SHOPFLOOR JOB</label>
                            <select
                                value={selectedJobId}
                                onChange={(e) => {
                                    setSelectedJobId(e.target.value);
                                    setSelectedGroupId('');
                                }}
                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-[12px] font-black text-slate-800 uppercase focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none shadow-sm transition-all"
                            >
                                <option value="">Select active job...</option>
                                {jobs.map(j => (
                                    <option key={j._id} value={j._id}>
                                        {j.job_no} {j.sub_job_no ? `(${j.sub_job_no})` : ''} — {j.client_name || 'No Client'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Material/Group Select */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">MATERIAL GROUP / LINE ITEM</label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                disabled={!selectedJobId}
                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-[12px] font-black text-slate-800 uppercase focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select material...</option>
                                {materialGroups.map(g => (
                                    <option key={g._id || g.group_id} value={g._id || g.group_id}>
                                        {g.group_name || 'Standard Group'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Qty Input */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">QTY REQD</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="e.g. 5"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-[12px] font-black text-slate-800 uppercase focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none shadow-sm transition-all"
                            />
                        </div>

                        {/* Unit & Urgency Checkbox */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">UNIT & URGENCY</label>
                            <div className="flex items-center gap-4">
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="flex-1 bg-white border border-purple-100 rounded-2xl px-5 py-4 text-[12px] font-black text-slate-800 uppercase focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none shadow-sm transition-all"
                                >
                                    <option value="sheets">sheets</option>
                                    <option value="pcs">pieces</option>
                                </select>
                                <label className="flex items-center gap-3 cursor-pointer group select-none">
                                    <input
                                        type="checkbox"
                                        checked={urgent}
                                        onChange={(e) => setUrgent(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-purple-200 text-purple-500 focus:ring-purple-400 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-[1000] text-rose-500 uppercase tracking-tight group-hover:text-rose-600 transition-colors">Urgent</span>
                                </label>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">REASON FOR EXTRA MATERIAL</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-[12px] font-black text-slate-800 uppercase focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none shadow-sm transition-all"
                            >
                                {isUv ? (
                                    <>
                                        <option value="Print alignment / offset issue">Print alignment / offset issue</option>
                                        <option value="Ink smudging / curing failure">Ink smudging / curing failure</option>
                                        <option value="Substrate defect / scratches">Substrate defect / scratches</option>
                                        <option value="Operator mistake / design error">Operator mistake / design error</option>
                                        <option value="Other / custom">Other / custom reason</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Cut failed / sheet damaged">Cut failed / sheet damaged</option>
                                        <option value="Warped substrate / material defect">Warped substrate / material defect</option>
                                        <option value="CNC/Laser burning / scorch marks">CNC/Laser burning / scorch marks</option>
                                        <option value="Operator mistake / mismeasurement">Operator mistake / mismeasurement</option>
                                        <option value="Other / custom">Other / custom reason</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !selectedJobId || !selectedGroupId}
                        className={`w-full py-5 text-[12px] font-[1000] uppercase tracking-[0.25em] rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${(!selectedJobId || !selectedGroupId)
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200 hover:shadow-purple-300'
                            }`}
                    >
                        {submitting ? (
                            <>Raising EMR...</>
                        ) : (
                            <>
                                <Send className="w-4 h-4" /> SUBMIT EXTRA MATERIAL REQUISITION
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Bottom section: Ledger Dashboard */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" /> EXTRA MATERIAL LEDGER — {emrs.length} REQUESTS RAISED
                    </h3>
                </div>

                {loadingEmrs ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading EMR records...</p>
                    </div>
                ) : emrs.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">No extra material requests raised yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">JOB / CLIENT</th>
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">MATERIAL GROUP</th>
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">SPECS</th>
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">REASON</th>
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {emrs.map((emr) => (
                                        <tr key={emr._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-slate-800">
                                                        {emr.job_no} {emr.sub_job_no !== 'N/A' ? `(${emr.sub_job_no})` : ''}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        Category: {emr.category || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-slate-700">
                                                        {emr.materials?.[0]?.material_name || "Unspecified Material"}
                                                    </span>
                                                    {emr.materials?.length > 1 && (
                                                        <button
                                                            onClick={() => setSelectedEmrForMaterialsModal(emr)}
                                                            className="text-[9px] font-[900] text-indigo-500 hover:text-indigo-700 hover:underline uppercase tracking-wide cursor-pointer text-left focus:outline-none focus:ring-0 active:scale-95 transition-all mt-0.5"
                                                        >
                                                            + {emr.materials.length - 1} other materials in group
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12px] font-black text-slate-800">
                                                            {emr.qty} {emr.unit}
                                                        </span>
                                                        {emr.urgent && (
                                                            <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                                                URGENT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        Size: {emr.sheet_size}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[11px] font-bold text-slate-600 block max-w-xs truncate" title={emr.reason}>
                                                    {emr.reason}
                                                </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                {(() => {
                                                    let badgeStyle = "bg-slate-100 text-slate-500";
                                                    if (emr.status === 'PENDING') badgeStyle = "bg-amber-50 text-amber-600 border border-amber-200/50";
                                                    if (emr.status === 'APPROVED') badgeStyle = "bg-blue-50 text-blue-600 border border-blue-200/50";
                                                    if (emr.status === 'ISSUED') badgeStyle = "bg-purple-50 text-purple-600 border border-purple-200/50";
                                                    if (emr.status === 'RECEIVED') badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
                                                    if (emr.status === 'REJECTED') badgeStyle = "bg-rose-50 text-rose-600 border border-rose-200/50";

                                                    return (
                                                        <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                                                            {emr.status}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5 text-center">
                                                {emr.status === 'PENDING' ? (
                                                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                                        <Clock className="w-4 h-4 animate-pulse" /> Pending Approval
                                                    </span>
                                                ) : emr.status === 'ISSUED' || emr.status === 'APPROVED' ? (
                                                    <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                                        <Clock className="w-4 h-4 animate-pulse" /> Awaiting Handover
                                                    </span>
                                                ) : emr.status === 'RECEIVED' ? (
                                                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                                        <Check className="w-4 h-4" /> Received
                                                    </span>
                                                ) : emr.status === 'REJECTED' ? (
                                                    <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                                        <X className="w-4 h-4" /> Rejected
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for listing all materials in the group */}
            {selectedEmrForMaterialsModal && (
                <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    Materials in Group
                                </h4>
                                <p className="text-xs font-black text-slate-700 uppercase mt-0.5">
                                    {selectedEmrForMaterialsModal.job_no} — {selectedEmrForMaterialsModal.category || 'Requisition'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEmrForMaterialsModal(null)}
                                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Materials List */}
                        <div className="p-6 max-h-[300px] overflow-y-auto space-y-3">
                            {selectedEmrForMaterialsModal.materials?.map((mat, idx) => (
                                <div
                                    key={mat.material_id || idx}
                                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-all"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-black text-indigo-600">{idx + 1}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 uppercase leading-snug break-all">
                                        {mat.material_name || "Unknown Material"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedEmrForMaterialsModal(null)}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shadow-slate-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtraMaterial;
