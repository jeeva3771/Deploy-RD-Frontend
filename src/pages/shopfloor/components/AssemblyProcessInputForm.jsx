import React, { useState } from 'react';

import {
    Microscope, CheckCircle2, ChevronRight, Play, History,
    AlertCircle, ClipboardCheck, Minus, Plus, Camera, Package,
    AlertTriangle, Terminal, X, FileText, Search, Clock, Printer, Factory, Edit3, Settings2, User, ListChecks
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { logShopFloorActivityApi, updateShopFloorJobStatus } from '../../../reducer/shopFloorReducer';
import { submitSampleForApprovalApi, startSampleCycleApi, completeSampleCycleApi, processSampleActionApi, startPrimaryCycleApi } from '../../../reducer/shopFloorProcessFlowReducer';
import { createReadyJob } from '../../../reducer/readyJobsReducer';
import { submitExtraMaterialEMRThunk, confirmEMRReceiptThunk } from '../../../reducer/shopFloorEMRReducer';
import { fetchBOMById } from '../../../reducer/bomReducer';
import { getUser } from '../../../utils/permission/auth';
import ImageLightbox from '../../common/ImageLightbox';

const AssemblyProcessInputForm = ({
    type,
    groupId,
    isSamplingView,
    timers = { overall: 0, sample: 0, primary: 0 },
    job,
    quantities,
    runningCycles,
    primaryUnlocked,
    sampleUps,
    localLogs,
    sampleInputs,
    samplePhotos,
    setRunningCycles,
    setLocalLogs,
    setQuantities,
    setSampleUps,
    setSampleInputs,
    setSamplePhotos,
    setPrimaryUnlocked,
    primaryUps,
    setPrimaryUps,
    isUpsConfirmed,
    setIsUpsConfirmed,
    selectedOperator,
    setSelectedOperator,
    selectedHeads,
    setSelectedHeads,
    users = [],
    sampleCycles = [],
    setSampleCycles,
    primaryCycles = [],
    setPrimaryCycles,
    recutCycles = [],
    setRecutCycles,
    setReassembleCycles: setReassembleCyclesProp,
    triggerImmediateSync,
    isUvFlow = false
}) => {
    const setReassembleCycles = setReassembleCyclesProp || setRecutCycles;
    const dispatch = useDispatch();
    const isUv = isUvFlow || type === 'uv' || job?.department === 'Print' || job?.department === 'UV Printing';
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectRemark, setRejectRemark] = useState('');
    const [productionInputs, setProductionInputs] = useState({ good: 0, bad: 0 });
    const [activeShiftOverride, setActiveShiftOverride] = useState(null);
    const [showShiftAcknowledge, setShowShiftAcknowledge] = useState(false);
    const [acknowledgedShift, setAcknowledgedShift] = useState(null);
    const [isEditingUps, setIsEditingUps] = useState(false);

    // Setup Modal State
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [lightboxName, setLightboxName] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Reassemble 3-Option Modal State
    const [showReassembleOptionModal, setShowReassembleOptionModal] = useState(false);
    const [recutOptionQty, setReassembleOptionQty] = useState(0);
    const [recutOptionExcessQty, setReassembleOptionExcessQty] = useState(0);
    const [recutOptionSheetSize, setReassembleOptionSheetSize] = useState('');
    const [recutOptionSheetQty, setReassembleOptionSheetQty] = useState(1);
    const [recutOptionNewSheetReassembleQty, setReassembleOptionNewSheetReassembleQty] = useState(0);
    const [recutOptionReason, setReassembleOptionReason] = useState('Cut failed / sheet damaged');
    const [recutOptionUrgent, setReassembleOptionUrgent] = useState(false);

    // Reassemble Cycle Running State
    const [showReassembleStartInput, setShowReassembleStartInput] = useState(false);
    const [recutCycleStartQty, setReassembleCycleStartQty] = useState(1);
    const [selectedReassembleOption, setSelectedReassembleOption] = useState();
    const [recutUpsVal, setReassembleUpsVal] = useState(1);
    const [showStartReassembleSelectModal, setShowStartReassembleSelectModal] = useState(false);

    const isCombinedGroup = groupId === 'COMBINED';
    const combinedInwardedGood = (job?.material_groups && job.material_groups.length > 0)
        ? Math.min(...job.material_groups.map(g => (g.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0)))
        : (job?.total_qty || 0);

    const mg = isCombinedGroup ? {
        _id: 'COMBINED',
        group_id: 'COMBINED',
        group_name: 'FINAL ASSEMBLY',
        materials: [],
        inward_history: [{ good_qty: combinedInwardedGood }],
        assigned_shifts: job?.assigned_shifts || [],
        cycles: 1,
        is_unlocked: true,
        sampling_on: job?.material_groups?.some(g => g.sampling_on) || false,
        sheets_required: job?.total_qty || 0,
        ups: 1
    } : job?.material_groups?.find(g => String(g.group_id || g._id) === String(groupId) || String(g._id) === String(groupId));
    const defaultQ = React.useMemo(() => ({
        good: 0,
        reject: 0,
        produced: 0,
        sample_size: 0,
        sample_good: 0,
        sample_reject: 0,
        sample_cycles: 0,
        pendingUnits: job?.total_qty || 0,
        jobTargetPending: job?.total_qty || 0
    }), [job?.total_qty]);
    const q = quantities?.[groupId] || quantities?.[mg?._id] || quantities?.[mg?.group_id] || defaultQ;
    const { teams } = useSelector((state) => state.team || {});
    const currentUser = React.useMemo(() => getUser(), []);

    const operators = React.useMemo(() => {
        let filteredUsers = users || [];

        // 1. If logged-in user belongs to active team(s), show only members of those team(s)
        if (currentUser && Array.isArray(teams) && teams.length > 0) {
            const uid = String(currentUser._id || currentUser.id || currentUser.user_id || '');
            const userTeams = teams.filter(t => t.is_active === true && t.member_list?.some(m => {
                let mId = m;
                if (m && typeof m === 'object') {
                    mId = m._id || m.id || m.$oid || m.value || m.user_id || m;
                }
                return String(mId) === uid;
            }));

            if (userTeams.length > 0) {
                const teamMemberIds = new Set();
                userTeams.forEach(t => {
                    (t.member_list || []).forEach(m => {
                        let mId = m;
                        if (m && typeof m === 'object') {
                            mId = m._id || m.id || m.$oid || m.value || m.user_id || m;
                        }
                        if (mId) teamMemberIds.add(String(mId));
                    });
                });

                const teamFilteredUsers = filteredUsers.filter(u => {
                    const uId = String(u._id || u.id || '');
                    return teamMemberIds.has(uId);
                });

                if (teamFilteredUsers.length > 0) {
                    const teamList = teamFilteredUsers.map(u => u.name || u.username).filter(Boolean);
                    return [...new Set(teamList)];
                }
            }
        }

        // 2. Fallback to all assembly department users or all users if unassigned/admin
        const isAssemblyUser = (u) => {
            const name = String(u.name || u.username || '').toLowerCase();
            const uDept = String(u.department?.name || u.department_name || u.department_id?.name || u.department || '').toLowerCase();
            const uRole = String(u.role?.name || u.role_name || u.role || '').toLowerCase();
            const combined = `${name} ${uDept} ${uRole}`;

            if (combined.includes('assembly')) return true;

            const otherDepts = ['laser', 'uv', 'print', 'dtp', 'store', 'paint', 'qc', 'pack', 'film'];
            if (otherDepts.some(kw => combined.includes(kw))) {
                return false;
            }

            return true;
        };

        const assemblyFiltered = filteredUsers.filter(isAssemblyUser);
        const listToUse = assemblyFiltered.length > 0 ? assemblyFiltered : filteredUsers;

        const list = listToUse
            .map(u => u.name || u.username)
            .filter(Boolean);
        return [...new Set([...list])];
    }, [users, teams, currentUser]);

    // Normalize reassemble options to a robust array of objects
    const normalizedReassembleOptions = React.useMemo(() => {
        if (!q) return [];
        const options = q.selected_recut_option;
        if (!Array.isArray(options)) {
            if (typeof options === 'string' && options) {
                return [{
                    originalIndex: 0,
                    type: options.toLowerCase().replace('_', ' '),
                    selected_cycle: options.toLowerCase().replace('_', ' '),
                    qty: q.recut_received || 0,
                    recut_cycle_input: 0,
                    total_cycle: 0,
                    cycles: []
                }];
            }
            return [];
        }
        return options.map((opt, idx) => {
            if (typeof opt === 'string') {
                return {
                    originalIndex: idx,
                    type: opt.toLowerCase().replace('_', ' '),
                    selected_cycle: opt.toLowerCase().replace('_', ' '),
                    qty: q.recut_received || 0,
                    recut_cycle_input: 0,
                    total_cycle: 0,
                    cycles: []
                };
            }
            return {
                originalIndex: idx,
                ...opt,
                type: opt.type || opt.selected_cycle || 'same sheet',
                selected_cycle: opt.selected_cycle || opt.type || 'same sheet',
                qty: opt.qty || opt.recut_qty || 0,
                cycles: opt.cycles || []
            };
        });
    }, [q]);

    const hasActiveEmr = Array.isArray(q?.active_emr_id) ? q.active_emr_id.length > 0 : !!q?.active_emr_id;

    const cachedProcessState = React.useRef({ isSubsequent: false, isBeforeLaser: false, initialized: false, cuttingIndex: -1, currentProcessIndex: -1 });

    if (!mg) return null;

    const shifts = (mg?.assigned_shifts && mg.assigned_shifts.length > 0) ? mg.assigned_shifts : (job?.assigned_shifts || []);
    const currentShift = activeShiftOverride || String(shifts[0] || '1');

    const firstMaterial = mg?.materials?.find(m => {
        const cat = m.category_type?.toLowerCase() || '';
        return !cat.includes('consumable') && !cat.includes('hardware');
    });

    const formatTime = (sec) => {
        if (isNaN(sec) || sec === null || sec === undefined || sec < 0) return '00:00';
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const formatTimeHHMMSS = (sec) => {
        if (isNaN(sec) || sec === null || sec === undefined || sec < 0) return '00:00';
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const shiftThemes = {
        '1': {
            bg: 'from-teal-600 to-teal-900',
            shadow: 'shadow-teal-900/20',
            accent: 'text-teal-200'
        },
        '2': {
            bg: 'from-indigo-600 to-indigo-900',
            shadow: 'shadow-indigo-900/20',
            accent: 'text-indigo-200'
        },
        '3': {
            bg: 'from-purple-600 to-purple-900',
            shadow: 'shadow-purple-900/20',
            accent: 'text-purple-200'
        }
    };
    const theme = shiftThemes[currentShift] || shiftThemes['1'];
    const getShiftLabel = (s) => {
        if (isUv) {
            return s === '1' || s === 1 ? 'HANDTOP' : s === '2' || s === 2 ? 'MIMAKI' : 'OUTSOURCE';
        }
        return `SHIFT ${s}`;
    };

    // Production Stats based on ProcessScreenInternal logic
    const totalSheets = firstMaterial?.quantity || mg?.sheets_required || 0;
    const outsourcedSheets = mg?.assigned_outsource_sheets || 0;
    const inwardedGoodCount = (mg?.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
    const isInHouseJob = inwardedGoodCount >= totalSheets;

    const inHouseSheets = isInHouseJob ? totalSheets : Math.max(0, totalSheets - outsourcedSheets);
    const upsVal = firstMaterial?.material_input?.ups || mg?.ups || 1;
    const inHouseQty = inHouseSheets * upsVal;
    const isSheetMaterial = false;
    const inHouseTargetQty = isInHouseJob
        ? (job?.total_qty || inHouseQty)
        : Math.max(0, (job?.total_qty || inHouseQty) - (outsourcedSheets * upsVal));

    const bom = job?.bom_id;
    let processesList = [];
    if (bom && bom.materialprocess) {
        const processGroup = bom.materialprocess.find(p =>
            p.material_group_name?.toLowerCase().trim() === mg?.group_name?.toLowerCase().trim() ||
            String(p.material_group_id) === String(groupId)
        ) || bom.materialprocess[0];
        if (processGroup) {
            processesList = processGroup.processes || [];
        }
    }

    const cutIdx = processesList.findIndex(p => {
        const name = p.process_name?.toLowerCase() || '';
        const dept = p.department?.toLowerCase() || '';
        return name.includes("laser") || name.includes("cutting") || name.includes("cut") || name.includes("router") || name.includes("routing") || name.includes("cnc") || dept.includes("laser");
    });
    const currIdx = processesList.findIndex(p =>
        p.process_name?.toLowerCase().trim() === job?.process_name?.toLowerCase().trim()
    );

    const procNameLower = (job?.process_name || '').toLowerCase();
    const deptLower = (job?.department || '').toLowerCase();
    const isSubsequentProc = isUv || deptLower.includes('assembly') || procNameLower.includes('assembly') || (cutIdx !== -1 && currIdx !== -1 ? currIdx >= cutIdx : true);

    cachedProcessState.current = {
        isSubsequent: isSubsequentProc,
        isBeforeLaser: isUv && cutIdx !== -1 && currIdx !== -1 && currIdx < cutIdx,
        initialized: true,
        cuttingIndex: cutIdx,
        currentProcessIndex: currIdx
    };

    const { isSubsequent, isBeforeLaser, cuttingIndex, currentProcessIndex } = cachedProcessState.current;
    const targetQty = job?.total_qty || 0;
    const isSheetTarget = false;

    const rawSampleList = Array.isArray(sampleCycles[groupId]) ? sampleCycles[groupId] : (Array.isArray(q?.sample_cycles) ? q.sample_cycles : (q?.session_state?.sample_cycles?.[groupId] || []));
    const sampleDoneCount = (rawSampleList || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0) || (typeof q?.sample_cycles === 'number' ? q.sample_cycles : 0);
    const displaySampleCycles = Array.isArray(rawSampleList) && rawSampleList.length > 0 ? rawSampleList.length : (typeof q?.sample_cycles === 'number' ? q.sample_cycles : 0);
    const displaySampleApproved = Array.isArray(rawSampleList) && rawSampleList.length > 0 ? rawSampleList.filter(c => (c.good_qty || 0) > 0 && c.status !== 'Rejected' && c.status !== 'REJECTED').length : (q?.sample_good || 0);
    const displaySampleRejected = Array.isArray(rawSampleList) && rawSampleList.length > 0 ? rawSampleList.filter(c => (c.bad_qty || 0) > 0 || c.status === 'Rejected' || c.status === 'REJECTED').length : (q?.sample_reject || 0);
    const hasUnprocessedInwardedSample = isSubsequent && (inwardedGoodCount > sampleDoneCount);

    const isLastSampleCycleRejected = (rawSampleList || []).length > 0 && 
        rawSampleList[rawSampleList.length - 1]?.status === 'Rejected';

    const hasGoodSampleSubmitted = (q?.sample_good || 0) > 0 || (runningCycles[groupId]?.issuedGood || 0) > 0 || (rawSampleList || []).some(c => (c.good_qty || 0) > 0);
    const isSampleApprovedBySales = q?.bom_sample_status === 'APPROVED_BY_SALES' || job?.bom_sample_status === 'APPROVED_BY_SALES';
    const activePrimaryUnlocked = primaryUnlocked[groupId] || (isSampleApprovedBySales ? {
        cycleCount: q?.sample_cycles || 1,
        goodQty: q?.sample_good || 1,
        badQty: q?.sample_reject || 0,
        totalPcs: (q?.sample_good || 1) + (q?.sample_reject || 0)
    } : null);
    const isSampleRejectedInternal = !hasUnprocessedInwardedSample && (
        q?.bom_sample_status === 'SAMPLE_REJECTED_INTERNAL' || 
        job?.bom_sample_status === 'SAMPLE_REJECTED_INTERNAL' ||
        isLastSampleCycleRejected
    );
    const isSampleRejected = !hasGoodSampleSubmitted && (q?.bom_sample_status === 'REJECTED_BY_SALES' || job?.bom_sample_status === 'REJECTED_BY_SALES' || isSampleRejectedInternal);

    const isSampleAwaitingApproval = !hasUnprocessedInwardedSample && !isSampleApprovedBySales && !isSampleRejectedInternal && (
        q?.bom_sample_status === 'AWAITING_SALES_APPROVAL' ||
        job?.bom_sample_status === 'AWAITING_SALES_APPROVAL' ||
        ((runningCycles[groupId]?.issuedGood || 0) > 0 && runningCycles[groupId]?.status === 'WAITING_APPROVAL' && !isLastSampleCycleRejected)
    );
    const isCuttingProcess = currentProcessIndex === cuttingIndex || cuttingIndex === -1 || !isSubsequent;
    const baseRunning = runningCycles[groupId];
    const running = (hasUnprocessedInwardedSample && !isSampleApprovedBySales && !activePrimaryUnlocked && baseRunning?.status !== 'PRODUCTION_RUNNING' && baseRunning?.status !== 'PRODUCTION_COMPLETED' && baseRunning?.status !== 'PRODUCTION_PAUSED' && baseRunning?.status !== 'RECUT_RUNNING' && baseRunning?.status !== 'RECUT_COMPLETED' && baseRunning?.status !== 'RECUT_PAUSED')
        ? { ...baseRunning, status: 'IDLE', is_rerun: true }
        : (isSampleRejectedInternal && baseRunning?.status !== 'RUNNING' && baseRunning?.status !== 'PRODUCTION_RUNNING' && baseRunning?.status !== 'PRODUCTION_COMPLETED' && baseRunning?.status !== 'PRODUCTION_PAUSED')
            ? (isCuttingProcess ? { ...baseRunning, status: 'IDLE', is_rerun: true } : { ...baseRunning, status: 'WAITING_UPSTREAM', is_rerun: true })
            : (isSampleApprovedBySales && baseRunning?.status !== 'RUNNING' && baseRunning?.status !== 'PRODUCTION_RUNNING' && baseRunning?.status !== 'PRODUCTION_COMPLETED' && baseRunning?.status !== 'PRODUCTION_PAUSED' && baseRunning?.status !== 'RECUT_RUNNING' && baseRunning?.status !== 'RECUT_COMPLETED' && baseRunning?.status !== 'RECUT_PAUSED')
                ? { ...baseRunning, status: 'APPROVED' }
                : baseRunning;
    const isRunning = running?.status === 'PRODUCTION_RUNNING' || running?.status === 'RECUT_RUNNING';
    const isPaused = running?.status === 'PRODUCTION_PAUSED' || running?.status === 'RECUT_PAUSED';
    const isCompleted = running?.status === 'PRODUCTION_COMPLETED' || running?.status === 'RECUT_COMPLETED';
    const isSessionStopped = running?.status === 'STOPPED';

    const readyReassembleOptions = (q?.selected_recut_option || []).filter(opt => {
        if ((opt.type === 'New Sheet' || opt.type === 'new sheet') && !opt.is_inwarded) return false;
        const completedQty = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
        return completedQty < opt.qty;
    });
    const cycleElapsedTime = running?.status === 'PRODUCTION_COMPLETED'
        ? (running.lastDuration || 0)
        : running?.startTime
            ? Math.floor((Date.now() - running.startTime) / 1000)
            : (running?.lastDuration || 0);

    const timePerSheet = parseFloat(mg?.input?.actual_input || mg?.process_time || 32); // Fallback to 32 as default
    const upsPerSheet = firstMaterial?.material_input?.ups || mg?.ups || 1;

    // Total Job Time for Primary Timer
    // Calculates countdown based on selected heads (default to 1 if not yet selected)
    const effectiveTimePerSheet = (running?.heads === 2 ? timePerSheet / 2 : timePerSheet);
    const jobPrimaryTimeSec = effectiveTimePerSheet * inHouseSheets * 60;
    const primaryRemainingSec = Math.max(0, jobPrimaryTimeSec - timers.primary);

    // const currentUps = parseInt(primaryUps) || upsVal;
    const samplePcs = (q?.sample_good || 0) + (q?.sample_reject || 0);
    const totalSample = isSheetTarget ? Math.ceil(samplePcs / upsVal) : samplePcs;
    const totalRejected = (q?.reject || 0) + (q?.sample_reject || 0);
    const accountedReassembleQty = (q?.selected_recut_option || []).reduce((sum, opt) => {
        const completedQty = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
        return sum + Math.max(0, (opt.qty || 0) - completedQty);
    }, 0);
    const unaccountedRejected = Math.max(0, totalRejected - accountedReassembleQty);
    const hasUnaccountedRejects = unaccountedRejected > 0;
    const cumulativeReassembles = totalRejected;

    const totalSampleGood = Math.max(
        (sampleCycles || []).reduce((acc, c) => acc + (c.status === 'Approved' ? (c.good_qty || 0) : 0), 0),
        Number(q?.sample_good || 0)
    );
    const totalPrimaryGood = (primaryCycles || []).reduce((acc, c) => acc + (c.good_qty || 0), 0);
    const totalReassembleGood = (q?.selected_recut_option || []).reduce((acc, opt) => {
        const optGood = (opt.cycles || []).reduce((cAcc, c) => cAcc + (c.good_qty || 0), 0);
        return acc + optGood;
    }, 0);
    const totalGoodHandedOver = totalSampleGood + totalPrimaryGood + totalReassembleGood;

    const completedCyclesList = (primaryCycles || []).filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);
    const completedCount = completedCyclesList.length;

    // Calculate remaining target strictly based on pending quantity
    const remainingTargetQty = Math.max(0, targetQty - totalGoodHandedOver - cumulativeReassembles);

    const effectiveIsUpsConfirmed = !isEditingUps && (isUpsConfirmed || (primaryCycles || []).length > 0 || isRunning || isPaused);
    const effectivePrimaryUps = parseInt(primaryUps) || (running?.ups ? parseInt(running.ups) : '');

    const currentUps = isSheetTarget 
        ? (parseInt(primaryUps) || 1)
        : (parseInt(primaryUps) || (running?.ups ? parseInt(running.ups) : (upsVal || 1)));

    const isRunningOrPaused = running?.status === 'PRODUCTION_RUNNING' || running?.status === 'PRODUCTION_PAUSED';

    let remainingCycles = 0;
    if (remainingTargetQty > 0) {
        const cycleBatchSize = Math.max(1, parseInt(primaryUps) || (running?.ups ? parseInt(running.ups) : 20));
        if (isRunningOrPaused) {
            const runningUps = parseInt(running?.ups) || cycleBatchSize;
            const runningCycleCapacity = completedCount === 0
                ? Math.max(0, runningUps - totalSample)
                : runningUps;

            if (runningCycleCapacity >= remainingTargetQty) {
                remainingCycles = 1;
            } else {
                remainingCycles = 1 + Math.ceil((remainingTargetQty - runningCycleCapacity) / cycleBatchSize);
            }
        } else {
            remainingCycles = Math.ceil(remainingTargetQty / cycleBatchSize);
        }
    }

    const totalExpectedCycles = completedCount + remainingCycles;
    const isAllCyclesDone = remainingTargetQty <= 0 && (completedCount >= totalExpectedCycles || totalGoodHandedOver >= targetQty);

    // Primary cycle index should be based on completed primary cycles, NOT sample cycles
    const primaryCyclesDoneCount = (primaryCycles || []).filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time).length;
    const currentCycleIndex = running?.status === 'PRODUCTION_COMPLETED'
        ? primaryCyclesDoneCount
        : (isRunningOrPaused ? Math.max(1, (running?.cyclesDone || 0) - (sampleCycles?.length || 0) + 1) : primaryCyclesDoneCount + 1);

    let targetAccountedBeforeCurrent = totalSample;
    if (isSheetTarget) {
        targetAccountedBeforeCurrent = totalSample + (currentCycleIndex - 1);
    } else {
        for (let idx = 0; idx < currentCycleIndex - 1; idx++) {
            const cycleUps = primaryCycles && primaryCycles[idx] ? (parseInt(primaryCycles[idx].ups) || currentUps) : currentUps;
            if (idx === 0) {
                targetAccountedBeforeCurrent = Math.max(totalSample, cycleUps);
            } else {
                targetAccountedBeforeCurrent += cycleUps;
            }
        }
    }

    const remainingTargetBeforeCurrent = Math.max(0, targetQty - targetAccountedBeforeCurrent);

    const thisCycleUps = running?.status === 'PRODUCTION_COMPLETED' ? (parseInt(primaryCycles[currentCycleIndex - 1]?.ups) || (isSheetTarget ? (parseInt(effectivePrimaryUps) || 1) : currentUps)) : (parseInt(running?.ups) || (isSheetTarget ? (parseInt(effectivePrimaryUps) || 1) : currentUps));

    const actualPendingBeforeCurrent = Math.max(0, targetQty - totalGoodHandedOver - cumulativeReassembles);
    let physicalOutput = thisCycleUps;
    if (currentCycleIndex === totalExpectedCycles) {
        physicalOutput = Math.min(remainingTargetBeforeCurrent, actualPendingBeforeCurrent);
    } else if (currentCycleIndex > totalExpectedCycles) {
        physicalOutput = Math.min(thisCycleUps, actualPendingBeforeCurrent);
    } else {
        if (isUv && !isSheetTarget && currentCycleIndex === 1) {
            physicalOutput = Math.max(0, Math.min(thisCycleUps, actualPendingBeforeCurrent) - totalSample);
        } else {
            physicalOutput = Math.min(thisCycleUps, actualPendingBeforeCurrent);
        }
    }

    const cycleOutput = running?.is_recut ? (running.ups || 1) : physicalOutput;

    // ── Handover handler ──────────────────────────────────────────────────────
    const handleHandOver = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        const isReassemble = !!running?.is_recut;

        // 1. Log the handover action
        const newLog = {
            action: isReassemble
                ? `📦 HANDED OVER ${productionInputs.good} REASSEMBLE PCS → STORES (REJECTED: ${productionInputs.bad})`
                : `📦 HANDED OVER ${productionInputs.good} PCS → STORES (REJECTED: ${productionInputs.bad})`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            good_qty: productionInputs.good,
            bad_qty: productionInputs.bad,
            reject_qty: productionInputs.bad,
            groupId: groupId
        };
        const updatedLogs = [newLog, ...localLogs];
        setLocalLogs(prev => [newLog, ...prev]);

        // 2. Update reject/recut count in quantities
        let nextQuantitiesObj = {};
        const currentGroup = quantities[groupId] || {};
        if (isReassemble) {
            const activeOptionType = running?.recut_option_type || selectedReassembleOption?.type;
            const currentOptions = Array.isArray(currentGroup.selected_recut_option)
                ? [...currentGroup.selected_recut_option]
                : [];
            // Use stored _listIndex for precise matching (handles multiple same-type entries)
            const storedListIndex = selectedReassembleOption?._listIndex ?? -1;
            const idx = storedListIndex !== -1 ? storedListIndex : currentOptions.findIndex(o => o.type === activeOptionType);
            if (idx !== -1) {
                const opt = currentOptions[idx];
                const updatedCycles = [...(opt.cycles || [])];
                if (updatedCycles.length > 0) {
                    const lastIdx = updatedCycles.length - 1;
                    updatedCycles[lastIdx] = {
                        ...updatedCycles[lastIdx],
                        good_qty: productionInputs.good,
                        bad_qty: productionInputs.bad,
                        status: 'Completed'
                    };
                }

                const completed = updatedCycles.reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
                const remaining = Math.max(0, opt.qty - completed);
                const isOptionFullyCompleted = remaining <= 0;

                const updatedOpt = {
                    ...opt,
                    isReassemblemethodstarted: !isOptionFullyCompleted,
                    cycles: updatedCycles
                };

                currentOptions[idx] = updatedOpt;

                setSelectedReassembleOption(prevOption => {
                    if (!prevOption || prevOption.type !== activeOptionType) return prevOption;
                    return {
                        ...prevOption,
                        isReassemblemethodstarted: !isOptionFullyCompleted,
                        cycles: updatedCycles
                    };
                });
            }
            nextQuantitiesObj = {
                ...currentGroup,
                selected_recut_option: currentOptions,
                recut_completed: (currentGroup.recut_completed || 0) + productionInputs.good,
                // `reject` tracks cumulative active rejections. Good pieces are recovered and thus subtracted.
                // Bad pieces from a recut remain rejected, so they are kept in the count (not subtracted, nor added again).
                reject: Math.max(0, (currentGroup.reject || 0) - productionInputs.good),
                recut_received: Math.max(0, (currentGroup.recut_received || 0) - (productionInputs.good + productionInputs.bad)),
                quantities_updated_at: new Date().toISOString()
            };
        } else {
            nextQuantitiesObj = {
                ...currentGroup,
                reject: (currentGroup.reject || 0) + productionInputs.bad,
                quantities_updated_at: new Date().toISOString()
            };
        }
        setQuantities(prev => ({
            ...prev,
            [groupId]: nextQuantitiesObj
        }));

        // 3. Stamp good/bad qty on the last primary/recut cycle
        let finalReassembleCycles = recutCycles;
        let finalPrimaryCycles = primaryCycles;
        if (isReassemble) {
            const list = [...(recutCycles || [])];
            if (list.length > 0) {
                const lastIdx = list.length - 1;
                list[lastIdx] = {
                    ...list[lastIdx],
                    good_qty: productionInputs.good,
                    bad_qty: productionInputs.bad
                };
            }
            finalReassembleCycles = list;
            setReassembleCycles(prev => ({ ...prev, [groupId]: list }));
        } else {
            const list = [...(primaryCycles || [])];
            if (list.length > 0) {
                const lastIdx = list.length - 1;
                list[lastIdx] = {
                    ...list[lastIdx],
                    good_qty: productionInputs.good,
                    bad_qty: productionInputs.bad
                };
            }
            finalPrimaryCycles = list;
            setPrimaryCycles(prev => ({ ...prev, [groupId]: list }));
        }

        // 4. Reset production inputs and cycle state
        setProductionInputs({ good: 0, bad: 0 });
        const updatedRunning = {
            ...running,
            status: 'IDLE',
            startTime: null,
            endTime: null,
            is_recut: false,
            recut_qty: 0,
            recut_option_type: null
        };
        setRunningCycles(prev => ({
            ...prev,
            [groupId]: updatedRunning
        }));

        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, {
                quantities: nextQuantitiesObj,
                runningCycles: updatedRunning,
                localLogs: updatedLogs,
                recut_cycles: finalReassembleCycles,
                primary_cycles: finalPrimaryCycles
            });
        }

        // 5. Persist to ready_jobs collection
        const cycleList = isReassemble
            ? (recutCycles || [])
            : (primaryCycles || []);
        const cycleNum = isReassemble
            ? cycleList.length
            : ((running && typeof running.cyclesDone === 'number' && running.cyclesDone > 0)
                ? running.cyclesDone
                : (cycleList.length > 0
                    ? cycleList[cycleList.length - 1]?.cycle_number || cycleList.length
                    : 1));
        const operatorName = running?.operator || selectedOperator || 'N/A';
        const mainMat = mg?.materials?.find(m => {
            const cat = m.category_type?.toLowerCase() || '';
            return !cat.includes('consumable') && !cat.includes('hardware');
        });
        const matSpec =
            mainMat?.material_input?.size ||
            (mainMat?.material_input?.one_up_width && mainMat?.material_input?.one_up_length
                ? `${mainMat.material_input.one_up_width}"x${mainMat.material_input.one_up_length}"`
                : mainMat?.size || 'Standard');

        dispatch(createReadyJob({
            shopfloor_job_id: job._id,
            group_id: groupId,
            job_no: job.job_no,
            sub_job_no: job.sub_job_no,
            process_name: job.process_name,
            department: type || job.department || 'Assembly Labour',
            client_name: job.client_name,
            material_name: mg?.group_name || 'Unknown Material',
            material_specs: matSpec,
            cycle_number: isReassemble ? 5000 + cycleNum : cycleNum,
            good_qty: productionInputs.good,
            bad_qty: productionInputs.bad,
            completed_at: new Date().toISOString(),
            completed_by_name: operatorName,
            is_recut: isReassemble
        }));

        toast.success(`Handover to STORES complete!`);
    };

    // ── Pause Menu ────────────────────────────────────────────────────────────
    const handlePauseReason = (reason) => {
        const isReassemble = !!runningCycles[groupId]?.is_recut;
        const pauseStatus = isReassemble ? 'RECUT_PAUSED' : 'PRODUCTION_PAUSED';
        setRunningCycles(prev => ({
            ...prev,
            [groupId]: { ...prev[groupId], status: pauseStatus, pauseStartTime: Date.now(), pauseReason: reason }
        }));
        const operatorName = runningCycles[groupId]?.operator || 'Unknown Operator';
        const actionText = `⏸ PAUSED: ${reason} (by ${operatorName})`;
        setLocalLogs(prev => [{
            action: actionText,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName
        }, ...prev]);
        setShowPauseMenu(false);
    };

    const handleCancelPause = () => setShowPauseMenu(false);

    // ── Sample Cycle ──────────────────────────────────────────────────────────
    const handleSampleCycleDone = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        const startTs = typeof running?.startTime === 'number' ? running.startTime : new Date(running?.startTime || Date.now()).getTime();
        const elapsedSec = isNaN(startTs) ? 0 : Math.floor((Date.now() - startTs) / 1000);
        const duration = formatTime(Math.max(0, elapsedSec));
        setLocalLogs(prev => [{ action: `SAMPLE CYCLE ${running.cyclesDone + 1} DONE — ${running.ups} UPS - ${running.ups} PCS — TIME: ${duration}`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId }, ...prev]);
        setQuantities(prev => ({ ...prev, [groupId]: { ...prev[groupId], sample_cycles: (prev[groupId]?.sample_cycles || 0) + 1 } }));
        setRunningCycles(prev => ({ ...prev, [groupId]: { ...prev[groupId], status: 'COMPLETED', endTime: Date.now(), cyclesDone: (prev[groupId]?.cyclesDone || 0) + 1 } }));
    };

    const handleAnotherSampleCycle = () => {
        setRunningCycles(prev => { const next = { ...prev }; delete next[groupId]; return next; });
    };

    const handleStartSample = async () => {
        const ups = parseInt(sampleUps[groupId] || '1');
        setIsActionLoading(true);
        try {
            const opUser = users.find(u => (u.name || u.username) === selectedOperator);
            const payload = {
                job_no: job.job_no,
                sub_job_no: job.sub_job_no,
                category: job.category,
                subcategory: job.subcategory,
                shopfloor_job_id: job._id,
                store_material_issue_id: job.store_material_issue_id,
                group_id: groupId,
                sample_qty: ups,
                started_by: opUser?._id || opUser?.id || null,
                started_by_name: selectedOperator || 'N/A'
            };
            const result = await dispatch(startSampleCycleApi(payload)).unwrap();
            if (result?.success) {
                setLocalLogs(prev => [{ action: `SAMPLE STARTED — ${ups} UPS/CYCLE`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId }, ...prev]);
                const nextRunning = { status: 'RUNNING', startTime: Date.now(), ups, cyclesDone: 0 };
                setRunningCycles(prev => ({ ...prev, [groupId]: nextRunning }));

                let list = [];
                if (result.flow?.session_state?.sample_cycles) {
                    list = result.flow.session_state.sample_cycles;
                } else if (result.flow?.sample_cycles) {
                    list = result.flow.sample_cycles;
                } else {
                    list = [...(sampleCycles || [])];
                    list.push({
                        cycle_number: list.length + 1,
                        start_time: new Date().toISOString(),
                        end_time: '',
                        started_by: opUser?._id || opUser?.id || null,
                        started_by_name: selectedOperator || 'N/A',
                        sample_qty: ups,
                        good_qty: 0,
                        bad_qty: 0,
                        duration: '',
                        status: 'Running'
                    });
                }
                setSampleCycles(prev => ({ ...prev, [groupId]: list }));
                toast.success("Sample cycle started!");
            } else {
                toast.error(result?.message || "Failed to start sample cycle");
            }
        } catch (err) {
            console.error("Start Sample Error:", err);
            toast.error(err?.message || "Error starting sample cycle");
        } finally {
            setIsActionLoading(false);
        }
    };

    // ── UPS Confirm / Edit ────────────────────────────────────────────────────
    const handleEditUps = () => {
        setIsEditingUps(true);
        setIsUpsConfirmed(false);
        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, { isUpsConfirmed: false });
        }
    };

    const handleConfirmUps = () => {
        const ups = firstMaterial?.material_input?.ups || mg.ups || 1;
        if (!isUv && parseFloat(primaryUps) < ups) { toast.error(`Target pieces per cycle must be at least ${ups} (1 sheet).`); return; }
        setIsUpsConfirmed(true);
        setIsEditingUps(false);
        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, { isUpsConfirmed: true, primaryUps });
        }
        setLocalLogs(prev => [{ action: `✅ PRIMARY CONFIRMED: ${primaryUps} UPS/CYCLE (${totalExpectedCycles} CYCLES TOTAL)`, timestamp: new Date().toISOString(), activity_type: 'production', groupId }, ...prev]);
    };

    // ── Reassemble and EMR Handlers ────────────────────────────────────────────────
    const handleOpenReassembleModal = () => {
        if (!isAllCyclesDone) {
            toast.error("Primary cycles must be completed before choosing a reassemble option.");
            return;
        }
        const rejectQty = (q.reject || 0) + (q.sample_reject || 0);
        const accountedQty = (q.selected_recut_option || []).reduce((sum, opt) => {
            const completedQty = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
            return sum + Math.max(0, (opt.qty || 0) - completedQty);
        }, 0);
        const unaccountedQty = Math.max(0, rejectQty - accountedQty);
        if (unaccountedQty <= 0) {
            toast.error("All rejected quantities have already been accounted for.");
            return;
        }
        const mainMat = mg?.materials?.find(m => {
            const cat = m.category_type?.toLowerCase() || '';
            return !cat.includes('consumable') && !cat.includes('hardware');
        });
        const isSheetMaterialLocal = !isUv || mainMat?.material_type === 'sheet';
        setReassembleOptionQty(unaccountedQty);
        setReassembleOptionExcessQty(unaccountedQty);
        setReassembleOptionNewSheetReassembleQty(unaccountedQty);
        const matSpec =
            mainMat?.material_input?.size ||
            (mainMat?.material_input?.one_up_width && mainMat?.material_input?.one_up_length
                ? `${mainMat.material_input.one_up_width}"x${mainMat.material_input.one_up_length}"`
                : mainMat?.size || '24"x36"');
        setReassembleOptionSheetSize(matSpec);
        setReassembleOptionSheetQty(isSheetMaterialLocal ? 1 : unaccountedQty);
        setReassembleOptionReason(isSheetMaterialLocal ? 'Cut failed / sheet damaged' : 'Print failed / piece damaged');
        setReassembleOptionUrgent(false);
        setShowReassembleOptionModal(true);
    };

    const handleConfirmSameSheet = (qtyToReassemble) => {
        if (qtyToReassemble <= 0) return;
        setQuantities(prev => {
            const currentOptions = Array.isArray(prev[groupId]?.selected_recut_option)
                ? prev[groupId].selected_recut_option
                : [];
            const newOptions = [
                ...currentOptions,
                {
                    type: 'same sheet',
                    selected_cycle: 'same sheet',
                    qty: qtyToReassemble,
                    recut_cycle_input: 0,
                    total_cycle: 0,
                    cycles: []
                }
            ];
            const nextGroupObj = {
                ...prev[groupId],
                selected_recut_option: newOptions,
                recut_received: (prev[groupId]?.recut_received || 0) + qtyToReassemble,
                quantities_updated_at: new Date().toISOString()
            };

            if (triggerImmediateSync) {
                triggerImmediateSync(groupId, {
                    quantities: nextGroupObj,
                    localLogs: [{
                        action: `⚡ SAME SHEET REASSEMBLE DIRECT: ${qtyToReassemble} PCS`,
                        timestamp: new Date().toISOString(),
                        activity_type: 'production',
                        groupId,
                        operator: selectedOperator || 'N/A'
                    }, ...localLogs]
                });
            }

            return {
                ...prev,
                [groupId]: nextGroupObj
            };
        });
        setLocalLogs(prev => [{
            action: `⚡ SAME SHEET REASSEMBLE DIRECT: ${qtyToReassemble} PCS`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: selectedOperator || 'N/A'
        }, ...prev]);
        setShowReassembleOptionModal(false);
        toast.success(`Same Sheet chosen. Ready to recut ${qtyToReassemble} pcs immediately!`);
    };

    const handleConfirmExcessMaterial = (qtyToReassemble) => {
        if (qtyToReassemble <= 0) return;
        setQuantities(prev => {
            const currentOptions = Array.isArray(prev[groupId]?.selected_recut_option)
                ? prev[groupId].selected_recut_option
                : [];
            const newOptions = [
                ...currentOptions,
                {
                    type: 'use excess',
                    selected_cycle: 'use excess',
                    qty: qtyToReassemble,
                    recut_cycle_input: 0,
                    total_cycle: 0,
                    cycles: []
                }
            ];
            const nextGroupObj = {
                ...prev[groupId],
                selected_recut_option: newOptions,
                recut_received: (prev[groupId]?.recut_received || 0) + qtyToReassemble,
                quantities_updated_at: new Date().toISOString()
            };

            if (triggerImmediateSync) {
                triggerImmediateSync(groupId, {
                    quantities: nextGroupObj,
                    localLogs: [{
                        action: `♻️ EXCESS MATERIAL REASSEMBLE STARTED: ${qtyToReassemble} PCS`,
                        timestamp: new Date().toISOString(),
                        activity_type: 'production',
                        groupId,
                        operator: selectedOperator || 'N/A'
                    }, ...localLogs]
                });
            }

            return {
                ...prev,
                [groupId]: nextGroupObj
            };
        });
        setLocalLogs(prev => [{
            action: `♻️ EXCESS MATERIAL REASSEMBLE STARTED: ${qtyToReassemble} PCS`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: selectedOperator || 'N/A'
        }, ...prev]);
        setShowReassembleOptionModal(false);
        toast.success(`Excess Material chosen. Ready to recut ${qtyToReassemble} pcs immediately!`);
    };

    const handleConfirmNewSheet = async () => {
        const rejectQty = (q.reject || 0) + (q.sample_reject || 0);
        if (rejectQty <= 0) return;
        try {
            setIsActionLoading(true);
            const bomData = job.bom_id;

            const payloadMaterials = (mg.materials || []).map(m => {
                const jobItem = job?.items?.find(i => i.item_id === m.item_id);
                const bomItem = bomData?.items?.find(i => i.item_id === m.item_id);
                const bomMatSpec = bomData?.material_specification?.find(ms => ms.item_id === m.item_id);
                const bomGroup = bomData?.material_groups?.find(g => g.group_id === groupId);
                const bomMat = bomGroup?.materials?.find(mat => mat.item_id === m.item_id);

                const isCustom = (jobItem?.type || bomItem?.type) === "Custom";

                let actualItemId = bomMatSpec?.actual_material_id;
                if (!actualItemId) {
                    actualItemId = isCustom ? (bomItem?.item_id) : (bomItem?.subCategoryId);
                }

                // // Extract clean string if actualItemId is an object (e.g., {$oid: "..."} or mongoose ObjectId)
                // const cleanId = typeof actualItemId === 'object' && actualItemId !== null
                //     ? (actualItemId.$oid || actualItemId._id || actualItemId)
                //     : actualItemId;

                // const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(actualItemId);

                return {
                    type: isCustom ? 'custom' : 'standard',
                    material_name: m.material_name,
                    material_id: bomItem?.item_id,
                    actual_item_id: actualItemId
                };
            }).filter(m => m.material_id);
            const payload = {
                shopfloor_job_id: job._id,
                group_id: groupId,
                recut_qty: recutOptionNewSheetReassembleQty,
                sheet_size: recutOptionSheetSize,
                qty: recutOptionSheetQty,
                unit: isSheetMaterial ? 'sheets' : 'pcs',
                urgent: recutOptionUrgent,
                reason: recutOptionReason,
                materials: payloadMaterials
            };
            const response = await dispatch(submitExtraMaterialEMRThunk(payload)).unwrap();
            if (response?.success) {
                const emr = response.data;
                setQuantities(prev => {
                    const currentOptions = Array.isArray(prev[groupId]?.selected_recut_option)
                        ? prev[groupId].selected_recut_option
                        : [];
                    const newOptions = [
                        ...currentOptions,
                        {
                            type: isSheetMaterial ? 'New Sheet' : 'New Pcs',
                            selected_cycle: isSheetMaterial ? 'New Sheet' : 'New Pcs',
                            recut_qty: recutOptionNewSheetReassembleQty,
                            qty: recutOptionNewSheetReassembleQty,
                            sheet_qty: recutOptionSheetQty,
                            is_inwarded: false,
                            urgent: recutOptionUrgent,
                            reason: recutOptionReason,
                            recut_cycle_input: 0,
                            total_cycle: 0,
                            cycles: []
                        }
                    ];

                    const currentEmrIds = Array.isArray(prev[groupId]?.active_emr_id)
                        ? prev[groupId].active_emr_id
                        : (prev[groupId]?.active_emr_id ? [prev[groupId].active_emr_id] : []);
                    const newEmrIds = currentEmrIds.includes(emr._id) ? currentEmrIds : [...currentEmrIds, emr._id];

                    const nextGroupObj = {
                        ...prev[groupId],
                        selected_recut_option: newOptions,
                        active_emr_id: newEmrIds,
                        // Keep reject/sample_reject counts stable in REJECTED column
                        recut_not_inwarded: (prev[groupId]?.recut_not_inwarded || 0) + recutOptionSheetQty,
                        quantities_updated_at: new Date().toISOString()
                    };

                    const actionMsg = isSheetMaterial
                        ? `🚨 EMR SUBMITTED FOR NEW SHEET: ${recutOptionSheetQty} SHEETS (${recutOptionSheetSize})`
                        : `🚨 EMR SUBMITTED FOR NEW PCS: ${recutOptionSheetQty} PCS`;

                    if (triggerImmediateSync) {
                        triggerImmediateSync(groupId, {
                            quantities: nextGroupObj,
                            localLogs: [{
                                action: actionMsg,
                                timestamp: new Date().toISOString(),
                                activity_type: 'production',
                                groupId,
                                operator: selectedOperator || 'N/A'
                            }, ...localLogs]
                        });
                    }

                    return {
                        ...prev,
                        [groupId]: nextGroupObj
                    };
                });
                const actionMsg = isSheetMaterial
                    ? `🚨 EMR SUBMITTED FOR NEW SHEET: ${recutOptionSheetQty} SHEETS (${recutOptionSheetSize})`
                    : `🚨 EMR SUBMITTED FOR NEW PCS: ${recutOptionSheetQty} PCS`;
                setLocalLogs(prev => [{
                    action: actionMsg,
                    timestamp: new Date().toISOString(),
                    activity_type: 'production',
                    groupId,
                    operator: selectedOperator || 'N/A'
                }, ...prev]);
                setShowReassembleOptionModal(false);
                toast.success("Extra Material EMR submitted successfully!");
            } else {
                toast.error(response?.message || "Failed to submit EMR");
            }
        } catch (error) {
            console.error("handleConfirmNewSheet error:", error);
            toast.error("Error submitting EMR: " + (error.message || error));
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleStartReassembleCycle = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        if (!selectedReassembleOption) {
            toast.error("No reassemble option chosen!");
            return;
        }

        const completed = (selectedReassembleOption.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
        const remaining = Math.max(0, selectedReassembleOption.qty - completed);
        const activeCycleUps = Math.min(remaining, recutUpsVal);

        if (activeCycleUps <= 0) {
            toast.error("No pending quantity to recut!");
            return;
        }

        const current_cycle_num = (recutCycles || []).length + 1;
        const operatorName = selectedOperator || 'N/A';
        const opUser = users.find(u => (u.name || u.username) === operatorName);

        const newCycleData = {
            cycle_number: current_cycle_num,
            start_time: new Date().toISOString(),
            end_time: '',
            started_by: opUser?._id || opUser?.id || null,
            started_by_name: operatorName,
            ups: activeCycleUps,
            good_qty: 0,
            bad_qty: 0,
            duration: '',
            status: 'Running'
        };

        const updatedCycles = [...(selectedReassembleOption.cycles || []), newCycleData];
        const updatedOption = {
            ...selectedReassembleOption,
            recut_cycle_input: recutUpsVal,
            total_cycle: Math.ceil(selectedReassembleOption.qty / recutUpsVal),
            cycles: updatedCycles
        };

        const nextReassembleCycles = [...(recutCycles || []), newCycleData];
        const nextRunning = {
            ...runningCycles[groupId],
            status: 'RECUT_RUNNING',
            startTime: Date.now(),
            ups: activeCycleUps,
            operator: operatorName,
            heads: selectedHeads || 1,
            cyclesDone: runningCycles[groupId]?.cyclesDone || 0,
            is_recut: true,
            recut_option_type: selectedReassembleOption.type
        };
        const nextLogs = [{
            action: `⚡ ${selectedReassembleOption.type.toUpperCase()} REASSEMBLE CYCLE ${current_cycle_num} STARTED`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName
        }, ...localLogs];

        setSelectedReassembleOption(updatedOption);

        const currentGroup = quantities[groupId] || {};
        const currentOptions = Array.isArray(currentGroup.selected_recut_option)
            ? [...currentGroup.selected_recut_option]
            : [];
        // Use stored _listIndex for precise matching (handles multiple same-type entries)
        const startIdx = selectedReassembleOption._listIndex !== undefined ? selectedReassembleOption._listIndex : currentOptions.findIndex(o => o.type === selectedReassembleOption.type);
        if (startIdx !== -1) {
            currentOptions[startIdx] = updatedOption;
        }
        const nextQuantitiesObj = {
            ...currentGroup,
            selected_recut_option: currentOptions,
            quantities_updated_at: new Date().toISOString()
        };

        setQuantities(prev => ({
            ...prev,
            [groupId]: nextQuantitiesObj
        }));

        // Add to global recut cycles state for synchronization
        setReassembleCycles(prev => {
            const list = [...(prev[groupId] || [])];
            return {
                ...prev,
                [groupId]: [...list, newCycleData]
            };
        });

        setRunningCycles(prev => ({
            ...prev,
            [groupId]: nextRunning
        }));

        setLocalLogs(prev => [{
            action: `⚡ ${selectedReassembleOption.type.toUpperCase()} REASSEMBLE CYCLE ${current_cycle_num} STARTED`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName
        }, ...prev]);

        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, {
                quantities: nextQuantitiesObj,
                runningCycles: nextRunning,
                localLogs: nextLogs,
                recut_cycles: nextReassembleCycles
            });
        }

        toast.success(`${selectedReassembleOption.type.toUpperCase()} Reassemble Cycle ${current_cycle_num} started successfully!`);
    };

    const handleReassembleCycleDone = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        if (!running) return;

        const durationSeconds = Math.floor((Date.now() - running.startTime) / 1000);
        const duration = formatTime(durationSeconds);

        const nextRunning = {
            ...running,
            status: 'RECUT_COMPLETED',
            endTime: Date.now(),
            lastDuration: durationSeconds
        };

        const updatedCycles = [...(selectedReassembleOption?.cycles || [])];
        if (updatedCycles.length > 0) {
            const lastIdx = updatedCycles.length - 1;
            updatedCycles[lastIdx] = {
                ...updatedCycles[lastIdx],
                end_time: new Date().toISOString(),
                duration,
                status: 'Completed'
            };
        }
        const updatedOption = {
            ...selectedReassembleOption,
            cycles: updatedCycles
        };

        const nextLogs = [{
            action: `✓ ${selectedReassembleOption?.type.toUpperCase()} REASSEMBLE CYCLE DONE — ${running.ups} PCS — TIME: ${duration}`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: running.operator || 'N/A'
        }, ...localLogs];

        setRunningCycles(prev => ({
            ...prev,
            [groupId]: nextRunning
        }));

        setSelectedReassembleOption(updatedOption);

        // Update quantities React state with updated option containing the completed cycle
        const currentGroup = quantities[groupId] || {};
        const currentOptions = Array.isArray(currentGroup.selected_recut_option)
            ? [...currentGroup.selected_recut_option]
            : [];
        const doneIdx = selectedReassembleOption?._listIndex !== undefined
            ? selectedReassembleOption._listIndex
            : currentOptions.findIndex(o => o.type === selectedReassembleOption.type);
        if (doneIdx !== -1) {
            currentOptions[doneIdx] = updatedOption;
        }

        const nextQuantitiesObj = {
            ...currentGroup,
            selected_recut_option: currentOptions,
            quantities_updated_at: new Date().toISOString()
        };

        setQuantities(prev => ({
            ...prev,
            [groupId]: nextQuantitiesObj
        }));

        // Update global recutCycles state with completed cycle
        let finalReassembleCycles = [];
        setReassembleCycles(prev => {
            const list = [...(prev[groupId] || [])];
            if (list.length > 0) {
                const lastIdx = list.length - 1;
                list[lastIdx] = {
                    ...list[lastIdx],
                    end_time: new Date().toISOString(),
                    duration,
                    status: 'Completed'
                };
            }
            finalReassembleCycles = list;
            return {
                ...prev,
                [groupId]: list
            };
        });

        // Pre-fill productionInputs for the inspection card in central panel!
        setProductionInputs({
            good: running.ups || 1,
            bad: 0
        });

        setLocalLogs(prev => [{
            action: `✓ ${selectedReassembleOption?.type.toUpperCase()} REASSEMBLE CYCLE DONE — ${running.ups} PCS — TIME: ${duration}`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: running.operator || 'N/A'
        }, ...prev]);

        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, {
                quantities: nextQuantitiesObj,
                runningCycles: nextRunning,
                localLogs: nextLogs,
                recut_cycles: finalReassembleCycles
            });
        }

        toast.success("Reassemble Cycle completed! Proceed with inspection in center panel.");
    };

    // const handleConfirmReassembleReceipt = async () => {
    //     const notInwardedQty = q.recut_not_inwarded || 0;
    //     if (notInwardedQty <= 0) return;

    //     // Robustly get EMR ID (picks most recent if array, or string if string)
    //     const emrId = Array.isArray(q.active_emr_id)
    //         ? q.active_emr_id[q.active_emr_id.length - 1]
    //         : q.active_emr_id;

    //     if (!emrId) {
    //         setQuantities(prev => {
    //             const currentOptions = Array.isArray(prev[groupId]?.selected_recut_option)
    //                 ? prev[groupId].selected_recut_option
    //                 : [];
    //             let updated = false;
    //             const newOptions = currentOptions.map(opt => {
    //                 if (opt.type === 'New Sheet' && !opt.is_inwarded && !updated) {
    //                     updated = true;
    //                     return { ...opt, is_inwarded: true };
    //                 }
    //                 return opt;
    //             });
    //             return {
    //                 ...prev,
    //                 [groupId]: {
    //                     ...prev[groupId],
    //                     selected_recut_option: newOptions,
    //                     recut_not_inwarded: 0,
    //                     active_emr_id: null,
    //                     recut_received: (prev[groupId]?.recut_received || 0) + notInwardedQty
    //                 }
    //             };
    //         });
    //         toast.info("Offline inward receipt complete!");
    //         return;
    //     }
    //     try {
    //         setIsActionLoading(true);
    //         const response = await dispatch(confirmEMRReceiptThunk(emrId)).unwrap();
    //         if (response?.success) {
    //             setQuantities(prev => {
    //                 const currentGroup = prev[groupId] || {};
    //                 let newEmrId = null;
    //                 if (Array.isArray(currentGroup.active_emr_id)) {
    //                     newEmrId = currentGroup.active_emr_id.filter(id => id !== emrId);
    //                     if (newEmrId.length === 0) newEmrId = null;
    //                 }
    //                 const currentOptions = Array.isArray(currentGroup.selected_recut_option)
    //                     ? currentGroup.selected_recut_option
    //                     : [];
    //                 let updated = false;
    //                 const newOptions = currentOptions.map(opt => {
    //                     if (opt.type === 'New Sheet' && !opt.is_inwarded && !updated) {
    //                         updated = true;
    //                         return { ...opt, is_inwarded: true };
    //                     }
    //                     return opt;
    //                 });
    //                 return {
    //                     ...prev,
    //                     [groupId]: {
    //                         ...prev[groupId],
    //                         selected_recut_option: newOptions,
    //                         recut_not_inwarded: 0,
    //                         active_emr_id: newEmrId,
    //                         recut_received: (prev[groupId]?.recut_received || 0) + notInwardedQty
    //                     }
    //                 };
    //             });
    //             setLocalLogs(prev => [{
    //                 action: `✓ EXTRA MATERIAL RECEIVED BY OPERATOR (${notInwardedQty} PCS)`,
    //                 timestamp: new Date().toISOString(),
    //                 activity_type: 'production',
    //                 groupId,
    //                 operator: selectedOperator || 'N/A'
    //             }, ...prev]);
    //             toast.success("Material receipt confirmed and synchronized with database!");
    //         } else {
    //             toast.error(response?.message || "Failed to confirm receipt");
    //         }
    //     } catch (error) {
    //         console.error("handleConfirmReassembleReceipt error:", error);
    //         toast.error("Error receiving material: " + (error.message || error));
    //     } finally {
    //         setIsActionLoading(false);
    //     }
    // };

    // const handleStartReassembleCycle = (qty) => {
    //     const readyOptions = normalizedReassembleOptions.filter(opt => {
    //         if (opt.type === 'New Sheet' && !opt.is_inwarded) return false;
    //         const completedQty = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
    //         return completedQty < opt.qty;
    //     });
    //     const activeOption = readyOptions[selectedReassembleOptionIndex] || readyOptions[0];
    //     if (!activeOption) {
    //         toast.error("No pending reassemble option found");
    //         return;
    //     }

    //     const activeOptionIndex = q.selected_recut_option.findIndex(
    //         opt => opt === activeOption
    //     );

    //     const activeCompleted = activeOption
    //         ? (activeOption.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0)
    //         : 0;
    //     const activeMaxQty = activeOption
    //         ? Math.min(activeOption.qty - activeCompleted, q.recut_received || 0)
    //         : (q.recut_received || 0);

    //     if (qty <= 0 || qty > activeMaxQty) {
    //         toast.error(`Invalid quantity. Max allowed is ${activeMaxQty}`);
    //         return;
    //     }

    //     const operatorName = selectedOperator || 'N/A';
    //     setRunningCycles(prev => ({
    //         ...prev,
    //         [groupId]: {
    //             ...prev[groupId],
    //             status: 'PRODUCTION_RUNNING',
    //             startTime: Date.now(),
    //             ups: qty,
    //             operator: operatorName,
    //             heads: selectedHeads || 1,
    //             cyclesDone: prev[groupId]?.cyclesDone || 0,
    //             is_recut: true,
    //             recut_qty: qty,
    //             recut_option_index: activeOptionIndex
    //         }
    //     }));

    //     const opUser = users.find(u => (u.name || u.username) === operatorName);
    //     const newCycleData = {
    //         cycle_number: (activeOption.cycles || []).length + 1,
    //         start_time: new Date().toISOString(),
    //         end_time: '',
    //         started_by: opUser?._id || opUser?.id || null,
    //         started_by_name: operatorName,
    //         ups: qty,
    //         good_qty: 0,
    //         bad_qty: 0,
    //         duration: '',
    //         status: 'Running'
    //     };

    //     setQuantities(prev => {
    //         const currentOptions = [...(prev[groupId]?.selected_recut_option || [])];
    //         if (currentOptions[activeOptionIndex]) {
    //             const opt = currentOptions[activeOptionIndex];
    //             const updatedCycles = [...(opt.cycles || [])];
    //             updatedCycles.push(newCycleData);
    //             currentOptions[activeOptionIndex] = {
    //                 ...opt,
    //                 recut_cycle_input: qty,
    //                 total_cycle: Math.ceil(opt.qty / qty),
    //                 cycles: updatedCycles
    //             };
    //         }
    //         return {
    //             ...prev,
    //             [groupId]: {
    //                 ...prev[groupId],
    //                 selected_recut_option: currentOptions
    //             }
    //         };
    //     });

    //     setReassembleCycles(prev => {
    //         const list = [...(prev[groupId] || [])];
    //         const nextCycleNum = list.length + 1;
    //         return {
    //             ...prev,
    //             [groupId]: [...list, {
    //                 ...newCycleData,
    //                 cycle_number: nextCycleNum
    //             }]
    //         };
    //     });

    //     setLocalLogs(prev => [{
    //         action: `🚀 REASSEMBLE CYCLE STARTED FOR ${qty} PCS (${activeOption.type.toUpperCase()})`,
    //         timestamp: new Date().toISOString(),
    //         activity_type: 'production',
    //         groupId,
    //         operator: operatorName
    //     }, ...prev]);

    //     setShowReassembleStartInput(false);
    //     toast.success(`Reassemble Cycle started successfully!`);
    // };

    // const handleStartReassembleCycleDirect = (opt, originalIndex) => {
    //     const completed = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
    //     const remaining = opt.qty - completed;
    //     const activeMaxQty = Math.min(remaining, q.recut_received || 0);
    // 
    //     if (activeMaxQty <= 0) {
    //         toast.error("No ready quantity available for this reassemble option");
    //         return;
    //     }
    // 
    //     const operatorName = selectedOperator || 'N/A';
    //     setRunningCycles(prev => ({
    //         ...prev,
    //         [groupId]: {
    //             ...prev[groupId],
    //             status: 'PRODUCTION_RUNNING',
    //             startTime: Date.now(),
    //             ups: activeMaxQty,
    //             operator: operatorName,
    //             heads: selectedHeads || 1,
    //             cyclesDone: prev[groupId]?.cyclesDone || 0,
    //             is_recut: true,
    //             recut_qty: activeMaxQty,
    //             recut_option_index: originalIndex
    //         }
    //     }));
    // 
    //     const opUser = users.find(u => (u.name || u.username) === operatorName);
    //     const newCycleData = {
    //         cycle_number: (opt.cycles || []).length + 1,
    //         start_time: new Date().toISOString(),
    //         end_time: '',
    //         started_by: opUser?._id || opUser?.id || null,
    //         started_by_name: operatorName,
    //         ups: activeMaxQty,
    //         good_qty: 0,
    //         bad_qty: 0,
    //         duration: '',
    //         status: 'Running'
    //     };
    // 
    //     setQuantities(prev => {
    //         const currentOptions = [...(prev[groupId]?.selected_recut_option || [])];
    //         if (currentOptions[originalIndex]) {
    //             const optionItem = currentOptions[originalIndex];
    //             const updatedCycles = [...(optionItem.cycles || [])];
    //             updatedCycles.push(newCycleData);
    //             currentOptions[originalIndex] = {
    //                 ...optionItem,
    //                 recut_cycle_input: activeMaxQty,
    //                 total_cycle: Math.ceil(optionItem.qty / activeMaxQty),
    //                 cycles: updatedCycles
    //             };
    //         }
    //         return {
    //             ...prev,
    //             [groupId]: {
    //                 ...prev[groupId],
    //                 selected_recut_option: currentOptions
    //             }
    //         };
    //     });
    // 
    //     setReassembleCycles(prev => {
    //         const list = [...(prev[groupId] || [])];
    //         const nextCycleNum = list.length + 1;
    //         return {
    //             ...prev,
    //             [groupId]: [...list, {
    //                 ...newCycleData,
    //                 cycle_number: nextCycleNum
    //             }]
    //         };
    //     });
    // 
    //     setLocalLogs(prev => [{
    //         action: `🚀 REASSEMBLE CYCLE STARTED FOR ${activeMaxQty} PCS (${opt.type.toUpperCase()})`,
    //         timestamp: new Date().toISOString(),
    //         activity_type: 'production',
    //         groupId,
    //         operator: operatorName
    //     }, ...prev]);
    // 
    //     setShowReassembleStartInput(false);
    //     toast.success(`Reassemble Cycle started successfully!`);
    // };

    // ── Primary Cycle Controls ────────────────────────────────────────────────
    const handleCycleDone = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        const isReassemble = !!running.is_recut;
        const isFirst = (running.cyclesDone || 0) === 0;
        const samplePcs = (q?.sample_good || 0) + (q?.sample_reject || 0);
        const totalSamplePcs = (isUv && !isSheetTarget) ? samplePcs : 0;
        const currentUps = parseInt(running?.ups) || parseInt(primaryUps) || 0;
        const pcsProduced = isFirst ? (currentUps - totalSamplePcs) : currentUps;
        const durationSeconds = Math.floor((Date.now() - running.startTime) / 1000);
        const duration = formatTime(durationSeconds);
        const actionText = `PRODUCTION CYCLE ${running.cyclesDone + 1} DONE — ${pcsProduced} PCS — OPERATOR: ${running.operator} — TIME: ${duration}`;

        const operatorName = running.operator || 'Unknown Operator';
        const nextLogs = [{
            action: actionText,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName,
            good_qty: 0,
            bad_qty: 0,
            details: {
                good_qty: 0,
                bad_qty: 0,
                cycle_number: ((running.cyclesDone || 0) + 1)
            }
        }, ...localLogs];
        setLocalLogs(prev => [{
            action: actionText,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName,
            good_qty: 0,
            bad_qty: 0,
            details: {
                good_qty: 0,
                bad_qty: 0,
                cycle_number: ((running.cyclesDone || 0) + 1)
            }
        }, ...prev]);

        const nextCyclesDone = isReassemble ? (running.cyclesDone || 0) : ((running.cyclesDone || 0) + 1);
        const nextRunning = {
            ...running,
            status: 'PRODUCTION_COMPLETED',
            endTime: Date.now(),
            lastDuration: durationSeconds,
            cyclesDone: nextCyclesDone
        };
        setRunningCycles(prev => ({
            ...prev,
            [groupId]: nextRunning
        }));

        let nextPrimaryCycles = primaryCycles;
        const list = [...(primaryCycles || [])];
        if (list.length > 0) {
            const lastIdx = list.length - 1;
            list[lastIdx] = {
                ...list[lastIdx],
                end_time: new Date().toISOString(),
                duration,
                status: 'Completed'
            };
        }
        nextPrimaryCycles = list;
        setPrimaryCycles(prev => ({ ...prev, [groupId]: list }));

        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, {
                runningCycles: nextRunning,
                localLogs: nextLogs,
                primary_cycles: nextPrimaryCycles
            });
        }
    };

    const handleResumeCycle = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        const pauseDuration = Date.now() - running.pauseStartTime;
        setRunningCycles(prev => ({ ...prev, [groupId]: { ...prev[groupId], status: 'PRODUCTION_RUNNING', startTime: (prev[groupId].startTime || Date.now()) + pauseDuration } }));
        const actionText = `▶ PRODUCTION RESUMED`;
        const operatorName = running.operator || 'Unknown Operator';
        setLocalLogs(prev => [{
            action: actionText,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName
        }, ...prev]);
    };

    const handleStartCycle = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        if (running?.operator && running?.heads) {
            const nextCycleNum = (running.cyclesDone || 0) + 1;
            const nextRunning = {
                ...running,
                status: 'PRODUCTION_RUNNING',
                startTime: Date.now()
            };
            const nextLogs = [{
                action: `▶ STARTED CYCLE ${nextCycleNum} — ${running.heads} HEAD — OP: ${running.operator}`,
                timestamp: new Date().toISOString(),
                activity_type: 'production',
                groupId,
                operator: running.operator
            }, ...localLogs];

            setRunningCycles(prev => ({
                ...prev,
                [groupId]: nextRunning
            }));
            setLocalLogs(prev => [{
                action: `▶ STARTED CYCLE ${nextCycleNum} — ${running.heads} HEAD — OP: ${running.operator}`,
                timestamp: new Date().toISOString(),
                activity_type: 'production',
                groupId,
                operator: running.operator
            }, ...prev]);

            const opUser = users.find(u => (u.name || u.username) === running.operator);
            const newCycle = {
                cycle_number: nextCycleNum,
                start_time: new Date().toISOString(),
                end_time: '',
                started_by: opUser?._id || opUser?.id || null,
                started_by_name: running.operator,
                ups: effectivePrimaryUps,
                good_qty: 0,
                bad_qty: 0,
                duration: '',
                status: 'Running'
            };
            const nextPrimaryCycles = [...(primaryCycles || []), newCycle];
            setPrimaryCycles(prev => ({
                ...prev,
                [groupId]: nextPrimaryCycles
            }));

            if (triggerImmediateSync) {
                triggerImmediateSync(groupId, {
                    runningCycles: nextRunning,
                    localLogs: nextLogs,
                    primary_cycles: nextPrimaryCycles
                });
            }
        } else {
            setShowSetupModal(true);
        }
    };

    const handlePauseOrResume = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const running = runningCycles[groupId];
        if (isRunning) {
            setShowPauseMenu(true);
        } else if (isPaused) {
            const pauseDuration = Date.now() - (running.pauseStartTime || Date.now());
            const newStatus = running.is_recut ? 'RECUT_RUNNING' : 'PRODUCTION_RUNNING';
            setRunningCycles(prev => ({ ...prev, [groupId]: { ...prev[groupId], status: newStatus, startTime: (prev[groupId].startTime || Date.now()) + pauseDuration } }));
            const actionText = running.is_recut ? `▶ REASSEMBLE RESUMED` : `▶ PRODUCTION RESUMED`;
            const operatorName = running.operator || 'Unknown Operator';
            setLocalLogs(prev => [{
                action: actionText,
                timestamp: new Date().toISOString(),
                activity_type: 'production',
                groupId,
                operator: operatorName
            }, ...prev]);
        }
    };

    const handleStopSession = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const overallFormatted = formatTime(timers.overall);
        const prevStatus = running?.status || 'IDLE';

        setRunningCycles(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                status: 'STOPPED',
                stoppedFrom: prevStatus,
                stoppedTime: Date.now()
            }
        }));

        setLocalLogs(prev => [{
            action: `■ STOPPED AT ${overallFormatted}`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: selectedOperator || 'N/A'
        }, ...prev]);

        toast.info(`Session stopped at ${overallFormatted}`);
    };

    const handleStartSession = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const prevStatus = running?.stoppedFrom || 'PRODUCTION_RUNNING';
        const stoppedDuration = Date.now() - (running?.stoppedTime || Date.now());

        setRunningCycles(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                status: prevStatus,
                startTime: (prevStatus === 'PRODUCTION_RUNNING' || prevStatus === 'RECUT_RUNNING')
                    ? (prev[groupId].startTime || Date.now()) + stoppedDuration
                    : prev[groupId].startTime
            }
        }));

        const actionText = !isUv
            ? `▷ STARTED - ${getShiftLabel(currentShift)} - ${effectivePrimaryUps} PCS - OPERATOR: ${selectedOperator || 'N/A'}`
            : `▷ STARTED - ${getShiftLabel(currentShift)} - ${primaryUps} PCS/CYCLE - OPERATOR: ${selectedOperator || 'N/A'}`;

        setLocalLogs(prev => [{
            action: actionText,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: selectedOperator || 'N/A'
        }, ...prev]);

        toast.success(`Session started!`);
    };

    // ── Sample Input Steppers ─────────────────────────────────────────────────
    const handleSampleGoodDecrement = () => {
        const current = sampleInputs[groupId]?.good || 0;
        const max = runningCycles[groupId].ups;
        const newVal = Math.max(0, current - 1);
        setSampleInputs(prev => ({ ...prev, [groupId]: { good: newVal, bad: max - newVal } }));
    };
    const handleSampleGoodIncrement = () => {
        const current = sampleInputs[groupId]?.good || 0;
        const max = runningCycles[groupId].ups;
        const newVal = Math.min(max, current + 1);
        setSampleInputs(prev => ({ ...prev, [groupId]: { good: newVal, bad: max - newVal } }));
    };
    const handleSampleBadDecrement = () => {
        const current = sampleInputs[groupId]?.bad || 0;
        const max = runningCycles[groupId].ups;
        const newVal = Math.max(0, current - 1);
        setSampleInputs(prev => ({ ...prev, [groupId]: { bad: newVal, good: max - newVal } }));
    };
    const handleSampleBadIncrement = () => {
        const current = sampleInputs[groupId]?.bad || 0;
        const max = runningCycles[groupId].ups;
        const newVal = Math.min(max, current + 1);
        setSampleInputs(prev => ({ ...prev, [groupId]: { bad: newVal, good: max - newVal } }));
    };

    // ── Photo handlers ────────────────────────────────────────────────────────
    const handlePhotoAreaClick = () => {
        if (!samplePhotos[groupId]) document.getElementById(`photo-upload-${groupId}`).click();
    };
    const handlePhotoPreview = (e) => {
        e.stopPropagation();
        setLightboxSrc(URL.createObjectURL(samplePhotos[groupId]));
        setLightboxName(samplePhotos[groupId].name);
    };
    const handleChangePhoto = (e) => {
        e.stopPropagation();
        document.getElementById(`photo-upload-${groupId}`).click();
    };
    const handleRemovePhoto = (e) => {
        e.stopPropagation();
        setSamplePhotos(prev => { const updated = { ...prev }; delete updated[groupId]; return updated; });
        document.getElementById(`photo-upload-${groupId}`).value = '';
    };

    // ── Submit Sample ─────────────────────────────────────────────────────────
    const handleSubmitSample = async () => {
        const inputs = sampleInputs[groupId];
        const good = inputs?.good || 0;
        const bad = inputs?.bad || 0;
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('shopfloor_job_id', job._id);
            formData.append('group_id', groupId);
            formData.append('good_qty', good);
            formData.append('bad_qty', bad);
            if (samplePhotos[groupId]) formData.append('sample_image', samplePhotos[groupId]);
            const result = await dispatch(submitSampleForApprovalApi(formData)).unwrap();
            if (result?.success) {
                const logs = [];
                if (good > 0) logs.push({ action: `SAMPLE SENT FOR APPROVAL — ${good} GOOD PCS`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId });
                if (bad > 0) logs.push({ action: `SAMPLE REJECTED — ${bad} BAD PCS`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId });
                setLocalLogs(prev => [...logs, ...prev]);
                setQuantities(prev => ({ ...prev, [groupId]: { ...prev[groupId], sample_good: (prev[groupId]?.sample_good || 0) + (good > 0 ? good : 0), sample_reject: (prev[groupId]?.sample_reject || 0) + (bad > 0 ? bad : 0) } }));
                const updatedRunning = (good > 0)
                    ? { ...(runningCycles[groupId] || {}), status: 'WAITING_APPROVAL', issuedGood: good, issuedBad: bad }
                    : (bad > 0 && good === 0)
                        ? { ...(runningCycles[groupId] || {}), status: isCuttingProcess ? 'IDLE' : 'WAITING_UPSTREAM', is_rerun: true, issuedGood: 0, issuedBad: bad }
                        : (result.flow?.session_state?.runningCycles?.[groupId] || { ...(runningCycles[groupId] || {}), status: 'WAITING_APPROVAL', issuedGood: good, issuedBad: bad });
                setRunningCycles(prev => ({ ...prev, [groupId]: updatedRunning }));
                setSampleInputs(prev => { const next = { ...prev }; delete next[groupId]; return next; });
                setSamplePhotos(prev => { const next = { ...prev }; delete next[groupId]; return next; });
                if (result.flow?.session_state?.sample_cycles) {
                    setSampleCycles(prev => ({ ...prev, [groupId]: result.flow.session_state.sample_cycles }));
                } else if (result.flow?.sample_cycles) {
                    setSampleCycles(prev => ({ ...prev, [groupId]: result.flow.sample_cycles }));
                } else {
                    setSampleCycles(prev => { const list = [...(prev[groupId] || [])]; if (list.length > 0) { const lastIdx = list.length - 1; const durationSeconds = Math.floor((Date.now() - (runningCycles[groupId]?.startTime || Date.now())) / 1000); list[lastIdx] = { ...list[lastIdx], end_time: new Date().toISOString(), good_qty: good, bad_qty: bad, duration: formatTime(durationSeconds), status: good > 0 ? 'Awaiting Approval' : 'Rejected' }; } return { ...prev, [groupId]: list }; });
                }
                toast.success("Sample submitted successfully");
            } else {
                toast.error(result?.message || "Failed to submit sample");
            }
        } catch (err) {
            console.error("Submit Sample Error:", err);
            toast.error(err?.message || "Error submitting sample");
        } finally {
            setIsActionLoading(false);
        }
    };

    // ── Sample Approval / Reject ──────────────────────────────────────────────
    const handleRejectSample = () => setShowRejectModal(true);

    const handleApproveSample = async () => {
        setIsActionLoading(true);
        try {
            const operatorName = selectedOperator || 'Sales/Admin';
            const result = await dispatch(processSampleActionApi({
                shopfloor_job_id: job._id,
                group_id: groupId,
                action: 'approve',
                action_by: job.created_by || 'QC',
                action_by_name: operatorName
            })).unwrap();

            if (result?.success) {
                const nextLogs = [{ action: `✓ SAMPLE APPROVED BY SALES/ADMIN`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId }, ...localLogs];
                setLocalLogs(prev => [{ action: `✓ SAMPLE APPROVED BY SALES/ADMIN`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId }, ...prev]);
                const nextRunning = { ...runningCycles[groupId], status: 'APPROVED' };
                setRunningCycles(prev => ({ ...prev, [groupId]: nextRunning }));

                let list = [];
                if (result.flow?.session_state?.sample_cycles) {
                    list = result.flow.session_state.sample_cycles;
                } else if (result.flow?.sample_cycles) {
                    list = result.flow.sample_cycles;
                } else {
                    list = [...(sampleCycles || [])];
                    if (list.length > 0) {
                        const lastIdx = list.length - 1;
                        list[lastIdx] = { ...list[lastIdx], status: 'Approved', action_at: new Date().toISOString() };
                    }
                }
                setSampleCycles(prev => ({ ...prev, [groupId]: list }));
                toast.success("Sample Approved! You can now start main production.");
            } else {
                toast.error(result?.message || "Failed to approve sample");
            }
        } catch (err) {
            console.error("Approve Sample Error:", err);
            toast.error(err?.message || "Error approving sample");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRunSampleAgain = () => {
        setRunningCycles(prev => { const next = { ...prev }; delete next[groupId]; return next; });
        toast.info("Retrying sample cycle");
    };

    const handleBeginPrimaryCycle = async () => {
        setIsActionLoading(true);
        try {
            const operatorName = selectedOperator || 'QC';
            const result = await dispatch(startPrimaryCycleApi({
                shopfloor_job_id: job._id,
                group_id: groupId,
                started_by: job.created_by || 'Operator',
                started_by_name: operatorName
            })).unwrap();

            if (result?.success) {
                const nextUnlocked = {
                    cycleCount: q.sample_cycles || 1,
                    goodQty: q.sample_good || 0,
                    badQty: q.sample_reject || 0,
                    totalPcs: (q.sample_good || 0) + (q.sample_reject || 0)
                };
                setPrimaryUnlocked(prev => ({ ...prev, [groupId]: nextUnlocked }));
                const nextRunning = {
                    ...runningCycles[groupId],
                    status: 'IDLE',
                    startTime: null,
                    endTime: null,
                    is_recut: false,
                    recut_qty: 0,
                    recut_option_type: null,
                    cyclesDone: 0 // Reset completed cycle count for the new primary production phase!
                };
                setRunningCycles(prev => ({ ...prev, [groupId]: nextRunning }));
                setLocalLogs(prev => [{ action: `🚀 APPROVED FOR PRODUCTION — PRIMARY CYCLE NOW OPEN`, timestamp: new Date().toISOString(), activity_type: 'production', groupId }, ...prev]);
                toast.success("Primary cycle started!");
            } else {
                toast.error(result?.message || "Failed to start primary cycle");
            }
        } catch (err) {
            console.error("Begin Primary Cycle Error:", err);
            toast.error(err?.message || "Error starting primary cycle");
        } finally {
            setIsActionLoading(false);
        }
    };

    // ── Good / Bad Steppers (Production) ─────────────────────────────────────
    const handleGoodPlusOne = (e) => {
        e.stopPropagation();
        const newVal = Math.min(cycleOutput, (productionInputs.good || 0) + 1);
        setProductionInputs(prev => ({ ...prev, good: newVal, bad: Math.max(0, cycleOutput - newVal) }));
    };
    const handleGoodMinusOne = (e) => {
        e.stopPropagation();
        const newVal = Math.max(0, (productionInputs.good || 0) - 1);
        setProductionInputs(prev => ({ ...prev, good: newVal, bad: Math.max(0, cycleOutput - newVal) }));
    };
    const handleSetAllGood = () => setProductionInputs(prev => ({ ...prev, good: cycleOutput, bad: 0 }));

    const handleBadPlusOne = (e) => {
        e.stopPropagation();
        const newVal = Math.min(cycleOutput, (productionInputs.bad || 0) + 1);
        setProductionInputs(prev => ({ ...prev, bad: newVal, good: Math.max(0, cycleOutput - newVal) }));
    };
    const handleBadMinusOne = (e) => {
        e.stopPropagation();
        const newVal = Math.max(0, (productionInputs.bad || 0) - 1);
        setProductionInputs(prev => ({ ...prev, bad: newVal, good: Math.max(0, cycleOutput - newVal) }));
    };

    // ── Reject Modal ──────────────────────────────────────────────────────────
    const handleCloseRejectModal = () => setShowRejectModal(false);

    const handleConfirmReject = async () => {
        if (!rejectRemark.trim()) { toast.warn("Please enter a rejection reason"); return; }
        setIsActionLoading(true);
        try {
            const operatorName = selectedOperator || 'QC';
            const result = await dispatch(processSampleActionApi({
                shopfloor_job_id: job._id,
                group_id: groupId,
                action: 'reject',
                reject_reason: rejectRemark.trim(),
                action_by: job.created_by || 'QC',
                action_by_name: operatorName
            })).unwrap();

            if (result?.success) {
                setLocalLogs(prev => [{ action: `X SAMPLE REJECTED BY QC — REASON: ${rejectRemark.trim().toUpperCase()}`, timestamp: new Date().toISOString(), activity_type: 'sampling', groupId }, ...prev]);
                const issuedGood = runningCycles[groupId].issuedGood || 0;
                setQuantities(prev => ({ ...prev, [groupId]: { ...prev[groupId], sample_good: Math.max(0, (prev[groupId]?.sample_good || 0) - issuedGood), sample_reject: (prev[groupId]?.sample_reject || 0) + issuedGood } }));
                setRunningCycles(prev => ({ ...prev, [groupId]: { ...prev[groupId], issuedGood: 0, issuedBad: (prev[groupId].issuedBad || 0) + issuedGood } }));

                let list = [];
                if (result.flow?.session_state?.sample_cycles) {
                    list = result.flow.session_state.sample_cycles;
                } else if (result.flow?.sample_cycles) {
                    list = result.flow.sample_cycles;
                } else {
                    list = [...(sampleCycles || [])];
                    if (list.length > 0) {
                        const lastIdx = list.length - 1;
                        list[lastIdx] = { ...list[lastIdx], status: 'Rejected', reject_reason: rejectRemark.trim(), action_at: new Date().toISOString() };
                    }
                }
                setSampleCycles(prev => ({ ...prev, [groupId]: list }));
                setShowRejectModal(false);
                setRejectRemark('');
                toast.error("Sample Rejected with remark.");
            } else {
                toast.error(result?.message || "Failed to reject sample");
            }
        } catch (err) {
            console.error("Reject Sample Error:", err);
            toast.error(err?.message || "Error rejecting sample");
        } finally {
            setIsActionLoading(false);
        }
    };

    // ── Setup Modal ───────────────────────────────────────────────────────────
    const handleCloseSetupModal = () => setShowSetupModal(false);

    const handleStartProduction = () => {
        const upsToUse = effectivePrimaryUps;
        setRunningCycles(prev => ({ ...prev, [groupId]: { ...prev[groupId], status: 'PRODUCTION_RUNNING', startTime: Date.now(), ups: upsToUse, operator: selectedOperator, heads: 1, cyclesDone: prev[groupId]?.cyclesDone || 0 } }));
        setShowSetupModal(false);
        setPrimaryCycles(prev => {
            const opUser = users.find(u => (u.name || u.username) === selectedOperator);
            return { ...prev, [groupId]: [...(prev[groupId] || []), { cycle_number: (prev[groupId] || []).length + 1, start_time: new Date().toISOString(), end_time: '', started_by: opUser?._id || opUser?.id || null, started_by_name: selectedOperator || 'N/A', ups: upsToUse, good_qty: 0, bad_qty: 0, duration: '', status: 'Running' }] };
        });
    };


    // Calculate next cycle expected pieces for inward blocking
    const upcomingCycleIndex = completedCount + 1;
    const upcomingCycleUps = currentUps;

    let upcomingPhysicalOutput = upcomingCycleUps;
    if (isUv && !isSheetTarget && upcomingCycleIndex === 1) {
        upcomingPhysicalOutput = Math.max(0, upcomingCycleUps - totalSample);
    }

    const actualPendingQty = Math.max(0, targetQty - totalGoodHandedOver - cumulativeReassembles);
    const nextCyclePcs = Math.min(upcomingPhysicalOutput, actualPendingQty);

    // Dynamically calculate inward units in real-time to avoid stale session state pollution
    const isCuttingProcessItself = cuttingIndex !== -1 && currentProcessIndex === cuttingIndex;
    const totalInwardedUnits = (!isSheetTarget || isCuttingProcessItself) ? (inwardedGoodCount * upsVal) : inwardedGoodCount;

    const getLogGoodQty = (log) => {
        if (typeof log.good_qty === 'number') return log.good_qty;
        if (typeof log.details?.good_qty === 'number') return log.details.good_qty;
        return 0;
    };

    const allLogs = [...(mg?.process_history || []), ...localLogs.filter(l => !l.groupId || l.groupId === groupId)];
    const uniqueLogs = allLogs
        .filter((log, index, self) =>
            index === self.findIndex((t) => (
                t.action === log.action && t.timestamp === log.timestamp
            ))
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate pieces cut in the current session that have not been handed over yet (only when cycle is completed but handover is pending)
    const inSessionActiveCut = (running?.status === 'PRODUCTION_COMPLETED') ? cycleOutput : 0;

    // Total pieces cut = already handed over + rejected + currently cut in session but not handed over yet
    const totalPiecesCut = totalGoodHandedOver + totalRejected + inSessionActiveCut;

    const currentAvailableInward = Math.max(0, totalInwardedUnits - totalPiecesCut);

    const isInwardBlocked = !isInHouseJob && !isCompleted && currentAvailableInward < nextCyclePcs && nextCyclePcs > 0;
    const isJobCompleted = (isAllCyclesDone && (totalGoodHandedOver) >= targetQty && (q?.reject || 0) === 0 && (q?.recut_not_inwarded || 0) === 0 && (q?.recut_received || 0) === 0) || job?.status === 'Completed';

    const handleShiftHandover = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const nextShift = currentShift === '1' ? '2' : currentShift === '2' ? '3' : '1';

        if (isRunning || isPaused) {
            handleStopSession();
        }

        const operatorName = selectedOperator || running?.operator || 'Unknown Operator';
        const shiftUps = running?.ups || currentUps;

        const sortedLogs = [...uniqueLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastHandoverLog = sortedLogs.find(log => {
            let details = log.details || {};
            if (typeof details.remarks === 'string') {
                try {
                    const parsed = JSON.parse(details.remarks);
                    if (parsed.is_shift_handover) return true;
                } catch (e) { /* ignore */ }
            }
            return details.is_shift_handover === true;
        });
        let unclassified = 0;
        if (running?.status === 'PRODUCTION_COMPLETED' || running?.status === 'RECUT_COMPLETED') {
            unclassified = Math.max(0, cycleOutput - ((productionInputs?.good || 0) + (productionInputs?.bad || 0)));
        }

        const cumulativeGood = totalGoodHandedOver + (productionInputs?.good || 0) + unclassified;
        const cumulativeBad = totalRejected + (productionInputs?.bad || 0);
        const cumulativeCycles = (running?.cyclesDone || 0) + (q?.sample_cycles || 0);

        const prevGood = lastHandoverLog?.details?.cumulative_good || 0;
        const prevBad = lastHandoverLog?.details?.cumulative_bad || 0;
        const prevCycles = lastHandoverLog?.details?.cumulative_cycles || 0;

        const issuedPcs = Math.max(0, cumulativeGood - prevGood);
        const rejectedPcs = Math.max(0, cumulativeBad - prevBad);
        const shiftCyclesCount = Math.max(0, cumulativeCycles - prevCycles);

        const shiftDetails = {
            is_shift_handover: true,
            current_shift: currentShift,
            next_shift: nextShift,
            shift_ups: shiftUps,
            shift_cycles: shiftCyclesCount,
            issued_pcs: issuedPcs,
            rejected_pcs: rejectedPcs,
            cumulative_good: cumulativeGood,
            cumulative_bad: cumulativeBad,
            cumulative_cycles: cumulativeCycles
        };

        const newLog = {
            action: `${getShiftLabel(currentShift)} — COMPLETED`,
            timestamp: new Date().toISOString(),
            activity_type: 'production',
            groupId,
            operator: operatorName,
            details: {
                ...shiftDetails,
                remarks: JSON.stringify(shiftDetails)
            }
        };

        setActiveShiftOverride(nextShift);
        setShowShiftAcknowledge(true);
        setAcknowledgedShift({
            next: nextShift,
            completed: issuedPcs,
            rejected: rejectedPcs,
            operator: operatorName
        });
        setLocalLogs(prev => [newLog, ...prev]);
        if (triggerImmediateSync) {
            triggerImmediateSync(groupId, {
                localLogs: [newLog, ...localLogs.filter(l => l.groupId === groupId)]
            });
        }

        // Dispatch backend update to permanently shift it
        dispatch(updateShopFloorJobStatus({
            id: job._id,
            payload: {
                material_group_id: groupId,
                group_shift: Number(nextShift),
                remark: `Handed over to Shift ${nextShift}`
            }
        })).then(() => {
            toast.success(`Handed over to Shift ${nextShift}`);
        }).catch(() => {
            toast.error("Failed to update shift on server");
        });
    };

    return (
        <div className="flex flex-col xl:flex-row gap-3 p-3 w-full min-h-0 xl:h-full animate-in fade-in duration-700">
            {/* Left Panel: Digital Stopwatch & Cycle Controls */}
            <aside className={`relative w-full xl:w-72 xl:h-full bg-gradient-to-b ${theme.bg} rounded-[2rem] p-5 text-white flex flex-col shadow-2xl ${theme.shadow} shrink-0 xl:overflow-y-auto custom-sidebar-scroll`}>

                {showPauseMenu && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-[13px] font-black text-white flex items-center gap-2 tracking-[0.1em] uppercase">
                                <span className="font-bold flex gap-0.5 opacity-80 text-[10px]"><span>I</span><span>I</span></span> WHY PAUSING?
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 relative z-10">
                            {['MATERIAL ISSUE', 'MACHINE BREAKDOWN', 'OPERATOR BREAK', 'POWER FAILURE', 'MEDIA CHANGE'].map(reason => (
                                <button
                                    key={reason}
                                    onClick={() => handlePauseReason(reason)}
                                    className="w-full py-3.5 bg-[#1e293b] hover:bg-slate-700 border border-white/5 hover:border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 flex flex-col gap-2 relative z-10">
                            <button
                                onClick={handleCancelPause}
                                className="w-full py-3 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                            >
                                CANCEL
                            </button>
                        </div>
                        {/* Dark gradient for the bottom part to mimic screenshot */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070b14] to-transparent pointer-events-none"></div>
                    </div>
                )}
                {isJobCompleted ? (
                    <div className="flex flex-col items-center text-center mb-6 shrink-0 w-full">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/40"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 italic">{getShiftLabel(currentShift)}</span>
                        </div>
                        <div className="w-full py-4.5 bg-emerald-400 text-slate-900 rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 mb-6 select-none font-bold">
                            ✓ JOB COMPLETE
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex flex-col gap-4 text-left">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">TIME TAKEN</span>
                                <span className="text-emerald-400 text-[10px] font-bold">▲</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">TOTAL TIME</span>
                                <span className="text-[13px] font-black text-emerald-400 font-mono">{formatTimeHHMMSS(timers.overall)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">OPERATOR</span>
                                <span className="text-[12px] font-black text-emerald-400 uppercase italic">{running?.operator || 'N/A'}</span>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">SAMPLE CYCLES</span>
                                    <span className="text-[11px] font-black text-white/80 uppercase">
                                        {q?.sample_cycles || 0} CYC ({formatTimeHHMMSS(timers.sample)})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">PRIMARY CYCLES</span>
                                    <span className="text-[11px] font-black text-white/80 uppercase">
                                        {completedCount} CYC ({formatTimeHHMMSS(timers.primary)})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center mb-4 shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400 animate-pulse' : 'bg-white/40'}`}></div>
                            {isPaused ? (
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-amber-400">
                                    ⏸ PAUSED: {running?.pauseReason || 'Unknown'}
                                </span>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 italic">
                                    {getShiftLabel(currentShift)} — {running?.heads || 1} HEAD — {isRunning ? 'RUNNING' : 'IDLE'}
                                </span>
                            )}
                        </div>

                        <div className="text-6xl font-black tracking-tighter mb-2 font-mono leading-none">
                            {formatTimeHHMMSS(timers.primary)}
                        </div>
                        <div className="flex flex-col items-center opacity-60">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1b2]">
                                TOTAL TIME ELAPSED
                            </span>
                            {(!isRunning && !effectiveIsUpsConfirmed) && <span className="text-[9px] font-black uppercase tracking-widest mt-1 italic">Confirm pcs/cycle first</span>}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col gap-4">
                    {isJobCompleted ? (
                        <div className="bg-emerald-500/10 rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 mt-auto mb-auto animate-in fade-in zoom-in-95 duration-500">
                            {/* <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 shadow-xl shadow-emerald-500/20">
                                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-400">JOB FULLY COMPLETED</h4>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Handover Successful</span>
                            </div>
                            <p className="text-[10px] font-black text-white/50 leading-relaxed uppercase italic">
                                Primary production is finished and all completed pieces have been handed over to stores. No further actions are required.
                            </p> */}

                            {/* Initial Setup Details */}
                            {(running?.operator || running?.heads) && (
                                <div className="w-full bg-[#0f172a]/40 rounded-xl p-3 border border-emerald-500/20 flex flex-col gap-2 shadow-inner text-left">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1b2] mb-1 flex items-center gap-2">
                                        <Settings2 className="w-3.5 h-3.5 text-[#00d1b2]" />
                                        Initial Run Setup
                                    </span>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-white/80">
                                        <div className="flex flex-col bg-white/5 p-2 rounded-lg border border-white/5">
                                            <span className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">Operator</span>
                                            <span className="truncate italic">{running?.operator || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col bg-white/5 p-2 rounded-lg border border-white/5">
                                            <span className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">Heads</span>
                                            <span>{running?.heads ? `${running.heads} Head${running.heads > 1 ? 's' : ''}` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="w-full bg-[#0f172a]/40 rounded-xl p-3 border border-emerald-500/20 flex flex-col gap-2 shadow-inner text-left">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1b2] mb-1 flex items-center gap-2">
                                    <ListChecks className="w-3.5 h-3.5" />
                                    Cycle Breakdown
                                </span>
                                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-sidebar-scroll pr-1 w-full">
                                    {(() => {
                                        const sList = sampleCycles || [];
                                        const pList = (primaryCycles || []).filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);
                                        const rList = (q?.selected_recut_option || []).flatMap(opt => (opt.cycles || []).map(c => ({ ...c, recutType: opt.type }))).filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);

                                        return (
                                            <>
                                                {(q?.sample_cycles || 0) > 0 && (
                                                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                                        <span className="text-white/70 italic">Sample ({q.sample_cycles} cycle{q.sample_cycles > 1 ? 's' : ''})</span>
                                                        <div className="flex gap-3 text-[11px] tracking-tighter">
                                                            <span className="text-emerald-400">{q.sample_good || 0}G</span>
                                                            {(q.sample_reject || 0) > 0 ? <span className="text-amber-500">{q.sample_reject}R</span> : <span className="text-amber-500/30">0R</span>}
                                                            <span className="text-white/20">|</span>
                                                            <span className="text-white/90 w-8 text-right">{(q.sample_good || 0) + (q.sample_reject || 0)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {pList.map((cycle, idx) => (
                                                    <div key={`primary-${idx}`} className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                                        <span className="text-white/70 italic">Cycle {cycle.cycle_number}</span>
                                                        <div className="flex gap-3 text-[11px] tracking-tighter">
                                                            <span className="text-emerald-400">{cycle.good_qty || 0}G</span>
                                                            {(cycle.bad_qty || 0) > 0 ? <span className="text-amber-500">{cycle.bad_qty}R</span> : <span className="text-amber-500/30">0R</span>}
                                                            <span className="text-white/20">|</span>
                                                            <span className="text-white/90 w-8 text-right">{(cycle.good_qty || 0) + (cycle.bad_qty || 0)}</span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {rList.map((cycle, idx) => (
                                                    <div key={`recut-${idx}`} className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                                        <span className="text-white/70 italic">Reassemble {cycle.cycle_number} <span className="text-[8px] opacity-50 uppercase">({cycle.recutType})</span></span>
                                                        <div className="flex gap-3 text-[11px] tracking-tighter">
                                                            <span className="text-emerald-400">{cycle.good_qty || 0}G</span>
                                                            {(cycle.bad_qty || 0) > 0 ? <span className="text-amber-500">{cycle.bad_qty}R</span> : <span className="text-amber-500/30">0R</span>}
                                                            <span className="text-white/20">|</span>
                                                            <span className="text-white/90 w-8 text-right">{(cycle.good_qty || 0) + (cycle.bad_qty || 0)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (isSamplingView && !activePrimaryUnlocked) ? (
                        <>
                            <div className="flex items-center justify-center gap-2 py-3 border-y border-white/10">
                                <Microscope className="w-4 h-4 opacity-80" />
                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme.accent} italic`}>SAMPLE CYCLE</span>
                            </div>

                            <div className="bg-white/10 rounded-[1.5rem] p-4 border border-white/20 backdrop-blur-md">
                                {runningCycles[groupId]?.status === 'RUNNING' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-5xl font-black text-[#fbbf24] tracking-tighter font-mono">
                                            {formatTime(timers.sample)}
                                        </div>
                                        <div className="flex flex-col items-center opacity-60">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                {runningCycles[groupId].ups} UPS — {runningCycles[groupId].cyclesDone || 0} cycles done
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleSampleCycleDone}
                                            className="w-full py-5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex flex-col items-center justify-center shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>CYCLE DONE</span>
                                            </div>
                                            <span className="text-[9px] opacity-70">({runningCycles[groupId].ups} PCS READY)</span>
                                        </button>
                                    </div>
                                ) : runningCycles[groupId]?.status === 'COMPLETED' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-5xl font-black text-[#fbbf24] opacity-50 tracking-tighter font-mono">
                                            {formatTime(timers.sample)}
                                        </div>
                                        <div className="flex flex-col items-center opacity-60">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1">
                                                <Microscope className="w-2.5 h-2.5" />
                                                {runningCycles[groupId].ups} UPS - {runningCycles[groupId].cyclesDone} cycle done
                                            </span>
                                        </div>

                                        <div className="w-full flex flex-col gap-2">
                                            <button className="w-full py-5 bg-white/5 text-white/40 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 cursor-default border border-white/5">
                                                SEE CENTRE PANEL ↓
                                            </button>
                                            {/* <button
                                                onClick={handleAnotherSampleCycle}
                                                className="w-full py-4 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 border border-emerald-500/30 transition-all"
                                            >
                                                + ANOTHER SAMPLE CYCLE
                                            </button> */}
                                        </div>
                                    </div>
                                ) : (!isSampleApprovedBySales && !isSampleRejectedInternal && ((runningCycles[groupId]?.status === 'WAITING_APPROVAL' && (runningCycles[groupId]?.issuedGood || 0) > 0) || isSampleAwaitingApproval)) ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full py-5 bg-[#2d76a0]/80 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex flex-col items-center justify-center shadow-lg shadow-blue-900/40 border border-white/10 transition-all">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm">⌛</span>
                                                <span className="text-white font-black tracking-widest">AWAITING APPROVAL</span>
                                            </div>
                                            <span className="text-[9px] opacity-70 uppercase italic tracking-wider">
                                                {runningCycles[groupId]?.cyclesDone || (rawSampleList || []).length || 1} cycle - {runningCycles[groupId]?.issuedGood || q?.sample_good || 1} pcs - See centre panel ↓
                                            </span>
                                        </div>
                                    </div>
                                ) : (!hasUnprocessedInwardedSample && (running?.status === 'WAITING_UPSTREAM' || runningCycles[groupId]?.status === 'WAITING_UPSTREAM')) ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full py-5 bg-amber-600/90 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex flex-col items-center justify-center shadow-lg shadow-amber-900/40 border border-white/10 transition-all">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm">⌛</span>
                                                <span className="text-white font-black tracking-widest">WAITING FOR LASER SAMPLE</span>
                                            </div>
                                            <span className="text-[9px] opacity-70 uppercase italic tracking-wider text-center px-2">
                                                Sample damaged downstream. Laser operator must cut new sample piece first.
                                            </span>
                                        </div>
                                    </div>
                                ) : (runningCycles[groupId]?.status === 'APPROVED' || running?.status === 'APPROVED' || isSampleApprovedBySales) ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full py-5 bg-[#00d1b2] text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex flex-col items-center justify-center shadow-lg shadow-teal-500/30 transition-all">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>SALES APPROVED</span>
                                            </div>
                                            <span className="text-[9px] opacity-70 uppercase italic tracking-wider">
                                                {runningCycles[groupId].cyclesDone} cycle · {runningCycles[groupId].issuedGood} pcs · See centre panel ↓
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 block mb-4 text-center italic">NO. OF UPS FOR SAMPLE</span>
                                        <div className="relative mb-4">
                                            <input
                                                disabled={isSessionStopped}
                                                type="number"
                                                min="1"
                                                placeholder="e.g. 1"
                                                value={sampleUps[groupId] || ''}
                                                onChange={(e) => {
                                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                                    setSampleUps(prev => ({ ...prev, [groupId]: val.toString() }));
                                                }}
                                                className="w-full bg-white rounded-xl py-4 text-3xl font-black text-slate-800 text-center outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all placeholder:text-slate-200"
                                            />
                                        </div>
                                        <button
                                            onClick={handleStartSample}
                                            disabled={!(sampleUps[groupId] || '').trim()}
                                            className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-2 ${!(sampleUps[groupId] || '').trim() ? 'bg-emerald-500 text-black cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-black'}`}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            START SAMPLE {runningCycles[groupId]?.is_rerun || q?.bom_sample_status === 'SAMPLE_REJECTED_INTERNAL' ? 'RERUN ' : ''}({sampleUps[groupId] || '?'} UPS)
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (selectedReassembleOption?.isReassemblemethodstarted) ? (
                        <>
                            <div className="flex items-center justify-center gap-2 py-3 border-y border-white/10">
                                <span className="text-purple-400 text-xs">⚡</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 italic">{isUv ? 'REPRINT CYCLE' : 'REASSEMBLE CYCLE'}</span>
                            </div>

                            <div className="bg-white/10 rounded-[1.5rem] p-4 border border-white/20 backdrop-blur-md mt-4">
                                {runningCycles[groupId]?.status === 'RECUT_RUNNING' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-5xl font-black text-purple-400 tracking-tighter font-mono">
                                            {formatTime(timers.recut || 0)}
                                        </div>
                                        <div className="flex flex-col items-center opacity-60">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                Cycle {(selectedReassembleOption.cycles || []).length} — {runningCycles[groupId].ups} UPS
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleReassembleCycleDone}
                                            className="w-full py-5 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>CYCLE DONE</span>
                                        </button>
                                    </div>
                                ) : runningCycles[groupId]?.status === 'RECUT_COMPLETED' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-5xl font-black text-purple-400 opacity-50 tracking-tighter font-mono">
                                            {formatTime(timers.recut || 0)}
                                        </div>
                                        <div className="flex flex-col items-center opacity-60">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1">
                                                ⚡ {runningCycles[groupId].ups} PCS READY · COMPLETE
                                            </span>
                                        </div>
                                        <button className="w-full py-5 bg-white/5 text-white/40 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 cursor-default border border-white/5">
                                            SEE CENTRE PANEL ↓
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 block mb-4 text-center italic text-purple-400">{isUv ? 'NO. OF UPS FOR REPRINT' : 'NO. OF UPS FOR REASSEMBLE'}</span>
                                        <div className="relative mb-4">
                                            <input
                                                disabled={isSessionStopped}
                                                type="number"
                                                min="1"
                                                placeholder="e.g. 1"
                                                value={recutUpsVal || ''}
                                                onChange={(e) => {
                                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                                    setReassembleUpsVal(val);
                                                }}
                                                className="w-full bg-white rounded-xl py-4 text-3xl font-black text-slate-800 text-center outline-none focus:ring-4 focus:ring-purple-500/30 transition-all placeholder:text-slate-200"
                                            />
                                        </div>

                                        <div className="text-[9px] text-center font-bold text-purple-200/80 uppercase tracking-widest mb-4 leading-relaxed">
                                            Requires <span className="text-white font-black text-[11px]">{Math.ceil((selectedReassembleOption?.qty || 1) / (recutUpsVal || 1))} cycle{Math.ceil((selectedReassembleOption?.qty || 1) / (recutUpsVal || 1)) !== 1 ? 's' : ''}</span> to complete {selectedReassembleOption?.qty || 1} {isUv ? 'reprint pcs' : 'recut pcs'}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleStartReassembleCycle(e);
                                            }}
                                            disabled={!recutUpsVal}
                                            className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-2 ${!recutUpsVal ? 'bg-purple-600/50 text-white cursor-not-allowed shadow-none' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-500/20 active:scale-95'}`}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            {isUv ? 'START REPRINT CYCLE' : 'START REASSEMBLE CYCLE'} {(selectedReassembleOption?.cycles?.length || 0) + 1} ({recutUpsVal || '?'} UPS)
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {activePrimaryUnlocked && (
                                <div className="flex flex-col gap-2 mb-4">
                                    {/* Compact Pill 1: Status */}
                                    <div className="bg-emerald-500 rounded-2xl p-4 shadow-lg shadow-emerald-900/40 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-white uppercase tracking-widest leading-none mb-1">SAMPLE APPROVED</span>
                                            <span className="text-[10px] font-bold text-white/70 uppercase italic tracking-wider">
                                                {q.sample_cycles || 1} cycles · {q.sample_good || 0} Good · {q.sample_reject || 0} Reject
                                            </span>
                                        </div>
                                    </div>

                                    {/* Compact Pill 2: Summary Stats */}
                                    <div className="bg-emerald-900/40 rounded-2xl p-4 border border-emerald-500/30 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">SAMPLING</span>
                                            </div>
                                            <span className="text-[12px] font-black text-white uppercase tracking-widest">CYCLE</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-sm font-black text-white leading-none">
                                                {q.sample_cycles || 1} CYC · {q.sample_good || 0}G · {q.sample_reject || 0}R
                                            </span>
                                            <span className="text-[9px] font-black text-emerald-400/60 uppercase italic tracking-tighter mt-1 italic">Quality Summary</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white/10 rounded-[2rem] p-4 border border-white/20 backdrop-blur-md flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-orange-400 text-xs">⚡</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1b2] italic">PRIMARY CYCLE</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white/50 tracking-tighter">
                                        {`${primaryCyclesDoneCount}/${totalExpectedCycles || '?'}`}
                                    </span>
                                </div>

                                {effectiveIsUpsConfirmed ? (
                                    <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                                        {/* Confirmed Pill */}
                                        <div className="bg-[#00d1b2] rounded-xl p-3 flex items-center justify-between shadow-lg shadow-teal-500/20">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-slate-900" />
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                    {isSheetTarget ? `${primaryUps} SHEET${(parseInt(primaryUps) || 1) > 1 ? 'S' : ''}` : `${primaryUps || currentUps} PCS`}/cycle
                                                </span>
                                            </div>
                                            {!isAllCyclesDone && !isSessionStopped && (
                                                <button
                                                    onClick={handleEditUps}
                                                    className="p-1 hover:bg-black/10 rounded-md transition-all text-slate-900"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Piece Breakdown Note or Cycle History */}
                                        {(isAllCyclesDone && !isCompleted) ? (
                                            <div className="flex flex-col gap-2">
                                                {/* Initial Setup Details */}
                                                {(running?.operator || running?.heads) && (
                                                    <div className="bg-[#0f172a]/40 rounded-xl p-3 border border-[#00d1b2]/20 flex flex-col gap-2 shadow-inner">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1b2] mb-1 flex items-center gap-2">
                                                            <Settings2 className="w-3.5 h-3.5 text-[#00d1b2]" />
                                                            Initial Run Setup
                                                        </span>
                                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-white/80">
                                                            <div className="flex flex-col bg-white/5 p-2 rounded-lg border border-white/5">
                                                                <span className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">Operator</span>
                                                                <span className="truncate italic">{running?.operator || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex flex-col bg-white/5 p-2 rounded-lg border border-white/5">
                                                                <span className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">Heads</span>
                                                                <span>{running?.heads ? `${running.heads} Head${running.heads > 1 ? 's' : ''}` : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-[#0f172a]/40 rounded-xl p-3 border border-[#00d1b2]/20 flex flex-col gap-2 shadow-inner">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00d1b2] mb-1 flex items-center gap-2">
                                                        <ListChecks className="w-3.5 h-3.5" />
                                                        Cycle Breakdown
                                                    </span>
                                                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-sidebar-scroll pr-1">
                                                        {(() => {
                                                            const sList = sampleCycles || [];
                                                            const pList = (primaryCycles || []).filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);
                                                            const rList = (q?.selected_recut_option || []).flatMap(opt => (opt.cycles || []).map(c => ({ ...c, recutType: opt.type }))).filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);

                                                            return (
                                                                <>
                                                                    {(q?.sample_cycles || 0) > 0 && (
                                                                        <div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                                                            <span className="text-white/70 italic">Sample ({q.sample_cycles} cycle{q.sample_cycles > 1 ? 's' : ''})</span>
                                                                            <div className="flex gap-3 text-[11px] tracking-tighter">
                                                                                <span className="text-emerald-400">{q.sample_good || 0}G</span>
                                                                                {(q.sample_reject || 0) > 0 ? <span className="text-amber-500">{q.sample_reject}R</span> : <span className="text-amber-500/30">0R</span>}
                                                                                <span className="text-white/20">|</span>
                                                                                <span className="text-white/90 w-8 text-right">{(q.sample_good || 0) + (q.sample_reject || 0)}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {pList.map((cycle, idx) => (
                                                                        <div key={`primary-${idx}`} className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                                                            <span className="text-white/70 italic">Cycle {cycle.cycle_number}</span>
                                                                            <div className="flex gap-3 text-[11px] tracking-tighter">
                                                                                <span className="text-emerald-400">{cycle.good_qty || 0}G</span>
                                                                                {(cycle.bad_qty || 0) > 0 ? <span className="text-amber-500">{cycle.bad_qty}R</span> : <span className="text-amber-500/30">0R</span>}
                                                                                <span className="text-white/20">|</span>
                                                                                <span className="text-white/90 w-8 text-right">{(cycle.good_qty || 0) + (cycle.bad_qty || 0)}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {rList.map((cycle, idx) => (
                                                                        <div key={`recut-${idx}`} className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                                                            <span className="text-white/70 italic">Reassemble {cycle.cycle_number} <span className="text-[8px] opacity-50 uppercase">({cycle.recutType})</span></span>
                                                                            <div className="flex gap-3 text-[11px] tracking-tighter">
                                                                                <span className="text-emerald-400">{cycle.good_qty || 0}G</span>
                                                                                {(cycle.bad_qty || 0) > 0 ? <span className="text-amber-500">{cycle.bad_qty}R</span> : <span className="text-amber-500/30">0R</span>}
                                                                                <span className="text-white/20">|</span>
                                                                                <span className="text-white/90 w-8 text-right">{(cycle.good_qty || 0) + (cycle.bad_qty || 0)}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-100 rounded-xl p-2 border border-amber-200 text-amber-700 text-[9px] font-black text-center italic tracking-tight leading-tight">
                                                {isUv ? (
                                                    isSheetTarget ? (
                                                        `Each cycle prints 1 sheet`
                                                    ) : (
                                                        `Cycle 1: ${parseInt(primaryUps) || 1} pcs — Cycle 2+: ${primaryUps || 1} pcs each`
                                                    )
                                                ) : (
                                                    `Target for this cycle: ${effectivePrimaryUps} pcs`
                                                )}
                                            </div>
                                        )}

                                        {/* Progress Metrics */}
                                        <div className="flex flex-col items-center gap-1 pt-3 border-t border-white/5">
                                            <div className="text-4xl font-black text-white tracking-tighter leading-none">
                                                {primaryCyclesDoneCount}
                                                <span className="text-sm opacity-40 ml-1">
                                                    / {totalExpectedCycles}
                                                </span>
                                            </div>
                                            <div className="w-full h-1 bg-white/10 rounded-full mt-1 relative overflow-hidden">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-[#00d1b2] transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (primaryCyclesDoneCount / (totalExpectedCycles || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                                                    {Math.round(Math.min(100, (primaryCyclesDoneCount / (totalExpectedCycles || 1)) * 100))}% DONE
                                                </span>
                                                {runningCycles[groupId]?.status === 'PRODUCTION_RUNNING' && (
                                                    <div className="text-xs font-black text-[#00d1b2] font-mono animate-pulse mt-1">
                                                        {formatTime(Math.floor((Date.now() - runningCycles[groupId].startTime) / 1000))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00d1b2] italic">UPS / CYCLE</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={primaryUps}
                                                onChange={(e) => {
                                                    setPrimaryUps(e.target.value);
                                                    setIsUpsConfirmed(false);
                                                }}
                                                placeholder={`e.g. ${firstMaterial?.material_input?.ups || 80}`}
                                                className="w-full bg-slate-100 rounded-2xl py-6 text-4xl font-black text-slate-600 text-center outline-none focus:ring-4 focus:ring-[#00d1b2]/10 transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                }}
                                            />
                                        </div>

                                        {primaryUps && !effectiveIsUpsConfirmed && (
                                            <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
                                                <div className="bg-amber-100 rounded-xl p-3 border border-amber-100/30 text-amber-500 text-[10px] font-bold">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span>Target Output: {isSheetTarget ? `${targetQty} sheets` : `${inHouseTargetQty} pcs`}</span>
                                                        <span className="opacity-70">{totalExpectedCycles} Cycles total</span>
                                                    </div>
                                                    {!isSheetTarget && !isUv && ((q.sample_good || 0) + (q.sample_reject || 0)) > 0 && (
                                                        <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-amber-500/20">
                                                            <div className="flex justify-between">
                                                                <span>Cycle 1 (Sheet 1):</span>
                                                                <span>{parseInt(primaryUps) - ((q.sample_good || 0) + (q.sample_reject || 0))} pcs</span>
                                                            </div>
                                                            <div className="flex justify-between opacity-70">
                                                                <span>Sample Deducted:</span>
                                                                <span>-{(q.sample_good || 0) + (q.sample_reject || 0)} pcs</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Cycle 2 onwards:</span>
                                                                <span>{primaryUps} pcs each</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!isSheetTarget && isSheetMaterial && (
                                                        <div className="mt-1 pt-1 border-t border-amber-500/20 flex justify-between items-center text-amber-600">
                                                            <span>Sheets per cycle: {Math.ceil(parseFloat(primaryUps) / (firstMaterial?.material_input?.ups || mg.ups || 1))} sheet{Math.ceil(parseFloat(primaryUps) / (firstMaterial?.material_input?.ups || mg.ups || 1)) > 1 ? 's' : ''}</span>
                                                            {(parseFloat(primaryUps) < (firstMaterial?.material_input?.ups || mg.ups || 1)) && (
                                                                <span className="text-rose-400 text-[8px] animate-pulse">! MUST BE &ge; {(firstMaterial?.material_input?.ups || mg.ups || 1)}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {isInwardBlocked && (
                                                    <div className="bg-amber-100 border border-amber-100 rounded-2xl p-4 flex flex-col items-center text-center gap-2 animate-pulse mt-1 mb-2">
                                                        <div className="flex items-center gap-2 text-amber-500">
                                                            <AlertTriangle className="w-5 h-5" />
                                                            <span className="text-xs font-black uppercase tracking-widest">Cycle Blocked</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-800 leading-tight uppercase italic">
                                                            Balance material not inwarded yet.<br />
                                                            Please inward {nextCyclePcs - currentAvailableInward} more {isSheetTarget ? 'sheets' : 'pcs'} to start Cycle {(runningCycles[groupId]?.cyclesDone || 0) + 1}.
                                                        </p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleConfirmUps}
                                                    disabled={isInwardBlocked}
                                                    className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isInwardBlocked ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'}`}
                                                >
                                                    ✓ CONFIRM & RUN {totalExpectedCycles} CYCLES
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {(totalRejected > 0 && isAllCyclesDone) && (
                                <div className="bg-purple-500/20 rounded-[1.25rem] p-4 border border-purple-500/30 flex flex-col gap-2 mt-2 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-purple-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                            <span className="text-[10px] font-black uppercase tracking-widest">COMPLETION CYCLE</span>
                                        </div>
                                        <span className="text-xs font-black text-white">{totalRejected} pcs</span>
                                    </div>
                                    <span className="text-[9px] font-black tracking-wide text-purple-400/80 leading-tight">
                                        Tap Rejected in centre, Submit EMR, then Confirm receipt
                                    </span>
                                </div>
                            )}

                            {effectiveIsUpsConfirmed && (
                                <div className="mt-2 flex flex-col gap-2">
                                    {isRunning ? (
                                        <button
                                            onClick={handleCycleDone}
                                            className="w-full py-5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-[1.5rem] text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 transition-all active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            CYCLE DONE
                                        </button>
                                    ) : isPaused ? (
                                        <button
                                            onClick={handleResumeCycle}
                                            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            RESUME CYCLE
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {(isAllCyclesDone && !isCompleted) ? (
                                                <div className="bg-emerald-500/20 rounded-[1.5rem] p-5 flex flex-col items-center text-center gap-2 border border-emerald-500/30 animate-in fade-in duration-500">
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        <span className="text-sm font-black uppercase tracking-widest">All Cycles Complete</span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-emerald-400/60 leading-tight uppercase italic">
                                                        Primary production finished.<br />
                                                        {totalRejected > 0 ? "Please proceed with recuts." : "Job is fully completed."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    {(() => {
                                                        if (isInwardBlocked) {
                                                            return (
                                                                <div className="bg-amber-100 border border-amber-100 rounded-2xl p-4 flex flex-col items-center text-center gap-2 animate-pulse">
                                                                    <div className="flex items-center gap-2 text-amber-500">
                                                                        <AlertTriangle className="w-5 h-5" />
                                                                        <span className="text-xs font-black uppercase tracking-widest">Cycle Blocked</span>
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-slate-800 leading-tight uppercase italic">
                                                                        Balance material not inwarded yet.<br />
                                                                        Please inward {nextCyclePcs - currentAvailableInward} more {isSheetTarget ? 'sheets' : 'pcs'} to start Cycle {primaryCyclesDoneCount + 1}.
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleStartCycle(e);
                                                        }}
                                                        disabled={isSessionStopped || isInwardBlocked || isCompleted}
                                                        className={`w-full py-5 rounded-[1.5rem] text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${(isSessionStopped || isInwardBlocked || isCompleted) ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed shadow-none' : 'bg-[#00d1b2] hover:bg-[#00c4a7] text-slate-900 shadow-teal-500/20'
                                                            }`}
                                                    >
                                                        <Play className="w-5 h-5 fill-current" />
                                                        {isCompleted ? 'HANDOVER TO START' : `START CYCLE ${primaryCyclesDoneCount + 1}`}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </>
                    )}

                    {/* Unified Session Controls at the bottom of the sidebar */}
                    {!isJobCompleted && mg?.status !== 'Completed' && (
                        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/10">
                            {/* START / PAUSE / STOP Controls */}
                            {(effectiveIsUpsConfirmed || selectedReassembleOption?.isReassemblemethodstarted) && (
                                <>
                                    {isSessionStopped ? (
                                        <button
                                            onClick={handleStartSession}
                                            className="w-full py-5 bg-[#00d1b2] hover:bg-[#00c4a7] text-slate-900 rounded-[1.5rem] text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 shadow-teal-500/20 font-bold"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            START
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handlePauseOrResume}
                                                disabled={!isRunning && !isPaused}
                                                className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${isRunning ? 'bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border-orange-500/30' : isPaused ? 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/30' : 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'}`}
                                            >
                                                {isPaused ? 'RESUME' : 'PAUSE'}
                                            </button>
                                            <button
                                                onClick={handleStopSession}
                                                className="w-full py-3 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-500/30 transition-all"
                                            >
                                                STOP
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                        </div>
                    )}
                </div>
            </aside>

            {/* Center & Summary Layout Wrapper */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 xl:h-full overflow-hidden">
                {/* Center Panel: Primary Workflow Area (Scrollable) */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-sidebar-scroll pr-1 transition-all duration-300">
                    {(() => {
                    const sortedUniqueLogs = [...uniqueLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    let latestHandoverLog = sortedUniqueLogs.find(log => {
                        let details = log.details || {};
                        if (typeof details.remarks === 'string') {
                            try {
                                const parsed = JSON.parse(details.remarks);
                                if (parsed.is_shift_handover) return true;
                            } catch (e) { /* ignore */ }
                        }
                        return details.is_shift_handover === true;
                    });

                    if (latestHandoverLog) {
                        let details = latestHandoverLog.details || {};
                        if (typeof details.remarks === 'string') {
                            try {
                                const parsed = JSON.parse(details.remarks);
                                if (parsed.is_shift_handover) details = { ...details, ...parsed };
                            } catch (e) { /* ignore */ }
                        }
                        latestHandoverLog = { ...latestHandoverLog, details };
                    }

                    const ackLog = sortedUniqueLogs.find(log => log.action === '✓ SHIFT ROTATION ACKNOWLEDGED');
                    const isAcknowledged = ackLog && latestHandoverLog && new Date(ackLog.timestamp).getTime() >= new Date(latestHandoverLog.timestamp).getTime();

                    const isVisible = (showShiftAcknowledge && !isAcknowledged) || (latestHandoverLog && !isAcknowledged);

                    if (!isVisible) return null;

                    const displayShift = acknowledgedShift?.next || latestHandoverLog?.details?.next_shift;
                    const displayCompleted = acknowledgedShift?.completed ?? latestHandoverLog?.details?.issued_pcs ?? 0;
                    const displayRejected = acknowledgedShift?.rejected ?? latestHandoverLog?.details?.rejected_pcs ?? 0;
                    const displayOperator = acknowledgedShift?.operator || latestHandoverLog?.operator || latestHandoverLog?.operator_name || 'N/A';

                    return (
                        <div className="bg-[#00d1b2]/10 border border-[#00d1b2]/30 rounded-[1.25rem] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg shadow-teal-500/5 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500 mr-2">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black text-[#00d1b2] tracking-widest uppercase italic leading-none">SHIFT ROTATION SUCCESSFUL</span>
                                <span className="text-[14px] font-black text-[#00d1b2] uppercase leading-none mt-0.5">Operating in {getShiftLabel(displayShift)}</span>
                                <div className="flex items-center gap-2 text-[10px] font-black text-[#00d1b2]/70 uppercase tracking-widest mt-0.5">
                                    <span><strong className="text-[#00d1b2] text-[11px]">{displayCompleted}</strong> COMPLETED</span>
                                    <span className="w-1 h-1 rounded-full bg-[#00d1b2]/30"></span>
                                    <span><strong className="text-[#00d1b2] text-[11px]">{displayRejected}</strong> REJECTED</span>
                                    <span className="w-1 h-1 rounded-full bg-[#00d1b2]/30"></span>
                                    <span>BY <strong className="text-[#00d1b2] text-[11px]">{displayOperator}</strong></span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowShiftAcknowledge(false);

                                    const ackLog = {
                                        action: `✓ SHIFT ROTATION ACKNOWLEDGED`,
                                        timestamp: new Date().toISOString(),
                                        activity_type: 'production',
                                        groupId,
                                        operator: selectedOperator || 'Unknown'
                                    };

                                    setLocalLogs(prev => [ackLog, ...prev]);
                                    if (triggerImmediateSync) {
                                        triggerImmediateSync(groupId, {
                                            localLogs: [ackLog, ...localLogs.filter(l => l.groupId === groupId)]
                                        });
                                    }
                                }}
                                className="mt-3 sm:mt-0 px-8 py-3 bg-[#00d1b2] hover:bg-[#00c4a7] text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                DONE
                            </button>
                        </div>
                    );
                })()}

                {/* Scrollable Content Area */}
                <div className={`flex-1 overflow-y-auto custom-sidebar-scroll pr-2 pb-20 xl:pb-0 ${isSessionStopped ? 'pointer-events-none opacity-30 select-none' : ''}`}>
                    <div className="flex flex-col gap-4">
                        {((q.reject || 0) > 0 || (q.sample_reject || 0) > 0 || (q.recut_not_inwarded || 0) > 0 || (q.recut_received || 0) > 0 || (q.recut_completed || 0) > 0) && (
                            <div className="bg-purple-50 rounded-[1.25rem] border border-purple-200 shadow-sm overflow-hidden mt-1 mb-2">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    {/* Left Header */}
                                    <div className="px-6 py-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-purple-200 bg-white">
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-600 font-black text-[12px] uppercase tracking-widest flex items-center gap-1.5">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                                {isUv ? 'REPRINT PENDING' : 'REASSEMBLE PENDING'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Blocks */}
                                    <div className="flex-1 grid grid-cols-4 divide-x divide-purple-100 bg-white">
                                        <div
                                            className={`px-4 py-3 flex flex-col items-center justify-center text-center transition-all ${(q.recut_not_inwarded || 0) > 0
                                                ? 'bg-amber-50'
                                                : 'bg-amber-50/20 opacity-55'
                                                }`}
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 mb-1 flex items-center gap-1">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                                NOT INWARDED
                                            </span>
                                            <span className="text-xl font-black text-amber-500 leading-none mb-1">
                                                {q.recut_not_inwarded || 0}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/60 flex items-center gap-1">
                                                {(q.recut_not_inwarded || 0) > 0 ? 'pending stores' : 'inwarded'}
                                            </span>
                                        </div>

                                        <div
                                            className={`px-4 py-3 flex flex-col items-center justify-center text-center transition-all ${(q.recut_received || 0) > 0
                                                ? 'bg-emerald-50'
                                                : 'bg-emerald-50/20 opacity-55'
                                                }`}
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                RECEIVED
                                            </span>
                                            <span className="text-xl font-black text-emerald-500 leading-none mb-1">
                                                {q.recut_received || 0}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60 flex items-center gap-1 mb-2">
                                                {(q.recut_received || 0) > 0 ? (isUv ? 'ready for reprint' : 'ready for recut') : 'waiting'}
                                            </span>
                                            {((q.recut_received || 0) > 0 && readyReassembleOptions.length > 0 && !isRunning && !isPaused && running?.status !== 'RECUT_COMPLETED') && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setShowStartReassembleSelectModal(true);
                                                    }}
                                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-1 mt-1 animate-pulse"
                                                >
                                                    <Play className="w-2.5 h-2.5 fill-current" />
                                                    <span>Start Cycle</span>
                                                </button>
                                            )}
                                        </div>

                                        <div
                                            onClick={() => {
                                                if (!isAllCyclesDone) {
                                                    toast.error(isUv ? "Primary cycles must be completed before choosing a reprint option." : "Primary cycles must be completed before choosing a reassemble option.");
                                                    return;
                                                }
                                                if (hasUnaccountedRejects) {
                                                    handleOpenReassembleModal();
                                                }
                                            }}
                                            className={`px-4 py-3 flex flex-col items-center justify-center text-center transition-all ${isAllCyclesDone && hasUnaccountedRejects
                                                ? 'bg-rose-50 hover:bg-rose-100/80 cursor-pointer active:scale-95'
                                                : 'bg-rose-50/20 opacity-55 cursor-not-allowed'
                                                }`}
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-600 mb-1 flex items-center gap-1">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                                REJECTED
                                            </span>
                                            <span className="text-xl font-black text-rose-600 leading-none mb-1">
                                                {unaccountedRejected}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-500/80 flex items-center gap-1">
                                                {!isAllCyclesDone
                                                    ? 'waiting primary'
                                                    : (hasUnaccountedRejects ? (isUv ? '👉 tap to reprint' : '👉 tap to recut') : (hasActiveEmr ? 'EMR RAISED' : 'all accounted'))}
                                            </span>
                                        </div>

                                        <div className="px-4 py-3 flex flex-col items-center justify-center text-center bg-orange-50/30">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                GOOD ISSUED
                                            </span>
                                            <span className="text-xl font-black text-orange-400 leading-none mb-1">
                                                {q.recut_completed || 0}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-orange-500/60 flex items-center gap-1">
                                                issued
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* INLINE 3-OPTION REASSEMBLE METHOD SELECTOR */}
                        {showReassembleOptionModal && (
                            <div className="bg-white rounded-[1.25rem] border border-purple-200 shadow-sm overflow-hidden mb-4 animate-in slide-in-from-top-4 duration-300 relative">
                                <button
                                    onClick={() => setShowReassembleOptionModal(false)}
                                    className="absolute top-3 right-3 p-1.5 bg-slate-200/50 hover:bg-slate-200 rounded-full transition-all text-slate-600 hover:text-slate-900 z-10"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>

                                {/* Three Horizontal Columns */}
                                <div className="p-5 pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50">

                                    {/* Column 1: SAME SHEET / SAME PCS */}
                                    <div className="bg-white rounded-[1.25rem] p-4 border border-purple-100 hover:border-purple-300 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-purple-50 rounded-bl-xl text-purple-600 font-bold text-[8px] uppercase tracking-wider">
                                            Option 1
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-base">⚡</span>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{isSheetTarget ? 'SAME SHEET' : 'SAME PCS'}</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium mb-3 leading-tight">
                                                {isSheetTarget
                                                    ? 'Material substrate still usable (sheet not damaged, only the cut failed). Run completion cycle immediately. No EMR needed.'
                                                    : 'Material substrate still usable (piece not damaged, only the print/cut failed). Run completion cycle immediately. No EMR needed.'}
                                            </p>

                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">QTY TO REASSEMBLE</label>
                                                <input
                                                    type="number"
                                                    value={recutOptionQty}
                                                    onChange={(e) => setReassembleOptionQty(Math.max(1, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-3 py-1.5 text-base font-bold text-slate-700 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleConfirmSameSheet(recutOptionQty)}
                                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[9px] tracking-widest rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <span>✓ CONFIRM & REASSEMBLE DIRECT</span>
                                        </button>
                                    </div>

                                    {/* Column 2: EXCESS MATERIAL */}
                                    <div className="bg-white rounded-[1.25rem] p-4 border border-emerald-100 hover:border-emerald-300 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-emerald-50 rounded-bl-xl text-emerald-600 font-bold text-[8px] uppercase tracking-wider">
                                            Option 2
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-base">♻️</span>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">USE EXCESS</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium mb-3 leading-tight">
                                                {isSheetTarget
                                                    ? 'Use spare sheet material available on the shopfloor. Start recut cycle immediately. No EMR needed.'
                                                    : 'Use spare piece material available on the shopfloor. Start recut cycle immediately. No EMR needed.'}
                                            </p>

                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">QTY FROM EXCESS</label>
                                                <input
                                                    type="number"
                                                    value={recutOptionExcessQty}
                                                    onChange={(e) => setReassembleOptionExcessQty(Math.max(1, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-base font-bold text-slate-700 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleConfirmExcessMaterial(recutOptionExcessQty)}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <span>✓ START EXCESS REASSEMBLE</span>
                                        </button>
                                    </div>

                                    {/* Column 3: NEW SHEET / NEW PCS (EMR) */}
                                    <div className="bg-white rounded-[1.25rem] p-4 border border-rose-100 hover:border-rose-300 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-rose-50 rounded-bl-xl text-rose-600 font-bold text-[8px] uppercase tracking-wider">
                                            Option 3
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-base">📦</span>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{isSheetTarget ? 'NEW SHEET (EMR)' : 'NEW PCS (EMR)'}</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium mb-2.5 leading-tight">
                                                {isSheetTarget
                                                    ? 'Sheet is damaged, warped, or unusable. Raise EMR request to Stores for a fresh sheet. Wait for arrival to complete.'
                                                    : 'Piece is damaged, warped, or unusable. Raise EMR request to Stores for fresh pieces. Wait for arrival to complete.'}
                                            </p>

                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2 mb-3">
                                                <div className={isSheetTarget ? 'flex gap-2' : ''}>
                                                    <div className={isSheetTarget ? 'w-1/2' : 'w-full'}>
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">QTY FROM EXCESS</label>
                                                        <input
                                                            type="number"
                                                            value={recutOptionNewSheetReassembleQty}
                                                            onChange={(e) => {
                                                                const val = Math.max(1, parseInt(e.target.value) || 0);
                                                                setReassembleOptionNewSheetReassembleQty(val);
                                                                if (!isSheetTarget) {
                                                                    setReassembleOptionSheetQty(val);
                                                                }
                                                            }}
                                                            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none transition-all"
                                                        />
                                                    </div>
                                                    {isSheetTarget && (
                                                        <div className="w-1/2">
                                                            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">SHEET SIZE REQD</label>
                                                            <input
                                                                type="text"
                                                                value={recutOptionSheetSize}
                                                                onChange={(e) => setReassembleOptionSheetSize(e.target.value)}
                                                                className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none transition-all"
                                                                placeholder="e.g. 24x36"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <div>
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{isSheetTarget ? 'QTY OF SHEETS' : 'QTY OF PCS'}</label>
                                                        <input
                                                            type="number"
                                                            value={recutOptionSheetQty}
                                                            onChange={(e) => {
                                                                const val = Math.max(1, parseInt(e.target.value) || 0);
                                                                setReassembleOptionSheetQty(val);
                                                                if (!isSheetTarget) {
                                                                    setReassembleOptionNewSheetReassembleQty(val);
                                                                }
                                                            }}
                                                            className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">URGENCY</label>
                                                        <button
                                                            onClick={() => setReassembleOptionUrgent(!recutOptionUrgent)}
                                                            className={`w-full py-1 px-2.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${recutOptionUrgent ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                                                        >
                                                            {recutOptionUrgent ? '🚨 URGENT' : 'NORMAL'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">REASON FOR EMR</label>
                                                    <input
                                                        type="text"
                                                        value={recutOptionReason}
                                                        onChange={(e) => setReassembleOptionReason(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none transition-all"
                                                        placeholder="e.g. Warped / burned"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConfirmNewSheet}
                                            disabled={isActionLoading}
                                            className={`w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[9px] tracking-widest rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${isActionLoading ? 'opacity-55 cursor-not-allowed' : ''}`}
                                        >
                                            <span>{isActionLoading ? 'SUBMITTING...' : '🚨 SUBMIT EMR REQUEST'}</span>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}
                        {/* Active Cycle Context */}
                        {isSamplingView && (
                            <div className={`bg-white rounded-[1.25rem] border ${activePrimaryUnlocked ? 'border-emerald-200' : runningCycles[groupId]?.status === 'COMPLETED' ? 'border-emerald-100' : 'border-indigo-100'} shadow-sm overflow-hidden mb-4`}>
                                {activePrimaryUnlocked ? (
                                    <>
                                        <div className="bg-emerald-50/50 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto">
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider italic leading-snug whitespace-nowrap">
                                                        Sample Approved — <span className="text-emerald-600">{mg?.group_name}</span>
                                                    </h2>
                                                    <span className="text-[9px] font-black text-emerald-500/80 uppercase italic tracking-widest block leading-none">Primary Production Unlocked</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200/60 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="flex flex-col items-center sm:items-end leading-none">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CYCLES</span>
                                                    <span className="text-sm font-black text-slate-700">{primaryUnlocked[groupId].cycleCount}</span>
                                                </div>
                                                <div className="flex flex-col items-center sm:items-end leading-none pl-4 border-l border-slate-200">
                                                    <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">GOOD PCS</span>
                                                    <span className="text-sm font-black text-emerald-600">{primaryUnlocked[groupId].goodQty}</span>
                                                </div>
                                                <div className="flex flex-col items-center sm:items-end leading-none pl-4 border-l border-slate-200">
                                                    <span className="text-[8px] font-black text-rose-500/80 uppercase tracking-widest mb-1">REJECTED</span>
                                                    <span className="text-sm font-black text-rose-600">{primaryUnlocked[groupId].badQty}</span>
                                                </div>
                                                <div className="flex flex-col items-center sm:items-end leading-none pl-4 border-l border-slate-200">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL</span>
                                                    <span className="text-sm font-black text-slate-700">{primaryUnlocked[groupId].totalPcs}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* READY TO INSPECT & ISSUE CARD */}
                                        {isCompleted && (
                                            <div className="bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 p-8 mb-4 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 shadow-lg shadow-emerald-500/5">
                                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 mb-4">
                                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                                                    READY TO INSPECT & ISSUE — {running.cyclesDone === totalExpectedCycles ? 'ALL CYCLES COMPLETE' : `CYCLE ${running.cyclesDone} COMPLETE`}
                                                </h2>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                                                        {cycleOutput} pcs
                                                    </span>
                                                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest italic">
                                                        — Cycle {running.cyclesDone}/{totalExpectedCycles}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex items-center gap-4 text-[10px] font-black text-emerald-500/60 uppercase italic tracking-widest">
                                                    <span className="flex items-center gap-2">
                                                        <Printer className="w-3.5 h-3.5" />
                                                        Running stock total: {cycleOutput} pcs
                                                    </span>
                                                    <span className="opacity-30">·</span>
                                                    <span>✓ Cutting complete — notify next dept and issue below</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="px-5 py-2 flex items-center justify-between border-b border-inherit">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${runningCycles[groupId]?.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : runningCycles[groupId]?.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'}`}></div>
                                                <h2 className="text-[12px] font-black text-slate-900 uppercase italic tracking-wider">
                                                    Sample Cycle — <span className="text-indigo-600">{mg?.group_name || ''}</span>
                                                </h2>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                    {displaySampleCycles} cycles - {displaySampleApproved} Approved / {displaySampleRejected} Rejected
                                                </span>
                                            </div>
                                        </div>

                                        {runningCycles[groupId]?.status === 'RUNNING' ? (
                                            <div className="px-5 py-8 flex flex-col items-center justify-center bg-slate-50/50">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">SAMPLE CUTTING...</h3>
                                                <p className="text-[10px] font-black text-slate-300 uppercase italic">Press ✓ Cycle Done in the left panel when cutting is complete</p>
                                            </div>
                                        ) : runningCycles[groupId]?.status === 'COMPLETED' ? (
                                            <div className="p-4 bg-white space-y-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase italic tracking-widest px-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>✓ CYCLE {runningCycles[groupId].cyclesDone} COMPLETE — {runningCycles[groupId].ups} PCS READY · INSPECT & ISSUE</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Good Pcs Input */}
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-2 italic">✓ Good Pcs</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={handleSampleGoodDecrement}
                                                                disabled={isJobCompleted}
                                                                className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                disabled={isJobCompleted}
                                                                value={sampleInputs[groupId]?.good ?? 0}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    const max = runningCycles[groupId].ups;
                                                                    const good = Math.min(val, max);
                                                                    const bad = Math.max(0, max - good);
                                                                    setSampleInputs(prev => ({ ...prev, [groupId]: { good, bad } }));
                                                                }}
                                                                className="flex-1 bg-white border border-emerald-100 rounded-lg h-10 text-center text-sm font-black text-slate-700 outline-none focus:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                            <button
                                                                onClick={handleSampleGoodIncrement}
                                                                disabled={isJobCompleted}
                                                                className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Bad / Reject Input */}
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-2 italic">X Bad / Reject</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={handleSampleBadDecrement}
                                                                disabled={isJobCompleted}
                                                                className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 hover:bg-orange-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                disabled={isJobCompleted}
                                                                value={sampleInputs[groupId]?.bad ?? 0}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    const max = runningCycles[groupId].ups;
                                                                    const bad = Math.min(val, max);
                                                                    const good = Math.max(0, max - bad);
                                                                    setSampleInputs(prev => ({ ...prev, [groupId]: { good, bad } }));
                                                                }}
                                                                className="flex-1 bg-white border border-orange-100 rounded-lg h-10 text-center text-sm font-black text-slate-700 outline-none focus:border-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                            <button
                                                                onClick={handleSampleBadIncrement}
                                                                disabled={isJobCompleted}
                                                                className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 hover:bg-orange-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={isJobCompleted ? undefined : handlePhotoAreaClick}
                                                    className={`border border-dashed border-slate-200 rounded-lg p-3 flex items-center justify-between transition-colors w-full ${samplePhotos[groupId] ? 'cursor-default bg-slate-50/50' : isJobCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}
                                                >
                                                    <input
                                                        type="file"
                                                        id={`photo-upload-${groupId}`}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setSamplePhotos(prev => ({ ...prev, [groupId]: file }));
                                                                toast.success("Photo attached");
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        {samplePhotos[groupId] ? (
                                                            <div
                                                                className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-emerald-300 shrink-0 cursor-zoom-in hover:border-emerald-500 transition-all shadow-sm"
                                                                onClick={handlePhotoPreview}
                                                                title="Click to preview"
                                                            >
                                                                <img
                                                                    src={URL.createObjectURL(samplePhotos[groupId])}
                                                                    alt="Sample Preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-all">
                                                                    <span className="text-white text-[8px] font-black opacity-0 hover:opacity-100 transition-opacity">🔍</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Camera className="w-4 h-4 text-slate-400" />
                                                        )}
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest italic ${samplePhotos[groupId] ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {samplePhotos[groupId] ? `Photo attached: ${samplePhotos[groupId].name}` : 'Add sample photo (optional)'}
                                                            </span>
                                                            {samplePhotos[groupId] && (
                                                                <button
                                                                    onClick={isJobCompleted ? undefined : handleChangePhoto}
                                                                    disabled={isJobCompleted}
                                                                    className="text-[9px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-wider text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    ↺ Change photo
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {samplePhotos[groupId] && (
                                                        <button
                                                            onClick={isJobCompleted ? undefined : (e) => {
                                                                e.stopPropagation();
                                                                setSamplePhotos(prev => {
                                                                    const updated = { ...prev };
                                                                    delete updated[groupId];
                                                                    return updated;
                                                                });
                                                                document.getElementById(`photo-upload-${groupId}`).value = '';
                                                            }}
                                                            disabled={isJobCompleted}
                                                            className="p-2 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Remove photo"
                                                        >
                                                            <X className="w-4 h-4 shrink-0" />
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={handleSubmitSample}
                                                    disabled={isJobCompleted || isActionLoading || !((sampleInputs[groupId]?.good || 0) > 0 || (sampleInputs[groupId]?.bad || 0) > 0)}
                                                    className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${isActionLoading ? 'bg-slate-300 text-slate-500 cursor-wait shadow-none' : ((sampleInputs[groupId]?.good || 0) > 0) ? 'bg-[#9333ea] text-white shadow-purple-200 hover:bg-[#7e22ce]' : (sampleInputs[groupId]?.bad || 0) > 0 ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'} disabled:opacity-50`}
                                                >
                                                    {isActionLoading ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                                                            <span>SUBMITTING...</span>
                                                        </div>
                                                    ) : (sampleInputs[groupId]?.good || 0) > 0 ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Package className="w-4 h-4" />
                                                            <span>ISSUE & SEND FOR APPROVAL</span>
                                                        </div>
                                                    ) : (sampleInputs[groupId]?.bad || 0) > 0 ? 'REJECT & RETRY SAMPLE' : 'ENTER QTY FIRST'}
                                                </button>
                                            </div>
                                        ) : (!isSampleApprovedBySales && !isSampleRejectedInternal && runningCycles[groupId]?.status === 'WAITING_APPROVAL') ? (
                                            <div className="p-4 bg-white space-y-4">
                                                <div className={`${(runningCycles[groupId].issuedGood || 0) === 0 ? 'bg-orange-500 shadow-orange-100' : 'bg-[#9333ea] shadow-purple-200'} rounded-xl p-4 flex items-center justify-between text-white shadow-lg`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                                            {(runningCycles[groupId].issuedGood || 0) === 0 ? <AlertCircle className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-black uppercase tracking-wider">
                                                                {(runningCycles[groupId].issuedGood || 0) === 0 ? 'X SAMPLE REJECTED' : '✓ SAMPLE SENT FOR APPROVAL'}
                                                            </div>
                                                            <div className="text-[10px] font-bold opacity-80 uppercase italic">
                                                                {(runningCycles[groupId].issuedGood || 0) === 0 ? 'Quality Failed - Review Required' : 'Waiting for QC Review'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(runningCycles[groupId].issuedGood || 0) > 0 && !isSampleRejectedInternal ? (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-inner">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                            AWAITING SALES APPROVAL
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={handleRunSampleAgain}
                                                            disabled={isJobCompleted}
                                                            className="px-4 py-2 bg-white text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            RUN SAMPLE AGAIN
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Good Pcs</span>
                                                        <span className="text-xl font-black text-slate-700">{runningCycles[groupId].issuedGood}</span>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Bad / Reject</span>
                                                        <span className="text-xl font-black text-slate-700">{runningCycles[groupId].issuedBad}</span>
                                                    </div>
                                                </div>

                                                {/* <button
                                            onClick={() => {
                                                const cycle = runningCycles[groupId] || {};
                                                setPrimaryUnlocked(prev => ({
                                                    ...prev,
                                                    [groupId]: {
                                                        cycleCount: q.sample_cycles || 1,
                                                        goodQty: q.sample_good || 0,
                                                        badQty: q.sample_reject || 0,
                                                        totalPcs: (q.sample_good || 0) + (q.sample_reject || 0)
                                                    }
                                                }));
                                                setRunningCycles(prev => {
                                                    const next = { ...prev };
                                                    delete next[groupId];
                                                    return next;
                                                });
                                                const newLog = {
                                                    action: `🚀 APPROVED FOR PRODUCTION — PRIMARY CYCLE NOW OPEN`,
                                                    timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                                                    activity_type: 'production'
                                                };
                                                setLocalLogs(prev => [newLog, ...prev]);
                                                toast.success("Primary cycle started!");
                                            }}
                                            disabled={runningCycles[groupId]?.status !== 'APPROVED'}
                                            className={`w-full py-5 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all ${runningCycles[groupId]?.status !== 'APPROVED' ? 'bg-slate-400/20 text-slate-400 cursor-not-allowed shadow-none border-2 border-dashed border-slate-200' : 'bg-slate-900 text-white shadow-slate-900/20 active:scale-95 hover:bg-slate-800'}`}
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            START MAIN PRODUCTION
                                        </button> */}
                                            </div>
                                        ) : (isSampleApprovedBySales || runningCycles[groupId]?.status === 'APPROVED' || running?.status === 'APPROVED') ? (
                                            <div className="p-4 bg-white space-y-4">
                                                <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-100 flex flex-col items-center justify-center text-center">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Sales / Admin Approved</span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-emerald-500 uppercase italic opacity-70">
                                                        {q.sample_cycles || 1} Cycles · {q.sample_good || 0} Approved · {q.sample_reject || 0} Rejected · Quality confirmed
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleBeginPrimaryCycle}
                                                    className="w-full py-6 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-[16px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 group"
                                                >
                                                    <span className="group-hover:scale-125 transition-transform">🚀</span>
                                                    APPROVED — BEGIN PRIMARY CYCLE
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-5 py-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] italic">ENTER UPS IN LEFT PANEL</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Inspection & Counting Section */}
                        <div className="bg-white rounded-[2rem] p-4 border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">1</div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">INSPECT — COUNT GOOD & BAD PIECES</h3>
                            </div>

                            {/* Large Action Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 p-4 pt-8 flex flex-col items-center relative overflow-hidden group transition-all ${isJobCompleted || !isCompleted ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white hover:border-emerald-500 cursor-pointer'}`}>
                                    <div className="absolute top-3 left-0 w-full flex justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">GOOD PCS</span>
                                    </div>
                                    <div className="relative w-full flex flex-col items-center my-2">
                                        <input
                                            type="number"
                                            min="0"
                                            name="good"
                                            disabled={isJobCompleted || !isCompleted}
                                            value={productionInputs.good || ''}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const val = Math.min(cycleOutput, parseInt(e.target.value) || 0);
                                                setProductionInputs(prev => ({
                                                    ...prev,
                                                    good: val,
                                                    bad: cycleOutput - val
                                                }));
                                            }}
                                            className="w-32 bg-white border border-emerald-200 focus:border-emerald-500 rounded-2xl py-2 px-3 text-3xl font-black text-emerald-600 tracking-tighter leading-none text-center outline-none transition-all focus:scale-105 appearance-none shadow-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                            }}
                                        />
                                    </div>

                                    {isCompleted && !isJobCompleted && (
                                        <button
                                            onClick={handleSetAllGood}
                                            className="w-full mt-2 mb-2 bg-emerald-500 text-white rounded-lg py-2 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 group"
                                        >
                                            <div className="flex items-center gap-1.5 leading-none">
                                                <span className="text-sm font-bold group-hover:-translate-y-1 transition-transform">↑</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Use {cycleOutput} pcs (cycle output)</span>
                                            </div>
                                        </button>
                                    )}

                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">ready to pass on</span>
                                </div>

                                <div className={`bg-amber-50 rounded-[2rem] border-2 border-amber-100 p-4 pt-8 flex flex-col items-center relative overflow-hidden group transition-all ${isJobCompleted || !isCompleted ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white hover:border-amber-500 cursor-pointer'}`}>
                                    <div className="absolute top-3 left-0 w-full flex justify-center gap-2">
                                        <X className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest italic">BAD / REJECT</span>
                                    </div>
                                    <div className="relative w-full flex flex-col items-center my-2">
                                        <input
                                            type="number"
                                            min="0"
                                            name='bad'
                                            disabled={isJobCompleted || !isCompleted}
                                            placeholder='0'
                                            value={productionInputs.bad || ''}
                                            onChange={(e) => {
                                                const val = Math.min(cycleOutput, parseInt(e.target.value) || 0);
                                                setProductionInputs(prev => ({
                                                    ...prev,
                                                    bad: val,
                                                    good: cycleOutput - val
                                                }));
                                            }}
                                            className="w-32 bg-white border border-amber-200 focus:border-amber-500 rounded-2xl py-2 px-3 text-3xl font-black text-amber-600 tracking-tighter leading-none text-center outline-none transition-all focus:scale-105 appearance-none shadow-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] italic">goes to recut queue</span>
                                </div>
                            </div>
                        </div>

                        {/* Handover & Completion Section */}
                        <div className="bg-white rounded-[2rem] p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">2</div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">ISSUE — HAND OVER TO DEPARTMENT</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 italic">HAND OVER TO (PERSON)</span>
                                    <div className="relative bg-slate-50 border-2 border-slate-100 rounded-lg px-4 pl-10 py-3 flex items-center">
                                        <span className="text-[11px] font-black text-slate-700">Ready Stock</span>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Package className="w-4 h-4 text-amber-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 italic">DEPARTMENT</span>
                                    <div className="relative bg-slate-50 border-2 border-slate-100 rounded-lg px-4 pl-10 py-3 flex items-center">
                                        <span className="text-[11px] font-black text-slate-700">Stores</span>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Factory className="w-4 h-4 text-indigo-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {productionInputs.good > 0 ? (
                                <button
                                    onClick={handleHandOver}
                                    disabled={isJobCompleted || !isCompleted}
                                    className="w-full py-5 bg-[#0f172a] hover:bg-slate-900 text-white rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-emerald-400 font-bold">✓</span> HAND OVER {productionInputs.good} {isSheetTarget ? (productionInputs.good > 1 ? 'SHEETS' : 'SHEET') : 'PCS'} → STORES
                                </button>
                            ) : (
                                <button disabled className="w-full py-4 bg-slate-200 text-slate-400 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    ENTER GOOD QTY ({Math.max(0, actualPendingQty - (productionInputs.good || 0) - (productionInputs.bad || 0))} PENDING)
                                </button>
                            )}

                        </div>
                    </div>

                    </div>
                </div>

                {/* Global Summary Metrics Bar */}
                <div className="shrink-0 pt-1">
                    <div className="bg-[#0f172a] rounded-[1.5rem] px-2 sm:px-4 py-3 flex items-center justify-between border border-slate-800 shadow-xl text-white">
                        <div className="flex-1 flex flex-col items-center border-r border-slate-800 last:border-0">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">TARGET</span>
                            <span className="text-base sm:text-xl font-black text-white tracking-tighter leading-none">
                                {targetQty}
                            </span>
                            {outsourcedSheets > 0 && (
                                <span className="text-[7px] font-bold text-slate-500 italic leading-none mt-0.5">
                                    -{isSheetTarget ? outsourcedSheets : outsourcedSheets * upsVal} outsourced
                                </span>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col items-center border-r border-slate-800 last:border-0">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">GOOD ISSUED</span>
                            <span className="text-base sm:text-xl font-black text-emerald-400 tracking-tighter leading-none">
                                {totalGoodHandedOver}
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center border-r border-slate-800 last:border-0">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">{isUv ? 'REPRINTS' : 'REASSEMBLES'}</span>
                            <span className="text-base sm:text-xl font-black text-amber-500 tracking-tighter leading-none">
                                {cumulativeReassembles + (productionInputs.bad || 0)}
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center border-r border-slate-800 last:border-0">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">{isUv ? (isSheetTarget ? 'TOTAL PRINTED' : 'TOTAL PRINTED') : 'TOTAL CUTTED'}</span>
                            <span className="text-base sm:text-xl font-black text-indigo-400 tracking-tighter leading-none">
                                {totalGoodHandedOver + cumulativeReassembles + productionInputs.good + productionInputs.bad}
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center border-r border-slate-800 last:border-0">
                            <span className="text-[8px] font-black text-rose-400/50 uppercase tracking-widest mb-1 italic">PENDING</span>
                            <span className="text-base sm:text-xl font-black text-rose-500 tracking-tighter leading-none">
                                {Math.max(0, targetQty - totalGoodHandedOver - cumulativeReassembles - (productionInputs?.good || 0) - (productionInputs?.bad || 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Console / Activity Log */}
            <aside className="w-full xl:w-64 flex flex-col shrink-0 xl:h-full overflow-hidden">
                <div className="bg-[#0f172a] rounded-[1.5rem] p-4 text-white h-full flex flex-col shadow-xl overflow-y-auto custom-sidebar-scroll">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 ">ACTIVITY LOG</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="p-1.5 bg-[#00d1b2]/20 rounded-lg border border-[#00d1b2]/30 hover:bg-[#00d1b2]/30 transition-colors cursor-pointer group">
                                <Search className="w-3 h-3 text-[#00d1b2]" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 custom-sidebar-scroll px-2">
                        {(() => {
                            // We now use the top-level uniqueLogs array directly

                            return (
                                <>
                                    {uniqueLogs.map((log, idx) => {
                                        const isProductionStart = log.action?.includes('PRIMARY CYCLE NOW OPEN');
                                        const isApproved = !isProductionStart && log.action?.includes('APPROVED');
                                        const isSampling = log.activity_type?.toLowerCase() === 'sampling';
                                        const isPaused = log.action?.includes('PAUSED');
                                        const isResumed = log.action?.includes('RESUMED');
                                        const isHandedOver = log.action?.includes('HANDED OVER');

                                        let logDetails = log.details || {};
                                        if (typeof logDetails.remarks === 'string' && logDetails.remarks.includes('"is_shift_handover":true')) {
                                            try {
                                                logDetails = { ...logDetails, ...JSON.parse(logDetails.remarks) };
                                            } catch (e) { /* ignore */ }
                                        }

                                        return (
                                            <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <span className="text-[9px] font-black text-slate-600 font-mono shrink-0 pt-0.5">
                                                    {(() => {
                                                        const date = new Date(log.timestamp);
                                                        return isNaN(date.getTime()) ? log.timestamp : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                    })()}
                                                </span>
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="flex items-start gap-1.5">
                                                        {isProductionStart ? (
                                                            <span className="text-[10px] mt-0.5 shrink-0 leading-none">🚀</span>
                                                        ) : isApproved ? (
                                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 mt-0.5 shrink-0" />
                                                        ) : isPaused ? (
                                                            <span className="text-[10px] mt-0.5 shrink-0 leading-none text-amber-500">⏸</span>
                                                        ) : isResumed ? (
                                                            <span className="text-[10px] mt-0.5 shrink-0 leading-none text-emerald-400">▶</span>
                                                        ) : isHandedOver ? (
                                                            <span className="text-[10px] mt-0.5 shrink-0 leading-none">📦</span>
                                                        ) : isSampling ? (
                                                            <AlertTriangle className="w-2.5 h-2.5 text-amber-400/80 mt-0.5 shrink-0" />
                                                        ) : logDetails?.is_shift_handover ? (
                                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0 shadow-lg shadow-orange-500/50"></div>
                                                        ) : (
                                                            <Terminal className="w-2.5 h-2.5 text-slate-500 mt-0.5 shrink-0" />
                                                        )}
                                                        <span className={`text-[9px] font-black uppercase tracking-widest italic ${isPaused ? 'text-amber-500' :
                                                            isResumed ? 'text-emerald-400' :
                                                                isHandedOver ? 'text-indigo-400' :
                                                                    isProductionStart ? 'text-emerald-400 font-bold' :
                                                                        logDetails?.is_shift_handover ? 'text-[#00d1b2] font-bold' :
                                                                            'text-slate-400'
                                                            }`}>
                                                            {log.action?.replace('✓ ', '')?.replace('🚀 ', '') || log.activity_type}
                                                        </span>
                                                    </div>

                                                    {logDetails?.is_shift_handover && (
                                                        <div className="bg-[#00d1b2]/10 border border-[#00d1b2]/30 rounded-xl p-3 flex flex-col gap-2 w-full mt-1">
                                                            <span className="text-[9px] font-black text-[#00d1b2] tracking-widest uppercase italic opacity-90">
                                                                Switched to {getShiftLabel(logDetails.next_shift)} for balance processing
                                                            </span>

                                                            <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 mt-1 pt-2 border-t border-[#00d1b2]/20">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] font-black text-[#00d1b2]/60 uppercase tracking-widest">{getShiftLabel(logDetails.current_shift)} UPS</span>
                                                                    <span className="text-[9px] font-black text-[#00d1b2]">{logDetails.shift_ups} ups × {logDetails.shift_cycles} cyc</span>
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-[7px] font-black text-[#00d1b2]/60 uppercase tracking-widest">OPERATOR</span>
                                                                    <span className="text-[9px] font-black text-[#00d1b2] truncate" title={log.operator || 'N/A'}>{log.operator || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] font-black text-[#00d1b2]/60 uppercase tracking-widest">COMPLETED</span>
                                                                    <span className="text-[9px] font-black text-[#00d1b2]">{logDetails.issued_pcs || 0} pcs</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] font-black text-[#00d1b2]/60 uppercase tracking-widest">REJECTED</span>
                                                                    <span className="text-[9px] font-black text-[#00d1b2]">{logDetails.rejected_pcs || 0} pcs</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {uniqueLogs.length === 0 && (
                                        <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <span className="text-[9px] font-black text-slate-600 font-mono">--:--</span>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-2.5 h-2.5 text-slate-500" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">WAITING FOR INWARD</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </aside>

            {/* Rejection Remark Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-500 px-8 py-6 text-white relative">
                            <div className="flex items-center gap-3 mb-1">
                                <AlertCircle className="w-5 h-5" />
                                <h3 className="text-lg font-black uppercase tracking-widest">Reject Sample</h3>
                            </div>
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest italic">Provide a reason for rejection</p>
                            <button
                                onClick={handleCloseRejectModal}
                                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-8">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2 italic">REJECTION REMARK</label>
                            <textarea
                                value={rejectRemark}
                                onChange={(e) => setRejectRemark(e.target.value)}
                                placeholder="e.g. Dimensions not matching, Burrs observed, etc."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-rose-500/30 transition-all min-h-[120px] resize-none placeholder:text-slate-300"
                                autoFocus
                            />

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={handleCloseRejectModal}
                                    className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleConfirmReject}
                                    className="py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 transition-all active:scale-95"
                                >
                                    CONFIRM REJECT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Start Reassemble Option Select Modal */}
            {showStartReassembleSelectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-300">
                        <div className="bg-purple-600 px-8 py-6 text-white relative">
                            <button
                                onClick={() => setShowStartReassembleSelectModal(false)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">⚡</span>
                                <div>
                                    <h3 className="text-[14px] font-black uppercase tracking-wider">Select Reassemble Option to Start</h3>
                                    <p className="text-[10px] opacity-80 uppercase italic tracking-wider mt-0.5">Select from the ready/received material queue</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 max-h-[30rem] overflow-y-auto space-y-4">
                            {readyReassembleOptions.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase italic">
                                    No ready/received reassemble options available.
                                </div>
                            ) : (
                                readyReassembleOptions.map((opt, idx) => {
                                    // Find the real index of this option in the full selected_recut_option array
                                    const allOptions = quantities[groupId]?.selected_recut_option || [];
                                    // Build a list of "ready" option indices to map idx → real index
                                    let readyIdx = 0;
                                    let realIndex = -1;
                                    for (let i = 0; i < allOptions.length; i++) {
                                        const o = allOptions[i];
                                        if ((o.type === 'New Sheet' || o.type === 'new sheet') && !o.is_inwarded) continue;
                                        const c = (o.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
                                        if (c < o.qty) {
                                            if (readyIdx === idx) { realIndex = i; break; }
                                            readyIdx++;
                                        }
                                    }

                                    const completed = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
                                    const remaining = opt.qty - completed;
                                    return (
                                        <div
                                            key={idx}
                                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-purple-300 hover:bg-purple-50/20 transition-all"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                                    {opt.type.toUpperCase()}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-semibold mt-1">
                                                    Total Qty: {opt.qty} pcs · Remaining: {remaining} pcs
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const updatedOpt = {
                                                        ...opt,
                                                        isReassemblemethodstarted: true,
                                                        _listIndex: realIndex  // store real array index for precise updates
                                                    };
                                                    setSelectedReassembleOption(updatedOpt);
                                                    // Prefill the sidebar's ups input with remaining qty
                                                    setSampleUps(prev => ({ ...prev, [groupId]: remaining.toString() }));
                                                    setReassembleUpsVal(remaining);

                                                    const currentGroup = quantities[groupId] || {};
                                                    const currentOptions = Array.isArray(currentGroup.selected_recut_option)
                                                        ? [...currentGroup.selected_recut_option]
                                                        : [];
                                                    // Use realIndex so we correctly update the right entry
                                                    if (realIndex !== -1) {
                                                        currentOptions[realIndex] = updatedOpt;
                                                    }
                                                    const nextQuantitiesObj = {
                                                        ...currentGroup,
                                                        selected_recut_option: currentOptions,
                                                        quantities_updated_at: new Date().toISOString()
                                                    };
                                                    setQuantities(prev => ({
                                                        ...prev,
                                                        [groupId]: nextQuantitiesObj
                                                    }));

                                                    if (triggerImmediateSync) {
                                                        triggerImmediateSync(groupId, {
                                                            quantities: nextQuantitiesObj
                                                        });
                                                    }

                                                    setShowStartReassembleSelectModal(false);
                                                    toast.success(`Selected ${opt.type.toUpperCase()} recut. Enter UPS in left panel.`);
                                                }}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-purple-500/10 flex items-center gap-1.5"
                                            >
                                                <Play className="w-3 h-3 fill-current" />
                                                <span>SELECT & START</span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SETUP RUN MODAL */}
            {showSetupModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        {/* Header */}
                        <div className="bg-[#0f172a] p-6 text-white">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <Settings2 className="w-6 h-6 text-[#00d1b2]" />
                                    </div>
                                    <span className="text-2xl font-black uppercase tracking-tighter">SETUP RUN</span>
                                </div>
                                <button onClick={handleCloseSetupModal} className="p-2 hover:bg-white/10 rounded-full transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00d1b2] opacity-80">
                                <span>{getShiftLabel(currentShift)}</span>
                                <span className="opacity-30">·</span>
                                <span>{isSheetTarget ? '1 SHEET' : `${primaryUps} UPS`}/CYCLE</span>
                                <span className="opacity-30">·</span>
                                <span>JOB {job.job_no}</span>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col gap-8 max-h-[80vh] overflow-y-auto">
                            {/* Summary Card */}
                            <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 grid grid-cols-3 gap-y-4 gap-x-8">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">JOB NO</span>
                                    <span className="text-xs font-black text-slate-900">{job.job_no}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">MATERIAL</span>
                                    <span className="text-xs font-black text-slate-900">{mg?.group_name || 'N/A'}</span>
                                </div>
                                {isSheetTarget && (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SHEET</span>
                                            <span className="text-xs font-black text-slate-900">{firstMaterial?.material_input?.one_up_width || 0}"x{firstMaterial?.material_input?.one_up_length || 0}"</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">UPS/SHEET</span>
                                            <span className="text-xs font-black text-slate-900">{firstMaterial?.material_input?.ups || mg.ups || 0} pcs</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL OUTPUT</span>
                                    <span className="text-xs font-black text-slate-900">{isSheetTarget ? `${targetQty} sheets` : `${targetQty} pcs`}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{isSheetTarget ? 'SHEETS REQD' : 'PCS REQD'}</span>
                                    <span className="text-xs font-black text-slate-900">{isSheetTarget ? inHouseSheets : inHouseTargetQty}</span>
                                </div>
                            </div>

                            {/* Step 1: Operator */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    WHO IS OPERATING?
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {operators.map(op => (
                                        <button
                                            key={op}
                                            onClick={() => setSelectedOperator(op)}
                                            className={`py-4 px-6 rounded-2xl text-sm font-black transition-all border-2 text-left flex items-center justify-between ${selectedOperator === op ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                        >
                                            {op}
                                            {selectedOperator === op && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 pt-4 border-t border-slate-100 flex gap-4">
                            <button
                                onClick={handleCloseSetupModal}
                                className="flex-1 py-5 rounded-[1.5rem] border-2 border-slate-100 text-[14px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedOperator}
                                onClick={handleStartProduction}
                                className={`flex-1 py-5 rounded-[1.5rem] text-[14px] font-black uppercase tracking-widest transition-all shadow-xl ${!selectedOperator ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#0f172a] text-white hover:bg-slate-800 shadow-slate-900/20'}`}
                            >
                                {!selectedOperator ? 'SELECT OPERATOR FIRST' : 'START PRODUCTION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUESTED REASSEMBLE OPTIONS PREVIEW MODAL */}
            {showReassembleStartInput && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="bg-[#0f172a] p-6 text-white shrink-0">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <Play className="w-6 h-6 text-[#00d1b2] fill-current" />
                                    </div>
                                    <span className="text-xl font-black uppercase tracking-tighter">{isUv ? 'REQUESTED REPRINT OPTIONS' : 'REQUESTED REASSEMBLE OPTIONS'}</span>
                                </div>
                                <button
                                    onClick={() => setShowReassembleStartInput(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00d1b2] opacity-80">
                                <span>JOB {job.job_no}</span>
                                <span className="opacity-30">·</span>
                                <span>{normalizedReassembleOptions.length} OPTIONS TOTAL</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {isUv ? 'REPRINT QUEUE DETAILS' : 'REASSEMBLE QUEUE DETAILS'}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {normalizedReassembleOptions.map((opt, idx) => {
                                        const completed = (opt.cycles || []).reduce((acc, c) => acc + (c.good_qty || 0) + (c.bad_qty || 0), 0);
                                        const remaining = opt.qty - completed;
                                        const isNewSheet = opt.type === 'New Sheet';
                                        const isReady = !isNewSheet || opt.is_inwarded;

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 relative bg-white border-slate-100 hover:border-slate-200`}
                                            >
                                                {/* Top row */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-lg">
                                                            {opt.type === 'same sheet' ? '⚡' : opt.type === 'use excess' ? '♻️' : '📄'}
                                                        </span>
                                                        <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                            {opt.type === 'same sheet' ? (isUv ? 'SAME SHEET REPRINT' : 'SAME SHEET REASSEMBLE') : opt.type === 'use excess' ? (isUv ? 'EXCESS MATERIAL REPRINT' : 'EXCESS MATERIAL REASSEMBLE') : (isUv ? 'NEW SHEET REPRINT' : 'NEW SHEET REASSEMBLE')}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600">
                                                        {opt.qty} PCS
                                                    </span>
                                                </div>

                                                {/* Meta Info */}
                                                {(isNewSheet || opt.reason) && (
                                                    <div className="grid grid-cols-2 gap-y-1.5 text-[10px] font-bold text-slate-500 uppercase italic bg-slate-50 p-3 rounded-xl mt-1">
                                                        <span>Reason: {opt.reason || 'N/A'}</span>
                                                        {isNewSheet && <span>Sheets Requested: {opt.sheet_qty || 1}</span>}
                                                        {isNewSheet && opt.urgent && (
                                                            <span className="text-rose-600 font-black col-span-2">🚨 URGENT</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Status info */}
                                                <div className="flex justify-between items-center mt-2 border-t border-slate-100/50 pt-2">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${!isReady
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {!isReady ? '⏳ PENDING INWARD' : '✓ READY'}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                                            Remaining: {remaining} PCS
                                                        </span>
                                                        {isReady && remaining > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedReassembleOption({
                                                                        ...opt,
                                                                        isReassemblemethodstarted: true
                                                                    });
                                                                    setShowReassembleStartInput(false);
                                                                    toast.success(isUv ? "Reprint Cycle started successfully!" : "Reassemble Cycle started successfully!");
                                                                }}
                                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-1"
                                                            >
                                                                <Play className="w-2.5 h-2.5 fill-current" />
                                                                <span>Start</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {normalizedReassembleOptions.length === 0 && (
                                        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                                            <span className="text-xs font-black text-slate-400 uppercase italic">No active reassemble options requested</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 pt-4 border-t border-slate-100 flex gap-4 shrink-0 bg-white">
                            <button
                                onClick={() => setShowReassembleStartInput(false)}
                                className="flex-1 py-5 rounded-[1.5rem] bg-[#0f172a] hover:bg-slate-800 text-white text-[14px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* </aside> */}

            {/* Sample Photo Lightbox */}
            <ImageLightbox
                src={lightboxSrc}
                fileName={lightboxName}
                onClose={() => setLightboxSrc(null)}
            />
        </div>
    );
};

export default AssemblyProcessInputForm;