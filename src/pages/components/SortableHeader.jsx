import React from 'react';

const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => {
  const getSortIcon = () => {
    if (sortConfig.key !== sortKey) {
      return '';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="text-gray-400">{getSortIcon()}</span>
      </div>
    </th>
  );
};

export default SortableHeader;