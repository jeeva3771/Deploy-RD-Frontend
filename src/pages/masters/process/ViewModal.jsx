import React from "react";
import ViewRow from "../../components/ViewRow";

const ViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-blue-600">
            Process Details
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
          <ViewRow label="Service Category Name" value={viewModalData.service_category.name} />
          <ViewRow label="Type" value={viewModalData.type || "-"} />
          <ViewRow
            label="Departments"
            value={
              Array.isArray(viewModalData.department)
                ? viewModalData.department
                  .map((dept) =>
                    typeof dept === 'object'
                      ? `${dept.name}${dept.type ? ` - ${dept.type}` : ""}`
                      : dept
                  )
                  .join(", ")
                : "-"
            }
          />

          <ViewRow
            label="Machines"
            value={
              Array.isArray(viewModalData.machine)
                ? viewModalData.machine
                  .map((machine) =>
                    typeof machine === 'object'
                      ? `${machine.name}${machine.type ? ` - ${machine.type}` : ""}`
                      : machine
                  )
                  .join(", ")
                : "-"
            }
          />

          <ViewRow
            label="Has Custom Input"
            value={viewModalData.has_custom_input ? "Yes" : "No"}
          />

          <ViewRow
            label="Unit Types"
            value={
              Array.isArray(viewModalData.unit_type)
                ? viewModalData.unit_type.join(", ")
                : "-"
            }
          />

          <ViewRow
            label="Units"
            value={
              Array.isArray(viewModalData.unit)
                ? viewModalData.unit
                  .map((unit) =>
                    typeof unit === 'object' ? unit.name : unit
                  )
                  .join(", ")
                : "-"
            }
          />

          {/* Variables Section
          <ViewRow
            label="Variables"
            value={
              viewModalData.variables && viewModalData.variables.length > 0
                ? viewModalData.variables
                    .map((variable) => {
                      const flags = [];
                      if (variable.is_rate_variable) flags.push("Rate Variable");
                      if (variable.is_size_variable) flags.push("Size Variable");
                      const flagsText = flags.length > 0 ? ` (${flags.join(", ")})` : "";
                      
                      const values = variable.allowed_values && variable.allowed_values.length > 0
                        ? ` [${variable.allowed_values.join(", ")}]`
                        : "";
                      
                      return `${variable.label}${flagsText}${values}`;
                    })
                    .join(" | ")
                : "-"
            }
          /> */}

          {viewModalData.variables && viewModalData.variables.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Variables</h3>

              <div className="bg-gray-50 border-gray-200 rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Label</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Key</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Rate Variable</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Size Variable</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Allowed Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewModalData.variables.map((variable, index) => (
                      <tr key={variable._id?.$oid || index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-100">
                        <td className="px-4 py-2 font-medium text-gray-800">{variable.label}</td>
                        <td className="px-4 py-2 text-gray-600">{variable.key}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${variable.is_rate_variable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                            }`}>
                            {variable.is_rate_variable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${variable.is_size_variable
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                            }`}>
                            {variable.is_size_variable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {variable.allowed_values && variable.allowed_values.length > 0
                            ? variable.allowed_values.join(", ")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <ViewRow
            label="Additional Columns"
            value={
              Array.isArray(viewModalData.additional_columns) && viewModalData.additional_columns.length > 0
                ? viewModalData.additional_columns
                  .map((col) => typeof col === 'object' ? col.name : col)
                  .join(", ")
                : "-"
            }
          />

          <ViewRow label="Remarks" value={viewModalData.remarks || "-"} />

          <ViewRow
            label="Status"
            value={viewModalData.is_active ? "Active" : "Inactive"}
            isStatus={true}
          />

          <ViewRow label="Created At" value={viewModalData.created_at} />

          <ViewRow
            label="Created By"
            value={viewModalData.created_by_user?.name || "-"}
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

        {/* Fixed Footer */}
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