import React from 'react';

const STATUS_CONFIG = {
    'QC CHECK': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    'STORES INWARD': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'PARTIAL': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

function fmtDate(d) {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '—'; }
}

function QtyBar({ ordered, inwardGood, rejected }) {
    const ord = Number(ordered) || 0;
    const good = Number(inwardGood) || 0;
    const bad = Number(rejected) || 0;
    if (!ord) return null;
    const goodPct = Math.min(100, (good / ord) * 100);
    const badPct = Math.min(100 - goodPct, (bad / ord) * 100);
    return (
        <div className="mt-2">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200 gap-0.5">
                <div className="bg-emerald-500 rounded-full transition-all" style={{ width: `${goodPct}%` }} title={`Good: ${good}`} />
                <div className="bg-red-400 rounded-full transition-all" style={{ width: `${badPct}%` }} title={`Rejected: ${bad}`} />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 font-black mt-0.5 uppercase">
                <span>{good} Good</span>
                {bad > 0 && <span className="text-red-400">{bad} Rejected</span>}
                <span>{ord} Ordered</span>
            </div>
        </div>
    );
}

export function InwardCard({ item, onOpen }) {
    const inward = item.inward || {};
    const isComplete = item._inwardStatus === 'COMPLETED';
    const isPartial = item._inwardStatus === 'PARTIAL';
    const cfg = STATUS_CONFIG[item._inwardStatus] || STATUS_CONFIG['STORES INWARD'];

    return (
        <div
            onClick={() => onOpen(item)}
            className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg group ${isComplete ? 'border-emerald-300' : isPartial ? 'border-blue-300' : 'border-slate-200 hover:border-emerald-300'}`}
        >
            {/* Top Row */}
            <div className="flex justify-between items-start gap-2 mb-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-blue-600 text-[11px] font-black underline tracking-tighter">{item.poNumber}</span>
                        <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{item.rfqUid}</span>
                    </div>
                    <h3 className="text-sm font-black uppercase italic text-slate-800 mt-1 truncate">{item.name}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold not-italic truncate">{item.vendorName}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {item._inwardStatus}
                </div>
            </div>

            {/* If QC CHECK, show notice instead of qty grid if it's purely new */}
            {item._inwardStatus === 'QC CHECK' && (
                 <div className="bg-purple-50 text-purple-700 text-[10px] font-black p-2 rounded-xl text-center mb-3 border border-purple-100 uppercase tracking-widest">
                     In QC Inspection...
                 </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Ordered</div>
                    <div className="text-sm font-black text-slate-800">{item.qty}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
                    <div className="text-[8px] font-black text-emerald-500 uppercase mb-0.5">Good</div>
                    <div className="text-sm font-black text-emerald-700">{inward.inwardGood ?? '—'}</div>
                </div>
                <div className={`rounded-xl p-2 text-center border ${Number(inward.rejected) > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`text-[8px] font-black uppercase mb-0.5 ${Number(inward.rejected) > 0 ? 'text-red-400' : 'text-slate-400'}`}>Rejected</div>
                    <div className={`text-sm font-black ${Number(inward.rejected) > 0 ? 'text-red-600' : 'text-slate-800'}`}>{inward.rejected ?? '—'}</div>
                </div>
            </div>

            {/* Qty Bar */}
            <QtyBar ordered={item.qty} inwardGood={inward.inwardGood} rejected={inward.rejected} />

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                <div className="text-[9px] text-slate-400 font-semibold not-italic uppercase">
                    Job: <span className="text-slate-600 font-black">{item.jobNo}{item.subJobNo && item.subJobNo !== 'MANUAL' ? `/${item.subJobNo}` : ''}</span>
                </div>
                <div className="text-[9px] text-slate-400 font-semibold not-italic">
                    {item.poDeliveryDate ? fmtDate(item.poDeliveryDate) : '—'}
                </div>
            </div>

            {/* Re-inward badge */}
            {Number(inward.reinward) > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">
                    🔄 Re-inward: {inward.reinward} nos pending
                </div>
            )}
        </div>
    );
}

export function InwardTable({ items, onOpen }) {
    if (items.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <p className="text-slate-400 font-black text-sm uppercase italic">No inward records found</p>
                    <p className="text-slate-300 text-xs font-semibold mt-1">POs at STORES INWARD stage will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-6 overflow-y-auto">
            {items.map((item, i) => (
                <InwardCard key={`${item.rfqId}-${item.poNumber}-${i}`} item={item} onOpen={onOpen} />
            ))}
        </div>
    );
}
