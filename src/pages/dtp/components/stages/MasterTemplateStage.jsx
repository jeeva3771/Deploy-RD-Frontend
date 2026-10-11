import React, { useState } from 'react';
import { getFileNamev2 } from '../../../../utils/helper/FilenameURL';
import ImageLightbox from '../../../common/ImageLightbox';

/*
   Main stage component
*/
const MasterTemplateStage = ({
    job,
    onProofUpload,
    onApprove,
    onReject,
    onDownload,
    inputRef,
    isSalesPerson,
    onDelete,
    onShare
}) => {
    const masterFiles = job.master_template_files || [];
    const isApproved = masterFiles.some(f => f.status === 'Approved');

    // Lightbox state
    const [previewSrc, setPreviewSrc] = useState(null);
    const [previewName, setPreviewName] = useState('');

    const openPreview = (src, name) => {
        setPreviewSrc(src);
        setPreviewName(name);
    };
    const closePreview = () => setPreviewSrc(null);

    return (
        <>
            {/* ── Lightbox ── */}
            <ImageLightbox src={previewSrc} fileName={previewName} onClose={closePreview} />

            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 font-primary">Master Template Approval</h2>
                    {isApproved && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            <i className="fa-solid fa-circle-check" />
                            <span className="text-xs font-bold uppercase tracking-wider font-primary">Phase Approved</span>
                        </div>
                    )}
                    <button
                        onClick={onShare}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors"
                    >
                        <i className="fa-solid fa-share-nodes" /> Share Proofs
                    </button>
                </div>

                {/* Upload area */}
                {!isSalesPerson && (
                    <div
                        className="bg-slate-50 border-2 py-6 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-indigo-400 hover:bg-slate-100 transition-all cursor-pointer group"
                        onClick={() => inputRef.current?.click()}
                    >
                        <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                        <p className="text-lg font-medium text-slate-600 mb-4 font-primary">Upload Proof</p>
                        <button className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm font-primary">
                            Choose Files
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => onProofUpload(e, 'master')}
                            accept=".jpeg,.jpg,.png"
                            multiple
                        />
                    </div>
                )}

                {/* File list */}
                <div className="space-y-4">
                    {masterFiles.slice().reverse().map((fileObj, idx) => {
                        const version = masterFiles.length - idx;
                        const file = fileObj.file_url;
                        const fileName = file ? getFileNamev2(file) : `Proof Version ${version}`;

                        return (
                            <div
                                key={fileObj._id}
                                className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${fileObj.status === 'Approved' ? 'border-emerald-100' :
                                    fileObj.status === 'Rejected' ? 'border-red-100' : 'border-slate-100'
                                    }`}
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Thumbnail with PREVIEW + DOWNLOAD overlay icons */}
                                        <div className="relative w-12 h-12 rounded bg-slate-50 border border-slate-200 overflow-hidden group/thumb flex-shrink-0">
                                            <img src={file} alt="Preview" className="w-full h-full object-cover" />

                                            {/* Overlay on hover — two icon buttons */}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                                {/* Preview icon */}
                                                <button
                                                    title="Preview"
                                                    onClick={() => openPreview(file, fileName)}
                                                    className="text-white hover:text-indigo-300 transition-colors"
                                                >
                                                    <i className="fa-solid fa-eye text-xs" />
                                                </button>

                                                {/* Download icon */}
                                                <button
                                                    title="Download"
                                                    onClick={() => onDownload({ url: file })}
                                                    className="text-white hover:text-emerald-300 transition-colors"
                                                >
                                                    <i className="fa-solid fa-download text-xs" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <div
                                                className="text-sm font-bold text-slate-900 font-primary truncate max-w-[400px]"
                                                title={fileName}
                                            >
                                                {fileName}
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-primary">
                                                Upload At • {(() => {
                                                    if (!fileObj.uploaded_at) return '-';
                                                    const d = new Date(fileObj.uploaded_at);
                                                    return isNaN(d.getTime())
                                                        ? (fileObj.uploaded_at.split(' ')[0] || fileObj.uploaded_at)
                                                        : d.toLocaleDateString();
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-3">
                                        {fileObj.status === 'Pending' && (
                                            <>
                                                {!isSalesPerson && (
                                                    <button
                                                        onClick={() => onDelete(fileObj)}
                                                        className="px-3 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onReject(fileObj._id, 'master')}
                                                    className="px-4 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded transition-colors font-primary border border-transparent hover:border-red-100"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => onApprove(fileObj._id, 'master')}
                                                    className="px-4 py-1.5 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-all shadow-sm font-primary border border-emerald-600"
                                                >
                                                    Approve
                                                </button>
                                            </>
                                        )}
                                        {fileObj.status === 'Approved' && (
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider font-primary">
                                                    Approved <i className="fa-solid fa-check-circle text-emerald-600" />
                                                </div>
                                                {(fileObj.approved_date_time || fileObj.approved_at || fileObj.action_by_name || fileObj.approved_by_name) && (
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {fileObj.action_by_name || fileObj.approved_by_name ? `${fileObj.action_by_name || fileObj.approved_by_name} • ` : ''}
                                                        {fileObj.approved_date_time || fileObj.approved_at}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {fileObj.status === 'Rejected' && (
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider font-primary">
                                                    Rejected <i className="fa-solid fa-times-circle text-red-600" />
                                                </div>
                                                {(fileObj.rejected_date_time || fileObj.rejected_at || fileObj.action_by_name || fileObj.rejected_by_name) && (
                                                    <span className="text-[10px] text-red-500 font-medium">
                                                        {fileObj.action_by_name || fileObj.rejected_by_name ? `${fileObj.action_by_name || fileObj.rejected_by_name} • ` : ''}
                                                        {fileObj.rejected_date_time || fileObj.rejected_at}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Rejection reason panel */}
                                {fileObj.status === 'Rejected' && (
                                    <div className="bg-red-50/50 px-4 py-3 border-t border-red-50 flex flex-col gap-2">
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-circle-exclamation text-red-500 mt-1 text-sm" />
                                            <div>
                                                <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 font-primary">Rejection Reason</div>
                                                <p className="text-sm text-red-600 font-primary">{fileObj.rejection_reason}</p>
                                            </div>
                                        </div>
                                        {fileObj.rejection_reference_file && (
                                            <button
                                                onClick={() => onDownload({ url: fileObj.rejection_reference_file })}
                                                className="text-xs text-red-700 hover:text-red-900 font-bold flex items-center gap-1 font-primary mt-1 w-fit"
                                            >
                                                <i className="fa-solid fa-paperclip" /> View reference file
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default MasterTemplateStage;
