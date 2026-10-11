import React from "react";
import { formatDateToYYYYMMDD } from "../../../utils/enquiry/dateformat";

// UTILITY FUNCTIONS
const calculateDays = (dojString) => {
  if (!dojString || dojString === "N/A") return 0;
  const doj = new Date(dojString);
  const today = new Date();
  const diffTime = Math.abs(today - doj);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const EmployeeCard = ({ employee, onEdit, onExit }) => {
  const formatYYYYMMDD = formatDateToYYYYMMDD(employee.doj);
  const days = calculateDays(formatYYYYMMDD);

  return (
    <div className="group bg-gray-50 border border-gray-300 rounded-lg p-3 transition-all duration-200 hover:bg-purple-100 hover:border-purple-300 hover:shadow-lg relative">
      {/* Action Buttons - Show on Hover */}
      {/* Action Buttons - Show on Hover - Only for Active Employees */}
      {employee.status !== "Exited" && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={() => onEdit(employee)}
            className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-gray-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onExit(employee)}
            className="px-2 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors shadow-sm"
          >
            Exit
          </button>
        </div>
      )}

      <div className="flex gap-3 items-start">
        {/* Photo Section */}
        <div className="flex-shrink-0">
          <img
            src={employee.photo}
            alt={employee.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.title)}&background=random`;
            }}
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[13px] text-slate-500 font-bold uppercase tracking-wide mb-0.5"
            style={{ color: "oklch(45.7% 0.24 277.023)" }}
          >
            {employee.name}
          </div>
          <div className="text-sm font-bold text-slate-800 mb-1">
            {employee.title}
          </div>

          {/* Details */}
          <div className="text-[12px] text-slate-500 space-y-1">
            {/* Row 1 - DOJ and Days */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 sm:flex-1">
                <span>DOJ:</span>
                <span className="text-slate-500">{employee.doj || "N/A"}</span>
              </div>

              <div className="sm:w-[90px] sm:text-right text-slate-400">
                {days} Days
              </div>
            </div>

            {/* Row 2 - Username and ID */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 sm:flex-1">
                <span>Age:</span>
                <span className="text-slate-700">{employee.age || "N/A"}</span>
              </div>

              <div className="flex items-center gap-1 sm:w-[110px] sm:justify-end">
                <span>ID:</span>
                <span className="text-slate-500 text-xs truncate" title={employee.emp_id}>
                  {employee.emp_id || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="mt-1.5 space-y-0.5 text-[12px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-xs">📞</span>
              <span>{employee.phone1}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-xs">🚨</span>
              <span>{employee.phone2}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;