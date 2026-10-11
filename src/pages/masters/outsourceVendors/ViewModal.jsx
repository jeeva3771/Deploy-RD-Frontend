import React from "react";
import BusinessIcon from "@mui/icons-material/Business";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import InfoIcon from "@mui/icons-material/Info";
import EngineeringIcon from "@mui/icons-material/Engineering";

const ViewModal = ({ viewModalData, onClose }) => {
  if (!viewModalData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Content section */}
        <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Main Vendor Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 mb-8 pb-6 border-b border-gray-100">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold shadow-inner flex-shrink-0">
              {viewModalData.name ? viewModalData.name.charAt(0).toUpperCase() : "V"}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-gray-800 capitalize mb-2">
                {viewModalData.name}
              </h3>
              <div className="flex gap-2 justify-center md:justify-start">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${viewModalData.is_active
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`h-2 w-2 rounded-full ${viewModalData.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                    ></span>
                    {viewModalData.is_active ? "Active Vendor" : "Inactive Vendor"}
                  </span>
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full shadow-sm bg-blue-50 text-blue-700 border border-blue-100 capitalize flex items-center gap-1">
                  <EngineeringIcon fontSize="small" style={{ fontSize: '14px' }} />
                  {Array.isArray(viewModalData.process_type)
                    ? (viewModalData.process_type.length > 0 ? viewModalData.process_type.map((p) => p.name).join(", ") : "No Process Assigned")
                    : (viewModalData.process_type?.name || "No Process Assigned")}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="z-10 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Contact Information */}
            <div className="space-y-5">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Contact Information
              </h4>

              <div className="flex items-start">
                <div className="mt-0.5 bg-indigo-50 p-1.5 rounded text-indigo-600 mr-3">
                  <EmailIcon fontSize="small" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Email Address</p>
                  <p className="text-base text-gray-800 break-all">{viewModalData.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-0.5 bg-green-50 p-1.5 rounded text-green-600 mr-3">
                  <PhoneIcon fontSize="small" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">WhatsApp Number</p>
                  <p className="text-base text-gray-800">{viewModalData.whatsapp_no || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-5">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Additional Information
              </h4>

              <div className="flex items-start">
                <div className="mt-0.5 bg-purple-50 p-1.5 rounded text-purple-600 mr-3">
                  <InfoIcon fontSize="small" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">System ID</p>
                  <p className="text-base text-gray-800 font-mono text-sm bg-gray-50 px-2 py-0.5 rounded border border-gray-100 inline-block uppercase">
                    {viewModalData.id || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-0.5 bg-blue-50 p-1.5 rounded text-blue-600 mr-3">
                  <BusinessIcon fontSize="small" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Vendor Category</p>
                  <p className="text-base text-gray-800">
                    {viewModalData.has_gst ? (
                      <span className="font-medium text-blue-700">Registered Vendor</span>
                    ) : (
                      <span className="font-medium text-orange-600">Labour (No GST)</span>
                    )}
                  </p>
                </div>
              </div>

              {viewModalData.has_gst && (
                <div className="flex items-start">
                  <div className="mt-0.5 bg-teal-50 p-1.5 rounded text-teal-600 mr-3">
                    <InfoIcon fontSize="small" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-0.5">GST Number</p>
                    <p className="text-base text-gray-800 uppercase font-mono bg-gray-50 px-2 rounded border border-gray-100 inline-block">
                      {viewModalData.gst_no || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <div className="mt-0.5 bg-orange-50 p-1.5 rounded text-orange-600 mr-3">
                  <BusinessIcon fontSize="small" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Address</p>
                  <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {viewModalData.address || <span className="italic text-gray-400">No address provided</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
