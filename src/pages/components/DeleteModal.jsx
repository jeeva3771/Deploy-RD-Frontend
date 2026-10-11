import React from "react";

const DeleteModal = ({ deleteModalData, onCancel, confirmDelete, message }) => {
	if (!deleteModalData) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
				<div className="p-6">
					<div className="flex items-center mb-4">
						<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
							<span className="text-red-600 text-xl">⚠️</span>
						</div>
					</div>

					<div className="text-center">
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Confirm Delete
						</h3>
						<p className="text-sm text-gray-500 mb-4">
							{message ? message : `Are you sure you want to delete the user "${deleteModalData.name || deleteModalData.team_name}"? This action cannot be undone.`}
						</p>
					</div>

					<div className="flex justify-center space-x-3">
						<button
							onClick={onCancel}
							className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={confirmDelete}
							className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DeleteModal;