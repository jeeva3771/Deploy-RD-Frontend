import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AlertTriangle, Store, Zap, Mailbox, MinusCircle, RefreshCw, Factory, ArrowUpRight, Package, Clock, Flag } from 'lucide-react';
import { formatDateToYYYYMMDD } from '../../../../utils/enquiry/dateformat';
import { fetchInwardLogs, fetchShopFloorJobs } from '../../../../reducer/shopFloorReducer';
import { fetchReadyJobs } from '../../../../reducer/readyJobsReducer';
import { fetchRejectedMaterialsApi } from '../../../../reducer/shopFloorProcessFlowReducer';
import { getUserRole, getIsHead, getDepartmentName, getUser } from '../../../../utils/permission/auth';
import { viewUserShiftDetails } from '../../../../reducer/shiftReducer';

const StockDashboard = ({ isUv, department, processNames }) => {
    const dispatch = useDispatch();
    const { jobs } = useSelector((state) => state.shopFloor);
    const { items: readyJobItems = [] } = useSelector((state) => state.readyJobs);
    const { rejectedMaterials } = useSelector((state) => state.shopFloorProcessFlow || { rejectedMaterials: [] });
    const { userShiftDetails } = useSelector((state) => state.shift || {});
    const [inwardLogs, setInwardLogs] = useState([]);

    const dept = department || (isUv ? 'Print' : 'Laser');

    const role = getUserRole();
    const isHead = getIsHead();
    const currentDeptName = getDepartmentName();
    const isAdmin = role?.toLowerCase().includes('admin') || role?.toLowerCase() === 'super admin' || role?.toLowerCase() === 'superadmin';
    const isOperator = !isHead && !isAdmin && role?.toLowerCase().includes('operator');
    const isLaserOperator = currentDeptName === 'Laser' && !isHead && !isAdmin;

    useEffect(() => {
        const user = getUser();
        const userId = user?._id || user?.id;
        if (userId) {
            dispatch(viewUserShiftDetails(userId));
        }
    }, [dispatch]);

    const operatorShiftNum = useMemo(() => {
        if (!userShiftDetails?.current_shift?.name) return null;
        const name = userShiftDetails.current_shift.name.toLowerCase();
        if (name.includes('morning') || name.includes('shift 1') || name === '1') {
            return 1;
        }
        if (name.includes('evening') || name.includes('afternoon') || name.includes('shift 2') || name === '2') {
            return 2;
        }
        if (name.includes('night') || name.includes('shift 3') || name === '3') {
            return 3;
        }
        if (name.includes('general')) {
            return 1;
        }
        return null;
    }, [userShiftDetails]);

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const logsParams = {};
                if (processNames) {
                    logsParams.process_name = processNames;
                } else {
                    logsParams.department = dept;
                }
                const res = await dispatch(fetchInwardLogs(logsParams)).unwrap();
                if (res.success) {
                    setInwardLogs(res.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch inward logs:", error);
            }
        };
        loadLogs();
        dispatch(fetchRejectedMaterialsApi());
        dispatch(fetchReadyJobs({ handed_over: false, department: dept }));

        const isUvOperator = currentDeptName === 'Print' && !isHead && !isAdmin && role?.toLowerCase().includes('uv');
        const jobParams = processNames
            ? { process_name: processNames, exclude_completed: 'true' }
            : {
                department: dept,
                role: dept === 'Print' ? (isUvOperator ? 'UV Printing Operator' : 'admin') : (isLaserOperator ? 'Laser Cutting Operator' : 'admin'),
                exclude_completed: 'true'
            };
        dispatch(fetchShopFloorJobs(jobParams));
    }, [dispatch, isLaserOperator, dept, processNames, currentDeptName, isHead, isAdmin, role]);

    // Calculate Laser Cutting WIP dynamic values from active in-house jobs
    let wipPcs = 0;
    let wipSqin = 0;
    const wipJobIds = new Set();

    (jobs || []).forEach(job => {
        if (job.status === 'Completed') return;

        (job.material_groups || []).forEach(mg => {
            const hasShift = mg.assigned_shifts?.some(s => s === 1 || s === 2 || s === 3);
            const isInProgress = mg.status === 'In Progress' || (mg.progress > 0 && mg.progress < 100);

            if ((hasShift || isInProgress) && mg.status !== 'Completed') {
                wipJobIds.add(job.sub_job_no || String(job._id));

                const inwardGoodQty = mg.inward_history?.reduce((sum, h) => sum + (h.good_qty || 0), 0) || 0;
                const plannedQty = mg.inhouse_qty || 0;

                wipPcs += inwardGoodQty > 0 ? inwardGoodQty : plannedQty;

                const inwardSqin = mg.inward_history?.reduce((sum, h) => sum + (h.total_sq_inch_accepted || 0), 0) || 0;
                wipSqin += inwardSqin;
            }
        });
    });

    const wipSqft = (wipSqin / 144).toFixed(2);
    const wipJobsCount = wipJobIds.size;

    // Calculate WIP READY (NEXT DEPT) dynamic values from readyJobs state
    const readyPcs = readyJobItems.reduce((sum, item) => sum + (item.good_qty || 0), 0);
    const readyJobIds = new Set(readyJobItems.map(item => item.sub_job_no || String(item.shopfloor_job_id)));
    const readyJobsCount = readyJobIds.size;

    // Calculate square inches dynamically for ready jobs by matching with job material group
    let readySqin = 0;
    readyJobItems.forEach(item => {
        const matchingJob = (jobs || []).find(j => String(j._id) === String(item.shopfloor_job_id));
        if (!matchingJob) return;

        const matchingGroup = matchingJob.material_groups?.find(mg =>
            String(mg.group_id) === String(item.group_id) ||
            String(mg._id) === String(item.group_id)
        );
        if (!matchingGroup) return;

        // 1. Try to get it from inward_history
        const inwardGoodQty = matchingGroup.inward_history?.reduce((sum, h) => sum + (h.good_qty || 0), 0) || 0;
        const inwardSqin = matchingGroup.inward_history?.reduce((sum, h) => sum + (h.total_sq_inch_accepted || 0), 0) || 0;
        if (inwardGoodQty > 0 && inwardSqin > 0) {
            readySqin += (inwardSqin / inwardGoodQty) * (item.good_qty || 0);
            return;
        }

        // 2. Try to calculate it from materials size
        const m = matchingGroup.materials?.find(mat => {
            const cat = mat.category_type?.toLowerCase() || "";
            return !cat.includes('consumable') && !cat.includes('hardware');
        });
        if (m && m.material_type === "sheet" && m.material_input?.size) {
            const dims = m.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
            if (dims.length >= 2) {
                const totalSqInchForSheets = dims[0] * dims[1] * (m.quantity || 1);
                const totalGroupQty = (m.quantity || 0) * (m.material_input?.ups || 1);
                if (totalGroupQty > 0) {
                    readySqin += (totalSqInchForSheets / totalGroupQty) * (item.good_qty || 0);
                }
            }
        }
    });

    const readySqft = (readySqin / 144).toFixed(2);

    // Calculate Main Stores values directly from inwardLogs of active jobs (including partial inwards)
    let mainPcs = 0;
    let mainSqin = 0;
    const mainJobNos = new Set();
    const activeJobIdsForMain = new Set((jobs || []).filter(j => j.status !== 'Completed').map(j => String(j._id)));

    (inwardLogs || []).forEach(log => {
        const jobIdStr = String(log.job_id?._id || log.job_id || '');
        if (activeJobIdsForMain.has(jobIdStr)) {
            mainPcs += log.good_qty || 0;
            mainSqin += log.total_sq_inch_accepted || 0;
            if (log.sub_job_no || log.job_no) {
                mainJobNos.add(log.sub_job_no || log.job_no);
            }
        }
    });

    const mainSqft = (mainSqin / 144).toFixed(2);
    const mainJobsCount = mainJobNos.size;

    // Filter by department active jobs
    const activeJobIds = useMemo(() => new Set((jobs || []).map(j => String(j._id))), [jobs]);

    const filteredRejectedMaterials = useMemo(() => {
        return (rejectedMaterials || []).filter(item =>
            activeJobIds.has(String(item.shopfloor_job_id))
        );
    }, [rejectedMaterials, activeJobIds]);

    const getSalvageStats = (method) => {
        const matching = (filteredRejectedMaterials || []).filter(item =>
            item.disposal_method?.toLowerCase() === method.toLowerCase()
        );

        const pcs = matching.reduce((sum, item) => sum + (item.net_rejected_qty || 0), 0);
        const sqin = matching.reduce((sum, item) => sum + (item.sqin_lost || 0), 0);
        const sqft = matching.reduce((sum, item) => sum + (item.sqft_lost || 0), 0);
        const jobsCount = new Set(matching.map(item => item.sub_job_no || item.job_no)).size;

        return {
            count: String(pcs),
            sqin: String(Math.round(sqin)),
            sqft: sqft.toFixed(2),
            jobs: String(jobsCount),
            active: pcs > 0
        };
    };

    const getBgColorClass = (color) => {
        switch (color) {
            case 'rose': return 'bg-rose-50';
            case 'teal': return 'bg-teal-50';
            case 'blue': return 'bg-blue-50';
            case 'slate': return 'bg-slate-50';
            case 'emerald': return 'bg-emerald-50';
            case 'amber': return 'bg-amber-50';
            case 'indigo': return 'bg-indigo-50';
            default: return 'bg-slate-50';
        }
    };

    // Gather and calculate active outsource stats grouped by vendor
    const vendorBalancesMap = {};

    (jobs || []).forEach(job => {
        (job.material_groups || []).forEach(mg => {
            // Find sqin per piece for this material group
            let sqinPerPiece = 0;
            const inwardGoodQty = mg.inward_history?.reduce((sum, h) => sum + (h.good_qty || 0), 0) || 0;
            const inwardSqin = mg.inward_history?.reduce((sum, h) => sum + (h.total_sq_inch_accepted || 0), 0) || 0;
            if (inwardGoodQty > 0 && inwardSqin > 0) {
                sqinPerPiece = inwardSqin / inwardGoodQty;
            } else {
                const m = mg.materials?.find(mat => {
                    const cat = mat.category_type?.toLowerCase() || "";
                    return !cat.includes('consumable') && !mat.category_type?.toLowerCase()?.includes('hardware');
                });
                if (m && m.material_type === "sheet" && m.material_input?.size) {
                    const dims = m.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                    if (dims.length >= 2) {
                        const totalSqInchForSheets = dims[0] * dims[1] * (m.quantity || 1);
                        const totalGroupQty = (m.quantity || 0) * (m.material_input?.ups || 1);
                        if (totalGroupQty > 0) {
                            sqinPerPiece = totalSqInchForSheets / totalGroupQty;
                        }
                    }
                }
            }

            (mg.outsource_assignments || []).forEach(assign => {
                // If it is active (not complete yet / stage < 6)
                if (assign.current_stage_idx < 6 && assign.status !== 'Completed') {
                    const vendorName = assign.vendor_name || 'Unknown Vendor';
                    if (!vendorBalancesMap[vendorName]) {
                        vendorBalancesMap[vendorName] = {
                            vendorName,
                            pcs: 0,
                            sheets: 0,
                            sqin: 0
                        };
                    }
                    const assignPcs = assign.outsource_qty || 0;
                    const assignSheets = assign.outsource_sheets || 0;
                    vendorBalancesMap[vendorName].pcs += assignPcs;
                    vendorBalancesMap[vendorName].sheets += assignSheets;
                    vendorBalancesMap[vendorName].sqin += assignPcs * sqinPerPiece;
                }
            });
        });
    });

    const vendorBalances = Object.values(vendorBalancesMap);

    const queueJobs = (jobs || []).filter(j => {
        if (j.status === 'Completed') return false;
        // If ANY group has no shift assigned AND is not outsourced, show in queue
        const hasUnassigned = j.material_groups?.some(mg =>
            !(mg.assigned_shifts?.length > 0 || mg.assigned_outsource_sheets > 0)
        );
        return hasUnassigned;
    });

    const activeShiftJobs = useMemo(() => {
        let activeShifts = [1, 2, 3];
        if (isOperator && operatorShiftNum) {
            activeShifts = [operatorShiftNum];
        }
        return (jobs || []).filter(j => {
            if (j.status === 'Completed') return false;
            const hasShift = j.assigned_shifts?.some(s => activeShifts.includes(s)) ||
                j.material_groups?.some(mg => mg.assigned_shifts?.some(s => activeShifts.includes(s)));
            return hasShift;
        });
    }, [jobs, isOperator, operatorShiftNum]);

    const escalatedJobsList = (jobs || []).filter(j => {
        if (j.status === 'Completed') return false;
        return j.is_escalated;
    });

    const operatorDashboardJobs = useMemo(() => {
        const merged = [];
        const seen = new Set();

        // Add escalated jobs first
        escalatedJobsList.forEach(j => {
            if (!seen.has(j._id)) {
                seen.add(j._id);
                merged.push(j);
            }
        });

        // Add shift jobs
        activeShiftJobs.forEach(j => {
            if (!seen.has(j._id)) {
                seen.add(j._id);
                merged.push(j);
            }
        });

        return merged;
    }, [activeShiftJobs, escalatedJobsList]);

    // Gather all completed (Invoice Approved) outsource assignments
    const invoiceApprovedVouchers = [];
    (jobs || []).forEach(job => {
        (job.material_groups || []).forEach(mg => {
            (mg.outsource_assignments || []).forEach(assign => {
                if (assign.current_stage_idx === 6 || assign.invoice_no) {
                    invoiceApprovedVouchers.push({
                        ...assign,
                        job_no: job.job_no,
                        sub_job_no: job.sub_job_no,
                        client_name: job.client_name,
                        process_name: job.process_name,
                        group_name: mg.group_name,
                        materials: mg.materials,
                    });
                }
            });
        });
    });

    const getTodayDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // YYYY-MM-DD
    };

    const todayDateStr = getTodayDateString();

    // Vouchers approved today
    const vouchersToday = invoiceApprovedVouchers.filter(vch => {
        if (!vch.invoice_date) return false;
        try {
            return formatDateToYYYYMMDD(vch.invoice_date) === todayDateStr;
        } catch (e) {
            return false;
        }
    });

    const totalVouchersAmt = invoiceApprovedVouchers.reduce((sum, vch) => sum + (vch.invoice_amt || 0), 0);

    return (
        <div className="p-6 space-y-6">
            {/* Stat Bar (Unified) */}
            <div className="bg-[#0c1a2e] rounded-2xl border border-white/5 overflow-hidden shadow-xl flex items-stretch">
                {[
                    { label: 'VOUCHERS TODAY', value: `${vouchersToday.length}`, color: 'text-indigo-400' },
                    { label: 'TOTAL VOUCHERS', value: `${invoiceApprovedVouchers.length}`, color: 'text-emerald-400' },
                    { label: 'TOTAL VALUE', value: `₹${totalVouchersAmt.toLocaleString()}`, color: 'text-blue-400' },
                    { label: '₹ SCRAP TODAY', value: '₹0', color: 'text-rose-400' },
                ].map((stat, idx) => (
                    <div key={idx} className={`flex-1 p-2 flex flex-col items-center justify-center text-center border-r border-white/5 last:border-r-0 hover:bg-white/5 transition-all`}>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">{stat.label}</span>
                        <span className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Warning Banner / Operator Shifts & Escalations (Yellow Panel) */}
            <div className="bg-[#fffbeb] border border-amber-100 rounded-2xl p-6 shadow-sm">
                {isOperator ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-4 h-4 text-amber-600 fill-amber-100" />
                            <h3 className="text-[11px] font-[1000] text-amber-800 uppercase tracking-widest leading-none">
                                {operatorDashboardJobs.length} ACTIVE SHIFT & ESCALATED JOBS
                            </h3>
                        </div>
                        <p className="text-[9px] text-amber-800/60 font-black uppercase tracking-widest leading-none mb-6">
                            These jobs are currently assigned to in-house shifts or flagged as escalated.
                        </p>

                        <div className="space-y-0.5 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200">
                            {operatorDashboardJobs.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-amber-900/5 last:border-0 hover:bg-amber-500/5 px-2 transition-all group">
                                    <span className="text-[11px] font-black text-amber-700/80 uppercase tracking-tight group-hover:text-amber-800 transition-colors">
                                        {item.sub_job_no} • {item.product_name}
                                    </span>
                                    <span className={`text-[10px] font-black ${item.is_escalated ? 'text-rose-500 animate-pulse' : 'text-slate-900/80'} uppercase tracking-widest`}>
                                        {item.is_escalated ? `🔥 URGENT ${formatDateToYYYYMMDD(item.job_completion_date)}` : formatDateToYYYYMMDD(item.job_completion_date)}
                                    </span>
                                </div>
                            ))}
                            {operatorDashboardJobs.length === 0 && (
                                <div className="py-4 text-center text-[10px] font-black text-amber-600/40 uppercase tracking-widest">
                                    No active shift or escalated jobs
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-4 h-4 text-amber-600 fill-amber-100" />
                            <h3 className="text-[11px] font-[1000] text-amber-800 uppercase tracking-widest leading-none">{queueJobs.length} QUEUE JOBS DUE SOON — NO MATERIAL CONFIRMED</h3>
                        </div>
                        <p className="text-[9px] text-amber-800/60 font-black uppercase tracking-widest leading-none mb-6">
                            These jobs are in the queue but no item has materialStatus = Ready. Mother Stores needs to confirm material availability.
                        </p>

                        <div className="space-y-0.5">
                            {queueJobs.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-amber-900/5 last:border-0 hover:bg-amber-500/5 px-2 transition-all group">
                                    <span className="text-[11px] font-black text-amber-700/80 uppercase tracking-tight group-hover:text-amber-800 transition-colors">
                                        {item.sub_job_no} • {item.product_name}
                                    </span>
                                    <span className={`text-[10px] font-black ${item.is_escalated ? 'text-rose-500 animate-pulse' : 'text-slate-900/80'} uppercase tracking-widest`}>
                                        {item.is_escalated ? `🔥 URGENT ${formatDateToYYYYMMDD(item.job_completion_date)}` : formatDateToYYYYMMDD(item.job_completion_date)}
                                    </span>
                                </div>
                            ))}
                            {queueJobs.length === 0 && (
                                <div className="py-4 text-center text-[10px] font-black text-amber-600/40 uppercase tracking-widest">
                                    No pending queue jobs
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>



            {/* Godown Balances */}
            <div className="space-y-6 pt-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] italic opacity-60">VIRTUAL GODOWN BALANCES</h3>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
                    {[
                        { title: 'Main Stores', icon: <Store className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />, count: String(mainPcs), sqin: String(Math.round(mainSqin)), sqft: String(mainSqft), jobs: String(mainJobsCount), active: mainPcs > 0, color: 'rose' },
                        { title: dept === 'Print' ? 'UV PRINTING WIP' : 'LASER CUTTING WIP', icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />, count: String(wipPcs), sqin: String(wipSqin), sqft: String(wipSqft), jobs: String(wipJobsCount), active: wipPcs > 0, color: 'teal' },
                        { title: 'WIP READY (NEXT DEPT)', icon: <Mailbox className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />, count: String(readyPcs), sqin: String(Math.round(readySqin)), sqft: String(readySqft), jobs: String(readyJobsCount), active: readyPcs > 0, color: 'blue' },
                        { title: 'Disposed (Godown / Scrap)', icon: <MinusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />, ...getSalvageStats('Disposed'), color: 'slate' },
                        { title: 'Sold', icon: <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />, ...getSalvageStats('Sold'), color: 'emerald' },
                        { title: 'Recycled', icon: <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />, ...getSalvageStats('Recycled'), color: 'amber' },
                        { title: 'Donated', icon: <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, ...getSalvageStats('Donated'), color: 'indigo' },
                    ].map((card, idx) => (
                        <div key={idx} className={`bg-white rounded-2xl shadow-sm border ${card.active ? 'border-blue-400 shadow-blue-100' : 'border-slate-100'} flex flex-col justify-between overflow-hidden transition-all h-full`}>
                            <div className="p-2 sm:p-4 flex items-center justify-between gap-1.5 min-h-[58px] sm:min-h-[64px]">
                                <div className="flex gap-2 sm:gap-3 items-center min-w-0 flex-1">
                                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${getBgColorClass(card.color)} flex items-center justify-center shrink-0`}>
                                        {card.icon}
                                    </div>
                                    <h4 className={`text-[9px] sm:text-[11px] font-[1000] ${card.active ? 'text-blue-600' : 'text-slate-900'} uppercase tracking-tight line-clamp-2 leading-tight`}>{card.title}</h4>
                                </div>
                                <div className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl border ${card.active ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'} flex flex-col items-center justify-center min-w-[40px] sm:min-w-[50px] shrink-0`}>
                                    <span className="text-xs sm:text-lg font-[1000] tracking-tighter leading-none">{card.count}</span>
                                    <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest mt-0.5">PCS</span>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 px-2 sm:px-3 pb-2.5 sm:pb-3 pt-1 flex gap-1 sm:gap-2 mt-auto">
                                <div className="flex-1 bg-white/60 rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center border border-slate-100/50 min-w-0">
                                    <span className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate w-full text-center">SQ.IN</span>
                                    <span className="text-[9px] sm:text-[11px] font-[1000] text-slate-800 tracking-tight truncate w-full text-center">{card.sqin || '0'}</span>
                                </div>
                                <div className="flex-1 bg-white/60 rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center border border-slate-100/50 min-w-0">
                                    <span className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate w-full text-center">SQ.FT</span>
                                    <span className="text-[9px] sm:text-[11px] font-[1000] text-slate-800 tracking-tight truncate w-full text-center">{card.sqft || '0.00'}</span>
                                </div>
                                <div className="flex-1 bg-white/60 rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center border border-slate-100/50 min-w-0">
                                    <span className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate w-full text-center">JOBS</span>
                                    <span className="text-[9px] sm:text-[11px] font-[1000] text-slate-800 tracking-tight truncate w-full text-center">{card.jobs || '0'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Vendor Godowns */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                    <Factory className="w-4 h-4 text-purple-400" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] italic opacity-60">VENDOR GODOWNS (JOB WORK)</h3>
                </div>
                {vendorBalances.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        No active job work at any vendor godowns
                    </div>
                ) : (
                    <div className="space-y-4">
                        {vendorBalances.map((vendor, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden">
                                <div className="p-4 border-b border-purple-50">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                                            <Factory className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <h4 className="text-[12px] font-[1000] text-purple-600 uppercase tracking-tight">{vendor.vendorName}</h4>
                                    </div>
                                </div>
                                <div className="p-3 grid grid-cols-2 gap-3 bg-purple-50/10">
                                    <div className="bg-purple-50/50 rounded-xl p-4 flex flex-col items-center justify-center border border-purple-100 shadow-inner">
                                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.15em] mb-1.5">{dept === 'Print' ? 'PIECES AT VENDOR' : 'SHEETS AT VENDOR'}</span>
                                        <span className="text-2xl font-[1000] text-purple-800 tracking-tighter leading-none">{dept === 'Print' ? vendor.pcs : vendor.sheets}</span>
                                    </div>
                                    <div className="bg-purple-50/50 rounded-xl p-4 flex flex-col items-center justify-center border border-purple-100 shadow-inner">
                                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.15em] mb-1.5">SQ.IN</span>
                                        <span className="text-2xl font-[1000] text-purple-800 tracking-tighter leading-none">{Math.round(vendor.sqin)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Vouchers */}
            <div className="space-y-6 pt-4 pb-10">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] italic opacity-60">RECENT VOUCHERS ({invoiceApprovedVouchers.length} TOTAL)</h3>
                <div className="space-y-2">
                    {invoiceApprovedVouchers.map((vch, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-all border border-slate-100/50">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="text-[11px] font-[1000] text-slate-800 uppercase tracking-tight">INV: {vch.invoice_no || 'Pending'}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 italic">
                                        {vch.sub_job_no} · {vch.group_name} · {vch.outsource_qty || 0} pcs · {vch.vendor_name} · ₹{(vch.invoice_amt || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-2 mb-1">
                                    {/* <span className="text-emerald-500 text-[10px] font-black uppercase">Approved</span>
                                    <span className="text-slate-200">|</span> */}
                                    <Factory className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vch.invoice_date || vch.assigned_at || '-'}</span>
                            </div>
                        </div>
                    ))}
                    {invoiceApprovedVouchers.length === 0 && (
                        <div className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No approved vouchers found
                        </div>
                    )}
                </div>

                {/* Export to Tally */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between mt-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[12px] font-[1000] text-slate-800 uppercase tracking-tight">EXPORT TO TALLY XML</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {invoiceApprovedVouchers.length} vouchers - Copy and import into Tally
                            </p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-[#0c1a2e] text-white text-[9px] font-[1000] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        GENERATE XML
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockDashboard;
