import React from "react";
import ViewRow from "../../components/ViewRow";

const PackingtypeViewModal = ({ viewModalData, onClose }) => {
	if (!viewModalData) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
					<h2 className="text-xl font-semibold text-blue-600">
						Inner Packaging Type Details
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center"
					>
						×
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-2 overflow-y-auto flex-1">
					<ViewRow label="Name" value={viewModalData.name} />
					<ViewRow
						label="Status"
						value={viewModalData.is_active}
						isStatus={true}
					/>
					<ViewRow label="Created At" value={viewModalData.created_at || "-"} />
					<ViewRow
						label="Created By"
						value={viewModalData.created_by?.name || "-"}
					/>
					<ViewRow label="Updated At" value={viewModalData.updated_at || "-"} />
					<ViewRow
						label="Updated By"
						value={
							viewModalData.updated_by?.length
								? (() => {
									const sorted = [...viewModalData.updated_by].sort(
										(a, b) => new Date(b.date) - new Date(a.date)
									);
									return sorted[0].user?.name || "Unknown";
								})()
								: "-"
						}
					/>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0 sticky bottom-0 z-10">
					<button
						onClick={onClose}
						className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default PackingtypeViewModal;