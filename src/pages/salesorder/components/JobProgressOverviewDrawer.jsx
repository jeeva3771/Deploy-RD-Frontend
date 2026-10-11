import React, { useState, useEffect } from "react";
import moment from "moment";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import HistoryIcon from "@mui/icons-material/History";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FactoryIcon from "@mui/icons-material/Factory";
import LayersIcon from "@mui/icons-material/Layers";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ImageLightbox from "../../common/ImageLightbox";
import { getFileNamev2 } from "../../../utils/helper/FilenameURL";
import { useDispatch, useSelector } from "react-redux";
import { fetchShopFloorJobs } from "../../../reducer/shopFloorReducer";
import { fetchFgStoreJobs } from "../../../reducer/fgStoreReducer";
import { fetchAllDTPJobs } from "../../../reducer/dtpStudioReducer";
import { DetailBox } from "../../shopfloor/components/CTStore/DetailBox";
import { PACK_STAGES } from "../../shopfloor/components/CTPack/constants";
import { axiosInstance } from "../../../utils/url/config";

export const JobProgressOverviewContent = ({ data, mode = "full" }) => {
  const isCSTab = mode === "cs_tab";
  const isFGTab = mode === "fg_tab";
  const dispatch = useDispatch();
  const { jobs: reduxShopJobs } = useSelector((state) => state.shopFloor);
  const [previewImage, setPreviewImage] = useState(null);
  const [fetchedJobs, setFetchedJobs] = useState([]);
  const [fetchedFgJob, setFetchedFgJob] = useState(null);
  const [fetchedDtpJob, setFetchedDtpJob] = useState(null);
  const [approvalDetails, setApprovalDetails] = useState(null);

  const subJobNo = data?.sub_job_no || data?.job_no || data?.id;
  const mainJobNo = data?.job_no || data?.sub_job_no || data?.id;

  useEffect(() => {
    let mounted = true;
    if (!data || !mainJobNo) return;

    const fetchApproval = async () => {
      try {
        const url = `/shop-floor/process-flow/sales-sample-queue?job_no=${encodeURIComponent(mainJobNo)}`;
        const res = await axiosInstance.get(url);
        if (mounted && res.data?.success && res.data.data?.length > 0) {
          const flow = res.data.data.find(d => d.sub_job_no === subJobNo || d.job_no === mainJobNo);
          if (flow && flow.sales_approval_details) {
            setApprovalDetails(flow.sales_approval_details);
          }
        }
      } catch (err) {
        console.error("Failed to fetch approval details", err);
      }
    };
    fetchApproval();

    return () => {
      mounted = false;
    };
  }, [data, mainJobNo, subJobNo]);

  useEffect(() => {
    let mounted = true;
    if (!data || !subJobNo) return;

    if (Array.isArray(data?.shop_floor_jobs) && data.shop_floor_jobs.length > 0) {
      setFetchedJobs(data.shop_floor_jobs);
    } else {
      dispatch(fetchShopFloorJobs({ search: subJobNo }))
        .unwrap()
        .then((res) => {
          if (mounted && res && Array.isArray(res.data)) {
            setFetchedJobs(res.data);
          }
        })
        .catch((err) => {
          console.warn("Error fetching shopfloor jobs via Redux reducer:", err);
        });
    }

    dispatch(fetchFgStoreJobs({ search: subJobNo }))
      .unwrap()
      .then((res) => {
        if (mounted && res && Array.isArray(res.data) && res.data.length > 0) {
          const match = res.data.find((j) => j.sub_job_no === subJobNo) || res.data[0];
          setFetchedFgJob(match);
        }
      })
      .catch((err) => {
        console.warn("Error fetching FG Store job via Redux reducer:", err);
      });

    dispatch(fetchAllDTPJobs({ search: subJobNo }))
      .unwrap()
      .then((res) => {
        if (mounted && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const match = res.data.find(
            (j) => String(j.sub_job_no || j.job_no).trim().toLowerCase() === String(subJobNo).trim().toLowerCase()
          ) || res.data[0];
          setFetchedDtpJob(match);
        }
      })
      .catch((err) => {
        console.warn("Error fetching DTP job in JobProgressOverviewDrawer:", err);
      });

    return () => {
      mounted = false;
    };
  }, [data, subJobNo, dispatch]);

  if (!data) return null;

  const enquiry = (typeof data.enquiry_id === "object" && data.enquiry_id !== null) ? data.enquiry_id : (data.enquiry || {});

  // Date Formatting Helpers
  const formatDateTime = (dateStr) => {
    if (!dateStr || dateStr === "N/A" || dateStr === "") return "N/A";
    const m = moment(dateStr, ["DD-MM-YYYY HH:mm:ss", "DD-MM-YYYY hh:mm A", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601]);
    if (m.isValid()) {
      return m.format("DD-MM-YYYY hh:mm A");
    }
    return String(dateStr).replace("T", " ");
  };

  const formatDeliveryDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A" || dateStr === "") return "N/A";
    const m = moment(dateStr);
    if (m.isValid()) {
      return m.format("DD-MM-YYYY");
    }
    return String(dateStr).split("T")[0];
  };

  const formatWpNumbers = (wp) => {
    if (!wp) return "N/A";
    if (Array.isArray(wp)) {
      return wp.filter(Boolean).join(", ");
    }
    return String(wp);
  };

  const formatEmails = (em) => {
    if (!em) return "N/A";
    if (Array.isArray(em)) {
      return em.filter(Boolean).join(", ");
    }
    return String(em);
  };

  // Extract main details with fallbacks for both Sales Order & Control Tower Job objects
  const clientName = data.client_name || data.client || enquiry.name || enquiry.client_name || data.name || "N/A";
  const jobNo = data.sub_job_no || data.job_no || data.id || enquiry.job_no || "N/A";
  const referenceNo = data.reference_no || data.soNo || enquiry.reference_no || (typeof data.enquiry_id === "object" ? data.enquiry_id?.reference_no : null) || null;
  const productName = data.product_name || data.product || enquiry.product_name || "N/A";
  const jobQty = data.job_quantity || data.product_quantity || data.qty || enquiry.product_quantity || "N/A";
  const deliveryDateFormatted = formatDeliveryDate(data.delivery_date || data.delivDate || enquiry.delivery_date);
  const jobCompletionDateFormatted = formatDateTime(data.job_completion_datetime || data.job_completion_date || data.completionDate);
  const rawType = data.type || data.order_type || (data.to_production ? "production" : "sample");
  const jobType = String(rawType).toLowerCase().includes("sample") ? "Sample Order" : "Production Order";
  const emailsFormatted = formatEmails(data.email || data.emails || enquiry.email);
  const contactNo = data.mobile_no || data.mobile || data.phone || (Array.isArray(data.phones) && data.phones.length > 0 ? data.phones.join(", ") : enquiry.mobile_no) || "N/A";
  const whatsappNoFormatted = formatWpNumbers(data.wp_number || data.whatsapp || data.wp || (Array.isArray(data.wpNumbers) && data.wpNumbers.length > 0 ? data.wpNumbers.join(", ") : enquiry.wp_number));

  // Product Image for thumbnail header
  const productImage = data.image || data.product_image || enquiry.images?.[0]?.url || enquiry.reference_images?.[0] || null;

  // 1. Enquiry Approval Info (Computed by Backend API)
  const enquiryApprovedTime = formatDateTime(
    data.enquiry_approved_datetime ||
    enquiry.accepted_date_time ||
    enquiry.created_at ||
    enquiry.createdAt ||
    data.created_at ||
    data.createdAt ||
    data.soDate
  );
  const enquiryApprovedBy = "Client";

  // Helper to format person names cleanly without raw 24-char ObjectIds
  const getPersonName = (person) => {
    if (!person) return null;
    if (typeof person === "object" && person.name) return person.name;
    if (typeof person === "string") {
      if (/^[0-9a-fA-F]{24}$/.test(person.trim())) return null;
      return person;
    }
    return null;
  };

  // 2. Designer Info & Files
  const designerPersonNames = (() => {
    if (Array.isArray(data.designer_person)) {
      const names = data.designer_person.map(getPersonName).filter(Boolean);
      if (names.length > 0) return names.join(", ");
    }
    const single = getPersonName(data.designer_person) || getPersonName(enquiry.designer_person) || data.designer_name || data.designer_person_name;
    if (single) return single;
    return (data.designer_person || enquiry.designer_person) ? "Designer Assigned" : "N/A";
  })();
  const designerFiles = data.designer_files || [];

  // DTP Studio Job & Proof Files
  const dtpJob = fetchedDtpJob || data?.dtp_job || null;
  const masterTemplateFiles = dtpJob?.master_template_files || [];
  const contentProofingFiles = dtpJob?.content_proofing_files || [];

  // 3. Master Template Info
  const isMasterApproved = masterTemplateFiles.some((f) => f.status === "Approved");
  const isMasterRejected = masterTemplateFiles.length > 0 && masterTemplateFiles.every((f) => f.status === "Rejected");
  const latestMasterAction = masterTemplateFiles.slice().reverse().find((f) => f.status === "Approved" || f.status === "Rejected") || (masterTemplateFiles.length > 0 ? masterTemplateFiles[masterTemplateFiles.length - 1] : null);
  const masterApprovedBy = latestMasterAction?.action_by_name || latestMasterAction?.approved_by_name || latestMasterAction?.rejected_by_name || (isMasterApproved ? "Approved" : (masterTemplateFiles.length > 0 ? "Pending Action" : "N/A"));
  const masterApprovedRole = latestMasterAction?.action_by_role && latestMasterAction.action_by_role !== "Client" ? ` (${latestMasterAction.action_by_role})` : "";
  const masterApprovedTime = formatDateTime(latestMasterAction?.approved_date_time || latestMasterAction?.approved_at || latestMasterAction?.rejected_date_time || latestMasterAction?.rejected_at);

  // 4. Content Proofing Info
  const isContentApproved = contentProofingFiles.some((f) => f.status === "Approved");
  const isContentRejected = contentProofingFiles.length > 0 && contentProofingFiles.every((f) => f.status === "Rejected");
  const latestContentAction = contentProofingFiles.slice().reverse().find((f) => f.status === "Approved" || f.status === "Rejected") || (contentProofingFiles.length > 0 ? contentProofingFiles[contentProofingFiles.length - 1] : null);
  const contentApprovedBy = latestContentAction?.action_by_name || latestContentAction?.approved_by_name || latestContentAction?.rejected_by_name || (isContentApproved ? "Approved" : (contentProofingFiles.length > 0 ? "Pending Action" : "N/A"));
  const contentApprovedRole = latestContentAction?.action_by_role && latestContentAction.action_by_role !== "Client" ? ` (${latestContentAction.action_by_role})` : "";
  const contentApprovedTime = formatDateTime(latestContentAction?.approved_date_time || latestContentAction?.approved_at || latestContentAction?.rejected_date_time || latestContentAction?.rejected_at);

  // 5. Quotation History & Approved By
  const quotationFiles = data.quatation_files || data.quotation_files || [];
  const bomHistory = data.bom_history || enquiry.bom_history || [];
  const latestBomLog = bomHistory.length > 0 ? bomHistory[bomHistory.length - 1] : null;

  // Group quotation files and bom_history into logical version rounds
  const quotationRounds = (() => {
    const rounds = [];

    if (bomHistory && bomHistory.length > 0) {
      bomHistory.forEach((log) => {
        const matchingRound = rounds.find((r) => {
          if (log.file_url && r.fileUrl && log.file_url === r.fileUrl) return true;
          if (
            log.action === "Reprocess Approved" &&
            r.actionType === "Reprocess Approved" &&
            log.after_qty !== undefined &&
            r.afterQty === log.after_qty &&
            log.before_qty === r.beforeQty
          ) {
            return true;
          }
          return false;
        });

        if (matchingRound) {
          matchingRound.logs.push(log);
        } else {
          const roundFile = quotationFiles[rounds.length] || log.file_url || null;

          rounds.push({
            version: rounds.length + 1,
            fileUrl: roundFile,
            actionType: log.action || "",
            beforeQty: log.before_qty,
            afterQty: log.after_qty,
            logs: [log],
          });
        }
      });
    } else if (quotationFiles && quotationFiles.length > 0) {
      quotationFiles.forEach((file, fIdx) => {
        rounds.push({
          version: fIdx + 1,
          fileUrl: file,
          actionType: "Generated",
          beforeQty: undefined,
          afterQty: undefined,
          logs: [],
        });
      });
    }

    return rounds;
  })();

  const quotationApprovedBy = (latestBomLog?.action_by_name || latestBomLog?.action_by_user?.name || latestBomLog?.by)
    ? `${latestBomLog.action_by_name || latestBomLog.action_by_user?.name || latestBomLog.by}${latestBomLog.action_by_role && latestBomLog.action_by_role !== "Client" ? ` (${latestBomLog.action_by_role})` : ""}`
    : (data.price_approved_by?.name || (data.is_bom_verified ? "Admin / Pricing Specialist" : (data.updated_by?.[0]?.user?.name || "N/A")));

  const quotationApprovedTime = (latestBomLog?.date_time || latestBomLog?.dt || latestBomLog?.created_at)
    ? formatDateTime(latestBomLog.date_time || latestBomLog.dt || latestBomLog.created_at)
    : formatDateTime(data.price_approved_datetime || (data.is_bom_verified ? data.updated_at : null));

  // Helper to extract person name for PI logs
  const getPiUserName = (log) => {
    if (!log) return null;
    if (log.action_by_name) return log.action_by_name;
    if (typeof log.action_by_user === "object" && log.action_by_user?.name) return log.action_by_user.name;
    if (typeof log.action_by_user === "string" && !/^[0-9a-fA-F]{24}$/.test(log.action_by_user.trim())) return log.action_by_user;
    if (log.by) return log.by;
    if (typeof log.user === "object" && log.user?.name) return log.user.name;
    if (typeof log.user === "string" && !/^[0-9a-fA-F]{24}$/.test(log.user.trim())) return log.user;
    return null;
  };

  // 6. PI History & Approved By
  const piFiles = data.Pi_files || data.pi_files || [];
  const piHistory = Array.isArray(data.pi_history) && data.pi_history.length > 0
    ? data.pi_history
    : (Array.isArray(enquiry.pi_history) ? enquiry.pi_history : []);

  const latestApprovedPiLog = piHistory.slice().reverse().find(
    (l) => l && (l.action === "Approved" || l.action === "Verified" || l.action === "PI Verified")
  ) || (piHistory.length > 0 ? piHistory[piHistory.length - 1] : null);

  const rawPiApprovedBy = getPiUserName(latestApprovedPiLog) ||
    (typeof data.pi_approved_by === "object" ? data.pi_approved_by?.name : getPersonName(data.pi_approved_by)) ||
    (Array.isArray(data.updated_by) && data.updated_by.length > 0 ? (data.updated_by[data.updated_by.length - 1]?.user?.name || getPersonName(data.updated_by[data.updated_by.length - 1]?.user)) : null);

  const piRoleSuffix = latestApprovedPiLog?.action_by_role && latestApprovedPiLog.action_by_role !== "Client"
    ? ` (${latestApprovedPiLog.action_by_role})`
    : "";

  const piApprovedBy = rawPiApprovedBy
    ? `${rawPiApprovedBy}${piRoleSuffix}`
    : (data.is_pi_verified
      ? "Accounts Head"
      : (data.is_pi_uploaded || piFiles.length > 0 ? "Pending Approval" : "N/A"));

  const rawPiTime = latestApprovedPiLog?.date_time ||
    latestApprovedPiLog?.dt ||
    latestApprovedPiLog?.created_at ||
    data.pi_approved_datetime ||
    data.pi_verified_datetime ||
    (data.is_pi_verified ? data.updated_at : null);

  const piApprovedTime = rawPiTime && formatDateTime(rawPiTime) !== "N/A"
    ? formatDateTime(rawPiTime)
    : (data.is_pi_verified
      ? formatDateTime(data.updated_at || data.created_at)
      : (data.is_pi_uploaded || piFiles.length > 0 ? "Pending Action" : "N/A"));

  const isImageFile = (url) => {
    if (!url) return false;
    const cleanUrl = String(url).split("?")[0];
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanUrl);
  };

  const orderQty = fetchedFgJob?.total_qty || data?.job_quantity || data?.product_quantity || enquiry?.product_quantity || 0;
  const inwardQty = fetchedFgJob?.inward_qty || 0;
  const balanceInward = Math.max(0, orderQty - inwardQty);
  const qcHandover = fetchedFgJob?.qc_received || fetchedFgJob?.qc?.received || 0;

  const qcArrived = fetchedFgJob?.qc?.arrived || 0;
  const qcBad = fetchedFgJob?.qc?.bad || 0;
  const qcReleased = fetchedFgJob?.qc?.released_to_packing || 0;
  const qcRejected = fetchedFgJob?.qc?.rejected_handover || 0;

  const packStageId = fetchedFgJob?.pack?.stage || 'qc_pending';
  const currentPackStageIdx = PACK_STAGES.findIndex(s => s.id === packStageId);
  const currentPackStage = PACK_STAGES.find(s => s.id === packStageId) || PACK_STAGES[0];

  const packReceivedQc = fetchedFgJob?.pack?.received_from_qc || 0;
  const packBalToInward = Math.max(0, (fetchedFgJob?.pack?.received_from_qc || 0) - (fetchedFgJob?.pack?.qc_accepted_qty || 0));
  const packDispatched = fetchedFgJob?.pack?.delivered_qty || 0;
  const packBoxCount = fetchedFgJob?.pack?.box_count || 0;
  const packStatus = fetchedFgJob?.pack?.status || "Pending";

  return (
    <div className="space-y-6 bg-white text-slate-600">
      {/* ──── SECTION 1: MAIN JOB & CLIENT DETAILS ──── */}
      {!isCSTab && !isFGTab && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-xs">

          {/* Top Image & Client Name Header */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
            <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden border border-slate-300 shadow-sm flex-shrink-0 cursor-pointer hover:opacity-85 transition relative group">
              <img
                src={productImage || "/placeholder-award.png"}
                alt="Product Thumbnail"
                className="w-full h-full object-cover"
                onClick={() => productImage && setPreviewImage(productImage)}
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Product & Client Details
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight break-words whitespace-normal">
                {productName}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5 break-words whitespace-normal">
                Client: <span className="text-slate-800">{clientName}</span>
              </p>
            </div>
          </div>

          {/* Symmetric 3-Column Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">

            {/* Card 1: Job Type */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Job Type</span>
              <span className="font-black text-slate-900 text-sm break-words whitespace-normal leading-snug mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${jobType.toLowerCase().includes("sample") ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                {jobType}
              </span>
            </div>

            {/* Card 2: Job Quantity */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs">
              <span className="text-slate-600 block text-[10px] uppercase font-bold tracking-wider">Job Quantity</span>
              <span className="font-black text-slate-600 text-sm mt-0.5">
                {jobQty}
              </span>
            </div>

            {/* Card 3: Delivery Date */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs">
              <span className="text-slate-600 block text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <EventIcon fontSize="inherit" className="text-blue-600" /> Delivery Date
              </span>
              <span className="font-black text-slate-600 text-sm break-words whitespace-normal leading-snug mt-0.5">
                {deliveryDateFormatted}
              </span>
            </div>

            {/* Card 4: Job Completion Date */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs">
              <span className="text-slate-600 block text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <EventIcon fontSize="inherit" className="text-blue-600" /> Job Completion Date
              </span>
              <span className="font-black text-slate-600 text-sm break-words whitespace-normal leading-snug mt-0.5">
                {jobCompletionDateFormatted}
              </span>
            </div>

            {/* Card 5: Contact Number */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs">
              <span className="text-slate-600 block text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <PhoneIcon fontSize="inherit" className="text-blue-600" /> Contact Number
              </span>
              <span className="font-black text-slate-600 text-sm break-words whitespace-normal leading-snug mt-0.5">
                {contactNo}
              </span>
            </div>

            {/* Card 6: Email ID */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs">
              <span className="text-slate-600 block text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <EmailIcon fontSize="inherit" className="text-blue-600" /> Email ID
              </span>
              <span className="font-extrabold text-slate-600 text-xs break-words whitespace-normal leading-snug block mt-0.5">
                {emailsFormatted}
              </span>
            </div>

            {/* Card 7: WhatsApp Number (Full Row Width across all 3 Columns) */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-1 sm:col-span-2 md:col-span-3 flex flex-col justify-center shadow-xs">
              <span className="text-slate-600 block text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-emerald-600">
                <WhatsAppIcon fontSize="inherit" /> WhatsApp Number
              </span>
              <span className="font-black text-slate-600 text-sm break-words whitespace-normal leading-snug block mt-0.5">
                {whatsappNoFormatted}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ──── SECTION 2: WORKFLOW & APPROVAL MILESTONES ──── */}
      <div className="space-y-4">

        {/* 1. ENQUIRY APPROVAL */}
        {!isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <CheckCircleIcon className="text-emerald-600" fontSize="small" />
                1. Enquiry Approval
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Design Approved
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Approved By:</span>
                <span className="font-black text-slate-600 break-words whitespace-normal text-xs">{enquiryApprovedBy}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Approval Time:</span>
                <span className="font-bold text-blue-700 break-words whitespace-normal text-xs">{enquiryApprovedTime}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. DESIGN FILES REQUESTED & UPLOADED PREVIEW */}
        {!isCSTab && !isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <DesignServicesIcon className="text-purple-600" fontSize="small" />
                2. Design Files & Proof Previews
              </h4>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${designerFiles.length > 0 ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"}`}>
                {designerFiles.length > 0 ? "Design Files" : "In Progress"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-3">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Designer Assigned / Uploaded By:</span>
                <span className="font-black text-slate-600 break-words whitespace-normal text-xs">{designerPersonNames}</span>
              </div>
            </div>

            {/* Uploaded Design Files List / Grid */}
            {designerFiles.length > 0 ? (
              <div>
                <span className="text-[11px] font-bold text-slate-600 mb-2 block">
                  Uploaded Designer Files ({designerFiles.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {designerFiles.map((fileUrl, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        {isImageFile(fileUrl) ? (
                          <img
                            src={fileUrl}
                            alt="Proof"
                            className="w-9 h-9 object-cover rounded-lg border border-slate-300 cursor-pointer hover:opacity-80 flex-shrink-0"
                            onClick={() => setPreviewImage(fileUrl)}
                          />
                        ) : (
                          <InsertDriveFileIcon className="text-purple-600 flex-shrink-0" />
                        )}
                        <span className="font-bold text-slate-600 truncate break-all">
                          {getFileNamev2(fileUrl)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {isImageFile(fileUrl) && (
                          <button
                            onClick={() => setPreviewImage(fileUrl)}
                            className="p-1 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                            title="Preview Image"
                          >
                            <VisibilityIcon fontSize="small" />
                          </button>
                        )}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800 transition"
                          title="Download File"
                        >
                          <OpenInNewIcon style={{ fontSize: 18 }} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No designer files uploaded yet.</p>
            )}
          </div>
        )}

        {/* 3. QUOTATION HISTORY & APPROVED BY */}
        {!isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ReceiptLongIcon className="text-indigo-600" fontSize="small" />
                3. Quotation History &amp; Approval
              </h4>
              <div className="flex items-center gap-2">
                {quotationRounds.length > 0 && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {quotationRounds.length} {quotationRounds.length === 1 ? 'Round' : 'Rounds'}
                  </span>
                )}
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${data.is_bom_verified || latestBomLog?.action === "Approved" || latestBomLog?.action === "Reprocess Approved"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : quotationFiles.length > 0
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    : "bg-slate-100 text-slate-600"
                  }`}>
                  {data.is_bom_verified ? "BOM Verified" : latestBomLog?.action || (quotationFiles.length > 0 ? "Quotation Active" : "Pending")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wide">Quotation Approved By:</span>
                <span className="font-black text-slate-800 break-words whitespace-normal text-xs">{quotationApprovedBy}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wide">Approval Date / Time:</span>
                <span className="font-bold text-indigo-700 break-words whitespace-normal text-xs">{quotationApprovedTime}</span>
              </div>
            </div>

            {/* Quotation File & Action History Combined List */}
            {quotationRounds.length > 0 ? (
              <div>
                <span className="text-[11px] font-bold text-slate-700 mb-2 block flex items-center gap-1.5">
                  <HistoryIcon fontSize="small" className="text-indigo-600" />
                  Quotation Audit Trail &amp; Versions ({quotationRounds.length} {quotationRounds.length === 1 ? 'round' : 'rounds'}):
                </span>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {quotationRounds.map((round) => {
                    const qFile = round.fileUrl;
                    const isApp = round.actionType === "Approved";
                    const isReprocess = round.actionType === "Reprocess Approved";
                    const isRew = round.actionType === "Rework" || round.actionType === "Rejected";

                    return (
                      <div
                        key={round.version}
                        className={`p-3 rounded-xl border text-xs space-y-2.5 transition-all ${isApp
                          ? "bg-emerald-50/40 border-emerald-200"
                          : isReprocess
                            ? "bg-violet-50/40 border-violet-200"
                            : isRew
                              ? "bg-rose-50/40 border-rose-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                      >
                        {/* File Header */}
                        {qFile ? (
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                              <DescriptionIcon className="text-indigo-600 flex-shrink-0" fontSize="small" />
                              <div className="min-w-0">
                                <span className="font-black text-slate-800 truncate block text-xs">
                                  v{round.version}: {getFileNamev2(qFile)}
                                </span>
                              </div>
                            </div>
                            <a
                              href={qFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md transition flex items-center gap-1 font-bold text-xs flex-shrink-0 ml-2 border border-indigo-200"
                            >
                              <OpenInNewIcon style={{ fontSize: 14 }} />
                              <span>View PDF</span>
                            </a>
                          </div>
                        ) : (
                          <div className="font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1.5">
                            <DescriptionIcon className="text-slate-400" fontSize="small" />
                            <span>v{round.version}: Quotation Action Record</span>
                          </div>
                        )}

                        {/* Quantity Revision Notice if Present */}
                        {(round.beforeQty !== undefined && round.afterQty !== undefined && round.beforeQty !== round.afterQty) && (
                          <div className="flex items-center gap-1.5 bg-violet-50 text-violet-800 font-bold px-2.5 py-1.5 rounded-lg text-[11px] border border-violet-200 shadow-2xs">
                            <span>📦 Qty Revision:</span>
                            <span className="line-through text-slate-400">{round.beforeQty} pcs</span>
                            <span>➔</span>
                            <span className="text-violet-900 font-black">{round.afterQty} pcs</span>
                          </div>
                        )}

                        {/* Corresponding Action History Logs for this round */}
                        {round.logs && round.logs.length > 0 && (
                          <div className="space-y-2">
                            {round.logs.map((log, lIdx) => {
                              const logIsApp = log.action === "Approved";
                              const logIsReprocess = log.action === "Reprocess Approved";
                              const logIsRew = log.action === "Rework" || log.action === "Rejected";

                              return (
                                <div key={lIdx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs space-y-2">
                                  <div className="flex items-center justify-between flex-wrap gap-1">
                                    <span className={`font-black text-[11px] px-2.5 py-0.5 rounded-full border ${logIsApp
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : logIsReprocess
                                        ? "bg-violet-100 text-violet-800 border-violet-300"
                                        : logIsRew
                                          ? "bg-rose-100 text-rose-800 border-rose-300"
                                          : "bg-indigo-100 text-indigo-800 border-indigo-200"
                                      }`}>
                                      v{round.version}: {log.action}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">{formatDateTime(log.date_time)}</span>
                                  </div>

                                  <div className="text-slate-600 text-xs flex items-center justify-between flex-wrap gap-1">
                                    <div>
                                      Action by: <span className="font-bold text-slate-800">{log.action_by_name || "Client"}</span>
                                      {log.action_by_role && (
                                        <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                                          {log.action_by_role}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {log.remarks && (
                                    <div className="text-slate-600 italic text-[11px] bg-slate-50 p-2 rounded border border-slate-200/80">
                                      💬 <span className="font-semibold not-italic text-slate-700">Remarks:</span> "{log.remarks}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No quotation files or history available.</p>
            )}
          </div>
        )}

        {/* 4. PI HISTORY & APPROVED BY */}
        {!isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <ReceiptLongIcon className="text-teal-600" fontSize="small" />
                4. Proforma Invoice (PI) History &amp; Approval
              </h4>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${piFiles.length > 0 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                {data.is_pi_verified ? "PI" : (piFiles.length > 0 ? "Uploaded" : "Pending")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-3">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">PI Approved By:</span>
                <span className="font-black text-slate-600 break-words whitespace-normal text-xs">{piApprovedBy}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Approval Date / Time:</span>
                <span className="font-bold text-blue-700 break-words whitespace-normal text-xs">{piApprovedTime}</span>
              </div>
            </div>

            {/* PI File & Action History Combined List */}
            {piFiles.length > 0 || piHistory.length > 0 ? (
              <div>
                <span className="text-[11px] font-bold text-slate-600 mb-2 block flex items-center gap-1.5">
                  <HistoryIcon fontSize="small" className="text-teal-600" />
                  PI File &amp; Action History ({Math.max(piFiles.length, piHistory.length)} rounds):
                </span>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {Array.from({ length: Math.max(piFiles.length, piHistory.length) }).map((_, pIdx) => {
                    const piFile = piFiles[pIdx];
                    const log = piHistory[pIdx];
                    const isApp = log?.action === "Approved";
                    const isRew = log?.action === "Rework" || log?.action === "Rejected";

                    return (
                      <div
                        key={pIdx}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2"
                      >
                        {/* File Details (PI v1, PI v2...) */}
                        {piFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                              <ReceiptLongIcon className="text-teal-600 flex-shrink-0" />
                              <span className="font-bold text-slate-600 truncate break-all">
                                PI v{pIdx + 1}: {getFileNamev2(piFile)}
                              </span>
                            </div>
                            <a
                              href={piFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-800 transition flex items-center gap-1 font-bold flex-shrink-0 ml-2"
                            >
                              <OpenInNewIcon style={{ fontSize: 18 }} />
                              <span>View</span>
                            </a>
                          </div>
                        ) : (
                          <div className="font-bold text-slate-600">PI v{pIdx + 1}: Action Record</div>
                        )}

                        {/* Corresponding Action History Badge & Details */}
                        {log && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-black text-xs px-2 py-0.5 rounded-full ${isApp ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : isRew ? "bg-red-100 text-red-800 border border-red-200" : "bg-teal-100 text-teal-800 border border-teal-200"}`}>
                                v{pIdx + 1}: {log.action}
                              </span>
                              <span className="text-[11px] text-blue-700 font-medium">{formatDateTime(log.date_time)}</span>
                            </div>
                            <div className="text-slate-600 text-xs mt-1">
                              By: <span className="font-bold text-slate-600">{getPiUserName(log) || "Accounts / Client"}</span> {log.action_by_role && log.action_by_role !== "Client" ? `(${log.action_by_role})` : ""}
                            </div>
                            {log.remarks && (
                              <div className="text-slate-600 italic text-[11px] mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                Remarks: "{log.remarks}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No PI files or history available.</p>
            )}
          </div>
        )}

        {/* 5. APPROVED DESIGN PROCEED / PRODUCTION STAGE */}
        {!isCSTab && !isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <VerifiedUserIcon className="text-blue-600" fontSize="small" />
                5. Approved Design Proceed
              </h4>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${data.is_verified_to_proceed ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                  }`}
              >
                {data.is_verified_to_proceed ? "Proceeded to Production" : "Pending Proceed"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Status:</span>
                <span className="font-black text-slate-700 text-xs">
                  {data.is_verified_to_proceed ? "Verified & Proceeded" : "Pending Proceed"}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Proceed Date &amp; Time:</span>
                <span className="font-bold text-blue-700 text-xs">
                  {formatDateTime(data.proceed_to_production_datetime) !== "N/A"
                    ? formatDateTime(data.proceed_to_production_datetime)
                    : (data.is_verified_to_proceed ? formatDateTime(data.updated_at) : "N/A")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6. DTP MASTER TEMPLATE APPROVAL */}
        {!isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <LayersIcon className="text-cyan-600" fontSize="small" />
                6. DTP Master Template Approval
              </h4>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${isMasterApproved
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : isMasterRejected
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : masterTemplateFiles.length > 0
                      ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
              >
                {isMasterApproved
                  ? "Phase Approved"
                  : isMasterRejected
                    ? "Rejected"
                    : masterTemplateFiles.length > 0
                      ? "In Review"
                      : "Pending Upload"}
              </span>
            </div>

            {/* Master Template Proof Files List */}
            {masterTemplateFiles.length > 0 ? (
              <div>
                <span className="text-[11px] font-bold text-slate-600 mb-2 block">
                  Master Template Proof Files ({masterTemplateFiles.length}):
                </span>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                  {masterTemplateFiles.map((fileObj, mIdx) => {
                    const fileUrl = fileObj.file_url;
                    const fileName = fileUrl ? getFileNamev2(fileUrl) : `Master Proof v${mIdx + 1}`;
                    const isApp = fileObj.status === "Approved";
                    const isRej = fileObj.status === "Rejected";
                    const actionUser = fileObj.action_by_name || fileObj.approved_by_name || fileObj.rejected_by_name;
                    const actionDate = formatDateTime(fileObj.approved_date_time || fileObj.approved_at || fileObj.rejected_date_time || fileObj.rejected_at);

                    return (
                      <div
                        key={fileObj._id || mIdx}
                        className={`bg-slate-50 p-3 rounded-xl border ${isApp
                          ? "border-emerald-200 bg-emerald-50/30"
                          : isRej
                            ? "border-red-200 bg-red-50/30"
                            : "border-slate-200"
                          } text-xs space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            {isImageFile(fileUrl) ? (
                              <img
                                src={fileUrl}
                                alt="Master Proof"
                                className="w-9 h-9 object-cover rounded-lg border border-slate-300 cursor-pointer hover:opacity-80 flex-shrink-0"
                                onClick={() => setPreviewImage(fileUrl)}
                              />
                            ) : (
                              <LayersIcon className="text-cyan-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-slate-700 truncate block">
                                v{mIdx + 1}: {fileName}
                              </span>
                              {fileObj.uploaded_at && (
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  Uploaded: {formatDateTime(fileObj.uploaded_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${isApp
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : isRej
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                            >
                              {fileObj.status || "Pending"}
                            </span>

                            {isImageFile(fileUrl) && (
                              <button
                                onClick={() => setPreviewImage(fileUrl)}
                                className="p-1 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                                title="Preview Image"
                              >
                                <VisibilityIcon fontSize="small" />
                              </button>
                            )}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-800 transition"
                              title="Open File"
                            >
                              <OpenInNewIcon style={{ fontSize: 18 }} />
                            </a>
                          </div>
                        </div>

                        {/* Approval / Rejection Metadata */}
                        {(actionUser || actionDate !== "N/A") && (
                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] flex flex-wrap items-center justify-between gap-1 shadow-2xs">
                            <span className="text-slate-600">
                              {isApp ? "Approved by: " : isRej ? "Rejected by: " : "Action by: "}
                              <strong className="text-slate-800">{actionUser || "Client / Staff"}</strong>
                            </span>
                            <span className="font-bold text-blue-700">{actionDate}</span>
                          </div>
                        )}

                        {/* Rejection Reason & Reference File */}
                        {isRej && fileObj.rejection_reason && (
                          <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-[11px] text-red-700">
                            <span className="font-bold block uppercase text-[9px] tracking-wider text-red-800">Rejection Reason:</span>
                            <p className="mt-0.5 italic">{fileObj.rejection_reason}</p>
                            {fileObj.rejection_reference_file && (
                              <a
                                href={fileObj.rejection_reference_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-800 font-bold underline hover:text-red-950 mt-1 inline-flex items-center gap-1"
                              >
                                <OpenInNewIcon style={{ fontSize: 14 }} /> Reference File
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No master template proofs uploaded yet.</p>
            )}
          </div>
        )}

        {/* 7. DTP CONTENT PROOFING APPROVAL */}
        {!isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <RateReviewIcon className="text-indigo-600" fontSize="small" />
                7. DTP Content Proofing Approval
              </h4>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${isContentApproved
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : isContentRejected
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : contentProofingFiles.length > 0
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
              >
                {isContentApproved
                  ? "Phase Approved"
                  : isContentRejected
                    ? "Rejected"
                    : contentProofingFiles.length > 0
                      ? "In Review"
                      : "Pending Upload"}
              </span>
            </div>

            {/* Content Proofing Files List */}
            {contentProofingFiles.length > 0 ? (
              <div>
                <span className="text-[11px] font-bold text-slate-600 mb-2 block">
                  Content Proofing Files ({contentProofingFiles.length}):
                </span>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                  {contentProofingFiles.map((fileObj, cIdx) => {
                    const fileUrl = fileObj.file_url;
                    const fileName = fileUrl ? getFileNamev2(fileUrl) : `Content Proof v${cIdx + 1}`;
                    const isApp = fileObj.status === "Approved";
                    const isRej = fileObj.status === "Rejected";
                    const actionUser = fileObj.action_by_name || fileObj.approved_by_name || fileObj.rejected_by_name;
                    const actionDate = formatDateTime(fileObj.approved_date_time || fileObj.approved_at || fileObj.rejected_date_time || fileObj.rejected_at);

                    return (
                      <div
                        key={fileObj._id || cIdx}
                        className={`bg-slate-50 p-3 rounded-xl border ${isApp
                          ? "border-emerald-200 bg-emerald-50/30"
                          : isRej
                            ? "border-red-200 bg-red-50/30"
                            : "border-slate-200"
                          } text-xs space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            {isImageFile(fileUrl) ? (
                              <img
                                src={fileUrl}
                                alt="Content Proof"
                                className="w-9 h-9 object-cover rounded-lg border border-slate-300 cursor-pointer hover:opacity-80 flex-shrink-0"
                                onClick={() => setPreviewImage(fileUrl)}
                              />
                            ) : (
                              <RateReviewIcon className="text-indigo-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-slate-700 truncate block">
                                v{cIdx + 1}: {fileName}
                              </span>
                              {fileObj.uploaded_at && (
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  Uploaded: {formatDateTime(fileObj.uploaded_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${isApp
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : isRej
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                            >
                              {fileObj.status || "Pending"}
                            </span>

                            {isImageFile(fileUrl) && (
                              <button
                                onClick={() => setPreviewImage(fileUrl)}
                                className="p-1 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                                title="Preview Image"
                              >
                                <VisibilityIcon fontSize="small" />
                              </button>
                            )}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-800 transition"
                              title="Open File"
                            >
                              <OpenInNewIcon style={{ fontSize: 18 }} />
                            </a>
                          </div>
                        </div>

                        {/* Approval / Rejection Metadata */}
                        {(actionUser || actionDate !== "N/A") && (
                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] flex flex-wrap items-center justify-between gap-1 shadow-2xs">
                            <span className="text-slate-600">
                              {isApp ? "Approved by: " : isRej ? "Rejected by: " : "Action by: "}
                              <strong className="text-slate-800">{actionUser || "Client / Staff"}</strong>
                            </span>
                            <span className="font-bold text-blue-700">{actionDate}</span>
                          </div>
                        )}

                        {/* Rejection Reason & Reference File */}
                        {isRej && fileObj.rejection_reason && (
                          <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-[11px] text-red-700">
                            <span className="font-bold block uppercase text-[9px] tracking-wider text-red-800">Rejection Reason:</span>
                            <p className="mt-0.5 italic">{fileObj.rejection_reason}</p>
                            {fileObj.rejection_reference_file && (
                              <a
                                href={fileObj.rejection_reference_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-800 font-bold underline hover:text-red-950 mt-1 inline-flex items-center gap-1"
                              >
                                <OpenInNewIcon style={{ fontSize: 14 }} /> Reference File
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No content proofing files uploaded yet.</p>
            )}
          </div>
        )}

        {approvalDetails && isCSTab && !isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <RateReviewIcon className="text-blue-600" fontSize="small" />
                Sales Sample Approval
              </h4>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${approvalDetails.reject_reason ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {approvalDetails.reject_reason ? 'Rejected' : 'Approved'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Action By:</span>
                <span className="font-black text-slate-800 break-words whitespace-normal text-xs">{approvalDetails.approved_by_name || ""}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Action Time:</span>
                <span className="font-bold text-blue-700 break-words whitespace-normal text-xs">{formatDateTime(approvalDetails.action_at)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. PUSH TO SHOP FLOOR */}
        {!isCSTab && !isFGTab && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <FactoryIcon className="text-blue-600" fontSize="small" />
                8. Push to Shop Floor
              </h4>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${data.is_pushed_shop_floor
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
              >
                {data.is_pushed_shop_floor ? "Pushed to Shop Floor" : "Not Progress Start"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Status:</span>
                <span className="font-black text-slate-800 text-xs">
                  {data.is_pushed_shop_floor ? "Pushed to Shop Floor" : "Pending Push"}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Pushed Date &amp; Time:</span>
                <span className="font-bold text-blue-700 text-xs">
                  {formatDateTime(data.pushed_to_shop_floor_datetime) || '---'}
                </span>
              </div>
            </div>

            {/* Shopfloor Process Workflow (Grouped by Material Group) */}
            {(() => {
              const subJobVal = data?.sub_job_no || data?.job_no;
              const activeJobs = fetchedJobs.length > 0
                ? fetchedJobs
                : (Array.isArray(data?.shop_floor_jobs) && data.shop_floor_jobs.length > 0
                  ? data.shop_floor_jobs
                  : (Array.isArray(reduxShopJobs) ? reduxShopJobs.filter(j => j.sub_job_no === subJobVal) : []));

              const groupShopFloorProcesses = (shopJobs) => {
                if (!shopJobs || !Array.isArray(shopJobs) || shopJobs.length === 0) return [];
                const groupsMap = {};

                shopJobs.forEach((sfJob) => {
                  const jobProcName = sfJob.process_name || "Process";
                  const sfJobStatus = sfJob.status || "Pending";
                  const sfJobProgress = sfJob.progress || 0;

                  if (Array.isArray(sfJob.material_groups) && sfJob.material_groups.length > 0) {
                    sfJob.material_groups.forEach((mg) => {
                      const procIndex = mg.process_index || mg.input?.process_index || "-";

                      let sectionPrefix = "";
                      if (procIndex && String(procIndex).includes(".")) {
                        sectionPrefix = String(procIndex).split(".")[0];
                      }

                      const rawGroupId = mg.group_id || mg._id || mg.material_group_id;
                      // Build a unique sectionKey so sections with the same name or index are NEVER merged
                      const sectionKey = (rawGroupId && String(rawGroupId) !== "Section" && String(rawGroupId) !== "[object Object]")
                        ? String(rawGroupId)
                        : (sectionPrefix ? `sec_${sectionPrefix}` : (mg.group_name || "Section"));

                      let groupDisplayName = mg.group_name || (sectionPrefix ? sectionPrefix : "Section");
                      if (sectionPrefix && groupDisplayName && !groupDisplayName.startsWith(sectionPrefix) && groupDisplayName !== sectionPrefix) {
                        groupDisplayName = `${sectionPrefix} - ${groupDisplayName}`;
                      }

                      if (!groupsMap[sectionKey]) {
                        groupsMap[sectionKey] = {
                          group_id: sectionKey,
                          group_name: groupDisplayName,
                          processes: [],
                        };
                      }

                      const procName = jobProcName;
                      const procProgress = typeof mg.progress === "number" ? mg.progress : sfJobProgress;
                      const procStatus = mg.status || sfJobStatus || "Pending";
                      const isOutsource = mg.is_outsource || false;
                      const vendorName = mg.vendor_name || "";
                      const outsourceRate = mg.outsource_rate || 0;
                      const outsourceDeliveryDate = mg.outsource_delivery_date || "";

                      const exists = groupsMap[sectionKey].processes.some(
                        (p) => p.process_name === procName && p.process_index === procIndex
                      );

                      if (!exists) {
                        groupsMap[sectionKey].processes.push({
                          process_index: procIndex,
                          process_name: procName,
                          progress: procProgress,
                          status: procStatus,
                          is_outsource: isOutsource,
                          vendor_name: vendorName,
                          outsource_rate: outsourceRate,
                          outsource_delivery_date: outsourceDeliveryDate,
                        });
                      }
                    });
                  } else {
                    const groupName = sfJob.category || "General Section";
                    const sectionKey = sfJob.category || "General Section";
                    if (!groupsMap[sectionKey]) {
                      groupsMap[sectionKey] = {
                        group_id: sectionKey,
                        group_name: groupName,
                        processes: [],
                      };
                    }
                    groupsMap[sectionKey].processes.push({
                      process_index: "1.1",
                      process_name: jobProcName,
                      progress: sfJobProgress,
                      status: sfJobStatus,
                      is_outsource: false,
                      vendor_name: "",
                      outsource_rate: 0,
                      outsource_delivery_date: "",
                    });
                  }
                });

                return Object.values(groupsMap).map((grp) => {
                  grp.processes.sort((a, b) => {
                    const aIdx = parseFloat(a.process_index) || 0;
                    const bIdx = parseFloat(b.process_index) || 0;
                    return aIdx - bIdx;
                  });

                  const total = grp.processes.length;
                  const sum = grp.processes.reduce((acc, p) => acc + (Number(p.progress) || 0), 0);
                  const overallProgress = total > 0 ? Math.round(sum / total) : 0;

                  const allComp = grp.processes.every((p) => String(p.status).toLowerCase() === "completed");
                  const anyInProg = grp.processes.some(
                    (p) => String(p.status).toLowerCase() === "in progress" || String(p.status).toLowerCase() === "in-progress"
                  );

                  let overallStatus = "Pending";
                  if (allComp && total > 0) {
                    overallStatus = "Completed";
                  } else if (anyInProg || overallProgress > 0) {
                    overallStatus = "In Progress";
                  }

                  return {
                    ...grp,
                    overall_status: overallStatus,
                    overall_progress: overallProgress,
                  };
                }).sort((a, b) => {
                  const aNum = parseFloat(a.group_name) || parseFloat(String(a.group_id).replace("sec_", "")) || 0;
                  const bNum = parseFloat(b.group_name) || parseFloat(String(b.group_id).replace("sec_", "")) || 0;
                  return aNum - bNum;
                });
              };

              const workflowGroups = groupShopFloorProcesses(activeJobs);

              if (workflowGroups.length === 0) {
                return data.is_pushed_shop_floor ? (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 italic">
                    No active workstation processes found for this sub job number.
                  </div>
                ) : null;
              }

              return (
                <div className="pt-3 border-t border-slate-200 space-y-4">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <FactoryIcon fontSize="small" className="text-blue-600" />
                    Shop Floor Process Workflow ({workflowGroups.length} {workflowGroups.length === 1 ? "Section" : "Sections"}):
                  </span>

                  {workflowGroups.map((grp, gIdx) => (
                    <div
                      key={gIdx}
                      className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs"
                    >
                      {/* Group Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Section: <span className="text-blue-700 font-black">{grp.group_name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${grp.overall_status === "Completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : grp.overall_status === "In Progress"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                          >
                            Overall: {grp.overall_status}
                          </span>
                          <span className="text-xs font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {grp.overall_progress}%
                          </span>
                        </div>
                      </div>

                      {/* Group Overall Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${grp.overall_progress === 100
                            ? "bg-emerald-500"
                            : grp.overall_progress > 0
                              ? "bg-blue-600"
                              : "bg-slate-300"
                            }`}
                          style={{ width: `${Math.min(100, Math.max(0, grp.overall_progress))}%` }}
                        ></div>
                      </div>

                      {/* Process Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="text-slate-500 uppercase text-[10px] bg-slate-100 border-b border-slate-200">
                              <th className="py-2 px-2.5 font-extrabold w-12">#</th>
                              <th className="py-2 px-2.5 font-extrabold">Process Name</th>
                              <th className="py-2 px-2.5 font-extrabold">Progress</th>
                              <th className="py-2 px-2.5 font-extrabold text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grp.processes.map((proc, pIdx) => (
                              <tr
                                key={pIdx}
                                className="border-b border-slate-100 hover:bg-white transition-colors"
                              >
                                <td className="py-2 px-2.5 font-bold text-slate-500 whitespace-nowrap">
                                  {proc.process_index}
                                </td>
                                <td className="py-2 px-2.5 font-black text-slate-800">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{proc.process_name}</span>
                                    {proc.is_outsource && (
                                      <span className="bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-purple-200">
                                        Outsource{proc.vendor_name ? `: ${proc.vendor_name}` : ""}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 min-w-[120px]">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-1.5 rounded-full ${proc.progress === 100
                                          ? "bg-emerald-500"
                                          : proc.progress > 0
                                            ? "bg-blue-600"
                                            : "bg-slate-300"
                                          }`}
                                        style={{
                                          width: `${Math.min(100, Math.max(0, proc.progress))}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="font-bold text-slate-600 text-[11px] min-w-[28px] text-right">
                                      {proc.progress}%
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-right whitespace-nowrap">
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${proc.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : proc.status === "In Progress" ||
                                        proc.status === "In-Progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-amber-100 text-amber-800"
                                      }`}
                                  >
                                    {proc.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* ──── CONTROL TOWER OVERVIEWS: INWARD, QC, PACKING ──── */}
      {!isCSTab && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          {/* 1. INWARD OVERVIEW */}
          <div>
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
              Finished goods Overview
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DetailBox label="Order Qty" value={orderQty} bg="#fff" border="#E2E8F0" color="#0F172A" />
              <DetailBox label="Inward Qty" value={inwardQty} bg="#F0FDFA" border="#99F6E4" color="#0D9488" />
              <DetailBox label="Balance Qty" value={balanceInward} bg="#FFFBEB" border="#FDE68A" color="#B45309" />
              <DetailBox label="Handover to QC" value={qcHandover} bg="#FDF4FF" border="#F5D0FE" color="#C026D3" />
            </div>
          </div>

          {/* 2. QC OVERVIEW */}
          <div>
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
              QC Overview
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DetailBox label="Arrival (QC)" value={qcArrived} bg="#F8FAFC" border="#E2E8F0" color="#475569" />
              <DetailBox label="Failed (Bad)" value={qcBad} bg="#FEF2F2" border="#FECACA" color="#DC2626" />
              <DetailBox label="Packing Release" value={qcReleased} bg="#EFF6FF" border="#BFDBFE" color="#2563EB" />
              <DetailBox label="Rejection Cycle" value={qcRejected} bg="#FFFBEB" border="#FDE68A" color="#D97706" />
            </div>
          </div>

          {/* 3. PACKING & LOGISTICS OVERVIEW */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                📫 Packing &amp; Logistics Overview (Packing)
              </div>
              {currentPackStage && (
                <span
                  style={{
                    background: currentPackStage.bg,
                    color: currentPackStage.color,
                    border: `1px solid ${currentPackStage.border}`,
                  }}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase flex items-center gap-1"
                >
                  <span>{currentPackStage.icon}</span>
                  <span>Stage: {currentPackStage.label}</span>
                </span>
              )}
            </div>

            {/* 8-Stage CTPack Pipeline Tracker */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                Active Stage Pipeline Track
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                {PACK_STAGES.map((s, i) => {
                  const isDone = currentPackStageIdx > i;
                  const isCurrent = currentPackStageIdx === i;
                  return (
                    <React.Fragment key={s.id}>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 90,
                          background: isCurrent ? s.bg : isDone ? '#F1F5F9' : '#FFFFFF',
                          borderColor: isCurrent ? s.color : isDone ? '#CBD5E1' : '#E2E8F0',
                          opacity: isCurrent ? 1 : isDone ? 0.85 : 0.45,
                        }}
                        className="border-1.5 rounded-lg p-2 text-center transition-all"
                      >
                        <div className="text-sm mb-0.5">{isDone ? '✅' : s.icon}</div>
                        <div
                          style={{ color: isCurrent ? s.color : isDone ? '#334155' : '#94A3B8' }}
                          className="text-[10px] font-black uppercase leading-tight"
                        >
                          {s.label}
                        </div>
                      </div>
                      {i < PACK_STAGES.length - 1 && (
                        <div className="text-slate-400 text-xs flex-shrink-0">→</div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* CTPack Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <DetailBox label="Handover By QC" value={packReceivedQc} bg="#FFFBEB" border="#FDE68A" color="#D97706" />
              <DetailBox label="Bal to Inward" value={packBalToInward} bg="#FEF3C7" border="#FDE68A" color="#B45309" />
              <DetailBox label="Dispatched" value={packDispatched} bg="#F0FDFA" border="#99F6E4" color="#0D9488" />
              <DetailBox label="Box Count" value={`${packBoxCount} box(es)`} bg="#F5F3FF" border="#DDD6FE" color="#7C3AED" />
              <DetailBox label="Pack Status" value={packStatus} bg="#ECFDF5" border="#A7F3D0" color="#059669" />
            </div>
          </div>
        </div>
      )}

      {/* ──── SECTION 3: HOLD HISTORY RECORDS ──── */}
      {!isCSTab && !isFGTab && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HistoryIcon className="text-red-500" fontSize="small" />
            Hold History Records
          </h3>

          {data.hold_history && data.hold_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-600 uppercase text-[10px] border-b border-slate-200">
                    <th className="py-2 px-2 font-bold">Reason</th>
                    <th className="py-2 px-2 font-bold">Hold By</th>
                    <th className="py-2 px-2 font-bold">Start Date</th>
                    <th className="py-2 px-2 font-bold">Unhold By</th>
                    <th className="py-2 px-2 font-bold">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hold_history.map((hold, idx) => (
                    <tr key={idx} className="border-b border-slate-100 text-slate-800">
                      <td className="py-2.5 px-2 font-bold text-red-600 break-words whitespace-normal">{hold.reason || "N/A"}</td>
                      <td className="py-2.5 px-2 font-bold break-words whitespace-normal">{hold.hold_by?.name || "N/A"}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{formatDateTime(hold.start_time)}</td>
                      <td className="py-2.5 px-2 font-bold break-words whitespace-normal">{hold.unhold_by?.name || (hold.end_time ? "N/A" : "-")}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{hold.end_time ? formatDateTime(hold.end_time) : (hold.start_time ? "Ongoing" : "N/A")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic py-2">No hold history records found for this job.</p>
          )}
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <ImageLightbox
          src={previewImage}
          fileName="Proof Preview"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

const JobProgressOverviewDrawer = ({ show, onClose, data }) => {
  if (!show || !data) return null;

  const jobNo = data?.sub_job_no || data?.job_no || data?.id || "N/A";
  const referenceNo = data?.reference_no || data?.soNo || (typeof data?.enquiry_id === "object" ? data?.enquiry_id?.reference_no : null) || null;
  const productName = data?.product_name || data?.product || "Job Progress Overview";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-white text-slate-600 h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left border-l border-slate-200" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <span className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex-shrink-0">
              {jobNo}{referenceNo ? ` - ${referenceNo}` : ""}
            </span>
            {data.is_on_hold && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0">
                <PauseCircleIcon fontSize="inherit" /> ON HOLD
              </span>
            )}
            <div className="text-sm sm:text-base font-extrabold text-white truncate min-w-0">
              Job Progress Overview &mdash; <span className="text-blue-300 font-extrabold">{productName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex-shrink-0 ml-2"
          >
            <CloseIcon fontSize="medium" />
          </button>
        </div>

        {/* Scrollable Content Body (WHITE SCREEN) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white text-slate-600 scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-50 scroll-auto">
          <JobProgressOverviewContent data={data} />
        </div>

      </div>
    </div>
  );
};

export default JobProgressOverviewDrawer;
