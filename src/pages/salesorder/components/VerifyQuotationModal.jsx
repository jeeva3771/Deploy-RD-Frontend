import React, { useState } from "react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {
  fetchAllSampleOrders,
  updateSampleOrderById,
} from "../../../reducer/sampleSalesorderReducer";
import ShareIcon from "@mui/icons-material/Share";
import QuotationShareModal from "./QuotationShareModel";

const VerifyQuotationModal = ({
  isOpen,
  onClose,
  QuotationFiles = [],
  sampleOrderId,
  samplePagination,
  onVerified,
  onRework,
  sampleOrders,
  sampleSalesCountRefresh,
}) => {
  const [remarks, setRemarks] = useState("");
  const [showRemarks, setShowRemarks] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const [shareModalOpen, setShareModalOpen] = useState(false);

  // console.log("sampleOrders verify page",sampleOrders)

  if (!isOpen) return null;

  // const getFileName = (url) => {
  //   if (!url) return "";
  //   const withoutParams = url.split("?")[0];
  //   const parts = withoutParams.split("---");
  //   return parts[parts.length - 1];
  // };
  //     const getFileName = (url) => {
  //   if (!url) return "";
  //   const withoutParams = url.split("?")[0];
  //   let fileName = withoutParams.split("---").pop();
  //   fileName = decodeURIComponent(fileName);
  //   fileName = fileName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9.]/g, '');
  //   return fileName;
  // };
  const getFileName = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let name = withoutParams.split("---").pop();
    return decodeURIComponent(name);
  };

  const handleVerified = async () => {
    setLoading(true);
    try {
      await dispatch(
        updateSampleOrderById({
          id: sampleOrderId,
          formData: { is_bom_verified: true, is_bom_verified_remarks: "" },
        }),
      ).unwrap();

      toast.success("Quotation verified successfully!");
      onClose();
      sampleSalesCountRefresh();

      if (onVerified) onVerified();
    } catch (err) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRework = async () => {
    if (!remarks.trim()) {
      toast.error("Please provide remarks for rework.");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        updateSampleOrderById({
          id: sampleOrderId,
          formData: {
            is_bom_verified: false,
            is_bom_verified_remarks: remarks,
            is_bom_rework: false,
          },
        }),
      ).unwrap();

      toast.success("Rework submitted successfully!");
      onClose();
      setRemarks("");
      setShowRemarks(false);
      sampleSalesCountRefresh();

      // Refresh sample orders
      if (onRework) onRework();
    } catch (err) {
      // toast.error(err?.message || "Rework submission failed");
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
                    sampleorder={sampleOrders}
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

            {!showRemarks && (
              <button
                onClick={() => setShowRemarks(true)}
                className="px-5 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors duration-200"
              >
                Rework
              </button>
            )}

            <button
              onClick={showRemarks ? handleRework : handleVerified}
              className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              disabled={loading}
            >
              {showRemarks ? "Submit Rework" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyQuotationModal;
