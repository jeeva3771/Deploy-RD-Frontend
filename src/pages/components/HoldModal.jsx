import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

const HoldModal = ({ open, onClose, onConfirm, loading, jobId }) => {
    const [reason, setReason] = useState("");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setTimeout(() => setVisible(true), 10);
            document.body.style.overflow = "hidden";
        } else {
            setVisible(false);
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const handleSubmit = () => {
        if (reason.trim()) {
            onConfirm(reason);
            setReason("");
        }
    };

    const handleClose = () => {
        setReason("");
        onClose();
    };

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
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 leading-tight">Hold Action</h2>
                            {jobId && <p className="text-xs text-gray-500 font-medium mt-0.5">Job No: {jobId}</p>}
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
                <div className="px-6 py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hold Reason <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        autoFocus
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please mention the stage where you will place the hold and the reason for it..."
                        className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                        {reason.trim().length} characters entered
                    </p>
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
                        disabled={!reason.trim() || loading}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-200"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Holding...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                                </svg>
                                Confirm Hold
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HoldModal;