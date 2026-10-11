import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Loader2,
  Flag,
  FileText
} from 'lucide-react';

import HeaderPill from './components/HeaderPill';
import ActionPill from './components/ActionPill';
import OutsourceManager from './components/OutsourceManager';
import CompletedJobsView from './components/CompletedJobsView';
import InventoryPanel from './components/InventoryPanel';
import ReadyJobsPanel from './components/ReadyJobsPanel';
import MaterialRequisitionPanel from './components/MaterialRequisitionPanel';
import ImageLightbox from '../common/ImageLightbox';

import AssemblyBayHead from './AssemblyBayHead';
import AssemblyBayOperator from './AssemblyBayOperator';
import AssemblyBayMobileView from './components/AssemblyBayMobileView';
import AssemblyBayCompletedMobileView from './components/AssemblyBayCompletedMobileView';

import { fetchShopFloorJobs, updateShopFloorJobStatus } from '../../reducer/shopFloorReducer';
import { getAllControlTowerDepts } from '../../reducer/controlTowerReducer';
import { getAllProcesses } from '../../reducer/processReducer';
import { viewUserShiftDetails } from '../../reducer/shiftReducer';
import { getAllTeams } from '../../reducer/teamReducer';
import { getAllDepartments } from '../../reducer/departmentReducer';
import { getUser, getUserRole, getIsHead } from '../../utils/permission/auth';
import { shopFloorColors } from '../../utils/teamColors';
import { toast } from 'react-toastify';

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return new Date(dateStr);
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  return new Date(dateStr);
};

export default function AssemblyBay() {
  const dispatch = useDispatch();

  const role = getUserRole();
  const user = getUser();
  const isHead = getIsHead();
  const isAdmin = role?.toLowerCase()?.includes('admin') || role?.toLowerCase() === 'super admin' || role?.toLowerCase() === 'superadmin';
  const isOperator = !isHead && !isAdmin;

  const { depts } = useSelector((state) => state.controlTower);
  const { jobs: allJobs, loading } = useSelector((state) => state.shopFloor);
  const { userShiftDetails } = useSelector((state) => state.shift || {});
  const { teams } = useSelector((state) => state.team || {});
  const { departments } = useSelector((state) => state.department || {});
  const allProcesses = useSelector((state) => state.process.processes || []);

  const [selectedJob, setSelectedJob] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const [selectedProcess, setSelectedProcess] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState(null);
  const [currentView, setCurrentView] = useState('BOARD'); // 'BOARD' or 'COMPLETED'
  const [showReadyJobsPanel, setShowReadyJobsPanel] = useState(false);
  const [showInventoryPanel, setShowInventoryPanel] = useState(false);
  const [showRequisitionPanel, setShowRequisitionPanel] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Stable userId — avoids re-firing shift dispatch on every render
  const userId = useMemo(() => user?._id || user?.id, [user]);

  useEffect(() => {
    if (userId) {
      dispatch(viewUserShiftDetails(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!depts || depts.length === 0) {
      dispatch(getAllControlTowerDepts());
    }
  }, [dispatch, depts]);

  // Fetch processes only once on mount
  useEffect(() => {
    if (allProcesses.length === 0) {
      dispatch(getAllProcesses({ is_active: true }));
    }
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const assemblyDept = useMemo(() => {
    return depts.find(d => (d.name || '').toLowerCase().includes('assembly'));
  }, [depts]);

  // Fetch real departments to get Mongo ID for Team Builder
  useEffect(() => {
    if (!departments || departments.length === 0) {
      dispatch(getAllDepartments({ is_active: "true" }));
    }
  }, [dispatch, departments]);

  const teamBuilderDept = useMemo(() => {
    return (departments || []).find(d => (d.name || '').toLowerCase().includes('assembly'));
  }, [departments]);

  useEffect(() => {
    if (teamBuilderDept?._id || teamBuilderDept?.id) {
      dispatch(getAllTeams({ department: teamBuilderDept._id || teamBuilderDept.id, is_active: true, limit: 100 }));
    }
  }, [dispatch, teamBuilderDept]);

  const deptName = assemblyDept ? assemblyDept.name : 'Assembly Labour';

  const machines = useMemo(() => {
    return (teams || [])
      .filter(t => t.is_active === true)
      .map(t => t.team_name)
      .filter(Boolean);
  }, [teams]);

  const processes = useMemo(() => {
    const deptProcesses = (assemblyDept?.processes || []).filter(Boolean);
    const additional = allProcesses.filter(p => {
      const name = (p.name || '').toLowerCase();
      const pDeptName = (p.department || '').toLowerCase();
      const isAssemblyLabour = (name.includes('assembly') || name.includes('labour')) && pDeptName.includes('assembly');
      const exists = deptProcesses.some(dp => String(dp._id || dp.id) === String(p._id || p.id));
      return isAssemblyLabour && !exists;
    });
    return [...deptProcesses, ...additional];
  }, [assemblyDept, allProcesses]);

  const operatorShiftNum = useMemo(() => {
    if (!userShiftDetails?.current_shift?.name) return null;
    const name = userShiftDetails.current_shift.name.toLowerCase();
    if (name.includes('morning') || name.includes('shift 1') || name === '1') return 1;
    if (name.includes('evening') || name.includes('afternoon') || name.includes('shift 2') || name === '2') return 2;
    if (name.includes('night') || name.includes('shift 3') || name === '3') return 3;
    if (name.includes('general')) return 1;
    return null;
  }, [userShiftDetails]);

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

    machines.forEach((m, idx) => {
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
  }, [machines]);

  const jobs = useMemo(() => {
    if (!processes || processes.length === 0) {
      return (allJobs || []).filter(j =>
        (j.department || '').toLowerCase().includes('assembly') ||
        (j.process_name || '').toLowerCase().includes('assembly')
      );
    }
    return (allJobs || []).filter(j =>
      processes.some(p => String(p?._id || p?.id || '') === String(j.process_id) || p?.name === j.process_name) ||
      (j.department || '').toLowerCase().includes('assembly') ||
      (j.process_name || '').toLowerCase().includes('assembly')
    );
  }, [allJobs, processes]);

  const isJobCompleted = useCallback((job) => {
    if (job.status === 'Completed') return true;
    if (!job.material_groups || job.material_groups.length === 0) return false;
    return job.material_groups.every(mg => mg.status === 'Completed');
  }, []);

  const operatorTeams = useMemo(() => {
    if (!user || !teams) return [];
    const uid = String(user._id || user.id);
    return teams
      .filter(t => t.is_active === true)
      .filter(t => t.member_list?.some(m => {
        let mId = m;
        if (m && typeof m === 'object') {
          mId = m._id || m.id || m.$oid || m.value || m.user_id || m;
        }
        return String(mId) === uid;
      }))
      .map(t => t.team_name);
  }, [user, teams]);

  const operatorJobs = useMemo(() => {
    if (!isOperator) return jobs;

    if (operatorTeams.length > 0) {
      return jobs.filter(j => {
        const inHouseShifts = (j.assigned_shifts || []).filter(s => operatorTeams.includes(s));
        const hasGroupInHouse = j.material_groups?.some(mg =>
          (mg.assigned_shifts || []).some(s => operatorTeams.includes(s))
        );
        return inHouseShifts.length > 0 || hasGroupInHouse;
      });
    }

    let activeShifts = (machines || []).map((_, i) => i + 1);
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
  }, [jobs, machines, operatorShiftNum, isOperator, operatorTeams]);

  const activeJobsBase = useMemo(() => {
    const jobsList = isOperator ? operatorJobs : jobs;
    return jobsList.filter(j => !isJobCompleted(j));
  }, [jobs, operatorJobs, isOperator, isJobCompleted]);

  const completedJobs = useMemo(() => {
    const jobsList = isOperator ? operatorJobs : jobs;
    let filtered = jobsList.filter(isJobCompleted);
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
  }, [jobs, operatorJobs, isOperator, isJobCompleted, selectedProcess, searchTerm]);

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

    return {
      dateChange: activeJobsBase.filter(j => j.is_date_changed).length,
      dueToday: activeJobsBase.filter(j => isToday(j.job_completion_date)).length,
      qtyChange: activeJobsBase.filter(j => j.is_qty_changed).length,
      onHold: activeJobsBase.filter(j => j.is_hold).length,
      escalated: activeJobsBase.filter(j => j.is_escalated).length,
      completed: completedJobs.length
    };
  }, [activeJobsBase, completedJobs]);

  const finalFilteredJobs = useMemo(() => {
    let filtered = activeJobsBase;

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
  }, [activeJobsBase, selectedProcess, searchTerm, activeHeaderFilter]);

  const queueJobs = useMemo(() => {
    return finalFilteredJobs.filter(j => {
      if (j.status === 'Completed') return false;
      // Job is in queue if not assigned to any of the dynamically generated teams
      const isAssigned =
        machines.some(teamName => j.assigned_shifts?.includes(teamName)) ||
        j.material_groups?.some(mg =>
          machines.some(teamName => mg.assigned_shifts?.includes(teamName))
        ) ||
        // Keep fallback logic if data is old and still uses numbers
        j.assigned_shifts?.some(s => s === 1 || s === 2 || s === 3) ||
        j.material_groups?.some(mg =>
          mg.assigned_shifts?.some(s => s === 1 || s === 2 || s === 3)
        );
      return !isAssigned;
    });
  }, [finalFilteredJobs, machines]);

  const getJobsForGroup = useCallback((groupName) => {
    return finalFilteredJobs.filter(j => {
      if (j.status === 'Completed') return false;
      return (
        j.assigned_shifts?.includes(groupName) ||
        j.material_groups?.some(mg => mg.assigned_shifts?.includes(groupName))
      );
    });
  }, [finalFilteredJobs]);

  // Keep a stable ref to the current process names so refreshData
  // doesn't need `processes` in its dependency array (prevents infinite loop).
  const processNamesRef = useRef('');
  useEffect(() => {
    const names = processes.map(p => p?.name).filter(Boolean).join(',');
    processNamesRef.current = names;
  }, [processes]);

  const currentViewRef = useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

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

    const processNames = processNamesRef.current || 'Assembly Labour,Assembly';
    const params = { process_name: processNames };
    if (currentViewRef.current === 'COMPLETED') {
      params.status = 'Completed';
    } else {
      params.exclude_completed = 'true';
    }
    dispatch(fetchShopFloorJobs(params));
  }, [dispatch]); // stable — reads process names from ref

  // Fetch jobs whenever currentView changes or processes list loads
  useEffect(() => {
    refreshData();
  }, [currentView, processes, refreshData]);

  useEffect(() => {
    if (selectedJob && jobs.length > 0) {
      const updated = jobs.find(j => j._id === selectedJob._id);
      if (updated) setSelectedJob(updated);
    }
  }, [jobs, selectedJob]);

  const handleImageClick = (url) => { setPreviewImage(url); };

  const totalColumns = 1 + (machines || []).length; // Queue + Team columns
  const isFlexible = totalColumns < 5;

  const colClass = isFlexible
    ? "flex-1 min-w-[200px]"
    : "flex-shrink-0 min-w-[280px] w-[310px]";

  return (
    <div className="bg-[#f1f5f9] flex flex-col overflow-hidden animate-fade-in" style={{ height: "calc(100vh - 80px)" }}>
      {/* Top Navbar (Common Header) */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-xs font-[1000] text-slate-800 tracking-wider uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 cursor-pointer" onClick={() => setCurrentView('BOARD')}>
              {deptName} ({isOperator ? 'Operator' : 'Head'})
            </span>

            {processes.length === 1 ? (
              <input
                type="text"
                readOnly
                value={processes[0].name}
                className="bg-slate-100 text-slate-800 text-[9px] font-[900] uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-1 outline-none shadow-sm cursor-default w-32 text-center"
              />
            ) : (
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-3 py-1 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all"
              >
                <option value="All">All Processes</option>
                {processes.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                ))}
              </select>
            )}

            <div className="relative mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="SEARCH JOB NO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-[1000] uppercase tracking-widest text-slate-700 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-300"
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
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HeaderPill
              label="DATE CHANGE"
              count={stats.dateChange}
              icon={<Calendar className="w-3 h-3" />}
              bgColor="bg-[#fee2e2]"
              borderColor="border-[#ef4444]"
              textColor="text-[#991b1b]"
              isActive={activeHeaderFilter === 'DATE_CHANGE'}
              disabled={stats.dateChange === 0}
              onClick={() => setActiveHeaderFilter('DATE_CHANGE')}
            />
            <HeaderPill
              label="DUE TODAY"
              count={stats.dueToday}
              icon={<AlertCircle className="w-3 h-3" />}
              bgColor="bg-[#dbeafe]"
              borderColor="border-[#3b82f6]"
              textColor="text-[#1e40af]"
              isActive={activeHeaderFilter === 'DUE_TODAY'}
              disabled={stats.dueToday === 0}
              onClick={() => setActiveHeaderFilter('DUE_TODAY')}
            />
            <HeaderPill
              label="QTY CHANGE"
              count={stats.qtyChange}
              icon={<Package className="w-3 h-3" />}
              bgColor="bg-[#f3e8ff]"
              borderColor="border-[#a855f7]"
              textColor="text-[#6b21a8]"
              isActive={activeHeaderFilter === 'QTY_CHANGE'}
              disabled={stats.qtyChange === 0}
              onClick={() => setActiveHeaderFilter('QTY_CHANGE')}
            />
            <HeaderPill
              label="ON HOLD"
              count={stats.onHold}
              icon={<Clock className="w-3 h-3" />}
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              textColor="text-orange-600"
              isActive={activeHeaderFilter === 'ON_HOLD'}
              disabled={stats.onHold === 0}
              onClick={() => setActiveHeaderFilter('ON_HOLD')}
            />
            <HeaderPill
              label="ESCALATED"
              count={stats.escalated}
              icon={<Flag className="w-3 h-3" />}
              bgColor="bg-rose-50"
              borderColor="border-rose-200"
              textColor="text-rose-600"
              isActive={activeHeaderFilter === 'ESCALATED'}
              disabled={stats.escalated === 0}
              onClick={() => setActiveHeaderFilter('ESCALATED')}
            />
            {activeHeaderFilter && (
              <button
                onClick={() => setActiveHeaderFilter(null)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-slate-700 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg animate-in fade-in zoom-in duration-200 whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                SHOW ALL
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-0.5" />

          <ActionPill
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
            label="READY JOBS"
            onClick={() => setShowReadyJobsPanel(true)}
          />
          <ActionPill
            icon={<Package className="w-3.5 h-3.5 text-amber-500" />}
            label="INVENTORY"
            onClick={() => setShowInventoryPanel(true)}
          />
          <ActionPill
            icon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
            label="REQUISITION"
            onClick={() => setShowRequisitionPanel(true)}
          />
          <ActionPill
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
            label="COMPLETED"
            count={stats.completed}
            isActive={currentView === 'COMPLETED'}
            onClick={() => setCurrentView(currentView === 'COMPLETED' ? 'BOARD' : 'COMPLETED')}
          />

          <button
            onClick={() => {
              setSyncing(true);
              refreshData();
              setTimeout(() => setSyncing(false), 1000);
            }}
            disabled={syncing}
            className={`flex items-center gap-2 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-all text-[8px] font-black uppercase tracking-widest text-white ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-hidden ${isOperator ? '' : 'px-4 pt-4 pb-2'}`}>
        {currentView === 'COMPLETED' ? (
          isMobile ? (
            <AssemblyBayCompletedMobileView
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
          isMobile ? (
            <AssemblyBayMobileView
              jobs={finalFilteredJobs}
              machines={machines}
              operatorTeams={operatorTeams}
              processColors={processColors}
              onImageClick={handleImageClick}
              refreshData={refreshData}
              floor={assemblyDept}
              activeProcessIds={processes.map(o => String(o?._id || o?.id || ''))}
              loading={loading}
            />
          ) : (
          <AssemblyBayOperator
            jobs={finalFilteredJobs}
            machines={machines}
            operatorTeams={operatorTeams}
            processColors={processColors}
            onImageClick={handleImageClick}
            refreshData={refreshData}
            floor={assemblyDept}
            activeProcessIds={processes.map(o => String(o?._id || o?.id || ''))}
          />
          )
        ) : loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mb-4" />
            <p className="text-xs font-[1000] text-slate-500 uppercase tracking-widest animate-pulse">Loading Jobs...</p>
          </div>
        ) : currentView === 'BOARD' ? (
          <AssemblyBayHead
            queueJobs={queueJobs}
            getJobsForGroup={getJobsForGroup}
            colClass={colClass}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            refreshData={refreshData}
            handleImageClick={handleImageClick}
            assemblyDept={assemblyDept}
            syncing={syncing}
            machines={machines}
            processColors={processColors}
          />
        ) : null}
      </div>

      {/* Slide-over Panels (Shared across views) */}
      <ReadyJobsPanel isOpen={showReadyJobsPanel} onClose={() => setShowReadyJobsPanel(false)} department={assemblyDept?.name || deptName} />
      <InventoryPanel
        isOpen={showInventoryPanel}
        onClose={() => setShowInventoryPanel(false)}
        department={assemblyDept?.name || deptName}
        processNames={processes.map(p => p?.name).filter(Boolean).join(',')}
        floor={assemblyDept}
      />
      <MaterialRequisitionPanel isOpen={showRequisitionPanel} onClose={() => setShowRequisitionPanel(false)} />

      <ImageLightbox src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
