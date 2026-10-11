import React, { useState, useMemo } from 'react';
import {
    CheckCircle2,
    ArrowLeft,
    Search,
    Inbox,
    Package,
    Calendar,
    ChevronRight,
    Factory,
    RefreshCcw,
    FileText
} from 'lucide-react';
import MobileCompletedJobDetailView from './MobileCompletedJobDetailView';

const MobileCompletedJobsView = ({
    jobs = [],
    processColors = {},
    onImageClick,
    onBackToPipeline
}) => {
    // Mobile screen state: 'LIST' | 'DETAIL'
    const [mobileScreen, setMobileScreen] = useState('LIST');
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const completedJobs = useMemo(() => {
        let filtered = jobs.filter(j => j.status === 'Completed');
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
            theme: processColors[job.process_name?.toUpperCase()] || {
                bg: 'bg-white',
                text: 'text-slate-900',
                pill: 'bg-slate-100',
                border: 'border-slate-200'
            }
        }));
    }, [jobs, searchTerm, processColors]);

    const handleSelectJob = (job) => {
        setSelectedJob(job);
        setMobileScreen('DETAIL');
    };

    if (mobileScreen === 'DETAIL' && selectedJob) {
        return (
            <MobileCompletedJobDetailView
                job={selectedJob}
                onBack={() => setMobileScreen('LIST')}
                onImageClick={onImageClick}
            />
        );
    }

    return (
        <div className="h-full flex-1 flex flex-col min-h-0 bg-[#f8fafc] overflow-hidden select-none">
            {/* Header Bar */}
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
                <button
                    onClick={onBackToPipeline}
                    className="flex items-center gap-2 text-xs font-black text-white hover:text-emerald-400 active:scale-95 transition-all uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <span>Back to Pipeline</span>
                </button>
                <div className="flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        {completedJobs.length} COMPLETED
                    </span>
                </div>
            </div>

            {/* Search Filter */}
            <div className="px-3.5 pt-3 pb-1 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="SEARCH COMPLETED JOBS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                    />
                </div>
            </div>

            {/* Completed Job Cards (Pipeline-Style Card View) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-16 touch-pan-y overscroll-contain">
                {completedJobs.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200">
                        <Inbox className="w-10 h-10 opacity-30 text-slate-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">No Completed Jobs Found</span>
                    </div>
                ) : (
                    completedJobs.map((job) => {
                        const mainMat = job.material_groups?.[0]?.materials?.find(m => {
                            const cat = m.category_type?.toLowerCase() || '';
                            return !cat.includes('consumable') && !cat.includes('hardware');
                        });
                        const previewImage = job.preview_image || job.artwork_pdf || mainMat?.material_image || null;

                        return (
                            <div
                                key={job._id}
                                onClick={() => handleSelectJob(job)}
                                className="bg-white rounded-2xl border-2 border-emerald-200/70 hover:border-emerald-400 shadow-xs flex overflow-hidden cursor-pointer active:scale-[0.99] transition-all relative"
                            >
                                {/* Left emerald bar */}
                                <div className="w-1.5 bg-emerald-500 shrink-0" />

                                <div className="p-3.5 flex-1 flex gap-3 items-center min-w-0">
                                    {/* Image Thumbnail */}
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="job preview"
                                                className="w-full h-full object-cover"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onImageClick) onImageClick(previewImage);
                                                }}
                                            />
                                        ) : (
                                            <Package className="w-6 h-6 text-slate-400 stroke-1" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-xs font-black text-slate-900 truncate">
                                                    {job.job_no}/{job.sub_job_no}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[8.5px] font-black uppercase tracking-wider shrink-0 border border-emerald-200">
                                                    ✓ COMPLETED
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] font-black text-slate-700 truncate uppercase mb-1.5">
                                            {job.client_name}
                                        </p>

                                        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 pt-1 border-t border-slate-100">
                                            <span className="truncate">QTY: <strong className="text-slate-900 font-black">{job.total_qty || 100} PCS</strong></span>
                                            <span className="flex items-center gap-1 text-emerald-600 font-black uppercase tracking-wider">
                                                VIEW DETAILS <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MobileCompletedJobsView;
