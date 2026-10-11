import React from 'react';

const HeaderPill = ({ label, count, icon, bgColor, borderColor, textColor, onClick, isActive, disabled }) => (
  <div 
    onClick={!disabled ? onClick : undefined}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 ${bgColor} ${borderColor} ${textColor} shadow-sm group transition-all 
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'} 
      ${isActive ? 'ring-2 ring-offset-1 ring-blue-400 shadow-md scale-105' : ''}`}
  >
    {icon}
    <span className="text-[9px] font-[1000] tracking-tight uppercase whitespace-nowrap">
      {label} {count !== undefined && count !== null ? `(${count})` : ''}
    </span>
  </div>
);

export default HeaderPill;
