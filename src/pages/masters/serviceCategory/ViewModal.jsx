import React from 'react'
import StatusBadge from '../../components/StatusBadge';
import { capitalizeFirst } from '../../../utils/helper/capitalize';

const ViewModal = ({ viewModalData, onClose }) => {
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
				<div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
					<h2 className="text-xl font-semibold text-blue-600">Service Category Details</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center">×</button>
				</div>
				<div className="p-6 space-y-2 overflow-y-auto flex-1">
					<div className="flex py-2 text-sm font-medium text-gray-600"><div className="w-32 text-gray-800">Name</div><div className="w-4">:</div><div className="flex-1 ml-4">{viewModalData.name}</div></div>
					<div className="flex py-2 text-sm font-medium text-gray-600"><div className="w-32 text-gray-800">Status</div><div className="w-4">:</div><div className="flex-1 ml-4"><StatusBadge isActive={viewModalData.is_active} /></div></div>
					<div className="flex py-2 text-sm font-medium text-gray-600"><div className="w-32 text-gray-800">Created At</div><div className="w-4">:</div><div className="flex-1 ml-4">{viewModalData.created_at || "-"}</div></div>
					<div className="flex py-2 text-sm font-medium text-gray-600"><div className="w-32 text-gray-800">Created By</div><div className="w-4">:</div><div className="flex-1 ml-4">{capitalizeFirst(viewModalData.created_by?.name) || "-"}</div></div>
					<div className="flex py-2 text-sm font-medium text-gray-600"><div className="w-32 text-gray-800">Updated At</div><div className="w-4">:</div><div className="flex-1 ml-4">{viewModalData.updated_at || "-"}</div></div>
					<div className="flex py-2 text-sm font-medium text-gray-600"><div className="w-32 text-gray-800">Updated By</div><div className="w-4">:</div><div className="flex-1 ml-4">{capitalizeFirst(viewModalData.updated_by[0]?.user?.name) || "-"}</div></div>

				</div>
				<div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
					<button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-md">Close</button>
				</div>
			</div>
		</div>
	)
}

export default ViewModal;
