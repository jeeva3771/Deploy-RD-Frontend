import React, { useState } from 'react';

const defaultChecks = {
    fonts_to_curves: false,
    cmyk_mode: false,
    bleeds_checked: false
};

const PreFlightModal = ({ isOpen, onClose, onConfirm, sectionName, initialData }) => {
    const [checks, setChecks] = useState(defaultChecks);

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setChecks({
                    fonts_to_curves: !!initialData.fonts_to_curves,
                    cmyk_mode: !!initialData.cmyk_mode,
                    bleeds_checked: !!initialData.bleeds_checked
                });
            } else {
                setChecks(defaultChecks);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(checks);
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 font-primary">Pre-Flight: {sectionName}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <i className="fa-solid fa-times text-lg"></i>
                    </button>
                </div>
                <div className="p-8 space-y-4">
                    <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                                checked={checks.fonts_to_curves}
                                onChange={(e) => setChecks({ ...checks, fonts_to_curves: e.target.checked })}
                            />
                        </div>
                        <span className="text-slate-700 font-medium font-primary group-hover:text-slate-900">Fonts to Curves</span>
                    </label>

                    <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                                checked={checks.cmyk_mode}
                                onChange={(e) => setChecks({ ...checks, cmyk_mode: e.target.checked })}
                            />
                        </div>
                        <span className="text-slate-700 font-medium font-primary group-hover:text-slate-900">CMYK Mode</span>
                    </label>

                    <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                                checked={checks.bleeds_checked}
                                onChange={(e) => setChecks({ ...checks, bleeds_checked: e.target.checked })}
                            />
                        </div>
                        <span className="text-slate-700 font-medium font-primary group-hover:text-slate-900">Bleeds Checked</span>
                    </label>

                    <button
                        onClick={handleConfirm}
                        disabled={Object.values(checks).some(v => !v)}
                        className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none font-primary flex items-center justify-center gap-2"
                    >
                        Confirm & Upload
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreFlightModal;
