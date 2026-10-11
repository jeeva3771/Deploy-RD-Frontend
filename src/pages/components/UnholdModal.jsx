import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "../../utils/enquiry/dateformat";

const today = new Date().toISOString().split("T")[0];
const nowDateTime = new Date().toISOString().slice(0, 16);

const UnholdModal = ({
    open,
    onClose,
    onConfirm,
    loading,
    type = "enquiry",
    currentDate,
    currentJobCompletionDate,
    hideDates = false,
    enquiry,
    proceedShowDate = false,
}) => {
    const [deliveryDate, setDeliveryDate] = useState("");
    const [jobCompletionDate, setJobCompletionDate] = useState("");
    const [visible, setVisible] = useState(false);
    const [errors, setErrors] = useState({});

    // Show dates if proceedShowDate is true OR hideDates is false
    const shouldShowDates = proceedShowDate || !hideDates;

    useEffect(() => {
        if (open) {
            if (currentDate) setDeliveryDate(formatDateToYYYYMMDD(currentDate));
            if (currentJobCompletionDate) {
                setJobCompletionDate(currentJobCompletionDate.slice(0, 16));
            }
            setErrors({});
            setTimeout(() => setVisible(true), 10);
            document.body.style.overflow = "hidden";
        } else {
            setVisible(false);
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open, currentDate, currentJobCompletionDate]);

    const handleSubmit = () => {
        const newErrors = {};

        // Delivery date validation
        if (shouldShowDates) {
            if (!deliveryDate) {
                newErrors.deliveryDate = "Delivery date is required.";
            } else {
                const selected = new Date(deliveryDate);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                selected.setHours(0, 0, 0, 0);
                if (selected < todayDate) {
                    newErrors.deliveryDate = "Delivery date cannot be a past date.";
                }
            }
        }

        // Job completion datetime validation (non-enquiry only)
        if (type !== "enquiry" && shouldShowDates) {
            if (!jobCompletionDate) {
                newErrors.jobCompletionDate = "Job completion date & time is required.";
            } else {
                const selectedJob = new Date(jobCompletionDate);
                if (selectedJob < new Date()) {
                    newErrors.jobCompletionDate = "Job completion date & time cannot be in the past.";
                }
            }
        }

        if (
            type !== "enquiry" &&
            shouldShowDates &&
            deliveryDate &&
            jobCompletionDate
        ) {
            const delivery = new Date(deliveryDate);
            delivery.setHours(23, 59, 59, 999); // consider full delivery day

            const jobCompletion = new Date(jobCompletionDate);

            if (jobCompletion > delivery) {
                newErrors.jobCompletionDate =
                    "Job completion date & time cannot be later than delivery date.";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        const data = {};
        if (shouldShowDates) {
            data.delivery_date = formatDateToDDMMYYYY(deliveryDate);
            if (type !== "enquiry") {
                data.delivery_date = formatDateToYYYYMMDD(deliveryDate);
                data.job_completion_datetime = jobCompletionDate;
            }
        }

        onConfirm(data);
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    const isSubmitDisabled = (shouldShowDates && (!deliveryDate || (type !== "enquiry" && !jobCompletionDate))) || loading;

    if (!open) return null;

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center px-4 transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"
                }`}
            style={{ zIndex: 9999 }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Modal Card */}
            <div
                className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl transition-all duration-300 ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    }`}
                style={{ zIndex: 10000 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 leading-tight">Unhold Action</h2>
                            {(enquiry?.sub_job_no || enquiry?.job_no) && (
                                <p className="text-xs text-emerald-600 font-medium mt-0.5 font-bold">Job No: {enquiry?.sub_job_no || enquiry?.job_no}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">{shouldShowDates ? "Resume with updated dates" : "Confirm unhold action"}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-500">{shouldShowDates ? "Please provide the updated dates to resume." : "Are you sure you want to unhold this job?"}</p>

                    {shouldShowDates && (
                        <>
                            {/* Delivery Date */}
                            <div>
                                <label htmlFor="delivery-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Delivery Date <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="delivery-date"
                                        type="date"
                                        value={deliveryDate}
                                        min={today}
                                        onChange={(e) => {
                                            setDeliveryDate(e.target.value);
                                            if (errors.deliveryDate) setErrors((prev) => ({ ...prev, deliveryDate: "" }));
                                        }}
                                        required
                                        className={`w-full pl-9 pr-4 py-2.5 text-sm text-gray-800 bg-gray-50 border rounded-xl outline-none transition-all duration-200 [color-scheme:light] ${errors.deliveryDate
                                            ? "border-red-400 focus:ring-2 focus:ring-red-300/50 focus:border-red-400"
                                            : "border-gray-200 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
                                            }`}
                                    />
                                </div>
                                {errors.deliveryDate && (
                                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                        {errors.deliveryDate}
                                    </p>
                                )}
                            </div>

                            {/* Job Completion Date (non-enquiry only) */}
                            {type !== "enquiry" && (
                                <div>
                                    <label htmlFor="job-completion-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Job Completion Date / Time <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        <input
                                            id="job-completion-date"
                                            type="datetime-local"
                                            value={jobCompletionDate}
                                            min={nowDateTime}
                                            onChange={(e) => {
                                                setJobCompletionDate(e.target.value);
                                                if (errors.jobCompletionDate) setErrors((prev) => ({ ...prev, jobCompletionDate: "" }));
                                            }}
                                            required
                                            className={`w-full pl-9 pr-4 py-2.5 text-sm text-gray-800 bg-gray-50 border rounded-xl outline-none transition-all duration-200 [color-scheme:light] ${errors.jobCompletionDate
                                                ? "border-red-400 focus:ring-2 focus:ring-red-300/50 focus:border-red-400"
                                                : "border-gray-200 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
                                                }`}
                                        />
                                    </div>
                                    {errors.jobCompletionDate && (
                                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                            {errors.jobCompletionDate}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 pb-6">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Unholding...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Confirm Unhold
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnholdModal;