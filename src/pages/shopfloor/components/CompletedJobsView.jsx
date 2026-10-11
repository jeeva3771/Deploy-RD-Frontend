import React, { useState, useMemo, useEffect } from 'react';
import { axiosInstance } from '../../../utils/url/config';
import {
    CheckCircle2,
    X,
    Factory,
    Calendar,
    ShoppingCart,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    Search,
    ChevronDown,
    ChevronRight,
    ArrowDownLeft
} from 'lucide-react';

import ProgressStat from './ProgressStat';
import StatItem from './StatItem';
import StatsCard from './StatsCard';
import AnalysisCard from './AnalysisCard';
import JobCard from './JobCard';

import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';

const reconstructCyclesFromHistory = (history) => {
    if (!history || !Array.isArray(history)) return [];

    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const cycles = [];
    let pCycleCount = 0;
    let rCycleCount = 0;
    let sCycleCount = 0;

    sorted.forEach((item, index) => {
        const action = item.action || '';
        const details = item.details || {};

        if (action.includes('SAMPLE CYCLE') && action.includes('DONE')) {
            sCycleCount += 1;
            const numMatch = action.match(/SAMPLE CYCLE (\d+)/i);
            const cycleNum = numMatch ? parseInt(numMatch[1]) : sCycleCount;

            cycles.push({
                cycle_number: `Sample ${cycleNum}`,
                completed_at: item.timestamp,
                completed_by_name: item.operator_name || 'Operator',
                good_qty: details.good_qty || item.good_qty || 0,
                bad_qty: details.bad_qty || item.bad_qty || 0,
                handed_over: true
            });
        } else if (action.includes('PRODUCTION CYCLE') && action.includes('DONE')) {
            pCycleCount += 1;
            const numMatch = action.match(/PRODUCTION CYCLE (\d+)/i);
            const cycleNum = numMatch ? parseInt(numMatch[1]) : pCycleCount;

            // Find the next handover log after this cycle done log
            let good_qty = details.good_qty || 0;
            let bad_qty = details.bad_qty || 0;

            if (good_qty === 0 && bad_qty === 0) {
                const nextHandover = sorted.slice(index + 1).find(h =>
                    (h.action || '').includes('HANDED OVER') &&
                    !(h.action || '').includes('RECUT')
                );
                if (nextHandover) {
                    good_qty = nextHandover.details?.good_qty || nextHandover.good_qty || 0;
                    bad_qty = nextHandover.details?.bad_qty || nextHandover.bad_qty || 0;
                }
            }

            cycles.push({
                cycle_number: `Cycle ${cycleNum}`,
                completed_at: item.timestamp,
                completed_by_name: item.operator_name || 'Operator',
                good_qty,
                bad_qty,
                handed_over: true
            });
        } else if (action.includes('RECUT CYCLE') && action.includes('DONE')) {
            rCycleCount += 1;
            const numMatch = action.match(/RECUT CYCLE (\d+)/i);
            const cycleNum = numMatch ? parseInt(numMatch[1]) : rCycleCount;

            // Find the next recut handover log
            let good_qty = details.good_qty || 0;
            let bad_qty = details.bad_qty || 0;

            if (good_qty === 0 && bad_qty === 0) {
                const nextHandover = sorted.slice(index + 1).find(h =>
                    (h.action || '').includes('HANDED OVER') &&
                    (h.action || '').includes('RECUT')
                );
                if (nextHandover) {
                    good_qty = nextHandover.details?.good_qty || nextHandover.good_qty || 0;
                    bad_qty = nextHandover.details?.bad_qty || nextHandover.bad_qty || 0;
                }
            }

            cycles.push({
                cycle_number: `Recut ${cycleNum}`,
                completed_at: item.timestamp,
                completed_by_name: item.operator_name || 'Operator',
                good_qty,
                bad_qty,
                handed_over: true
            });
        }
    });

    return cycles.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
};

const CompletedJobsView = ({ onClose, jobs = [], processColors, onImageClick }) => {
    const [selectedJob, setSelectedJob] = useState(jobs[0] || null);
    const [mobileDetailView, setMobileDetailView] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inHouseData, setInHouseData] = useState({});
    const [groupOverallTimes, setGroupOverallTimes] = useState({});
    const [groupFlows, setGroupFlows] = useState({});
    const [loadingInHouse, setLoadingInHouse] = useState(false);
    const [openToggles, setOpenToggles] = useState({});

    const toggleSection = (assignKey, section) => {
        setOpenToggles(prev => ({
            ...prev,
            [assignKey]: {
                ...prev[assignKey],
                [section]: !prev[assignKey]?.[section]
            }
        }));
    };

    const isSectionOpen = (assignKey, section) => {
        return !!openToggles[assignKey]?.[section];
    };

    useEffect(() => {
        if (!selectedJob) return;

        let active = true;
        const loadInHouseData = async () => {
            setLoadingInHouse(true);
            setGroupFlows({});
            try {
                // 1. Fetch ready jobs for this job
                let readyJobs = [];
                try {
                    const readyRes = await axiosInstance.get('/shop-floor/ready-jobs', {
                        params: { shopfloor_job_id: selectedJob._id }
                    });
                    if (readyRes.data && readyRes.data.success) {
                        readyJobs = readyRes.data.data || [];
                    }
                } catch (e) {
                    console.error("Error fetching ready jobs in completed view:", e);
                }

                // 2. Fetch process flows for all non-outsourced/split groups
                const flows = {};
                const nonOutsourcedGroups = selectedJob.material_groups?.filter(mg =>
                    !mg.is_outsource || (mg.assigned_outsource_sheets < (mg.materials?.find(m => {
                        const cat = m.category_type?.toLowerCase() || '';
                        return !cat.includes('consumable') && !cat.includes('hardware');
                    })?.quantity || mg.sheets_required || 0))
                ) || [];

                await Promise.all(nonOutsourcedGroups.map(async (mg) => {
                    try {
                        const gid = mg.group_id || mg._id;
                        const flowRes = await axiosInstance.get(`/shop-floor/process-flow/${selectedJob._id}/${gid}`);
                        console.log(`[TEST] fetched process-flow for group ${gid}:`, flowRes.data);
                        if (flowRes.data && flowRes.data.success && flowRes.data.flow) {
                            flows[gid] = flowRes.data.flow;
                        }
                    } catch (e) {
                        console.error(`Error fetching process flow for group ${mg.group_id || mg._id}:`, e);
                    }
                }));

                if (!active) return;

                // 3. Combine them per group
                const combined = {};
                const overallTimes = {};
                selectedJob.material_groups?.forEach(mg => {
                    const gid = mg.group_id || mg._id;
                    const flow = flows[gid];
                    console.log(`[TEST] group ${gid} flow:`, flow);
                    if (flow?.session_state?.groupTimers) {
                        console.log(`[TEST] group ${gid} groupTimers overall:`, flow.session_state.groupTimers.overall);
                        overallTimes[gid] = flow.session_state.groupTimers.overall || 0;
                    }
                    const sCycles = flow?.session_state?.sample_cycles || [];
                    const pCycles = flow?.session_state?.primary_cycles || [];
                    const rCycles = flow?.session_state?.recut_cycles || [];
                    const readyCycles = readyJobs.filter(rj => String(rj.group_id) === String(gid));

                    const cycleMap = {};

                    // 1. Add sample cycles
                    sCycles.forEach(c => {
                        const key = `sample-${c.cycle_number}`;
                        cycleMap[key] = {
                            cycle_number: `Sample ${c.cycle_number}`,
                            good_qty: c.good_qty || 0,
                            bad_qty: c.bad_qty || 0,
                            completed_at: c.end_time || c.start_time || c.createdAt,
                            completed_by_name: c.started_by_name || c.operator_name || 'Operator',
                            handed_over: c.status === 'Approved'
                        };
                    });

                    // 2. Add primary cycles
                    pCycles.forEach(c => {
                        const key = `primary-${c.cycle_number}`;
                        cycleMap[key] = {
                            cycle_number: `Cycle ${c.cycle_number}`,
                            good_qty: c.good_qty || 0,
                            bad_qty: c.bad_qty || 0,
                            completed_at: c.end_time || c.start_time || c.createdAt,
                            completed_by_name: c.started_by_name || c.operator_name || 'Operator',
                            handed_over: false
                        };
                    });

                    // 3. Add recut cycles
                    rCycles.forEach(c => {
                        const key = `recut-${c.cycle_number}`;
                        cycleMap[key] = {
                            cycle_number: `Recut ${c.cycle_number}`,
                            good_qty: c.good_qty || 0,
                            bad_qty: c.bad_qty || 0,
                            completed_at: c.end_time || c.start_time || c.createdAt,
                            completed_by_name: c.started_by_name || c.operator_name || 'Operator',
                            handed_over: false
                        };
                    });

                    // 4. Merge handed over status from readyCycles into primary cycles
                    readyCycles.forEach(c => {
                        let key;
                        let displayPrefix = 'Cycle';
                        let displayCycleNum = c.cycle_number;

                        if (c.cycle_number >= 5000) {
                            key = `recut-${c.cycle_number - 5000}`;
                            displayPrefix = 'Recut';
                            displayCycleNum = c.cycle_number - 5000;
                        } else if (c.cycle_number >= 1000) {
                            key = `sample-${c.cycle_number - 1000}`;
                            displayPrefix = 'Sample';
                            displayCycleNum = c.cycle_number - 1000;
                        } else {
                            key = `primary-${c.cycle_number}`;
                        }

                        if (!cycleMap[key]) {
                            cycleMap[key] = {
                                cycle_number: `${displayPrefix} ${displayCycleNum}`,
                                good_qty: c.good_qty || 0,
                                bad_qty: c.bad_qty || 0,
                                completed_at: c.completed_at,
                                completed_by_name: c.completed_by_name || 'Operator',
                                handed_over: c.handed_over
                            };
                        } else {
                            cycleMap[key] = {
                                ...cycleMap[key],
                                handed_over: c.handed_over || cycleMap[key].handed_over,
                                completed_by_name: c.completed_by_name || cycleMap[key].completed_by_name
                            };
                        }
                    });

                    const finalCycles = Object.values(cycleMap).sort((a, b) => {
                        const dateA = a.completed_at ? new Date(a.completed_at) : new Date(0);
                        const dateB = b.completed_at ? new Date(b.completed_at) : new Date(0);
                        return dateA - dateB;
                    });
                    combined[gid] = finalCycles.length > 0 ? finalCycles : reconstructCyclesFromHistory(mg.process_history || []);
                });

                setInHouseData(combined);
                setGroupOverallTimes(overallTimes);
                setGroupFlows(flows);
            } catch (err) {
                console.error("Error building combined in-house data:", err);
            } finally {
                if (active) setLoadingInHouse(false);
            }
        };

        loadInHouseData();
        return () => {
            active = false;
        };
    }, [selectedJob]);

    const filteredJobs = useMemo(() => {
        if (!searchTerm) return jobs;
        const s = searchTerm.toUpperCase();
        return jobs.filter(j =>
            j.job_no?.toUpperCase().includes(s) ||
            j.sub_job_no?.toUpperCase().includes(s) ||
            j.client_name?.toUpperCase().includes(s)
        );
    }, [jobs, searchTerm]);

    const isInHouse = useMemo(() => {
        if (!selectedJob) return true;
        return !selectedJob.material_groups?.some(mg => mg.is_outsource || mg.assigned_outsource_sheets > 0);
    }, [selectedJob]);

    const isFullyOutsourced = useMemo(() => {
        if (!selectedJob || !selectedJob.material_groups) return false;
        return selectedJob.material_groups.every(mg => {
            const mainMat = mg.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            });
            const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
            return mg.is_outsource || (mg.assigned_outsource_sheets >= totalSheets && totalSheets > 0);
        });
    }, [selectedJob]);

    const { inHouseItems, outsourceItems } = useMemo(() => {
        const inHouse = [];
        const outsource = [];
        if (!selectedJob || !selectedJob.material_groups) return { inHouseItems: inHouse, outsourceItems: outsource };

        selectedJob.material_groups.forEach((mg) => {
            const mainMat = mg.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            });
            const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
            const outsourcedSheets = mg.assigned_outsource_sheets || 0;
            const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);

            if (mg.is_outsource || outsourcedSheets > 0 || mg.outsource_assignments?.length > 0) {
                outsource.push({
                    ...mg,
                    isOutsourceRender: true,
                    inHouseSheets,
                    outsourcedSheets,
                    totalSheets
                });
            }

            if (!mg.is_outsource) {
                if (inHouseSheets > 0 || outsourcedSheets === 0) {
                    inHouse.push({
                        ...mg,
                        isOutsourceRender: false,
                        inHouseSheets,
                        outsourcedSheets,
                        totalSheets
                    });
                }
            }
        });

        return { inHouseItems: inHouse, outsourceItems: outsource };
    }, [selectedJob]);

    const renderMaterialGroupCard = (mg, idx) => {
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
                status: mg.sheet_issue_status || 'Active'
            }] : []);
        const assignment = assignments[0] || {};
        const mainMat = mg.materials?.find(m => {
            const cat = m.category_type?.toLowerCase() || '';
            return !cat.includes('consumable') && !cat.includes('hardware');
        });
        const isUv = selectedJob?.process_name?.toUpperCase().includes('PRINTING') || selectedJob?.process_name?.toUpperCase().includes('UV');
        const ups = isUv ? 1 : (mainMat?.material_input?.ups || mg.ups || 1);
        const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
        const outsourcedSheets = mg.assigned_outsource_sheets || 0;
        const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);

        const outsourceOrdered = mg.isOutsourceRender ? (mg.assigned_outsource_ups || (outsourcedSheets * ups)) : (outsourcedSheets * ups);
        const inHouseOrdered = inHouseSheets * ups;
        const mgOrdered = mg.isOutsourceRender ? outsourceOrdered : inHouseOrdered;

        const gid = mg.group_id || mg._id;
        const flow = groupFlows[gid];
        let sampleApprovedCount = 0;
        let primaryGoodCount = 0;
        let recutGoodCount = 0;

        if (flow && flow.session_state) {
            const sCycles = flow.session_state.sample_cycles || [];
            const pCycles = flow.session_state.primary_cycles || [];
            const rCycles = flow.session_state.recut_cycles || [];

            sampleApprovedCount = sCycles.reduce((acc, c) => acc + (c.status === 'Approved' ? (Number(c.good_qty) || 0) : 0), 0);
            primaryGoodCount = pCycles.reduce((acc, c) => acc + (Number(c.good_qty) || 0), 0);
            recutGoodCount = rCycles.reduce((acc, c) => acc + (Number(c.good_qty) || 0), 0);
        } else {
            const history = mg.process_history || [];
            const reconstructed = reconstructCyclesFromHistory(history);
            reconstructed.forEach(c => {
                if (String(c.cycle_number).startsWith('Recut')) {
                    recutGoodCount += (c.good_qty || 0);
                } else {
                    primaryGoodCount += (c.good_qty || 0);
                }
            });
            history.forEach(log => {
                const action = log.action || '';
                const details = log.details || {};
                if (action.toUpperCase().includes('SAMPLE APPROVED')) {
                    sampleApprovedCount += (details.good_qty || log.good_qty || 0);
                }
            });
        }

        const outsourceDelivered = assignments.reduce((acc, assign) => {
            return acc + (assign.batch_receipts?.filter(b => b.type === 'actual').reduce((sum, b) => sum + (b.qty || 0), 0) || 0);
        }, 0) || 0;
        const finalCycles = inHouseData[mg.group_id || mg._id] || reconstructCyclesFromHistory(mg.process_history || []);
        const inHouseDelivered = !mg.isOutsourceRender ? (sampleApprovedCount + primaryGoodCount + recutGoodCount) : finalCycles.reduce((sum, h) => sum + (h.good_qty || 0), 0);
        const mgDelivered = mg.isOutsourceRender ? outsourceDelivered : inHouseDelivered;

        const balance = mgOrdered - mgDelivered;

        return (
            <div key={`${mg._id || mg.group_id}-${mg.isOutsourceRender ? 'outsource' : 'inhouse'}-${idx}`} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8 mb-6">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-[1000] text-slate-900 uppercase italic tracking-wider">{mg.group_name}</h4>
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-black uppercase rounded-lg border border-purple-100">
                                    {mg.isOutsourceRender ? (mg.vendor_name || 'OUTSOURCED') : 'IN-HOUSE'}
                                </span>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {(() => {
                                    const primary = mg.materials?.find(m => {
                                        const cat = m.category_type?.toLowerCase() || '';
                                        return !cat.includes('consumable') && !cat.includes('hardware');
                                    });
                                    return primary?.material_input?.size || mg.materials?.[0]?.size || '-';
                                })()} — {mg.isOutsourceRender ? 'OUTSOURCE PRODUCTION' : 'IN-HOUSE PRODUCTION'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {mg.isOutsourceRender ? 'INVOICE APPROVED' : 'PRODUCTION COMPLETED'}
                    </div>
                </div>

                {/* Progress Bar for Received Qty */}
                <div className="mb-8 p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                        {mg.isOutsourceRender ? 'QTY RECEIVED FROM VENDOR' : 'PRODUCTION QUANTITY COMPLETED'}
                    </p>

                    <div className="grid grid-cols-4 gap-6 mb-4">
                        <div className="space-y-0.5">
                            <p className="text-xl font-[1000] text-slate-900 tracking-tighter">{mgOrdered}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                TOTAL TARGET
                            </p>
                        </div>
                        {!mg.isOutsourceRender ? (
                            <>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xl font-[1000] text-slate-900 tracking-tighter">{sampleApprovedCount}</p>
                                        {sampleApprovedCount > 0 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                    </div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                        SAMPLE APPROVED COUNT
                                    </p>
                                </div>
                                <div className="space-y-0.5 text-emerald-600">
                                    <p className="text-xl font-[1000] tracking-tighter">{primaryGoodCount}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">PRIMARY GOOD COUNT</p>
                                </div>
                                <div className="space-y-0.5 text-purple-600">
                                    <p className="text-xl font-[1000] tracking-tighter">{recutGoodCount}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">RECUT GOOD COUNT</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xl font-[1000] text-slate-900 tracking-tighter">{mgDelivered}</p>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                        DELIVERED / PRODUCED
                                    </p>
                                </div>
                                <div className="space-y-0.5 text-amber-600">
                                    <p className="text-xl font-[1000] tracking-tighter">{balance}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest">BALANCE</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xl font-[1000] text-slate-900 tracking-tighter">
                                        {assignments.length}
                                    </p>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                        TOTAL BATCHES
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                        <div className="h-full bg-purple-600 shadow-lg shadow-purple-600/20" style={{ width: `${(mgDelivered / (mgOrdered || 1) * 100).toFixed(0)}%` }}></div>
                    </div>
                </div>

                {/* Bottom Invoice Details Row */}
                {mg.isOutsourceRender && (
                    <div className="grid grid-cols-3 gap-12 px-4 mb-2">
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-3 h-3" /> INVOICE NO.
                            </p>
                            <p className="text-[12px] font-[1000] text-slate-800 uppercase italic tracking-widest">{assignment.invoice_no || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> INVOICE DATE
                            </p>
                            <p className="text-[12px] font-[1000] text-slate-800 uppercase italic tracking-widest">
                                {assignment.invoice_date || '-'}
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingCart className="w-3 h-3" /> INVOICE AMT
                            </p>
                            <p className="text-lg font-[1000] text-purple-700 italic tracking-tighter">₹{(assignment.invoice_amt || 0).toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Outsource Timelines (Accordions) */}
                {mg.isOutsourceRender && assignments.map((assignment, assignmentIdx) => {
                    const assignKey = `${selectedJob.sub_job_no || selectedJob.job_no}-${mg._id || mg.group_id}-${assignment.vendor_id || 'no-vendor'}-${assignmentIdx}`;

                    const assignmentHistory = [];
                    const processFlow = [];

                    // 1. Audit history
                    const groupLogs = (selectedJob.assign_history || []).filter(h =>
                        (String(h.group_id) === String(mg._id) || String(h.group_id) === String(mg.group_id)) &&
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

                    // 2. Stage history
                    (assignment.stage_history || []).forEach(stage => {
                        processFlow.push({
                            type: 'in',
                            label: stage.stage_label,
                            detail: `OUTSOURCE STAGE — ${(stage.stage_idx || 0) + 1}/7`,
                            note: `Completed on ${stage.updated_at || 'N/A'}`
                        });
                    });

                    if (assignmentHistory.length === 0 && processFlow.length === 0) return null;

                    return (
                        <div key={assignmentIdx} className="mt-6 space-y-6 pt-6 border-t border-slate-100 px-4">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                                OUTSOURCE TIMELINES ({assignment.vendor_name || 'VENDOR'})
                            </p>

                            {/* Assignment History */}
                            {assignmentHistory.length > 0 && (
                                <div className="space-y-3">
                                    <span className="text-[10px] font-[1000] text-indigo-800 uppercase tracking-widest font-bold block mb-1">
                                        Assignment Audit History ({assignmentHistory.length} logs)
                                    </span>
                                    <div className="space-y-2">
                                        {assignmentHistory.map((f, idx) => (
                                            <div key={idx} className={`p-3.5 rounded-2xl flex items-start justify-between ${f.type === 'out' ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                                                <div className="flex gap-4">
                                                    <div className={`mt-0.5 flex items-center gap-1.5 ${f.type === 'out' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {f.type === 'out' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                                                        <span className="text-[10px] font-[1000] uppercase tracking-tight">{f.label}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{f.detail}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">{f.note}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Process Flow / Stage History */}
                            {processFlow.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <span className="text-[10px] font-[1000] text-purple-800 uppercase tracking-widest font-bold block mb-1">
                                        Process Flow & Stage History ({processFlow.length} stages)
                                    </span>
                                    <div className="space-y-2">
                                        {processFlow.map((f, idx) => (
                                            <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-emerald-600">
                                                        <ArrowDownLeft className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-[1000] uppercase tracking-tight">{f.label}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{f.detail}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">{f.note}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* In-house Cycle Run Logs */}
                {!mg.isOutsourceRender && finalCycles && finalCycles.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-6 px-4">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">IN-HOUSE RUN LOGS (CYCLES)</p>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-sidebar-scroll pr-1">
                            {finalCycles.map((log, lIdx) => (
                                <div key={lIdx} className="flex justify-between items-center text-[10px] font-bold border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="text-slate-800 uppercase italic flex items-center gap-2">
                                            {typeof log.cycle_number === 'string' && (log.cycle_number.startsWith('Cycle') || log.cycle_number.startsWith('Recut') || log.cycle_number.startsWith('Sample'))
                                                ? log.cycle_number
                                                : `Cycle ${log.cycle_number || (lIdx + 1)}`
                                            }
                                            {log.handed_over && (
                                                <span className="text-[7px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded border border-emerald-100 uppercase tracking-widest font-black leading-none">HANDED OVER</span>
                                            )}
                                        </span>
                                        <span className="text-[8px] text-slate-400">{log.completed_at ? new Date(log.completed_at).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex gap-3 text-[11px] tracking-tighter font-extrabold">
                                            <span className="text-emerald-500">{log.produced_qty || log.good_qty || 0}G</span>
                                            {log.bad_qty > 0 ? <span className="text-amber-500">{log.bad_qty}R</span> : <span className="text-slate-300">0R</span>}
                                        </div>
                                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-black">{log.completed_by_name || 'Operator'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const stats = useMemo(() => {
        if (!selectedJob) return { ordered: 0, delivered: 0, shortfall: 0 };

        const isUv = selectedJob?.process_name?.toUpperCase().includes('PRINTING') || selectedJob?.process_name?.toUpperCase().includes('UV');

        const ordered = selectedJob.material_groups?.reduce((acc, mg) => {
            const mainMat = mg.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            });
            const ups = isUv ? 1 : (mainMat?.material_input?.ups || mg.ups || 1);
            const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
            const outsourcedSheets = mg.assigned_outsource_sheets || 0;
            const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);

            const outsourceOrdered = mg.is_outsource ? (mg.assigned_outsource_ups || (outsourcedSheets * ups)) : (outsourcedSheets * ups);
            const inHouseOrdered = inHouseSheets * ups;
            return acc + outsourceOrdered + inHouseOrdered;
        }, 0) || 0;

        const delivered = selectedJob.material_groups?.reduce((acc, mg) => {
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
                    status: mg.sheet_issue_status || 'Active'
                }] : []);
            const outsourceDelivered = assignments.reduce((bAcc, assign) => {
                return bAcc + (assign.batch_receipts?.filter(b => b.type === 'actual').reduce((s, b) => s + (b.qty || 0), 0) || 0);
            }, 0) || 0;

            const finalCycles = inHouseData[mg.group_id || mg._id] || reconstructCyclesFromHistory(mg.process_history || []);
            const inHouseDelivered = finalCycles.reduce((sum, h) => sum + (h.good_qty || 0), 0);
            return acc + outsourceDelivered + inHouseDelivered;
        }, 0) || 0;

        return {
            ordered,
            delivered,
            shortfall: Math.max(0, ordered - delivered)
        };
    }, [selectedJob, inHouseData]);

    const { totalMaterialCost, costPerUnit, groupCosts } = useMemo(() => {
        if (!selectedJob) return { totalMaterialCost: 0, costPerUnit: 0, groupCosts: {} };

        let total = 0;
        const groupCosts = {};

        selectedJob.material_groups?.forEach((mg, idx) => {
            const inwardCost = mg.inward_history?.reduce((acc, log) => acc + (log.accepted_value || 0), 0) || 0;
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
                    status: mg.sheet_issue_status || 'Active'
                }] : []);
            const outsourceCost = assignments.reduce((acc, assign) => acc + (assign.invoice_amt || (assign.outsource_qty * assign.outsource_rate) || 0), 0) || 0;


            let gCost = inwardCost + outsourceCost;

            groupCosts[mg.group_id || mg._id] = Math.round(gCost);
            total += gCost;
        });

        const deliveredQty = stats.delivered || selectedJob.total_qty || 1;
        const totalCost = Math.round(total);
        const perUnit = (totalCost / (deliveredQty || 1)).toFixed(2);

        return {
            totalMaterialCost: totalCost,
            costPerUnit: perUnit,
            groupCosts
        };
    }, [selectedJob, stats.delivered]);

    if (!selectedJob && jobs.length > 0) {
        setSelectedJob(jobs[0]);
    }

    return (
        <div className="flex-1 flex h-full overflow-hidden bg-[#f8fafc]">
            <style>
                {`
                .custom-sidebar-scroll::-webkit-scrollbar {
                    width: 10px !important;
                    display: block !important;
                }
                .custom-sidebar-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9 !important;
                    border-radius: 10px !important;
                }
                .custom-sidebar-scroll::-webkit-scrollbar-thumb {
                    background: #27374dff !important;
                    border-radius: 10px !important;
                    border: 2px solid #f1f5f9 !important;
                }
                .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: #3f4f64ff !important;
                }
                `}
            </style>
            {/* Sidebar (Screen 1 on Mobile: Completed Jobs Card Grid/List) */}
            <div className={`w-[320px] shrink-0 h-full flex flex-col border-r border-slate-200 bg-white overflow-hidden ${mobileDetailView ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[14px] font-[1000] text-slate-800 uppercase tracking-widest italic">COMPLETED</h2>
                            <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                                {jobs.length}
                            </span>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter completed jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-sidebar-scroll">
                    {filteredJobs.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-300 italic">
                            <Package className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No completed jobs found</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => {
                            const isActive = selectedJob?._id === job._id;
                            const currentTheme = processColors[job.process_name?.toUpperCase()] || { bg: 'bg-white', text: 'text-slate-900', pill: 'bg-slate-100', border: 'border-slate-200' };

                            return (
                                <JobCard
                                    key={job._id}
                                    job={{
                                        ...job,
                                        id: `${job.job_no}/${job.sub_job_no}`,
                                        customer: job.client_name,
                                        color: currentTheme.bar || 'bg-emerald-500',
                                        theme: currentTheme
                                    }}
                                    onClick={() => {
                                        setSelectedJob(job);
                                        setMobileDetailView(true);
                                    }}
                                    onImageClick={onImageClick}
                                    isActive={isActive}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Detail Area */}
            <div className="flex-1 overflow-y-auto bg-[#f1f5f9] p-6 scrollbar-thin scrollbar-thumb-slate-300">
                {/* Mobile Back Button Bar */}
                {mobileDetailView && (
                    <div className="md:hidden mb-4 flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-md">
                        <button
                            onClick={() => setMobileDetailView(false)}
                            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Completed List</span>
                        </button>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {selectedJob?.job_no}/{selectedJob?.sub_job_no}
                        </span>
                    </div>
                )}
                {!selectedJob ? (
                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                        Select a job from the list to view details
                    </div>
                ) : (
                    <div className="max-w-[1300px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        {/* Header Section */}
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-[1000] text-slate-900 tracking-tighter uppercase italic">{selectedJob.job_no}/{selectedJob.sub_job_no}</h2>
                                    {selectedJob.is_reprocess && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-200 shadow-sm">
                                            REPROCESS
                                        </span>
                                    )}
                                    {!isFullyOutsourced && (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                            IN-HOUSE
                                        </span>
                                    )}
                                    {!isInHouse && (
                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-purple-100">
                                            OUTSOURCED
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedJob.product_name || selectedJob.client_name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-9 h-9 flex items-center justify-center bg-amber-400 rounded-full shadow-lg shadow-amber-400/20 hover:scale-110 transition-all text-white">
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                                <button onClick={onClose} className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Top Stats Cards - Vendor Info */}
                        {!isInHouse && (
                            <div className="grid grid-cols-4 gap-4">
                                {selectedJob.material_groups?.slice(0, 1).map((mg, idx) => {
                                    const assignment = mg.outsource_assignments?.[0] || {};
                                    const mainMat = mg.materials?.find(m => {
                                        const cat = m.category_type?.toLowerCase() || '';
                                        return !cat.includes('consumable') && !cat.includes('hardware');
                                    });
                                    const ups = mainMat?.material_input?.ups || mg.ups || 1;
                                    const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                                    const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                                    const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);

                                    const outsourceOrdered = mg.is_outsource ? (mg.assigned_outsource_ups || (outsourcedSheets * ups)) : (outsourcedSheets * ups);
                                    const inHouseOrdered = inHouseSheets * ups;
                                    const mgOrdered = outsourceOrdered + inHouseOrdered;

                                    const outsourceDelivered = mg.outsource_assignments?.reduce((acc, assign) => {
                                        return acc + (assign.batch_receipts?.filter(b => b.type === 'actual').reduce((sum, b) => sum + (b.qty || 0), 0) || 0);
                                    }, 0) || 0;
                                    const finalCycles = inHouseData[mg.group_id || mg._id] || reconstructCyclesFromHistory(mg.process_history || []);
                                    const inHouseDelivered = finalCycles.reduce((sum, h) => sum + (h.good_qty || 0), 0);
                                    const mgDelivered = outsourceDelivered + inHouseDelivered;

                                    const sheetsIssued = totalSheets;

                                    const primaryMaterial = mg.materials?.find(m => {
                                        const cat = m.category_type?.toLowerCase() || '';
                                        return !cat.includes('consumable') && !cat.includes('hardware');
                                    });
                                    const sheetSize = primaryMaterial?.material_input?.size || mg.materials?.[0]?.size || '-';
                                    const isUv = selectedJob.process_name?.toUpperCase().includes('PRINTING') || selectedJob.process_name?.toUpperCase().includes('UV');

                                    const overallSeconds = groupOverallTimes[mg.group_id || mg._id];
                                    const totalCutTime = overallSeconds !== undefined && overallSeconds !== null
                                        ? (overallSeconds / 60).toFixed(2)
                                        : (mg.total_cut_time || null);

                                    return (
                                        <div key={idx} className="col-span-4 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-6 flex items-center justify-between group/vendor">
                                            <div className="flex items-center gap-8">
                                                <div className="w-14 h-14 bg-purple-50 rounded-[1.5rem] flex items-center justify-center border border-purple-100">
                                                    <Factory className="w-6 h-6 text-purple-600" />
                                                </div>
                                                <div className="grid grid-cols-6 gap-x-10 gap-y-2">
                                                    {(() => {
                                                        return (
                                                            <>
                                                                <StatItem label="VENDOR" value={mg.vendor_name || (mg.is_outsource ? '-' : 'IN-HOUSE')} isBold />
                                                                <StatItem label={isUv ? "PIECE SIZE" : "SHEET SIZE"} value={sheetSize} />
                                                                <StatItem label={isUv ? "PIECES ISSUED" : "SHEETS ISSUED"} value={isUv ? `${sheetsIssued} pcs` : `${sheetsIssued} sheets`} />
                                                                <StatItem label="OUTPUT REQD" value={`${mgOrdered} pcs`} />
                                                                <StatItem label="PCS RECD" value={`${mgDelivered}/${mgOrdered} pcs`} highlight />
                                                                <StatItem label={isUv ? "RATE / PC" : "RATE / MIN"} value={isUv ? `₹${mg.outsource_rate || 0}/pc` : `₹${mg.outsource_rate || 0}/min`} />
                                                            </>
                                                        );
                                                    })()}

                                                    <div className="col-span-2">
                                                        <StatItem
                                                            label={isUv ? "PIECES OUTSOURCED" : "TOTAL CUT TIME"}
                                                            value={isUv ? `${outsourcedSheets} pcs` : (totalCutTime ? `${totalCutTime} min` : "-")}
                                                        />
                                                    </div>
                                                    <StatItem
                                                        label="TOTAL JOB VALUE"
                                                        value={isUv
                                                            ? `₹${Math.round((mg.outsource_rate || 0) * outsourcedSheets)}`
                                                            : (totalCutTime ? `₹${Math.round((mg.outsource_rate || 0) * parseFloat(totalCutTime))}` : '-')}
                                                        highlightGreen
                                                    />
                                                    <StatItem label="INVOICE NO." value={assignment.invoice_no || '-'} />
                                                    <StatItem label="INVOICE DATE" value={assignment.invoice_date || '-'} />
                                                    <StatItem label="INVOICE AMT" value={`₹${(assignment.invoice_amt || 0).toLocaleString()}`} highlightPurple />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Status Stats */}
                        {!isInHouse && (
                            <div className="grid grid-cols-3 gap-4">
                                <StatsCard label="TOTAL ORDERED" value={stats.ordered} sub="units" color="blue" />
                                <StatsCard label="VENDOR DELIVERED" value={stats.delivered} sub="/ Complete" color="emerald" icon={<CheckCircle2 className="w-4 h-4" />} />
                                <StatsCard label="SHORTFALL" value={stats.shortfall} sub="pcs short" color="amber" />
                            </div>
                        )}

                        {/* Analysis Section */}
                        {/* <div className="grid grid-cols-3 gap-4">
                            <AnalysisCard label="PLANNED SQ.IN" value="5.9k" icon={<ArrowUpRight className="w-4 h-4" />} />
                            <AnalysisCard label="ACTUAL SQ.IN" value="5.5k" icon={<ArrowDownRight className="w-4 h-4" />} />
                            <AnalysisCard label="SAVED" value="3,960" color="emerald" icon={<TrendingUp className="w-5 h-5" />} />
                        </div> */}

                        {/* Material Cost Analysis */}
                        <div className="bg-[#1e293b] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>

                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> MATERIAL COST ANALYSIS
                            </span>

                            <div className="grid grid-cols-2 gap-16 divide-x divide-slate-700/50">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">TOTAL MATERIAL COST</p>
                                    <p className="text-5xl font-[1000] italic tracking-tighter mb-1">₹{totalMaterialCost.toLocaleString()}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">all materials combined</p>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">COST PER UNIT</p>
                                    <p className="text-5xl font-[1000] italic tracking-tighter text-emerald-400 mb-1">₹{costPerUnit}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">per trophy / per piece</p>
                                </div>
                            </div>

                            <div className="mt-12 grid grid-cols-2 gap-x-16 gap-y-4">
                                {selectedJob.material_groups?.map((mg, idx) => {
                                    const cost = groupCosts[mg.group_id || mg._id] || 0;
                                    return (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[12px] font-[1000] uppercase italic tracking-wider">{mg.group_name}</p>
                                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{mg.materials?.length || 0} items</p>
                                                </div>
                                                <p className="text-[12px] font-[1000] uppercase tracking-tighter">₹{cost.toLocaleString()}</p>
                                            </div>
                                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500/40" style={{ width: `${60 + idx * 20}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* In-House Production Items Section */}
                        {inHouseItems.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-2">
                                    <Factory className="w-4 h-4" />
                                    IN-HOUSE PRODUCTION ITEMS
                                </h3>
                                {inHouseItems.map((mg, idx) => renderMaterialGroupCard(mg, idx))}
                            </div>
                        )}

                        {/* Outsource Items Section */}
                        {outsourceItems.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" />
                                    OUTSOURCE ITEMS
                                </h3>
                                {outsourceItems.map((mg, idx) => renderMaterialGroupCard(mg, idx))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedJobsView;
