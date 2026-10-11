import React from "react";
import ViewRow from "../../components/ViewRow";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
};

const ViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-blue-600">
            Machine Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-2 overflow-y-auto overflow-x-auto flex-1">
          <ViewRow label="Name" value={viewModalData.name} />
          <ViewRow
            label="Machine Number"
            value={viewModalData.machine_number}
          />
          <ViewRow
            label="Location"
            value={viewModalData.location || "-"}
          />
          <ViewRow
            label="Department"
            value={viewModalData.department?.name || "-"}
          />
          <ViewRow label="Type" value={viewModalData.type || "-"} />
          <ViewRow
            label="Status"
            value={viewModalData.is_active}
            isStatus={true}
          />
          <ViewRow
            label="Commission Date"
            value={viewModalData.commission_date || "-"}
          />
          <ViewRow
            label="Last Service Date"
            value={viewModalData.last_service_date || "-"}
          />
          <ViewRow
            label="Gross Cost"
            value={formatCurrency(viewModalData.gross_cost)}
          />
          <ViewRow
            label="Book Value"
            value={formatCurrency(viewModalData.book_value)}
          />
          <ViewRow
            label="Accumulated Depreciation"
            value={formatCurrency(viewModalData.accumulated_depreciation)}
          />
          <ViewRow
            label="Maintenance"
            value={
              Array.isArray(viewModalData.maintanence)
                ? viewModalData.maintanence.join(", ")
                : "-"
            }
          />
          {Array.isArray(viewModalData.add_fields) &&
          viewModalData.add_fields.length > 0 ? (
            <ViewRow
              label="Additional Information"
              value={viewModalData.add_fields
                .map((field) => `${field.key}: ${field.value}`)
                .join(", ")}
            />
          ) : (
            <ViewRow
              label="Additional Information"
              value="No additional fields available"
            />
          )}
          <ViewRow label="Created At" value={viewModalData.created_at} />
          <ViewRow
            label="Created By"
            value={capitalizeFirst(viewModalData.created_by_user?.name) || "-"}
          />
          <ViewRow label="Updated At" value={viewModalData.updated_at || "-"} />
          <ViewRow
            label="Updated By"
            value={
              Array.isArray(viewModalData.updated_by) &&
              viewModalData.updated_by.length > 0
                ? capitalizeFirst(viewModalData.updated_by[0].user?.name) ||
                  "Unknown"
                : viewModalData.updated_by?.user?.name
                  ? capitalizeFirst(viewModalData.updated_by.user.name)
                  : "No updates"
            }
          />
        </div>
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

export default ViewModal;
