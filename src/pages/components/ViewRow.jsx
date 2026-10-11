import React from 'react';
import StatusBadge from './StatusBadge';

const ViewRow = ({ label, value, isStatus = false }) => (
  <div className="flex py-2 last:border-b-0 text-sm font-medium text-gray-600">
    <div className="w-32 flex-shrink-0 text-gray-800">{label}</div>
    <div className="w-4 flex-shrink-0">:</div>
    <div
      className={`flex-1 ml-4 ${
        ['Created By', 'Updated By'].includes(label) ? 'capitalize' : ''
      }`}
    >
      {isStatus ? <StatusBadge isActive={value} /> : String(value)}
    </div>
  </div>
);

export default ViewRow;