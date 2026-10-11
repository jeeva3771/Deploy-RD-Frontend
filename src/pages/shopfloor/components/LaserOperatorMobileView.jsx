import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Clock,
    Search,
    X,
    LayoutGrid,
    AlertCircle,
    Sun,
    Layers,
    Activity,
    FileText,
    Inbox,
    Package,
    AlertTriangle,
    ArrowLeft,
    ChevronRight,
    ChevronDown,
    RefreshCcw,
    CheckCircle2,
    SlidersHorizontal,
    Maximize2,
    Eye,
    Menu,
    Zap,
    Info,
    Minus,
    Plus
} from 'lucide-react';
import { downloadFile } from '../../../reducer/standalone_bomReducer';
import { clearShopFloorFlags, fetchShopFloorJobById } from '../../../reducer/shopFloorReducer';
import { toast } from 'react-toastify';
import JobCard from './JobCard';
import FilesModal from './FilesModal';
import MaterialInwardModal from './MaterialInwardModal';
import ProcessScreenInternal from './ProcessScreenInternal';
import MobileProcessScreen from './MobileProcessScreen';
import MobileCompletedJobsView from './MobileCompletedJobsView';

const LaserOperatorMobileView = ({
    jobs = [],
    processes = [],
    laserProcesses = [],
    uvProcesses = [],
    processColors = {},
    onImageClick,
    refreshData,
    type = 'laser',
    machines = [],
    isUvFlow = false,
    onSwitchToDesktop
}) => {
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.shopFloor || {});

    // Mobile View Section: 'PIPELINE' | 'DETAIL' | 'PROCESS'
    const [activeMobileView, setActiveMobileView] = useState('PIPELINE');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeShiftFilter, setActiveShiftFilter] = useState('ALL');
    const [togglingSampling, setTogglingSampling] = useState(null);
    const [showLegendModal, setShowLegendModal] = useState(false);
    const [showShiftDropdown, setShowShiftDropdown] = useState(false);
    const shiftDropdownRef = useRef(null);

    // Tab Management for process screens
    const [tabs, setTabs] = useState([{ id: 'BROWSER', label: 'BROWSER' }]);
    const [activeTabId, setActiveTabId] = useState('BROWSER');

    const [selectedJob, setSelectedJob] = useState(null);
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [showInwardModal, setShowInwardModal] = useState(false);
    const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(null);
    const [filesToConfirm, setFilesToConfirm] = useState([]);

    // Process Screen state for mobile view
    const [processUpsCount, setProcessUpsCount] = useState(5);
    const [inspectedGoodCount, setInspectedGoodCount] = useState(0);
    const [inspectedBadCount, setInspectedBadCount] = useState(0);
    const [handoverQty, setHandoverQty] = useState('');
    const [processLogs, setProcessLogs] = useState([
        { time: '15:42', text: '✓ PRIMARY CONFIRMED: 5 UPS/CYCLE (20 CYCLES TOTAL)' },
        { time: '15:35', text: 'CONSOLE READY' },
        { time: '15:30', text: 'JOB RD21059B LOADED' }
    ]);

    const handleClearFlag = async (flagType) => {
        if (!selectedJob) return;
        try {
            await dispatch(clearShopFloorFlags({ id: selectedJob._id, type: flagType })).unwrap();
            refreshData();
        } catch (error) {
            toast.error("Failed to clear notification");
        }
    };

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

    const filteredJobs = useMemo(() => {
        let filtered = jobs;
        if (searchTerm) {
            const s = searchTerm.toUpperCase();
            filtered = filtered.filter(j =>
                j.job_no?.toUpperCase().includes(s) ||
                j.sub_job_no?.toUpperCase().includes(s) ||
                j.client_name?.toUpperCase().includes(s)
            );
        }
        return filtered.map(job => ({
            ...job,
            theme: type === 'laser'
                ? (processColors.getThemeForName?.(job.process_name) || { bg: 'bg-white', text: 'text-slate-900', pill: 'bg-slate-100', border: 'border-slate-200' })
                : (processColors[job.process_name?.toUpperCase()] || { bg: 'bg-white', text: 'text-slate-900', pill: 'bg-slate-100', border: 'border-slate-200' })
        }));
    }, [jobs, searchTerm, processColors, type]);

    const basePipelineJobs = useMemo(() => {
        let activeShifts = type === 'laser' ? [1, 2, 3] : [1, 2];
        if (machines && machines.length > 0) {
            activeShifts = machines.map((_, i) => i + 1);
        } else if (processes && processes.length > 0) {
            activeShifts = processes.map((_, i) => i + 1);
        }
        return filteredJobs.filter(j => {
            const inHouseShifts = (j.assigned_shifts || []).filter(s => activeShifts.includes(s));
            const hasGroupInHouse = j.material_groups?.some(mg =>
                (mg.assigned_shifts || []).some(s => activeShifts.includes(s))
            );
            const isAssignedInHouse = inHouseShifts.length > 0 || hasGroupInHouse;
            return isAssignedInHouse && j.status !== 'Completed';
        });
    }, [filteredJobs, type, machines, processes]);

    const pipelineJobs = useMemo(() => {
        if (activeShiftFilter === 'ALL') return basePipelineJobs;
        if (machines && machines.length > 0) {
            const shiftNum = typeof activeShiftFilter === 'number' ? activeShiftFilter : parseInt(String(activeShiftFilter).replace('S', ''), 10);
            return basePipelineJobs.filter(j =>
                j.assigned_shifts?.includes(shiftNum) ||
                j.material_groups?.some(mg => mg.assigned_shifts?.includes(shiftNum))
            );
        }
        if (processes && processes.length > 0 && type !== 'laser' && type !== 'uv') {
            return basePipelineJobs.filter(j => j.process_name?.toUpperCase() === String(activeShiftFilter).toUpperCase());
        }
        if (type === 'uv') {
            return basePipelineJobs.filter(j => j.process_name?.toUpperCase().includes(String(activeShiftFilter).toUpperCase()));
        } else {
            const shiftNum = typeof activeShiftFilter === 'number' ? activeShiftFilter : parseInt(String(activeShiftFilter).replace('S', ''), 10);
            return basePipelineJobs.filter(j =>
                j.assigned_shifts?.includes(shiftNum) ||
                j.material_groups?.some(mg => mg.assigned_shifts?.includes(shiftNum))
            );
        }
    }, [basePipelineJobs, activeShiftFilter, type, processes, machines]);

    // Dynamic filter options and counts for dropdown (matches desktop OperatorView)
    const filterOptions = useMemo(() => {
        const rawKeys = (() => {
            if (machines && machines.length > 0) {
                return ['ALL', ...machines.map((_, i) => i + 1)];
            }
            if (processes && processes.length > 0 && type !== 'laser') {
                return ['ALL', ...processes.map(p => p.name.toUpperCase())];
            }
            return type === 'laser' ? ['ALL', 1, 2, 3] : ['ALL', 'HANDTOP', 'MIMAKI'];
        })();

        return rawKeys.map(s => {
            if (s === 'ALL') {
                return { key: 'ALL', label: 'ALL', count: basePipelineJobs.length };
            }
            if (machines && machines.length > 0) {
                const count = basePipelineJobs.filter(j =>
                    j.assigned_shifts?.includes(s) ||
                    j.material_groups?.some(mg => mg.assigned_shifts?.includes(s))
                ).length;
                const machineName = machines[s - 1] || `S${s}`;
                return { key: s, label: machineName, count };
            }
            if (processes && processes.length > 0 && type !== 'laser' && type !== 'uv') {
                const count = basePipelineJobs.filter(j => j.process_name?.toUpperCase() === s).length;
                return { key: s, label: s, count };
            }
            if (type === 'uv') {
                const count = basePipelineJobs.filter(j => j.process_name?.toUpperCase().includes(s)).length;
                return { key: s, label: s, count };
            } else {
                const count = basePipelineJobs.filter(j =>
                    j.assigned_shifts?.includes(s) ||
                    j.material_groups?.some(mg => mg.assigned_shifts?.includes(s))
                ).length;
                return { key: `S${s}`, rawShift: s, label: `S${s}`, count };
            }
        });
    }, [basePipelineJobs, type, machines, processes]);


    // Close shift dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(e.target)) {
                setShowShiftDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!selectedJob && pipelineJobs.length > 0) {
            const firstJob = pipelineJobs[0];
            setSelectedJob(firstJob);
        }
    }, [pipelineJobs, selectedJob]);

    useEffect(() => {
        if (selectedJob) {
            const updated = pipelineJobs.find(j => j._id === selectedJob._id);
            if (updated && updated !== selectedJob) setSelectedJob(updated);
        }
    }, [pipelineJobs, selectedJob]);

    useEffect(() => {
        if (selectedMaterialGroup && selectedJob) {
            const updated = selectedJob.material_groups?.find(mg => (mg.group_id || mg._id) === (selectedMaterialGroup.group_id || selectedMaterialGroup._id));
            if (updated && updated !== selectedMaterialGroup) setSelectedMaterialGroup(updated);
        }
    }, [selectedJob, selectedMaterialGroup]);

    // Notification counts for the top filter bar
    const notificationCounts = useMemo(() => {
        const dateChange = jobs.filter(j => j.is_date_changed).length;
        const dueToday = jobs.filter(j => j.is_due_today || j.job_completion_date === new Date().toISOString().split('T')[0]).length;
        const qtyChange = jobs.filter(j => j.is_qty_changed).length;
        const onHold = jobs.filter(j => j.is_hold).length;
        return { dateChange, dueToday, qtyChange, onHold };
    }, [jobs]);

    const { totalArea } = useMemo(() => {
        if (!selectedJob || !selectedJob.material_groups) return { totalArea: 0 };
        let area = 0;
        selectedJob.material_groups.forEach(mg => {
            const mainMat = mg.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            });
            const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
            const outsourcedSheets = mg.assigned_outsource_sheets || 0;
            const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);

            const sizeStr = mainMat?.material_input?.size || mg.size || '12x18';
            const dims = sizeStr.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
            if (dims.length >= 2) area += dims[0] * dims[1] * inHouseSheets;
        });
        return { totalArea: area };
    }, [selectedJob]);

    const formatArea = (val) => val >= 1000 ? (val / 1000).toFixed(1) + 'K' : Math.round(val);

    const handleJobSelect = (job) => {
        setSelectedJob(job);
        setActiveTabId('BROWSER');
        setActiveMobileView('DETAIL');
        dispatch(fetchShopFloorJobById(job._id || job.id));
    };

    const handleProcessClick = (job) => {
        const tabId = job._id;
        const existingTab = tabs.find(t => t.id === tabId);
        if (!existingTab) {
            setTabs([...tabs, {
                id: tabId,
                label: job.sub_job_no || job.job_no,
                type: 'PROCESS'
            }]);
        }
        setActiveTabId(tabId);
        setActiveMobileView('PROCESS');
    };

    const handleCloseTab = (e, tabId) => {
        if (e) e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId) {
            setActiveTabId('BROWSER');
            setActiveMobileView('DETAIL');
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

                const pf = selectedJob.sales_order_id?.process_files?.find(f =>
                    f.process_name === selectedJob.process_name &&
                    String(f.section_id || "") === String(mg.group_id || mg._id || "")
                ) || mg.sales_order_process_file;

                if (pf) {
                    if (pf.production_file) {
                        const isImg = pf.production_file.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
                        collectedFiles.push({
                            url: pf.production_file,
                            name: 'SO PROD FILE',
                            source: 'SALES ORDER',
                            groupName: mg.group_name,
                            processName: pf.process_name || selectedJob.process_name,
                            instruction: pf.production_instruction,
                            isImage: !!isImg,
                            ext: pf.production_file.split('.').pop().toUpperCase().split('?')[0]
                        });
                    }
                }
            });
        }
        setFilesToConfirm(collectedFiles);
        setShowFilesModal(true);
    };

    const handleDownloadSingle = (url, preview = false) => {
        if (preview && onImageClick) {
            onImageClick(url);
        } else {
            dispatch(downloadFile(url));
        }
    };

    // Calculate overall total units for selected job
    const totalInHouseUnits = useMemo(() => {
        if (!selectedJob || !selectedJob.material_groups) return selectedJob?.total_qty || 0;
        return selectedJob.material_groups.reduce((acc, group) => {
            const mainMat = group.materials?.find(m => {
                const cat = m.category_type?.toLowerCase() || '';
                return !cat.includes('consumable') && !cat.includes('hardware');
            });
            const totalSheets = mainMat?.quantity || group.sheets_required || 0;
            const outsourcedSheets = group.assigned_outsource_sheets || 0;
            const ups = mainMat?.material_input?.ups || group.ups || 0;
            return acc + ((totalSheets - outsourcedSheets) * ups);
        }, 0) || selectedJob.total_qty || 0;
    }, [selectedJob]);

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-[#f8fafc] overflow-hidden select-none">


            {/* MAIN CONTENT SCROLL AREA */}
            <main className={`flex-1 min-h-0 ${activeMobileView === 'PROCESS' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto touch-pan-y overscroll-contain'}`}>
                {activeMobileView === 'PIPELINE' && (
                    <div className="px-3.5 py-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                {type.toUpperCase()} PIPELINE
                            </h3>
                            {/* Shift filter dropdown */}
                            <div className="relative" ref={shiftDropdownRef}>
                                <button
                                    onClick={() => setShowShiftDropdown(prev => !prev)}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
                                >
                                    {(() => {
                                        const currentOpt = filterOptions.find(o => o.key === activeShiftFilter);
                                        const displayLabel = currentOpt ? currentOpt.label : activeShiftFilter;
                                        return `${displayLabel} (${pipelineJobs.length})`;
                                    })()}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showShiftDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showShiftDropdown && (
                                    <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 min-w-[190px] w-max max-w-[220px]">
                                        {filterOptions.map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => { setActiveShiftFilter(opt.key); setShowShiftDropdown(false); }}
                                                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-[11px] font-black uppercase tracking-wider transition-colors text-left ${
                                                    activeShiftFilter === opt.key
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="truncate shrink min-w-0">{opt.label}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                                    activeShiftFilter === opt.key
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>{opt.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2.5 px-0.5 py-0.5">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
                                    <RefreshCcw className="w-8 h-8 animate-spin text-cyan-600" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Pipeline Jobs...</span>
                                </div>
                            ) : pipelineJobs.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200">
                                    <Inbox className="w-8 h-8 opacity-30 text-slate-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">No Jobs Found</span>
                                </div>
                            ) : pipelineJobs.map((job) => {
                                const isSelected = selectedJob?._id === job._id;

                                // Compute dynamic status
                                const getJobStatus = (job) => {
                                    if (!job.job_completion_date) return { label: job.status || 'PENDING', color: 'text-slate-500', bar: 'bg-slate-400', date: 'text-slate-400' };
                                    const parts = job.job_completion_date.split(/[-/]/);
                                    let d;
                                    if (parts.length === 3) {
                                        // Handle DD-MM-YYYY or YYYY-MM-DD
                                        if (parts[0].length === 4) {
                                            d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                        } else {
                                            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                        }
                                    } else {
                                        d = new Date(job.job_completion_date);
                                    }
                                    if (!d || isNaN(d.getTime())) return { label: job.status || 'PENDING', color: 'text-slate-500', bar: 'bg-slate-400', date: 'text-slate-400' };
                                    const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
                                    if (d < today) return { label: 'OVERDUE', color: 'text-rose-500', bar: 'bg-rose-500', date: 'text-rose-500' };
                                    if (d.getTime() === today.getTime()) return { label: 'DUE TODAY', color: 'text-amber-500', bar: 'bg-amber-500', date: 'text-amber-500' };
                                    return { label: job.status || 'IN PROGRESS', color: 'text-emerald-600', bar: 'bg-emerald-500', date: 'text-slate-400' };
                                };
                                const jobStatus = getJobStatus(job);

                                return (
                                    <div
                                        key={job._id}
                                        onClick={() => handleJobSelect(job)}
                                        className={`bg-white rounded-2xl border-2 ${isSelected ? 'border-cyan-500 shadow-md shadow-cyan-500/10' : 'border-slate-200'} shadow-xs flex overflow-hidden cursor-pointer active:scale-[0.99] transition-all`}
                                    >
                                        {/* Left color bar — color reflects status */}
                                        <div className={`w-1.5 ${jobStatus.bar} shrink-0`}></div>

                                        <div className="p-3 flex-1 flex gap-3 items-center min-w-0">
                                            {/* Image Thumbnail */}
                                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                {job.product_image || job.product_image_url ? (
                                                    <img
                                                        src={job.product_image || job.product_image_url}
                                                        alt={job.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Activity className="w-5 h-5 text-slate-300" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${jobStatus.color}`}>
                                                        {jobStatus.label}
                                                    </span>
                                                    <span className={`text-[10px] font-bold ${jobStatus.date}`}>
                                                        {job.job_completion_date || '—'}
                                                    </span>
                                                </div>

                                                <h4 className="text-xs font-black text-slate-900 uppercase truncate mt-0.5">
                                                    {job.job_no}/{job.sub_job_no}
                                                </h4>

                                                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                                    {job.client_name || '—'}
                                                </p>

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded text-[8px] font-black uppercase tracking-wider truncate max-w-[140px]">
                                                        {job.process_name || '—'}
                                                    </span>
                                                    <span className="text-xs font-black text-slate-900 uppercase shrink-0">
                                                        QTY: {job.total_qty || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeMobileView === 'DETAIL' && (
                    <>
                        {/* 3. BROWSER / JOB DETAILS BREADCRUMB WITH BACK BUTTON */}
                        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveMobileView('PIPELINE')}
                                    className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg flex items-center justify-center active:scale-95 transition-all mr-1"
                                    title="Back to Pipeline"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <span className="bg-[#009688] text-white text-[10px] font-black px-2.5 py-1 rounded tracking-wider uppercase">BROWSER</span>
                                <span className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">/ JOB DETAILS</span>
                            </div>
                        </div>

                        {selectedJob ? (
                            <>
                                {/* 4. JOB DETAILS WHITE CARD */}
                                <div className="mx-3 my-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-start gap-3">
                                        {/* Product Thumbnail */}
                                        <div
                                            className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center"
                                            onClick={() => onImageClick && onImageClick(selectedJob.product_image || selectedJob.product_image_url)}
                                        >
                                            {(selectedJob.product_image || selectedJob.product_image_url) ? (
                                                <img
                                                    src={selectedJob.product_image || selectedJob.product_image_url}
                                                    alt={selectedJob.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Activity className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>

                                        {/* Job Title & Info */}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight truncate leading-tight">
                                                {selectedJob.job_no}/{selectedJob.sub_job_no}
                                            </h2>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5 truncate">
                                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                                                <span className="truncate">{selectedJob.client_name || 'CLIENT NAME'}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-2">
                                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black rounded uppercase tracking-wider">
                                                    {totalInHouseUnits} UNITS
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold rounded uppercase tracking-wider">
                                                    {selectedJob.job_completion_date || '1984-11-13'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <button
                                            onClick={() => {
                                                if (selectedJob.is_reprocess) handleClearFlag('reprocess');
                                                else toast.info("Job flagged for reprocess");
                                            }}
                                            className="w-full py-2.5 border border-rose-500 text-rose-600 hover:bg-rose-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                                        >
                                            REPROCESS
                                        </button>
                                        <button
                                            onClick={handleConfirmFiles}
                                            disabled={selectedJob.is_hold}
                                            className="w-full py-2.5 bg-[#009688] hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            CONFIRM FILES
                                        </button>
                                    </div>
                                </div>

                                {/* 5. MATERIAL GROUP / PROCESS CARD */}
                                {selectedJob.material_groups?.map((mg, mgIndex) => {
                                    const mainMat = mg.materials?.find(m => {
                                        const cat = m.category_type?.toLowerCase() || '';
                                        return !cat.includes('consumable') && !cat.includes('hardware');
                                    });
                                    const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                                    const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                                    const inHouseSheets = Math.max(0, totalSheets - outsourcedSheets);
                                    const ups = mainMat?.material_input?.ups || mg.ups || 1;
                                    const inHouseQty = inHouseSheets * ups;
                                    const size = mainMat?.material_input?.size || (mainMat?.material_input?.length ? `${mainMat.material_input.length}X${mainMat.material_input.width}` : (mg.size || '24X48'));

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

                                    const isSubsequentCalc = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
                                    const isSheetMaterial = mainMat?.material_type === 'sheet';
                                    const showSheetsFormat = isSheetMaterial && (type !== 'uv' || !isSubsequentCalc);

                                    const inwardLogs = mg.inward_history || [];
                                    const totalGood = inwardLogs.reduce((acc, l) => acc + (l.good_qty || 0), 0);
                                    const isReady = totalGood >= inHouseSheets;
                                    const progressPercent = Math.min(100, Math.round(mg.progress || 0));

                                    const shiftVal = (mg.assigned_shifts && mg.assigned_shifts.length > 0)
                                        ? mg.assigned_shifts[0]
                                        : (selectedJob.assigned_shifts?.[0] || '1');

                                    let totalSqInch = 0;
                                    if (mainMat?.material_input?.size) {
                                        const dims = mainMat.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                                        if (dims.length >= 2) totalSqInch = dims[0] * dims[1] * inHouseSheets;
                                    }

                                    return (
                                        <div key={mg._id || mgIndex} className="mx-3 my-3 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-3">
                                            {/* Header with Icon & Group Name */}
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <Activity className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{mg.group_name || `MATERIAL ${mgIndex + 1}`}</h3>
                                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black rounded uppercase tracking-wider flex items-center gap-1">
                                                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                            SHIFT {shiftVal}
                                                        </span>
                                                        {selectedJob.is_reprocess && (
                                                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 text-[8px] font-black rounded uppercase tracking-wider">
                                                                REPROCESS
                                                            </span>
                                                        )}
                                                        {selectedJob.process_name && (
                                                            <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-[8px] font-black rounded uppercase tracking-wider">
                                                                {selectedJob.process_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Specs Pills Row */}
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100 text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wider">
                                                    <LayoutGrid className="w-2.5 h-2.5 text-slate-400" />
                                                    {size}
                                                </div>
                                                {showSheetsFormat ? (
                                                    <>
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100 text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wider">
                                                            <Activity className="w-2.5 h-2.5 text-rose-400" />
                                                            {inHouseSheets}SH / {inHouseQty}UPS
                                                        </div>
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100 text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wider">
                                                            <Layers className="w-2.5 h-2.5 text-slate-400" />
                                                            {ups}UPS/SHEET
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100 text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wider">
                                                        <Activity className="w-2.5 h-2.5 text-rose-400" />
                                                        {inHouseQty} PCS
                                                    </div>
                                                )}
                                                {totalSqInch > 0 && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100 text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wider">
                                                        {formatArea(totalSqInch)} SQ.IN
                                                    </div>
                                                )}
                                            </div>

                                            {/* Process Pipeline Row */}
                                            {processesList.length > 0 && (
                                                <div className="pt-2 border-t border-slate-100">
                                                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0 mr-0.5">
                                                            PROCESS:
                                                        </span>
                                                        {processesList.map((proc, pIdx) => {
                                                            const isDone = pIdx < currentProcessIndex;
                                                            const isCurrent = pIdx === currentProcessIndex;

                                                            return (
                                                                <React.Fragment key={pIdx}>
                                                                    {pIdx > 0 && <span className="text-slate-300 font-black text-[8px] shrink-0">→</span>}
                                                                    <span className={`px-1.5 py-0.5 text-[8px] font-black rounded border uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                                                                        isDone 
                                                                            ? 'bg-teal-50 text-teal-600 border-teal-100' 
                                                                            : isCurrent 
                                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                                                    }`}>
                                                                        {isDone && <span className="w-1 h-1 rounded-full bg-teal-500"></span>}
                                                                        {isCurrent && <Activity className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />}
                                                                        <span>{proc.process_name}</span>
                                                                        {isCurrent && <span className="opacity-70 text-[7px]">(CURRENT)</span>}
                                                                    </span>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status & Sampling Toggle */}
                                            <div className="flex items-center justify-between gap-2 pt-0.5">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                                                    <Activity className="w-2.5 h-2.5 text-cyan-600" />
                                                    <span>SAMPLING ON</span>
                                                    <span className="w-5 h-3 bg-cyan-500 rounded-full flex items-center justify-end p-0.5">
                                                        <span className="w-2 h-2 bg-white rounded-full shadow-xs"></span>
                                                    </span>
                                                </div>

                                                <span className={`px-2 py-0.5 rounded border text-[8.5px] font-black uppercase tracking-wider ${isReady ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {isReady ? 'READY FOR PRODUCTION' : 'AWAITING MATERIAL'}
                                                </span>
                                            </div>

                                            {/* Action Buttons Row */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedMaterialGroup(mg);
                                                        setShowInwardModal(true);
                                                    }}
                                                    className="w-full py-2 bg-[#f39c12] hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                                                >
                                                    <span>INWARD MATERIAL</span>
                                                    {totalGood > 0 && (
                                                        <span className="text-[7.5px] bg-black/20 px-1 py-0.5 rounded font-bold">
                                                            ✓{totalGood}
                                                        </span>
                                                    )}
                                                </button>

                                                {totalGood > 0 ? (
                                                    <button
                                                        onClick={() => handleProcessClick(selectedJob)}
                                                        className="w-full py-2 bg-[#00897b] hover:bg-teal-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <Sun className="w-3 h-3 text-orange-300" />
                                                        <span>PROCESS ({totalGood})</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="w-full py-2 bg-slate-100 text-slate-300 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                                                    >
                                                        <span>PROCESS (0)</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1 pt-0.5">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                                    <span className="text-rose-500">PROGRESS: {progressPercent}%</span>
                                                    <span className="text-slate-700">{progressPercent}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                                                    <div
                                                        className="h-full bg-rose-500 transition-all duration-300 rounded-full"
                                                        style={{ width: `${progressPercent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-xs font-black uppercase tracking-widest">Select a job from pipeline</p>
                            </div>
                        )}
                        <div className="h-16 shrink-0" />
                    </>
                )}

                {/* PROCESS SCREEN VIEW */}
                {activeMobileView === 'PROCESS' && selectedJob && (
                    <div className="flex flex-col h-full bg-[#f0f2f8] overflow-hidden">
                        {/* Back bar */}
                        <div className="bg-slate-900 px-3 py-2 flex items-center gap-2 border-b border-slate-700 shrink-0 shadow-lg">
                            <button
                                type="button"
                                onClick={() => setActiveMobileView('DETAIL')}
                                className="p-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-lg transition-all shrink-0 flex items-center justify-center border border-slate-600"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">JOB</span>
                                <span className="text-[11px] font-black text-white uppercase truncate">
                                    {selectedJob.sub_job_no || selectedJob.job_no}
                                </span>
                                <span className="px-2 py-0.5 bg-teal-600 text-white rounded text-[8px] font-black uppercase tracking-wider shrink-0">
                                    {selectedJob.process_name || type.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        {/* Process Screen */}
                        <div className="flex-1 overflow-hidden">
                            <ProcessScreenInternal
                                type={type}
                                jobId={selectedJob._id}
                                isUvFlow={isUvFlow}
                                isActive={true}
                            />
                        </div>
                    </div>
                )}

                {/* COMPLETED JOBS MOBILE VIEW */}
                {activeMobileView === 'COMPLETED' && (
                    <MobileCompletedJobsView
                        jobs={jobs}
                        processColors={processColors}
                        onImageClick={onImageClick}
                        onBackToPipeline={() => setActiveMobileView('PIPELINE')}
                    />
                )}
            </main>

            {/* LEGEND MODAL */}
            {showLegendModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" />
                                Status Legend
                            </h3>
                            <button
                                onClick={() => setShowLegendModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2.5 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                                <span>Red: Overdue / Urgent Action Needed</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                                <span>Orange: In Progress / Awaiting Material</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0"></span>
                                <span>Teal: Ready for Production / Completed</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-[#4f46e5] shrink-0"></span>
                                <span>Purple: Active Browser Details</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowLegendModal(false)}
                            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider mt-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed Bottom Total Stats / Area Footer for Detail (Browser) View */}
            {activeMobileView === 'DETAIL' && (
                <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between shadow-2xl shrink-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL AREA</span>
                    <span className="text-sm font-[1000] text-slate-900 italic tracking-tight">{formatArea(totalArea)} SQ.IN</span>
                </footer>
            )}

            {/* Modals */}
            <FilesModal
                isOpen={showFilesModal}
                onClose={() => setShowFilesModal(false)}
                files={filesToConfirm}
                jobInfo={selectedJob}
                onDownload={handleDownloadSingle}
            />
            <MaterialInwardModal
                isOpen={showInwardModal}
                onClose={() => {
                    setShowInwardModal(false);
                    setSelectedMaterialGroup(null);
                }}
                job={selectedJob}
                materialGroup={selectedMaterialGroup}
            />
        </div>
    );
};

export default LaserOperatorMobileView;
