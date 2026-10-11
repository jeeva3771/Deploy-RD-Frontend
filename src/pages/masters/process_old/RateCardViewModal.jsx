import React from "react";
import ViewRow from "../../components/ViewRow";

const RateCardViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;

  const {
    name,
    process,
    rate_unit,
    variable_rates,
    is_active,
    remarks,
    created_at,
    created_by_user,
    updated_at,
    updated_by,
  } = viewModalData;

  // Extract unique keys from variable_rates (excluding price and _id)
  const getVariableKeys = () => {
    if (!variable_rates || variable_rates.length === 0) return [];

    const keys = new Set();
    variable_rates.forEach(rate => {
      Object.keys(rate).forEach(key => {
        if (key !== 'price' && key !== '_id') {
          keys.add(key);
        }
      });
    });
    return Array.from(keys);
  };

  const variableKeys = getVariableKeys();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50 flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-blue-600">
            Rate Card Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-2 overflow-y-auto overflow-x-auto flex-1">
          <ViewRow
            label="Process"
            value={
              process?.service_category?.name
                ? `${process.service_category.name}${process.type ? ` - ${process.type}` : ""}`
                : "-"
            }
          />

          <ViewRow label="Rate Unit" value={rate_unit || "-"} />

          {/* Variable Rates Table */}
          {variable_rates && variable_rates.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Variable Rates</h3>

              <div className="bg-gray-50 rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      {variableKeys.map((key) => (
                        <th key={key} className="px-4 py-2 text-left font-semibold text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variable_rates.map((rate, index) => (
                      <tr key={rate._id?.$oid || index} className="border-b last:border-b-0 hover:bg-gray-100">
                        {variableKeys.map((key) => (
                          <td key={key} className="px-4 py-2 text-gray-800">
                            {rate[key] || "-"}
                          </td>
                        ))}
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          ₹{rate.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <ViewRow label="Remarks" value={remarks || "-"} />

          <ViewRow
            label="Status"
            value={is_active ? "Active" : "Inactive"}
            isStatus={true}
          />

          <ViewRow label="Created At" value={created_at || "-"} />

          <ViewRow
            label="Created By"
            value={created_by_user?.name || "-"}
          />

          <ViewRow label="Updated At" value={updated_at || "-"} />

          <ViewRow
            label="Updated By"
            value={
              updated_by && updated_by.length > 0
                ? (() => {
                  // Sort by date descending
                  const sorted = [...updated_by].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                  );
                  const latest = sorted[0];
                  return latest.user?.name || "Unknown";
                })()
                : "No updates"
            }
          />
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end flex-shrink-0 sticky bottom-0 z-10">
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

export default RateCardViewModal;