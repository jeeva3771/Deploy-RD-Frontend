import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { backendUrl, axiosInstance } from "../../utils/url/config";
import { useLoader } from "../../context/LoaderContext";
import { toast } from "react-toastify";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, Typography, Paper } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { getFileNamev2 } from "../../utils/helper/FilenameURL";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import { useDispatch } from "react-redux";
import { updateSampleOrderById, updateSampleOrderByIdClientscreen } from "../../reducer/sampleSalesorderReducer";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";


const ClientConfirmation = () => {
  const { id } = useParams();
  const { salesid } = useParams();
  const { dtpid } = useParams();

  const { showLoader, hideLoader } = useLoader();

  const [enquiry, setEnquiry] = useState(null);
  const [images, setImages] = useState([]);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [actionType, setActionType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [expired, setExpired] = useState(false);
  const location = useLocation();
  const [loadingAction, setLoadingAction] = useState(null);

  const [additionalFiles, setAdditionalFiles] = useState([]);

  const scrollRef = useRef(null);

  const [quotationModal, setQuotationModal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [dtpConfirmModal, setDtpConfirmModal] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [reprocessedModal, setReprocessedModal] = useState(null);
  const dispatch = useDispatch();
  const [sampleQueueItems, setSampleQueueItems] = useState([]);
  const [sampleActionLoading, setSampleActionLoading] = useState(false);
  const [sampleReworkModalItem, setSampleReworkModalItem] = useState(null);
  const [sampleReworkReason, setSampleReworkReason] = useState("");
  const [sampleApproveModalItem, setSampleApproveModalItem] = useState(null);
  const [sampleApproveRemark, setSampleApproveRemark] = useState("");

  const fetchSampleQueue = useCallback(async () => {
    try {
      const url = enquiry?.job_no 
        ? `/shop-floor/process-flow/sales-sample-queue?job_no=${encodeURIComponent(enquiry.job_no)}`
        : "/shop-floor/process-flow/sales-sample-queue";
      const res = await axiosInstance.get(url);
      if (res.data?.success) {
        setSampleQueueItems(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch sample queue in client confirmation:", err);
    }
  }, [enquiry?.job_no]);

  useEffect(() => {
    fetchSampleQueue();
  }, [fetchSampleQueue]);

  const handleClientSampleAction = async (sampleItem, action, reason = "", remark = "") => {
    setSampleActionLoading(true);
    try {
      const payload = {
        shopfloor_job_id: sampleItem.shopfloor_job_id,
        group_id: sampleItem.group_id,
        sub_job_no: sampleItem.sub_job_no,
        action,
        action_by_name: "Client (Online Approval)",
        reject_reason: reason,
        approval_remark: remark
      };

      const res = await axiosInstance.post("/shop-floor/process-flow/process-action", payload);
      if (res.data?.success) {
        toast.success(action === "approve" ? "Sample Trophy Piece Approved for Main Production!" : "Sample Rework Feedback Submitted!");
        await fetchSampleQueue();
      } else {
        toast.error(res.data?.message || "Failed to submit approval action");
      }
    } catch (err) {
      console.error("Client sample action error:", err);
      toast.error("Error submitting sample action");
    } finally {
      setSampleActionLoading(false);
    }
  };


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [additionalFiles]);



  useEffect(() => {
    const handler = (e) => {
      if (e.key === "PrintScreen") {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "black";
        overlay.style.zIndex = 999999;
        document.body.appendChild(overlay);

        setTimeout(() => {
          overlay.remove();
        }, 300);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);


  // 🔒 Disable right click only on this page
  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Fetch enquiry with images
  const fetchClientAccess = useCallback(async () => {
    showLoader();
    try {
      let url = `${backendUrl}/enquiry/clientaccess/${id}?salesid=${salesid}`;
      // Note: If backend supports fetching by dtpid, we can add it here.
      // Currently the backend uses salesid to find the related DTP job. 
      // Based on previous work, salesid is sufficient to find the DTP job (via sample_order_id).
      // However, if the user explicitly wants dtpid in the URL, we might want to pass it to backend too if needed,
      // or just having it in the URL is enough for their tracking.
      // Let's pass it as a query param if it exists, in case backend needs it later.
      if (dtpid) {
        url += `&dtpid=${dtpid}`;
      }
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        const data = response.data.data;
        setEnquiry(data);
        setImages(data.images || []);
      } else {
        toast.error(response.data.message || "Unable to fetch details.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data.");
    } finally {
      hideLoader();
    }
  }, [id, salesid, dtpid, showLoader, hideLoader]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const encodedExpires = params.get("exp");

    if (!encodedExpires) {
      setExpired(true);
      return;
    }

    try {
      const expires = Number(atob(encodedExpires));
      if (Date.now() > expires) {
        setExpired(true);
        return;
      }
    } catch (err) {
      setExpired(true);
      return;
    }

    fetchClientAccess();
  }, [id, location.search, fetchClientAccess]);

  const handleFeedback = (image, type) => {
    setFeedbackModal(image);
    setActionType(type);
    setFeedbackText("");
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.warn("Please provide your feedback before submitting.");
      return;
    }

    setLoading(true);

    try {
      let payload;

      // For REWORK → Use FormData
      if (actionType === "rework") {
        payload = new FormData();
        payload.append("image_id", feedbackModal._id);
        payload.append("is_accepted", false);
        payload.append("feedback", feedbackText);
        payload.append("rework", true);

        additionalFiles.forEach((item) => {
          payload.append("additional_files", item.file);
        });

      }
      else {
        payload = {
          image_id: feedbackModal._id,
          is_accepted: actionType === "approve" ? true : false,
          feedback: feedbackText,
        };
      }

      const response = await axiosInstance.put(
        `${backendUrl}/enquiry/clientaccess/${id}?inside_images_id=${feedbackModal._id}`,
        payload,
        actionType === "rework"
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : {}
      );

      if (response.data.success) {
        toast.success("Feedback submitted successfully.");
        fetchClientAccess();
        // setFeedbackModal(null);
        closeFeedbackModal();
      } else {
        toast.error(response.data.message || "Failed to update status.");
      }

    } catch (error) {
      console.log(error);
      toast.error("Failed to update image status. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const allProcessed =
    images.length > 0 &&
    images.every((img) => img.is_accepted === true || img.is_accepted === false);

  const filteredSampleQueueItems = sampleQueueItems.filter((item) => {
    if (!enquiry?.job_no) return false;
    return String(item.job_no || '').trim().toLowerCase() === String(enquiry.job_no).trim().toLowerCase();
  });

  const allRejected = images.length > 0 && images.every((img) => img.is_accepted === false);

  const canProceedToStage =
    enquiry && !enquiry.to_sample && !enquiry.to_production && !allRejected;

  const stageStatus = enquiry
    ? enquiry.to_sample
      ? "Moved to Sample Stage"
      : enquiry.to_production
        ? "Moved to Production Stage"
        : null
    : null;

  const handleProceed = async (type) => {
    setLoadingAction(type);
    try {

      const payload = {
        image_id: feedbackModal._id,
        is_accepted: actionType === "approve" ? true : false,
        feedback: feedbackText,
      };

      if (type === "sample") {
        payload.image_to_sample = true;
      }
      if (type === "production") {
        payload.image_to_production = true;
      }

      const response = await axiosInstance.put(
        `${backendUrl}/enquiry/clientaccess/${id}?inside_images_id=${feedbackModal._id}`,
        payload
      );

      // const payload = {};
      // if (type === "sample") payload.to_sample = true;
      // if (type === "production") payload.to_production = true;

      // const response = await axiosInstance.put(`${backendUrl}/enquiry/clientaccess/${id}`, payload);

      if (response.data.success) {
        toast.success(
          `Successfully updated`
        );
        fetchClientAccess();
        setFeedbackModal(null);

      } else {
        toast.error(response.data.message || "Action failed.");
      }
    } catch (error) {
      toast.error("An error occurred while proceeding to the next stage.");
    } finally {
      setLoadingAction(null);
    }
  };

  const capitalizeFirst = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

  const getFileNamev2 = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let name = withoutParams.split("---").pop();
    return decodeURIComponent(name);
  };

  if (expired) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        bgcolor="#f9fafb"
        px={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: "center", borderRadius: 2 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" component="h2" gutterBottom>
            Link Expired
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            This link is no longer valid or has expired. Please request a new link to continue.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    const validImages = files.filter((file) => file.type.startsWith("image/"));
    if (validImages.length !== files.length) {
      toast.error("Only image files are allowed.");
      return;
    }

    const mapped = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(), // unique ID
    }));

    setAdditionalFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id) => {
    setAdditionalFiles((prev) => prev.filter((item) => item.id !== id));
  };

  function closeFeedbackModal() {
    setFeedbackModal(null);
    setAdditionalFiles([]);
    setFeedbackText("");
    setActionType(null);
  }


  const FileList = ({ title, files, type, enquiry }) => {
    if (!files || files.length === 0) return null;

    console.log("enquiry", enquiry)
    const isRework =
      type === "quotation"
        ? enquiry?.is_bom_verified === false && enquiry.is_bom_rework === false
        : type === "pi"
          ? enquiry?.is_pi_verified === false && enquiry.is_pi_rework === false
          : false;

    const isApproved =
      type === "quotation"
        ? enquiry?.is_bom_verified === true
        : type === "pi"
          ? enquiry?.is_pi_verified === true
          : false;

    console.log("isRework", isRework, "isApproved", isApproved)

    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {files.map((file, index) => {
            const isLast = index === files.length - 1;

            let statusLabel = "";
            let statusClass = "";

            if (isRework) {
              statusLabel = "Rejected";
              statusClass = "bg-red-100 text-red-700";
            } else if (isApproved && isLast) {
              statusLabel = "Approved";
              statusClass = "bg-green-100 text-green-700";
            }

            return (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-2 hover:bg-gray-100 transition"
              >
                <span className="text-sm text-gray-700 truncate max-w-[60%]">
                  {getFileNamev2(file)}
                </span>

                {statusLabel ? (
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                ) : (
                  isLast &&
                  !isApproved && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFileAction(file, "approve", type)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleFileAction(file, "rework", type)}
                        className="px-2 py-1 bg-teal-700 text-white rounded hover:bg-teal-800 text-xs cursor-pointer"
                      >
                        Rework
                      </button>
                    </div>
                  )
                )}

                <button
                  onClick={() => window.open(file, "_blank")}
                  className="text-blue-600 font-medium hover:underline text-sm flex items-center gap-1 cursor-pointer"
                >
                  <VisibilityIcon fontSize="small" /> View
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };



  const DtpFileList = ({ files, type, dtpId }) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {files.map((fileObj, index) => {
            const fileUrl = typeof fileObj === 'string' ? fileObj : fileObj?.file_url;
            const fileId = fileObj?._id; // Ensure backend returns _id
            const status = fileObj?.status || 'Pending'; // Default to Pending if not present

            if (!fileUrl) return null;

            let statusLabel = "";
            let statusClass = "";

            if (status === "Approved") {
              statusLabel = "Approved";
              statusClass = "bg-green-100 text-green-700";
            } else if (status === "Rejected") {
              statusLabel = "Rejected";
              statusClass = "bg-red-100 text-red-700";
            }

            return (
              <div
                key={fileId || index}
                className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {/* Icon placeholder or thumbnail */}
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]" title={getFileNamev2(fileUrl)}>
                    {getFileNamev2(fileUrl)}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {statusLabel ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  ) : (
                    // Only show buttons if Pending
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDtpAction(fileId, "Approved", type, dtpId)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDtpAction(fileId, "Rejected", type, dtpId)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => window.open(fileUrl, "_blank")}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <VisibilityIcon fontSize="small" /> <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  const handleQuotationAction = (file, type) => {
    setQuotationModal({ file, type });
    setRemarks("");
  };

  function handleFileAction(file, type, docType) {
    setQuotationModal({ file, type, docType }); // docType = "quotation" | "pi"
    setRemarks("");
  }


  /* DTP File Actions */

  function handleDtpAction(fileId, status, type, dtpIdParam) {
    // dtpIdParam can be passed from props or state.
    // If not passed, maybe we can derive it from URL or enquiry data if available?
    // In DtpFileList usage I passed dtpId.
    const finalDtpId = dtpIdParam || dtpid || enquiry?.dtp_id;
    if (!finalDtpId) {
      toast.error("Error: DTP ID is missing. Please refresh the page or contact support.");
      return;
    }
    setDtpConfirmModal({ fileId, status, type, dtpId: finalDtpId });
    setRemarks("");
    setReferenceFile(null);
  }

  const submitDtpAction = async () => {
    if (dtpConfirmModal.status === "Rejected" && !remarks.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setLoadingQuotation(true); // Reuse loading state or add new one

    try {
      const formData = new FormData();
      formData.append("dtp_file_update", "true");
      formData.append("dtp_id", dtpConfirmModal.dtpId);
      formData.append("file_id", dtpConfirmModal.fileId);
      formData.append("file_type", dtpConfirmModal.type);
      formData.append("status", dtpConfirmModal.status);
      formData.append("rejection_reason", remarks);

      if (referenceFile) {
        formData.append("rejection_reference_file", referenceFile);
      }

      const response = await axiosInstance.put(
        `${backendUrl}/enquiry/clientaccess/${id}`, // Using the client access endpoint
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        toast.success(`File ${dtpConfirmModal.status} successfully.`);
        fetchClientAccess(); // Refresh data
        setDtpConfirmModal(null);
        setRemarks("");
        setReferenceFile(null);
      } else {
        toast.error(response.data.message || "Update failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating status.");
    } finally {
      setLoadingQuotation(false);
    }
  };


  const submitQuotationAction = async () => {
    if (quotationModal.type === "rework" && !remarks.trim()) {
      toast.error("Please provide remarks for rework.");
      return;
    }

    setLoadingQuotation(true);

    try {
      let payload = {};

      if (quotationModal.docType === "quotation") {
        payload =
          quotationModal.type === "approve"
            ? { is_bom_verified: true, is_bom_verified_remarks: "" }
            : {
              is_bom_verified: false,
              is_bom_verified_remarks: remarks,
              is_bom_rework: false,
            };
      }

      if (quotationModal.docType === "pi") {
        payload =
          quotationModal.type === "approve"
            ? { is_pi_verified: true, is_pi_verified_remarks: "" }
            : {
              is_pi_verified: false,
              is_pi_verified_remarks: remarks,
              is_pi_rework: false,
            };
      }

      await dispatch(
        updateSampleOrderByIdClientscreen({
          csid: salesid,
          formData: payload,
        })
      ).unwrap();

      toast.success(
        quotationModal.type === "approve"
          ? "Verified successfully!"
          : "Rework submitted successfully!"
      );

      setQuotationModal(null);
      setRemarks("");
      fetchClientAccess();
    } catch (err) {
      toast.error(err?.message || "Request failed.");
    } finally {
      setLoadingQuotation(false);
    }
  };

  // Reprocessed Qty action handlers

  const handleReprocessedAction = (actionType) => {
    setReprocessedModal({ type: actionType });
    setRemarks("");
  };

  const submitReprocessedAction = async () => {
    if (reprocessedModal.type === "reject" && !remarks.trim()) {
      toast.error("Please provide a reason for rework/rejection.");
      return;
    }

    setLoadingQuotation(true);
    try {
      const payload = {
        is_reprocessed_approved: reprocessedModal.type === "approve" ? true : false,
        reprocessed_remarks: remarks,
      };

      await dispatch(
        updateSampleOrderByIdClientscreen({
          csid: salesid,
          formData: payload,
        })
      ).unwrap();

      toast.success(
        reprocessedModal.type === "approve"
          ? "Revised reprocessed quantity approved successfully!"
          : "Rework feedback submitted successfully!"
      );

      setReprocessedModal(null);
      setRemarks("");
      fetchClientAccess();
    } catch (err) {
      toast.error(err?.message || "Request failed.");
    } finally {
      setLoadingQuotation(false);
    }
  };



  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* HEADER */}
        <div className="text-center mb-10">
          <img src="/logo.svg" alt="RD Custom Awards" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Review – Client Portal</h1>
          <p className="text-lg text-gray-700">
            Job No: <span className="font-semibold text-gray-900">{enquiry?.job_no || "—"}{enquiry?.reference_no ? ` - ${enquiry?.reference_no}` : ""}</span>
          </p>
        </div>

        {enquiry && (
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Hello <span className="text-blue-600">{capitalizeFirst(enquiry.name)}</span>,
            </h2>
            <p className="text-lg text-gray-700 mt-2">
              Please review the details prepared for your product:{" "}
              <span className="font-medium text-gray-900">
                {capitalizeFirst(enquiry.product_name)}
              </span>
              .
            </p>
            <p className="text-gray-600 mt-2">
              Once you approve or provide feedback, we can proceed with the next stages.
            </p>
          </div>
        )}

        {!enquiry ? (
          <p className="text-center text-gray-500 py-20">Loading design images...</p>
        ) : images.length === 0 ? (
          <p className="text-center text-gray-500 py-20">No design images are available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {images
              .filter((img) => img.url && img.url.trim() !== "")
              .map((img, index) => {
                // let statusText = "Waiting for approval";
                // let statusColor = "text-orange-500";

                // if (img.is_accepted === true) {
                //   statusText = "Approved";
                //   statusColor = "text-green-600";
                // } else if (img.is_accepted === false) {
                //   statusText = "Rejected";
                //   statusColor = "text-red-600";
                // }

                let statusText = '';
                let statusColor = '';

                if (img.image_rework === true) {
                  statusText = "Rework";
                  statusColor = "text-sky-600";
                } else if (img.is_accepted === true) {
                  if (img.image_to_sample === true) {
                    statusText = "Sampling in Progress";
                    statusColor = "text-blue-500";
                  } else if (img.image_to_production === true) {
                    statusText = "Production in Progress";
                    statusColor = "text-yellow-500";
                  } else {
                    statusText = "Approved";
                    statusColor = "text-green-600";
                  }
                } else if (img.is_accepted === false) {
                  statusText = "Rejected";
                  statusColor = "text-red-600";
                }




                return (
                  <div
                    key={img._id}
                    className="border rounded-xl shadow-md hover:shadow-xl transition p-4 flex flex-col items-center bg-white relative"
                  >
                    {/* Zoom Icon → Open Modal */}
                    <button
                      onClick={() => setPreviewImage(img.url)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 transition cursor-pointer"
                    >
                      <ZoomInIcon className="text-gray-600" />
                    </button>

                    {/* Image → Open Modal */}
                    <img
                      src={img.url}
                      alt={img.designer_person || `Design ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg mb-4 border cursor-pointer"
                      onClick={() => setPreviewImage(img.url)}
                    />

                    {img.is_accepted === true || img.is_accepted === false ? (
                      <div className={`px-4 py-1 rounded-full text-sm font-semibold ${statusColor} mb-2`}>
                        {statusText}
                      </div>
                    ) : (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => handleFeedback(img, "approve")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer"
                        >
                          Ok
                        </button>
                        <button
                          onClick={() => handleFeedback(img, "reject")}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                        >
                          Reject
                        </button>

                        {!enquiry?.is_client_design && (
                          <button
                            onClick={() => handleFeedback(img, "rework")}
                            className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition cursor-pointer"
                          >
                            Rework
                          </button>

                        )}
                      </div>
                    )}

                    <p className="text-gray-500 text-xs mt-2 text-center">
                      {img.feedback || "No feedback provided yet."}
                    </p>
                  </div>
                );
              })}
          </div>
        )}



        {/* Sample Trophy Approval Modal */}
        {sampleApproveModalItem && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                Approve Sample Trophy Piece
              </h3>
              <p className="text-xs text-gray-500 mb-3 font-medium">
                Job: {sampleApproveModalItem.job_no} ({sampleApproveModalItem.sub_job_no}) — {sampleApproveModalItem.product_name}
              </p>
              <p className="text-xs text-gray-600 mb-3 font-medium">
                Are you sure you want to approve this sample piece for main production? You may optionally leave a remark below:
              </p>

              <textarea
                value={sampleApproveRemark}
                onChange={(e) => setSampleApproveRemark(e.target.value)}
                rows={3}
                placeholder="Enter remarks (optional)..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => {
                    setSampleApproveModalItem(null);
                    setSampleApproveRemark("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={sampleActionLoading}
                  onClick={async () => {
                    await handleClientSampleAction(sampleApproveModalItem, "approve", "", sampleApproveRemark || "No remarks");
                    setSampleApproveModalItem(null);
                    setSampleApproveRemark("");
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold text-sm disabled:opacity-50 cursor-pointer"
                >
                  {sampleActionLoading ? "Submitting..." : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sample Trophy Rework Modal */}
        {sampleReworkModalItem && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                Sample Trophy Rework Request
              </h3>
              <p className="text-xs text-gray-500 mb-4 font-medium">
                Job: {sampleReworkModalItem.job_no} ({sampleReworkModalItem.sub_job_no}) — {sampleReworkModalItem.product_name}
              </p>

              <textarea
                value={sampleReworkReason}
                onChange={(e) => setSampleReworkReason(e.target.value)}
                rows={4}
                placeholder="Please specify feedback or changes needed for this sample trophy..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => {
                    setSampleReworkModalItem(null);
                    setSampleReworkReason("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={sampleActionLoading || !sampleReworkReason.trim()}
                  onClick={async () => {
                    await handleClientSampleAction(sampleReworkModalItem, "reject", sampleReworkReason);
                    setSampleReworkModalItem(null);
                    setSampleReworkReason("");
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold text-sm disabled:opacity-50 cursor-pointer"
                >
                  {sampleActionLoading ? "Submitting..." : "Submit Rework"}
                </button>
              </div>
            </div>
          </div>
        )}



        {/* 
          {allProcessed && (
            <div className="mt-12 flex justify-center gap-6">
              {canProceedToStage ? (
                <>
                  <button
                    onClick={() => handleProceed("sample")}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Proceed to Sample Stage
                  </button>
                  <button
                    onClick={() => handleProceed("production")}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                  >
                    Proceed to Production Stage
                  </button>
                </>
              ) : allRejected ? (
                <div className="px-6 py-3 rounded-lg bg-red-100 text-red-700 font-semibold">
                  All images were rejected. Please contact Admin Executive.
                </div>
              ) : (
                <div className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold">
                  {stageStatus}
                </div>
              )}
            </div>
          )} */}

        {/* ⭐ Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-3xl w-[90%]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
              >
                ✕
              </button>

              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {/* Feedback Modal */}
        {feedbackModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {actionType === "approve"
                  ? "Approval Feedback"
                  : actionType === "reject"
                    ? "Rejection Feedback"
                    : "Rework Feedback"}
              </h3>

              {/* Upload Additional Files ONLY for Rework */}
              {actionType === "rework" && (
                <div className="mt-4">
                  <label className="block mb-2 font-medium text-gray-800">
                    Upload Additional Images (optional)
                  </label>

                  {/* Drop Zone */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center 
      hover:border-blue-400 transition cursor-pointer bg-gray-50"
                    onClick={() => document.getElementById("rework-files").click()}
                  >
                    <p className="text-gray-600 mb-2 font-medium">Drag & drop files here</p>
                    <p className="text-gray-500 text-sm">or click to browse</p>

                    <input
                      id="rework-files"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Selected File List */}
                  {additionalFiles.length > 0 && (
                    <>
                      <style>
                        {`
      .inline-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .inline-scroll::-webkit-scrollbar-track {
        background: #e5e7eb;
        border-radius: 10px;
      }
      .inline-scroll::-webkit-scrollbar-thumb {
        background: #6b7280;
        border-radius: 10px;
      }
      .inline-scroll::-webkit-scrollbar-thumb:hover {
        background: #4b5563;
      }
      .inline-scroll {
        scrollbar-width: thin;
        scrollbar-color: #6b7280 #e5e7eb;
      }
    `}
                      </style>

                      {additionalFiles.length > 0 && (
                        <div
                          ref={scrollRef}
                          className="
        inline-scroll
        mt-3 
        grid 
        grid-cols-2 
        sm:grid-cols-3 
        md:grid-cols-4 
        gap-3 
        max-h-48 
        overflow-y-auto 
        pr-2
      "
                        >
                          {additionalFiles.map((item) => (
                            <div
                              key={item.id}
                              className="relative w-full h-24 rounded overflow-hidden border"
                            >
                              <img
                                src={item.preview}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />

                              <button
                                onClick={() => removeFile(item.id)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>

                  )}




                </div>
              )}


              <div className="relative">
                {/* Watermark text */}
                {actionType === "approve" && !feedbackText && (
                  <div className="absolute top-3 left-3 pointer-events-none text-sm opacity-50">
                    Please enter your remarks if any. Else click on the NO REMARKS checkbox
                  </div>
                )}

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  placeholder={actionType !== "approve" ? "Please provide your feedback here..." : ""}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* No Remarks checkbox */}
              {actionType === "approve" && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="noRemarks"
                    checked={feedbackText === "NO REMARKS"}
                    onChange={(e) => setFeedbackText(e.target.checked ? "NO REMARKS" : "")}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <label htmlFor="noRemarks" className="text-gray-700 select-none">
                    No Remarks
                  </label>
                </div>
              )}

              {/* Proceed to Stage Buttons */}
              {actionType === "approve" && (
                <div className="mt-5 flex gap-6 justify-center">
                  <button
                    onClick={() => handleProceed("sample")}
                    className={`px-8 py-3 rounded-lg text-white font-semibold transition ${loadingAction === "sample" ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    disabled={!feedbackText.trim() || loadingAction !== null}
                  >
                    {loadingAction === "sample" ? "Processing..." : "Proceed to Sample"}
                  </button>
                  <button
                    onClick={() => handleProceed("production")}
                    className={`px-8 py-3 rounded-lg text-white font-semibold transition ${loadingAction === "production" ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    disabled={!feedbackText.trim() || loadingAction !== null}
                  >
                    {loadingAction === "production" ? "Processing..." : "Proceed to Production"}
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-5">
                <button
                  // onClick={() => setFeedbackModal(null)}
                  onClick={closeFeedbackModal}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                {actionType !== "approve" && (
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={loading}
                    className={`px-5 py-2 rounded-lg text-white font-semibold ${actionType === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                      } transition`}
                  >
                    {loading ? "Submitting..." : "Submit Feedback"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


        {enquiry && (
          <div className="mt-12">
            {/* Quotation Files Accordion */}
            {enquiry.quotation_files.length > 0 && (
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="quotation-content"
                  id="quotation-header"
                >
                  <Typography className="font-semibold">Quotation Files</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FileList
                    title=""
                    files={enquiry.quotation_files}
                    type="quotation"
                    enquiry={enquiry}
                  />
                </AccordionDetails>
              </Accordion>
            )}

            {/* PI Files Accordion */}
            {enquiry.PI_files.length > 0 && (
              <Accordion className="mt-4">
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="pi-content"
                  id="pi-header"
                >
                  <Typography className="font-semibold">Proforma Invoice (PI) Files</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FileList
                    title=""
                    files={enquiry.PI_files}
                    type="pi"
                    enquiry={enquiry}
                  />
                </AccordionDetails>
              </Accordion>
            )}

            {/* Revised Reprocessed Quotation Files Accordion */}
            {enquiry.is_qty_pending_approval && enquiry.reprocessed_quotation_file && (
              <Accordion className="mt-4 border border-indigo-200 shadow-sm rounded-xl overflow-hidden">
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="reprocessed-content"
                  id="reprocessed-header"
                  className="bg-indigo-50/20"
                >
                  <Typography className="font-semibold text-indigo-700 flex items-center gap-2">
                    Revised Reprocessed Quotation {enquiry.is_reprocessed_client_approved ? "(Approved)" : "(Pending Approval)"}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="p-5">
                  <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <DescriptionIcon className="text-indigo-600" />
                        {getFileNamev2(enquiry.reprocessed_quotation_file)}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {enquiry.is_reprocessed_client_approved
                          ? "The quantity revision request has been successfully approved by you. We are ready to proceed."
                          : "A quantity revision request is pending your confirmation. Review the revised quotation PDF below to proceed."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => window.open(enquiry.reprocessed_quotation_file, "_blank")}
                        className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold text-sm rounded-lg transition shadow-sm cursor-pointer flex-shrink-0"
                      >
                        View PDF
                      </button>

                      {enquiry.is_reprocessed_client_approved ? (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold flex items-center gap-1.5 flex-shrink-0">
                          Approved
                        </span>
                      ) : (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleReprocessedAction("reject")}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-semibold text-sm rounded-lg transition shadow-sm cursor-pointer flex-shrink-0"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReprocessedAction("approve")}
                            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-semibold text-sm rounded-lg transition shadow-sm cursor-pointer flex-shrink-0"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Master Template Files Accordion */}
            {enquiry.master_template_files && enquiry.master_template_files.length > 0 && (
              <Accordion className="mt-4">
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="master-content"
                  id="master-header"
                >
                  <Typography className="font-semibold">Master Template Files</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DtpFileList
                    files={enquiry.master_template_files}
                    type="master"
                    dtpId={dtpid}
                  />
                </AccordionDetails>
              </Accordion>
            )}

            {/* Content Proofing Files Accordion */}
            {enquiry.content_proofing_files && enquiry.content_proofing_files.length > 0 && (
              <Accordion className="mt-4">
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="proofing-content"
                  id="proofing-header"
                >
                  <Typography className="font-semibold">Content Proofing Files</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DtpFileList
                    files={enquiry.content_proofing_files}
                    type="proofing"
                    dtpId={dtpid}
                  />
                </AccordionDetails>
              </Accordion>
            )}
          </div>
        )}

        {/* ⭐ Final Assembled Sample Piece / Trophy Approval Section (Moved to Very Bottom) */}
        {filteredSampleQueueItems && filteredSampleQueueItems.length > 0 && (
          <div className="mt-12 p-6 md:p-8 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-amber-50/60 border border-amber-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-200/80">
              <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-amber-700 shadow-xs flex items-center justify-center text-xl">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  Final Assembled Sample Piece Review
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  Review the completed physical trophy sample piece assembled on the shopfloor before authorizing main production.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredSampleQueueItems.map((sampleItem) => {
                const isApproved = sampleItem.bom_sample_status === 'APPROVED_BY_SALES';
                const isRejected = sampleItem.bom_sample_status === 'REJECTED_BY_SALES' || sampleItem.bom_sample_status === 'SAMPLE_REJECTED_INTERNAL';

                const approvalDetails = sampleItem.sales_approval_details;
                const actionUser = approvalDetails?.approved_by_name || "Client (Online Approval)";
                const actionDate = approvalDetails?.action_at
                  ? new Date(approvalDetails.action_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                  : (sampleItem.submitted_at ? new Date(sampleItem.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
                const rejectReason = approvalDetails?.reject_reason || "Rework requested";

                return (
                  <div
                    key={sampleItem._id}
                    className={`border rounded-xl shadow-md hover:shadow-xl transition p-4 flex flex-col items-center bg-white relative ${
                      isApproved ? 'border-emerald-300 ring-2 ring-emerald-400/20' : isRejected ? 'border-rose-300 ring-2 ring-rose-400/20' : ''
                    }`}
                  >
                    {/* Status Badge */}
                    {isApproved ? (
                      <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full mb-3 flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        ✓ Approved
                      </span>
                    ) : isRejected ? (
                      <span className="px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-full mb-3 flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        ✕ Sent for Rework
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold rounded-full mb-3 flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Awaiting Sample Approval
                      </span>
                    )}

                    {/* Image */}
                    <div className="relative w-full h-64 bg-gray-50 border rounded-lg overflow-hidden mb-4 flex items-center justify-center group">
                      {sampleItem.final_sample_image ? (
                        <>
                          <img
                            src={sampleItem.final_sample_image}
                            alt="Final Assembled Sample Piece"
                            className="w-full h-64 object-cover rounded-lg cursor-pointer group-hover:scale-105 transition-transform duration-300"
                            onClick={() => setPreviewImage(sampleItem.final_sample_image)}
                          />
                          <button
                            onClick={() => setPreviewImage(sampleItem.final_sample_image)}
                            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 transition cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomInIcon className="text-gray-600" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400 p-4 text-center">
                          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-400">No Sample Image Available</span>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="text-center mb-3 w-full">
                      <div className="text-sm font-bold text-gray-900">{sampleItem.client_name}</div>
                      <div className="text-xs text-gray-600 font-semibold mt-0.5">
                        {sampleItem.job_no} <span className="text-gray-400 font-normal">({sampleItem.sub_job_no})</span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{sampleItem.product_name}</div>
                    </div>

                    {/* Audit Info Box: Who Approved / Rejected & When & Reason */}
                    {isApproved && (
                      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-4 text-xs text-emerald-900 text-left">
                        <div className="font-bold flex items-center gap-1 text-emerald-800">
                          <span>✓ Sample Approved</span>
                        </div>
                        <div className="mt-1 text-[11px] space-y-0.5 text-emerald-700">
                          <div><strong>Approved By:</strong> {actionUser}</div>
                          {actionDate && <div><strong>Approved On:</strong> {actionDate}</div>}
                          {approvalDetails?.approval_remark && (
                            <div className="mt-1 text-emerald-900 bg-white/80 p-1.5 rounded border border-emerald-200">
                              <strong>Remark:</strong> {approvalDetails.approval_remark}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="w-full bg-rose-50 border border-rose-200 rounded-lg p-2.5 mb-4 text-xs text-rose-900 text-left">
                        <div className="font-bold flex items-center gap-1 text-rose-800">
                          <span>✕ Sent for Rework</span>
                        </div>
                        <div className="mt-1 text-[11px] space-y-0.5 text-rose-700">
                          <div><strong>Action By:</strong> {actionUser}</div>
                          {actionDate && <div><strong>Date:</strong> {actionDate}</div>}
                          <div className="mt-1 text-rose-900 bg-white/80 p-2 rounded border border-rose-200">
                            <strong>Reason:</strong> {rejectReason}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-auto w-full justify-center">
                      {isApproved ? (
                        <div className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm">
                          <span>✓ Approved & Authorized for Main Production</span>
                        </div>
                      ) : isRejected ? (
                        <button
                          disabled={sampleActionLoading}
                          onClick={() => {
                            setSampleApproveModalItem(sampleItem);
                            setSampleApproveRemark("");
                          }}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer font-bold text-xs shadow-sm"
                        >
                          {sampleActionLoading ? "Processing..." : "Re-Approve Sample"}
                        </button>
                      ) : (
                        <>
                          <button
                            disabled={sampleActionLoading}
                            onClick={() => {
                              setSampleApproveModalItem(sampleItem);
                              setSampleApproveRemark("");
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold text-xs disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={sampleActionLoading}
                            onClick={() => {
                              setSampleReworkModalItem(sampleItem);
                              setSampleReworkReason("");
                            }}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer font-semibold text-xs disabled:opacity-50"
                          >
                            Rework
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {quotationModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">
                {quotationModal.type === "approve" ? "Verify Quotation" : "Quotation Rework"}
              </h3>

              {/* Only show textarea for rework */}
              {quotationModal.type === "rework" && (
                <textarea
                  rows={5}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for rework..."
                  className="w-full border rounded-lg p-3 mb-4"
                />
              )}

              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
                  onClick={() => setQuotationModal(null)}
                >
                  Cancel
                </button>

                {quotationModal.type === "approve" ? (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                    onClick={submitQuotationAction}
                    disabled={loadingQuotation}
                  >
                    {loadingQuotation ? "Processing..." : "Approve"}
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                    onClick={submitQuotationAction}
                    disabled={loadingQuotation}
                  >
                    {loadingQuotation ? "Processing..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DTP Confirmation Modal */}
        {dtpConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">
                {dtpConfirmModal.status === "Approved" ? "Approve File" : "Reject File"}
              </h3>

              <p className="mb-4 text-gray-700">
                {dtpConfirmModal.status === "Approved"
                  ? "Are you sure you want to approve this file?"
                  : "Please provide a reason for rejecting this file:"}
              </p>

              {dtpConfirmModal.status === "Rejected" && (
                <>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Reference File (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm flex items-center gap-2">
                        {/* Icon for upload */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Choose File
                        <input
                          type="file"
                          onChange={(e) => setReferenceFile(e.target.files[0])}
                          className="hidden"
                          accept="image/*,.pdf"
                        />
                      </label>
                      <span className="text-sm text-gray-500 italic truncate max-w-[200px]">
                        {referenceFile ? referenceFile.name : "No file chosen"}
                      </span>
                      {referenceFile && (
                        <button
                          onClick={() => setReferenceFile(null)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  onClick={() => { setDtpConfirmModal(null); setRemarks(""); }}
                >
                  Cancel
                </button>

                <button
                  className={`px-4 py-2 text-white rounded-lg transition font-medium ${dtpConfirmModal.status === "Approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                    }`}
                  onClick={submitDtpAction}
                  disabled={loadingQuotation}
                >
                  {loadingQuotation ? "Processing..." : dtpConfirmModal.status === "Approved" ? "Approve" : "Submit Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reprocessed Qty Confirmation Modal */}
        {reprocessedModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                {reprocessedModal.type === "approve" ? "Approve Revised Quantity & Quotation" : "Request Quotation Rework"}
              </h3>

              <p className="mb-4 text-gray-600 text-sm">
                {reprocessedModal.type === "approve"
                  ? "Are you sure you want to approve this revised quantity and the recalculated quotation? This will lock in the update and authorize proceeding."
                  : "Please provide detailed feedback or remarks describing the requested changes or issues in the recalculated quotation:"}
              </p>

              {reprocessedModal.type === "reject" && (
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter rework feedback here..."
                  className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                />
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold cursor-pointer"
                  onClick={() => { setReprocessedModal(null); setRemarks(""); }}
                >
                  Cancel
                </button>

                <button
                  className={`px-4 py-2 text-white rounded-lg transition text-sm font-semibold cursor-pointer ${
                    reprocessedModal.type === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  onClick={submitReprocessedAction}
                  disabled={loadingQuotation}
                >
                  {loadingQuotation ? "Processing..." : reprocessedModal.type === "approve" ? "Approve" : "Submit Rework"}
                </button>
              </div>
            </div>
          </div>
        )}




        <div className="mt-12 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} RD Custom Awards. All rights reserved.
          <br />
          We sincerely appreciate your trust in our craftsmanship.
        </div>
      </div>
    </div>
  );
};

export default ClientConfirmation;
