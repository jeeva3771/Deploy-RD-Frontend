import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    MinusCircle,
    RefreshCw,
    Search,
    Filter,
    ShieldAlert,
    CheckCircle2,
    Calendar,
    Sliders,
    Box,
    Layers,
    Trash2,
    TrendingUp,
    UserCheck,
    ClipboardList
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    fetchRejectedMaterialsApi,
    fetchInventoryLogsApi,
    createRejectedMaterialDisposalApi,
    updateDisposalStatusApi,
    updateResoldStatusApi
} from '../../../../reducer/shopFloorProcessFlowReducer';
import { fetchShopFloorJobs } from '../../../../reducer/shopFloorReducer';

const Rejections = ({ isUv, department, processNames }) => {
    const dispatch = useDispatch();

    const dept = department || (isUv ? 'Print' : 'Laser');

    // Select state fields from shopFloorProcessFlow Reducer
    const { rejectedMaterials, processFlowRejections, loading } = useSelector((state) => state.shopFloorProcessFlow);
    const { jobs } = useSelector((state) => state.shopFloor);

    // Form states
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [disposalQty, setDisposalQty] = useState('');
    const [disposalMethod, setDisposalMethod] = useState('Disposed'); // Disposed, Sold, Recycled, Donated
    const [saleAmount, setSaleAmount] = useState('');
    const [authorisedBy, setAuthorisedBy] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track locally how much quantity has been disposed this session (instant updates)
    const [localDisposedQtys, setLocalDisposedQtys] = useState({});

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [salvageFilter, setSalvageFilter] = useState('ALL'); // ALL, PENDING, SOLD, RECYCLED, DONATED, DISPOSED

    // Fetch live rejected materials and process flow logs
    const fetchRejections = useCallback(async () => {
        try {
            const jobParams = processNames
                ? { process_name: processNames }
                : { department: dept };
            await Promise.all([
                dispatch(fetchShopFloorJobs(jobParams)).unwrap(),
                dispatch(fetchInventoryLogsApi()).unwrap(),
                dispatch(fetchRejectedMaterialsApi()).unwrap()
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Server error synchronizing rejections ledger");
        }
    }, [dispatch, dept, processNames]);

    useEffect(() => {
        fetchRejections();
    }, [fetchRejections]);

    // Filter by department active jobs
    const activeJobIds = useMemo(() => new Set((jobs || []).map(j => String(j._id))), [jobs]);

    const filteredRejectedMaterials = useMemo(() => {
        return (rejectedMaterials || []).filter(item => 
            activeJobIds.has(String(item.shopfloor_job_id))
        );
    }, [rejectedMaterials, activeJobIds]);

    const filteredProcessFlowRejections = useMemo(() => {
        return (processFlowRejections || []).filter(item => 
            activeJobIds.has(String(item.shopfloor_job_id))
        );
    }, [processFlowRejections, activeJobIds]);

    // ─── 3-LEVEL FLAG HIERARCHY ───────────────────────────────────────────────

    // Helper: gross net qty for the selected item (original rejections minus same-sheet recuts)
    const getGrossQty = (flowItem) => {
        if (!flowItem) return 0;
        const net = (flowItem.rejected_qty || 0) - (flowItem.recut_qty || 0);
        return net > 0 ? net : (flowItem.rejected_qty || 0);
    };

    // Helper: get the sum of quantities already disposed for this item
    const getDisposedQty = (item) => {
        if (!item) return 0;
        const dbDisposed = (rejectedMaterials || []).reduce((sum, r) => {
            if (r.flow_rejection_item_id && String(r.flow_rejection_item_id) === String(item._id)) {
                return sum + (r.net_rejected_qty || 0);
            }
            return sum;
        }, 0);
        const localDisposed = localDisposedQtys[String(item._id)] || 0;
        return Math.max(dbDisposed, localDisposed);
    };

    // Helper: get remaining quantity available for disposal
    const getRemainingQty = (item) => {
        if (!item) return 0;
        const gross = getGrossQty(item);
        const disposed = getDisposedQty(item);
        return Math.max(0, gross - disposed);
    };

    // LEAF: Is this specific rejection item disposed?
    const isItemDone = (item) => {
        if (!item) return false;
        return getRemainingQty(item) <= 0;
    };

    // GROUP: Are ALL rejection items in this flow (group) done?
    const isGroupDone = (flowId) => {
        if (!flowId) return false;
        const groupItems = processFlowRejections.filter(i => String(i.flow_id) === String(flowId));
        return groupItems.length > 0 && groupItems.every(i => isItemDone(i));
    };

    // JOB: Are ALL groups (flows) for this job done?
    const isJobDone = (jobNo) => {
        if (!jobNo) return false;
        const jobFlowIds = [...new Set(
            processFlowRejections.filter(i => i.job_no === jobNo).map(i => String(i.flow_id))
        )];
        return jobFlowIds.length > 0 && jobFlowIds.every(fid => isGroupDone(fid));
    };

    // Dropdown: show item only if item, its group, AND its job are all NOT done
    const pendingRejections = processFlowRejections.filter(item =>
        !isItemDone(item) && !isGroupDone(item.flow_id) && !isJobDone(item.job_no)
    );

    // Handle selecting a material — pre-fill to the remaining quantity
    const handleMaterialChange = (e) => {
        const id = e.target.value;
        setSelectedMaterialId(id);
        const item = processFlowRejections.find(m => m._id === id);
        if (item) {
            setDisposalQty(String(getRemainingQty(item)));
        } else {
            setDisposalQty('');
        }
    };

    // Max qty shown in the input = remaining quantity
    const selectedItem = processFlowRejections.find(m => m._id === selectedMaterialId);
    const maxDisposalQty = selectedItem ? getRemainingQty(selectedItem) : 0;

    const resetForm = () => {
        setSelectedMaterialId('');
        setDisposalQty('');
        setSaleAmount('');
        setRemarks('');
        setAuthorisedBy('');
    };

    // Handle form submission to record scrap disposal
    const handleSubmitDisposal = async (e) => {
        e.preventDefault();

        if (!selectedMaterialId) {
            toast.error("Please select a rejected material item from the dropdown");
            return;
        }

        const currentItem = processFlowRejections.find(m => m._id === selectedMaterialId);
        if (!currentItem) {
        // const selectedItem = filteredProcessFlowRejections.find(m => m._id === selectedMaterialId);
        // if (!selectedItem) {
            toast.error("Selected material record not found");
            return;
        }

        if (!authorisedBy) {
            toast.error("Please select the authoriser");
            return;
        }

        if (disposalMethod === 'Sold' && (!saleAmount || parseFloat(saleAmount) <= 0)) {
            toast.error("Please enter a valid sale amount");
            return;
        }

        const parsedQty = parseInt(disposalQty, 10);
        const availableMax = getRemainingQty(currentItem);

        if (!parsedQty || parsedQty <= 0 || isNaN(parsedQty)) {
            toast.error("Please enter a valid disposal quantity");
            return;
        }
        if (parsedQty > availableMax) {
            toast.error(`Quantity cannot exceed ${availableMax} pcs`);
            return;
        }

        // Extract shopfloor_job_id as plain ID (it may be a populated object)
        const sfJobId = currentItem.shopfloor_job_id?._id
            ? currentItem.shopfloor_job_id._id
            : currentItem.shopfloor_job_id;

        // Calculate proportional values based on split quantity
        const totalGrossQty = getGrossQty(currentItem);
        const ratio = totalGrossQty > 0 ? (parsedQty / totalGrossQty) : 1;
        const sqinLostProportional = (currentItem.sqin_lost || 0) * ratio;
        const sqftLostProportional = (currentItem.sqft_lost || 0) * ratio;
        const estLossProportional = Math.round((currentItem.est_loss || 0) * ratio);

        const payload = {
            job_no: currentItem.job_no,
            sub_job_no: currentItem.sub_job_no,
            category: currentItem.category,
            subcategory: currentItem.subcategory,
            shopfloor_job_id: sfJobId,
            group_id: currentItem.group_id,
            flow_rejection_item_id: currentItem._id, // precise leaf-level ID for flag matching
            material_name: currentItem.material_name,
            size: currentItem.size,
            rejected_qty: currentItem.rejected_qty,
            recut_qty: currentItem.recut_qty || 0,
            net_rejected_qty: parsedQty,
            sqin_lost: Math.round(sqinLostProportional),
            sqft_lost: sqftLostProportional,
            machine: currentItem.machine || "Shift 1",
            est_loss: estLossProportional,
            recut_status: currentItem.recut_status || "No - 0 pcs",
            write_off_status: currentItem.write_off_status || "Pending",
            disposal_method: disposalMethod,
            authorised_by: authorisedBy,
            remarks: remarks || "",
            sale_amount: disposalMethod === 'Sold' ? (parseFloat(saleAmount) || 0) : 0
        };

        try {
            setIsSubmitting(true);
            const res = await dispatch(createRejectedMaterialDisposalApi(payload)).unwrap();

            if (res?.success) {
                // Instantly update local quantity state for optimistic UI update
                setLocalDisposedQtys(prev => ({
                    ...prev,
                    [String(selectedMaterialId)]: (prev[String(selectedMaterialId)] || 0) + parsedQty
                }));
                toast.success(`${disposalMethod} recorded successfully!`);
                resetForm();
                await fetchRejections();
            } else {
                toast.error(res?.message || `Failed to record ${disposalMethod.toLowerCase()}`);
            }
        } catch (error) {
            console.error("Error recording salvage:", error);
            toast.error("Failed to complete salvage operation");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle the Disposal status directly via row action button
    const handleToggleDispose = async (id, currentVal) => {
        try {
            const newVal = !currentVal;
            const res = await dispatch(updateDisposalStatusApi({ id, is_dispose: newVal })).unwrap();
            if (res?.success) {
                toast.success(`Material marked as ${newVal ? 'Disposed' : 'Pending'}`);
                await fetchRejections();
            }
        } catch (error) {
            console.error("Error updating disposal status:", error);
            toast.error("Failed to update disposal status");
        }
    };

    // Toggle the Resold status directly via row action button
    const handleToggleResold = async (id, currentVal) => {
        try {
            const newVal = !currentVal;
            const res = await dispatch(updateResoldStatusApi({ id, resold: newVal })).unwrap();
            if (res?.success) {
                toast.success(`Material marked as ${newVal ? 'Resold' : 'Not Resold'}`);
                await fetchRejections();
            }
        } catch (error) {
            console.error("Error updating resale status:", error);
            toast.error("Failed to update resale status");
        }
    };



    // Calculate aggregated statistics dynamically from the Redux array
    const stats = (filteredRejectedMaterials || []).reduce((acc, curr) => {
        acc.totalScrapCost += curr.est_loss || 0;

        if (curr.resold) {
            acc.saleRevenue += curr.sale_amount || curr.est_loss || 0;
        }

        return acc;
    }, {
        totalScrapCost: 0,
        saleRevenue: 0
    });

    const netLoss = Math.max(0, stats.totalScrapCost - stats.saleRevenue);

    // Filter logic based on search and filters
    const filteredRejections = (rejectedMaterials || []).filter(item => {
        const matchesSearch =
            item.job_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sub_job_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.material_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSalvage =
            salvageFilter === 'ALL' ||
            (salvageFilter === 'PENDING' && !item.disposal_method) ||
            (salvageFilter === 'SOLD' && item.disposal_method === 'Sold') ||
            (salvageFilter === 'RECYCLED' && item.disposal_method === 'Recycled') ||
            (salvageFilter === 'DONATED' && item.disposal_method === 'Donated') ||
            (salvageFilter === 'DISPOSED' && item.disposal_method === 'Disposed');

        return matchesSearch && matchesSalvage;
    });

    const showSpinner = loading;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                        <MinusCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-[1000] text-slate-800 uppercase tracking-wider">REJECTED MATERIAL LEDGER</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            Real-time tracking of shop floor rejections, same-sheet recuts, and salvage disposal
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchRejections}
                    disabled={showSpinner}
                    className="self-start md:self-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${showSpinner ? 'animate-spin text-rose-500' : ''}`} />
                    Sync Ledger
                </button>
            </div>

            {/* Industrial Stats Widgets */}
            <div className="bg-[#0c1a2e] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex items-stretch">
                {[
                    { label: 'TOTAL SCRAP COST', value: `₹${stats.totalScrapCost}`, color: 'text-rose-400' },
                    { label: 'SALE REVENUE (SALVAGED)', value: `₹${stats.saleRevenue}`, color: 'text-emerald-400' },
                    { label: 'NET SCRAP LOSS', value: `₹${netLoss}`, color: 'text-blue-400' },
                ].map((stat, idx) => (
                    <div key={idx} className={`flex-1 p-5 flex flex-col items-center justify-center text-center border-r border-white/5 last:border-r-0 hover:bg-white/5 transition-all`}>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">{stat.label}</span>
                        <span className={`text-2xl font-[1000] ${stat.color} tracking-tighter`}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Scrap Disposal Entry Form */}
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-emerald-50 bg-emerald-50/20 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-[10px] font-[1000] text-emerald-600 uppercase tracking-widest">Scrap Disposal Register — New Entry</h4>
                </div>

                <form onSubmit={handleSubmitDisposal} className="p-6 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Select Material */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Box className="w-3 h-3 text-slate-400" /> SELECT SCRAP MATERIAL
                            </label>
                            <select
                                value={selectedMaterialId}
                                onChange={handleMaterialChange}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Select material...</option>
                                {pendingRejections.map(item => {
                                    const remaining = getRemainingQty(item);
                                    return (
                                        <option key={item._id} value={item._id}>
                                            {item.job_no} ({item.sub_job_no} - {remaining} reject qty) — {item.material_name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Quantity (PCS) — editable for split disposal */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                <span>QTY (PCS)</span>
                                {maxDisposalQty > 0 && (
                                    <span className="text-[8px] font-bold text-slate-300 normal-case tracking-normal">
                                        max {maxDisposalQty} pcs
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                value={disposalQty}
                                onChange={(e) => setDisposalQty(e.target.value)}
                                min={1}
                                max={maxDisposalQty}
                                disabled={!selectedMaterialId}
                                className={`w-full border rounded-2xl px-4 py-3 text-[11px] font-black outline-none transition-all ${selectedMaterialId
                                    ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                placeholder="Enter qty..."
                            />
                        </div>

                        {/* Disposal Method */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">METHOD</label>
                            <select
                                value={disposalMethod}
                                onChange={(e) => setDisposalMethod(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all cursor-pointer"
                            >
                                <option value="Disposed">Disposed (Godown / Scrap)</option>
                                <option value="Sold">Sold</option>
                                <option value="Recycled">Recycled</option>
                                <option value="Donated">Donated</option>
                            </select>
                        </div>

                        {/* Sale Amount (Conditionally Visible) */}
                        <div className="space-y-1.5">
                            <label className={`text-[8px] font-black uppercase tracking-widest ${disposalMethod === 'Sold' ? 'text-slate-400' : 'text-slate-300'}`}>
                                SALE AMT ₹ (IF SOLD)
                            </label>
                            <input
                                type="number"
                                value={saleAmount}
                                onChange={(e) => setSaleAmount(e.target.value)}
                                disabled={disposalMethod !== 'Sold'}
                                className={`w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] font-black text-slate-800 focus:border-emerald-400 outline-none transition-all ${disposalMethod !== 'Sold' ? 'bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}`}
                                placeholder="Enter sale amount..."
                            />
                        </div>

                        {/* Authorised By */}
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-slate-400" /> AUTHORISED BY
                            </label>
                            <select
                                value={authorisedBy}
                                onChange={(e) => setAuthorisedBy(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase focus:border-emerald-400 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Select Authoriser...</option>
                                <option value="Admin">Admin</option>
                                <option value="Production Manager">Production Manager</option>
                                <option value="Floor Supervisor">Floor Supervisor</option>
                            </select>
                        </div>

                        {/* Remarks */}
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REMARKS</label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter scrap disposal details..."
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] font-black text-slate-800 focus:border-emerald-400 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedMaterialId}
                        className={`w-full py-4 text-white text-[11px] font-[1000] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 ${!selectedMaterialId ? 'bg-slate-300 text-slate-400 shadow-none cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'}`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                        {isSubmitting ? 'RECORDING SALVAGE...' : `RECORD SCRAP DISPOSAL → ${disposalMethod === 'Disposed' ? 'DISPOSED GODOWN' :
                            disposalMethod === 'Sold' ? 'SOLD' :
                                disposalMethod === 'Recycled' ? 'RECYCLED' : 'DONATED'
                            }`}
                    </button>
                </form>
            </div>

            {/* Filter controls panel */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Job No, Sub-job, or Material..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-5 py-3 text-[11px] font-black text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-400 outline-none transition-all"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Salvage Status Filter */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 px-3 gap-2">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salvage Status:</span>
                            <select
                                value={salvageFilter}
                                onChange={(e) => setSalvageFilter(e.target.value)}
                                className="bg-transparent text-[10px] font-black text-slate-700 uppercase outline-none cursor-pointer"
                            >
                                <option value="ALL">ALL SALVAGE STATUSES</option>
                                {/* <option value="PENDING">PENDING</option> */}
                                <option value="SOLD">SOLD</option>
                                <option value="RECYCLED">RECYCLED</option>
                                <option value="DONATED">DONATED</option>
                                <option value="DISPOSED">DISPOSED</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Ledger Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[10px] font-[1000] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-4 h-4 text-rose-500" /> live rejections ledger list ({filteredRejections.length} items found)
                    </h4>
                </div>

                {showSpinner ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center bg-slate-50/10">
                        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing data fields...</p>
                    </div>
                ) : filteredRejections.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center bg-slate-50/10 border-t border-slate-50">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-4">
                            <Box className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">No matching rejected materials found</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">Try adjusting your search terms or filter constraints</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">JOB & SUB-JOB</th>
                                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">MATERIAL & SPECIFICATIONS</th>
                                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">QUANTITY BREAKDOWN</th>
                                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">AREA / EST. LOSS</th>
                                    {/* <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">WRITE-OFF STATUS</th> */}
                                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">SALVAGE STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRejections.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/30 transition-colors">
                                        {/* Job & Sub-job */}
                                        <td className="p-5">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[12px] font-[1000] text-slate-800 tracking-tight">
                                                        {item.job_no}
                                                    </span>
                                                    <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-wider">
                                                        {item.sub_job_no}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {item.timestamp
                                                        ? new Date(item.timestamp).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                        : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                        </td>

                                        {/* Material Specs */}
                                        <td className="p-5">
                                            <div className="flex flex-col space-y-1">
                                                <span className="text-[12px] font-black text-slate-700 uppercase">
                                                    {item.material_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400">
                                                        Size: {item.size}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {item.machine || 'Shift 1'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Quantity Breakdown */}
                                        <td className="p-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="text-center bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl min-w-[50px]">
                                                    <span className="text-[8px] font-black text-rose-500 uppercase block leading-none mb-1">REJ</span>
                                                    <span className="text-[11px] font-black text-rose-600">{item.net_rejected_qty}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Area & Est Loss */}
                                        <td className="p-5 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-700">
                                                    {item.sqft_lost?.toFixed(1) || 0} Sq.in
                                                </span>
                                                <span className="text-[9px] font-black text-rose-500 mt-0.5">
                                                    Est. ₹{item.est_loss || 0}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Write-off Status */}
                                        {/* <td className="p-5 text-center">
                                            {(() => {
                                                const isAuthorized = item.write_off_status?.toLowerCase() === 'authorized';
                                                return (
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isAuthorized
                                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                                                            : 'bg-amber-50 border border-amber-200 text-amber-600 animate-pulse'
                                                        }`}>
                                                        {isAuthorized ? (
                                                            <>
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                Authorized
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShieldAlert className="w-3 h-3 text-amber-500" />
                                                                Pending
                                                            </>
                                                        )}
                                                    </span>
                                                );
                                            })()}
                                        </td> */}

                                        {/* SALVAGE STATUS — read-only badge */}
                                        <td className="p-5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {(() => {
                                                    const method = item.disposal_method;
                                                    if (method === 'Sold') return (
                                                        <>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-600">
                                                                <TrendingUp className="w-3 h-3" />
                                                                Sold
                                                            </span>
                                                            {item.sale_amount > 0 && (
                                                                <span className="text-[11px] font-black text-emerald-600">
                                                                    ₹{item.sale_amount.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                    if (method === 'Recycled') return (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-50 border border-cyan-200 text-cyan-600">
                                                            <RefreshCw className="w-3 h-3" />
                                                            Recycled
                                                        </span>
                                                    );
                                                    if (method === 'Donated') return (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-50 border border-violet-200 text-violet-600">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Donated
                                                        </span>
                                                    );
                                                    if (method === 'Disposed') return (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-600">
                                                            <Trash2 className="w-3 h-3" />
                                                            Disposed (Godown / Scrap)
                                                        </span>
                                                    );
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500">
                                                            Pending
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rejections;
