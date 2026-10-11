import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import AssignJobModal from './AssignJobModal';
import { assignDTPJob, updateJobStatus, fetchAllDTPJobs, updateDTPJobDetails, fetchDTPJobById } from '../../../reducer/dtpStudioReducer';
import { downloadFile } from '../../../reducer/standalone_bomReducer';
import { toast } from 'react-toastify';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
import ConfirmationModal from '../../components/ConfirmationModal';
import ImageLightbox from '../../common/ImageLightbox';


import { getIsHead, getUserRole, getDepartmentName, getUser } from '../../../utils/permission/auth';

const DtpJobCard = ({ job, columnType, onOpenDetails, isSelected, onSelect, onHold, onUnhold }) => {
    const dispatch = useDispatch();
    const userRole = getUserRole();
    const isHead = getIsHead();
    const departmentName = getDepartmentName();
    const currentUser = getUser();

    // Strict DTP Head check: admin executive OR (isHead AND DTP Department AND Designer Role)
    const canAssign = userRole?.toLowerCase() === 'admin executive' || (
        isHead &&
        (departmentName?.toLowerCase() === 'dtp')
    );

    const isSalesPerson = (currentUser?.role === "Client Servicing Manager" || currentUser?.role === "Client Servicing Executive");
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isReprocessConfirmOpen, setIsReprocessConfirmOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [editValues, setEditValues] = useState({
        job_quantity: '',
        delivery_date: '',
        job_completion_date: '',
        remark: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);


    const isCritical = job.priority === 'Critical';

    // Helper to get job image

    const jobImage = job.image;

    const handleAssignClick = () => {
        setIsAssignModalOpen(true);
    };

    const handleAssignConfirm = async (assignmentData) => {
        try {
            await dispatch(assignDTPJob({
                id: job._id,
                payload: {
                    assignedTo: assignmentData.artistId,
                    assignedToName: assignmentData.artistName,
                    assignmentNote: assignmentData.note
                }
            })).unwrap();

            setIsAssignModalOpen(false);
            // Optionally show success message
        } catch (error) {
            console.error('Failed to assign job:', error);
            // Optionally show error message
        }
    };

    const handleHistoryClick = (e) => {
        e.stopPropagation();
        onOpenDetails(job._id || job.id, true);
    };

    const handleReprocessClick = (e) => {
        e.stopPropagation();
        setIsReprocessConfirmOpen(true);
    };

    const confirmReprocess = async () => {
        try {
            await dispatch(updateJobStatus({
                id: job._id || job.id,
                payload: {
                    status: 'Reprocess',
                    history_action: 'Stage Updated',
                    history_description: 'Job marked for reprocessing from Shop Floor'
                }
            })).unwrap();

            toast.success("Job marked for reprocessing");
            dispatch(fetchAllDTPJobs());
        } catch (error) {
            console.error("Reprocess error:", error);
            toast.error("Failed to reprocess job");
        } finally {
            setIsReprocessConfirmOpen(false);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        const toInputDate = (val) => {
            if (!val) return "";
            if (val.includes("T")) val = val.split("T")[0];
            const parts = val.split("-");
            if (parts.length === 3 && parts[0].length === 2) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return val;
        };

        setEditValues({
            job_quantity: job.job_quantity || job.job_qty || "",
            delivery_date: toInputDate(job.delivery_date),
            job_completion_date: toInputDate(job.job_completion_date),
            remark: ""
        });
        setIsEditModalOpen(true);
    };

    const handleQuickViewClick = (e) => {
        e.stopPropagation();
        setIsQuickViewOpen(true);
        dispatch(fetchDTPJobById(job._id || job.id));
    };

    const handleSaveEdit = async () => {
        if (!editValues.remark.trim()) {
            toast.error("Remark is required");
            return;
        }

        // Validation: Delivery Date should not be prior to Job Completion Date
        if (editValues.delivery_date && editValues.job_completion_date) {
            if (new Date(editValues.delivery_date) < new Date(editValues.job_completion_date)) {
                toast.error("Delivery Date cannot be earlier than Job Completion Date");
                return;
            }
        }

        setIsSaving(true);
        try {
            const toStorageDate = (val) => {
                if (!val) return val;
                const parts = val.split("-");
                if (parts.length === 3 && parts[0].length === 4) {
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                return val;
            };

            const payload = {
                ...editValues,
                delivery_date: toStorageDate(editValues.delivery_date),
                job_completion_date: toStorageDate(editValues.job_completion_date),
                job_quantity: Number(editValues.job_quantity),
                remark: editValues.remark.trim()
            };

            await dispatch(updateDTPJobDetails({
                id: job._id || job.id,
                payload
            })).unwrap();

            toast.success("Job details updated successfully");
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to update job details:", error);
            toast.error(error.message || "Failed to update job details");
        } finally {
            setIsSaving(false);
        }
    };

    const jobCompletionDate = (job.job_completion_date && job.job_completion_date.split('T')[0]) || (job.delivery_date && job.delivery_date.split('T')[0]);
    const today = new Date();
    const localToday = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const isToday = jobCompletionDate === localToday;

    return (
        <>
            <div
                onClick={() => {
                    if (columnType === 'NEW JOBS' && onSelect) {
                        onSelect(job);
                    } else {
                        onOpenDetails(job._id || job.id);
                    }
                }}
                className={`relative rounded border-2 transition-all cursor-pointer flex flex-col flex-shrink-0 ${isSelected ? 'bg-white border-indigo-600 shadow-md transform scale-[1.02]' :
                    (job.is_qty_changed && (userRole === 'admin executive' || isHead || job.assigned_to === currentUser?._id || job.assigned_to?._id === currentUser?._id)) ? 'bg-white blink-purple' :
                        (job.is_date_changed && (userRole === 'admin executive' || isHead || job.assigned_to === currentUser?._id || job.assigned_to?._id === currentUser?._id)) ? 'bg-white blink-orange' :
                            isToday ? 'bg-white blink-border-red-thin' :
                                job.urgency_sent ? 'blink-border-red-thin urgency-blink' :
                                    isCritical ? 'bg-white ring-1 ring-red-200 border-red-200 animate-pulse' : 'bg-white border-slate-100'
                    }`}
            >
                {/* Top Priority Color Strip */}
                {jobCompletionDate ? (
                    <DeliveryPriorityColor
                        deliveryDate={jobCompletionDate}
                        className="w-full h-2 rounded-t"
                        containerStyle={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                ) : (
                    <div className="w-full h-2 bg-slate-200 rounded-t" />
                )}

                {/* Content Section */}
                <div className="flex-1 p-4">
                    <div className="flex justify-between items-center mb-2 gap-2">
                        <span className="text-sm font-bold text-slate-700">
                            {job.jobId}{job.enquiry_id?.reference_no ? ` - ${job.enquiry_id.reference_no}` : ""}
                        </span>
                        <div className="flex flex-wrap justify-end gap-1.5">
                            {job.is_on_hold && (
                                <div className="bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg border border-amber-400 whitespace-nowrap">
                                    ON HOLD
                                </div>
                            )}
                            {jobCompletionDate ? (
                                <DeliveryPriorityColor
                                    deliveryDate={jobCompletionDate}
                                    showPriorityName={true}
                                    className="hidden"
                                    badgeClassName={isToday ? 'bg-blink-red' : ''}
                                />
                            ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                                    Normal
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="font-bold text-sm text-slate-800 mb-1 leading-tight text-center">{job.product_name}</div>
                    {/* <div className="text-xs text-slate-500 mb-3">{job.batchName}</div> */}

                    {/* Job Image Section */}
                    {jobImage && (
                        <div className="w-full h-40 bg-slate-50 mb-3 overflow-hidden relative group mt-2">
                            <img
                                key={jobImage}
                                src={jobImage}
                                alt="Job Preview"
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(jobImage);
                                }}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                            />

                        </div>
                    )}

                    <div className="mb-3 flex justify-between">
                        {job.assigned_to ? (
                            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">
                                    <i className="fa-solid fa-user"></i>
                                </div>
                                {job.assigned_to_name || job.assigned_to}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 italic">
                                <i className="fa-regular fa-clock"></i>
                                <span>Unassigned</span>
                            </div>
                        )}

                        {(job.job_quantity || job.job_qty) && (
                            <div className="text-xs text-slate-400 gap-1.5 italic">
                                Qty: {job.job_quantity || job.job_qty}
                            </div>
                        )}
                    </div>

                    <div className="mt-2 flex justify-between items-center border-t border-slate-100 pt-3">
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={handleHistoryClick}
                                className="w-7 h-7 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs transition-colors"
                                title="History"
                            >
                                <i className="fa-solid fa-clock-rotate-left"></i>
                            </button>
                            {onHold && onUnhold && (
                                <button
                                    onClick={() => job.is_on_hold ? onUnhold(job._id || job.id) : onHold(job._id || job.id)}
                                    className={`w-7 h-7 flex items-center justify-center rounded border transition-colors text-xs ${job.is_on_hold
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                        : 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                                        }`}
                                    title={job.is_on_hold ? "Unhold Job" : "Hold Job"}
                                >
                                    <i className={`fa-solid ${job.is_on_hold ? 'fa-play' : 'fa-pause'}`}></i>
                                </button>
                            )}
                            <button
                                onClick={handleEditClick}
                                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 text-xs transition-colors"
                                title="Edit Details"
                            >
                                <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            {(columnType === 'ASSIGNED' ||
                                columnType === 'MASTER TEMPLATE' ||
                                columnType === 'CONTENT PROOFING' ||
                                columnType === 'FINAL PREP') && canAssign && (
                                    <button
                                        onClick={handleAssignClick}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                                        title="Reassign Job"
                                    >
                                        <i className="fa-solid fa-user-pen text-xs"></i>
                                    </button>
                                )}
                            <button
                                onClick={handleQuickViewClick}
                                className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                                title="Quick View"
                            >
                                <i className="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>

                        <div className="flex gap-2 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                            {columnType === 'NEW JOBS' && canAssign && (
                                <button
                                    onClick={handleAssignClick}
                                    className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Assign
                                </button>
                            )}

                            {columnType === 'SHOP FLOOR' && (
                                <>
                                    <button
                                        onClick={handleReprocessClick}
                                        className="text-xs bg-orange-500 text-white px-2 py-1.5 rounded hover:bg-orange-600 font-medium transition-colors"
                                    >
                                        Reprocess
                                    </button>
                                    <button
                                        onClick={() => onOpenDetails(job._id || job.id)}
                                        className="text-xs bg-emerald-600 text-white px-2 py-1.5 rounded hover:bg-emerald-700 font-medium transition-colors"
                                    >
                                        View/Edit
                                    </button>
                                </>
                            )}

                            {(!isSalesPerson || columnType === 'ASSIGNED') && columnType !== 'NEW JOBS' && columnType !== 'SHOP FLOOR' && (
                                <button
                                    onClick={() => onOpenDetails(job._id || job.id)}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                                >
                                    Process
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AssignJobModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                job={job}
                onConfirm={handleAssignConfirm}
            />

            <ConfirmationModal
                isOpen={isReprocessConfirmOpen}
                onClose={() => setIsReprocessConfirmOpen(false)}
                onConfirm={confirmReprocess}
                title="Confirm Reprocess"
                message="Are you sure you want to mark this job for reprocessing? This will move the job back to the Reprocess queue."
                confirmText="Reprocess"
                confirmColor="bg-orange-600 hover:bg-orange-700"
            />

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
                    onClick={() => setIsEditModalOpen(false)}
                >
                    <div
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <i className="fa-solid fa-pen-to-square text-indigo-600"></i>
                                Edit Job Details
                            </h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <p className="text-[10px] text-slate-400 mb-4 font-bold uppercase tracking-wider">
                            {job.jobId} — {job.product_name}
                        </p>

                        <div className="space-y-4">
                            {/* Quantity */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={editValues.job_quantity}
                                    onChange={(e) => setEditValues({ ...editValues, job_quantity: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50"
                                    placeholder="Enter quantity"
                                />
                            </div>

                            {/* Delivery Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={editValues.delivery_date}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setEditValues({ ...editValues, delivery_date: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50"
                                />
                            </div>

                            {/* Job Completion Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Job Completion Date
                                </label>
                                <input
                                    type="date"
                                    value={editValues.job_completion_date}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setEditValues({ ...editValues, job_completion_date: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50"
                                />
                            </div>

                            {/* Remark - Mandatory */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Remark <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={editValues.remark}
                                    onChange={(e) => setEditValues({ ...editValues, remark: e.target.value })}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none bg-slate-50 ${!editValues.remark.trim() ? "border-rose-100" : "border-slate-200"
                                        }`}
                                    placeholder="Reason for change..."
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-100"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick View Modal */}
            {isQuickViewOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={() => setIsQuickViewOpen(false)}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                            <div className="text-white font-bold tracking-tight flex items-center gap-2">
                                <i className="fa-solid fa-circle-info text-indigo-400"></i>
                                Job Quick View
                            </div>
                            <button
                                onClick={() => setIsQuickViewOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <div className="p-6 min-h-[400px] max-h-[75vh] overflow-y-auto custom-scrollbar shadow-inner">
                            <div className="flex gap-6 mb-6">
                                {/* Image Section */}
                                <div className="w-40 h-40 bg-slate-100 overflow-hidden flex-shrink-0 shadow-inner">
                                    {jobImage ? (
                                        <img
                                            src={jobImage}
                                            className="w-full h-full object-cover cursor-zoom-in"
                                            alt="Product"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewImage(jobImage);
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <i className="fa-solid fa-image text-3xl mb-2"></i>
                                            <span className="text-[10px] font-bold uppercase">No Image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Main Info Block */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="mb-4">
                                        <span className="text-indigo-600 font-mono text-[11px] font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 tracking-widest shadow-sm">
                                            {job?.sub_job_no || job?.job_no}{job?.enquiry_id?.reference_no ? ` - ${job.enquiry_id.reference_no}` : ""}
                                        </span>
                                        <div className="text-slate-800 text-lg font-black mt-1 leading-tight">
                                            {job?.product_name}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Client Name - full width */}
                                        <div className="flex items-start gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                                            <i className="fa-solid fa-briefcase text-slate-400 text-xs w-4 mt-1"></i>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Client Name</span>
                                                <span className="text-[13px] font-black text-slate-900 leading-snug break-all">
                                                    {job?.client_name || '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Completion Date */}
                                        <div className="flex items-start gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <i className="fa-solid fa-calendar-check text-indigo-500 text-xs w-4 mt-1"></i>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Completion</span>
                                                <span className="text-[12px] font-bold text-slate-900 leading-snug">
                                                    {job?.job_completion_date
                                                        ? (() => {
                                                            const [datePart, timePart] = job.job_completion_date.split('T');
                                                            const formattedDate = datePart.split('-').reverse().join('-');
                                                            const formattedTime = timePart ? timePart.substring(0, 5) : '';
                                                            return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
                                                        })()
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quantity */}
                                        <div className="flex items-start gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <i className="fa-solid fa-layer-group text-blue-500 text-xs w-4 mt-1"></i>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Quantity</span>
                                                <span className="text-[12px] font-bold text-slate-900 leading-snug">
                                                    {job?.job_quantity || job?.job_qty || '0'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Enquiry By */}
                                        <div className="flex items-start gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <i className="fa-solid fa-user-edit text-orange-500 text-xs w-4 mt-1"></i>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Enquiry By</span>
                                                <span className="text-[12px] font-bold text-slate-900 leading-snug break-all">
                                                    {job?.enquiry_id?.created_by?.name || '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order By - FIX: full text, no truncation */}
                                        <div className="flex items-start gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <i className="fa-solid fa-user-tag text-purple-500 text-xs w-4 mt-1"></i>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Order By</span>
                                                <span className="text-[12px] font-bold text-slate-900 leading-snug break-all">
                                                    {job?.sales_order_form?.updated_by?.[0]?.user?.name || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks & Description Section - FIX: added border-t */}
                            <div className="space-y-5 pt-5 border-t border-slate-100">

                                {/* Remarks - FIX: type guard to prevent showing raw numbers */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex flex-shrink-0 items-center justify-center text-amber-600">
                                        <i className="fa-solid fa-comment-dots text-sm"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Remarks</h4>
                                        <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">
                                            {typeof job?.sales_order_form?.remarks === 'string' && job.sales_order_form.remarks.trim()
                                                ? job.sales_order_form.remarks
                                                : 'NO REMARKS'}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Notes - FIX: type guard to prevent showing raw numbers */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-shrink-0 items-center justify-center text-indigo-600">
                                        <i className="fa-solid fa-align-left text-sm"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Additional Notes</h4>
                                        <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">
                                            {typeof job?.sales_order_form?.bank_details_description === 'string' && job.sales_order_form.bank_details_description.trim()
                                                ? job.sales_order_form.bank_details_description
                                                : 'NO ADDITIONAL NOTES'}
                                        </p>
                                    </div>
                                </div>

                                {/* DTP Files Section */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex flex-shrink-0 items-center justify-center text-teal-600">
                                        <i className="fa-solid fa-file-invoice text-sm"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">DTP Files & Instructions</h4>
                                        {job?.sample_order_id?.process_files?.filter(pf => pf.dtp_file)?.length > 0 ? (
                                            <div className="space-y-2 mt-2">
                                                {job.sample_order_id.process_files.filter(pf => pf.dtp_file).map((pf, idx) => (
                                                    <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <div className="font-bold text-[12px] text-slate-800 flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Section: </span>
                                                                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] uppercase">
                                                                        {pf.section_name || 'N/A'}
                                                                    </span>
                                                                    <i className="fa-solid fa-chevron-right text-[8px] text-slate-400 mx-1"></i>
                                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Process: </span>
                                                                    <span className="text-slate-700">{pf.process_name || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
                                                                    <i className="fa-solid fa-file-arrow-down"></i>
                                                                    <span className="truncate max-w-[200px]" title={(() => {
                                                                        try {
                                                                            const p = new URL(pf.dtp_file).pathname.split('/').pop();
                                                                            return decodeURIComponent(p.includes('---') ? p.split('---')[1] : p);
                                                                        } catch (e) { return 'dtp_file'; }
                                                                    })()}>
                                                                        {(() => {
                                                                            try {
                                                                                const p = new URL(pf.dtp_file).pathname.split('/').pop();
                                                                                return decodeURIComponent(p.includes('---') ? p.split('---')[1] : p);
                                                                            } catch (e) { return 'dtp_file'; }
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        dispatch(downloadFile(pf.dtp_file));
                                                                    }}
                                                                    className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-700 transition-colors flex items-center gap-1"
                                                                >
                                                                    <i className="fa-solid fa-download"></i>
                                                                </button>
                                                                <a href={pf.dtp_file} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors flex items-center gap-1">
                                                                    <i className="fa-solid fa-eye"></i>
                                                                </a>
                                                            </div>
                                                        </div>
                                                        {pf.dtp_instruction && (
                                                            <div className="text-[12px] text-slate-600 bg-white p-2 rounded-md border border-slate-100 mt-2 font-medium">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Instruction: {pf.dtp_instruction}</span>

                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">
                                                NO DTP FILE FOUND
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsQuickViewOpen(false)}
                                className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {previewImage && (
                <ImageLightbox
                    src={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </>
    );
};

export default DtpJobCard;
