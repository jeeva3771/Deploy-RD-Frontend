import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Clock, X, LayoutGrid, AlertCircle, ChevronRight, Settings,
  MoreVertical, Layers, Activity, FileText, Inbox, Download, Package,
  AlertTriangle, CheckCircle2, User, ShieldCheck, Eye, Check, RefreshCw,
  TextAlignJustify, Sun
} from 'lucide-react';
import {
  fetchShopFloorJobs,
  updateShopFloorJobStatus,
  recordMaterialInward,
  clearShopFloorFlags,
  escalateShopFloorJob,
  deEscalateShopFloorJob
} from '../../reducer/shopFloorReducer';
import { getUserRole, getIsHead, getUser } from '../../utils/permission/auth';
import DynamicProcessScreen from './components/DynamicProcessScreen';
import AssemblyProcessScreen from './components/AssemblyProcessScreen';
import JobCard from './components/JobCard';
import FilesModal from './components/FilesModal';
import MaterialInwardModal from './components/MaterialInwardModal';
import { downloadFile } from '../../reducer/standalone_bomReducer';
import { toast } from 'react-toastify';

export default function AssemblyBayOperator({
  jobs = [],
  machines = [],
  processColors = {},
  onImageClick,
  refreshData,
  floor,
  activeProcessIds = [],
  operatorTeams = []
}) {
  // Read shift details from Redux — dispatched once by the parent AssemblyBay
  const { userShiftDetails } = useSelector(state => state.shift || {});

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

  // View state
  const [selectedJob, setSelectedJob] = useState(null);
  
  // File confirmation state (tracks confirmed jobs by ID)
  const [confirmedJobs, setConfirmedJobs] = useState({});
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [filesToConfirm, setFilesToConfirm] = useState([]);

  // Material Inwarding Modal & Sampling states
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(null);
  const [togglingSampling, setTogglingSampling] = useState(null);

  const handleToggleSampling = async (jobId, groupId, currentValue = false) => {
    try {
      setTogglingSampling(groupId);
      await refreshData(jobId, {
        material_group_id: groupId,
        sampling_on: !currentValue
      });
    } catch (error) {
      console.error("Error toggling sampling:", error);
    } finally {
      setTogglingSampling(null);
    }
  };

  // Tab Management
  const [tabs, setTabs] = useState([{ id: 'BROWSER', label: 'BROWSER' }]);
  const [activeTabId, setActiveTabId] = useState('BROWSER');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeShiftFilter, setActiveShiftFilter] = useState('ALL');

  // Role check
  const role = getUserRole();
  const isAdmin = role?.toLowerCase().includes('admin') || role?.toLowerCase() === 'super admin' || role?.toLowerCase() === 'superadmin';

  // Authorization is already enforced by the route permission guard (permission 41).
  // Anyone who reaches this component as a non-admin/non-head is a valid assembly operator.
  const isAuthorized = true;

  // Accent Theme
  const accentColor = floor?.accent || '#8b5cf6';

  const isOperator = useMemo(() => {
    return !isAdmin && !getIsHead();
  }, [isAdmin]);

  useEffect(() => {
    if (isOperator && operatorTeams.length > 0) {
      setActiveShiftFilter(operatorTeams.length === 1 ? operatorTeams[0] : 'ALL');
    } else if (isOperator && operatorShiftNum) {
      setActiveShiftFilter(String(operatorShiftNum));
    }
  }, [isOperator, operatorShiftNum, operatorTeams]);

  const availableShifts = useMemo(() => {
    if (isOperator && operatorTeams.length > 0) {
      return ['ALL', ...operatorTeams];
    }
    if (isOperator && operatorShiftNum) {
      return [String(operatorShiftNum)];
    }
    return ['ALL', ...machines.map((_, i) => String(i + 1))];
  }, [machines, isOperator, operatorShiftNum, operatorTeams]);

  // Base jobs filtered by floor process IDs and assigned to a machine/shift
  const baseFloorFilteredJobs = useMemo(() => {
    const floorJobs = jobs.filter(j => activeProcessIds.includes(String(j.process_id)));
    
    if (isOperator && operatorTeams.length > 0) {
      return floorJobs.filter(j => 
        operatorTeams.some(team => 
          j.assigned_shifts?.includes(team) ||
          j.material_groups?.some(mg => mg.assigned_shifts?.includes(team))
        )
      );
    }

    let validShiftIds = (machines || []).map((_, i) => i + 1);
    if (validShiftIds.length === 0) {
      validShiftIds = [1, 2, 3];
    }
    if (isOperator) {
      validShiftIds = operatorShiftNum ? [operatorShiftNum] : validShiftIds;
    }
    return floorJobs.filter(j => 
      validShiftIds.some(shiftId => 
        j.assigned_shifts?.includes(shiftId) ||
        j.material_groups?.some(mg => mg.assigned_shifts?.includes(shiftId))
      )
    );
  }, [jobs, activeProcessIds, machines, isOperator, operatorShiftNum, operatorTeams]);

  // Apply shift filter
  const pipelineJobs = useMemo(() => {
    let filtered = baseFloorFilteredJobs;

    // Filter by shift (or machine) if selected
    if (activeShiftFilter !== 'ALL') {
      filtered = filtered.filter(j =>
        j.assigned_shifts?.includes(activeShiftFilter) ||
        (!isNaN(Number(activeShiftFilter)) && j.assigned_shifts?.includes(Number(activeShiftFilter))) ||
        j.material_groups?.some(mg => 
          mg.assigned_shifts?.includes(activeShiftFilter) || 
          (!isNaN(Number(activeShiftFilter)) && mg.assigned_shifts?.includes(Number(activeShiftFilter)))
        )
      );
    }

    return filtered.map(job => {
      const theme = processColors.getThemeForName?.(job.process_name) || {
        bg: 'bg-white',
        border: 'border-slate-200',
        text: 'text-slate-900',
        pill: 'bg-slate-100',
        bar: 'bg-teal-500'
      };
      return {
        ...job,
        theme
      };
    });
  }, [baseFloorFilteredJobs, activeShiftFilter, processColors]);

  // Keep selectedJob synced with updated data
  useEffect(() => {
    if (selectedJob) {
      const updated = pipelineJobs.find(j => j._id === selectedJob._id);
      if (updated && updated !== selectedJob) setSelectedJob(updated);
    }
  }, [pipelineJobs, selectedJob]);

  // Keep selectedMaterialGroup synced with updated selectedJob data
  useEffect(() => {
    if (selectedJob && selectedMaterialGroup) {
      const gId = selectedMaterialGroup._id || selectedMaterialGroup.group_id;
      const updatedGroup = selectedJob.material_groups?.find(mg => (mg._id || mg.group_id) === gId);
      if (updatedGroup && updatedGroup !== selectedMaterialGroup) {
        setSelectedMaterialGroup(updatedGroup);
      }
    }
  }, [selectedJob, selectedMaterialGroup]);

  // Autoselect first job on load
  useEffect(() => {
    if (!selectedJob && pipelineJobs.length > 0) {
      setSelectedJob(pipelineJobs[0]);
    }
  }, [pipelineJobs, selectedJob]);

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setActiveTabId('BROWSER');
  };

  const handleProcessClick = (job, isCombined = false, bottleneckQty = 0, groupId = null) => {
    const tabId = groupId ? `${job._id}-${groupId}` : job._id;
    const existingTab = tabs.find(t => t.id === tabId);
    if (!existingTab) {
      setTabs([...tabs, {
        id: tabId,
        jobId: job._id,
        groupId,
        label: (job.sub_job_no || job.job_no) + (groupId ? ' (INT)' : ''),
        type: 'PROCESS',
        isCombined,
        bottleneckQty
      }]);
    }
    setActiveTabId(tabId);
  };

  const handleCloseTab = (e, tabId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId('BROWSER');
    }
  };

  const dispatch = useDispatch();

  const handleClearFlag = async (jobId, flagType) => {
    try {
      await dispatch(clearShopFloorFlags({ id: jobId, type: flagType })).unwrap();
      toast.success("Flag acknowledged successfully");
      if (refreshData) refreshData();
    } catch (error) {
      toast.error("Failed to acknowledge flag");
    }
  };

  const handleConfirmFiles = () => {
    if (!selectedJob) return;
    const collectedFiles = [];
    if (selectedJob.artwork_pdf) {
      collectedFiles.push({
        url: selectedJob.artwork_pdf,
        name: 'ARTWORK PDF',
        source: 'DTP LEVEL',
        groupName: 'GLOBAL',
        processName: selectedJob.process_name,
        isImage: false,
        ext: 'PDF'
      });
    }
    if (selectedJob.material_groups) {
      selectedJob.material_groups.forEach(mg => {
        const prep = selectedJob.final_prep_files?.find(f =>
          String(f.material_group_id) === String(mg.group_id || mg._id || "")
        ) || mg.final_prep_file;

        if (prep) {
          const addPrepFiles = (fileList, typeLabel) => {
            if (fileList && fileList.length > 0) {
              fileList.forEach((f, i) => {
                if (f.file_url) {
                  const isImg = f.file_url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
                  collectedFiles.push({
                    url: f.file_url,
                    name: `${typeLabel} ${i + 1}`,
                    source: 'DTP PREP',
                    groupName: mg.group_name,
                    processName: selectedJob.process_name,
                    isImage: !!isImg,
                    ext: f.file_url.split('.').pop().toUpperCase().split('?')[0]
                  });
                }
              });
            }
          };
          addPrepFiles(prep.production_files, 'PROD');
          addPrepFiles(prep.reference_images, 'REF');
          if (prep.production_file?.file_url) {
            const url = prep.production_file.file_url;
            collectedFiles.push({
              url,
              name: 'PRODUCTION FILE',
              source: 'DTP PREP',
              groupName: mg.group_name,
              processName: selectedJob.process_name,
              isImage: !!url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i),
              ext: url.split('.').pop().toUpperCase().split('?')[0]
            });
          }
        }
      });
    }
    setFilesToConfirm(collectedFiles);
    setConfirmedJobs(prev => ({ ...prev, [selectedJob._id]: true }));
    setShowFilesModal(true);
  };

  const handleDownloadSingle = (url, preview = false) => {
    if (preview && onImageClick) {
      onImageClick(url);
    } else {
      dispatch(downloadFile(url));
    }
  };

  const isFinalAssembly = useMemo(() => {
    // If there are multiple material groups in a single assembly job, it acts as a combined Final Assembly
    return selectedJob?.material_groups?.length > 1;
  }, [selectedJob]);

  const maxAssembleableQty = useMemo(() => {
    if (!isFinalAssembly || !selectedJob) return 0;
    
    // Bottleneck logic: Minimum of totalGood across all groups
    let minQty = Infinity;
    selectedJob.material_groups.forEach(mg => {
      const inwardLogs = mg.inward_history || [];
      const totalGood = inwardLogs.reduce((acc, l) => acc + (l.good_qty || 0), 0);
      
      const mainMat = mg.materials?.find(m => {
        const cat = m.category_type?.toLowerCase() || '';
        return !cat.includes('consumable') && !cat.includes('hardware');
      });
      const isSheetMaterial = mainMat?.material_type?.toLowerCase() === 'sheet';
      const ups = mainMat?.material_input?.ups || mg.ups || 1;
      
      const bom = selectedJob?.bom_id;
      let processesList = [];
      if (bom && bom.materialprocess) {
        const processGroup = bom.materialprocess.find(p =>
          p.material_group_name?.toLowerCase().trim() === mg.group_name?.toLowerCase().trim() ||
          String(p.material_group_id) === String(mg.group_id || mg._id)
        );
        if (processGroup) processesList = processGroup.processes || [];
      }
      
      const cuttingIndex = processesList.findIndex(p =>
        p.process_name?.toLowerCase().includes("laser") ||
        p.process_name?.toLowerCase().includes("cutting") ||
        p.process_name?.toLowerCase().includes("cut")
      );
      const currentProcessIndex = processesList.findIndex(p =>
        p.process_name?.toLowerCase().trim() === selectedJob?.process_name?.toLowerCase().trim()
      );
      const isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
      
      // If the material is sheet and this is NOT subsequent, the inward is in SHEETS, so we multiply by UPS
      let finalGoodQtyPcs = totalGood;
      if (isSheetMaterial && !isSubsequent) {
        finalGoodQtyPcs = totalGood * ups;
      }
      
      if (finalGoodQtyPcs < minQty) {
        minQty = finalGoodQtyPcs;
      }
    });
    
    return minQty === Infinity ? 0 : minQty;
  }, [selectedJob, isFinalAssembly]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-950 text-white rounded-[2.5rem] border border-slate-800">
        <AlertTriangle className="w-16 h-16 text-rose-500 animate-bounce mb-4" />
        <h3 className="text-xl font-black uppercase tracking-widest text-rose-400">Access Restricted</h3>
        <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
          Your current user credentials do not have Operator or Supervisor roles authorized for this shop floor. Please contact admin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full bg-[#f8fafc] overflow-hidden rounded-[2.5rem] border border-slate-200">
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
            background: #94a3b8 !important;
            border-radius: 10px !important;
            border: 2px solid #f1f5f9 !important;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #64748b !important;
        }
        `}
      </style>

      {/* Left Sidebar: Pipeline */}
      {!isSidebarCollapsed && (
        <aside className={`h-full bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'w-0 border-none' : 'w-[310px]'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[11px] font-[1000] text-slate-800 uppercase tracking-[0.2em] italic">
              {(floor?.name || 'OPERATOR').toUpperCase()} PIPELINE
            </h2>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shift Filter Bar inside Sidebar */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl">
              {availableShifts.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveShiftFilter(s)}
                  className={`flex-1 py-1.5 px-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeShiftFilter === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {s === 'ALL' ? `ALL (${baseFloorFilteredJobs.length})` : (isNaN(Number(s)) ? s : (machines[Number(s) - 1] || 'S' + s))}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-sidebar-scroll">
            {pipelineJobs.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-300 italic">
                <Inbox className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No jobs in queue</p>
              </div>
            ) : (
              pipelineJobs.map(job => (
                <JobCard
                  key={job._id}
                  job={{
                    ...job,
                    id: `${job.job_no}/${job.sub_job_no}`,
                    customer: job.client_name,
                    color: job.theme?.bar || 'bg-teal-500',
                    theme: job.theme
                  }}
                  onClick={() => handleJobSelect(job)}
                  onImageClick={onImageClick}
                  isActive={selectedJob?._id === job._id}
                />
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-hidden relative bg-[#f8fafc]">
        {/* Tabs Bar */}
        <div className="h-14 bg-white border-b border-slate-100 flex items-end px-2 gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-10 flex items-center rounded-t-xl z-20 transition-all px-2"
          >
            <TextAlignJustify className="w-5 h-5 text-slate-600" />
          </button>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group h-10 border-x border-t rounded-t-xl flex items-center px-6 gap-3 relative transition-all cursor-pointer ${activeTabId === tab.id
                ? 'bg-[#f8fafc] border-slate-200 -mb-[1px] z-10'
                : 'bg-white border-transparent text-slate-400 hover:text-slate-600'
                }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeTabId === tab.id ? 'text-slate-900' : ''}`}>{tab.label}</span>
              {tab.id !== 'BROWSER' && (
                <X
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="w-3 h-3 text-slate-300 hover:text-rose-500 transition-colors"
                />
              )}
              {activeTabId === tab.id && (
                <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-full" style={{ backgroundColor: accentColor }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTabId === 'BROWSER' ? (
            selectedJob ? (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-10 py-8">
                  <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* Hold / Escalated Notification Banners */}
                    {(selectedJob.is_hold || selectedJob.is_escalated) && (
                      <div className="bg-rose-50 border border-rose-200 p-5 rounded-[2rem] flex items-start gap-4 shadow-sm animate-pulse">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">Production Blocked</h4>
                          <p className="text-[10px] text-rose-500 mt-1 leading-relaxed">
                            {selectedJob.is_hold && "This job is currently placed ON HOLD. Operators cannot log activities until resumed."}
                            {selectedJob.is_escalated && " This job has been ESCALATED. A supervisor or admin must review status before processing."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Upstream Notifications Flags */}
                    {(selectedJob.upstream_notifications || []).map((notif, idx) => (
                      <div key={idx} className="bg-purple-50 border border-purple-200 p-5 rounded-[2rem] flex justify-between items-start gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide">Upstream Alert: {notif.type}</h4>
                            <p className="text-[10px] text-purple-600 mt-1 italic">"{notif.message}"</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleClearFlag(selectedJob._id, notif.type)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-[9px] font-[1000] uppercase tracking-wider rounded-lg hover:bg-purple-500 transition-all shrink-0"
                        >
                          Acknowledge
                        </button>
                      </div>
                    ))}

                    {/* Job Header Card */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-8">
                        {/* Job Product Image */}
                        <div
                          className="w-24 h-24 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex-shrink-0 cursor-zoom-in group relative"
                          onClick={() => onImageClick && onImageClick(selectedJob.product_image || selectedJob.product_image_url)}
                        >
                          {(selectedJob.product_image || selectedJob.product_image_url) ? (
                            <img
                              src={selectedJob.product_image || selectedJob.product_image_url}
                              alt={selectedJob.product_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                              <Activity className="w-10 h-10 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                        </div>

                        <div>
                          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-1">
                            {selectedJob.job_no}/{selectedJob.sub_job_no}
                          </h1>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: accentColor }}></div>
                              <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                                {selectedJob.client_name || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg text-rose-500">
                              <Layers className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                {(() => {
                                  const totalInHouseUnits = selectedJob.material_groups?.reduce((acc, group) => {
                                    const mainMat = group.materials?.find(m => {
                                      const cat = m.category_type?.toLowerCase() || '';
                                      return !cat.includes('consumable') && !cat.includes('hardware');
                                    });
                                    const totalSheets = mainMat?.quantity || group.sheets_required || 0;
                                    const outsourcedSheets = group.assigned_outsource_sheets || 0;
                                    const ups = mainMat?.material_input?.ups || group.ups || 0;
                                    return acc + ((totalSheets - outsourcedSheets) * ups);
                                  }, 0);
                                  return totalInHouseUnits || 0;
                                })()} UNITS
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-500">
                              <FileText className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{selectedJob.job_completion_date || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Action Buttons / Status Pills & CONFIRM FILES */}
                      <div className="flex items-center justify-end gap-4">
                        {selectedJob.is_reprocess && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">REPROCESS</span>
                          </div>
                        )}
                        {selectedJob.is_escalated && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Job Escalated</span>
                          </div>
                        )}
                        {selectedJob.is_hold && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Job On Hold</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Material Groups List */}
                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Material Groups</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedJob.material_groups?.map((mg, idx) => {
                        const mainMat = mg.materials?.find(m => {
                          const cat = m.category_type?.toLowerCase() || '';
                          return !cat.includes('consumable') && !cat.includes('hardware');
                        });
                        const matSize = mainMat?.material_input?.size || mg.size || 'Standard';

                        const bom = selectedJob?.bom_id;
                        let processesList = [];
                        if (bom && bom.materialprocess) {
                          const processGroup = bom.materialprocess.find(p =>
                            p.material_group_name?.toLowerCase().trim() === mg.group_name?.toLowerCase().trim() ||
                            String(p.material_group_id) === String(mg.group_id || mg._id)
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
                          p.process_name?.toLowerCase().trim() === selectedJob?.process_name?.toLowerCase().trim()
                        );
                        
                        const isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
                        const isSheetMaterial = mainMat?.material_type?.toLowerCase() === 'sheet';
                        
                        const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                        const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                        const inHouseSheets = totalSheets - outsourcedSheets;
                        const ups = mainMat?.material_input?.ups || mg.ups || 1;
                        const inHouseQty = inHouseSheets * ups;

                        const inwardingUnit = isSheetMaterial ? (isSubsequent ? 'PCS' : 'SHEETS') : 'PCS';
                        const targetQty = isSheetMaterial ? (isSubsequent ? inHouseQty : inHouseSheets) : inHouseSheets;

                        const inwardLogs = mg.inward_history || [];
                        const totalGood = inwardLogs.reduce((acc, l) => acc + (l.good_qty || 0), 0);
                        const totalBad = inwardLogs.reduce((acc, l) => acc + (l.bad_qty || 0), 0);

                        const progressPercent = Math.min(100, Math.round(mg.progress || 0));

                        return (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-4.5 space-y-2.5">
                            {/* TOP ROW: Left Info & Right Actions */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              {/* Top Left: Material Icon & Details */}
                              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }} className="rounded-xl bg-[#f39c12] flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                                  <Activity className="w-5 h-5 text-white" />
                                </div>

                                {/* Material Info */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight mr-1.5">{mg.group_name}</h3>
                                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-600 text-[9px] font-black rounded-md border border-teal-100 uppercase tracking-widest flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                      SHIFT {(() => {
                                        const shifts = (mg.assigned_shifts && mg.assigned_shifts.length > 0)
                                          ? mg.assigned_shifts
                                          : (selectedJob.assigned_shifts || []);
                                        if (machines && machines.length > 0) {
                                          const shiftIdx = shifts[0];
                                          if (shiftIdx && machines[shiftIdx - 1]) {
                                            return ' - ' + machines[shiftIdx - 1].toUpperCase();
                                          }
                                        }
                                        if (shifts.includes(1)) return '1';
                                        if (shifts.includes(2)) return '2';
                                        return '1';
                                      })()}
                                    </span>
                                    {selectedJob.is_reprocess && (
                                      <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border-red-200 text-[9px] font-[1000] rounded-md border uppercase tracking-widest shadow-sm">
                                        REPROCESS
                                      </span>
                                    )}
                                    {(() => {
                                      const theme = processColors?.getThemeForName?.(selectedJob.process_name) || { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
                                      return selectedJob.process_name ? (
                                        <span className={`px-2.5 py-0.5 ${theme.bg} ${theme.text} ${theme.border || 'border-transparent'} text-[9px] font-[1000] rounded-md border uppercase tracking-widest shadow-sm`}>
                                          {selectedJob.process_name}
                                        </span>
                                      ) : null;
                                    })()}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                    {(() => {
                                      const size = matSize;
                                      const showSheetsFormat = isSheetMaterial && !isSubsequent;

                                      const isInHouseJob = totalGood >= totalSheets;
                                      const inHouseTargetQty = isInHouseJob
                                        ? (selectedJob?.total_qty || inHouseQty)
                                        : Math.max(0, (selectedJob?.total_qty || inHouseQty) - (outsourcedSheets * ups));

                                      let totalSqInch = 0;
                                      if (matSize) {
                                        const dims = matSize.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                                        if (dims.length >= 2) totalSqInch = dims[0] * dims[1] * inHouseSheets;
                                      }
                                      const formatSqInch = (val) => val > 1000 ? (val / 1000).toFixed(1) + 'K' : Math.round(val);

                                      const pillClass = "flex items-center gap-1 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-widest";

                                      return (
                                        <>
                                          <div className={pillClass}>
                                            <LayoutGrid className="w-3 h-3 text-slate-400" />
                                            {size}
                                          </div>
                                          {showSheetsFormat ? (
                                            <>
                                              <div className={pillClass}>
                                                <Activity className="w-3 h-3 text-rose-400" />
                                                {inHouseSheets}Sh / {inHouseQty}Ups
                                              </div>
                                              <div className={pillClass}>
                                                <MoreVertical className="w-3 h-3 text-slate-400" />
                                                {ups}ups/sheet
                                              </div>
                                            </>
                                          ) : (
                                            <div className={pillClass}>
                                              <Activity className="w-3 h-3 text-rose-400" />
                                              {inHouseTargetQty} Pcs
                                            </div>
                                          )}
                                          {totalSqInch > 0 && (
                                            <div className={pillClass}>
                                              {formatSqInch(totalSqInch)} SQ.IN
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* PROCESS PIPELINE */}
                            {processesList.length > 0 && (
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                                  PROCESS:
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                                  {processesList.map((proc, pIdx) => {
                                    const isCurrent = pIdx === currentProcessIndex;

                                    const procJob = (jobs || []).find(j => 
                                      j.sub_job_no === selectedJob?.sub_job_no && 
                                      j.process_name?.toLowerCase().trim() === proc.process_name?.toLowerCase().trim()
                                    );

                                    const isProcCompleted = procJob 
                                      ? (procJob.status === 'Completed' || procJob.progress >= 100 || (procJob.total_qty > 0 && procJob.completed_qty >= procJob.total_qty))
                                      : false;

                                    const isDone = isProcCompleted;
                                    const isInProgress = (isCurrent || pIdx < currentProcessIndex) && !isDone;

                                    let badgeClass = 'bg-slate-50 text-slate-400 border-slate-200';
                                    let badgeText = '';

                                    if (isDone) {
                                      badgeClass = 'bg-teal-50 text-teal-600 border-teal-100';
                                      badgeText = '(DONE)';
                                    } else if (isCurrent) {
                                      badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                      badgeText = '(CURRENT)';
                                    } else if (isInProgress) {
                                      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                      badgeText = '(IN PROGRESS)';
                                    }

                                    return (
                                      <React.Fragment key={pIdx}>
                                        {pIdx > 0 && <span className="text-slate-300 font-black text-[9px] shrink-0">→</span>}
                                        <span className={`px-2.5 py-1 text-[8.5px] font-black rounded-lg border uppercase tracking-widest flex items-center gap-1.5 shadow-xs shrink-0 ${badgeClass}`}>
                                          {isDone && <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
                                          {isCurrent && <Activity className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />}
                                          {!isDone && !isCurrent && isInProgress && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
                                          <span>{proc.process_name}</span>
                                          {badgeText && <span className="opacity-70 text-[7.5px]">{badgeText}</span>}
                                        </span>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ACTIONS & STATUS ROW: ALL IN ONE LINE */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                              {/* Left Controls: SAMPLING Toggle + Readiness Badge */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {selectedJob.job_type?.toLowerCase() === 'production' && !selectedJob.is_reprocess && (
                                  <button
                                    onClick={() => !selectedJob.is_hold && handleToggleSampling(selectedJob._id, mg.group_id || mg._id, !!mg.sampling_on)}
                                    disabled={togglingSampling === (mg.group_id || mg._id)}
                                    className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 ${mg.sampling_on ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-200'} border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50`}
                                  >
                                    <span className={`flex items-center gap-1.5 ${mg.sampling_on ? 'text-cyan-600' : 'text-slate-400'}`}>
                                      <Activity className={`w-3 h-3 ${mg.sampling_on ? 'animate-pulse' : ''}`} />
                                      SAMPLING {mg.sampling_on ? 'ON' : 'OFF'}
                                    </span>
                                    <div className={`w-7 h-3.5 p-0.5 ${mg.sampling_on ? 'bg-cyan-500' : 'bg-slate-300'} rounded-full transition-colors duration-300 flex items-center ${mg.sampling_on ? 'justify-end' : 'justify-start'} shrink-0`}>
                                      <div className="w-2.5 h-2.5 bg-white rounded-full shadow-xs transition-all duration-300"></div>
                                    </div>
                                  </button>
                                )}

                                <span className={`text-[8px] font-black uppercase tracking-widest shrink-0 px-2.5 py-1.5 rounded-xl border ${
                                  totalGood >= targetQty 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                  {totalGood >= targetQty ? 'READY FOR PRODUCTION' : 'AWAITING REMAINING MATERIAL'}
                                </span>
                              </div>

                              {/* Right Controls: INWARD MATERIAL + PROCESS */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMaterialGroup(mg);
                                    setShowInwardModal(true);
                                  }}
                                  className="px-4 py-2 bg-[#f39c12] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-amber-600/10 hover:scale-[1.02] transition-all relative overflow-hidden group"
                                >
                                  <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                                    <span>INWARD MATERIAL</span>
                                    {(totalGood > 0 || totalBad > 0) && (
                                      <span className="text-[7px] bg-black/20 px-1 py-0.2 rounded flex items-center gap-1 font-bold ml-1">
                                        <span className="text-emerald-300">✓{totalGood}</span>
                                        <span className="text-white/40">|</span>
                                        <span className="text-rose-300">✘{totalBad}</span>
                                      </span>
                                    )}
                                  </span>
                                </button>

                                {(!isFinalAssembly && totalGood > 0) && (
                                  <button
                                    onClick={() => handleProcessClick(selectedJob, false, 0, mg.group_id || mg._id)}
                                    className="px-4 py-2 bg-[#00897b] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 animate-in slide-in-from-right-4 duration-300 whitespace-nowrap"
                                  >
                                    <Sun className="w-2.5 h-2.5 text-orange-300" />
                                    <span>PROCESS ({totalGood} {inwardingUnit})</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* BOTTOM ROW: Progress Bar */}
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${progressPercent >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  PROGRESS: {progressPercent}%
                                </span>
                              </div>
                              <div className="flex-1 h-2 bg-slate-50 rounded-full relative overflow-hidden border border-slate-100 shadow-inner">
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                              </div>
                              <span className="text-[9px] font-black text-slate-400">{progressPercent}%</span>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </section>

                    {isFinalAssembly && (
                      <div className="bg-white rounded-[2rem] border border-emerald-200 shadow-sm overflow-hidden p-8 flex flex-col items-center justify-center space-y-4">
                        <div className="flex flex-col items-center text-center">
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Final Assembly</h4>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 max-w-sm leading-relaxed">
                            This job requires materials from all groups to be assembled together. The maximum quantity you can process is limited by the group with the lowest ready quantity.
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                            Max Assembleable: {maxAssembleableQty} PCS
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleProcessClick(selectedJob, true, maxAssembleableQty)}
                          disabled={maxAssembleableQty <= 0}
                          className={`mt-4 px-8 py-4 ${maxAssembleableQty > 0 ? 'bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] shadow-emerald-600/20' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2`}
                        >
                          <Sun className={`w-4 h-4 ${maxAssembleableQty > 0 ? 'text-orange-300' : 'text-slate-400'}`} />
                          PROCESS FINAL ASSEMBLY
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#f8fafc]">
                <Inbox className="w-20 h-20 text-slate-200 mb-6" />
                <h3 className="text-base font-black text-slate-400 uppercase tracking-[0.2em]">SELECT A JOB FROM PIPELINE</h3>
              </div>
            )
          ) : (
            tabs.filter(t => t.id !== 'BROWSER').map(tab => {
              return (
                <div
                  key={tab.id}
                  className={`h-full bg-[#f8fafc] overflow-y-auto scrollbar scrollbar-thumb-slate-300 scrollbar-track-slate-100 scrollbar-w-2 ${activeTabId === tab.id ? 'block' : 'hidden'}`}
                >
                    <AssemblyProcessScreen
                      jobId={tab.jobId || tab.id}
                      groupId={tab.groupId}
                      isCombined={tab.isCombined}
                      bottleneckQty={tab.bottleneckQty}
                      floor={floor}
                      onClose={() => handleCloseTab({ stopPropagation: () => { } }, tab.id)}
                      onComplete={() => {
                        if (refreshData) refreshData();
                        handleCloseTab({ stopPropagation: () => { } }, tab.id);
                      }}
                    />
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Files Viewer Modal */}
      <FilesModal
        isOpen={showFilesModal}
        onClose={() => setShowFilesModal(false)}
        files={filesToConfirm}
        jobInfo={selectedJob || {}}
        onDownload={handleDownloadSingle}
      />

      {/* Material Inward Modal */}
      <MaterialInwardModal
        isOpen={showInwardModal}
        onClose={() => {
          setShowInwardModal(false);
          setSelectedMaterialGroup(null);
        }}
        job={selectedJob}
        materialGroup={selectedMaterialGroup}
        floor={floor}
        hideCutTime={true}
      />
    </div>
  );
}
