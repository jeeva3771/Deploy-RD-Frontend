import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  ShoppingCart,
  Calculator,
  CheckCircle2,
  LayoutGrid,
  AlertCircle,
  Package,
  RefreshCcw,
  HelpCircle,
  X,
  Scissors,
  FileText,
  Search,
  Clock,
  Flag,
  Loader2
} from 'lucide-react';

import LaserJobDetail from './components/LaserJobDetail';
import HeaderPill from './components/HeaderPill';
import ActionPill from './components/ActionPill';
import OutsourceManager from './components/OutsourceManager';
import BoardColumn from './components/BoardColumn';
import JobCard from './components/JobCard';
import LegendItem from './components/LegendItem';
import CompletedJobsView from './components/CompletedJobsView';
import MobileCompletedJobsView from './components/MobileCompletedJobsView';
import InventoryPanel from './components/InventoryPanel';
import ImageLightbox from '../common/ImageLightbox';
import ReadyJobsPanel from './components/ReadyJobsPanel';
import MaterialRequisitionPanel from './components/MaterialRequisitionPanel';
import { fetchShopFloorJobs, syncShopFloorJobs, updateShopFloorJobStatus, fetchShopFloorJobById } from '../../reducer/shopFloorReducer';
import { getAllProcesses } from '../../reducer/processReducer';
import { shopFloorColors } from '../../utils/teamColors';
import { toast } from 'react-toastify';
import { getUserRole, getIsHead, getDepartmentName } from '../../utils/permission/auth';
import OperatorView from './components/OperatorView';

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

const LaserCutting = () => {
  const dispatch = useDispatch();
  const { jobs: allJobs, completedCount: backendCompletedCount, loading } = useSelector((state) => state.shopFloor);
  const allProcesses = useSelector((state) => state.process.processes || []);

  const laserDepartment = useMemo(() => {
    const laserProc = allProcesses.find(p => {
      const name = p.name?.toLowerCase() || '';
      const deptName = p.department?.toLowerCase() || '';
      return (name.includes('laser') || deptName === 'laser');
    });
    return laserProc ? laserProc.department : 'Laser';
  }, [allProcesses]);

  const laserProcesses = useMemo(() => {
    return allProcesses.filter(p => p.department?.toLowerCase() === laserDepartment.toLowerCase());
  }, [allProcesses, laserDepartment]);

  const jobs = useMemo(() => {
    return (allJobs || []).filter(j => j.department?.toLowerCase() === laserDepartment.toLowerCase());
  }, [allJobs, laserDepartment]);

  const isJobCompleted = (job) => {
    if (job.status === 'Completed') return true;
    if (!job.material_groups || job.material_groups.length === 0) return false;
    return job.material_groups.every(mg => mg.status === 'Completed');
  };

  const [selectedJob, setSelectedJob] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOutsourceManager, setShowOutsourceManager] = useState(false);
  const [showInventoryPanel, setShowInventoryPanel] = useState(false);
  const [showReadyJobsPanel, setShowReadyJobsPanel] = useState(false);
  const [showRequisitionPanel, setShowRequisitionPanel] = useState(false);
  const [currentView, setCurrentView] = useState('BOARD'); // 'BOARD' or 'COMPLETED'
  const [activeHeaderFilter, setActiveHeaderFilter] = useState(null); // 'DUE_TODAY', 'DATE_CHANGE', 'QTY_CHANGE'
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const role = getUserRole();
  const isHead = getIsHead();
  const dept = getDepartmentName();
  const isAdmin = role?.toLowerCase() === 'admin';
  const isLaserOperator = dept === 'Laser' && !isHead && !isAdmin;

  const processColors = useMemo(() => {
    const map = {};

    // Simple hash function to get a stable index for a string
    const getHashIndex = (str) => {
      if (!str || !shopFloorColors.length) return 0;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash) % shopFloorColors.length;
    };

    laserProcesses.forEach((p, idx) => {
      const name = p.name?.trim().toUpperCase();
      if (name) {
        // Use hash-based index for more variety, or falls back to idx
        const colorIndex = p._id ? getHashIndex(p._id) : idx;
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

    // Default fallback
    map['DEFAULT'] = {
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-slate-600',
      pill: 'bg-slate-100',
      bar: 'bg-teal-500'
    };

    // Helper to get color for names not in the explicit map
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
  }, [laserProcesses]);



  const baseFilteredJobs = useMemo(() => {
    let filtered = jobs.filter(j => !isJobCompleted(j));

    // If operator, only show in-house assigned jobs (Shifts 1, 2, 3)
    if (isLaserOperator) {
      filtered = filtered.filter(j => {
        const inHouseShifts = (j.assigned_shifts || []).filter(s => s === 1 || s === 2 || s === 3);
        const hasGroupInHouse = j.material_groups?.some(mg =>
          (mg.assigned_shifts || []).some(s => s === 1 || s === 2 || s === 3)
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
  }, [jobs, selectedProcess, searchTerm, isLaserOperator]);

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
      onHold: activeJobs.filter(j => j.is_hold).length,
      escalated: activeJobs.filter(j => j.is_escalated).length,
      completed: jobs.filter(isJobCompleted).length
    };
  }, [jobs]);

  const finalFilteredJobs = useMemo(() => {
    let filtered = baseFilteredJobs;

    // Header Filters
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
  }, [baseFilteredJobs, activeHeaderFilter]);

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
      department: laserDepartment,
      role: isLaserOperator ? 'Laser Cutting Operator' : 'admin'
    };

    if (currentView === 'COMPLETED') {
      params.status = 'Completed';
    } else {
      params.exclude_completed = 'true';
    }

    dispatch(fetchShopFloorJobs(params));
  }, [dispatch, isLaserOperator, currentView, laserDepartment]);

  const [showLegend, setShowLegend] = useState(false);

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

    const processed = filteredJobs.map(job => ({
      ...job,
      theme: processColors.getThemeForName(job.process_name)
    }));

    switch (type) {
      case 'QUEUE':
        return processed.filter(j => {
          if (j.status === 'Completed') return false;
          // If ANY group has no shift assigned AND is not outsourced, show in queue
          const hasUnassigned = j.material_groups?.some(mg =>
            !(mg.assigned_shifts?.length > 0 || mg.assigned_outsource_sheets > 0)
          );
          return hasUnassigned;
        });
      case 'SHIFT1':
        return processed.filter(j => (j.assigned_shifts?.includes(1) || j.material_groups?.some(mg => mg.assigned_shifts?.includes(1))) && j.status !== 'Completed');
      case 'SHIFT2':
        return processed.filter(j => (j.assigned_shifts?.includes(2) || j.material_groups?.some(mg => mg.assigned_shifts?.includes(2))) && j.status !== 'Completed');
      case 'SHIFT3':
        return processed.filter(j => (j.assigned_shifts?.includes(3) || j.material_groups?.some(mg => mg.assigned_shifts?.includes(3))) && j.status !== 'Completed');
      case 'OUTSOURCE':
        return processed.filter(j =>
          (j.assigned_shifts?.includes(4) ||
            j.material_groups?.some(mg => mg.assigned_shifts?.includes(4) || mg.assigned_outsource_sheets > 0)) &&
          j.status !== 'Completed'
        );
      default:
        return [];
    }
  };

  const queueJobs = getJobsForColumn('QUEUE');
  const shift1Jobs = getJobsForColumn('SHIFT1');
  const shift2Jobs = getJobsForColumn('SHIFT2');
  const shift3Jobs = getJobsForColumn('SHIFT3');
  const outsourceJobs = getJobsForColumn('OUTSOURCE');
  const completedCount = useMemo(() => jobs.filter(isJobCompleted).length, [jobs]);

  const currentTheme = useMemo(() => {
    return processColors[selectedProcess.toUpperCase()] || null;
  }, [selectedProcess, processColors]);

  const completedJobs = useMemo(() => {
    let filtered = jobs.filter(isJobCompleted);
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



  return (
    <div className="bg-[#f1f5f9] flex flex-col overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
      {/* Top Navbar */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* <h1
              className="text-xs font-[1000] tracking-widest leading-none uppercase italic text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setCurrentView('BOARD')}
            >
              LASER STUDIO
            </h1> */}

            {/* <div className="h-4 w-px bg-gray-300"></div> */}

            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-3 py-1 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all"
            >
              <option value="All">All Processes</option>
              {laserProcesses.map(p => (
                <option key={p._id} value={p.name}>{p.name}</option>
              ))}
            </select>

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

          <div className="h-6 w-px bg-gray-700 mx-0.5"></div>

          <ActionPill
            icon={<ShoppingCart className="w-3.5 h-3.5 text-slate-100" />}
            label="OUTSOURCE"
            count={outsourceJobs.length}
            onClick={() => setShowOutsourceManager(true)}
          />
          {/* <ActionPill icon={<Calculator className="w-3.5 h-3.5 text-red-400" />} label="ACCOUNTING" /> */}
          <ActionPill icon={<Scissors className="w-3.5 h-3.5 text-green-400" />} label="READY JOBS" onClick={() => setShowReadyJobsPanel(true)} />
          <ActionPill icon={<Package className="w-3.5 h-3.5 text-amber-500" />} label="INVENTORY" onClick={() => setShowInventoryPanel(true)} />
          <ActionPill icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} label="REQUISITION" onClick={() => setShowRequisitionPanel(true)} />
          <ActionPill
            icon={<CheckCircle2 className={`w-3.5 h-3.5 ${currentView === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-600'}`} />}
            label="COMPLETED"
            count={backendCompletedCount}
            onClick={() => setCurrentView('COMPLETED')}
          />

          {/* <div className="relative">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1.5 border ${showLegend ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
              title="Priority Legend"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-widest">Legend</span>
            </button>

            {showLegend && (
              <div className="absolute top-full mt-2 right-0 w-[280px] bg-white rounded-2xl shadow-2xl z-[100] border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-tight">Priority Legend</h3>
                  <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <LegendItem color="#dc2626" label="Past End Date (Overdue)" />
                  <LegendItem color="#ef4444" label="0–3 Days (Critical)" />
                  <LegendItem color="#f97316" label="4–5 Days (Rush)" />
                  <LegendItem color="#22c55e" label="6–7 Days (Normal)" />
                  <LegendItem color="#3b82f6" label="8–10 Days (Scheduled)" />
                  <LegendItem color="#ec4899" label="11–More Days (Upcoming)" />
                </div>
              </div>
            )}
          </div> */}

          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-all text-[8px] font-black uppercase tracking-widest ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${isLaserOperator ? '' : (isMobileScreen && currentView === 'COMPLETED' ? 'p-0' : 'px-4 pt-4 pb-2')}`}>
        {currentView === 'COMPLETED' ? (
          isMobileScreen ? (
            <MobileCompletedJobsView
              jobs={completedJobs}
              processColors={processColors}
              onImageClick={setPreviewImage}
              onBackToPipeline={() => setCurrentView('BOARD')}
            />
          ) : (
            <CompletedJobsView
              onClose={() => setCurrentView('BOARD')}
              jobs={completedJobs}
              processColors={processColors}
              onImageClick={setPreviewImage}
            />
          )
        ) : isLaserOperator ? (
          <OperatorView
            jobs={finalFilteredJobs}
            processes={laserProcesses}
            processColors={processColors}
            onImageClick={handleImageClick}
            refreshData={refreshData}
            type="laser"
          />
        ) : loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mb-4" />
            <p className="text-xs font-[1000] text-slate-500 uppercase tracking-widest animate-pulse">Loading Jobs...</p>
          </div>
        ) : currentView === 'BOARD' ? (
          <div className="h-full flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent scroll-auto">
            {/* QUEUE Column */}
            <div className="h-full min-w-[280px] w-[310px] flex flex-col bg-[#cbd5e1]/30 rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 pb-5">
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
                        theme: processColors.getThemeForName(job.process_name)
                      }}
                      onClick={() => handleJobClick(job)}
                      onImageClick={handleImageClick}
                      isActive={selectedJob?._id === job._id}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* SHIFT columns */}
            <div className="h-full flex gap-4 flex-grow-0 flex-shrink-0">
              <BoardColumn
                title="SHIFT 1"
                jobs={shift1Jobs}
                dotColor="bg-[#3b82f6]"
                count={shift1Jobs.length}
                color="border-[#0ea5e9]/20 bg-[#f0f9ff] min-w-[280px] w-[310px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
              <BoardColumn
                title="SHIFT 2"
                jobs={shift2Jobs}
                dotColor="bg-[#f59e0b]"
                count={shift2Jobs.length}
                color="border-[#f59e0b]/20 bg-[#fffbeb] min-w-[280px] w-[310px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
              <BoardColumn
                title="SHIFT 3"
                jobs={shift3Jobs}
                dotColor="bg-[#8b5cf6]"
                count={shift3Jobs.length}
                color="border-[#8b5cf6]/20 bg-[#f5f3ff] min-w-[280px] w-[310px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
              <BoardColumn
                title="OUTSOURCE"
                jobs={outsourceJobs}
                dotColor="bg-[#ec4899]"
                count={outsourceJobs.length}
                color="border-[#ec4899]/20 bg-[#fdf2f8] min-w-[280px] w-[310px]"
                onJobClick={handleJobClick}
                onImageClick={handleImageClick}
                selectedJobId={selectedJob?._id}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Right Detail Panel */}
      {currentView === 'BOARD' && (
        <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          <LaserJobDetail
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
      <InventoryPanel
        isOpen={showInventoryPanel}
        onClose={() => setShowInventoryPanel(false)}
        isUv={false}
        department={laserDepartment}
      />
      <ReadyJobsPanel
        isOpen={showReadyJobsPanel}
        onClose={() => setShowReadyJobsPanel(false)}
        department={laserDepartment}
      />
      <MaterialRequisitionPanel
        isOpen={showRequisitionPanel}
        onClose={() => setShowRequisitionPanel(false)}
        jobs={jobs}
        department={laserDepartment}
      />
    </div>
  );
};

export default LaserCutting;
