import React, { useEffect, useState } from "react";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Layers,
  UserCheck,
  Image as ImageIcon,
  AlertCircle,
  Share2,
  Clock,
} from "lucide-react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import { useLoader } from "../../../context/LoaderContext";
import { useDispatch } from "react-redux";
import {
  sendEnquiryMail,
  sendEnquiryWhatsAppTemplate,
} from "../../../reducer/enquiryReducer";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { toDate } from "../../../utils/dateUtils";
import Pagination from "../../components/Pagination";

const SalesSampleApproval = () => {
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approveModalItem, setApproveModalItem] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [selectNumberModal, setSelectNumberModal] = useState(false);
  const [customNumberModal, setCustomNumberModal] = useState(false);
  const [customPhone, setCustomPhone] = useState("");
  const [selectEmailModal, setSelectEmailModal] = useState(false);
  const [customEmailModal, setCustomEmailModal] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [dueTodayFilter, setDueTodayFilter] = useState(false);

  const handleWhatsAppClick = (item) => {
    const rawNum = item.wp_number || item.phone_number || item.mobile;
    const nums = Array.isArray(rawNum)
      ? rawNum.filter(Boolean)
      : rawNum
        ? [rawNum]
        : [];

    if (nums.length === 0) {
      setCustomPhone("");
      setCustomNumberModal(true);
      return;
    }

    if (nums.length > 1) {
      setSelectNumberModal(true);
    } else {
      handleWhatsApp(item, nums[0]);
    }
  };

  async function handleWhatsApp(item, number) {
    if (!number) {
      toast.error("Phone number is required to send WhatsApp message");
      return;
    }

    const expiryTimestamp = Date.now() + 24 * 60 * 60 * 1000;
    const encodedExpiry = btoa(expiryTimestamp.toString());
    const currentDomain = window.location.origin;

    const enquiryId =
      item.enquiry_id?.id || item.enquiry_id?._id || item.enquiry_id;
    const salesOrderId =
      item.sales_order_id?.id ||
      item.sales_order_id?._id ||
      item.sales_order_id;

    const link =
      enquiryId && salesOrderId
        ? `${currentDomain}/rd/clientconfirmation/${enquiryId}/${salesOrderId}/?v=1&exp=${encodedExpiry}`
        : `${currentDomain}/rd/clientconfirmation/${enquiryId || item.job_no}?v=1&exp=${encodedExpiry}`;

    const expiryDate = new Date(expiryTimestamp).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const jobRef = item.sub_job_no || item.job_no || "N/A";
    const clientName = capitalizeFirst(item.client_name) || "Customer";
    const productName = capitalizeFirst(item.product_name) || "N/A";

    const values = {
      1: `Sample Trophy – Sub Job No: ${jobRef}`,
      2: clientName,
      3: productName,
      4: link,
      5: expiryDate,
    };

    showLoader();
    try {
      const result = await dispatch(
        sendEnquiryWhatsAppTemplate({
          phone_number: number,
          values: values,
        }),
      );

      if (result.payload?.success) {
        toast.success("WhatsApp message sent successfully!");
        setShareModalItem(null);
        setSelectNumberModal(false);
        setCustomNumberModal(false);
      } else {
        toast.error(
          result.payload?.message || "Failed to send WhatsApp message",
        );
      }
    } catch (error) {
      toast.error(error.message || "Server error while sending WhatsApp");
    } finally {
      hideLoader();
    }
  }

  const handleEmailClick = (item) => {
    const rawEmail = item.email;
    const emails = Array.isArray(rawEmail)
      ? rawEmail.filter(Boolean)
      : rawEmail
        ? [rawEmail]
        : [];

    if (emails.length === 0) {
      setCustomEmail("");
      setCustomEmailModal(true);
      return;
    }

    if (emails.length > 1) {
      setSelectEmailModal(true);
    } else {
      handleSendEmail(item, emails[0]);
    }
  };

  async function handleSendEmail(item, email) {
    if (!email) {
      toast.error("Email address is required to send sample approval email");
      return;
    }

    showLoader();
    try {
      const payload = {
        shopfloor_job_id: item.shopfloor_job_id,
        group_id: item.group_id,
        sub_job_no: item.sub_job_no,
        job_no: item.job_no,
        enquiry_id:
          item.enquiry_id?.id || item.enquiry_id?._id || item.enquiry_id,
        sales_order_id:
          item.sales_order_id?.id ||
          item.sales_order_id?._id ||
          item.sales_order_id,
        recipient_email: email,
        final_sample_image: item.final_sample_image,
        client_name: item.client_name,
        product_name: item.product_name,
        all_processes: item.all_processes,
      };

      const res = await axiosInstance.post(
        "/shop-floor/process-flow/send-sample-email",
        payload,
      );
      if (res.data?.success) {
        toast.success("Sample Approval Email sent successfully!");
        setShareModalItem(null);
        setSelectEmailModal(false);
        setCustomEmailModal(false);
      } else {
        toast.error(
          res.data?.message || "Failed to send sample approval email",
        );
      }
    } catch (err) {
      console.error("Send sample email error:", err);
      toast.error(
        err.response?.data?.message || "Failed to send sample approval email",
      );
    } finally {
      hideLoader();
    }
  }

  const fetchSalesQueue = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        "/shop-floor/process-flow/sales-sample-queue",
      );
      if (res.data?.success) {
        setQueue(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch sales sample queue error:", err);
      toast.error("Failed to fetch pending sample approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesQueue();
  }, []);

  const handleAction = async (item, action, reason = "") => {
    setSubmitting(true);
    try {
      const payload = {
        shopfloor_job_id: item.shopfloor_job_id,
        group_id: item.group_id,
        sub_job_no: item.sub_job_no,
        action,
        action_by_name: "Sales Representative",
        reject_reason: reason,
      };

      const res = await axiosInstance.post(
        "/shop-floor/process-flow/process-action",
        payload,
      );
      if (res.data?.success) {
        toast.success(
          action === "approve"
            ? "Sample Approved! Primary Cycles unlocked on Shop Floor."
            : "Sample Rejected. Operator notified to re-run sample.",
        );
        setRejectModalOpen(false);
        setRejectReason("");
        setSelectedItem(null);
        fetchSalesQueue();
      } else {
        toast.error(res.data?.message || "Failed to process sample action");
      }
    } catch (err) {
      console.error("Process sample action error:", err);
      toast.error("Error processing sample action");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if a job item is due today
  const isItemDueToday = (item) => {
    const targetDate =
      item.delivery_date ||
      item.due_date ||
      item.submitted_at ||
      item.createdAt;
    if (!targetDate) return false;
    const d = toDate(targetDate);
    if (!d) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const dueTodayCount = queue.filter(isItemDueToday).length;

  // Search and Due Today filter for job_no, sub_job_no, reference_no, client_name, product_name
  const filteredQueue = queue.filter((item) => {
    if (dueTodayFilter && !isItemDueToday(item)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const jobNo = (item.job_no || "").toLowerCase();
    const subJobNo = (item.sub_job_no || "").toLowerCase();
    const refNo = (
      item.reference_no ||
      item.reference_number ||
      item.ref_no ||
      item.enquiry_id?.reference_no ||
      item.enquiry_id?.reference_number ||
      ""
    ).toLowerCase();
    const clientName = (item.client_name || "").toLowerCase();
    const productName = (item.product_name || "").toLowerCase();

    return (
      jobNo.includes(q) ||
      subJobNo.includes(q) ||
      refNo.includes(q) ||
      clientName.includes(q) ||
      productName.includes(q)
    );
  });

  // Sort queue: unapproved jobs (Awaiting Sales Approval) first, then by date
  const getStatusPriority = (item) => {
    if (item.bom_sample_status === "APPROVED_BY_SALES") return 3;
    if (
      item.bom_sample_status === "REJECTED_BY_SALES" ||
      item.bom_sample_status === "SAMPLE_REJECTED_INTERNAL"
    )
      return 2;
    return 1; // Unapproved (Awaiting Sales Approval) comes first!
  };

  const sortedQueue = [...filteredQueue].sort((a, b) => {
    const prioA = getStatusPriority(a);
    const prioB = getStatusPriority(b);
    if (prioA !== prioB) return prioA - prioB;
    return (
      new Date(b.submitted_at || b.createdAt || 0) -
      new Date(a.submitted_at || a.createdAt || 0)
    );
  });

  const totalCount = sortedQueue.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQueue = sortedQueue.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Top Header Title */}
      <h2 className="text-2xl font-bold mb-4 px-1 text-slate-900">
        Sales Sample Approval Jobs
      </h2>

      {/* Search Bar Container - Matching Accounts PI List style */}
      <div className="bg-white p-4 shadow-sm mb-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by job no, sub job no, reference no, client..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs text-slate-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-end">
          {/* Due Today Toggle Button */}
          <button
            onClick={() => {
              setDueTodayFilter(!dueTodayFilter);
              setCurrentPage(1);
            }}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              dueTodayFilter
                ? "bg-amber-500 text-white border-amber-600 font-bold shadow-sm"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
            title="Filter jobs due today"
          >
            <span className={dueTodayFilter ? "animate-pulse" : ""}>📅</span>{" "}
            Due Today
            {dueTodayCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  dueTodayFilter
                    ? "bg-white text-amber-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {dueTodayCount}
              </span>
            )}
          </button>

          {/* <button
            onClick={fetchSalesQueue}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-300 cursor-pointer shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`}
            />
            Refresh Queue
          </button> */}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm gap-3">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Loading pending sample approvals...
          </p>
        </div>
      ) : sortedQueue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm text-center p-8">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 border border-emerald-200">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No Pending Sample Approvals
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            All finished assembled samples have been processed. New sample
            approvals will appear here as soon as assembly operators complete
            them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {paginatedQueue.map((item) => {
            const isApproved = item.bom_sample_status === "APPROVED_BY_SALES";
            const isRejected =
              item.bom_sample_status === "REJECTED_BY_SALES" ||
              item.bom_sample_status === "SAMPLE_REJECTED_INTERNAL";

            const approvalDetails = item.sales_approval_details;
            const actionUser =
              approvalDetails?.approved_by_name || "Sales Representative";
            const actionDate = approvalDetails?.action_at
              ? new Date(approvalDetails.action_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : item.submitted_at
                ? new Date(item.submitted_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "";
            const rejectReason =
              approvalDetails?.reject_reason || "Rework requested";

            return (
              <div
                key={item._id}
                className={`bg-white border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  isApproved
                    ? "border-emerald-300 ring-2 ring-emerald-400/20"
                    : isRejected
                      ? "border-rose-300 ring-2 ring-rose-400/20"
                      : "border-slate-200 hover:border-purple-300"
                }`}
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    {isApproved ? (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        ✓ Approved
                      </span>
                    ) : isRejected ? (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        ✕ Rejected / Rework
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Awaiting Sales Approval
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Job Info */}
                  <div className="mb-2.5">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block truncate">
                      {item.client_name}
                    </span>
                    <h2
                      className="text-sm font-bold text-slate-900 tracking-tight mt-0.5 truncate"
                      title={`${item.job_no} (${item.sub_job_no})`}
                    >
                      {item.job_no}{" "}
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({item.sub_job_no})
                      </span>
                    </h2>
                    <p
                      className="text-[11px] text-slate-600 font-medium mt-0.5 line-clamp-1"
                      title={item.product_name}
                    >
                      {item.product_name}
                    </p>
                  </div>

                  {/* Final Sample Image Container - Fully covered with object-cover & click preview */}
                  <div
                    onClick={() =>
                      item.final_sample_image &&
                      setImagePreviewUrl(item.final_sample_image)
                    }
                    className="relative group bg-slate-100 border border-slate-200 rounded-lg overflow-hidden mb-2.5 h-36 flex items-center justify-center cursor-pointer"
                  >
                    {item.final_sample_image ? (
                      <>
                        <img
                          src={item.final_sample_image}
                          alt="Final Assembled Sample"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                        />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-bold text-[11px] transition-opacity duration-200 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> Preview Image
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 p-4 text-center">
                        <div className="p-2 bg-white/80 rounded-full shadow-2xs border border-slate-200">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          No Image Uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Audit Info Box: Who Approved / Rejected / Awaiting Review */}
                  {isApproved && (
                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 mb-2.5 text-[11px] text-emerald-900">
                      <div className="font-bold flex items-center gap-1 text-emerald-800 text-[11px]">
                        <CheckCircle className="w-3 h-3" />
                        <span>Sample Approved</span>
                      </div>
                      <div className="mt-0.5 text-[10px] space-y-0.5 text-emerald-700">
                        <div>
                          <strong>Approved By:</strong> {actionUser}
                        </div>
                        {actionDate && (
                          <div>
                            <strong>Approved On:</strong> {actionDate}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="w-full bg-rose-50 border border-rose-200 rounded-lg p-2 mb-2.5 text-[11px] text-rose-900">
                      <div className="font-bold flex items-center gap-1 text-rose-800 text-[11px]">
                        <XCircle className="w-3 h-3" />
                        <span>Rework Requested</span>
                      </div>
                      <div className="mt-0.5 text-[10px] space-y-0.5 text-rose-700">
                        <div>
                          <strong>Rejected By:</strong> {actionUser}
                        </div>
                        {actionDate && (
                          <div>
                            <strong>Date:</strong> {actionDate}
                          </div>
                        )}
                        <div className="mt-1 text-rose-900 bg-white/80 p-1.5 rounded-md border border-rose-200 text-[10px]">
                          <strong>Reason:</strong> {rejectReason}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isApproved && !isRejected && (
                    <div className="w-full bg-amber-50/80 border border-amber-200 rounded-lg p-2 mb-2.5 text-[11px] text-amber-900">
                      <div className="font-bold flex items-center gap-1 text-amber-800 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Awaiting Sales Review</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-700">
                        Sample assembly complete. Ready for Sales authorization.
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShareModalItem(item);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    <Share2 className="w-3 h-3 text-indigo-600" />
                    Share Sample Link with Client
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={submitting}
                      onClick={() => setApproveModalItem(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {isApproved ? "Re-Confirm" : "Approve"}
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => {
                        setSelectedItem(item);
                        setRejectModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95 text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      Reject / Rework
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Component */}
      {!loading && sortedQueue.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(newLimit) => {
              setItemsPerPage(newLimit);
              setCurrentPage(1);
            }}
            totalCount={totalCount}
            startIndex={startIndex}
            visibleItemCount={paginatedQueue.length}
          />
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 text-slate-800">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Sample Approval
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Job: {approveModalItem.job_no} ({approveModalItem.sub_job_no})
                </p>
              </div>
            </div>

            {approveModalItem.final_sample_image && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                <img
                  src={approveModalItem.final_sample_image}
                  alt="Sample Piece"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {approveModalItem.client_name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {approveModalItem.product_name}
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
              Are you sure you want to approve this sample piece for{" "}
              <strong className="text-emerald-700 font-bold">
                Main Production
              </strong>
              ? Primary cycles will be unlocked for operators across all
              shopfloor stages.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setApproveModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={async () => {
                  await handleAction(approveModalItem, "approve");
                  setApproveModalItem(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {submitting ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reject Sample Piece
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Job: {selectedItem.job_no} ({selectedItem.sub_job_no})
                </p>
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-700 mb-2">
              Reason for Rejection / Feedback for Operators:
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Color mismatch on UV print, acrylic base alignment defective, polish required..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason("");
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !rejectReason.trim()}
                onClick={() =>
                  handleAction(selectedItem, "reject", rejectReason)
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 cursor-pointer shadow-sm"
              >
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Lightbox */}
      {imagePreviewUrl && (
        <div
          onClick={() => setImagePreviewUrl(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={imagePreviewUrl}
            alt="Final Assembled Sample Full View"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
          />
        </div>
      )}

      {/* Share Sample Trophy Modal — Exactly matching Enquiry Share Modal */}
      {shareModalItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShareModalItem(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Share Sample Trophy</h2>
            <button
              className="flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
              onClick={() => handleWhatsAppClick(shareModalItem)}
            >
              <WhatsAppIcon />
              WhatsApp
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
              onClick={() => handleEmailClick(shareModalItem)}
            >
              <EmailIcon />
              Mail
            </button>
            <button
              className="mt-2 text-sm text-gray-500 hover:underline cursor-pointer"
              onClick={() => setShareModalItem(null)}
            >
              Cancel
            </button>
          </div>

          {/* Modal to select WhatsApp number */}
          {selectNumberModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setSelectNumberModal(false)}
            >
              <div
                className="bg-white rounded-lg p-6 w-72 shadow-lg flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-md font-semibold mb-2">
                  Select WhatsApp Number
                </h3>
                {(Array.isArray(
                  shareModalItem.wp_number || shareModalItem.phone_number,
                )
                  ? shareModalItem.wp_number || shareModalItem.phone_number
                  : [shareModalItem.wp_number || shareModalItem.phone_number]
                ).map((num, idx) => (
                  <button
                    key={idx}
                    className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    onClick={(e) => {
                      e.currentTarget.disabled = true;
                      handleWhatsApp(shareModalItem, num);
                      setSelectNumberModal(false);
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="mt-2 text-sm text-gray-500 hover:underline cursor-pointer"
                  onClick={() => setSelectNumberModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Modal to input custom WhatsApp number */}
          {customNumberModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setCustomNumberModal(false)}
            >
              <div
                className="bg-white rounded-xl p-6 w-80 shadow-2xl flex flex-col gap-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-sm font-bold text-slate-800">
                  Send via WhatsApp (2Factor)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No mobile number was found for this job. Enter a 10-digit
                  mobile number to send the product confirmation update:
                </p>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={!customPhone.trim()}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-xs cursor-pointer shadow-xs transition-colors"
                    onClick={() => {
                      if (customPhone.trim()) {
                        handleWhatsApp(shareModalItem, customPhone.trim());
                      }
                    }}
                  >
                    Send Template
                  </button>
                  <button
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    onClick={() => setCustomNumberModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal to select Email address */}
          {selectEmailModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setSelectEmailModal(false)}
            >
              <div
                className="bg-white rounded-xl p-6 w-80 shadow-2xl flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-md font-bold text-slate-800">
                  Select Recipient Email
                </h3>
                <div className="flex flex-col gap-2">
                  {(Array.isArray(shareModalItem.email)
                    ? shareModalItem.email.filter(Boolean)
                    : [shareModalItem.email]
                  ).map((em, idx) => (
                    <button
                      key={idx}
                      className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-lg transition border border-blue-200 cursor-pointer text-left truncate"
                      onClick={(e) => {
                        e.currentTarget.disabled = true;
                        handleSendEmail(shareModalItem, em);
                        setSelectEmailModal(false);
                      }}
                    >
                      ✉ {em}
                    </button>
                  ))}
                </div>
                <button
                  className="mt-1 text-xs text-gray-500 hover:underline cursor-pointer text-center"
                  onClick={() => setSelectEmailModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Modal to input custom Email address */}
          {customEmailModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setCustomEmailModal(false)}
            >
              <div
                className="bg-white rounded-xl p-6 w-80 shadow-2xl flex flex-col gap-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-sm font-bold text-slate-800">
                  Send Sample Approval via Email
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No email address was found for this job. Enter a recipient
                  email address to send the sample piece approval:
                </p>
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={!customEmail.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-xs cursor-pointer shadow-xs transition-colors"
                    onClick={() => {
                      if (customEmail.trim()) {
                        handleSendEmail(shareModalItem, customEmail.trim());
                      }
                    }}
                  >
                    Send Email
                  </button>
                  <button
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    onClick={() => setCustomEmailModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesSampleApproval;
