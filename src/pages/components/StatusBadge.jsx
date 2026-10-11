import React from 'react';

const StatusBadge = ({ isActive }) => (
	<span
		className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
			${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
	>
		{isActive ? "Active" : "Inactive"}
	</span>
);

export default StatusBadge;