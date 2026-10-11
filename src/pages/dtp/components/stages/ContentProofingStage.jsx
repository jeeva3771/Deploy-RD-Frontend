import React from 'react';
import { getFileNamev2 } from '../../../../utils/helper/FilenameURL';

const ContentProofingStage = ({
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
    const contentFiles = job.content_proofing_files || [];
    const isApproved = contentFiles.some(f => f.status === 'Approved');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 font-primary">Content Proofing</h2>
                {isApproved && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <i className="fa-solid fa-circle-check"></i>
                        <span className="text-xs font-bold uppercase tracking-wider font-primary">Phase Approved</span>
                    </div>
                )}
                <button
                    onClick={onShare}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors"
                >
                    <i className="fa-solid fa-share-nodes"></i> Share Proofs
                </button>
            </div>

            {!isSalesPerson && (
                <div
                    className="bg-slate-50 border-2 py-6 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-indigo-400 hover:bg-slate-100 transition-all cursor-pointer group"
                    onClick={() => inputRef.current?.click()}
                >
                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-300 group-hover:text-indigo-400 mb-4 transition-colors"></i>
                    <p className="text-lg font-medium text-slate-600 mb-4 font-primary">Upload Content Proof</p>
                    <button className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm font-primary">
                        Choose Files
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => onProofUpload(e, 'content')}
                        accept="image/*,application/pdf"
                        multiple
                    />
                </div>
            )}

            {/* Uploaded Proofs List */}
            <div className="space-y-4">
                {contentFiles.slice().reverse().map((fileObj, idx) => {
                    const version = contentFiles.length - idx;
                    const file = fileObj.file_url;
                    const fileName = file ? getFileNamev2(file) : `Proof Version ${version}`;

                    return (
                        <div key={fileObj._id} className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${fileObj.status === 'Approved' ? 'border-emerald-100' :
                            fileObj.status === 'Rejected' ? 'border-red-100' : 'border-slate-100'
                            }`}>
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors relative group/preview"
                                        onClick={() => onDownload({ url: file })}
                                    >
                                        <i className={`fa-solid ${file?.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500'} text-xl`}></i>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity rounded">
                                            <i className="fa-solid fa-download text-white text-sm"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 font-primary truncate max-w-[400px]" title={fileName}>{fileName}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-primary">Version {version} • {new Date(fileObj.uploaded_at).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {fileObj.status === 'Pending' && (
                                        <>
                                            {!isSalesPerson && (
                                                <button
                                                    onClick={() => onDelete(fileObj)}
                                                    className="px-3 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onReject(fileObj._id, 'content')}
                                                className="px-4 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded transition-colors font-primary border border-transparent hover:border-red-100"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => onApprove(fileObj._id, 'content')}
                                                className="px-4 py-1.5 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-all shadow-sm font-primary border border-emerald-600"
                                            >
                                                Approve
                                            </button>
                                        </>
                                    )}
                                    {fileObj.status === 'Approved' && (
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider font-primary">
                                                Approved <i className="fa-solid fa-check-circle text-emerald-600"></i>
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
                                                Rejected <i className="fa-solid fa-times-circle text-red-600"></i>
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
                            {fileObj.status === 'Rejected' && (
                                <div className="bg-red-50/50 px-4 py-3 border-t border-red-50 flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <i className="fa-solid fa-circle-exclamation text-red-500 mt-1 text-sm"></i>
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
                                            <i className="fa-solid fa-paperclip"></i> View reference file
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ContentProofingStage;
