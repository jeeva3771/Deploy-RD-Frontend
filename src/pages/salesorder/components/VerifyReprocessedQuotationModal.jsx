import React, { useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../utils/url/config";
import ShareIcon from "@mui/icons-material/Share";
import QuotationShareModal from "./QuotationShareModel";
import { useAuthData } from "../../../utils/hooks/useAuthData";

const VerifyReprocessedQuotationModal = ({
  isOpen,
  onClose,
  sampleOrder,
  onVerified,
  onRework,
}) => {
  const { AdminRole } = useAuthData();
  const [remarks, setRemarks] = useState("");
  const [showRemarks, setShowRemarks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // console.log(sampleOrder.qty_update, 'sampleOrder');

  if (!isOpen || !sampleOrder) return null;

  const qtyUpdate = sampleOrder.qty_update || {};
  const recalcData = qtyUpdate.recalculated_data || {};

  const filesList = [];
  
  // 1. Quotation PDF
  const qPdf = recalcData.quotation_pdf;
  if (qPdf) {
    if (Array.isArray(qPdf)) filesList.push(...qPdf);
    else filesList.push(qPdf);
  }

  // 2. Job Sheet PDF
  const jsPdf = recalcData.job_sheet_pdf;
  if (jsPdf) {
    if (Array.isArray(jsPdf)) filesList.push(...jsPdf);
    else filesList.push(jsPdf);
  }

  // 3. Cost Sheet PDF
  const csPdf = recalcData.cost_sheet_pdf;
  if (csPdf) {
    if (Array.isArray(csPdf)) filesList.push(...csPdf);
    else filesList.push(csPdf);
  }

  const QuotationFiles = filesList.filter(Boolean);

  const getFileName = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let name = withoutParams.split("---").pop();
    return decodeURIComponent(name);
  };

  const handleAction = async (actionType) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bom/approve-qty-update/${sampleOrder.bom_nanoid}`,
        {
          role: "admin",
          action: actionType, // "approve" or "reject"
          remarks: actionType === "reject" ? remarks : undefined,
        }
      );

      if (response.data.success) {
        toast.success(
          actionType === "approve"
            ? "Reprocessed quantity update approved successfully!"
            : "Reprocessed quantity update rejected and reset."
        );
        onClose();
        setRemarks("");
        setShowRemarks(false);
        if (actionType === "approve" && onVerified) onVerified();
        if (actionType === "reject" && onRework) onRework();
      } else {
        toast.error(response.data.message || "Operation failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-11/12 sm:w-3/4 md:w-1/2 p-6 relative animate-fadeIn">
        <h2 className="text-2xl font-bold mb-5 text-gray-900 dark:text-gray-100">
          Verify Quotation Files
        </h2>

        {QuotationFiles.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-thumb-rounded-full">
            {QuotationFiles.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <p className="text-gray-800 dark:text-gray-200 font-medium truncate">
                  {getFileName(file)}
                </p>

                {shareModalOpen && (
                  <QuotationShareModal
                    sampleorder={sampleOrder}
                    type="reprocessed"
                    onClose={() => setShareModalOpen(false)}
                  />
                )}

                <button
                  onClick={() => window.open(file, "_blank")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-800 dark:hover:text-blue-500 transition-colors duration-200 underline"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-10">
            No Quotation files available.
          </p>
        )}

        {showRemarks && (
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks for rework..."
            className="w-full mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
        )}

        <div className="flex justify-between mt-6 gap-3">
          <div>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              onClick={() => setShareModalOpen(true)}
            >
              <ShareIcon fontSize="small" />
              <span className="ml-1">Share</span>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Close
            </button>

            {AdminRole && !showRemarks && (
              <button
                onClick={() => setShowRemarks(true)}
                className="px-5 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors duration-200"
              >
                Rework
              </button>
            )}

            {AdminRole && (
              <button
                onClick={
                  showRemarks
                    ? () => handleAction("reject")
                    : qtyUpdate.is_admin_approved
                    ? null
                    : () => handleAction("approve")
                }
                className={`px-5 py-2 font-medium rounded-lg transition-colors duration-200 ${
                  qtyUpdate.is_admin_approved && !showRemarks
                    ? "bg-gray-400 dark:bg-gray-700 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={loading || (qtyUpdate.is_admin_approved && !showRemarks)}
              >
                {showRemarks
                  ? "Submit Rework"
                  : qtyUpdate.is_admin_approved
                  ? "Admin Approved"
                  : "Admin Approve"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyReprocessedQuotationModal;
