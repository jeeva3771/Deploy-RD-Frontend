import React from "react";
import ViewRow from "../../components/ViewRow";

const ViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-blue-600">
            Supply Vendor Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-2 overflow-x-auto overflow-y-auto">
          <ViewRow label="Name" value={viewModalData.name} />
          <ViewRow label="Mobile No" value={viewModalData.mobile_no} />
          <ViewRow label="Email" value={viewModalData.email} />
          <ViewRow label="Address" value={viewModalData.address} />

          <ViewRow
            label="Material Categories"
            value={viewModalData.material_categories?.map(c => c.name).join(', ') || "-"}
          />
          <ViewRow
            label="Material Types"
            value={viewModalData.material_types?.map(t => t.name).join(', ') || "-"}
          />
          <ViewRow
            label="Contract Type"
            value={viewModalData.contract_type?.name || "-"}
          />
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
              viewModalData.updated_by && viewModalData.updated_by.length > 0
                ? (() => {
                  // Sort by date descending
                  const sorted = [...viewModalData.updated_by].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                  );
                  const latest = sorted[0];
                  return latest.user?.name || "Unknown";
                })()
                : "No updates"
            }
          />
        </div>
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
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

export default ViewModal;