import React from 'react';

const AnalysisCard = ({ label, value, color = 'slate', icon }) => (
    <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-center justify-between">
            <span className="text-2xl font-[1000] text-slate-800 italic tracking-tighter">{value}</span>
            {icon && <div className={`p-1.5 rounded-lg ${color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-500'}`}>{icon}</div>}
        </div>
    </div>
);

export default AnalysisCard;
