import React from "react";
import ViewRow from "../../components/ViewRow";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

const ViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-blue-600">
            Customer Details
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
            label="Contact Person"
            value={viewModalData.contact_person}
          />
          <ViewRow label="Mobile No" value={viewModalData.mobile_no} />
          <ViewRow label="Email" value={viewModalData.email} />
          {Array.isArray(viewModalData.address) &&
            viewModalData.address.length > 0 && (
              <>
                {viewModalData.address.length === 1 ? (
                  <ViewRow
                    label="Address"
                    value={[
                      viewModalData.address?.[0]?.address_1,
                      viewModalData.address?.[0]?.address_2,
                      viewModalData.address?.[0]?.city,
                      viewModalData.address?.[0]?.state
                        ? `${viewModalData.address[0].state} - ${
                            viewModalData.address[0].postal_code || ""
                          }`
                        : viewModalData.address?.[0]?.postal_code,
                      viewModalData.address?.[0]?.gst_no
                        ? `(GST: ${viewModalData.address[0].gst_no})`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                ) : (
                  viewModalData.address.map((addr, idx) => (
                    <ViewRow
                      key={idx}
                      label={`Address ${idx + 1}`}
                      value={[
                        addr.address_1,
                        addr.address_2,
                        addr.city,
                        addr.state
                          ? `${addr.state} - ${addr.postal_code}`
                          : addr.postal_code,
                        addr.gst_no ? `(GST: ${addr.gst_no})` : "",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  ))
                )}
              </>
            )}
          <ViewRow
            label="Status"
            value={viewModalData.is_active}
            isStatus={true}
          />
          <ViewRow label="Created At" value={viewModalData.created_at} />
          <ViewRow
            label="Created By"
            value={capitalizeFirst(viewModalData.created_by_user?.name) || "-"}
          />
          <ViewRow label="Updated At" value={viewModalData.updated_at || "-"} />
          <ViewRow
            label="Updated By"
            value={
              viewModalData.updated_by && viewModalData.updated_by.length > 0
                ? capitalizeFirst(viewModalData.updated_by[0].user?.name) ||
                  "Unknown"
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
