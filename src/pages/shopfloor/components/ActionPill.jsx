import React from 'react';

const ActionPill = ({ icon, label, count, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#334155] text-gray-100 text-[8.5px] font-[1000] uppercase hover:bg-gray-700 transition-all border border-gray-600 whitespace-nowrap shrink-0">
    {icon && React.cloneElement(icon, { size: 11 })}
    <span className="whitespace-nowrap">{label}</span>
    {count !== undefined && count !== null && (
      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[8px] font-black flex items-center justify-center min-w-[14px]">
        {count}
      </span>
    )}
  </button>
);

export default ActionPill;
