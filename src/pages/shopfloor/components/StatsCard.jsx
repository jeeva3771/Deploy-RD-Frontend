import React from 'react';

const StatsCard = ({ label, value, sub, color, icon }) => {
    const colors = {
        blue: 'border-blue-100 bg-blue-50/20 text-blue-900',
        emerald: 'border-emerald-100 bg-emerald-50/20 text-emerald-900',
        amber: 'border-amber-100 bg-amber-50/20 text-amber-900'
    };
    const accentColors = {
        blue: 'text-blue-500',
        emerald: 'text-emerald-500',
        amber: 'text-amber-500'
    };

    return (
        <div className={`p-6 rounded-[2.5rem] border ${colors[color]} shadow-sm`}>
            <p className="text-[8px] font-black opacity-50 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                {icon} {label}
            </p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-[1000] italic tracking-tighter">{value}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${accentColors[color]}`}>{sub}</span>
            </div>
        </div>
    );
};

export default StatsCard;
