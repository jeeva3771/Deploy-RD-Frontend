import React from 'react';
import { getFileNamev2 } from '../../../../utils/helper/FilenameURL';

const PushToFloorStage = ({ job, onEditFiles, onUpdateSectionStatus, onDownload, isProcessing }) => {
    const processes = job.job_sheet?.materialprocess || [];
    const finalPrepFiles = job.final_prep_files || [];

    const handleProcessSection = (section) => {
        onUpdateSectionStatus({
            materialGroupId: section.material_group_id,
            status: 'ready to shop floor'
        });
    };

    const handleEditSection = (section) => {
        onUpdateSectionStatus({
            materialGroupId: section.material_group_id,
            status: 'Pending'
        }).then(() => {
            onEditFiles();
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 font-primary">Step 5: Shop Floor Handover</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 font-primary">Process Management</h3>
                </div>

                <div className="divide-y divide-slate-100">
                    {processes.map((proc, idx) => {
                        const prepData = finalPrepFiles.find(f => f.material_group_id === proc.material_group_id) || {};
                        const isReady = prepData.status === 'ready to shop floor';

                        // Handle arrays with fallback to legacy single-file shape
                        const productionFiles = prepData.production_files || (prepData.production_file?.file_url ? [prepData.production_file] : []);
                        const referenceImages = prepData.reference_images || (prepData.reference_image?.file_url ? [prepData.reference_image] : []);

                        return (
                            <React.Fragment key={idx}>
                                {/* Section header row */}
                                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                                    <div className="flex items-start md:items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                            {proc.material_group_name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 font-primary">{proc.material_group_name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                                                {isReady ? 'Ready for Shop Floor' : 'Pending Verification'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 md:self-center self-end">
                                        <button
                                            onClick={() => handleEditSection(proc)}
                                            disabled={isProcessing}
                                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all font-primary disabled:opacity-50"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i> Edit Files
                                        </button>

                                        {isReady ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 min-w-[100px] justify-center">
                                                <i className="fa-solid fa-paper-plane mr-1"></i> SENT
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleProcessSection(proc)}
                                                disabled={isProcessing}
                                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all font-primary shadow-sm active:scale-95 disabled:opacity-50 min-w-[100px]"
                                            >
                                                {isProcessing ? '...' : 'Process'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* File previews */}
                                <div className="grid grid-cols-2 gap-4 px-6 pb-6 pt-2">
                                    {/* Production Files — download links */}
                                    <div className="flex flex-col gap-2">
                                        {productionFiles.length > 0 && (
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Production Files</div>
                                        )}
                                        {productionFiles.map((file, fIdx) => (
                                            <button
                                                key={`prod-${fIdx}`}
                                                onClick={() => onDownload({ url: file.file_url })}
                                                className="text-left text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg border border-indigo-100 transition-colors flex items-center gap-2 w-full"
                                                title={getFileNamev2(file.file_url)}
                                            >
                                                <i className="fa-solid fa-file-lines shrink-0"></i>
                                                <span className="truncate">{getFileNamev2(file.file_url) || 'Prod. File'}</span>
                                            </button>
                                        ))}
                                        {productionFiles.length === 0 && (
                                            <span className="text-xs text-slate-400 italic">No production files</span>
                                        )}
                                    </div>

                                    {/* Reference Images — thumbnail grid with lightbox */}
                                    <ReferenceImageGrid
                                        images={referenceImages}
                                        onDownload={onDownload}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {processes.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic text-sm">
                            No processes found for this job
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Reference image thumbnail grid with inline lightbox
───────────────────────────────────────────────────────────────────────────── */
const ReferenceImageGrid = ({ images, onDownload }) => {
    const [previewSrc, setPreviewSrc] = React.useState(null);
    const [previewName, setPreviewName] = React.useState('');

    if (images.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400 italic">No reference images</span>
            </div>
        );
    }

    return (
        <>
            {/* Lightbox overlay */}
            {previewSrc && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
                    onClick={() => setPreviewSrc(null)}
                >
                    {/* Close */}
                    <button
                        onClick={() => setPreviewSrc(null)}
                        className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl leading-none z-10 transition-colors"
                        title="Close"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>

                    {/* Download from lightbox */}
                    <button
                        onClick={() => onDownload({ url: previewSrc })}
                        className="absolute top-4 right-14 text-white/70 hover:text-emerald-400 text-xl leading-none z-10 transition-colors"
                        title="Download"
                    >
                        <i className="fa-solid fa-download" />
                    </button>

                    <div
                        className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={previewSrc}
                            alt={previewName}
                            className="max-w-[90vw] max-h-[90vh] object-contain block"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
                            <p className="text-white text-xs font-semibold truncate">{previewName}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Thumbnail strip */}
            <div className="flex flex-col gap-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reference Images</div>
                <div className="flex flex-wrap gap-2">
                    {images.map((file, fIdx) => {
                        const fileName = getFileNamev2(file.file_url) || `Image ${fIdx + 1}`;
                        return (
                            <div
                                key={`ref-${fIdx}`}
                                className="relative w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden group/thumb flex-shrink-0 cursor-pointer"
                                title={fileName}
                            >
                                <img
                                    src={file.file_url}
                                    alt={fileName}
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                                />
                                {/* Hover overlay with eye + download */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-150">
                                    <button
                                        title="Preview"
                                        onClick={() => { setPreviewSrc(file.file_url); setPreviewName(fileName); }}
                                        className="w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 flex items-center justify-center shadow-lg transition-colors"
                                    >
                                        <i className="fa-solid fa-eye text-sm text-slate-900" />
                                    </button>
                                    <button
                                        title="Download"
                                        onClick={() => onDownload({ url: file.file_url })}
                                        className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 flex items-center justify-center shadow-lg transition-colors"
                                    >
                                        <i className="fa-solid fa-download text-sm text-slate-900" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default PushToFloorStage;
