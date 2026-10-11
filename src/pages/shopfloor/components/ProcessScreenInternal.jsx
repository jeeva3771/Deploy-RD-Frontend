import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    X, Package, Clock, LayoutGrid, Activity, User,
    ClipboardCheck, AlertCircle, AlertTriangle,
    CheckCircle2, Sun, Target, Microscope, ChevronRight,
    Play, Info, ListChecks, History, ArrowLeft, Maximize2,
    Terminal, Search, FileText, Factory, Printer, Minus, Plus, Camera
} from 'lucide-react';
import { fetchAllUsers } from '../../../reducer/userReducer';
import { logShopFloorActivityApi, fetchShopFloorJobs } from '../../../reducer/shopFloorReducer';
import { fetchProcessFlow, syncSessionStateApi, confirmCompletionPopupApi } from '../../../reducer/shopFloorProcessFlowReducer';
import { axiosInstance } from '../../../utils/url/config';
import { toast } from 'react-toastify';
import MaterialInwardModal from './MaterialInwardModal';
import ActivityLogModal from './ActivityLogModal';
import ProcessInputForm from './ProcessInputForm';

const ProcessScreenInternal = ({ type, jobId, isUvFlow = false, isActive = true, onComplete }) => {
    const dispatch = useDispatch();
    const { jobs, loading } = useSelector(state => state.shopFloor);
    const { users } = useSelector(state => state.user);

    const [selectedGroupIds, setSelectedGroupIds] = useState(() => {
        const jobObj = jobs.find(j => j._id === jobId);
        if (!jobObj) return [];
        const groups = (jobObj.material_groups || []).filter(mg => {
            const totalGoodInwarded = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
            return totalGoodInwarded > 0 && mg.current_step !== 'Completed';
        });
        return groups.map(g => g._id || g.group_id);
    });
    const [view, setView] = useState('SELECTION');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
    const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
    const [activeModalGroupId, setActiveModalGroupId] = useState(null);
    const [samplePhotos, setSamplePhotos] = useState({});

    // DB Persisted States
    const [quantities, setQuantities] = useState(() => {
        const initial = {};
        const jobObj = jobs.find(j => j._id === jobId);
        if (jobObj) {
            const groups = (jobObj.material_groups || []).filter(mg => {
                const totalGoodInwarded = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
                return totalGoodInwarded > 0 && mg.current_step !== 'Completed';
            });
            groups.forEach(mg => {
                const id = mg._id || mg.group_id;
                const mainMat = mg.materials?.find(m => {
                    const cat = m.category_type?.toLowerCase() || '';
                    return !cat.includes('consumable') && !cat.includes('hardware');
                });
                const ups = mainMat?.material_input?.ups || mg.ups || 1;
                const inwardedGood = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
                const totalUnits = inwardedGood * ups;
                const processed = (mg.process_history || []).reduce((acc, log) => {
                    const goodVal = typeof log.good_qty === 'number'
                        ? log.good_qty
                        : (log.details?.good_qty || 0);
                    return acc + goodVal;
                }, 0);
                const pending = Math.max(0, totalUnits - processed);
                const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);
                const inHouseQty = inHouseSheets * ups;
                const jobTargetPending = Math.max(0, inHouseQty - processed);

                initial[id] = {
                    good: pending,
                    reject: 0,
                    produced: pending,
                    sample_size: Math.min(10, pending),
                    sample_good: 0,
                    sample_reject: 0,
                    sample_cycles: 0,
                    pendingUnits: pending,
                    jobTargetPending: jobTargetPending
                };
            });
        }
        return initial;
    });
    const [sampleUps, setSampleUps] = useState({});
    const [runningCycles, setRunningCycles] = useState({});
    const [localLogs, setLocalLogs] = useState([]);
    const [sampleInputs, setSampleInputs] = useState({});
    const [primaryUnlocked, setPrimaryUnlocked] = useState({});
    const [primaryUps, setPrimaryUps] = useState({});
    const [isUpsConfirmed, setIsUpsConfirmed] = useState({});
    const [selectedOperator, setSelectedOperator] = useState({});
    const [selectedHeads, setSelectedHeads] = useState({});
    const debounceTimer = React.useRef(null);
    const cachedProcessStates = React.useRef({});
    const [groupTimers, setGroupTimers] = useState({});
    const [sampleCycles, setSampleCycles] = useState({});
    const [primaryCycles, setPrimaryCycles] = useState({});
    const [primaryCycleHistory, setPrimaryCycleHistory] = useState({});
    const [recutCycles, setRecutCycles] = useState({});
    const [haveExcessSheet, setHaveExcessSheet] = useState({});
    const [localReturnExcessChoice, setLocalReturnExcessChoice] = useState('');
    const [excessQtyInput, setExcessQtyInput] = useState(0);
    const [excessSqftInput, setExcessSqftInput] = useState(0);
    const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
    const [excessConfirmed, setExcessConfirmed] = useState({});
    const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);

    // Find the specific job
    const job = useMemo(() => jobs.find(j => j._id === jobId), [jobs, jobId]);
    const isUv = job?.department === 'Print' || job?.department === 'UV Printing';

    // Force reload from DB when tab becomes active
    useEffect(() => {
        if (isActive) {
            setHasLoadedFromDb(false);
        }
    }, [isActive]);

    // Interceptor to record log activity on MongoDB process history
    const handleAddLocalLog = (newLogOrFn) => {
        setLocalLogs(prev => {
            let logsToProcess = [];
            if (typeof newLogOrFn === 'function') {
                logsToProcess = newLogOrFn(prev);
            } else {
                logsToProcess = [newLogOrFn, ...prev];
            }

            const newItemsCount = logsToProcess.length - prev.length;
            if (newItemsCount > 0) {
                const addedLogs = logsToProcess.slice(0, newItemsCount);
                addedLogs.forEach(log => {
                    const selectedUser = (users || []).find(u => u.name === log.operator || u.username === log.operator);
                    const cleanAction = log.action || '';
                    const details = {
                        ...log.details,
                        remarks: log.remarks || '',
                        good_qty: log.good_qty !== undefined ? log.good_qty : (log.details?.good_qty || 0),
                        bad_qty: log.bad_qty !== undefined ? log.bad_qty : (log.details?.bad_qty || 0)
                    };

                    dispatch(logShopFloorActivityApi({
                        id: jobId,
                        payload: {
                            activity_type: log.activity_type === 'sampling' ? 'Sampling' : 'Production',
                            action: cleanAction,
                            operator_name: log.operator || selectedUser?.name || selectedUser?.username || 'Operator',
                            operator_id: selectedUser?._id,
                            timestamp: log.timestamp || new Date().toISOString(),
                            affected_groups: [log.groupId || activeModalGroupId],
                            details: details
                        }
                    }));
                });
            }

            return logsToProcess;
        });
    };

    const reconstructCyclesFromHistory = (history) => {
        const sampleCycles = [];
        const primaryCycles = [];
        const recutCycles = [];

        (history || []).forEach(item => {
            const action = item.action || '';
            const details = item.details || {};
            if (action.includes('SAMPLE CYCLE')) {
                const numMatch = action.match(/SAMPLE CYCLE (\d+)/i);
                const cycleNum = numMatch ? parseInt(numMatch[1]) : 1;
                sampleCycles.push({
                    cycle_number: cycleNum,
                    start_time: item.timestamp,
                    good_qty: details.good_qty || 0,
                    bad_qty: details.bad_qty || 0,
                    status: action.includes('DONE') ? 'Completed' : 'Running',
                    action_at: item.timestamp
                });
            } else if (action.includes('PRODUCTION CYCLE')) {
                const numMatch = action.match(/PRODUCTION CYCLE (\d+)/i);
                const cycleNum = numMatch ? parseInt(numMatch[1]) : 1;
                primaryCycles.push({
                    cycle_number: cycleNum,
                    start_time: item.timestamp,
                    end_time: item.timestamp,
                    started_by_name: item.operator_name || '',
                    good_qty: details.good_qty || 0,
                    bad_qty: details.bad_qty || 0,
                    status: 'Completed'
                });
            } else if (action.includes('RECUT CYCLE')) {
                const numMatch = action.match(/RECUT CYCLE (\d+)/i);
                const cycleNum = numMatch ? parseInt(numMatch[1]) : 1;
                recutCycles.push({
                    cycle_number: cycleNum,
                    start_time: item.timestamp,
                    end_time: item.timestamp,
                    good_qty: details.good_qty || 0,
                    bad_qty: details.bad_qty || 0,
                    status: 'Completed'
                });
            }
        });

        return { sampleCycles, primaryCycles, recutCycles };
    };

    // Load session_state from MongoDB on mount/selected groups change
    useEffect(() => {
        const loadProcessFlowData = async () => {
            if (!job || selectedGroupIds.length === 0 || hasLoadedFromDb || !isActive) return;
            try {
                let dbQuantities = {};
                let dbSampleUps = {};
                let dbRunningCycles = {};
                let dbLocalLogs = [];
                let dbSampleInputs = {};
                let dbPrimaryUnlocked = {};
                let dbPrimaryUps = {};
                let dbIsUpsConfirmed = {};
                let dbSelectedOperator = {};
                let dbSelectedHeads = {};
                let dbGroupTimers = {};
                let dbSampleCycles = {};
                let dbPrimaryCycles = {};
                let dbPrimaryCycleHistory = {};
                let dbRecutCycles = {};
                let dbHaveExcessSheet = {};
                let dbExcessConfirmed = {};

                for (const groupId of selectedGroupIds) {
                    const response = await dispatch(fetchProcessFlow({ shopfloor_job_id: jobId, group_id: groupId })).unwrap();
                    if (response?.success && response?.flow?.session_state) {
                        const ss = response.flow.session_state;
                        const mg = job.material_groups?.find(g => String(g._id || g.group_id) === String(groupId));

                        let pCycles = ss.primary_cycles || [];
                        let sCycles = (Array.isArray(response.flow?.sample_cycles) && response.flow.sample_cycles.length > 0)
                            ? response.flow.sample_cycles
                            : (ss.sample_cycles || []);
                        let rCycles = ss.recut_cycles || [];
                        let runCycles = ss.runningCycles || {};
                        let groupQty = ss.quantities || {};

                        // Reconstruct from process history if empty
                        if (mg) {
                            const reconstructed = (mg.process_history && mg.process_history.length > 0)
                                ? reconstructCyclesFromHistory(mg.process_history)
                                : { primaryCycles: [], sampleCycles: [], recutCycles: [] };

                            if (pCycles.length === 0) pCycles = reconstructed.primaryCycles;
                            if (sCycles.length === 0) sCycles = reconstructed.sampleCycles;
                            if (rCycles.length === 0) rCycles = reconstructed.recutCycles;

                            // Self-heal completed primary cycles count
                            const completedPrimaryCount = pCycles.filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time).length;
                            runCycles = {
                                ...runCycles,
                                cyclesDone: completedPrimaryCount
                            };
                        }

                        let groupRunCycle = (runCycles && runCycles[groupId]) ? runCycles[groupId] : (runCycles && runCycles.status) ? runCycles : { status: 'IDLE' };
                        if (response.flow.bom_sample_status === 'SAMPLE_REJECTED_INTERNAL') {
                            const dept = (job?.department || '').toLowerCase();
                            const procName = (job?.process_name || '').toLowerCase();
                            const isFirstProc = procName.includes('laser') || procName.includes('cutting') || procName.includes('cut') || procName.includes('router') || procName.includes('cnc') || dept.includes('laser') || dept.includes('cutting');
                            if (isFirstProc) {
                                groupRunCycle = { ...groupRunCycle, status: 'IDLE', is_rerun: true, issuedGood: 0, issuedBad: 0 };
                            } else {
                                groupRunCycle = { ...groupRunCycle, status: 'WAITING_UPSTREAM', is_rerun: true, issuedGood: 0, issuedBad: 0 };
                            }
                        }

                        const sampleCyclesCount = (sCycles || []).length;
                        const sampleGoodCount = (sCycles || []).filter(c => (c.good_qty || 0) > 0 && c.status !== 'Rejected' && c.status !== 'REJECTED').reduce((sum, c) => sum + (c.good_qty || 0), 0);
                        const sampleRejectCount = (sCycles || []).filter(c => (c.bad_qty || 0) > 0 || c.status === 'Rejected' || c.status === 'REJECTED').reduce((sum, c) => sum + (c.bad_qty || 0), 0);

                        groupQty = {
                            ...groupQty,
                            sample_cycles: Math.max(groupQty.sample_cycles || 0, sampleCyclesCount),
                            sample_good: Math.max(groupQty.sample_good || 0, sampleGoodCount),
                            sample_reject: Math.max(groupQty.sample_reject || 0, sampleRejectCount)
                        };

                        dbQuantities[groupId] = groupQty;
                        dbSampleUps[groupId] = ss.sampleUps;
                        dbRunningCycles[groupId] = groupRunCycle;
                        if (ss.localLogs && Array.isArray(ss.localLogs)) {
                            ss.localLogs.forEach(log => {
                                if (!dbLocalLogs.some(l => l.timestamp === log.timestamp)) {
                                    dbLocalLogs.push(log);
                                }
                            });
                        }
                        dbSampleInputs[groupId] = ss.sampleInputs;
                        const isApprovedBySales = response?.flow?.bom_sample_status === 'APPROVED_BY_SALES' || job?.bom_sample_status === 'APPROVED_BY_SALES';
                        dbPrimaryUnlocked[groupId] = ss.primaryUnlocked || (isApprovedBySales ? {
                            cycleCount: response?.flow?.sample_cycles?.length || ss.sample_cycles?.length || 1,
                            goodQty: groupQty.sample_good || 1,
                            badQty: groupQty.sample_reject || 0,
                            totalPcs: (groupQty.sample_good || 1) + (groupQty.sample_reject || 0)
                        } : undefined);
                        dbPrimaryUps[groupId] = ss.primaryUps;
                        dbIsUpsConfirmed[groupId] = ss.isUpsConfirmed;
                        dbSelectedOperator[groupId] = ss.selectedOperator;
                        dbSelectedHeads[groupId] = ss.selectedHeads;
                        dbGroupTimers[groupId] = ss.groupTimers;
                        dbSampleCycles[groupId] = sCycles;
                        dbPrimaryCycles[groupId] = pCycles;
                        dbPrimaryCycleHistory[groupId] = ss.primary_cycle_history || [];
                        dbRecutCycles[groupId] = rCycles;
                        if (ss.haveExcessSheet !== undefined) dbHaveExcessSheet[groupId] = ss.haveExcessSheet;
                        if (ss.excessConfirmed !== undefined) {
                            dbExcessConfirmed[groupId] = ss.excessConfirmed[groupId] || ss.excessConfirmed;
                        }
                    }
                }

                setQuantities(prev => {
                    const merged = { ...prev };
                    Object.keys(dbQuantities).forEach(groupId => {
                        merged[groupId] = { ...merged[groupId], ...dbQuantities[groupId] };
                    });
                    return merged;
                });
                setSampleUps(prev => ({ ...prev, ...dbSampleUps }));
                setRunningCycles(prev => ({ ...prev, ...dbRunningCycles }));
                setLocalLogs(prev => {
                    const merged = [...prev];
                    dbLocalLogs.forEach(log => {
                        if (!merged.some(l => l.timestamp === log.timestamp)) {
                            merged.push(log);
                        }
                    });
                    return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                });
                setSampleInputs(prev => ({ ...prev, ...dbSampleInputs }));
                setPrimaryUnlocked(prev => ({ ...prev, ...dbPrimaryUnlocked }));
                setPrimaryUps(prev => ({ ...prev, ...dbPrimaryUps }));
                setIsUpsConfirmed(prev => ({ ...prev, ...dbIsUpsConfirmed }));
                setSelectedOperator(prev => ({ ...prev, ...dbSelectedOperator }));
                setSelectedHeads(prev => ({ ...prev, ...dbSelectedHeads }));
                setGroupTimers(prev => ({ ...prev, ...dbGroupTimers }));
                setSampleCycles(prev => ({ ...prev, ...dbSampleCycles }));
                setPrimaryCycles(prev => ({ ...prev, ...dbPrimaryCycles }));
                setPrimaryCycleHistory(prev => ({ ...prev, ...dbPrimaryCycleHistory }));
                setRecutCycles(prev => ({ ...prev, ...dbRecutCycles }));
                setHaveExcessSheet(prev => ({ ...prev, ...dbHaveExcessSheet }));
                setExcessConfirmed(prev => ({ ...prev, ...dbExcessConfirmed }));

                setHasLoadedFromDb(true);
            } catch (err) {
                console.error("Failed to load process flow session states:", err);
                setHasLoadedFromDb(true);
            }
        };

        loadProcessFlowData();
    }, [jobId, selectedGroupIds, job, dispatch, hasLoadedFromDb, isActive]);

    // Immediate state synchronization callback
    const triggerImmediateSync = async (groupId, overrides = {}) => {
        if (!hasLoadedFromDb || !job) return;

        // Use standard state variables with fallback or overrides
        const finalQuantities = overrides.quantities !== undefined ? overrides.quantities : quantities[groupId];
        const finalSampleUps = overrides.sampleUps !== undefined ? overrides.sampleUps : sampleUps[groupId];
        const finalRunningCycles = overrides.runningCycles !== undefined ? overrides.runningCycles : runningCycles[groupId];
        const finalLocalLogs = overrides.localLogs !== undefined ? overrides.localLogs : localLogs.filter(log => log.groupId === groupId);
        const finalSampleInputs = overrides.sampleInputs !== undefined ? overrides.sampleInputs : sampleInputs[groupId];
        const finalPrimaryUnlocked = overrides.primaryUnlocked !== undefined ? overrides.primaryUnlocked : primaryUnlocked[groupId];
        const finalPrimaryUps = overrides.primaryUps !== undefined ? overrides.primaryUps : primaryUps[groupId];
        const finalIsUpsConfirmed = overrides.isUpsConfirmed !== undefined ? overrides.isUpsConfirmed : isUpsConfirmed[groupId];
        const finalSelectedOperator = overrides.selectedOperator !== undefined ? overrides.selectedOperator : selectedOperator[groupId];
        const finalSelectedHeads = overrides.selectedHeads !== undefined ? overrides.selectedHeads : selectedHeads[groupId];
        const finalGroupTimers = overrides.groupTimers !== undefined ? overrides.groupTimers : groupTimers[groupId];
        const finalSampleCycles = overrides.sample_cycles !== undefined ? overrides.sample_cycles : (sampleCycles[groupId] || []);
        const finalPrimaryCycles = overrides.primary_cycles !== undefined ? overrides.primary_cycles : (primaryCycles[groupId] || []);
        const finalRecutCycles = overrides.recut_cycles !== undefined ? overrides.recut_cycles : (recutCycles[groupId] || []);
        const finalHaveExcessSheet = overrides.haveExcessSheet !== undefined ? overrides.haveExcessSheet : (haveExcessSheet[groupId] || false);
        const finalExcessConfirmed = overrides.excessConfirmed !== undefined ? overrides.excessConfirmed : (excessConfirmed[groupId] || {});

        const ss = {
            quantities: finalQuantities,
            sampleUps: finalSampleUps,
            runningCycles: finalRunningCycles,
            localLogs: finalLocalLogs,
            sampleInputs: finalSampleInputs,
            primaryUnlocked: finalPrimaryUnlocked,
            primaryUps: finalPrimaryUps,
            isUpsConfirmed: finalIsUpsConfirmed,
            selectedOperator: finalSelectedOperator,
            selectedHeads: finalSelectedHeads,
            groupTimers: finalGroupTimers,
            sample_cycles: finalSampleCycles,
            primary_cycles: finalPrimaryCycles,
            recut_cycles: finalRecutCycles,
            haveExcessSheet: finalHaveExcessSheet,
            excessConfirmed: finalExcessConfirmed
        };

        try {
            await dispatch(syncSessionStateApi({
                shopfloor_job_id: jobId,
                group_id: groupId,
                job_no: job?.job_no,
                sub_job_no: job?.sub_job_no,
                category: job?.category,
                subcategory: job?.subcategory,
                session_state: ss
            })).unwrap();

            // Reload pipeline jobs to keep left card progress updated
            dispatch(fetchShopFloorJobs({
                department: job?.department || 'Laser',
                exclude_completed: 'true'
            }));
        } catch (err) {
            console.error("Immediate sync session state failed:", err);
        }
    };

    // Sync session_state to MongoDB when variables change (Debounced 1.5s)
    useEffect(() => {
        if (!hasLoadedFromDb || !job || selectedGroupIds.length === 0) return;

        const timer = setTimeout(() => {
            selectedGroupIds.forEach(groupId => {
                const ss = {
                    quantities: quantities[groupId],
                    sampleUps: sampleUps[groupId],
                    runningCycles: runningCycles[groupId],
                    localLogs: localLogs.filter(log => log.groupId === groupId),
                    sampleInputs: sampleInputs[groupId],
                    primaryUnlocked: primaryUnlocked[groupId],
                    primaryUps: primaryUps[groupId],
                    isUpsConfirmed: isUpsConfirmed[groupId],
                    selectedOperator: selectedOperator[groupId],
                    selectedHeads: selectedHeads[groupId],
                    groupTimers: groupTimers[groupId],
                    sample_cycles: sampleCycles[groupId] || [],
                    primary_cycles: primaryCycles[groupId] || [],
                    recut_cycles: recutCycles[groupId] || [],
                    haveExcessSheet: haveExcessSheet[groupId] || false,
                    excessConfirmed: excessConfirmed[groupId] || {}
                };

                dispatch(syncSessionStateApi({
                    shopfloor_job_id: jobId,
                    group_id: groupId,
                    job_no: job?.job_no,
                    sub_job_no: job?.sub_job_no,
                    category: job?.category,
                    subcategory: job?.subcategory,
                    session_state: ss
                })).then((action) => {
                    if (action.payload?.success) {
                        // Reload pipeline jobs to keep left card progress updated
                        dispatch(fetchShopFloorJobs({
                            department: job?.department || 'Laser',
                            exclude_completed: 'true'
                        }));

                        if (action.payload.flow?.session_state?.quantities) {
                            const backendQuantities = action.payload.flow.session_state.quantities;
                            setQuantities(prev => {
                                const localQ = prev[groupId] || {};
                                const localTime = new Date(localQ.quantities_updated_at || 0).getTime();
                                const backendTime = new Date(backendQuantities.quantities_updated_at || 0).getTime();

                                if (backendTime > localTime) {
                                    return {
                                        ...prev,
                                        [groupId]: {
                                            ...localQ,
                                            ...backendQuantities
                                        }
                                    };
                                }
                                return prev;
                            });
                        }
                        if (action.payload.flow?.session_state?.primary_cycle_history) {
                            const backendHistory = action.payload.flow.session_state.primary_cycle_history;
                            setPrimaryCycleHistory(prev => ({
                                ...prev,
                                [groupId]: backendHistory
                            }));
                        }
                    }
                });
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, [
        quantities,
        sampleUps,
        runningCycles,
        localLogs,
        sampleInputs,
        primaryUnlocked,
        primaryUps,
        isUpsConfirmed,
        selectedOperator,
        selectedHeads,
        selectedGroupIds,
        jobId,
        job,
        dispatch,
        hasLoadedFromDb,
        sampleCycles,
        primaryCycles,
        primaryCycleHistory,
        recutCycles,
        groupTimers,
        haveExcessSheet,
        excessConfirmed
    ]);

    // Immediate unload sync
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!hasLoadedFromDb || !job || selectedGroupIds.length === 0) return;
            selectedGroupIds.forEach(groupId => {
                const ss = {
                    quantities: quantities[groupId],
                    sampleUps: sampleUps[groupId],
                    runningCycles: runningCycles[groupId],
                    localLogs: localLogs.filter(log => log.groupId === groupId),
                    sampleInputs: sampleInputs[groupId],
                    primaryUnlocked: primaryUnlocked[groupId],
                    primaryUps: primaryUps[groupId],
                    isUpsConfirmed: isUpsConfirmed[groupId],
                    selectedOperator: selectedOperator[groupId],
                    selectedHeads: selectedHeads[groupId],
                    groupTimers: groupTimers[groupId],
                    sample_cycles: sampleCycles[groupId] || [],
                    primary_cycles: primaryCycles[groupId] || [],
                    recut_cycles: recutCycles[groupId] || [],
                    haveExcessSheet: haveExcessSheet[groupId] || false,
                    excessConfirmed: excessConfirmed[groupId] || {}
                };

                dispatch(syncSessionStateApi({
                    shopfloor_job_id: jobId,
                    group_id: groupId,
                    job_no: job?.job_no,
                    sub_job_no: job?.sub_job_no,
                    category: job?.category,
                    subcategory: job?.subcategory,
                    session_state: ss
                })).catch(() => { });
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [
        quantities,
        sampleUps,
        runningCycles,
        localLogs,
        sampleInputs,
        primaryUnlocked,
        primaryUps,
        isUpsConfirmed,
        selectedOperator,
        selectedHeads,
        selectedGroupIds,
        jobId,
        job,
        hasLoadedFromDb,
        sampleCycles,
        primaryCycles,
        primaryCycleHistory,
        recutCycles,
        groupTimers,
        haveExcessSheet,
        excessConfirmed,
        dispatch
    ]);

    const handleConfirmCompletion = async (groupId, targetQty, totalGoodHandedOver, mg) => {
        if (!localReturnExcessChoice) {
            toast.warning("Please choose Yes or No to continue.");
            return;
        }

        setIsConfirmingCompletion(true);
        try {
            const isYes = localReturnExcessChoice === 'yes';

            // Calculate rejections
            const groupPrimaryCycles = primaryCycles[groupId] || [];
            const groupRecutOptions = quantities[groupId]?.selected_recut_option || [];
            const groupSampleCycles = sampleCycles[groupId] || [];

            const totalSampleReject = groupSampleCycles.reduce((acc, c) => acc + (c.status === 'Rejected' ? (c.bad_qty || 0) : 0), 0);
            const totalPrimaryReject = groupPrimaryCycles.reduce((acc, c) => acc + (c.bad_qty || 0), 0);
            const totalRecutReject = groupRecutOptions.reduce((acc, opt) => {
                const optBad = (opt.cycles || []).reduce((cAcc, c) => cAcc + (c.bad_qty || 0), 0);
                return acc + optBad;
            }, 0);

            const totalRejectedQty = totalSampleReject + totalPrimaryReject + totalRecutReject;

            // Same sheet recuts: good recut pieces decrement rejections!
            const sameSheetRecutQty = groupRecutOptions.reduce((acc, opt) => {
                if (opt.type === 'same sheet') {
                    const optGood = (opt.cycles || []).reduce((cAcc, c) => cAcc + (c.good_qty || 0), 0);
                    return acc + optGood;
                }
                return acc;
            }, 0);

            const finalRejectedQty = Math.max(0, totalRejectedQty - sameSheetRecutQty);

            // Compile rejections list
            const rejectionsList = [];
            if (totalRejectedQty > 0) {
                const size = mg.materials?.[0]?.material_input?.size || '12x18';
                const dims = size.toLowerCase().replace('in', '').split('x');
                const w = parseFloat(dims[0]) || 12;
                const h = parseFloat(dims[1]) || 18;
                const sqinLost = totalRejectedQty * w * h;
                const sqftLost = sqinLost / 144;
                const estLoss = Math.round(sqinLost * 0.05);
                const hShift = String((mg.assigned_shifts && mg.assigned_shifts.length > 0) ? mg.assigned_shifts[0] : (job.assigned_shifts?.[0] || '1'));

                rejectionsList.push({
                    material_name: mg.group_name || "Unknown Material",
                    size: size,
                    rejected_qty: totalRejectedQty,
                    recut_qty: sameSheetRecutQty,
                    sqin_lost: sqinLost,
                    sqft_lost: sqftLost,
                    machine: `Shift ${hShift}`,
                    est_loss: estLoss,
                    recut_status: sameSheetRecutQty > 0 ? `Yes - ${sameSheetRecutQty} pcs` : `No - 0 pcs`
                });
            }

            const payload = {
                shopfloor_job_id: jobId,
                group_id: groupId,
                return_excess: isYes,
                excess_qty: isYes ? Number(excessQtyInput || 0) : 0,
                excess_sqft: isYes ? Number(excessSqftInput || 0) : 0,
                total_rejected_qty: totalRejectedQty,
                same_sheet_recut_adjusted_qty: sameSheetRecutQty,
                final_rejected_qty: finalRejectedQty,
                rejections_list: rejectionsList
            };

            const result = await dispatch(confirmCompletionPopupApi(payload)).unwrap();
            if (result?.success) {
                toast.success("Job completed successfully!");
                // Reload pipeline jobs to keep left card progress and status updated
                dispatch(fetchShopFloorJobs({
                    department: job?.department || 'Laser',
                    exclude_completed: 'true'
                }));

                setExcessConfirmed(prev => ({
                    ...prev,
                    [groupId]: {
                        confirmed: true,
                        returnExcess: isYes
                    }
                }));
                setLocalReturnExcessChoice('');
                setExcessQtyInput(0);
                setExcessSqftInput(0);

                if (onComplete) {
                    onComplete();
                }
            } else {
                toast.error(result?.message || "Failed to confirm completion");
            }
        } catch (error) {
            console.error("handleConfirmCompletion error:", error);
            toast.error(error?.message || "Server error completing job");
        } finally {
            setIsConfirmingCompletion(false);
        }
    };

    const processableGroups = useMemo(() => {
        return (job?.material_groups || []).filter(mg => {
            const totalGoodInwarded = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
            return totalGoodInwarded > 0 && mg.current_step !== 'Completed';
        });
    }, [job]);

    useEffect(() => {
        if (!job) return;
        if (isUv) {
            dispatch(fetchAllUsers({ limit: 100, departmentName: job.department || 'UV Printing', roleName: 'UV Printing Operator,UV Printing Head' }));
        } else {
            dispatch(fetchAllUsers({ limit: 100, departmentName: 'Laser', roleName: 'Laser Cutting Operator,Laser Cutting Head' }));
        }
    }, [dispatch, job, isUv]);

    // Digital Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setGroupTimers(prev => {
                const next = { ...prev };
                selectedGroupIds.forEach(id => {
                    if (!next[id]) {
                        next[id] = { overall: 0, sample: 0, primary: 0, recut: 0 };
                    } else {
                        next[id] = { ...next[id], recut: next[id].recut || 0 };
                    }

                    const running = runningCycles[id];
                    if (!running) return;

                    const isSampling = running.status === 'RUNNING';
                    const isPrimary = running.status === 'PRODUCTION_RUNNING';
                    const isRecutRunning = running.status === 'RECUT_RUNNING';

                    // Overall Timer: Runs during any active work (Sampling, Production, or Recut)
                    if (isSampling || isPrimary || isRecutRunning) {
                        next[id].overall += 1;
                    }

                    // Sample Timer: Reset each cycle
                    if (isSampling && running.startTime) {
                        const startTs = typeof running.startTime === 'number' ? running.startTime : new Date(running.startTime).getTime();
                        const elapsedSec = isNaN(startTs) ? 0 : Math.floor((Date.now() - startTs) / 1000);
                        next[id].sample = Math.max(0, elapsedSec);
                    }

                    // Primary Timer: Runs only during active production
                    if (isPrimary) {
                        next[id].primary += 1;

                        const mg = (job?.material_groups || []).find(g => String(g._id || g.group_id) === String(id));
                        let jobPrimaryTimeSec = 0;
                        if (mg) {
                            const totalSheets = mg.materials?.[0]?.quantity || mg.sheets_required || 0;
                            const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                            const inwardGood = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
                            const isInHouseJob = inwardGood >= totalSheets;
                            const inHouseSheets = isInHouseJob ? totalSheets : Math.max(0, totalSheets - outsourcedSheets);

                            const firstMaterial = mg?.materials?.find(m => {
                                const cat = m.category_type?.toLowerCase() || '';
                                return !cat.includes('consumable') && !cat.includes('hardware');
                            });
                            const timePerSheet = parseFloat(mg.input?.actual_input || mg?.process_time || 32);
                            const effectiveTimePerSheet = (running?.heads === 2 ? timePerSheet / 2 : timePerSheet);
                            jobPrimaryTimeSec = effectiveTimePerSheet * inHouseSheets * 60;
                        }

                        if (jobPrimaryTimeSec > 0 && next[id].primary >= jobPrimaryTimeSec) {
                            next[id].overtime = Math.max(0, next[id].primary - jobPrimaryTimeSec);
                        } else {
                            next[id].overtime = 0;
                        }
                    }

                    // Recut Timer: Reset each cycle (runs only during active recut)
                    if (isRecutRunning && running.startTime) {
                        next[id].recut = Math.floor((Date.now() - running.startTime) / 1000);
                    }
                });
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [selectedGroupIds, runningCycles, job?.material_groups]);

    if (loading && !job) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-teal-500 animate-spin" />
                    <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Job Data...</span>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center max-w-lg shadow-xl">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-slate-800 mb-4 uppercase">Job Not Found</h1>
                    <p className="text-slate-400 text-sm mb-8">The job you are looking for does not exist or has been removed from the shop floor.</p>
                </div>
            </div>
        );
    }

    const handleToggleGroup = (id) => {
        setSelectedGroupIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleStartProcess = () => {
        if (selectedGroupIds.length === 0) {
            toast.warning("Please select at least one line item");
            return;
        }
        const needsSampling = selectedGroupIds.some(id => {
            const mg = job.material_groups.find(g => (g._id || g.group_id) === id);
            return mg.sampling_on && (mg.current_step === 'Pending' || mg.current_step === 'Sampling');
        });
        setView(needsSampling ? 'SAMPLING' : 'PRODUCTION');
    };


    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    return (
        <div className="h-full bg-[#f8fafc] flex flex-col font-sans overflow-y-auto scrollbar scrollbar-thumb-slate-500 scrollbar-track-slate-100 scrollbar-w-2">
            <div className="w-full">
                {/* High-Fidelity Substrate Header */}
                {selectedGroupIds.map(groupId => {
                    const mg = job.material_groups.find(g => (g._id || g.group_id) === groupId);
                    if (!mg) return null;

                    const mainMat = mg.materials?.find(m => {
                        const cat = m.category_type?.toLowerCase() || '';
                        return !cat.includes('consumable') && !cat.includes('hardware');
                    });

                    const isSheetMaterial = mainMat?.material_type === 'sheet';

                    const inwardGood = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
                    const inwardBad = (mg.inward_history || []).reduce((acc, log) => acc + (log.bad_qty || 0), 0);
                    const size = mainMat?.material_input?.size || '12X18IN';
                    const sheetSize = `${mainMat?.material_input?.one_up_length || 0}"x${mainMat?.material_input?.one_up_width || 0}"`;

                    const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                    const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                    const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);
                    const upsVal = mainMat?.material_input?.ups || mg.ups || 1;
                    const inHouseQty = inHouseSheets * upsVal;

                    const assignedOutsourceUps = mg.assigned_outsource_ups || (outsourcedSheets * upsVal);
                    const isInHouseJob = inwardGood >= totalSheets && outsourcedSheets === 0;
                    const inHouseTargetQty = isInHouseJob
                        ? (job?.total_qty || inHouseQty)
                        : Math.max(0, (job?.total_qty || inHouseQty) - assignedOutsourceUps);

                    const bom = job?.bom_id;
                    let processesList = [];
                    if (bom && bom.materialprocess) {
                        const processGroup = bom.materialprocess.find(p =>
                            p.material_group_name?.toLowerCase().trim() === mg.group_name?.toLowerCase().trim() ||
                            String(p.material_group_id) === String(groupId)
                        );
                        if (processGroup) {
                            processesList = processGroup.processes || [];
                        }
                    }
                    let isSubsequent = false;
                    let cuttingIndex = -1;
                    let currentProcessIndex = -1;

                    if (processesList.length > 0) {
                        cuttingIndex = processesList.findIndex(p => {
                            const name = p.process_name?.toLowerCase() || '';
                            const dept = p.department?.toLowerCase() || '';
                            return name.includes("laser") || name.includes("cutting") || name.includes("cut") || name.includes("router") || name.includes("routing") || name.includes("cnc") || dept.includes("laser");
                        });
                        currentProcessIndex = processesList.findIndex(p =>
                            p.process_name?.toLowerCase().trim() === job?.process_name?.toLowerCase().trim()
                        );
                        isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex >= cuttingIndex;

                        cachedProcessStates.current[groupId] = {
                            isSubsequent,
                            cuttingIndex,
                            currentProcessIndex
                        };
                    } else if (cachedProcessStates.current[groupId]) {
                        isSubsequent = cachedProcessStates.current[groupId].isSubsequent;
                        cuttingIndex = cachedProcessStates.current[groupId].cuttingIndex;
                        currentProcessIndex = cachedProcessStates.current[groupId].currentProcessIndex;
                    }
                    const targetQty = (isUv && isSheetMaterial && !isSubsequent) ? inHouseSheets : inHouseTargetQty;
                    const isInwardSheet = isSheetMaterial && (cuttingIndex === -1 || currentProcessIndex <= cuttingIndex);
                    const inwardTargetQty = isInwardSheet ? inHouseSheets : inHouseTargetQty;
                    const pendingInward = Math.max(0, inwardTargetQty - inwardGood);

                    const isSampling = mg.sampling_on;

                    const running = runningCycles[groupId];
                    const groupPrimaryCycles = primaryCycles[groupId] || [];
                    const completedCyclesList = groupPrimaryCycles.filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);
                    const completedCount = completedCyclesList.length;
                    const isSheetTarget = isUv && isSheetMaterial && !isSubsequent;
                    const currentUps = isSheetTarget ? 1 : (parseInt(primaryUps[groupId]) || upsVal);
                    const samplePcs = (quantities[groupId]?.sample_good || 0) + (quantities[groupId]?.sample_reject || 0);
                    const totalSample = isSheetTarget ? Math.ceil(samplePcs / upsVal) : samplePcs;

                    let targetAccountedSoFar = 0;
                    if (completedCount > 0) {
                        if (isSheetTarget) {
                            targetAccountedSoFar = totalSample + completedCount;
                        } else {
                            const firstCycleUps = parseInt(completedCyclesList[0].ups) || currentUps;
                            targetAccountedSoFar = Math.max(totalSample, firstCycleUps);
                            for (let i = 1; i < completedCount; i++) {
                                targetAccountedSoFar += (parseInt(completedCyclesList[i].ups) || currentUps);
                            }
                        }
                    } else {
                        targetAccountedSoFar = totalSample;
                    }

                    const remainingTargetQty = Math.max(0, targetQty - targetAccountedSoFar);

                    const isRunningOrPaused = running?.status === 'PRODUCTION_RUNNING' || running?.status === 'PRODUCTION_PAUSED';

                    let remainingCycles = 0;
                    if (remainingTargetQty > 0) {
                        if (isRunningOrPaused) {
                            const runningUps = isSheetTarget ? 1 : (parseInt(running?.ups) || currentUps);
                            const runningCycleCapacity = completedCount === 0
                                ? (isSheetTarget ? runningUps : Math.max(0, runningUps - totalSample))
                                : runningUps;

                            if (runningCycleCapacity >= remainingTargetQty) {
                                remainingCycles = 1;
                            } else {
                                remainingCycles = 1 + Math.ceil((remainingTargetQty - runningCycleCapacity) / currentUps);
                            }
                        } else {
                            remainingCycles = Math.ceil(remainingTargetQty / currentUps);
                        }
                    }

                    const totalExpectedCycles = completedCount + remainingCycles;
                    const isAllCyclesDone = completedCount >= totalExpectedCycles;
                    const sessionProduced = Math.max(0, targetAccountedSoFar - totalSample);

                    const getLogGoodQty = (log) => {
                        if (typeof log.good_qty === 'number') return log.good_qty;
                        if (typeof log.details?.good_qty === 'number') return log.details.good_qty;
                        return 0;
                    };

                    // Deduplicate logs by timestamp to prevent double-counting between database process_history and React localLogs state
                    const uniqueLogs = [];
                    const seenTimestamps = new Set();

                    (mg.process_history || []).forEach(log => {
                        const ts = log.timestamp;
                        if (ts) seenTimestamps.add(ts);
                        uniqueLogs.push(log);
                    });

                    localLogs.filter(l => l.groupId === groupId).forEach(log => {
                        const ts = log.timestamp;
                        if (!ts || !seenTimestamps.has(ts)) {
                            uniqueLogs.push(log);
                        }
                    });

                    const groupRecutOptions = quantities[groupId]?.selected_recut_option || [];
                    const groupSampleCycles = sampleCycles[groupId] || [];

                    const totalSampleGood = Math.max(
                        groupSampleCycles.reduce((acc, c) => acc + (c.status === 'Approved' ? (c.good_qty || 0) : 0), 0),
                        Number(quantities[groupId]?.sample_good || 0)
                    );
                    const totalPrimaryGood = groupPrimaryCycles.reduce((acc, c) => acc + (c.good_qty || 0), 0);
                    const totalRecutGood = groupRecutOptions.reduce((acc, opt) => {
                        const optGood = (opt.cycles || []).reduce((cAcc, c) => cAcc + (c.good_qty || 0), 0);
                        return acc + optGood;
                    }, 0);
                    const totalGoodHandedOver = totalSampleGood + totalPrimaryGood + totalRecutGood;

                    const goodCount = totalGoodHandedOver;
                    const recutsCount = (quantities[groupId]?.reject || 0) + (quantities[groupId]?.sample_reject || 0);
                    const isJobCompleted = totalGoodHandedOver >= targetQty || job?.status === 'Completed' || mg.status === 'Completed';

                    const hShift = String((mg.assigned_shifts && mg.assigned_shifts.length > 0) ? mg.assigned_shifts[0] : (job.assigned_shifts?.[0] || '1'));
                    const hThemes = {
                        '1': { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', dot: 'bg-teal-500' },
                        '2': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-orange-500' },
                        '3': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', dot: 'bg-purple-500' }
                    };
                    const hTheme = hThemes[hShift] || hThemes['2'];

                    return (
                        <div key={groupId} className="mb-4 last:mb-0 border-b border-slate-200 pb-4 last:border-b-0">
                            <header className="overflow-hidden animate-in fade-in slide-in-from-top-8 duration-700">
                                {/* Tier 1: Substrate Info */}
                                <div className="bg-[#0f172a] px-4 md:px-8 py-1 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 gap-2">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                        <div className="flex items-center gap-2">
                                            <Sun className="w-3.5 h-3.5 text-orange-400" />
                                            <span className="text-[10px] font-black text-[#009688] uppercase tracking-[0.2em]">SUBSTRATE</span>
                                        </div>

                                        <div className="grid grid-cols-3 md:flex gap-3 md:gap-5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">MATERIAL</span>
                                                <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic">{mg.group_name}</span>
                                            </div>
                                            {isSheetMaterial && !isSubsequent ? (
                                                <>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">SIZE</span>
                                                        <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic">{size}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">SHEET</span>
                                                        <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic">{sheetSize}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">UPS</span>
                                                        <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic">{upsVal}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">REQ</span>
                                                        <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic">{inHouseSheets}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">REQ</span>
                                                    <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic">{inHouseTargetQty} PCS</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">MODE</span>
                                                <span className="text-[11px] md:text-[12px] font-black text-white uppercase italic text-[#009688]">A</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {job?.is_escalated && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-md animate-pulse-red ml-2">
                                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                                <span className="text-[8px] font-black text-red-300 uppercase tracking-widest leading-none">Job Escalated</span>
                                            </div>
                                        )}
                                        <span className="text-[8px] font-black text-[#009688] uppercase tracking-widest hidden md:inline">OP UPS</span>
                                        <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                                            <span className="text-[10px] font-black text-white">{upsVal}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tier 2: Real-time Metrics */}
                                <div className="bg-[#0f172a] px-3 md:px-8 py-0.5 grid grid-cols-3 md:grid-cols-7 gap-2 md:gap-0.5 md:divide-x divide-slate-800">
                                    <div className="flex flex-col items-center justify-center px-1">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">REQUIRED</span>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-sm md:text-lg font-black text-white tracking-tighter">{inwardTargetQty}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase">{isInwardSheet ? 'sh' : 'pcs'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-2 col-span-2 md:col-span-1">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">INWARDED</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <div className="flex flex-col items-center leading-none">
                                                    <span className="text-sm md:text-base font-black text-[#009688]">{inwardGood}</span>
                                                    <span className="text-[8px] font-black text-[#009688]/50 uppercase">{isInwardSheet ? 'sh' : 'pcs'}</span>
                                                </div>
                                                <CheckCircle2 className="w-3 h-3 text-[#009688]" />
                                            </div>
                                            <span className="text-slate-800 text-xs">·</span>
                                            <div className="flex items-center gap-1">
                                                <div className="flex flex-col items-center leading-none">
                                                    <span className="text-sm md:text-base font-black text-rose-500">{inwardBad}</span>
                                                    <span className="text-[8px] font-black text-rose-500/50 uppercase">{isInwardSheet ? 'sh' : 'pcs'}</span>
                                                </div>
                                                <X className="w-3 h-3 text-rose-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">PLAN</span>
                                        <span className="text-base md:text-lg font-black text-white tracking-tighter">{mg.cycles || 1}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">DONE</span>
                                        <span className="text-base md:text-lg font-black text-amber-500 tracking-tighter">{completedCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">GOOD</span>
                                        <span className="text-base md:text-lg font-black text-white tracking-tighter">{goodCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">RECUTS</span>
                                        <span className="text-base md:text-lg font-black text-white tracking-tighter">{recutsCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-2 col-span-3 md:col-span-1 border-t md:border-none border-slate-800 pt-1 md:pt-0">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">TIME</span>
                                        <span className="text-lg md:text-xl font-black text-cyan-400 font-mono tracking-tighter">
                                            {formatTime(groupTimers[groupId]?.overall || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Tier 3: Job Identification */}
                                <div className="bg-white px-3 md:px-8 py-2.5 flex items-center justify-between border-b border-slate-200">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className={`px-3 py-1 ${hTheme.bg} ${hTheme.text} rounded-full border ${hTheme.border} flex items-center gap-1.5`}>
                                            <div className={`w-1 h-1 rounded-full ${hTheme.dot}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {isUv ? (hShift === '1' ? 'HANDTOP' : hShift === '2' ? 'MIMAKI' : 'OUTSOURCE') : `SHIFT ${hShift}`}
                                            </span>
                                        </div>
                                        <h1 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tighter italic">
                                            {mg.group_name}
                                        </h1>
                                        {isJobCompleted && (
                                            <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-emerald-500/15 select-none shrink-0 font-bold">
                                                ✓ JOB COMPLETE
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">{size}</span>
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <Activity className="w-2.5 h-2.5 text-rose-500" />
                                                {isSheetMaterial && !isSubsequent ? `${inHouseSheets}S / ${inHouseQty}U` : `${inHouseTargetQty} PCS`}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <Activity className="w-2.5 h-2.5 text-slate-400" />
                                                {mg.cycles || 1} CYC
                                            </span>
                                            {pendingInward > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setActiveModalGroupId(groupId);
                                                        setIsInwardModalOpen(true);
                                                    }}
                                                    className={`px-3 py-1 rounded-full border flex items-center gap-2 transition-colors ${mg.is_unlocked === false
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                            : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                                                        }`}
                                                >
                                                    {mg.is_unlocked === false ? (
                                                        <>
                                                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                                                PROCESS LOCKED — TAP TO VIEW STATUS
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Package className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                                                {pendingInward} {isInwardSheet ? 'SHEET' : 'PCS'}{isInwardSheet && pendingInward > 1 ? 'S' : ''} NOT INWARDED — TAP TO INWARD
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                    {/* <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-[#1e293b] rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                                            <Search className="w-3 h-3 text-[#00d1b2]" />
                                        </div>
                                        <div 
                                            onClick={() => {
                                                setActiveModalGroupId(groupId);
                                                setIsActivityLogModalOpen(true);
                                            }}
                                            className="p-1.5 bg-[#1e293b] rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                                        >
                                            <Printer className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </div> */}
                            </header>

                            <main>
                                <ProcessInputForm
                                    type={type}
                                    isUvFlow={isUvFlow}
                                    groupId={groupId}
                                    isSamplingView={isSampling}
                                    timers={groupTimers[groupId] || { overall: 0, sample: 0, primary: 0 }}
                                    job={job}
                                    quantities={quantities}
                                    runningCycles={runningCycles}
                                    primaryUnlocked={primaryUnlocked}
                                    sampleUps={sampleUps}
                                    localLogs={localLogs}
                                    sampleInputs={sampleInputs}
                                    samplePhotos={samplePhotos}
                                    setRunningCycles={setRunningCycles}
                                    setLocalLogs={handleAddLocalLog}
                                    setQuantities={(val) => setQuantities(prev => {
                                        const next = typeof val === 'function' ? val(prev) : val;
                                        const updated = { ...next };
                                        if (updated[groupId]) {
                                            updated[groupId] = {
                                                ...updated[groupId],
                                                quantities_updated_at: new Date().toISOString()
                                            };
                                        }
                                        return updated;
                                    })}
                                    setSampleUps={setSampleUps}
                                    setSampleInputs={setSampleInputs}
                                    setSamplePhotos={setSamplePhotos}
                                    setPrimaryUnlocked={setPrimaryUnlocked}
                                    primaryUps={primaryUps[groupId] || ''}
                                    setPrimaryUps={(val) => setPrimaryUps(prev => ({ ...prev, [groupId]: typeof val === 'function' ? val(prev[groupId] || '') : val }))}
                                    isUpsConfirmed={isUpsConfirmed[groupId] || false}
                                    setIsUpsConfirmed={(val) => setIsUpsConfirmed(prev => ({ ...prev, [groupId]: typeof val === 'function' ? val(prev[groupId] || false) : val }))}
                                    selectedOperator={selectedOperator[groupId] || null}
                                    setSelectedOperator={(val) => setSelectedOperator(prev => ({ ...prev, [groupId]: typeof val === 'function' ? val(prev[groupId] || null) : val }))}
                                    selectedHeads={selectedHeads[groupId] || null}
                                    setSelectedHeads={(val) => setSelectedHeads(prev => ({ ...prev, [groupId]: typeof val === 'function' ? val(prev[groupId] || null) : val }))}
                                    users={users}
                                    sampleCycles={sampleCycles[groupId] || []}
                                    setSampleCycles={setSampleCycles}
                                    primaryCycles={primaryCycles[groupId] || []}
                                    setPrimaryCycles={setPrimaryCycles}
                                    recutCycles={recutCycles[groupId] || []}
                                    setRecutCycles={setRecutCycles}
                                    triggerImmediateSync={triggerImmediateSync}
                                />
                            </main>
                        </div>
                    );
                })}
            </div>

            {/* Excess Sheet Confirmation Modal */}
            {selectedGroupIds.map(groupId => {
                const mg = job.material_groups.find(g => (g._id || g.group_id) === groupId);
                if (!mg) return null;

                const mainMat = mg.materials?.find(m => {
                    const cat = m.category_type?.toLowerCase() || '';
                    return !cat.includes('consumable') && !cat.includes('hardware');
                });
                const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                const inwardGood = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
                const isInHouseJob = inwardGood >= totalSheets;
                const totalSheetsRequired = isInHouseJob ? totalSheets : Math.max(0, totalSheets - outsourcedSheets);
                const upsVal = mainMat?.material_input?.ups || mg.ups || 1;
                const inHouseQty = totalSheetsRequired * upsVal;

                const targetQty = isInHouseJob
                    ? (job.total_qty || inHouseQty)
                    : Math.max(0, (job.total_qty || inHouseQty) - (outsourcedSheets * upsVal));

                const groupPrimaryCycles = primaryCycles[groupId] || [];
                const groupRecutOptions = quantities[groupId]?.selected_recut_option || [];
                const groupSampleCycles = sampleCycles[groupId] || [];

                const totalSampleGoodFromCycles = groupSampleCycles.reduce((acc, c) => acc + (c.status === 'Approved' || (c.good_qty || 0) > 0 ? (c.good_qty || 0) : 0), 0);
                const totalSampleGoodFromQuantities = Number(quantities[groupId]?.sample_good) || 0;
                const totalSampleGood = Math.max(totalSampleGoodFromCycles, totalSampleGoodFromQuantities);
                const totalPrimaryGood = groupPrimaryCycles.reduce((acc, c) => acc + (c.good_qty || 0), 0);
                const totalRecutGood = groupRecutOptions.reduce((acc, opt) => {
                    const optGood = (opt.cycles || []).reduce((cAcc, c) => cAcc + (c.good_qty || 0), 0);
                    return acc + optGood;
                }, 0);
                const totalGoodHandedOver = totalSampleGood + totalPrimaryGood + totalRecutGood;

                const running = runningCycles[groupId];
                const completedCyclesList = groupPrimaryCycles.filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);
                const completedCount = completedCyclesList.length;
                const currentUps = parseInt(primaryUps[groupId]) || upsVal;
                const totalSample = (quantities[groupId]?.sample_good || 0) + (quantities[groupId]?.sample_reject || 0);

                let targetAccountedSoFar = 0;
                if (completedCount > 0) {
                    const firstCycleUps = parseInt(completedCyclesList[0].ups) || currentUps;
                    targetAccountedSoFar = Math.max(totalSample, firstCycleUps);
                    for (let i = 1; i < completedCount; i++) {
                        targetAccountedSoFar += (parseInt(completedCyclesList[i].ups) || currentUps);
                    }
                } else {
                    targetAccountedSoFar = totalSample;
                }

                const remainingTargetQty = Math.max(0, targetQty - targetAccountedSoFar);

                const isRunningOrPaused = running?.status === 'PRODUCTION_RUNNING' || running?.status === 'PRODUCTION_PAUSED';

                let remainingCycles = 0;
                if (remainingTargetQty > 0) {
                    if (isRunningOrPaused) {
                        const runningUps = parseInt(running?.ups) || currentUps;
                        const runningCycleCapacity = completedCount === 0
                            ? Math.max(0, runningUps - totalSample)
                            : runningUps;

                        if (runningCycleCapacity >= remainingTargetQty) {
                            remainingCycles = 1;
                        } else {
                            remainingCycles = 1 + Math.ceil((remainingTargetQty - runningCycleCapacity) / currentUps);
                        }
                    } else {
                        remainingCycles = Math.ceil(remainingTargetQty / currentUps);
                    }
                }

                const totalExpectedCycles = completedCount + remainingCycles;
                const isAllCyclesDone = completedCount >= totalExpectedCycles;

                const hasMetTarget = totalGoodHandedOver >= targetQty;
                const isConfirmed = !!excessConfirmed[groupId]?.confirmed || !!excessConfirmed[groupId]?.[groupId]?.confirmed;
                const showModal = hasMetTarget && !isConfirmed;

                if (!showModal) return null;

                const size = mg.materials?.[0]?.material_input?.size || '12x18';
                const dims = size.toLowerCase().replace('in', '').split('x');
                const w = parseFloat(dims[0]) || 12;
                const h = parseFloat(dims[1]) || 18;

                return (
                    <div key={`completion-modal-${groupId}`} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">

                            {/* Accent Glow Ring */}
                            <div className="absolute -top-12 -left-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>

                            {/* Icon Wrapper */}
                            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-50 flex items-center justify-center border border-amber-100 mb-6 shadow-sm">
                                <Package className="w-8 h-8 text-amber-500" />
                            </div>

                            {/* Header */}
                            <h2 className="text-xl font-[1000] text-slate-800 uppercase tracking-wider mb-2">Excess Sheet Confirmation</h2>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full mb-6 border border-amber-100/50">
                                Target Met: {totalGoodHandedOver} / {targetQty} pcs complete
                            </p>

                            {/* Main Question */}
                            <p className="text-sm font-semibold text-slate-600 mb-8 max-w-sm">
                                Do you want to return excess stock to inventory?
                            </p>

                            {/* Choices */}
                            <div className="grid grid-cols-2 gap-4 w-full mb-6">
                                <label className={`flex flex-col items-center justify-center p-5 border-2 rounded-[2rem] cursor-pointer transition-all select-none ${localReturnExcessChoice === 'yes'
                                    ? 'bg-teal-50/50 border-teal-500 text-teal-700 shadow-md shadow-teal-500/5'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                    }`}>
                                    <input
                                        type="radio"
                                        name={`return-excess-${groupId}`}
                                        value="yes"
                                        checked={localReturnExcessChoice === 'yes'}
                                        onChange={() => {
                                            setLocalReturnExcessChoice('yes');
                                            const defaultQty = Math.max(0, totalGoodHandedOver - targetQty) || 1;
                                            const defaultSqft = parseFloat(((defaultQty * w * h) / 144).toFixed(3)) || 0;
                                            setExcessQtyInput(defaultQty);
                                            setExcessSqftInput(defaultSqft);
                                        }}
                                        className="sr-only"
                                    />
                                    <span className="text-base font-black tracking-wide uppercase">YES</span>
                                    <span className="text-[9px] font-black tracking-widest uppercase opacity-60 mt-1">Return to Inventory</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center p-5 border-2 rounded-[2rem] cursor-pointer transition-all select-none ${localReturnExcessChoice === 'no'
                                    ? 'bg-slate-50 border-slate-700 text-slate-800 shadow-md shadow-slate-700/5'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                    }`}>
                                    <input
                                        type="radio"
                                        name={`return-excess-${groupId}`}
                                        value="no"
                                        checked={localReturnExcessChoice === 'no'}
                                        onChange={() => {
                                            setLocalReturnExcessChoice('no');
                                            setExcessQtyInput(0);
                                            setExcessSqftInput(0);
                                        }}
                                        className="sr-only"
                                    />
                                    <span className="text-base font-black tracking-wide uppercase">NO</span>
                                    <span className="text-[9px] font-black tracking-widest uppercase opacity-60 mt-1">Write Off / Skip</span>
                                </label>
                            </div>

                            {/* Excess Details Form if YES is selected */}
                            {localReturnExcessChoice === 'yes' && (
                                <div className="w-full mb-8 p-6 bg-teal-50/40 border border-teal-100/50 rounded-[2rem] text-left animate-in slide-in-from-top-4 duration-300">
                                    <h3 className="text-xs font-black text-teal-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span>📦</span> Enter Excess Stock Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Excess Qty (pcs)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={excessQtyInput}
                                                onChange={(e) => {
                                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                                    setExcessQtyInput(val);
                                                    const calculatedSqft = parseFloat(((val * w * h) / 144).toFixed(3)) || 0;
                                                    setExcessSqftInput(calculatedSqft);
                                                }}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[1.25rem] text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 shadow-sm transition-all"
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Total Excess Sqft</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                value={excessSqftInput}
                                                onChange={(e) => setExcessSqftInput(parseFloat(e.target.value) || 0)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[1.25rem] text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 shadow-sm transition-all"
                                                placeholder="e.g. 15.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={() => handleConfirmCompletion(groupId, targetQty, totalGoodHandedOver, mg)}
                                disabled={isConfirmingCompletion}
                                className="w-full py-4 bg-[#0c1a2e] text-white text-[11px] font-[1000] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isConfirmingCompletion ? 'Syncing Completion...' : 'CONFIRM & COMPLETE JOB →'}
                            </button>
                        </div>
                    </div>
                );
            })}


            <MaterialInwardModal
                isOpen={isInwardModalOpen}
                onClose={() => {
                    setIsInwardModalOpen(false);
                    setActiveModalGroupId(null);
                }}
                job={job}
                materialGroup={job.material_groups.find(g => (g._id || g.group_id) === activeModalGroupId)}
            />

            <ActivityLogModal
                isOpen={isActivityLogModalOpen}
                onClose={() => {
                    setIsActivityLogModalOpen(false);
                    setActiveModalGroupId(null);
                }}
                job={job}
                materialGroup={job.material_groups.find(g => (g._id || g.group_id) === activeModalGroupId)}
            />


        </div>
    );
};

export default ProcessScreenInternal;
