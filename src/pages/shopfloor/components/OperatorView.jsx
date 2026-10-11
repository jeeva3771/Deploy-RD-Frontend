import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Clock,
    Search,
    X,
    LayoutGrid,
    TextAlignJustify,
    AlertCircle,
    Monitor,
    Sun,
    Moon,
    Factory,
    ChevronRight,
    Settings,
    MoreVertical,
    Layers,
    Activity,
    FileText,
    Inbox,
    Download,
    MessageSquare,
    Package,
    Maximize2,
    AlertTriangle
} from 'lucide-react';
import { downloadFile } from '../../../reducer/standalone_bomReducer';
import { clearShopFloorFlags, fetchShopFloorJobById } from '../../../reducer/shopFloorReducer';
import { toast } from 'react-toastify';
import JobCard from './JobCard';
import FilesModal from './FilesModal';
import MaterialInwardModal from './MaterialInwardModal';
import ProcessScreenInternal from './ProcessScreenInternal';
import LaserOperatorMobileView from './LaserOperatorMobileView';

const OperatorView = ({ jobs, processes, laserProcesses, uvProcesses, processColors, onImageClick, refreshData, type = 'laser', machines = [], isUvFlow = false }) => {
    const dispatch = useDispatch();
    const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [forceDesktopMode, setForceDesktopMode] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileScreen(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobileView = isMobileScreen && !forceDesktopMode;

    const [searchTerm, setSearchTerm] = useState('');
    const [activeShiftFilter, setActiveShiftFilter] = useState('ALL');
    const [togglingSampling, setTogglingSampling] = useState(null);

    // Tab Management
    const [tabs, setTabs] = useState([{ id: 'BROWSER', label: 'BROWSER' }]);
    const [activeTabId, setActiveTabId] = useState('BROWSER');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [selectedJob, setSelectedJob] = useState(null);
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [showInwardModal, setShowInwardModal] = useState(false);
    const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(null);
    const [filesToConfirm, setFilesToConfirm] = useState([]);

    const handleClearFlag = async (type) => {
        try {
            await dispatch(clearShopFloorFlags({ id: selectedJob._id, type })).unwrap();
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
        if (processes && processes.length > 0 && (!machines || machines.length === 0) && type !== 'laser' && type !== 'uv') {
            return basePipelineJobs.filter(j => j.process_name?.toUpperCase() === activeShiftFilter);
        }
        if (type === 'uv') {
            return basePipelineJobs.filter(j => j.process_name?.toUpperCase().includes(activeShiftFilter));
        } else {
            return basePipelineJobs.filter(j =>
                j.assigned_shifts?.includes(activeShiftFilter) ||
                j.material_groups?.some(mg => mg.assigned_shifts?.includes(activeShiftFilter))
            );
        }
    }, [basePipelineJobs, activeShiftFilter, type, processes, machines]);



    useEffect(() => {
        if (!selectedJob && pipelineJobs.length > 0) {
            const firstJob = pipelineJobs[0];
            setSelectedJob(firstJob);
            dispatch(fetchShopFloorJobById(firstJob._id || firstJob.id));
        }
    }, [pipelineJobs, selectedJob, dispatch]);

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
    };

    const handleCloseTab = (e, tabId) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId) {
            setActiveTabId('BROWSER');
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
                // Find DTP Final Prep File either from latest top-level final_prep_files or fallback to mg.final_prep_file
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

                // Find Sales Order Process File either from latest top-level sales_order_id.process_files or fallback to mg.sales_order_process_file
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

    console.log("pipelineJobs", pipelineJobs)

    if (isMobileView) {
        return (
            <LaserOperatorMobileView
                jobs={jobs}
                processes={processes}
                laserProcesses={laserProcesses}
                uvProcesses={uvProcesses}
                processColors={processColors}
                onImageClick={onImageClick}
                refreshData={refreshData}
                type={type}
                machines={machines}
                isUvFlow={isUvFlow}
                onSwitchToDesktop={() => setForceDesktopMode(true)}
            />
        );
    }

    return (
        <div className="flex flex-1 h-full bg-[#f8fafc] overflow-hidden">
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
                        <h2 className="text-[11px] font-[1000] text-slate-800 uppercase tracking-[0.2em] italic">{type.toUpperCase()} PIPELINE</h2>
                        <button
                            onClick={() => setIsSidebarCollapsed(true)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors md:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 border-b border-slate-100">
                        <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl">
                            {(() => {
                                if (machines && machines.length > 0) {
                                    return ['ALL', ...machines.map((_, i) => i + 1)];
                                }
                                if (processes && processes.length > 0 && type !== 'laser') {
                                    return ['ALL', ...processes.map(p => p.name.toUpperCase())];
                                }
                                return type === 'laser' ? ['ALL', 1, 2, 3] : ['ALL', 'HANDTOP', 'MIMAKI'];
                            })().map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveShiftFilter(s)}
                                    className={`flex-1 py-1.5 px-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeShiftFilter === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {(() => {
                                        if (s === 'ALL') {
                                            return `ALL (${basePipelineJobs.length})`;
                                        }
                                        if (machines && machines.length > 0) {
                                            const count = basePipelineJobs.filter(j =>
                                                j.assigned_shifts?.includes(s) ||
                                                j.material_groups?.some(mg => mg.assigned_shifts?.includes(s))
                                            ).length;
                                            return `${machines[s - 1] || 'S' + s} (${count})`;
                                        }
                                        if (processes && processes.length > 0 && type !== 'laser' && type !== 'uv') {
                                            const count = basePipelineJobs.filter(j => j.process_name?.toUpperCase() === s).length;
                                            return `${s} (${count})`;
                                        }
                                        if (type === 'uv') {
                                            const count = basePipelineJobs.filter(j => j.process_name?.toUpperCase().includes(s)).length;
                                            return `${s} (${count})`;
                                        } else {
                                            const count = basePipelineJobs.filter(j =>
                                                j.assigned_shifts?.includes(s) ||
                                                j.material_groups?.some(mg => mg.assigned_shifts?.includes(s))
                                            ).length;
                                            return `S${s} (${count})`;
                                        }
                                    })()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-sidebar-scroll">
                        {pipelineJobs.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-300 italic">
                                <Inbox className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No jobs in queue</p>
                            </div>
                        ) : pipelineJobs.map(job => (
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
                        ))}
                    </div>
                </aside>
            )}


            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Tabs Bar */}
                <div className="h-14 bg-white border-b border-slate-100 flex items-end px-2 gap-2 overflow-x-auto no-scrollbar shrink-0 justify-between">
                    <div className="flex items-end gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="h-10 flex items-center rounded-t-xl z-20 transition-all px-2 text-slate-600 hover:text-slate-900"
                            title="Toggle Sidebar"
                        >
                            <TextAlignJustify className="w-5 h-5" />
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
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-[#009688] rounded-t-full"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                    {activeTabId === 'BROWSER' ? (
                        selectedJob ? (
                            <div className="h-full flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto px-5 py-8 bg-[#f8fafc]">
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {/* Notification Banners */}
                                        {(selectedJob.is_qty_changed || selectedJob.is_date_changed) && (
                                            <div className="space-y-3 mb-8">
                                                {selectedJob.is_qty_changed && (
                                                    <div className="flex items-center justify-between p-4 rounded-3xl bg-purple-50 border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h6 className="text-sm font-black text-purple-900 uppercase italic tracking-tight leading-none">Quantity Changed</h6>
                                                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">New Total Qty: {selectedJob.total_qty}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleClearFlag('qty')}
                                                            className="px-6 py-2 rounded-full bg-[#9333ea] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:bg-[#7e22ce] active:scale-95 transition-all"
                                                        >
                                                            ACKNOWLEDGE
                                                        </button>
                                                    </div>
                                                )}
                                                {selectedJob.is_date_changed && (
                                                    <div className="flex items-center justify-between p-4 rounded-3xl bg-amber-50 border border-amber-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                                                                <Clock className="w-5 h-5 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <h6 className="text-sm font-black text-amber-900 uppercase italic tracking-tight leading-none">Delivery Date Preponed</h6>
                                                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">New Date: {selectedJob.job_completion_date}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleClearFlag('date')}
                                                            className="px-6 py-2 rounded-full bg-[#d97706] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-200 hover:bg-[#b45309] active:scale-95 transition-all"
                                                        >
                                                            ACKNOWLEDGE
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                                        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
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
                                                            <div className="w-3 h-3 rounded-sm bg-orange-400"></div>
                                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                                                                {selectedJob.client_name || 'LASER CUT CO'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg text-rose-500">
                                                            <Layers className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                                {(() => {
                                                                    // Calculate total in-house units for the whole job
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
                                                            <span className="text-[9px] font-black uppercase tracking-widest">{selectedJob.job_completion_date || '30-MAR-2026'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Links */}
                                                    {/* <div className="flex flex-wrap gap-2 mt-4">
                                            {selectedJob.enquiry_id && (
                                                <a
                                                    href={`/enquiry?id=${selectedJob.enquiry_id._id || selectedJob.enquiry_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-[1000] text-slate-600 uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                                                >
                                                    <MessageSquare className="w-3 h-3 text-blue-500" />
                                                    ENQ: {selectedJob.enquiry_id.enquiry_no || selectedJob.enquiry_id.job_no || 'LINK'}
                                                </a>
                                            )}
                                            {selectedJob.dtp_id && (
                                                <a
                                                    href={`/dtp-studio?id=${selectedJob.dtp_id._id || selectedJob.dtp_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-[1000] text-slate-600 uppercase tracking-widest hover:border-cyan-400 hover:text-cyan-600 transition-all shadow-sm"
                                                >
                                                    <Monitor className="w-3 h-3 text-cyan-500" />
                                                    DTP: {selectedJob.dtp_id.job_no || 'LINK'}
                                                </a>
                                            )}
                                            {selectedJob.store_material_issue_id && (
                                                <a
                                                    href={`/store/material-issue?id=${selectedJob.store_material_issue_id._id || selectedJob.store_material_issue_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-[1000] text-slate-600 uppercase tracking-widest hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm"
                                                >
                                                    <Package className="w-3 h-3 text-orange-500" />
                                                    STORE: {selectedJob.store_material_issue_id.job_no || 'LINK'}
                                                </a>
                                            )}
                                        </div> */}
                                                </div>
                                            </div>                                            <div className='flex items-center justify-end gap-4'>
                                                {selectedJob.is_reprocess && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                                        <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">REPROCESS</span>
                                                    </div>
                                                )}
                                                {selectedJob.is_escalated && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl animate-pulse-red">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                                        <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Job Escalated</span>
                                                    </div>
                                                )}
                                                {selectedJob.is_hold && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl animate-pulse-amber">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Job On Hold</span>
                                                            {/* {selectedJob.hold_remarks && (
                                                                 <span className="text-[8px] font-bold text-amber-700 mt-0.5">{selectedJob.hold_remarks}</span>
                                                             )} */}
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleConfirmFiles}
                                                    disabled={selectedJob.is_hold}
                                                    className={`flex items-center gap-2 px-8 py-3 bg-[#009688] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-teal-600/10 hover:scale-105 transition-all ${selectedJob.is_hold ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                >
                                                    CONFIRM FILES
                                                </button>
                                            </div>
                                        </div>

                                        {/* Material Groups */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedJob.material_groups?.map((mg, idx) => {
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
                                                                                   if (shifts.includes(3) && type === 'laser') return '3';
                                                                                   return '1';
                                                                               })()}
                                                                           </span>
                                                                           {selectedJob.is_reprocess && (
                                                                               <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border-red-200 text-[9px] font-[1000] rounded-md border uppercase tracking-widest shadow-sm">
                                                                                   REPROCESS
                                                                               </span>
                                                                           )}
                                                                           {(() => {
                                                                               const theme = type === 'laser'
                                                                                   ? (processColors?.getThemeForName?.(selectedJob.process_name) || { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' })
                                                                                   : (processColors?.[selectedJob.process_name?.toUpperCase()] || { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' });
                                                                               return selectedJob.process_name ? (
                                                                                   <span className={`px-2.5 py-0.5 ${theme.bg} ${theme.text} ${theme.border || 'border-transparent'} text-[9px] font-[1000] rounded-md border uppercase tracking-widest shadow-sm`}>
                                                                                       {selectedJob.process_name}
                                                                                   </span>
                                                                               ) : null;
                                                                           })()}
                                                                       </div>

                                                                       <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                                                           {(() => {
                                                                               const mainMat = mg.materials?.find(m => {
                                                                                   const cat = m.category_type?.toLowerCase() || '';
                                                                                   return !cat.includes('consumable') && !cat.includes('hardware');
                                                                               });
                                                                               const size = mainMat?.material_input?.size || (mainMat?.material_input?.length ? `${mainMat.material_input.length}X${mainMat.material_input.width}` : '12X18IN');

                                                                               const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                                                                               const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                                                                               const inHouseSheets = totalSheets - outsourcedSheets;

                                                                               const ups = mainMat?.material_input?.ups || mg.ups || 0;
                                                                               const inHouseQty = inHouseSheets * ups;

                                                                               const isSubsequentCalc = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
                                                                               const isSheetMaterial = mainMat?.material_type === 'sheet';
                                                                               const showSheetsFormat = isSheetMaterial && (type !== 'uv' || !isSubsequentCalc);

                                                                               const inwardLogs = mg.inward_history || [];
                                                                               const totalGood = inwardLogs.reduce((acc, l) => acc + (l.good_qty || 0), 0);
                                                                               const isInHouseJob = totalGood >= totalSheets;
                                                                               const inHouseTargetQty = isInHouseJob
                                                                                   ? (selectedJob?.total_qty || inHouseQty)
                                                                                   : Math.max(0, (selectedJob?.total_qty || inHouseQty) - (outsourcedSheets * ups));

                                                                               let totalSqInch = 0;
                                                                               if (mainMat?.material_input?.size) {
                                                                                   const dims = mainMat.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
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
                                                           {(() => {
                                                               const inwardLogs = mg.inward_history || [];
                                                               const totalGood = inwardLogs.reduce((acc, l) => acc + (l.good_qty || 0), 0);
                                                               const totalBad = inwardLogs.reduce((acc, l) => acc + (l.bad_qty || 0), 0);
                                                               const mainMat = mg.materials?.find(m => {
                                                                   const cat = m.category_type?.toLowerCase() || '';
                                                                   return !cat.includes('consumable') && !cat.includes('hardware');
                                                               });
                                                               const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                                                               const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                                                               const inHouseSheets = totalSheets - outsourcedSheets;
                                                               const ups = mainMat?.material_input?.ups || mg.ups || 0;
                                                               const inHouseQty = inHouseSheets * ups;

                                                               const isSubsequentCalc = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
                                                               const isSheetMaterial = mainMat?.material_type === 'sheet';
                                                               const unitLabel = isSheetMaterial ? (isSubsequentCalc ? 'PCS' : 'SHEETS') : 'PCS';

                                                               const isInHouseJob = totalGood >= totalSheets;
                                                               const inHouseTargetQty = isInHouseJob
                                                                   ? (selectedJob?.total_qty || inHouseQty)
                                                                   : Math.max(0, (selectedJob?.total_qty || inHouseQty) - (outsourcedSheets * ups));
                                                               
                                                               const targetQty = isSheetMaterial ? (isSubsequentCalc ? inHouseTargetQty : inHouseSheets) : inHouseTargetQty;
                                                               const isReady = totalGood >= targetQty;

                                                               return (
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
                                                                               isReady 
                                                                                   ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                                                   : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                           }`}>
                                                                               {isReady ? 'READY FOR PRODUCTION' : 'AWAITING REMAINING MATERIAL'}
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

                                                                           {totalGood > 0 && (
                                                                               <button
                                                                                   onClick={() => handleProcessClick(selectedJob)}
                                                                                   className="px-4 py-2 bg-[#00897b] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-teal-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 animate-in slide-in-from-right-4 duration-300 whitespace-nowrap"
                                                                               >
                                                                                   <Sun className="w-2.5 h-2.5 text-orange-300" />
                                                                                   <span>PROCESS ({totalGood} {unitLabel})</span>
                                                                               </button>
                                                                           )}
                                                                       </div>
                                                                   </div>
                                                               );
                                                           })()}

                                                          {/* BOTTOM ROW: Progress Bar */}
                                                          {(() => {
                                                              const progressPercent = Math.min(100, Math.round(mg.progress || 0));

                                                              return (
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
                                                              );
                                                          })()}
                                                      </div>
                                                  );
                                             })}   
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Footer Stats */}
                                <footer className="h-11 bg-white border-t border-slate-200 flex items-center justify-between px-10 shrink-0 z-10">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL AREA</span>
                                    <span className="text-sm font-[1000] text-slate-900 italic tracking-tighter">{formatArea(totalArea)} SQ.IN</span>
                                </footer>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50">
                                <Inbox className="w-20 h-20 text-slate-200 mb-6" />
                                <h3 className="text-base font-black text-slate-400 uppercase tracking-[0.2em]">SELECT A JOB FROM PIPELINE</h3>
                            </div>
                        )
                    ) : (
                        tabs.filter(t => t.id !== 'BROWSER').map(tab => (
                            <div
                                key={tab.id}
                                className={`h-full bg-[#f8fafc] overflow-y-auto scrollbar scrollbar-thumb-slate-300 scrollbar-track-slate-100 scrollbar-w-2 ${activeTabId === tab.id ? 'block' : 'hidden'}`}
                            >
                                <ProcessScreenInternal
                                    type={type}
                                    jobId={tab.id}
                                    isUvFlow={isUvFlow}
                                    isActive={activeTabId === tab.id}
                                    onComplete={() => {
                                        refreshData();
                                        handleCloseTab({ stopPropagation: () => { } }, tab.id);
                                    }}
                                />
                            </div>
                        ))
                    )}

                </div>
            </main>

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

export default OperatorView;
