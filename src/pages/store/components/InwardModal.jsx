import React, { useState, useEffect } from 'react';

function fmtDateTime(d) {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch { return '—'; }
}

function InfoRow({ label, value, accent }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className={`text-[11px] font-black italic uppercase text-right max-w-[60%] truncate ${accent || 'text-slate-800'}`}>{value || '—'}</span>
        </div>
    );
}

function QtyInput({ label, value, onChange, max, color, hint, disabled }) {
    const colorMap = {
        slate: 'border-slate-200 focus:border-slate-400 bg-slate-50',
        emerald: 'border-emerald-300 focus:border-emerald-500 bg-emerald-50',
        red: 'border-red-300 focus:border-red-500 bg-red-50',
        blue: 'border-blue-300 focus:border-blue-500 bg-blue-50',
    };
    return (
        <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</label>
            <input
                type="number"
                min="0"
                max={max}
                step="1"
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm font-black text-center outline-none transition-all ${colorMap[color] || colorMap.slate} disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {hint && <p className="text-[8px] text-slate-400 font-semibold mt-0.5 text-center">{hint}</p>}
        </div>
    );
}

export function InwardModal({ item, onClose, onSubmit, loading }) {
    const orderedQty = Number(item?.qty) || 0;
    const prevInward = item?.inward || {};

    const [inwardGood, setInwardGood] = useState(String(prevInward.inwardGood ?? ''));
    const [rejected, setRejected] = useState(String(prevInward.rejected ?? ''));
    const [reinward, setReinward] = useState(String(prevInward.reinward ?? ''));
    const [error, setError] = useState('');

    // Auto-compute reinward = ordered - inwardGood - rejected
    useEffect(() => {
        const g = Number(inwardGood) || 0;
        const r = Number(rejected) || 0;
        const rem = orderedQty - g - r;
        setReinward(String(rem > 0 ? rem : 0));
    }, [inwardGood, rejected, orderedQty]);

    const totalAccounted = (Number(inwardGood) || 0) + (Number(rejected) || 0);
    const balance = orderedQty - totalAccounted;
    const isComplete = balance === 0;
    const isOver = totalAccounted > orderedQty;

    function validate() {
        if ((Number(inwardGood) || 0) < 0 || (Number(rejected) || 0) < 0) {
            setError('Quantities cannot be negative.');
            return false;
        }
        if (isOver) {
            setError(`Total (${totalAccounted}) exceeds ordered quantity (${orderedQty}).`);
            return false;
        }
        if ((Number(inwardGood) || 0) === 0 && (Number(rejected) || 0) === 0) {
            setError('Please enter at least Inward Good or Rejected quantity.');
            return false;
        }
        return true;
    }

    function handleSubmit() {
        setError('');
        if (!validate()) return;
        onSubmit({
            rfqId: item.rfqId,
            poNumber: item.poNumber,
            ordered: orderedQty,
            inwardGood: Number(inwardGood) || 0,
            rejected: Number(rejected) || 0,
            reinward: Number(reinward) || 0,
        });
    }

    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Material Inward Entry</p>
                            <h2 className="text-lg font-black italic uppercase tracking-tighter leading-tight">{item.name}</h2>
                            <p className="text-[10px] font-semibold opacity-80 mt-0.5">{item.poNumber} • {item.vendorName}</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black text-lg transition-colors flex-shrink-0">×</button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6">

                    {/* Ordered Qty Banner */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 mb-5 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Ordered Quantity</p>
                        <p className="text-3xl font-black">{orderedQty}</p>
                        <p className="text-[9px] font-semibold opacity-60 mt-1">{item.unit || 'units'}</p>
                    </div>

                    {/* Item Info */}
                    <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">PO Details</p>
                        <InfoRow label="Job No" value={`${item.jobNo}${item.subJobNo && item.subJobNo !== 'MANUAL' ? '/' + item.subJobNo : ''}`} />
                        <InfoRow label="RFQ UID" value={item.rfqUid} />
                        <InfoRow label="Vendor" value={item.vendorName} />
                        <InfoRow label="Delivery Date" value={fmtDateTime(item.poDeliveryDate)} />
                        <InfoRow label="Coord Stage" value={item.coordStage} accent="text-emerald-600" />
                        {item.inward?.updatedAt && (
                            <InfoRow label="Last Updated" value={fmtDateTime(item.inward.updatedAt)} />
                        )}
                    </div>

                    {item.coordStage === "QC CHECK" && (
                        <div className="bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-black italic p-3 rounded-xl mb-4 uppercase tracking-widest text-center">
                            This item is currently at QC stage.
                        </div>
                    )}

                    {/* Qty Inputs */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <QtyInput
                            label="✅ Inward Good"
                            value={inwardGood}
                            onChange={setInwardGood}
                            max={orderedQty}
                            color="emerald"
                            hint="Accepted quantity"
                        />
                        <QtyInput
                            label="❌ Rejected"
                            value={rejected}
                            onChange={setRejected}
                            max={orderedQty}
                            color="red"
                            hint="Rejected quantity"
                        />
                    </div>

                    {/* Re-inward (auto-computed) */}
                    <div className="mb-4">
                        <QtyInput
                            label="🔄 Re-inward (Pending)"
                            value={reinward}
                            onChange={() => {}} // read-only, auto-calculated
                            color="blue"
                            hint="Auto-calculated: Ordered − Good − Rejected"
                            disabled={true}
                        />
                    </div>

                    {/* Balance display */}
                    <div className={`rounded-2xl p-3 text-center mb-4 border-2 ${isOver ? 'bg-red-50 border-red-300' : isComplete ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isOver ? 'text-red-500' : isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isOver ? '⚠ Exceeds Ordered' : isComplete ? '✅ Fully Accounted' : '⏳ Balance Pending'}
                        </p>
                        <p className={`text-2xl font-black ${isOver ? 'text-red-600' : isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>{isOver ? 'ERROR' : balance}</p>
                        {!isOver && !isComplete && <p className="text-[9px] text-amber-600 font-semibold">{balance} unit(s) not yet accounted</p>}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold p-3 rounded-xl mb-4">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-slate-100 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 text-[10px] font-black uppercase italic text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || isOver}
                        className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase italic hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30"
                    >
                        {loading ? '⏳ Saving...' : '📦 Save Inward'}
                    </button>
                </div>

            </div>
        </div>
    );
}
