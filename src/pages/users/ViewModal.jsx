import React from 'react';
import RoleBadge from './RoleBadge';
import ProfileImage from './ProfileImage';
import { getUserRole } from "../../utils/permission/auth";


const ViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;
  const userRole = getUserRole();

  const DetailRow = ({
    label,
    value,
    isRole = false,
    isImage = false,
    imageSize = "default",
  }) => (
    <div
      className={
        isImage
          ? "flex items-center py-3 last:border-b-0"
          : "flex py-2 last:border-b-0 text-sm font-medium text-gray-600"
      }
    >
      <div className="w-32 flex-shrink-0 text-sm font-medium text-gray-700">
        {label}
      </div>
      <div className="w-4 flex-shrink-0">:</div>
      <div className="flex-1 ml-4 ">
        {isImage ? (
          <ProfileImage
            src={value}
            alt={viewModalData.name}
            name={viewModalData.name}
            size={imageSize}
            shape="square"
          />
        ) : isRole ? (
          <RoleBadge role={value} />
        ) : (
          <span
            style={{
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
            className={`text-sm text-gray-900 ${["Created By", "Updated By"].includes(label) ? "capitalize" : ""
              }`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-blue-600">
            User Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-light w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-1 overflow-y-auto overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-smooth">
          <DetailRow
            label="Image"
            value={viewModalData.image}
            isImage={true}
            imageSize="modal"
          />
          <DetailRow label="Name" value={viewModalData.name} />
          <DetailRow label="Username" value={viewModalData.username} />
          <DetailRow label="Employee ID" value={viewModalData.emp_id} />
          <DetailRow
            label="Department"
            value={viewModalData.department_id?.name}
          />
          <DetailRow label="Role" value={viewModalData.role} isRole={true} />
          <DetailRow label="Company" value={viewModalData.company_id?.company_name || "-"} />
          <DetailRow label="Work" value={viewModalData.work_id?.work_name || "-"} />
          {/* <DetailRow label="Password" value={viewModalData.password} /> */}
          <DetailRow label="Is Head" value={viewModalData.is_head === true ? 'Yes' : 'No'} />
          <DetailRow label="Is Pricing Specialist" value={viewModalData.is_pricing_specialist === true ? 'Yes' : 'No'} />
          <DetailRow label="Only Profile" value={viewModalData.only_profile === true ? 'Yes' : 'No'} />
          <DetailRow label="Is Active" value={viewModalData.is_active === true ? 'Yes' : 'No'} />
          <DetailRow label="Email" value={viewModalData.email || "-"} />
          <DetailRow label="Employee ID" value={viewModalData.emp_id} />
          <DetailRow label="Date of Joining" value={viewModalData.doj} />
          <DetailRow label="Date of Birth" value={viewModalData.dob} />
          <DetailRow label="Phone Number" value={viewModalData.phone_number} />
          <DetailRow label="Reference Name" value={viewModalData.reference_name} />
          <DetailRow label="Emergency Number" value={viewModalData.emergency_number} />

          {userRole?.toLowerCase() === "admin executive" && (
            <DetailRow label="Notes" value={viewModalData.notes || "-"} />
          )}

          <DetailRow label="Created At" value={viewModalData.created_at} />
          <DetailRow
            label="Created By"
            value={viewModalData.created_by_user?.name || "-"}
          />
          <DetailRow
            label="Updated At"
            value={viewModalData.updated_at || "-"}
          />
          <DetailRow
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