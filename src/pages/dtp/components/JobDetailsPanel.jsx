import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { downloadFile } from '../../../reducer/standalone_bomReducer';
import { updateSampleOrderById, deleteSampleOrderFile } from '../../../reducer/sampleSalesorderReducer';
import { fetchAllDTPJobs, updateJobStatus, updateDTPStage, uploadProof, approveRejectProof, deleteProof } from '../../../reducer/dtpStudioReducer';
import { getFileNamev2 } from '../../../utils/helper/FilenameURL';
import { toast } from 'react-toastify';
import JobHistoryPanel from './JobHistoryPanel';
import { fetchAllBOMs } from '../../../reducer/bomReducer';
import RejectProofModal from './RejectProofModal';
import IngestFilesStage from './stages/IngestFilesStage';
import MasterTemplateStage from './stages/MasterTemplateStage';
import ContentProofingStage from './stages/ContentProofingStage';
import FinalPrepStage from './stages/FinalPrepStage';
import PushToFloorStage from './stages/PushToFloorStage';
import AccountingQuantityStage from './stages/AccountingQuantityStage';
import { uploadFinalPrepFile, deleteFinalPrepFile, updateFinalPrepSectionStatus, holdUnholdDTPJob, sendUrgencyPrompt, rollbackToContentProofing } from '../../../reducer/dtpStudioReducer';
import ConfirmationModal from '../../components/ConfirmationModal';
import HoldModal from '../../components/HoldModal';
import UnholdModal from '../../components/UnholdModal';
import DtpFileShareModal from './DtpFileShareModal';
import JobDetailsPopup from '../../salesorder/components/JobDetailsPopup';
import ImageLightbox from '../../common/ImageLightbox';



const JobDetailsPanel = ({ job, isOpen, onClose, initialShowHistory = false, onBackToFolder, currentUser, userRole }) => {
    // Helper to determine the default active stage based on job status
    const getInitialStage = (status) => {
        switch (status) {
            case 'Master Template': return 'master';
            case 'Content Proofing': return 'proofing';
            case 'Final Prep': return 'final';
            case 'Push to Floor': return 'floor';
            case 'Accounting Quantity': return 'accounting';
            case 'Shop Floor': return 'accounting';
            case 'Reprocess': return 'accounting';
            case 'Completed': return 'accounting';
            default: return 'ingest';
        }
    };

    const [activeStage, setActiveStage] = useState('ingest');
    const [showHistory, setShowHistory] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedUpdateForRejection, setSelectedUpdateForRejection] = useState(null);
    const [rejectionType, setRejectionType] = useState(null); // 'master' or 'content'
    const [isProcessing, setIsProcessing] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Confirmation Modal state
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);

    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [isUnholdModalOpen, setIsUnholdModalOpen] = useState(false);
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false); // Add rollback modal state
    const [showJobDetailsPopup, setShowJobDetailsPopup] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);


    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const masterProofInputRef = useRef(null);
    const contentProofInputRef = useRef(null);

    const lastJobIdRef = useRef(null);
    const lastIsOpenRef = useRef(false);
    const { boms, loading } = useSelector(state => state.bom);

    // Group job sheet processes by department
    const groupedProcessesByDepartment = useMemo(() => {
        if (!boms || boms.length === 0) return {};

        const bomData = boms[0];
        const materialProcesses = bomData?.materialprocess || [];

        const grouped = {};

        materialProcesses.forEach((materialGroup) => {
            const processes = materialGroup.processes || [];

            processes.forEach((process) => {
                const department = process.department || "Uncategorized";

                if (!grouped[department]) {
                    grouped[department] = [];
                }

                grouped[department].push({
                    ...process,
                    material_group_id: materialGroup.material_group_id,
                    material_group_name: materialGroup.material_group_name,
                    material_total: materialGroup.material_total,
                    material_unit: materialGroup.material_unit,
                    material_input: materialGroup.material_input,
                });
            });
        });

        return grouped;
    }, [boms]);

    const isSalesPerson = (currentUser?.role === "Client Servicing Manager" || currentUser?.role === "Client Servicing Executive");


    // Sync showHistory and activeStage when panel opens or job changes
    React.useEffect(() => {
        const jobId = job?._id || job?.id;
        const isOpening = isOpen && !lastIsOpenRef.current;
        const isNewJob = isOpen && jobId !== lastJobIdRef.current;

        if (isOpening || isNewJob) {
            setShowHistory(initialShowHistory);
            setActiveStage(getInitialStage(job?.status));
        }

        lastIsOpenRef.current = isOpen;
        lastJobIdRef.current = jobId;
    }, [isOpen, job, initialShowHistory]);

    // Fetch BOMs when drawer opens with job_no and sub_job_no
    useEffect(() => {
        if (isOpen && job) {
            const params = {};

            if (job.job_no) {
                params.job_no = job.job_no;
            }

            if (job.sub_job_no) {
                params.sub_job_no = job.sub_job_no;
            }

            // Only fetch if we have at least one search parameter
            if (params.job_no || params.sub_job_no) {
                dispatch(fetchAllBOMs(params));
            }
        }
    }, [isOpen, job, dispatch]);

    if (!isOpen || !job) return null;

    const checkHold = () => {
        if (job.is_on_hold) {
            toast.error("Job is on hold. Unhold to perform actions.");
            return true;
        }
        return false;
    };

    // Handle file download
    const handleDownload = (file) => {
        if (!file?.url) return;
        dispatch(downloadFile(file.url));
    };

    // Handle file upload
    const handleFileUpload = async (e, tag = 'additional_files') => {
        if (checkHold()) return;
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const formData = new FormData();

        // Append tag to formData
        formData.append('tag', tag);

        // Append all selected files to the same key
        Array.from(selectedFiles).forEach(file => {
            formData.append('additional_files', file);
        });

        // FormData appears empty in console.log(formData)
        // Use Array.from() or formData.get() to see the content
        console.log("Upload targeting Sample Order ID:", job.sample_order_id);
        console.log("formData contents:", Array.from(formData.entries()));

        if (!job.sample_order_id) {
            toast.error('Sample Order link missing. Cannot upload files.');
            console.error("Critical Error: job.sample_order_id is missing for job:", job);
            return;
        }

        const payload = {
            id: job.sample_order_id?.id,
            formData: formData, // Match the key expected by the thunk
        };

        try {
            await dispatch(
                updateSampleOrderById(payload)
            ).unwrap();

            // Refresh the entire DTP dashboard to show new files and updated states
            dispatch(fetchAllDTPJobs());

            toast.success('Files uploaded successfully!');
            // Reset file input
            e.target.value = '';
        } catch (err) {
            console.error("Upload error:", err);
            toast.error('Failed to upload files');
            e.target.value = '';
        }
    };

    // Handle file delete

    const handleDeleteFile = async (file) => {
        if (isSalesPerson) return;
        if (!file?.url) return;
        setFileToDelete(file);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        const file = fileToDelete;

        // --- Final Prep File Deletion ---
        if (file.stageType === 'final_prep') {
            try {
                await dispatch(deleteFinalPrepFile({
                    id: job._id,
                    materialGroupId: file.materialGroupId,
                    fileType: file.fileType,
                    fileId: file._id
                })).unwrap();
                toast.success('File removed');
                dispatch(fetchAllDTPJobs());
            } catch (err) {
                console.error("Final prep delete error:", err);
                toast.error('Failed to remove file');
            } finally {
                setIsConfirmModalOpen(false);
                setFileToDelete(null);
            }
            return;
        }

        // Check if it's a DTP proof file deletion
        if (file.stageType) {
            try {
                // Assuming we add a new thunk 'deleteProof'
                await dispatch(deleteProof({
                    id: job._id,
                    fileId: file._id,
                    type: file.stageType
                })).unwrap();

                toast.success('Proof file deleted successfully');
                dispatch(fetchAllDTPJobs());
            } catch (err) {
                console.error("Delete proof error:", err);
                toast.error('Failed to delete proof file');
            } finally {
                setIsConfirmModalOpen(false);
                setFileToDelete(null);
            }
            return;
        }

        // --- Existing Sample Order File Deletion Logic ---
        // Ensure we have a sample order ID
        const sampleOrderId = job.sample_order_id?.id;

        if (!sampleOrderId) {
            toast.error("Sample Order ID missing");
            return;
        }

        try {
            if (file._id) {
                // Should use ID based deletion if available
                await dispatch(deleteSampleOrderFile({
                    id: sampleOrderId,
                    fileId: file._id
                })).unwrap();
            }

            toast.success('File deleted successfully');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Delete error:", err);
            toast.error('Failed to delete file');
        } finally {
            setIsConfirmModalOpen(false);
            setFileToDelete(null);
        }
    };

    // Trigger file input click
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleProofUpload = async (e, type = 'master') => {
        if (checkHold()) return;
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('proof_files', file);
        });
        formData.append('type', type);

        try {
            setIsProcessing(true);
            await dispatch(uploadProof({ id: job._id, formData })).unwrap();
            toast.success(`${type === 'master' ? 'Master' : 'Content'} proofs uploaded successfully!`);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Proof upload error:", err);
            toast.error(`Failed to upload ${type === 'master' ? 'master' : 'content'} proofs`);
        } finally {
            setIsProcessing(false);
            e.target.value = '';
        }
    };

    const handleApproveStage = async (fileId, type = 'master') => {
        if (checkHold()) return;
        const formData = new FormData();
        formData.append('action', 'Approved');
        formData.append('type', type);

        try {
            setIsProcessing(true);
            await dispatch(approveRejectProof({ id: job._id, fileId, formData })).unwrap();
            toast.success(`${type === 'master' ? 'Master' : 'Content'} proof approved!`);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Approval error:", err);
            toast.error('Failed to approve proof');
        } finally {
            setIsProcessing(false);
        }
    };

    // New function to handle proof deletion
    const handleProofDelete = async (fileObj, type) => {
        if (isSalesPerson) return;
        if (!fileObj?._id) return;

        // Use the confirmation modal? Or direct delete?
        // User asked for delete option. Let's reuse confirmation modal but we need to store type too.
        // Actually, let's just use window.confirm or a specific modal state for simplicity if permitted,
        // but existing pattern uses ConfirmationModal with fileToDelete.
        // The existing confirmDeleteFile is specific to 'ingest' stage (sample order files).
        // I need a separate confirmation handler or update confirmDeleteFile to handle different stages.

        // Let's attach metadata to fileToDelete to distinguish.
        setFileToDelete({ ...fileObj, stageType: type });
        setIsConfirmModalOpen(true);
    };

    const handleRejectClick = (fileId, type = 'master') => {
        if (checkHold()) return;
        setRejectionType(type);
        setSelectedUpdateForRejection(fileId);
        setIsRejectModalOpen(true);
    };

    const handleConfirmRejection = async ({ reason, referenceFile }) => {
        const formData = new FormData();
        formData.append('action', 'Rejected');
        formData.append('rejection_reason', reason);
        formData.append('type', rejectionType);
        if (referenceFile) {
            formData.append('rejection_file', referenceFile);
        }

        try {
            setIsProcessing(true);
            await dispatch(approveRejectProof({
                id: job._id,
                fileId: selectedUpdateForRejection,
                formData
            })).unwrap();

            toast.success(`${rejectionType === 'master' ? 'Master' : 'Content'} proof rejected`);
            setIsRejectModalOpen(false);
            setSelectedUpdateForRejection(null);
            setRejectionType(null);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Rejection error:", err);
            toast.error('Failed to reject proof');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextStepFromMaster = async () => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Content Proofing',
                    history_action: 'Stage Updated',
                    history_description: 'Moved to Content Proof'
                }
            })).unwrap();
            setActiveStage('proofing');
            toast.success('Moved to content proofing');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Move stage error:", err);
            toast.error('Failed to move to next stage');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextStepFromContent = async () => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Final Prep',
                    history_action: 'Stage Updated',
                    history_description: 'Moved to Final Prep'
                }
            })).unwrap();
            setActiveStage('final');
            toast.success('Moved to final prep');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Move stage error:", err);
            toast.error('Failed to move to next stage');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextStepFromFinal = async () => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Push to Floor',
                    history_action: 'Stage Updated',
                    history_description: 'Moved to Push to Floor'
                }
            })).unwrap();
            toast.success('Moved to Push to Floor');
            setActiveStage('floor');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Move to floor error:", err);
            toast.error('Failed to move to next stage');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextStepFromFloor = async () => {
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Accounting Quantity',
                    history_action: 'Stage Updated',
                    history_description: 'Moved to Accounting Quantity'
                }
            })).unwrap();
            toast.success('Moved to Accounting Quantity');
            setActiveStage('accounting');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Move to accounting error:", err);
            toast.error('Failed to move to next stage');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcessAllAndClose = async () => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Shop Floor',
                    history_action: 'Stage Updated',
                    history_description: 'Pushed to Shop Floor'
                }
            })).unwrap();
            toast.success('Pushed to Shop Floor');
            dispatch(fetchAllDTPJobs());
            onClose();
        } catch (err) {
            console.error("Push to shop floor error:", err);
            toast.error('Failed to push to shop floor');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBackToFinalPrep = async () => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Final Prep',
                    history_action: 'Stage Updated',
                    history_description: 'Reverted to Final Prep for editing'
                }
            })).unwrap();
            setActiveStage('final');
            toast.success('Moved back to final prep');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Back to final prep error:", err);
            toast.error('Failed to move back');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalPrepUpload = async ({ materialGroupId, materialGroupName, fileType, files, preFlight }) => {
        if (checkHold()) return;

        // Check for duplicate filenames across all sections in final_prep_files
        const existingNames = new Set();
        (job.final_prep_files || []).forEach(section => {
            (section.production_files || []).forEach(f => {
                if (f.file_url) existingNames.add(getFileNamev2(f.file_url).toLowerCase());
            });
            (section.reference_images || []).forEach(f => {
                if (f.file_url) existingNames.add(getFileNamev2(f.file_url).toLowerCase());
            });
        });

        // Check current selection for duplicates against existing and itself
        const currentSelectionNames = new Set();
        for (const file of files) {
            const fileNameLower = file.name.toLowerCase();
            if (existingNames.has(fileNameLower)) {
                toast.error(`File "${file.name}" already exists in one of the Final Prep sections. Please rename it.`);
                return;
            }
            if (currentSelectionNames.has(fileNameLower)) {
                toast.error(`Duplicate file name in selection: "${file.name}"`);
                return;
            }
            currentSelectionNames.add(fileNameLower);
        }

        const formData = new FormData();

        // Append all files
        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        formData.append('materialGroupId', materialGroupId);
        formData.append('materialGroupName', materialGroupName);
        formData.append('fileType', fileType);
        if (preFlight) {
            formData.append('preFlight', JSON.stringify(preFlight));
        }

        try {
            setIsProcessing(true);
            await dispatch(uploadFinalPrepFile({ id: job._id, formData })).unwrap();
            toast.success(`${files.length} ${fileType} file(s) uploaded for ${materialGroupName}`);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Final prep upload error:", err);
            toast.error('Failed to upload files');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateAccountingQty = async ({ materialGroupId, accountingQuantity, originalQuantity }) => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateFinalPrepSectionStatus({
                id: job._id,
                materialGroupId,
                accountingQuantity,
                originalQuantity,
                type: 'accounting_update' // specific type for backend handling
            })).unwrap();
            toast.success('Quantity updated');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Update quantity error:", err);
            toast.error('Failed to update quantity');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalPrepDelete = async ({ materialGroupId, fileType, fileId, fileName }) => {
        if (isSalesPerson) return;
        if (checkHold()) return;
        setFileToDelete({
            _id: fileId,
            materialGroupId,
            fileType,
            stageType: 'final_prep',
            name: fileName
        });
        setIsConfirmModalOpen(true);
    };

    const handleUpdateSectionStatus = async ({ materialGroupId, status }) => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateFinalPrepSectionStatus({ id: job._id, materialGroupId, status })).unwrap();
            toast.success(`Section ${status === 'ready to shop floor' ? 'processed' : 'reverted'}`);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Update section status error:", err);
            toast.error('Failed to update section status');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleHoldConfirm = async (reason) => {
        try {
            setIsProcessing(true);
            await dispatch(holdUnholdDTPJob({
                id: job._id || job.id,
                payload: { is_on_hold: true, hold_reason: reason }
            })).unwrap();
            toast.success("Job put on hold");
            setIsHoldModalOpen(false);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Hold error:", err);
            toast.error("Failed to put job on hold");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnholdClick = () => {
        setIsUnholdModalOpen(true);
    };

    const handleUnholdConfirm = async (data) => {
        try {
            setIsProcessing(true);
            await dispatch(holdUnholdDTPJob({
                id: job._id || job.id,
                payload: {
                    is_on_hold: false,
                    ...data
                }
            })).unwrap();
            toast.success("Job Released from Hold");
            setIsUnholdModalOpen(false);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Unhold error:", err);
            toast.error("Failed to unhold job");
        } finally {
            setIsProcessing(false);
        }
    };

    // Process stages configuration
    const stages = [
        { id: 'ingest', label: '1. Ingest Files', icon: 'fa-file-import', order: 0 },
        { id: 'master', label: '2. Master Template', icon: 'fa-layer-group', order: 1 },
        { id: 'proofing', label: '3. Content Proofing', icon: 'fa-spell-check', order: 2 },
        { id: 'final', label: '4. Final Prep', icon: 'fa-check-double', order: 3 },
        { id: 'floor', label: '5. Push to Floor', icon: 'fa-arrow-right-to-bracket', order: 4 },
        { id: 'accounting', label: '6. Accounting Qty', icon: 'fa-calculator', order: 5 }
    ];





    const handleRollbackClick = () => {
        if (checkHold()) return;
        setIsRollbackModalOpen(true);
    };

    const confirmRollback = async () => {
        try {
            setIsProcessing(true);
            await dispatch(rollbackToContentProofing(job._id || job.id)).unwrap();

            toast.success("Job rolled back to Content Proofing");
            dispatch(fetchAllDTPJobs());
            setActiveStage('proofing');
        } catch (error) {
            console.error("Rollback error:", error);
            toast.error("Failed to rollback job");
        } finally {
            setIsProcessing(false);
            setIsRollbackModalOpen(false);
        }
    };

    const handleShareClick = () => {
        if (checkHold()) return;
        setIsShareModalOpen(true);
    };

    // Helper to check if a stage is completed
    const isStageCompleted = (stageId) => {
        const statusMap = {
            'Pending': -1,
            'Assigned': 0,
            'Master Template': 1,
            'Content Proofing': 2,
            'Final Prep': 3,
            'Push to Floor': 4,
            'Accounting Quantity': 5,
            'Shop Floor': 6,
            'Reprocess': 7,
            'Completed': 8
        };

        const currentOrder = statusMap[job.status] || 0;
        const stageObj = stages.find(s => s.id === stageId);
        return stageObj.order < currentOrder;
    };


    // Handle Start Design
    const handleStartDesign = async () => {
        if (checkHold()) return;
        try {
            setIsProcessing(true);
            await dispatch(updateJobStatus({
                id: job._id,
                payload: {
                    status: 'Master Template',
                    history_action: 'Stage Updated',
                    history_description: 'Started Design Phase',
                    update_sales_order: true
                }
            })).unwrap();
            toast.success('Design phase started!');
            setActiveStage('master');
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Start design error:", err);
            toast.error('Failed to start design phase');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMoveBack = async () => {
        const currentStageObj = stages.find(s => s.id === activeStage);

        // If at first stage, or ingest, go back to folder if grouped
        if (!currentStageObj || currentStageObj.order === 0) {
            if (job.group_id && onBackToFolder) {
                onBackToFolder(job.group_id._id || job.group_id);
            } else {
                onClose();
            }
            return;
        }

        const prevStageObj = stages.find(s => s.order === currentStageObj.order - 1);
        if (prevStageObj) {
            if (checkHold()) return;

            const statusLevels = {
                'ingest': 'Assigned',
                'master': 'Master Template',
                'proofing': 'Content Proofing',
                'final': 'Final Prep',
                'floor': 'Push to Floor',
                'accounting': 'Accounting Quantity'
            };

            const targetStatus = statusLevels[prevStageObj.id];

            try {
                setIsProcessing(true);
                await dispatch(updateJobStatus({
                    id: job._id || job.id,
                    payload: {
                        status: targetStatus,
                        history_action: 'Stage Reverted',
                        history_description: `Moved back from ${currentStageObj.label} to ${prevStageObj.label}`
                    }
                })).unwrap();

                setActiveStage(prevStageObj.id);
                toast.success(`Reverted to ${prevStageObj.label}`);
                dispatch(fetchAllDTPJobs());
            } catch (err) {
                console.error("Rollback error:", err);
                toast.error('Failed to move back to previous stage');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const renderStageContent = () => {
        switch (activeStage) {
            case 'ingest':
                return (
                    <IngestFilesStage
                        job={job}
                        onUploadClick={handleUploadClick}
                        onFileUpload={handleFileUpload}
                        fileInputRef={fileInputRef}
                        onDownload={handleDownload}
                        onDelete={handleDeleteFile}
                        isSalesPerson={isSalesPerson}
                    />
                );
            case 'master':
                return (
                    <MasterTemplateStage
                        job={job}
                        onProofUpload={handleProofUpload}
                        onApprove={handleApproveStage}
                        onReject={handleRejectClick}
                        onDownload={handleDownload}
                        inputRef={masterProofInputRef}
                        isSalesPerson={isSalesPerson}
                        onDelete={(file) => handleProofDelete(file, 'master')}
                        onShare={handleShareClick}
                    />
                );
            case 'proofing':
                return (
                    <ContentProofingStage
                        job={job}
                        onProofUpload={handleProofUpload}
                        onApprove={handleApproveStage}
                        onReject={handleRejectClick}
                        onDownload={handleDownload}
                        inputRef={contentProofInputRef}
                        isSalesPerson={isSalesPerson}
                        onDelete={(file) => handleProofDelete(file, 'content')}
                        onShare={handleShareClick}
                    />
                );
            case 'final':
                return (
                    <FinalPrepStage
                        job={job}
                        onUpload={handleFinalPrepUpload}
                        onDelete={handleFinalPrepDelete}
                        onDownload={handleDownload}
                        isSalesPerson={isSalesPerson}
                    />
                );
            case 'accounting':
                return (
                    <AccountingQuantityStage
                        job={job}
                        onUpdateAccountingQty={handleUpdateAccountingQty}
                        onUpdateSectionStatus={handleUpdateSectionStatus}
                        onRollback={handleRollbackClick}
                        isProcessing={isProcessing}
                        isSalesPerson={isSalesPerson}
                    />
                );
            case 'floor':
                return (
                    <PushToFloorStage
                        job={job}
                        onProcessAll={handleProcessAllAndClose}
                        onEditFiles={handleBackToFinalPrep}
                        onUpdateSectionStatus={handleUpdateSectionStatus}
                        onDownload={handleDownload}
                        isProcessing={isProcessing}
                    />
                );
            default:
                return null;
        }
    };

    const handleUrgencyPrompt = async () => {
        if (job.urgency_sent) return;
        try {
            setIsProcessing(true);
            await dispatch(sendUrgencyPrompt(job._id || job.id)).unwrap();
            toast.success("Urgency prompt sent successfully");
        } catch (err) {
            console.error("Urgency prompt error:", err);
            toast.error("Failed to send urgency prompt");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 transition-opacity duration-300 z-[1040] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-[1000px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[1040] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="bg-slate-900 text-white border-b border-slate-200 pt-6 px-6 pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            {/* Product Image */}
                            <div className="w-14 h-14 bg-slate-800 overflow-hidden flex-shrink-0 shadow-inner">
                                <img
                                    src={job.image || job.images?.[0] || "/placeholder-award.png"}
                                    className="w-full h-full object-cover cursor-zoom-in"
                                    alt="Product"
                                    onClick={() => setPreviewImage(job.image || job.images?.[0])}
                                />

                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-indigo-400 font-mono text-xs font-black bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/30">
                                        {job.sub_job_no || job.job_no}
                                    </span>
                                    <span className="text-white text-xl font-bold tracking-tight">
                                        {job.client_name}
                                    </span>
                                    {job.urgency_sent ? (
                                        <div className="bg-red-800 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-red-900/40 border border-red-700/50 animate-pulse">
                                            <i className="fa-solid fa-circle-check"></i> URGENCY SENT
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleUrgencyPrompt}
                                            disabled={isProcessing}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-red-900/20 disabled:opacity-50 animate-pulse"
                                        >
                                            <i className="fa-solid fa-bolt-lightning"></i> Send Urgency Prompt
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-slate-400 text-[13px] font-medium uppercase tracking-wider">
                                    <span className="flex items-center gap-2 text-slate-300">
                                        <i className="fa-solid fa-cube text-indigo-400 w-4"></i>
                                        <span className="truncate max-w-[200px]">{job.product_name}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-layer-group text-slate-500 w-4"></i>
                                        <span>QTY: <span className="text-slate-200 font-bold">{job.job_quantity || '0'}</span></span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-calendar-check text-slate-500 w-4"></i>
                                        <span>TARGET: <span className="text-slate-200 font-bold mr-2">
                                            {job.job_completion_date ? (() => {
                                                const [datePart, timePart] = job.job_completion_date.split('T');
                                                const formattedDate = datePart.split('-').reverse().join('-');
                                                const formattedTime = timePart ? timePart.substring(0, 5) : '';
                                                return `${formattedDate} ${formattedTime}`;
                                            })() : '—'}
                                        </span></span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-truck text-slate-500 w-4"></i>
                                        <span>DELIVERY: <span className="text-slate-200 font-bold">{job.delivery_date ? job.delivery_date.split('T')[0].split('-').reverse().join('-') : '—'}</span></span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowJobDetailsPopup(true)}
                                className="flex items-center gap-2 px-4 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors text-xs font-bold font-primary uppercase tracking-wider"
                            >
                                {/* <i className="fa-solid fa-clipboard-list"></i> */}
                                <span>📋View Job Details</span>
                            </button>

                            {(isSalesPerson || !(job?.status === 'Pending' || job?.status === "Hold")) && (

                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded border transition-colors text-xs font-bold font-primary uppercase tracking-wider ${showHistory
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                                        }`}
                                >
                                    <i className="fa-solid fa-clock-rotate-left"></i>
                                    <span>{showHistory ? 'Hide History' : '📜 History'}</span>
                                </button>)}

                            {job.group_id && onBackToFolder && (
                                <button
                                    onClick={() => onBackToFolder(job.group_id._id || job.group_id)}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-colors text-xs font-bold font-primary uppercase tracking-wider"
                                >
                                    <i className="fa-solid fa-arrow-left"></i>
                                    <span>Back to Folder</span>
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden">
                    {showHistory ? (
                        <div className="flex-1 overflow-hidden">
                            <JobHistoryPanel
                                history={job.history}
                                jobNo={job.job_no}
                                clientName={job.client_name}
                                onHide={() => setShowHistory(false)}
                                hideClose={initialShowHistory && (job.status === 'Pending' || job.status === "Hold" || isSalesPerson)}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Stage Navigation - Left Sidebar */}
                            <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
                                <div className="space-y-2 flex-grow overflow-y-auto pr-1">
                                    {stages.map((stage, index) => {
                                        const completed = isStageCompleted(stage.id);
                                        const isActive = activeStage === stage.id;
                                        return (
                                            <button
                                                key={stage.id}
                                                // onClick={() => setActiveStage(stage.id)}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${isActive
                                                    ? 'bg-white border-l-4 border-indigo-600 shadow-sm'
                                                    : 'cursor-not-allowed'
                                                    }`}
                                            >
                                                <span className={`text-sm font-primary ${completed
                                                    ? 'text-emerald-600 font-bold'
                                                    : isActive
                                                        ? 'text-indigo-600 font-semibold'
                                                        : 'text-slate-400 hover:text-slate-600'}`}>
                                                    {stage.label}
                                                </span>
                                                {completed && (
                                                    <span><i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>


                            </div>

                            {/* Content Area - Right Side */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="flex-1 overflow-y-auto p-8">
                                    {renderStageContent()}
                                </div>

                                {/* Footer Actions */}
                                <div className="border-t border-slate-200 p-6 bg-white flex justify-between items-center flex-shrink-0">
                                    <div>
                                        {!isSalesPerson && (job.group_id || activeStage !== 'ingest') && (
                                            <button
                                                onClick={handleMoveBack}
                                                disabled={isProcessing || job.is_on_hold}
                                                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm font-primary disabled:opacity-50"
                                            >
                                                <i className="fa-solid fa-arrow-left"></i>
                                                <span>Back</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={onClose}
                                            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                                        >
                                            Close & Finish Later
                                        </button>
                                        {job.is_on_hold ? (
                                            <button
                                                onClick={handleUnholdClick}
                                                disabled={isProcessing}
                                                className="px-6 py-3 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-200 font-bold text-sm transition-colors shadow-sm font-primary flex items-center gap-2"
                                            >
                                                <i className="fa-solid fa-play"></i> UNHOLD JOB
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIsHoldModalOpen(true)}
                                                disabled={isProcessing}
                                                className="px-6 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 font-bold text-sm transition-colors shadow-sm font-primary flex items-center gap-2"
                                            >
                                                <i className="fa-solid fa-pause"></i> HOLD JOB
                                            </button>
                                        )}
                                        {activeStage === 'ingest' && !isSalesPerson && (
                                            <button
                                                onClick={handleStartDesign}
                                                disabled={job.is_on_hold}
                                                className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm font-primary ${job.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                Start Design
                                            </button>
                                        )
                                        }
                                        {
                                            activeStage === 'master' &&
                                            job.master_template_files?.some(f => f.status === 'Approved') &&
                                            !job.master_template_files?.some(f => f.status === 'Pending') &&
                                            !isSalesPerson && (
                                                <button
                                                    onClick={handleNextStepFromMaster}
                                                    disabled={isProcessing || job.is_on_hold}
                                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-all shadow-md font-primary flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isProcessing ? 'Processing...' : 'NEXT STEP'} <i className="fa-solid fa-arrow-right"></i>
                                                </button>
                                            )
                                        }
                                        {
                                            activeStage === 'proofing' &&
                                            job.content_proofing_files?.some(f => f.status === 'Approved') &&
                                            !job.content_proofing_files?.some(f => f.status === 'Pending') &&
                                            !isSalesPerson && (
                                                <button
                                                    onClick={handleNextStepFromContent}
                                                    disabled={isProcessing || job.is_on_hold}
                                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-all shadow-md font-primary flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isProcessing ? 'Processing...' : 'NEXT STEP'} <i className="fa-solid fa-arrow-right"></i>
                                                </button>
                                            )
                                        }
                                        {
                                            activeStage === 'final' && !isSalesPerson && (
                                                <button
                                                    onClick={handleNextStepFromFinal}
                                                    disabled={isProcessing || job.is_on_hold || !(job.job_sheet?.materialprocess || []).every(section => {
                                                        const prepData = (job.final_prep_files || []).find(f => f.material_group_id === section.material_group_id);
                                                        if (!prepData) return false;

                                                        const hasProduction = (prepData.production_files && prepData.production_files.length > 0) || prepData.production_file?.file_url;
                                                        const hasReference = (prepData.reference_images && prepData.reference_images.length > 0) || prepData.reference_image?.file_url;

                                                        return hasProduction && hasReference;
                                                    })}
                                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-all shadow-md font-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessing ? 'Processing...' : 'Review for Floor'} <i className="fa-solid fa-arrow-right"></i>
                                                </button>
                                            )
                                        }
                                        {
                                            activeStage === 'floor' && !isSalesPerson && (
                                                <button
                                                    onClick={handleNextStepFromFloor}
                                                    disabled={isProcessing || job.is_on_hold || !(job.job_sheet?.materialprocess || []).every(section => {
                                                        const prepData = (job.final_prep_files || []).find(f => f.material_group_id === section.material_group_id);
                                                        return prepData && prepData.status === 'ready to shop floor';
                                                    })}
                                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-all shadow-md font-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessing ? 'Processing...' : 'Review Accounting Qty'} <i className="fa-solid fa-arrow-right"></i>
                                                </button>
                                            )
                                        }
                                        {
                                            activeStage === 'accounting' && !isSalesPerson && (
                                                <button
                                                    onClick={handleProcessAllAndClose}
                                                    disabled={isProcessing || job.is_on_hold}
                                                    className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm transition-all shadow-md font-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessing ? 'Processing...' : 'PROCESS ALL & CLOSE'} <i className="fa-solid fa-check-double"></i>
                                                </button>
                                            )
                                        }
                                    </div >
                                </div >
                            </div >
                        </>
                    )}
                </div >
            </div >

            <RejectProofModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleConfirmRejection}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteFile}
                title="Delete File"
                message={`Are you sure you want to delete ${fileToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="bg-red-600 hover:bg-red-700"
            />
            <HoldModal
                open={isHoldModalOpen}
                onClose={() => setIsHoldModalOpen(false)}
                onConfirm={handleHoldConfirm}
                loading={isProcessing}
                jobId={job.sub_job_no}
            />

            <UnholdModal
                open={isUnholdModalOpen}
                onClose={() => setIsUnholdModalOpen(false)}
                onConfirm={handleUnholdConfirm}
                loading={isProcessing}
                jobId={job.sub_job_no || job.job_no}
                currentDate={job.delivery_date}
                currentJobCompletionDate={job.job_completion_date}
                type="dtp"
            />

            <ConfirmationModal
                isOpen={isRollbackModalOpen}
                onClose={() => setIsRollbackModalOpen(false)}
                onConfirm={confirmRollback}
                title="Rollback to Content Proofing"
                message="This will permanently delete all Content Proofing files, Final Prep files (production & reference), and Accounting data (counts + processing files). Ingest files and Master Template files will be kept. This cannot be undone — are you sure?"
                confirmText="Yes, Rollback"
                confirmColor="bg-orange-600 hover:bg-orange-700"
            />
            {isShareModalOpen && (
                <DtpFileShareModal
                    job={job}
                    onClose={() => setIsShareModalOpen(false)}
                    shareType={activeStage}
                />
            )}

            <JobDetailsPopup
                show={showJobDetailsPopup}
                onClose={() => setShowJobDetailsPopup(false)}
                bomData={boms && boms.length > 0 ? boms[0] : job?.job_sheet}
                groupedProcesses={groupedProcessesByDepartment}
            />
            {previewImage && (
                <ImageLightbox
                    src={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </>

    );
};

export default JobDetailsPanel;
