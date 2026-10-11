import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, Package, Clock, LayoutGrid, Activity, User,
  ClipboardCheck, AlertCircle, AlertTriangle,
  CheckCircle2, Sun, Target, Microscope, ChevronRight,
  Play, Info, ListChecks, History, ArrowLeft, Maximize2,
  Terminal, Search, FileText, Factory, Printer, Minus, Plus, Camera
} from 'lucide-react';
import { fetchAllUsers } from '../../../reducer/userReducer';
import { getAllTeams } from '../../../reducer/teamReducer';
import { logShopFloorActivityApi, fetchShopFloorJobs } from '../../../reducer/shopFloorReducer';
import { fetchProcessFlow, syncSessionStateApi, confirmCompletionPopupApi } from '../../../reducer/shopFloorProcessFlowReducer';
import { toast } from 'react-toastify';
import MaterialInwardModal from './MaterialInwardModal';
import AssemblyProcessInputForm from './AssemblyProcessInputForm';

const AssemblyProcessScreen = ({
  jobId,
  groupId,
  isCombined,
  bottleneckQty,
  floor,
  onClose,
  onComplete
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllUsers({ limit: 100 }));
    dispatch(getAllTeams());
  }, [dispatch]);

  const { jobs, loading } = useSelector((state) => state.shopFloor);
  const { users } = useSelector((state) => state.user);

  // Find the specific job
  const job = useMemo(() => jobs.find(j => j._id === jobId), [jobs, jobId]);

  // Selected material groups that have been inwarded and are not completed
  const [selectedGroupIds, setSelectedGroupIds] = useState(() => {
    if (isCombined) return ['COMBINED'];
    if (groupId) return [groupId];
    const jobObj = jobs.find(j => j._id === jobId);
    if (!jobObj) return [];
    const groups = (jobObj.material_groups || []).filter(mg => {
      const totalGoodInwarded = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
      return totalGoodInwarded > 0 && mg.current_step !== 'Completed';
    });
    return groups.map(g => g._id || g.group_id);
  });

  // DB Persisted States
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    const jobObj = jobs.find(j => j._id === jobId);
    if (jobObj) {
      if (isCombined) {
        // Combined job flow
        const processed = (jobObj.primary_cycle_history || []).reduce((acc, log) => {
          return acc + (log.good_qty || 0);
        }, 0);
        
        const pending = Math.max(0, bottleneckQty - processed);
        
        initial['COMBINED'] = {
          good: pending,
          reject: 0,
          produced: pending,
          sample_size: Math.min(10, pending),
          sample_good: 0,
          sample_reject: 0,
          sample_cycles: 0,
          pendingUnits: pending,
          jobTargetPending: pending
        };
      } else {
        const groups = (jobObj.material_groups || []).filter(mg => {
          const totalGoodInwarded = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
          return totalGoodInwarded > 0 && mg.current_step !== 'Completed';
        });
        groups.forEach(mg => {
          const id1 = String(mg._id || '');
          const id2 = String(mg.group_id || '');
          const inwardedGood = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
          const totalUnits = inwardedGood;
          const processed = (mg.process_history || []).reduce((acc, log) => {
            const goodVal = typeof log.good_qty === 'number'
              ? log.good_qty
              : (log.details?.good_qty || 0);
            return acc + goodVal;
          }, 0);
          const pending = Math.max(0, totalUnits - processed);
          const inHouseQty = jobObj.total_qty || 0;
          const jobTargetPending = Math.max(0, inHouseQty - processed);

          const qState = {
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

          if (id1) initial[id1] = qState;
          if (id2) initial[id2] = qState;
        });
      }
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
  const [samplePhotos, setSamplePhotos] = useState({});

  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [activeModalGroupId, setActiveModalGroupId] = useState(null);

  const type = useMemo(() => {
    const processName = (job?.process_name || '').toLowerCase();
    const dept = (job?.department || '').toLowerCase();
    if (processName.includes('laser') || dept.includes('laser')) return 'laser';
    if (processName.includes('uv') || dept.includes('uv') || dept.includes('print')) return 'uv';
    return 'laser'; // default to laser
  }, [job]);

  const isUv = type === 'uv';
  const isUvFlow = type === 'uv';

  const isDynamic = useMemo(() => {
    if (!job) return false;
    const dept = (job.department || '').toLowerCase();
    const processName = (job.process_name || '').toLowerCase();
    return !dept.includes('laser') && !dept.includes('uv') && !dept.includes('print') && !dept.includes('dtp') &&
           !processName.includes('laser') && !processName.includes('uv') && !processName.includes('print') && !processName.includes('dtp');
  }, [job]);

  const activeOperators = useMemo(() => {
    const opRoleIds = (floor?.operators || []).filter(Boolean).map(r => String(r._id || r));
    const supRoleIds = (floor?.supervisors || []).filter(Boolean).map(r => String(r._id || r));
    const combinedRoleIds = [...new Set([...opRoleIds, ...supRoleIds])];

    let filteredUsers = users || [];

    if (combinedRoleIds.length > 0) {
      const roleMatches = filteredUsers.filter(u => combinedRoleIds.includes(String(u.role?._id || u.role)));
      if (roleMatches.length > 0) {
        filteredUsers = roleMatches;
      }
    }

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
    return assemblyFiltered.length > 0 ? assemblyFiltered : filteredUsers;
  }, [users, floor?.operators, floor?.supervisors]);

  // Load user details
  useEffect(() => {
    if (!job) return;
    if (isUv) {
      dispatch(fetchAllUsers({ limit: 100, departmentName: job.department || 'UV Printing', roleName: 'UV Printing Operator,UV Printing Head' }));
    } else {
      dispatch(fetchAllUsers({ limit: 200, is_active: true }));
    }
  }, [dispatch, job, isUv]);

  const getGroupStats = useCallback((groupId) => {
    const mg = job?.material_groups?.find(g => String(g.group_id || g._id) === String(groupId) || String(g._id) === String(groupId));
    if (!mg) return { remainingTargetQty: 0, targetQty: 0 };

    const firstMaterial = mg.materials?.[0];
    const totalSheets = firstMaterial?.quantity || mg?.sheets_required || 0;
    const outsourcedSheets = mg?.assigned_outsource_sheets || 0;
    const inwardedGoodCount = (mg?.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
    const isInHouseJob = inwardedGoodCount >= totalSheets;
    const inHouseSheets = isInHouseJob ? totalSheets : Math.max(0, totalSheets - outsourcedSheets);
    const upsVal = firstMaterial?.material_input?.ups || mg?.ups || 1;
    const inHouseQty = inHouseSheets * upsVal;
    const isSheetMaterial = !isUv || firstMaterial?.material_type === 'sheet';
    const inHouseTargetQty = isInHouseJob
      ? (job?.total_qty || inHouseQty)
      : Math.max(0, (job?.total_qty || inHouseQty) - (outsourcedSheets * upsVal));

    const bom = job?.bom_id;
    let processesList = [];
    if (bom && bom.materialprocess) {
      const processGroup = bom.materialprocess.find(p =>
        p.material_group_name?.toLowerCase().trim() === mg?.group_name?.toLowerCase().trim() ||
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
    }

    const targetQty = job?.total_qty || 0;

    const groupPrimaryCycles = primaryCycles[groupId] || [];
    const groupSampleCycles = sampleCycles[groupId] || [];
    const groupRecutOptions = quantities[groupId]?.selected_recut_option || [];

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

    const totalRejected = (quantities[groupId]?.reject || 0) + (quantities[groupId]?.sample_reject || 0);
    const cumulativeRecuts = totalRejected;

    const remainingTargetQty = Math.max(0, targetQty - totalGoodHandedOver - cumulativeRecuts);

    return {
      remainingTargetQty,
      targetQty
    };
  }, [job, isUv, primaryCycles, sampleCycles, quantities]);

  // Reconstruct cycles from MongoDB history if session state is missing
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

  // Load session state
  useEffect(() => {
    const loadProcessFlowData = async () => {
      if (!job || selectedGroupIds.length === 0 || hasLoadedFromDb) return;
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

            if (mg) {
              const reconstructed = (mg.process_history && mg.process_history.length > 0)
                ? reconstructCyclesFromHistory(mg.process_history)
                : { primaryCycles: [], sampleCycles: [], recutCycles: [] };

              if (pCycles.length === 0) pCycles = reconstructed.primaryCycles;
              if (sCycles.length === 0) sCycles = reconstructed.sampleCycles;
              if (rCycles.length === 0) rCycles = reconstructed.recutCycles;

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
            dbPrimaryUps[groupId] = ss.primaryUps !== undefined ? ss.primaryUps : '';
            dbIsUpsConfirmed[groupId] = ss.isUpsConfirmed !== undefined ? ss.isUpsConfirmed : false;
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
  }, [jobId, selectedGroupIds, job, dispatch, hasLoadedFromDb, isUv]);

  // Immediate state synchronization callback
  const triggerImmediateSync = async (groupId, overrides = {}) => {
    if (!hasLoadedFromDb || !job) return;

    const finalQuantities = overrides.quantities !== undefined ? overrides.quantities : quantities[groupId];
    const finalSampleUps = overrides.sampleUps !== undefined ? overrides.sampleUps : sampleUps[groupId];
    const finalRunningCycles = overrides.runningCycles !== undefined ? overrides.runningCycles : runningCycles[groupId];
    const finalLocalLogs = overrides.localLogs !== undefined ? overrides.localLogs : localLogs.filter(log => log.groupId === groupId);
    const finalSampleInputs = overrides.sampleInputs !== undefined ? overrides.sampleInputs : sampleInputs[groupId];
    const finalPrimaryUnlocked = overrides.primaryUnlocked !== undefined ? overrides.primaryUnlocked : primaryUnlocked[groupId];
    const finalPrimaryUps = overrides.primaryUps !== undefined ? overrides.primaryUps : (primaryUps[groupId] !== undefined ? primaryUps[groupId] : '');
    const finalIsUpsConfirmed = overrides.isUpsConfirmed !== undefined ? overrides.isUpsConfirmed : (isUpsConfirmed[groupId] !== undefined ? isUpsConfirmed[groupId] : false);
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

      dispatch(fetchShopFloorJobs({
        ...(job?.process_name ? { process_name: job.process_name } : { department: job?.department || (isUv ? 'UV Printing' : 'Assembly Labour') }),
        exclude_completed: 'true'
      }));
    } catch (err) {
      console.error("Immediate sync session state failed in dynamic screen:", err);
    }
  };

  // Debounced Autosave Effect
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
          primaryUps: primaryUps[groupId] !== undefined ? primaryUps[groupId] : '',
          isUpsConfirmed: isUpsConfirmed[groupId] !== undefined ? isUpsConfirmed[groupId] : false,
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
            dispatch(fetchShopFloorJobs({
              ...(job?.process_name ? { process_name: job.process_name } : { department: job?.department || (isUv ? 'UV Printing' : 'Assembly Labour') }),
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
    excessConfirmed,
    isUv,
    getGroupStats
  ]);

  // Window Unload Sync
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
          primaryUps: primaryUps[groupId] !== undefined ? primaryUps[groupId] : '',
          isUpsConfirmed: isUpsConfirmed[groupId] !== undefined ? isUpsConfirmed[groupId] : false,
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
    dispatch,
    isUv,
    getGroupStats
  ]);

  // Stopwatch timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setGroupTimers(prev => {
        const next = { ...prev };
        let hasChanges = false;
        
        selectedGroupIds.forEach(id => {
          if (!next[id]) {
            next[id] = { overall: 0, sample: 0, primary: 0, recut: 0 };
            hasChanges = true;
          } else if (next[id].recut === undefined) {
            next[id] = { ...next[id], recut: 0 };
            hasChanges = true;
          }

          const running = runningCycles[id];
          if (!running) return;

          const isSampling = running.status === 'RUNNING';
          const isPrimary = running.status === 'PRODUCTION_RUNNING';
          const isRecutRunning = running.status === 'RECUT_RUNNING';

          if (isSampling || isPrimary || isRecutRunning) {
            next[id] = { ...next[id] };
            next[id].overall += 1;
            hasChanges = true;
          }

          if (isSampling && running.startTime) {
            const startTs = typeof running.startTime === 'number' ? running.startTime : new Date(running.startTime).getTime();
            const elapsedSec = isNaN(startTs) ? 0 : Math.floor((Date.now() - startTs) / 1000);
            next[id].sample = Math.max(0, elapsedSec);
          }

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

          if (isRecutRunning && running.startTime) {
            next[id].recut = Math.floor((Date.now() - running.startTime) / 1000);
          }
        });

        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningCycles, job, selectedGroupIds]);

  // Log activity callback
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

  // Completion confirmation handler
  const handleConfirmCompletion = async (groupId, targetQty, totalGoodHandedOver, mg) => {
    const choice = localReturnExcessChoice || 'no';

    setIsConfirmingCompletion(true);
    try {
      const isYes = choice === 'yes';

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

      const sameSheetRecutQty = groupRecutOptions.reduce((acc, opt) => {
        if (opt.type === 'same sheet') {
          const optGood = (opt.cycles || []).reduce((cAcc, c) => cAcc + (c.good_qty || 0), 0);
          return acc + optGood;
        }
        return acc;
      }, 0);

      const finalRejectedQty = Math.max(0, totalRejectedQty - sameSheetRecutQty);

      const rejectionsList = [];
      if (totalRejectedQty > 0) {
        const sizeVal = mg?.materials?.[0]?.material_input?.size || '12x18';
        const dims = sizeVal.toLowerCase().replace('in', '').split('x');
        const w = parseFloat(dims[0]) || 12;
        const h = parseFloat(dims[1]) || 18;
        const sqinLost = totalRejectedQty * w * h;
        const sqftLost = sqinLost / 144;
        const estLoss = Math.round(sqinLost * 0.05);

        const hShift = String((mg?.assigned_shifts && mg.assigned_shifts.length > 0) ? mg.assigned_shifts[0] : (job?.assigned_shifts?.[0] || '1'));

        rejectionsList.push({
          material_name: mg?.group_name || "Unknown Material",
          size: sizeVal,
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
        
        dispatch(fetchShopFloorJobs({
          ...(job?.process_name ? { process_name: job.process_name } : { department: job?.department || 'Assembly' }),
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
      console.error("handleConfirmCompletion error in dynamic view:", error);
      toast.error(error?.message || "Server error completing job");
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!hasLoadedFromDb || (loading && !job)) {
    return (
      <div className="h-full flex items-center justify-center p-20 bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-teal-500 animate-spin" />
          <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Process Session...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center p-20 bg-[#f8fafc]">
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center max-w-lg shadow-xl">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-800 mb-4 uppercase">Job Not Found</h1>
          <p className="text-slate-400 text-sm mb-8">The job data could not be resolved. Please try reloading the pipeline.</p>
          <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto scrollbar scrollbar-thumb-slate-300 scrollbar-track-slate-100 scrollbar-w-2 pb-12">
        {selectedGroupIds.map(groupId => {
          let mg;
          const isCombinedGroup = groupId === 'COMBINED';
          
          if (isCombinedGroup) {
            const combinedInwardedGood = (bottleneckQty !== undefined && bottleneckQty !== null) ? bottleneckQty : ((job?.material_groups && job.material_groups.length > 0)
              ? Math.min(...job.material_groups.map(g => (g.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0)))
              : (job?.total_qty || 0));

            mg = {
              _id: 'COMBINED',
              group_id: 'COMBINED',
              group_name: 'FINAL ASSEMBLY',
              materials: [],
              inward_history: [{ good_qty: combinedInwardedGood }],
              assigned_shifts: job.assigned_shifts || [],
              cycles: 1,
              is_unlocked: true,
              sampling_on: job.material_groups?.some(g => g.sampling_on) || false,
              sheets_required: job.total_qty || 0,
              ups: 1
            };
          } else {
            mg = job.material_groups?.find(g => String(g._id) === String(groupId) || String(g.group_id) === String(groupId));
          }
          
          if (!mg) return null;

          const mainMat = mg.materials?.find(m => {
            const cat = m.category_type?.toLowerCase() || '';
            return !cat.includes('consumable') && !cat.includes('hardware');
          });

          const isSheetMaterial = mainMat?.material_type === 'sheet';
          const inwardGood = (mg.inward_history || []).reduce((acc, log) => acc + (log.good_qty || 0), 0);
          const inwardBad = (mg.inward_history || []).reduce((acc, log) => acc + (log.bad_qty || 0), 0);
          const size = mainMat?.material_input?.size || (isCombinedGroup ? 'FINAL ASSY' : '12X18IN');
          const sheetSize = `${mainMat?.material_input?.one_up_length || 0}"x${mainMat?.material_input?.one_up_width || 0}"`;

          const totalSheets = mainMat?.quantity || mg.sheets_required || (isCombinedGroup ? job.total_qty : 0);
          const outsourcedSheets = mg.assigned_outsource_sheets || 0;
          const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);
          const upsVal = mainMat?.material_input?.ups || mg.ups || 1;
          const inHouseQty = inHouseSheets * upsVal;

          const isInHouseJob = inwardGood >= totalSheets;
          const inHouseTargetQty = isInHouseJob
            ? (job?.total_qty || inHouseQty)
            : Math.max(0, (job?.total_qty || inHouseQty) - (outsourcedSheets * upsVal));

          const bom = job?.bom_id;
          let processesList = [];
          if (bom && bom.materialprocess) {
            const cleanName = (str) => (str || '').toLowerCase().replace(/^(section|group):\s*/i, '').trim();
            const gName = cleanName(mg.group_name || '');
            const processGroup = bom.materialprocess.find(p => {
              const pName = cleanName(p.material_group_name || p.group_name || '');
              return (pName && gName && (pName === gName || pName.includes(gName) || gName.includes(pName))) ||
                String(p.material_group_id || p.group_id || p._id) === String(groupId);
            }) || (bom.materialprocess.length === 1 ? bom.materialprocess[0] : null);

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
            currentProcessIndex = processesList.findIndex(p => {
              const name = p.process_name?.toLowerCase().trim() || '';
              const jName = job?.process_name?.toLowerCase().trim() || '';
              if (!name || !jName) return false;
              return name === jName || name.includes(jName) || jName.includes(name);
            });
            isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
          }

          const currentJobProcName = (job?.process_name || '').toLowerCase();
          const isCuttingJob = currentJobProcName.includes('laser') || currentJobProcName.includes('cutting');
          if (!isCuttingJob && (currentJobProcName.includes('paint') || currentJobProcName.includes('spray') || currentJobProcName.includes('assembly') || currentProcessIndex > 0)) {
            isSubsequent = true;
          }

          const targetQtyCalc = (isUv && isSheetMaterial && !isSubsequent) ? inHouseSheets : (isSheetMaterial ? (isSubsequent ? inHouseTargetQty : inHouseSheets) : inHouseTargetQty);
          const isInwardSheet = isSheetMaterial && (cuttingIndex === -1 || currentProcessIndex <= cuttingIndex);
          const inwardTargetQty = isInwardSheet ? inHouseSheets : inHouseTargetQty;
          const pendingInward = Math.max(0, inwardTargetQty - inwardGood);

          const isSampling = mg.sampling_on;

          const running = runningCycles[groupId];
          const groupPrimaryCycles = primaryCycles[groupId] || [];
          const completedCyclesList = groupPrimaryCycles.filter(c => c.status === 'Completed' || c.status === 'Completed/Handed Over' || c.end_time);
          const completedCount = completedCyclesList.length;
          const isSheetTarget = isSheetMaterial && !isSubsequent;
          const computedCurrentUps = isSheetTarget ? 1 : (parseInt(primaryUps[groupId]) || (running?.ups ? parseInt(running.ups) : 0));
          const samplePcs = (quantities[groupId]?.sample_good || 0) + (quantities[groupId]?.sample_reject || 0);
          const totalSample = isSheetTarget ? Math.ceil(samplePcs / upsVal) : samplePcs;

          let targetAccountedSoFar = 0;
          if (completedCount > 0) {
            if (isSheetTarget) {
              targetAccountedSoFar = totalSample + completedCount;
            } else {
              const firstCycleUps = parseInt(completedCyclesList[0].ups) || computedCurrentUps;
              targetAccountedSoFar = Math.max(totalSample, firstCycleUps);
              for (let i = 1; i < completedCount; i++) {
                targetAccountedSoFar += (parseInt(completedCyclesList[i].ups) || computedCurrentUps);
              }
            }
          } else {
            targetAccountedSoFar = totalSample;
          }

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
          const isJobCompleted = totalGoodHandedOver >= targetQtyCalc || job?.status === 'Completed' || mg.status === 'Completed';

          const hShift = String((mg.assigned_shifts && mg.assigned_shifts.length > 0) ? mg.assigned_shifts[0] : (job.assigned_shifts?.[0] || '1'));
          const hThemes = {
            '1': { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', dot: 'bg-teal-500' },
            '2': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-orange-500' },
            '3': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', dot: 'bg-purple-500' }
          };
          const hTheme = hThemes[hShift] || hThemes['2'];

          const sizeDims = {
            w: parseFloat(size.toLowerCase().replace('in', '').split('x')[0]) || 12,
            h: parseFloat(size.toLowerCase().replace('in', '').split('x')[1]) || 18
          };

          return (
            <div key={groupId} className="mb-8 border-b border-slate-200 pb-8 last:border-b-0">
              {/* Tier 1: Substrate & Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-3 bg-[#0f172a] border-b border-slate-800 gap-2">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" />
                    <span className="text-[10px] font-black text-[#009688] uppercase tracking-[0.2em]">SUBSTRATE</span>
                  </div>

                  <div className="grid grid-cols-3 md:flex gap-2 md:gap-5">
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
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-md ml-2">
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
                <div className="bg-[#0f172a] px-3 md:px-8 py-2 grid grid-cols-4 md:grid-cols-7 gap-y-3 gap-x-2 md:gap-0.5 md:divide-x divide-slate-800 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">REQUIRED</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm md:text-base font-black text-white tracking-tighter">{inwardTargetQty}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{isInwardSheet ? 'sh' : 'pcs'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-3 md:col-span-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">INWARDED</span>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm md:text-base font-black text-[#009688]">{inwardGood}</span>
                        <CheckCircle2 className="w-3 h-3 text-[#009688]" />
                      </div>
                      <span className="text-slate-700 text-xs">·</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm md:text-base font-black text-rose-500">{inwardBad}</span>
                        <X className="w-3 h-3 text-rose-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t border-slate-800/80 pt-2 md:border-none md:pt-0">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">PLAN</span>
                    <span className="text-sm md:text-base font-black text-white tracking-tighter">{mg.cycles || 1}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t border-slate-800/80 pt-2 md:border-none md:pt-0">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">DONE</span>
                    <span className="text-sm md:text-base font-black text-amber-500 tracking-tighter">{completedCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t border-slate-800/80 pt-2 md:border-none md:pt-0">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">GOOD</span>
                    <span className="text-sm md:text-base font-black text-white tracking-tighter">{goodCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t border-slate-800/80 pt-2 md:border-none md:pt-0">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">REASSEMBLES</span>
                    <span className="text-sm md:text-base font-black text-white tracking-tighter">{recutsCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-4 md:col-span-1 border-t border-slate-800/80 pt-2 md:border-none md:pt-0">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] mb-0.5">TIME</span>
                    <span className="text-base md:text-xl font-black text-cyan-400 font-mono tracking-tighter">
                      {formatTime(groupTimers[groupId]?.overall || 0)}
                    </span>
                  </div>
                </div>

              {/* Tier 3: Job Identification */}
              <div className="bg-white px-3 md:px-8 py-2.5 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-3 flex-wrap">
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
                        className={`px-3 py-1 rounded-full border flex items-center gap-2 transition-colors ${
                          mg.is_unlocked === false
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

              {/* Main Process Input Form */}
              <div className="min-h-0 flex-1">
                <AssemblyProcessInputForm
                  type={floor?.name || 'Assembly Labour'}
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
                  users={activeOperators}
                  sampleCycles={sampleCycles[groupId] || []}
                  setSampleCycles={setSampleCycles}
                  primaryCycles={primaryCycles[groupId] || []}
                  setPrimaryCycles={setPrimaryCycles}
                  recutCycles={recutCycles[groupId] || []}
                  setRecutCycles={setRecutCycles}
                  setReassembleCycles={setRecutCycles}
                  triggerImmediateSync={triggerImmediateSync}
                />
              </div>

              {/* Excess Sheet Confirmation Modal */}
              {(() => {
                const hasMetTarget = totalGoodHandedOver >= targetQtyCalc;
                const isConfirmed = !!excessConfirmed[groupId]?.confirmed;
                const showCompletionModal = hasMetTarget && !isConfirmed;

                if (!showCompletionModal) return null;

                return (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
                      <div className="absolute -top-12 -left-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
                      
                      <div className="w-16 h-16 rounded-[1.5rem] bg-amber-50 flex items-center justify-center border border-amber-100 mb-6 shadow-sm">
                        <Package className="w-8 h-8 text-amber-500" />
                      </div>

                      <h2 className="text-xl font-[1000] text-slate-800 uppercase tracking-wider mb-2">Excess Sheet Confirmation</h2>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full mb-6 border border-amber-100/55">
                        Target Met: {totalGoodHandedOver} / {targetQtyCalc} pcs complete
                      </p>

                      <p className="text-sm font-semibold text-slate-600 mb-8 max-w-sm">
                        Do you want to return excess stock to inventory?
                      </p>

                      <div className="grid grid-cols-2 gap-4 w-full mb-6">
                        <label className={`flex flex-col items-center justify-center p-5 border-2 rounded-[2rem] cursor-pointer transition-all select-none ${localReturnExcessChoice === 'yes'
                          ? 'bg-teal-50/50 border-teal-500 text-teal-700 shadow-md shadow-teal-500/5'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                          }`}>
                          <input
                            type="radio"
                            name={`return-excess-dynamic-${groupId}`}
                            value="yes"
                            checked={localReturnExcessChoice === 'yes'}
                            onChange={() => {
                              setLocalReturnExcessChoice('yes');
                              const defaultQty = Math.max(0, totalGoodHandedOver - targetQtyCalc) || 1;
                              const defaultSqft = parseFloat(((defaultQty * sizeDims.w * sizeDims.h) / 144).toFixed(3)) || 0;
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
                            name={`return-excess-dynamic-${groupId}`}
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
                                  const calculatedSqft = parseFloat(((val * sizeDims.w * sizeDims.h) / 144).toFixed(3)) || 0;
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

                      <button
                        onClick={() => handleConfirmCompletion(groupId, targetQtyCalc, totalGoodHandedOver, mg)}
                        disabled={isConfirmingCompletion}
                        className="w-full py-4 bg-[#0c1a2e] text-white text-[11px] font-[1000] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isConfirmingCompletion ? 'Syncing Completion...' : 'CONFIRM & COMPLETE JOB →'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Local Modals */}
      <MaterialInwardModal
        isOpen={isInwardModalOpen}
        onClose={() => {
          setIsInwardModalOpen(false);
          setActiveModalGroupId(null);
        }}
        job={job}
        materialGroup={job?.material_groups?.find(g => String(g._id || g.group_id) === String(activeModalGroupId))}
      />
    </div>
  );
};

export default AssemblyProcessScreen;
