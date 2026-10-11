import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, children, confirmText = 'Confirm', confirmColor = 'bg-red-600 hover:bg-red-700' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1060] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="p-8 flex flex-col items-center text-center">

                    {/* Warning Icon Container */}
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <i className="fa-solid fa-triangle-exclamation text-xl text-red-500"></i>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-3 font-primary">{title}</h3>

                    <p className="text-slate-500 text-sm leading-relaxed mb-8 px-2">
                        {message}
                    </p>

                    {children}

                    <div className="flex items-center gap-3 w-full justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-sm tracking-wide rounded-lg transition-all active:scale-95 min-w-32"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2.5 text-white font-bold text-sm tracking-wide rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95 min-w-32 ${confirmColor}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
