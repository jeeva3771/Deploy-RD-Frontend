import React from 'react';
import { X, Download, LayoutGrid, Settings, FileText, Inbox, AlertCircle } from 'lucide-react';

const FilesModal = ({ isOpen, onClose, files, jobInfo, onDownload }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
                {/* Header */}
                <div className="p-4 sm:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight">Production Files</h2>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-900 text-white text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest">
                                    {jobInfo.job_no}/{jobInfo.sub_job_no}
                                </span>
                            </div>
                            <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Confirm and Download Assets</p>
                        </div>

                        {jobInfo.is_escalated && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl animate-pulse-red shrink-0">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Job Escalated</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm shrink-0"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 custom-sidebar-scroll">
                    {files.length === 0 ? (
                        <div className="text-center py-20">
                            <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No files found for this job</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {files.map((file, idx) => (
                                <div key={idx} className="group bg-slate-50 rounded-3xl p-5 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all flex gap-5 relative">
                                    {/* Quick Download Button */}
                                    <button
                                        onClick={() => onDownload(file.url)}
                                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all shadow-sm z-10"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    {/* Preview */}
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-200 flex-shrink-0 overflow-hidden relative shadow-sm">
                                        {file.isImage ? (
                                            <img
                                                src={file.url}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                                                onClick={() => onDownload(file.url, true)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-50">
                                                <FileText className="w-5 h-5 text-slate-300" />
                                                <span className="text-[7px] font-black text-slate-400 uppercase">{file.ext || 'FILE'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black rounded uppercase tracking-tighter shrink-0">{file.source}</span>
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest truncate">{file.name}</h4>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <LayoutGrid className="w-2.5 h-2.5" /> {file.groupName}
                                                </p>
                                                <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Settings className="w-2.5 h-2.5" /> {file.processName}
                                                </p>
                                                {file.instruction && (
                                                    <div className="mt-2 p-2 bg-white/60 border border-slate-100 rounded-xl">
                                                        <p className="text-[8px] font-bold text-rose-500 uppercase italic">Instruction: {file.instruction}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilesModal;
