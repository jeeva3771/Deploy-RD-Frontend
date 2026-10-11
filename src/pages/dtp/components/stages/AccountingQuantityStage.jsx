import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateAccountingDetails, uploadAccountingFile, deleteAccountingFile, fetchAllDTPJobs } from '../../../../reducer/dtpStudioReducer';
import { getFileNamev2 } from '../../../../utils/helper/FilenameURL';
import ConfirmationModal from '../../../components/ConfirmationModal';

const AccountingQuantityStage = ({ job, onUpdateAccountingQty, onUpdateSectionStatus, isProcessing, onRollback, isSalesPerson }) => {
    const dispatch = useDispatch();
    const processes = useMemo(() => job.job_sheet?.materialprocess || [], [job.job_sheet?.materialprocess]);
    const finalPrepFiles = useMemo(() => job.final_prep_files || [], [job.final_prep_files]);
    const [quantities, setQuantities] = useState({});

    // New state for accounting details
    const [accountingDetails, setAccountingDetails] = useState({
        trophies_count: '',
        blanks_count: ''
    });

    // Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileToDeleteId, setFileToDeleteId] = useState(null);

    const fileInputRef = useRef(null);

    // Initialize quantities from existing data
    useEffect(() => {
        const initialQty = {};
        processes.forEach(proc => {
            const prepData = finalPrepFiles.find(f => f.material_group_id === proc.material_group_id) || {};
            initialQty[proc.material_group_id] = prepData.accounting_quantity || job.job_quantity || 0;
        });
        setQuantities(initialQty);

        // Initialize details from job
        const savedTrophies = job.accounting_details?.trophies_count;
        const savedBlanks = job.accounting_details?.blanks_count;

        setAccountingDetails({
            trophies_count: savedTrophies != null ? savedTrophies : (job.job_quantity ?? ''),
            blanks_count: savedBlanks != null ? savedBlanks : ''
        });
    }, [job, processes, finalPrepFiles]);

    const handleQtyChange = (materialGroupId, value) => {
        setQuantities(prev => ({
            ...prev,
            [materialGroupId]: value
        }));
    };

    const handleSaveQty = (section) => {
        const qty = quantities[section.material_group_id];
        onUpdateAccountingQty({
            materialGroupId: section.material_group_id,
            accountingQuantity: qty,
            originalQuantity: job.job_quantity // Saving the reference actual qty
        });
    };

    const handleDetailsChange = (field, value) => {
        setAccountingDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveDetails = async () => {
        try {
            await dispatch(updateAccountingDetails({
                id: job._id || job.id,
                trophies_count: accountingDetails.trophies_count,
                blanks_count: accountingDetails.blanks_count
            })).unwrap();
            toast.success('Accounting details updated');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Update details error:", err);
            toast.error('Failed to update details');
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', type);

        try {
            await dispatch(uploadAccountingFile({
                id: job._id || job.id,
                formData
            })).unwrap();
            toast.success(`${type.toUpperCase()} file uploaded`);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("File upload error:", err);
            toast.error('Failed to upload file');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = (fileId) => {
        setFileToDeleteId(fileId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteFile = async () => {
        if (!fileToDeleteId) return;

        try {
            await dispatch(deleteAccountingFile({
                id: job._id || job.id,
                fileId: fileToDeleteId
            })).unwrap();
            toast.success('File deleted');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Delete file error:", err);
            toast.error('Failed to delete file');
        } finally {
            setIsDeleteModalOpen(false);
            setFileToDeleteId(null);
        }
    };

    const processingFiles = job.accounting_details?.processing_files || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 font-primary">Step 6: Accounting Quantity & Packing</h2>
                {onRollback && (
                    <button
                        onClick={onRollback}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200"
                        title="Rollback to Content Proofing"
                    >
                        <i className="fa-solid fa-arrow-rotate-left"></i> Rollback
                    </button>
                )}
            </div>

            {/* Job Level Details & Files */}
            <div>
                {/* Counts Input */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6 p-6">
                    <h3 className="font-bold text-slate-700 font-primary mb-4 border-b border-slate-100 pb-2">Final Counts</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Trophies</label>
                            <input
                                type="number"
                                value={accountingDetails.trophies_count}
                                readOnly
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none transition-all font-bold text-slate-500 cursor-not-allowed"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Blanks</label>
                            <input
                                type="number"
                                value={accountingDetails.blanks_count}
                                onChange={(e) => handleDetailsChange('blanks_count', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                                placeholder="0"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSaveDetails}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            Save Counts
                        </button>
                    </div>
                </div>

                {/* File Uploads */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
                    <h3 className="font-bold text-slate-700 font-primary mb-4 border-b border-slate-100 pb-2">Processing Files</h3>
                    <div className="flex gap-4 mb-4">
                        <div className="relative">
                            <input
                                type="file"
                                id="upload-csv"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'csv')}
                                disabled={isProcessing}
                            />
                            <label
                                htmlFor="upload-csv"
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                                <i className="fa-solid fa-file-csv"></i> Upload CSV
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                type="file"
                                id="upload-excel"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'excel')}
                                disabled={isProcessing}
                            />
                            <label
                                htmlFor="upload-excel"
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors cursor-pointer"
                            >
                                <i className="fa-solid fa-file-excel"></i> Upload Excel
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {processingFiles.length > 0 ? (
                            processingFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${file.file_type === 'csv' ? 'bg-emerald-100 text-emerald-600' :
                                            file.file_type === 'excel' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                            <i className={`fa-solid ${file.file_type === 'csv' ? 'fa-file-csv' :
                                                file.file_type === 'excel' ? 'fa-file-excel' : 'fa-file'
                                                }`}></i>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-700 truncate" title={file.original_name}>
                                                {file.original_name || getFileNamev2(file.file_url)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 capitalize">{file.file_type} File</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            title="Download"
                                        >
                                            <i className="fa-solid fa-download text-xs"></i>
                                        </a>
                                        {!isSalesPerson && (
                                            <button
                                                onClick={() => handleDeleteFile(file._id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <i className="fa-solid fa-trash text-xs"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-400 italic text-xs">No files uploaded</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section Quantities */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 font-primary">Update Section Quantities</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-primary">Section</th>
                                <th className="px-6 py-4 font-primary">Status</th>
                                <th className="px-6 py-4 font-primary">Actual Qty (Price Module)</th>
                                <th className="px-6 py-4 font-primary w-48">Accounting Qty</th>
                                <th className="px-6 py-4 font-primary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {processes.map((proc, idx) => {
                                const prepData = finalPrepFiles.find(f => f.material_group_id === proc.material_group_id) || {};
                                const isSaved = prepData.accounting_quantity !== undefined;
                                const originalQty = job.job_quantity || 0;

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">
                                                    {proc.material_group_name?.charAt(0) || 'P'}
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 font-primary">
                                                    {proc.material_group_name}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isSaved
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {isSaved ? 'Updated' : 'Pending Update'}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <span className="text-sm font-medium text-slate-600">
                                                {originalQty}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <input
                                                type="number"
                                                value={quantities[proc.material_group_id] || ''}
                                                onChange={(e) => handleQtyChange(proc.material_group_id, e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                placeholder="Enter Qty"
                                                disabled={isProcessing}
                                            />
                                        </td>

                                        <td className="px-6 py-4 align-middle text-right">
                                            <button
                                                onClick={() => handleSaveQty(proc)}
                                                disabled={isProcessing}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all font-primary shadow-sm active:scale-95 disabled:opacity-50 min-w-[80px]"
                                            >
                                                {isProcessing ? '...' : 'Update'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {processes.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No processes found for this job
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteFile}
                title="Confirm Delete"
                message="Are you sure you want to delete this accounting file? This action cannot be undone."
                confirmText="Delete"
                confirmColor="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};

export default AccountingQuantityStage;
