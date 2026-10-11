import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, X, AlertCircle, Activity, Inbox, ArrowLeft, RefreshCcw,
    CheckCircle2, Package, Layers, Sun, AlertTriangle, ChevronRight,
    LayoutGrid, MoreVertical, FileText, Clock, Scissors, Palette, Wrench, Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import MaterialInwardModal from './MaterialInwardModal';
import AssemblyProcessScreen from './AssemblyProcessScreen';
import MobileProcessScreen from './MobileProcessScreen';
import JobCard from './JobCard';
import AssemblyBayCompletedMobileView from './AssemblyBayCompletedMobileView';

const getProcessIcon = (processName = '') => {
    const name = processName.toLowerCase();
    if (name.includes('laser') || name.includes('cut')) return <Scissors className="w-2.5 h-2.5 shrink-0" />;
    if (name.includes('paint') || name.includes('spray') || name.includes('print') || name.includes('uv')) return <Palette className="w-2.5 h-2.5 shrink-0 text-amber-500" />;
    if (name.includes('assembly') || name.includes('labour')) return <Wrench className="w-2.5 h-2.5 shrink-0 text-purple-600" />;
    return <Zap className="w-2.5 h-2.5 shrink-0" />;
};

/* ─────────────────────────────────────────────────────────────────────────────
   AssemblyBayMobileView
   Mobile orchestrator for the Assembly Bay operator experience.
   Screens: PIPELINE → JOB_DETAIL → PROCESS
───────────────────────────────────────────────────────────────────────────── */
const AssemblyBayMobileView = ({
    jobs = [],
    machines = [],
    processColors = {},
    onImageClick,
    refreshData,
    floor,
    activeProcessIds = [],
    operatorTeams = [],
    loading = false,
}) => {
    // ── Navigation state ──────────────────────────────────────────────────────
    const [screen, setScreen] = useState('PIPELINE'); // 'PIPELINE' | 'JOB_DETAIL' | 'PROCESS' | 'COMPLETED'
    const [selectedJob, setSelectedJob] = useState(null);
    const [processContext, setProcessContext] = useState(null); // { groupId, isCombined, bottleneckQty }

    // ── Filters ───────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // ── Modals & Mobile Process State ─────────────────────────────────────────
    const [showInwardModal, setShowInwardModal] = useState(false);
    const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(null);
    const [togglingSampling, setTogglingSampling] = useState(null);

    const [processUpsCount, setProcessUpsCount] = useState(5);
    const [inspectedGoodCount, setInspectedGoodCount] = useState(0);
    const [inspectedBadCount, setInspectedBadCount] = useState(0);
    const [handoverQty, setHandoverQty] = useState('');
    const [processLogs, setProcessLogs] = useState([
        { time: '15:42', text: '✓ PRIMARY CONFIRMED: 5 UPS/CYCLE' },
        { time: '15:35', text: 'CONSOLE READY' }
    ]);

    // ── Sync selectedJob when pipeline data refreshes ─────────────────────────
    useEffect(() => {
        if (selectedJob) {
            const updated = jobs.find(j => j._id === selectedJob._id);
            if (updated && updated !== selectedJob) setSelectedJob(updated);
        }
    }, [jobs, selectedJob]);

    // ── Filtered pipeline ─────────────────────────────────────────────────────
    const pipelineJobs = useMemo(() => {
        let filtered = jobs.filter(j => activeProcessIds.includes(String(j.process_id)));
        if (searchTerm) {
            const s = searchTerm.toUpperCase();
            filtered = filtered.filter(j =>
                j.job_no?.toUpperCase().includes(s) ||
                j.sub_job_no?.toUpperCase().includes(s) ||
                j.client_name?.toUpperCase().includes(s)
            );
        }
        return filtered;
    }, [jobs, activeProcessIds, searchTerm]);

    // ── Final assembly (multiple groups) logic ────────────────────────────────
    const isFinalAssembly = useMemo(() => (selectedJob?.material_groups?.length || 0) > 1, [selectedJob]);

    const maxAssembleableQty = useMemo(() => {
        if (!isFinalAssembly || !selectedJob) return 0;
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
            if (bom?.materialprocess) {
                const processGroup = bom.materialprocess.find(p =>
                    p.material_group_name?.toLowerCase().trim() === mg.group_name?.toLowerCase().trim() ||
                    String(p.material_group_id) === String(mg.group_id || mg._id)
                );
                if (processGroup) processesList = processGroup.processes || [];
            }
            const cuttingIndex = processesList.findIndex(p =>
                p.process_name?.toLowerCase().includes('laser') ||
                p.process_name?.toLowerCase().includes('cutting') ||
                p.process_name?.toLowerCase().includes('cut')
            );
            const currentProcessIndex = processesList.findIndex(p =>
                p.process_name?.toLowerCase().trim() === selectedJob?.process_name?.toLowerCase().trim()
            );
            const isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
            const finalGoodQtyPcs = isSheetMaterial && !isSubsequent ? totalGood * ups : totalGood;
            if (finalGoodQtyPcs < minQty) minQty = finalGoodQtyPcs;
        });
        return minQty === Infinity ? 0 : minQty;
    }, [selectedJob, isFinalAssembly]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleToggleSampling = async (jobId, groupId, currentValue = false) => {
        try {
            setTogglingSampling(groupId);
            await refreshData(jobId, { material_group_id: groupId, sampling_on: !currentValue });
        } catch (err) {
            console.error('Error toggling sampling:', err);
        } finally {
            setTogglingSampling(null);
        }
    };

    const handleOpenProcess = (groupId = null, isCombined = false, bottleneckQty = 0) => {
        setProcessContext({ groupId, isCombined, bottleneckQty });
        setScreen('PROCESS');
    };

    const handleJobSelect = (job) => {
        setSelectedJob(job);
        setScreen('JOB_DETAIL');
    };

    const handleBack = () => {
        if (screen === 'PROCESS') { setScreen('JOB_DETAIL'); return; }
        if (screen === 'JOB_DETAIL') { setScreen('PIPELINE'); return; }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN: PROCESS
    // ─────────────────────────────────────────────────────────────────────────
    if (screen === 'PROCESS' && selectedJob && processContext) {
        return (
            <div className="flex flex-col h-full bg-[#f0f2f8] overflow-hidden">
                {/* Back bar */}
                <div className="bg-slate-900 px-3.5 py-3 flex items-center gap-3 shrink-0 border-b border-slate-800 shadow-md">
                    <button
                        onClick={handleBack}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all border border-slate-700 shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <div className="text-[13px] font-black uppercase tracking-wider truncate drop-shadow-sm" style={{ color: '#ffffff' }}>
                            {selectedJob.job_no}/{selectedJob.sub_job_no}
                        </div>
                        <div className="text-[9.5px] font-black font-extrabold uppercase tracking-wide" style={{ color: '#ffffff' }}>
                            {processContext.isCombined ? 'FINAL ASSEMBLY' : 'PROCESS SCREEN'}
                        </div>
                    </div>
                </div>

                {/* Embedded AssemblyProcessScreen */}
                <div className="flex-1 overflow-hidden">
                    <AssemblyProcessScreen
                        jobId={selectedJob._id}
                        groupId={processContext.groupId}
                        isCombined={processContext.isCombined}
                        bottleneckQty={processContext.bottleneckQty}
                        floor={floor}
                        onClose={handleBack}
                        onComplete={() => {
                            if (refreshData) refreshData();
                            handleBack();
                        }}
                    />
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN: COMPLETED
    // ─────────────────────────────────────────────────────────────────────────
    if (screen === 'COMPLETED') {
        return (
            <AssemblyBayCompletedMobileView
                jobs={jobs}
                processColors={processColors}
                onImageClick={onImageClick}
                onBackToPipeline={() => setScreen('PIPELINE')}
            />
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN: JOB DETAIL
    // ─────────────────────────────────────────────────────────────────────────
    if (screen === 'JOB_DETAIL' && selectedJob) {
        const accentColor = floor?.accent || '#8b5cf6';

        return (
            <div className="flex flex-col h-full bg-[#f0f2f8] overflow-hidden">

                {/* Header */}
                <div className="bg-slate-900 px-3.5 py-3 flex items-center gap-3 shrink-0 border-b border-slate-800 shadow-md">
                    <button
                        onClick={handleBack}
                        className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl flex items-center justify-center border border-slate-700 shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-black uppercase tracking-wider truncate drop-shadow-sm" style={{ color: '#ffffff' }}>
                            {selectedJob.job_no}/{selectedJob.sub_job_no}
                        </div>
                        <div className="text-[9.5px] font-extrabold uppercase tracking-wide truncate" style={{ color: '#38bdf8' }}>
                            {selectedJob.client_name || 'N/A'} · {selectedJob.process_name || 'Assembly'}
                        </div>
                    </div>
                    {selectedJob.is_hold && (
                        <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8.5px] font-extrabold uppercase rounded-lg shrink-0">ON HOLD</span>
                    )}
                    {selectedJob.is_escalated && (
                        <span className="px-2 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[8.5px] font-extrabold uppercase rounded-lg shrink-0 animate-pulse">ESCALATED</span>
                    )}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">

                    {/* Job Overview card */}
                    <div
                        className="rounded-2xl p-4 text-white space-y-3 relative overflow-hidden shadow-2xl"
                        style={{ background: `linear-gradient(160deg, ${accentColor}dd 0%, ${accentColor}aa 100%)` }}
                    >
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-3">
                            {(selectedJob.product_image || selectedJob.product_image_url) ? (
                                <img
                                    src={selectedJob.product_image || selectedJob.product_image_url}
                                    alt={selectedJob.product_name}
                                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 shrink-0 cursor-zoom-in"
                                    onClick={() => onImageClick && onImageClick(selectedJob.product_image || selectedJob.product_image_url)}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/20">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[13px] font-black text-white truncate">{selectedJob.job_no}/{selectedJob.sub_job_no}</h3>
                                <p className="text-[9px] text-white/70 font-bold uppercase">{selectedJob.client_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'TOTAL QTY', value: selectedJob.total_qty || '—' },
                                { label: 'GROUPS', value: selectedJob.material_groups?.length || 1 },
                                { label: 'DUE', value: selectedJob.job_completion_date || 'N/A', small: true },
                            ].map(({ label, value, small }) => (
                                <div key={label} className="bg-white/15 rounded-xl px-2.5 py-2 text-center">
                                    <span className="text-[7.5px] font-black text-white/60 uppercase tracking-widest block">{label}</span>
                                    <span className={`font-black text-white ${small ? 'text-[9px]' : 'text-sm'}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hold / Escalated banner */}
                    {(selectedJob.is_hold || selectedJob.is_escalated) && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-wide">Production Blocked</h4>
                                <p className="text-[9px] text-rose-500 mt-0.5 leading-relaxed">
                                    {selectedJob.is_hold && 'This job is ON HOLD. '}
                                    {selectedJob.is_escalated && 'This job is ESCALATED — supervisor review required.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Material Groups */}
                    <div className="space-y-2.5">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Material Groups</h3>

                        {selectedJob.material_groups?.map((mg, idx) => {
                            const mainMat = mg.materials?.find(m => {
                                const cat = m.category_type?.toLowerCase() || '';
                                return !cat.includes('consumable') && !cat.includes('hardware');
                            });
                            const matSize = mainMat?.material_input?.size || mg.size || 'Standard';
                            const isSheetMaterial = mainMat?.material_type?.toLowerCase() === 'sheet';
                            const totalSheets = mainMat?.quantity || mg.sheets_required || 0;
                            const outsourcedSheets = mg.assigned_outsource_sheets || 0;
                            const inHouseSheets = totalSheets - outsourcedSheets;
                            const ups = mainMat?.material_input?.ups || mg.ups || 1;
                            const inHouseQty = inHouseSheets * ups;

                            const bom = selectedJob?.bom_id;
                            let processesList = [];
                            if (bom?.materialprocess) {
                                const processGroup = bom.materialprocess.find(p =>
                                    p.material_group_name?.toLowerCase().trim() === mg.group_name?.toLowerCase().trim() ||
                                    String(p.material_group_id) === String(mg.group_id || mg._id)
                                );
                                if (processGroup) processesList = processGroup.processes || [];
                            }
                            const cuttingIndex = processesList.findIndex(p =>
                                p.process_name?.toLowerCase().includes('laser') ||
                                p.process_name?.toLowerCase().includes('cutting') ||
                                p.process_name?.toLowerCase().includes('cut')
                            );
                            const currentProcessIndex = processesList.findIndex(p =>
                                p.process_name?.toLowerCase().trim() === selectedJob?.process_name?.toLowerCase().trim()
                            );
                            const isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
                            const inwardingUnit = isSheetMaterial ? (isSubsequent ? 'PCS' : 'SH') : 'PCS';
                            const targetQty = isSheetMaterial ? (isSubsequent ? inHouseQty : inHouseSheets) : inHouseSheets;

                            const inwardLogs = mg.inward_history || [];
                            const totalGood = inwardLogs.reduce((acc, l) => acc + (l.good_qty || 0), 0);
                            const totalBad = inwardLogs.reduce((acc, l) => acc + (l.bad_qty || 0), 0);
                            const progressPercent = Math.min(100, Math.round(mg.progress || 0));
                            const isReady = totalGood >= targetQty;
                            const groupId = mg._id || mg.group_id;

                            return (
                                <div key={groupId || idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                                    {/* Top: Icon + Name + badge */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                                            <Activity className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-black text-slate-800 uppercase">{mg.group_name}</h4>
                                                <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[8px] font-black rounded-md border border-teal-100 uppercase tracking-widest">
                                                    {selectedJob.process_name || 'ASSEMBLY'}
                                                </span>
                                                {selectedJob.is_reprocess && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 text-[8px] font-black rounded-md uppercase">REPROCESS</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[8.5px] font-bold text-slate-400 flex items-center gap-1">
                                                    <LayoutGrid className="w-2.5 h-2.5" />{matSize}
                                                </span>
                                                <span className="text-[8.5px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Activity className="w-2.5 h-2.5 text-rose-400" />
                                                    {isSheetMaterial && !isSubsequent ? `${inHouseSheets}SH / ${inHouseQty}UPS` : `${inHouseQty} Pcs`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Inward stats */}
                                    {(totalGood > 0 || totalBad > 0) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                                                <span className="text-[7.5px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">INWARDED GOOD</span>
                                                <span className="text-base font-black text-emerald-600">{totalGood} <span className="text-[9px] font-bold">{inwardingUnit}</span></span>
                                            </div>
                                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-center">
                                                <span className="text-[7.5px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">REJECTED</span>
                                                <span className="text-base font-black text-orange-600">{totalBad} <span className="text-[9px] font-bold">{inwardingUnit}</span></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[8px] font-black uppercase shrink-0 ${progressPercent >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                PROGRESS: {progressPercent}%
                                            </span>
                                            <span className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 ${isReady ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {isReady ? 'READY' : 'AWAITING MATERIAL'}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
                                        </div>
                                    </div>

                                    {/* Sampling toggle */}
                                    {selectedJob.job_type?.toLowerCase() === 'production' && !selectedJob.is_reprocess && (
                                        <button
                                            onClick={() => !selectedJob.is_hold && handleToggleSampling(selectedJob._id, groupId, !!mg.sampling_on)}
                                            disabled={togglingSampling === groupId || !!selectedJob.is_hold}
                                            className={`flex items-center justify-between gap-2.5 px-3 py-2 w-full rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${mg.sampling_on ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Activity className={`w-3 h-3 ${mg.sampling_on ? 'animate-pulse' : ''}`} />
                                                SAMPLING {mg.sampling_on ? 'ON' : 'OFF'}
                                            </span>
                                            <div className={`w-8 h-4 p-0.5 ${mg.sampling_on ? 'bg-cyan-500' : 'bg-slate-300'} rounded-full transition-colors flex items-center ${mg.sampling_on ? 'justify-end' : 'justify-start'}`}>
                                                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                            </div>
                                        </button>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex flex-col gap-2.5 pt-1">
                                        <button
                                            onClick={() => { setSelectedMaterialGroup(mg); setShowInwardModal(true); }}
                                            style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                                            className="w-full px-4 py-3 active:scale-[0.99] text-[11px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2" style={{ color: '#ffffff' }}>
                                                <Package className="w-4 h-4 text-white" />
                                                INWARD MATERIAL
                                            </span>
                                            {(totalGood > 0 || totalBad > 0) ? (
                                                <span className="text-[8px] bg-black/25 px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1.5">
                                                    <span className="text-emerald-300">✓{totalGood}</span>
                                                    <span className="text-white/40">|</span>
                                                    <span className="text-rose-300">✘{totalBad}</span>
                                                </span>
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-white/70" />
                                            )}
                                        </button>

                                        {!isFinalAssembly && totalGood > 0 && (
                                            <button
                                                onClick={() => handleOpenProcess(groupId, false, 0)}
                                                style={{ backgroundColor: '#0d9488', color: '#ffffff' }}
                                                className="w-full px-4 py-3 active:scale-[0.99] text-[11px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-between"
                                            >
                                                <span className="flex items-center gap-2" style={{ color: '#ffffff' }}>
                                                    <Sun className="w-4 h-4 text-amber-300" />
                                                    PROCESS MATERIAL
                                                </span>
                                                <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 bg-black/20 rounded-md" style={{ color: '#ccfbf1' }}>
                                                    {totalGood} {inwardingUnit}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Final Assembly CTA */}
                    {isFinalAssembly && (
                        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5 space-y-4 flex flex-col items-center text-center">
                            <div>
                                <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Final Assembly</h4>
                                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed max-w-xs">
                                    All material groups must be assembled together. Bottleneck limits max quantity.
                                </p>
                            </div>
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                                Max Assembleable: {maxAssembleableQty} PCS
                            </span>
                            <button
                                onClick={() => handleOpenProcess(null, true, maxAssembleableQty)}
                                disabled={maxAssembleableQty <= 0}
                                style={{
                                    backgroundColor: maxAssembleableQty > 0 ? '#059669' : '#cbd5e1',
                                    color: maxAssembleableQty > 0 ? '#ffffff' : '#64748b'
                                }}
                                className="w-full py-3.5 text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
                            >
                                <Sun className={`w-4 h-4 ${maxAssembleableQty > 0 ? 'text-amber-300' : 'text-slate-400'}`} />
                                <span style={{ color: maxAssembleableQty > 0 ? '#ffffff' : '#64748b' }}>
                                    PROCESS FINAL ASSEMBLY
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="h-4 shrink-0" />
                </div>

                {/* Material Inward Modal */}
                <MaterialInwardModal
                    isOpen={showInwardModal}
                    onClose={() => { setShowInwardModal(false); setSelectedMaterialGroup(null); }}
                    job={selectedJob}
                    materialGroup={selectedMaterialGroup}
                    floor={floor}
                    hideCutTime={true}
                />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN: PIPELINE (default)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-[#f0f2f8] overflow-hidden">

            {/* Toolbar */}
            <div className="bg-slate-900 px-3.5 py-3 flex items-center gap-2 border-b border-slate-800 shrink-0 shadow-md">
                <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-black uppercase tracking-widest leading-none" style={{ color: '#ffffff' }}>Assembly Bay</div>
                    <div className="text-[8.5px] font-extrabold mt-0.5" style={{ color: '#94a3b8' }}>{pipelineJobs.length} jobs in queue</div>
                </div>

                <div className="flex items-center gap-1.5">
                    {isSearchOpen ? (
                        <div className="flex items-center gap-1.5">
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search job no..."
                                className="bg-slate-700 border border-slate-600 text-white text-[9px] font-bold placeholder:text-slate-400 px-2.5 py-1.5 rounded-lg focus:outline-none w-36"
                            />
                            <button
                                onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                                className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600"
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {refreshData && (
                        <button
                            onClick={() => refreshData()}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600"
                            title="Refresh Data"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => setScreen('COMPLETED')}
                        className="px-2 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500 shadow-xs active:scale-95 transition-all"
                        title="Completed Jobs"
                    >
                        <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                        <span>Done</span>
                    </button>
                </div>
            </div>

            {/* Pipeline list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
                        <RefreshCcw className="w-8 h-8 animate-spin text-cyan-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Loading Jobs...</span>
                    </div>
                ) : pipelineJobs.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                        <Inbox className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No jobs in queue</p>
                    </div>
                ) : (
                    pipelineJobs.map(job => {
                        const theme = processColors?.getThemeForName?.(job.process_name) || {
                            bg: 'bg-cyan-50/60',
                            border: 'border-cyan-300',
                            text: 'text-slate-900',
                            pill: 'bg-cyan-100/80',
                            bar: 'bg-cyan-500'
                        };

                        return (
                            <JobCard
                                key={job._id}
                                job={{
                                    ...job,
                                    id: `${job.job_no}/${job.sub_job_no}`,
                                    customer: job.client_name,
                                    color: theme.bar || 'bg-cyan-500',
                                    theme
                                }}
                                onClick={() => handleJobSelect(job)}
                                onImageClick={onImageClick}
                                isActive={selectedJob?._id === job._id}
                            />
                        );
                    })
                )}
                <div className="h-4 shrink-0" />
            </div>
        </div>
    );
};

export default AssemblyBayMobileView;
