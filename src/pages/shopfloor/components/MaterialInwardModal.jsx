import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Package, Clock, LayoutGrid, Activity, User, ClipboardCheck, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchAllUsers } from '../../../reducer/userReducer';
import { recordMaterialInward, fetchShopFloorJobs } from '../../../reducer/shopFloorReducer';
import { axiosInstance } from '../../../utils/url/config';
import { toast } from 'react-toastify';

const MaterialInwardModal = ({ isOpen, onClose, job, materialGroup, floor, hideCutTime }) => {
    const dispatch = useDispatch();
    const { users: reduxUsers } = useSelector(state => state.user);

    const users = useMemo(() => {
        if (!floor) return reduxUsers;
        const floorRoles = [
            ...(floor.operators || []).map(o => String(o.name || o || '').toLowerCase()),
            ...(floor.supervisors || []).map(s => String(s.name || s || '').toLowerCase())
        ];
        return reduxUsers.filter(u => {
            const roleName = String(u.role?.name || u.role || '').toLowerCase();
            return floorRoles.includes(roleName);
        });
    }, [reduxUsers, floor]);

    const [broughtInBy, setBroughtInBy] = useState('');
    const [remarks, setRemarks] = useState('');
    const [inspectQty, setInspectQty] = useState(0);
    const [goodQty, setGoodQty] = useState(0);
    const [badQty, setBadQty] = useState(0);
    const [qtyError, setQtyError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reprocess job states
    const [materialSource, setMaterialSource] = useState(null); // 'local' or 'store'
    const [shopFloorStock, setShopFloorStock] = useState(0);
    const [shopFloorItem, setShopFloorItem] = useState(null);
    const [fetchingSF, setFetchingSF] = useState(false);
    const [activeEMR, setActiveEMR] = useState(null);
    const [groupEMRs, setGroupEMRs] = useState([]);
    const [confirmingReceiptId, setConfirmingReceiptId] = useState(null);
    const [fetchingReq, setFetchingReq] = useState(false);
    const [showRaiseForm, setShowRaiseForm] = useState(false);
    const [reqQty, setReqQty] = useState('');
    const [reqRemarks, setReqRemarks] = useState('');
    const [raisingReq, setRaisingReq] = useState(false);

    const isUv = job?.department === 'Print' || job?.department === 'UV Printing';
    const isAssembly = job?.department?.toLowerCase().includes('assembly') || job?.process_name?.toLowerCase().includes('assembly');
    const sheetIssueStatus = materialGroup?.sheet_issue_status || [];

    // Get main material info
    const mainMat = materialGroup?.materials?.find(m => {
        const cat = m.category_type?.toLowerCase() || '';
        return !cat.includes('consumable') && !cat.includes('hardware');
    });

    const bom = job?.bom_id;
    let processesList = [];
    if (bom && bom.materialprocess) {
        const processGroup = bom.materialprocess.find(p =>
            p.material_group_name?.toLowerCase().trim() === materialGroup?.group_name?.toLowerCase().trim() ||
            String(p.material_group_id) === String(materialGroup?.group_id || materialGroup?._id)
        );
        if (processGroup) {
            processesList = processGroup.processes || [];
        }
    }
    const cuttingIndex = processesList.findIndex(p =>
        p.process_name?.toLowerCase().includes("laser") ||
        p.process_name?.toLowerCase().includes("cutting") ||
        p.process_name?.toLowerCase().includes("cut")
    );
    const currentProcessIndex = processesList.findIndex(p =>
        p.process_name?.toLowerCase().trim() === job?.process_name?.toLowerCase().trim()
    );
    const isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
    const isSheetMaterial = mainMat?.material_type?.toLowerCase() === 'sheet';
    const size = mainMat?.material_input?.size || (mainMat?.material_input?.length ? `${mainMat.material_input.length}X${mainMat.material_input.width}` : '18X12IN');
    const ups = mainMat?.material_input?.ups || materialGroup?.ups || 80;
    const totalSheets = mainMat?.quantity ?? materialGroup?.sheets_required ?? (job?.total_qty ? (ups > 0 ? Math.ceil(job.total_qty / ups) : job.total_qty) : 0);
    const outsourcedSheets = materialGroup?.assigned_outsource_sheets || 0;
    const sheetsReqd = materialGroup?.inhouse_qty !== undefined ? materialGroup.inhouse_qty : Math.max(0, totalSheets - outsourcedSheets);
    const firstIssueStatus = sheetIssueStatus?.[0];
    // For UV Printing, Assembly, or non-sheet/subsequent processes, inwarding/processing is piece-based ('pcs')
    const isTargetSheet = firstIssueStatus?.unit ? (firstIssueStatus.unit === 'sh') : (isSheetMaterial && !isSubsequent && !isUv && !isAssembly);

    // In-house target calculation:
    // When 100 pcs out of 200 total_qty are outsourced, inhouse target is 100 pcs.
    const assignedOutsourceUps = materialGroup?.assigned_outsource_ups || (outsourcedSheets * ups);
    const computedTarget = isUv
        ? Math.max(0, (job?.total_qty || (totalSheets * ups)) - assignedOutsourceUps)
        : (isTargetSheet ? sheetsReqd : (isSheetMaterial ? sheetsReqd * ups : sheetsReqd));

    const unitLabel = firstIssueStatus?.unit || (isTargetSheet ? 'sh' : 'pcs');
    const targetQty = (unitLabel === 'sh')
        ? (firstIssueStatus?.required_qty ?? sheetsReqd)
        : (firstIssueStatus?.target_qty ?? (firstIssueStatus?.required_qty ?? computedTarget));
    const totalOutput = firstIssueStatus?.target_qty ?? (isTargetSheet ? sheetsReqd * ups : targetQty);

    const cutTimePerSheet = Number(materialGroup?.input?.actual_input);
    const totalCutTime = cutTimePerSheet * Number(sheetsReqd);

    const inwardLogs = materialGroup?.inward_history || [];
    const totalReceived = inwardLogs.reduce((acc, log) => acc + (log.inspect_qty || 0), 0);
    const totalGood = inwardLogs.reduce((acc, log) => acc + (log.good_qty || 0), 0);
    const totalBad = inwardLogs.reduce((acc, log) => acc + (log.bad_qty || 0), 0);

    const fetchReprocessStatus = useCallback(async () => {
        if (!isOpen || !job?.is_reprocess || isSubsequent) return;

        setFetchingSF(true);
        setFetchingReq(true);

        const dept = floor?.name || (isUv ? 'Print' : 'Laser');
        const matName = materialGroup?.group_name || '';

        try {
            const sfRes = await axiosInstance.get(`/shop-floor/inventory?shopfloor_name=${dept}&search=${encodeURIComponent(matName)}`);
            if (sfRes.data?.success && sfRes.data.data) {
                const exactMatch = sfRes.data.data.find(item =>
                    item.name?.toLowerCase().trim() === matName.toLowerCase().trim()
                ) || sfRes.data.data[0];

                if (exactMatch) {
                    setShopFloorItem(exactMatch);
                    let availableStock = exactMatch.stock || 0;
                    if (exactMatch.item_type === 'sheet' && size) {
                        const norm = s => (s || '').toLowerCase().replace(/\s+/g, '');
                        const targetSize = norm(size);
                        const matchedSz = exactMatch.stock_sizes?.find(sz => {
                            if (!sz) return false;
                            if (typeof sz === 'object') {
                                return norm(sz.size) === targetSize || norm(`${sz.width}x${sz.height}`) === targetSize;
                            }
                            return false;
                        });
                        if (matchedSz) {
                            const sizeStock = exactMatch.size_wise_stock?.find(s => String(s.size_id) === String(matchedSz._id));
                            if (sizeStock) {
                                availableStock = sizeStock.count || 0;
                            } else {
                                availableStock = 0;
                            }
                        }
                    }
                    setShopFloorStock(availableStock);
                } else {
                    setShopFloorStock(0);
                    setShopFloorItem(null);
                }
            }
        } catch (err) {
            console.error("Error fetching shop floor inventory:", err);
        } finally {
            setFetchingSF(false);
        }

        try {
            const reqRes = await axiosInstance.get(`/shop-floor/requisitions?shopfloor_job_id=${job._id}&group_id=${materialGroup._id || materialGroup.group_id}`);
            if (reqRes.data?.success && reqRes.data.data) {
                const groupReqs = reqRes.data.data;
                setGroupEMRs(groupReqs);
                if (groupReqs.length > 0) {
                    groupReqs.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
                    const latest = groupReqs[0];
                    setActiveEMR(latest);

                    const hasActive = groupReqs.some(r => r.status === 'PENDING' || r.status === 'PARTIAL' || r.status === 'ISSUED');
                    if (hasActive) {
                        setMaterialSource('store');
                    }
                } else {
                    setActiveEMR(null);
                }
            }
        } catch (err) {
            console.error("Error fetching requisitions:", err);
        } finally {
            setFetchingReq(false);
        }
    }, [isOpen, job, isSubsequent, isUv, materialGroup, size, floor]);

    useEffect(() => {
        if (isOpen) {
            if (floor) {
                const floorRoles = [
                    ...(floor.operators || []).map(o => String(o.name || o || '')),
                    ...(floor.supervisors || []).map(s => String(s.name || s || ''))
                ].filter(Boolean);
                if (floorRoles.length > 0) {
                    dispatch(fetchAllUsers({ limit: 100, roleName: floorRoles.join(',') }));
                } else {
                    dispatch(fetchAllUsers({ limit: 100 }));
                }
            } else {
                const isAssembly = job?.department?.toLowerCase().includes('assembly');
                const deptName = isUv ? 'UV Printing' : (isAssembly ? 'Assembly' : 'Laser');
                const roleName = isUv ? 'UV Printing Operator' : (isAssembly ? 'Assembly Technician,Assembly Foreman' : 'Laser Cutting Operator');
                dispatch(fetchAllUsers({ limit: 100, departmentName: deptName, roleName: roleName }));
            }
        }
    }, [isOpen, dispatch, isUv, floor, job?.department]);

    useEffect(() => {
        if (isOpen && job?.is_reprocess && !isSubsequent) {
            fetchReprocessStatus();
            setMaterialSource(null);
            setShowRaiseForm(false);
            setReqQty('');
            setReqRemarks('');
        }
    }, [isOpen, job, isSubsequent, fetchReprocessStatus]);

    const handleRaiseStoreRequisition = async () => {
        const remainingNeeded = Math.max(0, targetQty - totalGood);
        const qtyToRequest = reqQty ? Number(reqQty) : remainingNeeded;
        if (qtyToRequest <= 0) {
            toast.warn("Please enter a valid quantity.");
            return;
        }
        setRaisingReq(true);
        try {
            // Find all materials in the group that are NOT consumables or hardware
            const reqMaterials = materialGroup?.materials?.filter(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            }) || [];

            // Fallback to the first material if none matched the filter
            const targetMaterials = reqMaterials.length > 0 ? reqMaterials : [materialGroup?.materials?.[0]];
            const primaryMat = targetMaterials[0];
            const itemIdStr = primaryMat?.item_id || primaryMat?.material_id || primaryMat?._id || "";

            const payload = {
                type: 'Reprocess',
                category: 'BOM Material',
                job_no: job.sub_job_no || job.job_no,
                shopfloor_job_id: job._id,
                group_id: materialGroup._id || materialGroup.group_id,
                item_description: primaryMat?.material_name || materialGroup.group_name || "Unknown Material",
                qty: qtyToRequest,
                reprocess_job_qty: job.total_qty || undefined,
                unit: unitLabel === 'sh' ? 'sheets' : 'pcs',
                urgent: false,
                remarks: reqRemarks || "Reprocess request from inward modal",
                department: floor?.name || job?.department || (isUv ? 'Print' : 'Laser'),
                item_id: itemIdStr,
                size_name: size
            };

            const res = await axiosInstance.post('/shop-floor/requisitions', payload);
            if (res.data?.success) {
                toast.success("Material requisition raised successfully!");
                setShowRaiseForm(false);
                fetchReprocessStatus(); // refresh states
            } else {
                toast.error(res.data?.message || "Failed to raise requisition request");
            }
        } catch (error) {
            console.error("Error raising requisition:", error);
            toast.error(error.response?.data?.message || "Error raising requisition request");
        } finally {
            setRaisingReq(false);
        }
    };

    const handleConfirmEMRReceipt = async (id, isRequisition) => {
        setConfirmingReceiptId(id);
        try {
            let res;
            if (isRequisition) {
                res = await axiosInstance.put(`/shop-floor/requisitions/${id}/status`, { status: 'RECEIVED' });
            } else {
                res = await axiosInstance.post(`/shop-floor/emr/${id}/receive`);
            }
            if (res.data?.success) {
                toast.success("Material receipt confirmed successfully!");
                fetchReprocessStatus();
            } else {
                toast.error(res.data?.message || "Failed to confirm receipt");
            }
        } catch (error) {
            console.error("Error confirming receipt:", error);
            toast.error("Failed to confirm receipt");
        } finally {
            setConfirmingReceiptId(null);
        }
    };

    if (!isOpen) return null;

    // Compute dynamic pendingSheets, allSheetsIssued, waitingForStore
    const pendingSheets = (job?.is_reprocess && !isSubsequent)
        ? (materialSource === 'local'
            ? Math.min(shopFloorStock, Math.max(0, targetQty - totalGood))
            : (materialGroup?.max_inspectable_qty ?? Math.max(0, targetQty - totalGood)))
        : (materialGroup?.max_inspectable_qty ?? Math.max(0, targetQty - totalGood));

    const allSheetsIssued = (job?.is_reprocess && !isSubsequent)
        ? (materialSource === 'local' ? true : (materialGroup?.all_sheets_issued ?? true))
        : (materialGroup?.all_sheets_issued ?? true);

    const jobFullyComplete = totalGood >= targetQty;

    const hasActiveEMRs = groupEMRs.some(r => r.status === 'PENDING' || r.status === 'PARTIAL' || r.status === 'ISSUED');

    const waitingForStore = (job?.is_reprocess && !isSubsequent)
        ? (materialSource === 'store' && hasActiveEMRs)
        : (!jobFullyComplete && pendingSheets === 0);
    const stats = [
        { label: 'ALLOCATED', value: `${targetQty} ${unitLabel}`, color: 'text-white' },
        { label: 'RECEIVED', value: `${totalReceived} ${unitLabel}`, color: 'text-teal-400' },
        { label: 'GOOD ✓', value: `${totalGood} ${unitLabel}`, color: 'text-teal-400' },
        { label: 'BAD / REJ ✘', value: `${totalBad} ${unitLabel}`, color: 'text-slate-500' },
        { label: 'GOOD PENDING', value: `${targetQty - totalGood} ${unitLabel}`, color: 'text-amber-400' },
    ];

    const qcTotal = Number(goodQty) + Number(badQty);
    const isQcValid = inspectQty > 0 && qcTotal === Number(inspectQty);
    const isUnlocked = materialGroup?.sampling_on ? true : (materialGroup?.is_unlocked !== false);
    const canSubmit = !job?.is_hold && isUnlocked && allSheetsIssued && broughtInBy !== '' && inspectQty > 0 && (Number(goodQty) > 0 || Number(badQty) > 0) && inspectQty <= pendingSheets && !qtyError && isQcValid;

    const selectedUser = users.find(u => u._id === broughtInBy);
    const operatorName = selectedUser?.username || '';

    const handleRecordInward = async () => {
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);
        const operatorObj = users.find(u => u._id === broughtInBy);

        const payload = {
            material_group_id: materialGroup._id || materialGroup.group_id,
            material_name: materialGroup.group_name,
            size: size,
            inspect_qty: Number(inspectQty),
            good_qty: Number(goodQty),
            bad_qty: Number(badQty),
            operator_id: broughtInBy,
            operator_name: operatorObj?.username || operatorObj?.name || 'Unknown',
            remarks: remarks,
            timestamp: new Date().toISOString(),
            consume_local: job?.is_reprocess && materialSource === 'local' ? true : undefined
        };

        console.log("handleRecordInward - Submitting payload:", payload);

        try {
            await dispatch(recordMaterialInward({ id: job._id, payload })).unwrap();
            dispatch(fetchShopFloorJobs());

            // Reset form on success
            setInspectQty(0);
            setGoodQty(0);
            setBadQty(0);
            setBroughtInBy('');
            setRemarks('');
            setQtyError('');
            if (job?.is_reprocess) {
                fetchReprocessStatus();
            }
        } catch (error) {
            console.error('Failed to record inward:', error);
            alert('Failed to record inward. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto transition-all duration-300">
            <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col my-auto overflow-hidden transition-all duration-300 transform scale-100">
                <style>
                    {`
                    .custom-modal-scroll::-webkit-scrollbar {
                        width: 6px !important;
                        display: block !important;
                    }
                    .custom-modal-scroll::-webkit-scrollbar-track {
                        background: transparent !important;
                    }
                    .custom-modal-scroll::-webkit-scrollbar-thumb {
                        background: #cbd5e1 !important;
                        border-radius: 10px !important;
                    }
                    .custom-modal-scroll::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8 !important;
                        }
                    `}
                </style>
                {/* Header */}
                <div className="bg-[#f3a638] p-4 sm:p-5 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <X className="w-5 h-5 opacity-60" />
                    </button>
                    <div className="flex items-start justify-between gap-3 mb-3 pr-8">
                        <div className="flex items-start gap-2.5">
                            <div className="mt-1">
                                <Package className="w-5 h-5 text-slate-800" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">MATERIAL INWARD & QC INSPECTION</h2>
                                    {materialGroup?.sampling_on && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-fuchsia-100 border border-fuchsia-200 rounded-lg shrink-0">
                                            <span className="text-[9px] font-black text-fuchsia-800 uppercase tracking-widest leading-none">SAMPLE PCS</span>
                                        </div>
                                    )}
                                    {job?.is_escalated && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-rose-200 rounded-lg animate-pulse-red shrink-0">
                                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                                            <span className="text-[9px] font-black text-rose-900 uppercase tracking-widest leading-none">Job Escalated</span>
                                        </div>
                                    )}
                                    {job?.is_hold && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg animate-pulse">
                                            <Clock className="w-3 h-3 text-amber-600" />
                                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest leading-none">On Hold</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] font-black text-slate-800/40 uppercase tracking-widest">JOB NO —</span>
                                    <span className="text-[11px] font-black text-slate-900 tracking-tight">{job?.job_no}/{job?.sub_job_no}</span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {!isUv ? (
                        <div className="bg-white/95 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 grid grid-cols-3 gap-y-2 gap-x-3 sm:gap-x-6 shadow-sm border border-white/20">
                            <InfoItem label="MATERIAL" value={materialGroup?.group_name || 'Aluminium Sheet'} />
                            <InfoItem label="SHEET" value={size} />
                            <InfoItem label="UPS / SHEET" value={`${ups} PCS`} />
                            <InfoItem label="TOTAL OUTPUT" value={`${totalOutput} PCS`} />
                            <InfoItem label="SHEETS REQD" value={`${sheetsReqd} SHEETS`} />
                            {!hideCutTime && <InfoItem label="CUT TIME / SHEET" value={cutTimePerSheet} />}
                            {!hideCutTime && <InfoItem label="TOTAL CUT TIME" value={totalCutTime} />}
                        </div>
                    ) : (
                        <div className="bg-white/95 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 grid grid-cols-3 gap-y-2 gap-x-3 sm:gap-x-6 shadow-sm border border-white/20">
                            <InfoItem label="MATERIAL" value={materialGroup?.group_name || 'Aluminium Sheet'} />
                            <InfoItem label="SIZE" value={size} />
                            <InfoItem label={unitLabel === 'sh' ? 'TOTAL SHEETS' : 'TOTAL PCS'} value={unitLabel === 'sh' ? `${targetQty} SHEETS` : `${totalOutput} PCS`} />
                            {materialGroup?.sides > 1 && (
                                <InfoItem label="SIDES" value={`${materialGroup.sides} SIDES`} />
                            )}
                        </div>
                    )}

                    <div className="px-1 mt-2">
                        <span className="text-[10px] sm:text-[11px] font-black text-amber-950 uppercase tracking-widest truncate block">
                            {materialGroup?.group_name} • {size} {materialGroup?.sides > 1 ? ` • ${materialGroup.sides} SIDES` : ''}
                        </span>
                    </div>
                </div>

                {/* Content Area - Scrollable */}
                <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-5 flex-1 min-h-0 overflow-y-auto custom-modal-scroll">
                    {sheetIssueStatus.length > 0 && !jobFullyComplete && (
                        <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-white/5">
                            <div className="bg-[#193472] rounded-2xl overflow-hidden border border-white/5 p-3.5 sm:p-4 flex items-center justify-center shadow-lg">
                                <span className="text-[10px] sm:text-[11px] font-[1000] text-slate-300 uppercase tracking-[0.2em] text-center">
                                    {pendingSheets} {unitLabel.toUpperCase()} balance to inspect qty available
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Stats Bar — Desktop: single row */}
                    <div className="hidden sm:flex flex-row bg-[#0f172a] rounded-3xl p-3 shadow-lg divide-x divide-white/10">
                        {stats.map((s, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-1.5 flex-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center w-full truncate">{s.label}</span>
                                <span className={`text-lg font-black tracking-tighter ${s.color}`}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                    {/* Stats Bar — Mobile: 2 per row */}
                    <div className="sm:hidden grid grid-cols-2 gap-2 bg-[#0f172a] rounded-2xl p-2.5 shadow-lg">
                        {stats.map((s, i) => (
                            <div key={i} className={`flex flex-col items-center justify-center p-2.5 bg-white/5 rounded-xl ${i === 4 ? 'col-span-2' : ''}`}>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center w-full">{s.label}</span>
                                <span className={`text-sm font-black tracking-tighter ${s.color}`}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Requisitions & Issues Section */}
                    {(job.is_reprocess && (sheetIssueStatus.length > 0 || groupEMRs.length > 0) && !jobFullyComplete) && (
                        <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {job?.is_reprocess ? "Material Requisitions & EMR Status" : "BOM Requisitions & Issues"}
                                </span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    Store Sync Active
                                </span>
                            </div>

                            {/* Normal / Reprocess Job BOM Sheet Material Requisitions */}
                            {sheetIssueStatus.length > 0 && (
                                <div className="divide-y divide-white/5">
                                    <div className="grid px-4 py-2 bg-white/[0.02]" style={{ gridTemplateColumns: '1fr 72px 72px 72px' }}>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Material</span>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center">Required</span>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center">Issued</span>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center">Balance</span>
                                    </div>
                                    {sheetIssueStatus.map((m, i) => (
                                        <div key={m.item_id || i}
                                            className={`grid px-4 py-2.5 items-center ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} ${!m.has_issued ? 'border-l-2 border-red-500/70' : 'border-l-2 border-emerald-500/50'}`}
                                            style={{ gridTemplateColumns: '1fr 72px 72px 72px' }}>
                                            <div className="flex items-center gap-2 pr-2 min-w-0">
                                                <span className="text-[11px] font-bold text-slate-200 truncate">{m.material_name}</span>
                                                {!m.has_issued && <span className="shrink-0 text-[7px] font-black text-rose-400 bg-rose-950/60 border border-rose-900/40 rounded-full px-1.5 py-0.5 uppercase tracking-widest leading-none">Not issued</span>}
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs font-black text-white">{m.required_qty}</span>
                                                <span className="text-[8px] font-bold text-slate-500 ml-0.5">sh</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-xs font-black ${m.has_issued ? 'text-teal-400' : 'text-rose-400'}`}>{m.issued_qty}</span>
                                                <span className="text-[8px] font-bold text-slate-500 ml-0.5">sh</span>
                                                {!m.has_issued && <span className="ml-0.5 text-rose-400 text-[10px]">⚠</span>}
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-xs font-black ${m.balance_qty === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{m.balance_qty}</span>
                                                <span className="text-[8px] font-bold text-slate-500 ml-0.5">sh</span>
                                            </div>
                                        </div>
                                    ))}
                                    {!allSheetsIssued
                                        ? <div className="px-4 py-2 bg-rose-950/30 flex items-center gap-2 border-t border-rose-900/20"><AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" /><span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Store has not issued all sheet materials — inward recording is blocked</span></div>
                                        : <div className="px-4 py-2 bg-emerald-950/20 flex items-center gap-2 border-t border-emerald-900/10"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /><span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">All sheet materials issued — inward recording enabled</span></div>
                                    }
                                </div>
                            )}

                            {/* Reprocess Requisition Requests list */}
                            {job?.is_reprocess && groupEMRs.length > 0 && (
                                <div className="divide-y divide-white/5 p-3 space-y-2 max-h-48 overflow-y-auto custom-modal-scroll">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Requisition Requests</div>
                                    {groupEMRs.map((r, i) => {
                                        let statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                                        if (r.status === 'ISSUED' || r.status === 'APPROVED') statusColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                                        if (r.status === 'PARTIAL') statusColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
                                        if (r.status === 'RECEIVED') statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                                        if (r.status === 'REJECTED') statusColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";

                                        const displayName = r.item_description || (r.materials || []).map(m => m.material_name).join(', ') || 'Reprocess Material';
                                        const displaySize = r.size_name || r.sheet_size;
                                        const displayRemarks = r.remarks || r.reason;
                                        const isReq = !!r.requisition_no;

                                        return (
                                            <div key={r._id || i} className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-1.5 animate-in fade-in duration-200">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col min-w-0 pr-2">
                                                        <span className="text-[11px] font-bold text-slate-200 truncate">
                                                            {displayName}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                                            {displaySize ? `Size: ${displaySize} • ` : ''}{r.qty} {r.unit}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusColor} shrink-0`}>
                                                        {r.status === 'ISSUED' ? 'ISSUED' : r.status}
                                                    </span>
                                                </div>

                                                {displayRemarks && (
                                                    <p className="text-[9px] font-semibold text-slate-400 italic">
                                                        Remarks: {displayRemarks}
                                                    </p>
                                                )}

                                                {/* Action button if EMR/Requisition is ready to receive and hasn't been received yet */}
                                                {(r.status === 'APPROVED' || r.status === 'ISSUED' || r.status === 'PARTIAL') && (
                                                    <button
                                                        type="button"
                                                        disabled={confirmingReceiptId === r._id}
                                                        onClick={() => handleConfirmEMRReceipt(r._id, isReq)}
                                                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-1"
                                                    >
                                                        {confirmingReceiptId === r._id ? 'Confirming...' : '✓ Confirm Material Receipt'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Balance to inspect banner
                            <div className="bg-[#193472] p-3 flex items-center justify-center border-t border-white/5">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    {pendingSheets} {unitLabel.toUpperCase()} balance to inspect qty available
                                </span>
                            </div> */}
                        </div>
                    )}

                    {!isUnlocked ? (
                        <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-rose-600 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tight italic">
                                    Process Locked
                                </h3>
                                <p className="text-[11px] font-[1000] text-rose-600 uppercase tracking-[0.15em] mt-2">
                                    {materialGroup?.locked_reason || "Waiting for preceding process to complete"}
                                </p>
                            </div>
                        </div>
                    ) : jobFullyComplete ? (
                        // Truly done
                        <div className="bg-[#ebfff6] border-2 border-[#c7f7e2] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight italic">
                                    All Good Qty Inwarded — Ready to Process
                                </h3>
                                <p className="text-[11px] font-[1000] text-emerald-600 uppercase tracking-[0.15em] mt-2">
                                    {targetQty} {unitLabel.toUpperCase()} ALLOC · {totalReceived} {unitLabel.toUpperCase()} INSPECTED · {totalGood} {unitLabel.toUpperCase()} GOOD · {totalBad} {unitLabel.toUpperCase()} BAD
                                </p>
                            </div>
                        </div>
                    ) : waitingForStore ? (
                        // Store or preceding process needs to issue/hand over more
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock className="w-10 h-10 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tight italic">
                                    {(job?.is_reprocess && !isSubsequent) ? 'EMR Request Pending Store Approval' : (isSubsequent ? 'Waiting for Preceding Process Handover' : 'Waiting for Store to Issue More')}
                                </h3>
                                {job?.is_reprocess && groupEMRs.length > 0 ? (
                                    <div className="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
                                        {groupEMRs
                                            .filter(r => r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'ISSUED' || r.status === 'PARTIAL')
                                            .map(r => {
                                                const displayName = r.item_description || (r.materials || []).map(m => m.material_name).join(', ') || 'Reprocess Material';
                                                const displayRemarks = r.remarks || r.reason;
                                                const isReq = !!r.requisition_no;
                                                const displayStatus = r.status === 'ISSUED' ? (isReq ? 'ISSUED' : 'APPROVED') : r.status;

                                                return (
                                                    <div key={r._id} className="bg-white/80 rounded-xl p-3 border border-amber-200 text-left">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                                                                {isReq ? 'Requisition Request' : 'EMR Request'}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase">
                                                                {displayStatus}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 space-y-1">
                                                            <p className="text-[11px] font-bold text-slate-700">
                                                                • {displayName}
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-600 mt-1">
                                                            Requested Qty: {r.qty} {r.unit} {r.size_name || r.sheet_size ? `(${r.size_name || r.sheet_size})` : ''}
                                                        </p>
                                                        {displayRemarks && (
                                                            <p className="text-[10px] font-medium text-slate-500 mt-1 italic">
                                                                Remarks: {displayRemarks}
                                                            </p>
                                                        )}

                                                        {(r.status === 'APPROVED' || r.status === 'ISSUED' || r.status === 'PARTIAL') && (
                                                            <button
                                                                type="button"
                                                                disabled={confirmingReceiptId === r._id}
                                                                onClick={() => handleConfirmEMRReceipt(r._id, isReq)}
                                                                className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                                            >
                                                                {confirmingReceiptId === r._id ? 'Confirming...' : 'Confirm Material Receipt'}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                ) : (
                                    <p className="text-[11px] font-[1000] text-amber-700 uppercase tracking-[0.15em] mt-2">
                                        {totalGood} of {targetQty} {unitLabel} done · {targetQty - totalGood} {unitLabel} still pending from {isSubsequent ? 'preceding process' : 'store'}
                                    </p>
                                )}
                                {job?.is_reprocess && !isSubsequent && (
                                    <button
                                        type="button"
                                        onClick={() => setMaterialSource(null)}
                                        className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Back to Source Selection
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : job?.is_reprocess && !isSubsequent && materialSource === null ? (
                        // Source selection screen
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-center">
                                Select Material Source for Reprocess
                            </h3>
                            {fetchingSF || fetchingReq ? (
                                <div className="text-center py-6 text-slate-500 font-bold uppercase tracking-widest text-[11px] animate-pulse">
                                    Checking local inventory & requisitions...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {/* Local stock option */}
                                    <button
                                        type="button"
                                        disabled={shopFloorStock <= 0}
                                        onClick={() => setMaterialSource('local')}
                                        className={`p-6 border-2 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all ${shopFloorStock > 0
                                            ? 'border-emerald-300 bg-emerald-50 hover:border-emerald-500 cursor-pointer'
                                            : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${shopFloorStock > 0 ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                            <Package className={`w-5 h-5 ${shopFloorStock > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-black text-slate-900 uppercase tracking-tight">Consume Local Inventory</span>
                                            <span className="block text-[11px] font-bold text-slate-500 mt-1">
                                                Available locally: {shopFloorStock} {unitLabel}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Main store option */}
                                    <button
                                        type="button"
                                        onClick={() => setMaterialSource('store')}
                                        className="p-6 border-2 border-amber-300 bg-amber-50 hover:border-amber-500 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-black text-slate-900 uppercase tracking-tight">Request from Store</span>
                                            <span className="block text-[11px] font-bold text-slate-500 mt-1">
                                                Raise requisition to store
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : job?.is_reprocess && !isSubsequent && materialSource === 'store' && (!hasActiveEMRs) && pendingSheets === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">Raise Extra Material Request (EMR)</h3>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                                        {!hasActiveEMRs && activeEMR?.status === 'REJECTED' ? 'Previous EMR Rejected' : 'Material request to store'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1">REQUISITION QTY ({unitLabel.toUpperCase()})</label>
                                    <input
                                        type="number"
                                        value={reqQty}
                                        onChange={(e) => setReqQty(e.target.value)}
                                        placeholder={`Required: ${targetQty - totalGood}`}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-700 outline-none focus:border-amber-400 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1">REMARKS</label>
                                    <input
                                        type="text"
                                        value={reqRemarks}
                                        onChange={(e) => setReqRemarks(e.target.value)}
                                        placeholder="Reason for request..."
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-700 outline-none focus:border-amber-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={() => setMaterialSource(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    disabled={raisingReq}
                                    onClick={handleRaiseStoreRequisition}
                                    className="px-5 py-2 bg-[#f3a638] hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                                >
                                    {raisingReq ? 'Submitting...' : 'Submit Requisition'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {job?.is_reprocess && !isSubsequent && (
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 mb-2 text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Selected Source:</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg ${materialSource === 'local' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {materialSource === 'local' ? 'Shop Floor Stock' : 'Store Requisition'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMaterialSource(null)}
                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                    >
                                        Change Source
                                    </button>
                                </div>
                            )}
                            {/* Form Section */}
                            <div className="bg-[#fdfcf5] border border-amber-100/50 rounded-3xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Activity className="w-2.5 h-2.5 text-amber-600" />
                                    </div>
                                    <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest">
                                        INWARD NEW MATERIAL — <span className="text-amber-600">{pendingSheets} {unitLabel.toUpperCase()} STILL TO RECEIVE</span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1">BROUGHT IN BY</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <AlertTriangle className="w-3.5 h-3.5 text-slate-900" />
                                            </div>
                                            <select
                                                value={broughtInBy}
                                                onChange={(e) => setBroughtInBy(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-[13px] font-bold text-slate-700 outline-none focus:border-amber-400 transition-all appearance-none"
                                            >
                                                <option value="">Select person...</option>
                                                {users.map(u => (
                                                    <option key={u._id} value={u._id}>{u.username}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1">CONDITION / QC REMARKS</label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Surface quality, colour match..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[13px] font-bold text-slate-700 outline-none focus:border-amber-400 transition-all resize-none h-[40px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Step 1: Inspect Qty */}
                            <div className="bg-[#f0f7ff] border border-blue-100 rounded-2xl p-4 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-black">1</div>
                                    <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">INSPECT QTY</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className={`bg-white border-[3px] rounded-xl shadow-sm overflow-hidden flex items-center transition-colors ${qtyError ? 'border-red-400' : 'border-blue-400'}`}>
                                            <input
                                                type="number"
                                                value={inspectQty}
                                                onChange={(e) => {
                                                    const rawVal = e.target.value;
                                                    if (rawVal.includes('-')) return;
                                                    const val = rawVal === '' ? '' : Number(rawVal);
                                                    setInspectQty(val);
                                                    if (typeof val === 'number' && rawVal !== '') {
                                                        if (val > pendingSheets) {
                                                            setQtyError(`Cannot exceed ${pendingSheets} ${unitLabel}`);
                                                        } else if (val < 1) {
                                                            setQtyError(`Min 1 ${unitLabel} required`);
                                                        } else {
                                                            setQtyError('');
                                                            setGoodQty(val);
                                                            setBadQty(0);
                                                        }
                                                    } else {
                                                        setQtyError('');
                                                    }
                                                }}
                                                placeholder={`Max: ${pendingSheets}`}
                                                className="w-40 px-6 py-2 text-3xl font-black text-slate-800 tracking-tighter outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        {qtyError && (
                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1 animate-pulse">
                                                {qtyError}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                        of {targetQty - totalGood} {unitLabel} remaining
                                    </span>
                                </div>
                            </div>

                            {/* Step 2: QC Split */}
                            <div className={`${inspectQty > 0 && !qtyError ? 'bg-emerald-50 border-emerald-100' : 'opacity-40 select-none'} border rounded-2xl p-4 transition-all duration-300`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-5 h-5 rounded-full ${inspectQty > 0 && !qtyError ? 'bg-emerald-600' : 'bg-slate-300'} flex items-center justify-center text-white text-[9px] font-black`}>2</div>
                                    <span className={`text-[9px] font-black ${inspectQty > 0 && !qtyError ? 'text-emerald-900' : 'text-slate-400'} uppercase tracking-widest`}>
                                        QC SPLIT — MUST = {inspectQty || 'INSPECT QTY'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`bg-white border-2 rounded-xl p-3 flex flex-col items-center transition-all ${inspectQty > 0 && !qtyError ? 'border-emerald-200 focus-within:border-emerald-500' : 'border-slate-100'}`}>
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">✓ GOOD</span>
                                        <input
                                            type="number"
                                            disabled={!inspectQty || qtyError}
                                            value={goodQty}
                                            onChange={(e) => {
                                                const rawVal = e.target.value;
                                                if (rawVal.includes('-')) return;
                                                const val = rawVal === '' ? '' : Number(rawVal);
                                                console.log("goodQty input onChange - rawVal:", rawVal, "val:", val, "inspectQty:", inspectQty);
                                                if (val === '') {
                                                    setGoodQty('');
                                                    return;
                                                }
                                                const cappedVal = Math.min(val, Number(inspectQty));
                                                console.log("goodQty input cappedVal:", cappedVal);
                                                setGoodQty(cappedVal);
                                                if (inspectQty && !qtyError) {
                                                    const calcBad = Number(inspectQty) - cappedVal;
                                                    console.log("goodQty input auto-setting badQty to:", calcBad);
                                                    setBadQty(calcBad);
                                                }
                                            }}
                                            className="w-full text-center text-3xl font-black text-slate-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className={`bg-white border-2 rounded-xl p-3 flex flex-col items-center transition-all ${inspectQty > 0 && !qtyError ? 'border-amber-200 focus-within:border-amber-500' : 'border-slate-100'}`}>
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">✘ BAD / REJECT</span>
                                        <input
                                            type="number"
                                            disabled={!inspectQty || qtyError}
                                            value={badQty}
                                            onChange={(e) => {
                                                const rawVal = e.target.value;
                                                if (rawVal.includes('-')) return;
                                                const val = rawVal === '' ? '' : Number(rawVal);
                                                console.log("badQty input onChange - rawVal:", rawVal, "val:", val, "inspectQty:", inspectQty);
                                                if (val === '') {
                                                    setBadQty('');
                                                    return;
                                                }
                                                const cappedVal = Math.min(val, Number(inspectQty));
                                                console.log("badQty input cappedVal:", cappedVal);
                                                setBadQty(cappedVal);
                                                if (inspectQty && !qtyError) {
                                                    const calcGood = Number(inspectQty) - cappedVal;
                                                    console.log("badQty input auto-setting goodQty to:", calcGood);
                                                    setGoodQty(calcGood);
                                                }
                                            }}
                                            className="w-full text-center text-3xl font-black text-slate-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {inspectQty > 0 && !qtyError && (
                                    <div className="mt-3 px-3 py-1.5 bg-emerald-100/50 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className={`w-3.5 h-3.5 ${isQcValid ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isQcValid ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                {isQcValid ? `${goodQty} GOOD - ${badQty} BAD` : `${qcTotal}/${inspectQty} — ${inspectQty - qcTotal} UNALLOCATED`}
                                            </span>
                                        </div>
                                        {!isQcValid && (
                                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest animate-pulse">
                                                Split mismatch
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                disabled={!canSubmit || isSubmitting || job?.is_hold}
                                onClick={handleRecordInward}
                                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg
                                    ${canSubmit && !isSubmitting && !job?.is_hold
                                        ? 'bg-[#f39c12] text-white shadow-amber-600/20 hover:bg-[#e67e22]'
                                        : 'bg-[#ced6e0] text-[#747d8c] cursor-not-allowed shadow-none'}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Activity className="w-4 h-4 animate-spin" />
                                        RECORDING...
                                    </>
                                ) : job?.is_hold ? (
                                    <>
                                        <Clock className="w-4 h-4" />
                                        JOB IS ON HOLD — CANNOT RECORD
                                    </>
                                ) : canSubmit ? (
                                    <>
                                        <Package className="w-4 h-4" />
                                        RECORD INWARD — {inspectQty} {unitLabel.toUpperCase()} · {goodQty} GOOD ✓ · {badQty} BAD ✘ · {operatorName}
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-4 h-4" />
                                        {broughtInBy === '' ? 'SELECT OPERATOR FIRST' :
                                            qtyError ? 'CORRECT QUANTITY ERROR' :
                                                !inspectQty ? 'ENTER INSPECTED QUANTITY' :
                                                    (goodQty === '' || badQty === '') ? 'COMPLETE QC SPLIT' :
                                                        'ALLOCATE ALL ' + inspectQty + ' ' + unitLabel.toUpperCase()}
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {/* Inward Log Section */}
                    {inwardLogs.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] italic">INWARD LOG — {inwardLogs.length} {inwardLogs.length === 1 ? 'ENTRY' : 'ENTRIES'}</h3>
                            </div>
                            <div className="space-y-2">
                                {inwardLogs.map((log, idx) => (
                                    <div key={log.inward_id || idx} className="overflow-hidden bg-white border-l-4 border-amber-400 rounded-xl shadow-sm group hover:shadow-md transition-all">
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-black text-slate-900 leading-none">{log.inspect_qty}</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">inspected</span>
                                                        <span className="text-2xl font-black text-emerald-500 leading-none ml-2">{log.good_qty}</span>
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">good</span>
                                                        {log.bad_qty > 0 && (
                                                            <>
                                                                <span className="text-2xl font-black text-rose-500 leading-none ml-2">{log.bad_qty}</span>
                                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">bad</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {log.timestamp} • {log.operator_name}
                                                        </span>
                                                        {log.materials?.length > 0 && (
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight mt-1">
                                                                {log.materials.map(m => m.material_name).join(' + ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(log.remarks || log.note) && (
                                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-2 italic leading-tight max-w-[300px] border-l-2 border-amber-100 pl-2">
                                                            " {log.remarks || log.note} "
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5
                                                ${(log.bad_qty === 0) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {(log.bad_qty === 0) ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                {(log.bad_qty === 0) ? 'PASS' : 'PARTIAL'}
                                            </div>
                                        </div>

                                        {/* Financial & Physical Audit Bar */}
                                        <div className="bg-[#0f172a] p-3 flex items-center gap-10">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">SQ.IN ACCEPTED</span>
                                                <span className="text-xl font-black text-emerald-400 leading-none">{log.total_sq_inch_accepted?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">₹ VALUE</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[10px] font-black text-white leading-none">₹</span>
                                                    <span className="text-xl font-black text-white leading-none">{log.accepted_value?.toLocaleString() || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <span className="text-[12px] font-bold text-slate-900 uppercase tracking-tight truncate">{value}</span>
    </div>
);

export default MaterialInwardModal;
