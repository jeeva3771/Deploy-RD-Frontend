import React from 'react';

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
        <span className="text-[11px] font-bold text-slate-600 uppercase italic tracking-tight">{label}</span>
    </div>
);

export default LegendItem;
