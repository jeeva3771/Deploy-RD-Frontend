import React from 'react';

export function InwardHeader({ totalPending, totalDone, loading, onRefresh, searchTerm, onSearch, filterStage, onFilterStage }) {
    const stages = ['ALL', 'QC CHECK', 'STORES INWARD', 'PARTIAL', 'COMPLETED'];
    return (
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col gap-3 shadow-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl italic font-black uppercase tracking-tighter text-slate-800 underline decoration-emerald-500 decoration-4">
                        Material Inward
                    </h1>
                    <p className="text-[9px] text-slate-400 mt-0.5 tracking-widest font-black uppercase">
                        {totalPending} PENDING INWARD&nbsp;|&nbsp;
                        <span className="text-emerald-600">{totalDone} COMPLETED</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter buttons */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                        {stages.map(s => (
                            <button
                                key={s}
                                onClick={() => onFilterStage(s)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterStage === s ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[9px] font-black italic uppercase hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? '⏳ Loading...' : '↻ Refresh'}
                    </button>
                </div>
            </div>
            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by PO Number, Item Name, Vendor, Job No..."
                    value={searchTerm}
                    onChange={e => onSearch(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-[11px] font-semibold italic outline-none focus:border-emerald-400 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 shadow-sm"
                />
                {searchTerm && (
                    <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 font-black text-lg">×</button>
                )}
            </div>
        </header>
    );
}
