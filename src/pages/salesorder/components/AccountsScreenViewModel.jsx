import React, { useState, useEffect } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { getStatusBadge } from "../../../utils/enquiry/statusHelpers";
import { axiosInstance } from "../../../utils/url/config";
import { downloadCostSheetExcel, downloadJobSheetExcel, getFileName } from "../../../utils/helper/excelExportHelper";

const AccountsViewModel = ({ order, onClose }) => {
  const [openAttachments, setOpenAttachments] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [bomData, setBomData] = useState(null);
  const [loadingBom, setLoadingBom] = useState(false);

  useEffect(() => {
    const bomId = order.bom_nanoid || order.bom_id;
    if (bomId) {
      setLoadingBom(true);
      axiosInstance
        .get(`/bom/${bomId}`)
        .then((res) => {
          setBomData(res.data?.data || null);
        })
        .catch((err) => {
          console.error("Error fetching BOM for excel export:", err);
        })
        .finally(() => {
          setLoadingBom(false);
        });
    }
  }, [order.bom_nanoid, order.bom_id]);

  const handleOpenFiles = (files) => {
    setSelectedAttachments(files);
    setOpenAttachments(true);
  };

  const handleCloseFiles = () => {
    setOpenAttachments(false);
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
            {order.Pi_files?.length > 0 && (
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                Rework PI
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
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)] p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">

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

          {/* BILLING INFORMATION */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">
              Billing Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Street Address" value={order.billing_address_1} />
              <InfoRow label="Street Line 2" value={order.billing_address_2} />
              <InfoRow label="City" value={order.billing_city} />
              <InfoRow label="State" value={order.billing_state} />
              <InfoRow label="Pincode" value={order.billing_postal_code} />
              <InfoRow label="GST No" value={order.billing_gst_no} />
            </div>
          </div>

          {/* Quotation & BOM Downloads */}
          {(order.quatation_files?.length > 0 || order.bom_nanoid || order.bom_id) && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <i className="fa-solid fa-file-invoice-dollar text-blue-600"></i>
                <span>Quotation & Job Sheets</span>
              </h3>

              <div className="space-y-4">
                {/* PDF Quotation File */}
                {order.quatation_files?.length > 0 && (
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-file-pdf text-red-500 text-lg"></i>
                      <span className="text-gray-700 font-medium text-sm truncate max-w-[200px] sm:max-w-md">
                        {getFileName(order.quatation_files[order.quatation_files.length - 1])}
                      </span>
                    </div>
                    <IconButton
                      onClick={() => window.open(order.quatation_files[order.quatation_files.length - 1], "_blank")}
                      title="View Quotation PDF"
                      className="hover:scale-110 transition-transform duration-200"
                    >
                      <VisibilityIcon className="text-blue-600" />
                    </IconButton>
                  </div>
                )}

                {/* Excel Download Section */}
                {(order.bom_nanoid || order.bom_id) && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Document Exports (Excel)</p>

                    {loadingBom ? (
                      <div className="flex items-center space-x-2 text-gray-500 text-sm py-2">
                        <i className="fa-solid fa-spinner fa-spin text-blue-600"></i>
                        <span>Loading sheet details...</span>
                      </div>
                    ) : bomData ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Download Job Sheet */}
                        <button
                          onClick={() => downloadJobSheetExcel(bomData)}
                          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                          className="flex items-center justify-center space-x-2 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <i className="fa-solid fa-file-excel text-lg"></i>
                          <span>Download Job Sheet</span>
                        </button>

                        {/* Download Cost Sheet */}
                        <button
                          onClick={() => downloadCostSheetExcel(bomData)}
                          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
                          className="flex items-center justify-center space-x-2 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <i className="fa-solid fa-file-invoice text-lg"></i>
                          <span>Download Cost Sheet</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-red-500">Failed to load Excel data. Please try again.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PI FILES */}
          {order.Pi_files?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-600">
                  PI Files
                </h3>
              </div>

              <div className="space-y-3">
                {order.Pi_files.map((file, idx) => (
                  <div key={idx} className="flex justify-between border border-gray-200 p-2 rounded">
                    <span className="text-gray-700">{getFileName(file)}</span>
                    <IconButton
                      onClick={() => window.open(file, "_blank")}
                    >
                      <VisibilityIcon className="text-blue-600" />
                    </IconButton>
                  </div>
                ))}
              </div>

              {order.is_pi_verified_remarks && (
                <p className="mt-2 text-gray-700 italic">
                  PI Remarks: {order.is_pi_verified_remarks}
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

export default AccountsViewModel;
