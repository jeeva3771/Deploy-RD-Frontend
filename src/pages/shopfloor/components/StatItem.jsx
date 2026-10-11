import React from 'react';

const StatItem = ({ label, value, isBold, highlight, highlightGreen, highlightPurple }) => (
    <div className="flex flex-col">
        <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-[11px] uppercase tracking-tight ${isBold ? 'font-[1000] text-slate-900 italic' : 'font-black text-slate-700'} ${highlight ? 'text-amber-600' : ''} ${highlightGreen ? 'text-emerald-600 font-[1000]' : ''} ${highlightPurple ? 'text-purple-700 font-[1000]' : ''}`}>
            {value}
        </p>
    </div>
);

export default StatItem;
