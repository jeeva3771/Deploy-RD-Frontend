import React from 'react';
import { Scale } from 'lucide-react';

const Reconcile = ({ isUv, department }) => {
    const materials = [
        { name: 'Acrylic White', detail: '12x18in · ₹0.45/sq.in', system: 0 },
        { name: 'PVC Board', detail: '24x18in · ₹0.18/sq.in', system: 0 },
        { name: 'Aluminium Sheet', detail: '18x12in · ₹1.2/sq.in', system: 0 },
        { name: 'Foam Board', detail: '24x24in · ₹0.08/sq.in', system: 0 },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Scale className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-[11px] font-[1000] text-indigo-800 uppercase tracking-widest">MONTHLY STOCK RECONCILIATION</h3>
                    <p className="text-[8px] font-black text-indigo-600/60 uppercase tracking-widest mt-0.5">Enter physical count for each material. System auto-generates ADJUSTMENT vouchers for differences. Export to Tally to correct Mother Inventory.</p>
                </div>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">LAST RECONCILED</span>
                    <span className="text-lg font-black text-indigo-900 tracking-tight leading-none">Never</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">ADJUSTMENTS MADE</span>
                    <span className="text-lg font-black text-indigo-900 tracking-tight leading-none">0</span>
                </div>
            </div>

            <div className="space-y-4">
                {materials.map((mat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 relative group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-[14px] font-[1000] text-slate-800 uppercase tracking-tight">{mat.name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{mat.detail}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">SYSTEM SAYS</span>
                                <span className="text-xl font-black text-slate-800 tracking-tight leading-none">{mat.system} pcs</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">PHYSICAL COUNT (PCS)</span>
                            <input 
                                type="text" 
                                placeholder="Enter actual count..." 
                                className="w-full bg-white border-2 border-indigo-50 rounded-2xl px-6 py-4 text-xl font-black text-indigo-900 placeholder:text-slate-200 outline-none focus:border-indigo-200 transition-all text-center tracking-tighter"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-indigo-50/20 rounded-2xl p-6 border border-indigo-100/50 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">AUTHORISED BY</label>
                        <select className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none focus:border-indigo-400">
                            <option>Select...</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">REMARKS</label>
                        <input type="text" placeholder="Monthly count, reason..." className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 outline-none focus:border-indigo-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reconcile;
