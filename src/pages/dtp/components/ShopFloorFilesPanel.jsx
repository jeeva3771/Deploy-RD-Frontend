import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { getFileNamev2 } from '../../../utils/helper/FilenameURL';
import { downloadFile } from '../../../reducer/standalone_bomReducer';
import { updateFinalPrepSectionStatus } from '../../../reducer/dtpStudioReducer';
import { toast } from 'react-toastify';

const ShopFloorFilesPanel = ({ job, sectionId, processIndex, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [previewImage, setPreviewImage] = useState(null);
    const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
    const [completedCount, setCompletedCount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Get current process for editing partial qty
    const currentProcess = useMemo(() => {
        if (!processIndex || !job.job_sheet?.materialprocess) return null;
        const [mpIdx, procIdx] = processIndex.split('.').map(n => parseInt(n) - 1);
        return job.job_sheet.materialprocess[mpIdx]?.processes?.[procIdx];
    }, [job, processIndex]);

    // Update completedCount when modal opens
    useEffect(() => {
        if (isPartialModalOpen && currentProcess) {
            setCompletedCount(currentProcess.completed_qty || '');
        }
    }, [isPartialModalOpen, currentProcess]);

    if (!job || !isOpen) return null;

    // Use job_quantity as fallback if not per-process
    const totalJobQty = parseInt(job.job_quantity || job.job_qty || 0);

    // Filter files for the specific sectionId
    const prepData = job.final_prep_files?.find(f => f.material_group_id === sectionId) || {};
    const productionFiles = prepData.production_files || (prepData.production_file?.file_url ? [prepData.production_file] : []) || [];
    const referenceImages = prepData.reference_images || (prepData.reference_image?.file_url ? [prepData.reference_image] : []) || [];

    // Find section name for display
    const sectionName = job.job_sheet?.materialprocess?.find(mp => mp.material_group_id === sectionId)?.material_group_name || 'Section Files';

    // Find the specific process to get current status/qty if needed
    let processName = '';
    if (processIndex) {
        const [mpIdx, procIdx] = processIndex.split('.').map(n => parseInt(n) - 1);
        const proc = job.job_sheet?.materialprocess?.[mpIdx]?.processes?.[procIdx];
        processName = proc?.process_name || '';
    }

    const handleDownload = (url) => {
        if (url) {
            dispatch(downloadFile(url));
        }
    };

    const handleAction = async (status, quantity = null) => {
        try {
            setIsProcessing(true);
            await dispatch(updateFinalPrepSectionStatus({
                id: job._id,
                materialGroupId: sectionId,
                processIndex: processIndex, // Pass the specific process index
                status: status,
                completedQty: quantity ? parseInt(quantity) : undefined
            })).unwrap();

            toast.success(`Process ${processName} status updated to ${status}`);
            if (status === 'Partially Completed') setIsPartialModalOpen(false);
        } catch (error) {
            console.error("Action error:", error);
            toast.error(error.message || "Failed to update status");
        } finally {
            setIsProcessing(false);
        }
    };

    const submitPartial = (e) => {
        e.preventDefault();
        const count = parseInt(completedCount);
        if (isNaN(count) || count <= 0) return toast.error("Please enter a valid quantity");

        if (count >= totalJobQty) {
            return toast.error(`Quantity must be less than total (${totalJobQty}). For full completion, use the Complete button.`);
        }

        handleAction('Partially Completed', count);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[50] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Partial Completion Modal */}
            {isPartialModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
                            <h3 className="font-bold text-slate-800">Partially Completed</h3>
                            <button onClick={() => setIsPartialModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={submitPartial} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Completed Quantity</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="Enter completed count"
                                    value={completedCount}
                                    onChange={(e) => setCompletedCount(e.target.value)}
                                    min="0"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPartialModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium shadow-sm shadow-amber-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isProcessing && <i className="fa-solid fa-spinner fa-spin"></i>}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div
                className={`fixed inset-y-0 right-0 w-[800px] bg-white shadow-2xl transform transition-transform duration-300 z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{job.sub_job_no || job.job_no}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-slate-500 font-medium">{sectionName}</p>
                            {processName && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <p className="text-sm text-blue-600 font-bold">{processName}</p>
                                    {currentProcess?.status && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-1 ${currentProcess.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            currentProcess.status === 'Partially Completed' ? 'bg-amber-100 text-amber-700' :
                                                currentProcess.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    currentProcess.status === 'Paused' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'
                                            }`}>
                                            {currentProcess.status}
                                            {currentProcess.status === 'Partially Completed' && currentProcess.completed_qty && ` (${currentProcess.completed_qty}/${totalJobQty})`}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Production Files */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-100 pb-2">
                            <i className="fa-solid fa-file-lines text-blue-500"></i>
                            <span>Production Files ({productionFiles.length})</span>
                        </div>

                        {productionFiles.length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-400 italic border border-slate-100 dash">
                                No production files available for this section.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {productionFiles.map((file, idx) => {
                                    const fileUrl = file.file_url;
                                    const fileName = fileUrl ? getFileNamev2(fileUrl) : `File ${idx + 1}`;
                                    return (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors flex justify-between items-center group shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <i className="fa-solid fa-file-zipper"></i>
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-slate-700 truncate w-60" title={fileName}>{fileName}</p>
                                                    {/* <p className="text-[10px] text-slate-400 uppercase font-bold">{file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : ''}</p> */}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(fileUrl)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white transition-colors"
                                                title="Download"
                                            >
                                                <i className="fa-solid fa-download"></i>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Reference Images */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-100 pb-2">
                            <i className="fa-solid fa-images text-indigo-500"></i>
                            <span>Reference Images ({referenceImages.length})</span>
                        </div>

                        {referenceImages.length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-400 italic border border-slate-100">
                                No reference images available for this section.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {referenceImages.map((file, idx) => {
                                    const fileUrl = file.file_url;
                                    return (
                                        <div key={idx} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                            <img
                                                src={fileUrl}
                                                alt="Reference"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setPreviewImage(fileUrl)}
                                                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                                                    title="Preview"
                                                >
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(fileUrl)}
                                                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                                                    title="Download"
                                                >
                                                    <i className="fa-solid fa-download"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer / Action Area */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto shrink-0">
                    {job.status?.toLowerCase() === 'shop floor' ? (
                        <div className="flex gap-3 justify-center items-center">
                            {(currentProcess?.status === 'Pending' || !currentProcess?.status) && (
                                <button
                                    onClick={() => handleAction('In Progress')}
                                    disabled={isProcessing}
                                    className="flex-1 max-w-[200px] bg-blue-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <i className="fa-solid fa-play mr-2"></i> Start
                                </button>
                            )}

                            {currentProcess?.status === 'Paused' && (
                                <button
                                    onClick={() => handleAction('In Progress')}
                                    disabled={isProcessing}
                                    className="flex-1 max-w-[200px] bg-indigo-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <i className="fa-solid fa-rotate-left mr-2"></i> Restart
                                </button>
                            )}

                            {currentProcess?.status === 'In Progress' && (
                                <>
                                    <button
                                        onClick={() => handleAction('Paused')}
                                        disabled={isProcessing}
                                        className="flex-1 max-w-[200px] bg-slate-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-pause mr-2"></i> Pause
                                    </button>
                                    <button
                                        onClick={() => setIsPartialModalOpen(true)}
                                        disabled={isProcessing}
                                        className="flex-1 max-w-[200px] bg-amber-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-battery-half mr-2"></i> Partial
                                    </button>
                                    <button
                                        onClick={() => handleAction('Completed')}
                                        disabled={isProcessing}
                                        className="flex-1 max-w-[200px] bg-green-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-check mr-2"></i> Complete
                                    </button>
                                </>
                            )}

                            {currentProcess?.status === 'Partially Completed' && (
                                <>
                                    <button
                                        onClick={() => handleAction('Paused')}
                                        disabled={isProcessing}
                                        className="flex-1 max-w-[200px] bg-slate-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-pause mr-2"></i> Pause
                                    </button>
                                    <button
                                        onClick={() => handleAction('Completed')}
                                        disabled={isProcessing}
                                        className="flex-1 max-w-[200px] bg-green-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <i className="fa-solid fa-check mr-2"></i> Complete
                                    </button>
                                </>
                            )}

                            {currentProcess?.status === 'Completed' && (
                                <div className="text-center py-2 px-6 bg-green-50 rounded-lg border border-green-100 min-w-[300px] flex flex-col items-center shadow-sm">
                                    <p className="text-sm text-green-700 font-bold mb-1">
                                        <i className="fa-solid fa-circle-check mr-2"></i>
                                        This process is complete
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        If you want to restart, <button onClick={() => handleAction('In Progress')} className="text-blue-600 font-bold hover:underline decoration-2 underline-offset-2">click here</button>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-amber-50 rounded-xl border border-amber-100 shadow-sm mx-auto max-w-sm">
                            <p className="text-amber-800 font-bold text-sm flex items-center justify-center gap-3">
                                <i className="fa-solid fa-hourglass-half animate-pulse"></i>
                                Please wait until the job comes to shop floor
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ShopFloorFilesPanel;
