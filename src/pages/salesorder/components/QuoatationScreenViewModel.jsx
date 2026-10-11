import React, { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { getStatusBadge } from "../../../utils/enquiry/statusHelpers";
import { useDispatch } from "react-redux";
import { downloadFile } from "../../../reducer/standalone_bomReducer";

const QuotationViewModel = ({ order, onClose }) => {
  const [openAttachments, setOpenAttachments] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const dispatch = useDispatch();

  const handleOpenFiles = (files) => {
    setSelectedAttachments(files);
    setOpenAttachments(true);
  };

  const handleCloseFiles = () => {
    setOpenAttachments(false);
  };

  const getFileName = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let name = withoutParams.split("---").pop();
    return decodeURIComponent(name);
  };

  const handleDownload = (url) => {
    if (!url) return;
    dispatch(downloadFile(url));
  };


  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold uppercase flex items-center space-x-2">
            <span>{capitalizeFirst(order.product_name || "Sample Order")}</span>
            {/* Show red "Rework PI" if PI files exist */}
            {order.quatation_files?.length > 0 && (
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                Rework Quotation
              </span>
            )}

          </h2>
          <button
            className="text-2xl text-gray-600 hover:text-black"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)] p-4 space-y-6">

          {/* PRODUCT INFORMATION */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center justify-between">
              <span>Product Information</span>

              {order?.is_client_design && (
                <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  Client Design
                </span>
              )}
            </h3>

            <div className="space-y-3">
              <InfoRow label="Job Number" value={capitalizeFirst(order.job_no)} />
              <InfoRow label="Sub Job Number" value={capitalizeFirst(order.sub_job_no)} />
              <InfoRow label="Reference Number" value={order.enquiry_id?.reference_no || " "} />
              <InfoRow label="Product Name" value={capitalizeFirst(order.product_name)} />
              <InfoRow label="Type" value={capitalizeFirst(order.type || "N/A")} />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded text-xs font-semibold uppercase ${getStatusBadge(
                      order.status
                    )}`}
                    style={{ color: "rgb(51, 51, 51)" }}
                  >
                    {capitalizeFirst(order.status)}
                  </span>
                </div>
              </div>

              <InfoRow label="Quantity" value={order.job_quantity} />
              <InfoRow label="Delivery Date" value={order.delivery_date} />
            </div>
          </div>

          {/* CLIENT INFORMATION */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">
              Client Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Client Name" value={order.client_name} />
              <InfoRow label="Email" value={order.email?.join(", ")} />
              <InfoRow label="Phone" value={order.mobile_no || "N/A"} />
              <InfoRow label="WhatsApp" value={order.wp_number?.join(", ")} />
            </div>
          </div>

          {/* Designer FILES */}
          {order.designer_files?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-600">
                  Designer Files
                </h3>
              </div>

              <div className="space-y-3">
                {order.designer_files.map((file, idx) => (
                  <div key={idx} className="flex justify-between border border-gray-200 p-2 rounded">
                    <span className="text-gray-700">{getFileName(file)}</span>
                    <div className="flex space-x-2 items-center">
                      <IconButton
                        onClick={() => window.open(file, "_blank")}
                        size="small"
                      >
                        <VisibilityIcon className="text-blue-600" />
                      </IconButton>
                      <button
                        onClick={() => handleDownload(file)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors font-primary border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Quotation FILES */}
          {order.quatation_files?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-600">
                  Quotation Files
                </h3>
              </div>

              <div className="space-y-3">
                {order.quatation_files.map((file, idx) => (
                  <div key={idx} className="flex justify-between border border-gray-200 p-2 rounded">
                    <span className="text-gray-700">{getFileName(file)}</span>
                    <div className="flex space-x-2 items-center">
                      <IconButton
                        onClick={() => window.open(file, "_blank")}
                        size="small"
                      >
                        <VisibilityIcon className="text-blue-600" />
                      </IconButton>
                      <button
                        onClick={() => handleDownload(file)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors font-primary border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {order.is_bom_verified_remarks && (
                <p className="mt-2 text-gray-700 italic">
                  Quotation Remarks: {order.is_bom_verified_remarks}
                </p>
              )}
            </div>
          )}


        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>


    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-800 max-w-[60%] text-right break-words">
      {Array.isArray(value) ? value.join(", ") : value || "N/A"}
    </span>
  </div>
);

export default QuotationViewModel;
