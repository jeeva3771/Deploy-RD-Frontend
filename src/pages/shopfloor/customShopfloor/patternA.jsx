import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllControlTowerDepts } from '../../../reducer/controlTowerReducer';
import { fetchShopFloorJobs, updateShopFloorJobStatus } from '../../../reducer/shopFloorReducer';
import JobCard from '../components/JobCard';
import BoardColumn from '../components/BoardColumn';
import CompletedJobsView from '../components/CompletedJobsView';
import MobileCompletedJobsView from '../components/MobileCompletedJobsView';
import PatternAJobDetail from '../components/PatternAJobDetail';
import OutsourceManager from '../components/OutsourceManager';
import InventoryPanel from '../components/InventoryPanel';
import ReadyJobsPanel from '../components/ReadyJobsPanel';
import MaterialRequisitionPanel from '../components/MaterialRequisitionPanel';
import {
  Calendar,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCcw,
  Search,
  X,
  Clock,
  Flag,
  Scissors,
  FileText,
  Loader2
} from 'lucide-react';

import HeaderPill from '../components/HeaderPill';
import ActionPill from '../components/ActionPill';
import DynamicOperatorView from '../components/DynamicOperatorView';
import { shopFloorColors } from '../../../utils/teamColors';
import { getUserRole, getIsHead, getDepartmentName, getUser } from '../../../utils/permission/auth';
import { toast } from 'react-toastify';
import { viewUserShiftDetails } from '../../../reducer/shiftReducer';

export default function CustomPatternA() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { depts } = useSelector((state) => state.controlTower);
  const { jobs: allJobs, loading, completedCount: backendCompletedCount } = useSelector((state) => state.shopFloor);
  const { userShiftDetails } = useSelector((state) => state.shift || {});

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

  // JS-based mobile detection (matches OperatorView.jsx logic)
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!depts || depts.length === 0) {
      dispatch(getAllControlTowerDepts());
    }
  }, [dispatch, depts]);

  const currentDept = depts.find(d => {
    const slug = (d.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return location.pathname === `/shopfloor/${slug}`;
  });

  const deptName = currentDept ? currentDept.name : 'Automated Studio';

  const [selectedProcess, setSelectedProcess] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState(null);
  const [currentView, setCurrentView] = useState('BOARD'); // 'BOARD' or 'COMPLETED'
  const [syncing, setSyncing] = useState(false);
  const [showOutsourceManager, setShowOutsourceManager] = useState(false);
  const [showInventoryPanel, setShowInventoryPanel] = useState(false);
  const [showReadyJobsPanel, setShowReadyJobsPanel] = useState(false);
  const [showRequisitionPanel, setShowRequisitionPanel] = useState(false);

  const userObj = getUser();
  const userRoleName = String(userObj?.role || '').toLowerCase();
  const isSupervisorRole = (currentDept?.supervisors || []).filter(Boolean).map(s => String(s.name || s || '').toLowerCase()).includes(userRoleName);
  const isOperatorRole = (currentDept?.operators || []).filter(Boolean).map(o => String(o.name || o || '').toLowerCase()).includes(userRoleName);

  const role = getUserRole();
  const isHead = getIsHead();
  const dept = getDepartmentName();
  const isAdmin = role?.toLowerCase().includes('admin') || role?.toLowerCase() === 'super admin' || role?.toLowerCase() === 'superadmin';
  const isOperator = currentDept && (currentDept.operators || []).filter(Boolean).length > 0
    ? (isOperatorRole && !isAdmin)
    : (!isHead && !isAdmin && role?.toLowerCase().includes('operator'));

  const deptMachines = useMemo(() => (currentDept?.machines || []).filter(Boolean), [currentDept?.machines]);
  const deptProcesses = useMemo(() => (currentDept?.processes || []).filter(Boolean), [currentDept?.processes]);

  const processColors = useMemo(() => {
    const map = {};

    const getHashIndex = (str) => {
      if (!str || !shopFloorColors.length) return 0;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash) % shopFloorColors.length;
    };

    deptMachines.forEach((m, idx) => {
      const name = m?.trim().toUpperCase();
      if (name) {
        const colorIndex = idx;
        const color = shopFloorColors[colorIndex % shopFloorColors.length];
        map[name] = {
          bg: color.bg,
          border: color.border,
          text: color.text,
          pill: color.pill,
          bar: color.bar || 'bg-teal-500'
        };
      }
    });

    map['DEFAULT'] = {
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-slate-600',
      pill: 'bg-slate-100',
      bar: 'bg-teal-500'
    };

    map.getThemeForName = (name) => {
      const normalized = name?.trim().toUpperCase();
      if (map[normalized]) return map[normalized];

      const hashIdx = getHashIndex(normalized || '') % (shopFloorColors.length || 1);
      const color = shopFloorColors[hashIdx] || shopFloorColors[0];
      return {
        bg: color.bg,
        border: color.border,
        text: color.text,
        pill: color.pill,
        bar: color.bar || 'bg-teal-500'
      };
    };

    return map;
  }, [deptMachines]);



  // Removed duplicate useEffect for fetchShopFloorJobs as refreshData handles it

  const [selectedJob, setSelectedJob] = useState(null);

  const jobs = (allJobs || []).filter(j =>
    deptProcesses.some(p => String(p?._id || p?.id || '') === String(j.process_id) || p?.name === j.process_name)
  );
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    return new Date(dateStr);
  };

  const isJobCompleted = (job) => {
    if (job.status === 'Completed') return true;
    if (!job.material_groups || job.material_groups.length === 0) return false;
    return job.material_groups.every(mg => mg.status === 'Completed');
  };

  const operatorJobs = useMemo(() => {
    if (!isOperator) return jobs;
    let activeShifts = (deptMachines || []).map((_, i) => i + 1);
    if (operatorShiftNum) {
      activeShifts = [operatorShiftNum];
    }
    return jobs.filter(j => {
      const inHouseShifts = (j.assigned_shifts || []).filter(s => activeShifts.includes(s));
      const hasGroupInHouse = j.material_groups?.some(mg =>
        (mg.assigned_shifts || []).some(s => activeShifts.includes(s))
      );
      return inHouseShifts.length > 0 || hasGroupInHouse;
    });
  }, [jobs, isOperator, deptMachines, operatorShiftNum]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const d = parseDate(dateStr);
      if (!d || isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    };

    const activeJobs = operatorJobs.filter(j => !isJobCompleted(j));

    return {
      dateChange: activeJobs.filter(j => j.is_date_changed).length,
      dueToday: activeJobs.filter(j => isToday(j.job_completion_date)).length,
      qtyChange: activeJobs.filter(j => j.is_qty_changed).length,
      onHold: activeJobs.filter(j => j.is_hold).length,
      escalated: activeJobs.filter(j => j.is_escalated).length,
      completed: operatorJobs.filter(isJobCompleted).length
    };
  }, [operatorJobs]);

  const finalFilteredJobs = useMemo(() => {
    let filtered = operatorJobs.filter(j => !isJobCompleted(j));
    if (selectedProcess !== 'All') {
      filtered = filtered.filter(j => String(j.process_id) === String(selectedProcess));
    }
    if (searchTerm) {
      const s = searchTerm.toUpperCase();
      filtered = filtered.filter(j =>
        j.job_no?.toUpperCase().includes(s) ||
        j.sub_job_no?.toUpperCase().includes(s) ||
        `${j.job_no}/${j.sub_job_no}`.toUpperCase().includes(s)
      );
    }

    if (activeHeaderFilter === 'DUE_TODAY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(j => {
        if (!j.job_completion_date) return false;
        const d = parseDate(j.job_completion_date);
        if (!d || isNaN(d.getTime())) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (activeHeaderFilter === 'DATE_CHANGE') {
      filtered = filtered.filter(j => j.is_date_changed);
    } else if (activeHeaderFilter === 'QTY_CHANGE') {
      filtered = filtered.filter(j => j.is_qty_changed);
    } else if (activeHeaderFilter === 'ON_HOLD') {
      filtered = filtered.filter(j => j.is_hold);
    } else if (activeHeaderFilter === 'ESCALATED') {
      filtered = filtered.filter(j => j.is_escalated);
    }

    return filtered;
  }, [operatorJobs, selectedProcess, searchTerm, activeHeaderFilter]);

  const completedJobs = useMemo(() => {
    let filtered = operatorJobs.filter(isJobCompleted);
    if (selectedProcess !== 'All') {
      filtered = filtered.filter(j => String(j.process_id) === String(selectedProcess));
    }
    if (searchTerm) {
      const s = searchTerm.toUpperCase();
      filtered = filtered.filter(j =>
        j.job_no?.toUpperCase().includes(s) ||
        j.sub_job_no?.toUpperCase().includes(s) ||
        `${j.job_no}/${j.sub_job_no}`.toUpperCase().includes(s)
      );
    }
    return filtered;
  }, [operatorJobs, selectedProcess, searchTerm]);

  const queueJobs = finalFilteredJobs.filter(j => {
    if (j.status === 'Completed') return false;
    const isAssignedToProcess = (deptMachines || []).some((m, index) => {
      const shiftId = index + 1;
      return j.assigned_shifts?.includes(shiftId) ||
        j.material_groups?.some(mg => mg.assigned_shifts?.includes(shiftId));
    });
    return !isAssignedToProcess;
  });

  const getJobsForProcess = (machineName) => {
    const shiftId = (deptMachines || []).findIndex(m => m === machineName) + 1;
    return finalFilteredJobs.filter(j => {
      if (j.status === 'Completed') return false;
      return j.assigned_shifts?.includes(shiftId) ||
        j.material_groups?.some(mg => mg.assigned_shifts?.includes(shiftId));
    });
  };

  const outsourceJobs = finalFilteredJobs.filter(j => {
    if (j.status === 'Completed') return false;
    const maxShiftId = (deptMachines || []).length;
    return j.assigned_shifts?.some(s => s > maxShiftId) ||
      j.material_groups?.some(mg => mg.assigned_shifts?.some(s => s > maxShiftId) || mg.assigned_outsource_sheets > 0 || mg.is_outsource);
  });

  const refreshData = useCallback(async (jobId = null, updateData = null) => {
    if (jobId && updateData) {
      try {
        await dispatch(updateShopFloorJobStatus({ id: jobId, payload: updateData })).unwrap();
        toast.success("Job updated successfully");
      } catch (error) {
        console.error("Update error:", error);
        toast.error("Update failed: " + (error.message || "Unknown error"));
      }
    }

    const processNames = (deptProcesses || []).map(p => p?.name).filter(Boolean);
    const params = {
      process_name: processNames.join(',')
    };
    if (currentView === 'COMPLETED') {
      params.status = 'Completed';
    } else {
      params.exclude_completed = 'true';
    }
    dispatch(fetchShopFloorJobs(params));
  }, [dispatch, deptProcesses, currentView]);

  useEffect(() => {
    refreshData();
  }, [currentView, location.pathname, refreshData]);

  useEffect(() => {
    // Update selectedJob if it exists to reflect latest data
    if (selectedJob && jobs.length > 0) {
      const updated = jobs.find(j => j._id === selectedJob._id);
      if (updated) setSelectedJob(updated);
    }
  }, [jobs, selectedJob]);

  const handleJobClick = (job) => { setSelectedJob(job); };
  const handleImageClick = (url) => { console.log('Image clicked', url); };

  const totalColumns = 2 + (deptMachines || []).length;
  const isFlexible = totalColumns < 5;

  const colClass = isFlexible
    ? "flex-1 min-w-[200px]"
    : "flex-shrink-0 min-w-[280px] w-[310px]";

  return (
    <div className="bg-[#f1f5f9] flex flex-col overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
      {/* ── MOBILE HEADER: two scrollable rows (JS-controlled) ── */}
      {isMobileScreen && (<>
      {/* Row 1: Action Pills + Refresh */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 z-10 overflow-x-auto no-scrollbar">
        <ActionPill
          icon={<ShoppingCart className="w-3.5 h-3.5 text-slate-100" />}
          label="OUTSOURCE"
          count={outsourceJobs.length}
          onClick={() => setShowOutsourceManager(true)}
        />
        <ActionPill icon={<Scissors className="w-3.5 h-3.5 text-green-400" />} label="READY JOBS" onClick={() => setShowReadyJobsPanel(true)} />
        <ActionPill icon={<Package className="w-3.5 h-3.5 text-amber-500" />} label="INVENTORY" onClick={() => setShowInventoryPanel(true)} department={currentDept?.name} />
        <ActionPill icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} label="REQUISITION" onClick={() => setShowRequisitionPanel(true)} />
        <ActionPill
          icon={<CheckCircle2 className={`w-3.5 h-3.5 ${currentView === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-600'}`} />}
          label="COMPLETED"
          count={backendCompletedCount}
          onClick={() => setCurrentView('COMPLETED')}
        />

        <button
          onClick={() => {
            setSyncing(true);
            setTimeout(() => setSyncing(false), 1000);
          }}
          disabled={syncing}
          className={`ml-auto shrink-0 flex items-center gap-2 p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-all text-white ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Row 2: Dept/Process/Search only */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 z-10 overflow-x-auto no-scrollbar">
        <span className="text-xs font-[1000] text-slate-800 tracking-wider uppercase bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap shrink-0">
          {deptName}
        </span>

        {deptProcesses.length === 1 ? (
          <input
            type="text"
            readOnly
            value={deptProcesses[0].name}
            className="bg-slate-100 text-slate-800 text-[9px] font-[900] uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-1.5 outline-none shadow-sm cursor-default w-36 text-center shrink-0"
          />
        ) : (
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all shrink-0"
          >
            <option value="All">All Processes</option>
            {deptProcesses.map(p => (
              <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {!isOperator && (
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH JOB NO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-[1000] uppercase tracking-widest text-slate-700 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
      </>)}

      {/* ── DESKTOP HEADER: original single-row layout (JS-controlled) ── */}
      {!isMobileScreen && (
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-[1000] text-slate-800 tracking-wider uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {deptName}
            </span>
            {deptProcesses.length === 1 ? (
              <input type="text" readOnly value={deptProcesses[0].name} className="bg-slate-100 text-slate-800 text-[9px] font-[900] uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-1 outline-none shadow-sm cursor-default w-32 text-center" />
            ) : (
              <select value={selectedProcess} onChange={(e) => setSelectedProcess(e.target.value)} className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-3 py-1 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all">
                <option value="All">All Processes</option>
                {deptProcesses.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {!isOperator && (
              <div className="relative mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="SEARCH JOB NO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-4 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-[1000] uppercase tracking-widest text-slate-700 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-300" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HeaderPill label="DATE CHANGE" count={stats.dateChange} icon={<Calendar className="w-3 h-3" />} bgColor="bg-[#fee2e2]" borderColor="border-[#ef4444]" textColor="text-[#991b1b]" isActive={activeHeaderFilter === 'DATE_CHANGE'} disabled={stats.dateChange === 0} onClick={() => setActiveHeaderFilter('DATE_CHANGE')} />
            <HeaderPill label="DUE TODAY" count={stats.dueToday} icon={<AlertCircle className="w-3 h-3" />} bgColor="bg-[#dbeafe]" borderColor="border-[#3b82f6]" textColor="text-[#1e40af]" isActive={activeHeaderFilter === 'DUE_TODAY'} disabled={stats.dueToday === 0} onClick={() => setActiveHeaderFilter('DUE_TODAY')} />
            <HeaderPill label="QTY CHANGE" count={stats.qtyChange} icon={<Package className="w-3 h-3" />} bgColor="bg-[#f3e8ff]" borderColor="border-[#a855f7]" textColor="text-[#6b21a8]" isActive={activeHeaderFilter === 'QTY_CHANGE'} disabled={stats.qtyChange === 0} onClick={() => setActiveHeaderFilter('QTY_CHANGE')} />
            <HeaderPill label="ON HOLD" count={stats.onHold} icon={<Clock className="w-3 h-3" />} bgColor="bg-orange-50" borderColor="border-orange-200" textColor="text-orange-600" isActive={activeHeaderFilter === 'ON_HOLD'} disabled={stats.onHold === 0} onClick={() => setActiveHeaderFilter('ON_HOLD')} />
            <HeaderPill label="ESCALATED" count={stats.escalated} icon={<Flag className="w-3 h-3" />} bgColor="bg-rose-50" borderColor="border-rose-200" textColor="text-rose-600" isActive={activeHeaderFilter === 'ESCALATED'} disabled={stats.escalated === 0} onClick={() => setActiveHeaderFilter('ESCALATED')} />
            {activeHeaderFilter && (
              <button onClick={() => setActiveHeaderFilter(null)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-slate-700 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg animate-in fade-in zoom-in duration-200 whitespace-nowrap">
                <X className="w-3 h-3" />
                SHOW ALL
              </button>
            )}
          </div>
          <div className="h-6 w-px bg-gray-200 mx-0.5"></div>
          <ActionPill icon={<ShoppingCart className="w-3.5 h-3.5 text-slate-100" />} label="OUTSOURCE" count={outsourceJobs.length} onClick={() => setShowOutsourceManager(true)} />
          <ActionPill icon={<Scissors className="w-3.5 h-3.5 text-green-400" />} label="READY JOBS" onClick={() => setShowReadyJobsPanel(true)} />
          <ActionPill icon={<Package className="w-3.5 h-3.5 text-amber-500" />} label="INVENTORY" onClick={() => setShowInventoryPanel(true)} department={currentDept?.name} />
          <ActionPill icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} label="REQUISITION" onClick={() => setShowRequisitionPanel(true)} />
          <ActionPill icon={<CheckCircle2 className={`w-3.5 h-3.5 ${currentView === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-600'}`} />} label="COMPLETED" count={backendCompletedCount} onClick={() => setCurrentView('COMPLETED')} />
          <button
            onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 1000); }}
            disabled={syncing}
            className={`flex items-center gap-2 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-all text-[8px] font-black uppercase tracking-widest text-white ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-0 md:px-4 pt-0 md:pt-4 pb-0 md:pb-2">
        {currentView === 'COMPLETED' ? (
          isMobileScreen ? (
            <MobileCompletedJobsView
              jobs={completedJobs}
              processColors={processColors}
              onImageClick={handleImageClick}
              onBackToPipeline={() => setCurrentView('BOARD')}
            />
          ) : (
            <CompletedJobsView
              onClose={() => setCurrentView('BOARD')}
              jobs={completedJobs}
              processColors={processColors}
              onImageClick={handleImageClick}
            />
          )
        ) : isOperator ? (
          <DynamicOperatorView
            jobs={finalFilteredJobs}
            machines={deptMachines}
            processColors={processColors}
            onImageClick={handleImageClick}
            refreshData={refreshData}
            floor={currentDept}
            activeProcessIds={deptProcesses.map(p => String(p?._id || p?.id || ''))}
          />
        ) : loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mb-4" />
            <p className="text-xs font-[1000] text-slate-500 uppercase tracking-widest animate-pulse">Loading Jobs...</p>
          </div>
        ) : currentView === 'BOARD' ? (
          <div className="h-full flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent scroll-auto">
            {/* QUEUE Column */}
            <div className={`h-full flex flex-col bg-[#cbd5e1]/30 rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden pb-5 ${colClass}`}>
              <div className="px-5 py-4 flex justify-between items-center border-b border-gray-200 bg-white/50">
                <h3 className="text-[11px] font-black tracking-widest text-[#64748b] uppercase">QUEUE</h3>
                <span className="bg-white/80 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-200">{queueJobs.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                <div className="p-4 pb-6 space-y-4">
                  {queueJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={{
                        ...job,
                        id: `${job.job_no}/${job.sub_job_no}`,
                        customer: job.client_name,
                        color: 'bg-blue-400',
                      }}
                      onClick={() => handleJobClick(job)}
                      onImageClick={handleImageClick}
                      isActive={selectedJob?._id === job._id}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* DYNAMIC PROCESS COLUMNS */}
            {(deptMachines || []).map((machine, idx) => {
              const processJobs = getJobsForProcess(machine);
              const colors = [
                { dot: 'bg-[#3b82f6]', col: 'border-[#0ea5e9]/20 bg-[#f0f9ff]' },
                { dot: 'bg-[#f59e0b]', col: 'border-[#f59e0b]/20 bg-[#fffbeb]' },
                { dot: 'bg-[#8b5cf6]', col: 'border-[#8b5cf6]/20 bg-[#f5f3ff]' },
                { dot: 'bg-[#10b981]', col: 'border-[#10b981]/20 bg-[#ecfdf5]' }
              ];
              const colorTheme = colors[idx % colors.length];

              return (
                <BoardColumn
                  key={machine}
                  title={machine.toUpperCase()}
                  jobs={processJobs}
                  dotColor={colorTheme.dot}
                  count={processJobs.length}
                  color={`${colorTheme.col}`}
                  className={colClass}
                  onJobClick={handleJobClick}
                  onImageClick={handleImageClick}
                  selectedJobId={selectedJob?._id}
                />
              );
            })}

            <BoardColumn
              title="OUTSOURCE"
              jobs={outsourceJobs}
              dotColor="bg-[#ec4899]"
              count={outsourceJobs.length}
              color="border-[#ec4899]/20 bg-[#fdf2f8]"
              className={colClass}
              onJobClick={handleJobClick}
              onImageClick={handleImageClick}
              selectedJobId={selectedJob?._id}
            />
          </div>
        ) : null}
      </div>

      {/* Right Detail Panel */}
      {currentView === 'BOARD' && selectedJob && (
        <div className={syncing ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          <PatternAJobDetail
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            refreshData={refreshData}
            onImageClick={handleImageClick}
            machines={currentDept?.machines || []}
          />
        </div>
      )}

      {/* Slide-over Panels */}
      <OutsourceManager
        isOpen={showOutsourceManager}
        onClose={() => setShowOutsourceManager(false)}
        jobs={allJobs}
        refreshData={() => {
          const pNames = (currentDept?.processes || []).map(p => p.name).filter(Boolean);
          dispatch(fetchShopFloorJobs({ process_name: pNames.join(','), exclude_completed: 'true' }));
        }}
      />
      <ReadyJobsPanel isOpen={showReadyJobsPanel} onClose={() => setShowReadyJobsPanel(false)} department={currentDept?.name || deptName} />
      <InventoryPanel
        isOpen={showInventoryPanel}
        onClose={() => setShowInventoryPanel(false)}
        department={currentDept?.name}
        processNames={(currentDept?.processes || []).map(p => p.name).filter(Boolean).join(',')}
        floor={currentDept}
      />
      <MaterialRequisitionPanel isOpen={showRequisitionPanel} onClose={() => setShowRequisitionPanel(false)} />
    </div>
  );
}