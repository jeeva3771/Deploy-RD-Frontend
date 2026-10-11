import React, { useState, useRef } from 'react';

const RejectProofModal = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [referenceFile, setReferenceFile] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ reason, referenceFile });
        setReason('');
        setReferenceFile(null);
    };

    return (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 font-primary">Reject Proof</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 font-primary">
                            Reason for Rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason..."
                            rows="4"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 text-sm font-primary"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 font-primary">
                            Upload Reference File (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors font-primary border border-slate-200"
                            >
                                Choose file
                            </button>
                            <span className="text-xs text-slate-500 font-primary truncate max-w-[200px]">
                                {referenceFile ? referenceFile.name : 'No file chosen'}
                            </span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => setReferenceFile(e.target.files[0])}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors font-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm font-primary"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RejectProofModal;
