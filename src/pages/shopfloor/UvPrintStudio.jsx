import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  ShoppingCart,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCcw,
  Scissors,
  FileText,
  Printer,
  Search,
  X,
  HelpCircle,
  Flag,
  Clock,
  Loader2
} from 'lucide-react';

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-3">
    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
    <span className="text-[10px] font-black text-[#475569] uppercase tracking-wider">{label}</span>
  </div>
);

import UvJobDetail from './components/UvJobDetail';
import HeaderPill from './components/HeaderPill';
import ActionPill from './components/ActionPill';
import OutsourceManager from './components/OutsourceManager';
import BoardColumn from './components/BoardColumn';
import JobCard from './components/JobCard';
import ImageLightbox from '../common/ImageLightbox';
import ReadyJobsPanel from './components/ReadyJobsPanel';
import InventoryPanel from './components/InventoryPanel';
import MaterialRequisitionPanel from './components/MaterialRequisitionPanel';
import { fetchShopFloorJobs, syncShopFloorJobs, updateShopFloorJobStatus, fetchShopFloorJobById } from '../../reducer/shopFloorReducer';
import OperatorView from './components/OperatorView';
import CompletedJobsView from './components/CompletedJobsView';
import { getUserRole, getIsHead, getDepartmentName } from '../../utils/permission/auth';
import { getAllProcesses } from '../../reducer/processReducer';
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
      // DD-MM-YYYY -> YYYY-MM-DD
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  return new Date(dateStr);
};

const UvPrintStudio = () => {
  const dispatch = useDispatch();
  const { jobs: allJobs, completedCount: backendCompletedCount, loading } = useSelector((state) => state.shopFloor);
  const { processes = [] } = useSelector((state) => state.process);

  const uvDepartment = useMemo(() => {
    const uvProc = (processes || []).find(p => p.is_uv || p.name?.toLowerCase().includes('uv') || p.name?.toUpperCase().includes('HANDTOP') || p.name?.toUpperCase().includes('MIMAKI'));
    return uvProc ? uvProc.department : 'Print';
  }, [processes]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOutsourceManager, setShowOutsourceManager] = useState(false);
  const [showReadyJobsPanel, setShowReadyJobsPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showInventoryPanel, setShowInventoryPanel] = useState(false);
  const [showRequisitionPanel, setShowRequisitionPanel] = useState(false);
  const [currentView, setCurrentView] = useState('BOARD'); // 'BOARD' or 'COMPLETED'

  const role = getUserRole();
  const isHead = getIsHead();
  const dept = getDepartmentName();
  const isAdmin = role?.toLowerCase() === 'admin';
  const isUvOperator = dept === 'UV Printing' && !isHead && !isAdmin;

  // JS-based mobile detection (matches patternA.jsx & OperatorView.jsx)
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter processes to only show UV Printing specific ones
  const uvProcesses = useMemo(() => {
    return (processes || []).filter(p =>
      p.name.toUpperCase().includes('HANDTOP') ||
      p.name.toUpperCase().includes('HANTOP') ||
      p.name.toUpperCase().includes('MIMAKI')
    );
  }, [processes]);

  const jobs = useMemo(() => {
    return (allJobs || []).filter(j =>
      j.process_name?.toUpperCase().includes('HANDTOP') ||
      j.process_name?.toUpperCase().includes('HANTOP') ||
      j.process_name?.toUpperCase().includes('MIMAKI')
    );
  }, [allJobs]);

  const processColors = useMemo(() => {
    const map = {};
    uvProcesses.forEach((p, idx) => {
      let color;
      if (p.name.toUpperCase().includes('HANDTOP')) {
        color = shopFloorColors[1]; // Mint / Green
      } else if (p.name.toUpperCase().includes('MIMAKI')) {
        color = shopFloorColors[2]; // Lavender / Indigo
      } else {
        color = shopFloorColors[idx % shopFloorColors.length];
      }

      map[p.name.toUpperCase()] = {
        bg: color.bg,
        border: color.border,
        text: color.text,
        pill: color.pill,
        bar: color.bar || 'bg-indigo-500'
      };
    });

    map['DEFAULT'] = {
      bg: 'bg-white',
      border: 'border-transparent',
      text: 'text-gray-800',
      pill: 'bg-gray-100',
      bar: 'bg-indigo-500'
    };
    return map;
  }, [uvProcesses]);

  const getJobTheme = (processName) => {
    if (!processColors) return { bg: 'bg-white', border: 'border-transparent', text: 'text-gray-800', pill: 'bg-gray-100' };
    if (!processName) return processColors['DEFAULT'];
    const pName = processName.toUpperCase();

    // 1. Direct match
    if (processColors[pName]) return processColors[pName];

    // 2. Keyword match (Handtop / Hantop)
    if (pName.includes('HANDTOP') || pName.includes('HANTOP')) {
      const key = Object.keys(processColors).find(k => k.includes('HANDTOP') || k.includes('HANTOP'));
      if (key) return processColors[key];
    }

    // 3. Keyword match (Mimaki)
    if (pName.includes('MIMAKI')) {
      const key = Object.keys(processColors).find(k => k.includes('MIMAKI'));
      if (key) return processColors[key];
    }

    return processColors['DEFAULT'];
  };

  const [activeHeaderFilter, setActiveHeaderFilter] = useState(null); // 'DUE_TODAY', 'DATE_CHANGE', 'QTY_CHANGE'

  const isJobCompleted = (job) => {
    if (job.status === 'Completed') return true;
    if (!job.material_groups || job.material_groups.length === 0) return false;
    return job.material_groups.every(mg => mg.status === 'Completed');
  };

  const baseFilteredJobs = useMemo(() => {
    let filtered = jobs.filter(j => !isJobCompleted(j));

    // Primary Filter: Only show jobs belonging to specified UV processes
    filtered = filtered.filter(j =>
      j.process_name?.toUpperCase().includes('HANDTOP') ||
      j.process_name?.toUpperCase().includes('HANTOP') ||
      j.process_name?.toUpperCase().includes('MIMAKI')
    );

    // If operator, only show in-house assigned jobs (Shifts 1, 2)
    if (isUvOperator) {
      filtered = filtered.filter(j => {
        const inHouseShifts = (j.assigned_shifts || []).filter(s => s === 1 || s === 2);
        const hasGroupInHouse = j.material_groups?.some(mg =>
          (mg.assigned_shifts || []).some(s => s === 1 || s === 2)
        );
        return (inHouseShifts.length > 0 || hasGroupInHouse);
      });
    }

    if (selectedProcess !== 'All') {
      filtered = filtered.filter(j => j.process_name?.toUpperCase() === selectedProcess.toUpperCase());
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
  }, [jobs, selectedProcess, searchTerm, isUvOperator]);

  const finalFilteredJobs = useMemo(() => {
    let filtered = baseFilteredJobs;

    // Header Filters
    if (activeHeaderFilter === 'DUE_TODAY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(j => {
        if (!j.job_completion_date) return false;
        const d = new Date(j.job_completion_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (activeHeaderFilter === 'DATE_CHANGE') {
      filtered = filtered.filter(j => j.is_date_changed);
    } else if (activeHeaderFilter === 'QTY_CHANGE') {
      filtered = filtered.filter(j => j.is_qty_changed);
    }
    return filtered;
  }, [baseFilteredJobs, activeHeaderFilter]);

  const completedJobs = useMemo(() => {
    let filtered = jobs.filter(isJobCompleted);
    filtered = filtered.filter(j =>
      j.process_name?.toUpperCase().includes('HANDTOP') ||
      j.process_name?.toUpperCase().includes('HANTOP') ||
      j.process_name?.toUpperCase().includes('MIMAKI')
    );

    if (selectedProcess !== 'All') {
      filtered = filtered.filter(j => j.process_name?.toUpperCase() === selectedProcess.toUpperCase());
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
  }, [jobs, selectedProcess, searchTerm]);

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

    const activeJobs = jobs.filter(j => !isJobCompleted(j));

    return {
      dateChange: activeJobs.filter(j => j.is_date_changed).length,
      dueToday: activeJobs.filter(j => isToday(j.job_completion_date)).length,
      qtyChange: activeJobs.filter(j => j.is_qty_changed).length,
      escalated: activeJobs.filter(j => j.is_escalated).length,
      onHold: activeJobs.filter(j => j.is_hold).length,
      completed: activeJobs.filter(j => j.status === 'Completed').length
    };
  }, [jobs]);

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

    const params = {
      department: uvDepartment,
      role: isUvOperator ? 'UV Printing Operator' : 'admin'
    };

    if (currentView === 'COMPLETED') {
      params.status = 'Completed';
    } else {
      params.exclude_completed = 'true';
    }

    dispatch(fetchShopFloorJobs(params));
  }, [dispatch, isUvOperator, currentView, uvDepartment]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await dispatch(syncShopFloorJobs()).unwrap();
      if (result.success) {
        toast.success(`Sync successful: Created ${result.results.created} new jobs`);
        refreshData();
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    dispatch(getAllProcesses({ is_active: true }));
  }, [dispatch]);

  useEffect(() => {
    refreshData();
  }, [currentView, refreshData]);

  useEffect(() => {
    // Update selectedJob if it exists to reflect latest data
    if (selectedJob && jobs.length > 0) {
      const updated = jobs.find(j => j._id === selectedJob._id);
      if (updated) setSelectedJob(updated);
    }
  }, [jobs, selectedJob]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    dispatch(fetchShopFloorJobById(job._id || job.id));
  };

  const handleImageClick = (imageUrl) => {
    setPreviewImage(imageUrl);
  };

  const getJobsForColumn = (type) => {
    let filteredJobs = finalFilteredJobs;

    // Header Filters
    if (activeHeaderFilter === 'DUE_TODAY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredJobs = filteredJobs.filter(j => {
        if (!j.job_completion_date) return false;
        const d = parseDate(j.job_completion_date);
        if (!d || isNaN(d.getTime())) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (activeHeaderFilter === 'DATE_CHANGE') {
      filteredJobs = filteredJobs.filter(j => j.is_date_changed);
    } else if (activeHeaderFilter === 'QTY_CHANGE') {
      filteredJobs = filteredJobs.filter(j => j.is_qty_changed);
    } else if (activeHeaderFilter === 'ESCALATED') {
      filteredJobs = filteredJobs.filter(j => j.is_escalated);
    } else if (activeHeaderFilter === 'ON_HOLD') {
      filteredJobs = filteredJobs.filter(j => j.is_hold);
    }

    const processed = filteredJobs.map(job => ({
      ...job,
      theme: getJobTheme(job.process_name)
    }));

    switch (type) {
      case 'QUEUE':
        return processed.filter(j => {
          if (j.status === 'Completed') return false;
          const hasUnassigned = j.material_groups?.some(mg => !mg.assigned_shifts || mg.assigned_shifts.length === 0);
          return hasUnassigned;
        });
      case 'HANDTOP':
        return processed.filter(j => (j.assigned_shifts?.includes(1) || j.material_groups?.some(mg => mg.assigned_shifts?.includes(1))) && j.status !== 'Completed');
      case 'MIMAKI':
        return processed.filter(j => (j.assigned_shifts?.includes(2) || j.material_groups?.some(mg => mg.assigned_shifts?.includes(2))) && j.status !== 'Completed');
      case 'OUTSOURCE':
        return processed.filter(j =>
          (j.assigned_shifts?.includes(3) ||
            j.material_groups?.some(mg => mg.assigned_shifts?.includes(3) || mg.outsource_assignments?.length > 0 || mg.assigned_outsource_sheets > 0)) &&
          j.status !== 'Completed'
        );
      default:
        return [];
    }
  };

  const queueJobs = getJobsForColumn('QUEUE');
  const handtopJobs = getJobsForColumn('HANDTOP');
  const mimakiJobs = getJobsForColumn('MIMAKI');
  const outsourceJobs = getJobsForColumn('OUTSOURCE');
  const completedCount = useMemo(() => jobs.filter(isJobCompleted).length, [jobs]);

  const currentTheme = useMemo(() => {
    return processColors[selectedProcess.toUpperCase()] || null;
  }, [selectedProcess, processColors]);

  return (
    <div className="bg-[#f1f5f9] flex flex-col overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
      {/* ── MOBILE HEADER: single scrollable row with all controls & filter pills ── */}
      {isMobileScreen && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 z-10 overflow-x-auto no-scrollbar whitespace-nowrap">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all shrink-0"
          >
            <option value="All">All UV Processes</option>
            {uvProcesses.map(p => (
              <option key={p._id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH JOB NO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-[1000] uppercase tracking-widest text-slate-700 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-300"
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

          <div className="h-5 w-px bg-gray-200 mx-0.5 shrink-0"></div>

          {/* Notification Filter Pills */}
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

          {activeHeaderFilter && (
            <button
              onClick={() => setActiveHeaderFilter(null)}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md shrink-0"
            >
              <X className="w-3 h-3" />
              SHOW ALL
            </button>
          )}

          <div className="h-5 w-px bg-gray-200 mx-0.5 shrink-0"></div>

          <ActionPill
            icon={<ShoppingCart className="w-3.5 h-3.5 text-blue-400" />}
            label="OUTSOURCE"
            count={outsourceJobs.length}
            onClick={() => setShowOutsourceManager(true)}
          />
          <ActionPill icon={<Scissors className="w-3.5 h-3.5 text-green-400" />} label="READY JOBS" onClick={() => setShowReadyJobsPanel(true)} />
          <ActionPill icon={<Package className="w-3.5 h-3.5 text-amber-500" />} label="INVENTORY" onClick={() => setShowInventoryPanel(true)} />
          <ActionPill icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} label="REQUISITION" onClick={() => setShowRequisitionPanel(true)} />
          <ActionPill
            icon={<CheckCircle2 className={`w-3.5 h-3.5 ${currentView === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-600'}`} />}
            label="COMPLETED"
            count={backendCompletedCount}
            onClick={() => setCurrentView(currentView === 'COMPLETED' ? 'BOARD' : 'COMPLETED')}
          />
        </div>
      )}

      {/* ── DESKTOP HEADER: single-row layout (JS-controlled) ── */}
      {!isMobileScreen && (
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-3 py-1 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all"
              >
                <option value="All">All UV Processes</option>
                {uvProcesses.map(p => (
                  <option key={p._id} value={p.name}>{p.name}</option>
                ))}
              </select>

              <div className="relative">
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

              {activeHeaderFilter && (
                <button
                  onClick={() => setActiveHeaderFilter(null)}
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[9px] font-[1000] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg animate-in fade-in zoom-in duration-200"
                >
                  <X className="w-3 h-3" />
                  SHOW ALL
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-gray-700 mx-1"></div>

            <ActionPill
              icon={<ShoppingCart className="w-3.5 h-3.5 text-blue-400" />}
              label="OUTSOURCE"
              count={outsourceJobs.length}
              onClick={() => setShowOutsourceManager(true)}
            />
            <ActionPill icon={<Scissors className="w-3.5 h-3.5 text-green-400" />} label="READY JOBS" onClick={() => setShowReadyJobsPanel(true)} />
            <ActionPill icon={<Package className="w-3.5 h-3.5 text-amber-500" />} label="INVENTORY" onClick={() => setShowInventoryPanel(true)} />
            <ActionPill icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} label="REQUISITION" onClick={() => setShowRequisitionPanel(true)} />
            <ActionPill
              icon={<CheckCircle2 className={`w-3.5 h-3.5 ${currentView === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-600'}`} />}
              label="COMPLETED"
              count={backendCompletedCount}
              onClick={() => setCurrentView(currentView === 'COMPLETED' ? 'BOARD' : 'COMPLETED')}
            />
          </div>
        </header>
      )}

      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${isUvOperator ? '' : 'px-4 pt-4 pb-2'}`}>
        {currentView === 'COMPLETED' ? (
          <CompletedJobsView
            onClose={() => setCurrentView('BOARD')}
            jobs={completedJobs}
            processColors={processColors}
            onImageClick={setPreviewImage}
          />
        ) : isUvOperator ? (
          <div className="flex flex-col flex-1 min-h-0">
            <OperatorView
              jobs={finalFilteredJobs}
              processes={uvProcesses}
              processColors={processColors}
              onImageClick={handleImageClick}
              refreshData={refreshData}
              type="uv"
            />
          </div>
        ) : loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-xs font-[1000] text-slate-500 uppercase tracking-widest animate-pulse">Loading Jobs...</p>
          </div>
        ) : (
          <div className="h-full flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent scroll-auto">

            {/* QUEUE Column */}
            <div className="h-full min-w-[280px] w-[395px] flex flex-col bg-[#cbd5e1]/30 rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 pb-5">
              <div className="px-5 py-4 flex justify-between items-center border-b border-gray-200 bg-white/50">
                <h3 className="text-[11px] font-black tracking-widest text-[#64748b] uppercase">QUEUE</h3>
                <span className="bg-white/80 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-200">{queueJobs.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                {queueJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={{
                      ...job,
                      id: `${job.job_no}/${job.sub_job_no}`,
                      customer: job.client_name,
                      color: 'bg-indigo-400',
                      theme: getJobTheme(job.process_name)
                    }}
                    onClick={() => handleJobClick(job)}
                    onImageClick={handleImageClick}
                    isActive={selectedJob?._id === job._id}
                  />
                ))}
              </div>
            </div>

            {/* MACHINE columns */}
            <div className="h-full flex gap-2 flex-grow-0 flex-shrink-0">
              <BoardColumn
                title="HANDTOP"
                jobs={handtopJobs}
                dotColor="bg-[#10b981]"
                count={handtopJobs.length}
                color="border-[#10b981]/20 bg-[#f0fdf4] min-w-[280px] w-[395px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
              <BoardColumn
                title="MIMAKI"
                jobs={mimakiJobs}
                dotColor="bg-[#6366f1]"
                count={mimakiJobs.length}
                color="border-[#6366f1]/20 bg-[#f5f3ff] min-w-[280px] w-[395px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
              <BoardColumn
                title="OUTSOURCE"
                jobs={outsourceJobs}
                dotColor="bg-[#ec4899]"
                count={outsourceJobs.length}
                color="border-[#ec4899]/20 bg-[#fdf2f8] min-w-[280px] w-[395px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Detail Panel */}
      {currentView === 'BOARD' && !isUvOperator && (
        <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          <UvJobDetail
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            refreshData={refreshData}
            onImageClick={handleImageClick}
          />
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        src={previewImage}
        fileName={previewImage?.split('/').pop().split('---').pop() || 'Product Preview'}
        onClose={() => setPreviewImage(null)}
      />
      <OutsourceManager
        isOpen={showOutsourceManager}
        onClose={() => setShowOutsourceManager(false)}
        jobs={outsourceJobs}
      />
      <ReadyJobsPanel
        isOpen={showReadyJobsPanel}
        onClose={() => setShowReadyJobsPanel(false)}
        department={uvDepartment}
      />
      <InventoryPanel
        isOpen={showInventoryPanel}
        onClose={() => setShowInventoryPanel(false)}
        isUv={true}
        department={uvDepartment}
      />
      <MaterialRequisitionPanel
        isOpen={showRequisitionPanel}
        onClose={() => setShowRequisitionPanel(false)}
        jobs={jobs}
        department={uvDepartment}
      />
    </div >
  );
};

export default UvPrintStudio;
