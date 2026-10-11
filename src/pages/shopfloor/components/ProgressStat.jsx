import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ProgressStat = ({ label, value, isCheck }) => (
    <div className="flex flex-col">
        <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="flex items-center gap-1">
            <span className="text-[11px] font-[1000] text-slate-900 tracking-tighter uppercase">{value}</span>
            {isCheck && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </div>
    </div>
);

export default ProgressStat;
