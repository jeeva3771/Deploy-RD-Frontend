import React, { useState } from "react";
import { isOverdue, formatDayMonth } from '../../../utils/dateUtils';
import {
  getStatusBadge,
  getStatusText,
} from "../../../utils/enquiry/statusHelpers";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import DeliveryPriorityColor from "../../../components/deliveryPriorityColor/priorityColor";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import Button from "@mui/material/Button";
import DesignerFileUploadModal from "./DesignerFileUploadModal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadIcon from "@mui/icons-material/Upload";
import { getFileName } from "../../../utils/helper/FilenameURL";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AssignProductionModal from "./AssignProductionModal";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import ProductViewActionDrawer from "./ProductViewActionDrawer";
import JobProgressOverviewDrawer from "./JobProgressOverviewDrawer";
import { useDispatch } from "react-redux";
import { useAuthData } from "../../../utils/hooks/useAuthData";
import { holdSampleOrder, unholdSampleOrder } from "../../../reducer/sampleSalesorderReducer";
import HoldModal from "../../components/HoldModal";
import UnholdModal from "../../components/UnholdModal";
import { toast } from "react-toastify";
import { updateSampleOrderById } from "../../../reducer/sampleSalesorderReducer";
import EditIcon from "@mui/icons-material/Edit";
import ImageLightbox from "../../common/ImageLightbox";

const SampleorderCard = ({
  sampleOrder,
  navigate,
  Enquirysmoduleonly = false,
  handleUpdate,
  requestedfiles = false,
  handleUpdateapproveddesign,
  handleUpdateapprovedfiledesign,
  requestedaccountsfiles = false,
  handleUpdatepifiles,
  Enquirypageonly = false,
  AccountTabActivated = false,
  handleVerifyPI,
  Designheadpage = false,
  onView,
  Accountpageonly = false,
  handleAssignproductionteam,
  showdesignerfiles = false,
  prouductionmember = false,
  requestedquotaion = false,
  QuotatationTabActivated = false,
  handleVerifyQuotation,
  Quotationpageonly = false,
  onViewQuote,
  AdminRole,
  onAssignSuccess,
  Viewonlybom = false,
  fetchSampleorders,
  hideDates = false,
  ReprocessedTabActivated = false,
  handleVerifyReprocessed,
  JobInProgressActivated = false,
  DispatchActivated = false,
  isProductionHub = false,
  isProductionComplete = false,
}) => {
  const {
    is_sales_order_filled,
    is_design_uploaded,
    is_pi_uploaded,
    is_pi_verified,
    is_pi_rework,
    Pi_files,
    is_bom_filled,
    is_bom_verified,
    quatation_files,
    is_bom_rework,
    margin,
    marginType,
    finalUnitPrice,
  } = sampleOrder;

  const [openFilesModal, setOpenFilesModal] = useState(false);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const [openViewActionDrawer, setOpenViewActionDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const dispatch = useDispatch();
  const { isHead, SalesRole, AdminRole: authAdmin } = useAuthData();
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [unholdModalOpen, setUnholdModalOpen] = useState(false);
  const [holdHistoryModalOpen, setHoldHistoryModalOpen] = useState(false);
  const [openOverviewDrawer, setOpenOverviewDrawer] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editJobCompletionDate, setEditJobCompletionDate] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editRemark, setEditRemark] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const canHoldUnhold = AdminRole || authAdmin || (Enquirypageonly && SalesRole && isHead);
  const isCompletedView = DispatchActivated || isProductionComplete || Boolean(sampleOrder.is_dispatched || sampleOrder.status === 'dispatched' || sampleOrder.status === 'shipped' || sampleOrder.status === 'complete');

  // --- 1. derived state for UI logic ---
  // Check if specific steps in the workflow are pending or completed
  const showDesignRequest = is_sales_order_filled && !is_design_uploaded;
  const showDesignRequestupploded = is_sales_order_filled && is_design_uploaded;

  const showPIRequest = is_sales_order_filled && !is_pi_uploaded;
  const showPIRequestupload = is_sales_order_filled && is_pi_uploaded;

  const showQuotaionRequestupload = is_sales_order_filled && is_bom_filled;
  const showQuotationRequest = is_sales_order_filled && !is_bom_filled;
  const showQuotationupploded = is_sales_order_filled && is_bom_filled;

  // Verification states
  const piverified = is_sales_order_filled && is_pi_uploaded && is_pi_verified;
  const quotationverified =
    is_sales_order_filled && is_bom_filled && is_bom_verified;

  const allCompleted =
    is_sales_order_filled && is_design_uploaded && is_pi_uploaded && piverified;

  // --- 2. Margin Verification Logic ---
  // Calculates if margin is sufficient (< 45% flag) based on currency or percentage
  let marginVerify;
  let marginPercent;

  if (marginType === "%") {
    marginPercent = Number(margin);
    marginVerify = marginPercent < 45;
  }

  if (marginType === "₹") {
    const finalPrice = Number(finalUnitPrice);
    const marginValue = Number(margin);
    const price = finalPrice - marginValue;

    if (price > 0) {
      marginPercent = (marginValue / price) * 100;
      marginVerify = marginPercent < 45;
    } else {
      marginVerify = false;
      marginPercent = 0;
    }
  }

  // Permissions & Rework Flags
  const accesstoverifyquotation = AdminRole && marginVerify;
  const reworkpifiles = !is_pi_rework && Pi_files.length > 0;
  const reworkquotattionfiles = !is_bom_rework && quatation_files.length > 0;

  // Handle image array (if multiple images exist)
  const images = Array.isArray(sampleOrder.images)
    ? sampleOrder.images
    : [sampleOrder.image];
  const validImages = images.filter((img) => img);

  const op = sampleOrder.is_bom_rework === true;

  const optionss = op || Viewonlybom ? "view" : "add";

  const handleHoldSubmit = async (reason) => {
    try {
      await dispatch(holdSampleOrder({ id: sampleOrder.id, reason })).unwrap();
      toast.success("Job put on hold");
      setHoldModalOpen(false);
      if (fetchSampleorders) fetchSampleorders();
    } catch (error) {
      toast.error(error || "Failed to hold job");
    }
  };

  const handleUnholdSubmit = async (data) => {
    try {
      await dispatch(unholdSampleOrder({ id: sampleOrder.id, ...data })).unwrap();
      toast.success("Job unhold successfully");
      setUnholdModalOpen(false);
      if (fetchSampleorders) fetchSampleorders();
    } catch (error) {
      toast.error(error || "Failed to unhold job");
    }
  };

  const handleOpenEditModal = () => {
    // Pre-fill with current values
    // delivery_date and job_completion_datetime are stored as "DD-MM-YYYY" or ISO – normalise to YYYY-MM-DD for the date input
    const toInputDate = (val) => {
      if (!val) return "";
      if (val.includes("T")) val = val.split("T")[0]; // strip time
      const parts = val.split("-");
      if (parts.length === 3 && parts[0].length === 2) {
        // DD-MM-YYYY → YYYY-MM-DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return val; // already YYYY-MM-DD
    };
    setEditDeliveryDate(toInputDate(sampleOrder.delivery_date || sampleOrder.delivery_date));
    setEditJobCompletionDate(toInputDate(sampleOrder.job_completion_datetime));
    setEditQuantity(sampleOrder.job_quantity ?? sampleOrder.product_quantity ?? "");
    setEditRemark("");
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    // Validate remark is mandatory
    if (!editRemark.trim()) {
      toast.error("Remark is required before saving.");
      return;
    }

    // Validation: Delivery Date should not be prior to Job Completion Date
    if (editDeliveryDate && editJobCompletionDate) {
      if (new Date(editDeliveryDate) < new Date(editJobCompletionDate)) {
        toast.error("Delivery Date cannot be earlier than Job Completion Date");
        return;
      }
    }
    setEditSaving(true);
    try {
      const toStorageDate = (val) => {
        if (!val) return val;
        // convert YYYY-MM-DD → DD-MM-YYYY for storage consistency
        const parts = val.split("-");
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return val;
      };

      const payload = {};
      if (editDeliveryDate) payload.delivery_date = toStorageDate(editDeliveryDate);
      if (editJobCompletionDate) payload.job_completion_datetime = toStorageDate(editJobCompletionDate);
      if (editQuantity !== "") payload.job_quantity = Number(editQuantity);

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        setEditModalOpen(false);
        return;
      }

      // Always include remark
      payload.remark = editRemark.trim();

      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

      await dispatch(updateSampleOrderById({ id: sampleOrder.id, formData })).unwrap();
      toast.success("Updated successfully!");
      setEditModalOpen(false);
      if (fetchSampleorders) fetchSampleorders();
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };


  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
        {/* Top colored border */}
        {!DispatchActivated && !isProductionComplete && (
          <DeliveryPriorityColor
            deliveryDate={sampleOrder.delivery_date}
            className="h-2 w-full"
          />
        )}
        <div className="p-3 sm:p-4 flex flex-col h-full">
          {/* Header Section */}
          <div className="mb-2 sm:mb-3">
            {/* First Row - Flexible layout for mobile */}
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <div className="flex-1 min-w-[102px]">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1">
                  {sampleOrder.sub_job_no}{sampleOrder.enquiry_id?.reference_no ? ` - ${sampleOrder.enquiry_id?.reference_no}` : ""}
                </h3>
                {/* <p className="text-xs text-slate-600 font-semibold truncate mb-1">
                  <i className="fa-regular fa-building mr-1 text-slate-400"></i>
                  {sampleOrder.client_name || sampleOrder.enquiry_id?.name || '—'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Created by: {sampleOrder.enquiry_id?.created_by?.name || '—'}
                </p> */}
              </div>

              {/* Badges Container - Wraps on small screens */}
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {DispatchActivated ? (
                  <span className="sm:text-[10px] px-1 py-0.5 font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300 whitespace-nowrap shadow-sm">
                    DISPATCHED
                  </span>
                ) : isProductionComplete ? (
                  <span className="sm:text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-300 whitespace-nowrap shadow-sm">
                    COMPLETED
                  </span>
                ) : (
                  <>
                    {sampleOrder.is_on_hold && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-red-100 text-red-600 border border-red-200 whitespace-nowrap">
                        ON HOLD
                      </span>
                    )}

                    <DeliveryPriorityColor
                      deliveryDate={sampleOrder.delivery_date}
                      as="span"
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                      style={{ color: "#f6f2f2ff" }}
                      showPriorityName={true}
                    >
                      {getStatusText(sampleOrder.status)}
                    </DeliveryPriorityColor>
                  </>
                )}
              </div>
            </div>

            {/* Second Row - Centered Product Name - RESPONSIVE */}
            <div className="text-center mt-1">
              <p className="font-bold text-slate-800 text-base sm:text-lg truncate px-2">
                {capitalizeFirst(
                  sampleOrder.product_name ||
                  sampleOrder.enquiry_id?.product_name,
                )}
              </p>
            </div>
          </div>

          {/* Image Section with Carousel */}
          <div
            className="mb-4 relative h-40 overflow-hidden"
          >
            {validImages.length > 0 ? (
              <>
                <div className="flex overflow-x-auto h-full w-full snap-x snap-mandatory scrollbar-hide relative z-0">
                  <img
                    src={validImages[imageIndex] || validImages[0]}
                    alt={
                      sampleOrder.product_name ||
                      sampleOrder.enquiry_id?.product_name
                    }
                    loading="lazy"
                    className="w-full h-full flex-shrink-0 object-cover snap-center cursor-zoom-in"
                    onClick={() => setPreviewImage(validImages[imageIndex] || validImages[0])}
                  />
                </div>

                {/* Image dots indicator */}
                {validImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-1 rounded-full bg-black/20 backdrop-blur-sm">
                    {validImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${idx === imageIndex
                          ? "bg-white shadow-sm"
                          : "bg-white/50"
                          }`}
                        onClick={() => setImageIndex(idx)}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation arrows */}
                {validImages.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 transition-all z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex((prev) =>
                          prev === 0 ? validImages.length - 1 : prev - 1,
                        );
                      }}
                    >
                      <i className="fa-solid fa-chevron-left text-gray-700 text-xs"></i>
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 transition-all z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(
                          (prev) => (prev + 1) % validImages.length,
                        );
                      }}
                    >
                      <i className="fa-solid fa-chevron-right text-gray-700 text-xs"></i>
                    </button>
                  </>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/5 transition-all z-0"></div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <i className="fa-solid fa-image text-3xl mb-2"></i>
                  <p className="text-xs">No Image</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-3 border-b border-gray-100 pb-3">
            {/* First Row: QTY, Type, Delivery */}
            <div className="flex justify-between text-sm">
              {/* QTY */}
              <div>
                <span className="text-gray-400 text-xs uppercase block font-semibold">
                  QTY
                </span>
                <span className="font-bold text-slate-700">
                  {sampleOrder.job_quantity ??
                    sampleOrder.product_quantity ??
                    "-"}
                </span>
              </div>

              {/* DESIGNER */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase block font-semibold">DESIGNER</span>
                <div className="text-xs text-slate-700 font-bold flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] flex-shrink-0">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <span className="truncate max-w-[80px]">
                    {sampleOrder.designer_person?.length > 0
                      ? sampleOrder.designer_person[sampleOrder.designer_person.length - 1]?.name || "—"
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Type */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs capitalize font-semibold inline-block
          ${sampleOrder.type === "sample"
                      ? "bg-blue-100 text-blue-700"
                      : sampleOrder.type === "production"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                >
                  {sampleOrder.type ?? "-"}
                </span>
              </div>

              {/* Delivery */}
              <div className="text-right">
                <span className="text-gray-400 text-xs uppercase block font-semibold">
                  DELIVERY
                </span>
                <span
                  className={`font-bold ${isOverdue(sampleOrder.delivery_date) ? "text-red-600" : "text-slate-700"}`}
                >
                  {formatDayMonth(sampleOrder.delivery_date) || "-"}
                </span>
              </div>
            </div>

            {/* Second Row: Production Person */}
            {sampleOrder.production_team_person && prouductionmember && (
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                <i className="fa-solid fa-user text-[10px]"></i>
                <span>
                  Production Person: {sampleOrder.production_team_person.name}
                </span>
              </div>
            )}
          </div>

          {/* Type Badge */}
          {/* {Enquirysmoduleonly && (
            <div className="mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold inline-block
                  ${sampleOrder.type === "sample" ? "bg-blue-100 text-blue-700"
                  : sampleOrder.type === "production" ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"}`}
              >
                {sampleOrder.type}
              </span>
            </div>
          )} */}

          {/* Workflow Status Section */}
          {Enquirysmoduleonly && Enquirypageonly && !JobInProgressActivated && !DispatchActivated && (
            <div className="flex-1 mb-4 min-h-[120px]">
              <div
                className="bg-slate-50 rounded-lg h-full max-h-48 overflow-hidden flex flex-col"
                style={{ border: "1px solid #e2e8f0" }}
              >
                <div
                  className="bg-slate-100 px-3 py-2 flex justify-between items-center flex-shrink-0"
                  style={{
                    border: "1px solid #e2e8f0",
                    backgroundColor: "rgb(241 245 249)",
                  }}
                >
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Status
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">
                    {allCompleted ? "Complete" : "Progress"}
                  </span>
                </div>

                <div className="p-3 overflow-y-auto workflow-scroll space-y-2 flex-1">
                  {/* Design Status */}
                  {showDesignRequest &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                        <i className="fa-regular fa-circle-xmark text-sm"></i>
                        <span>Design Files Requested</span>
                      </div>
                    )}
                  {showDesignRequestupploded &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                        <i className="fa-solid fa-circle-check text-sm"></i>
                        <span>Design Files Uploaded</span>
                      </div>
                    )}

                  {/* Quotation Status */}
                  {showQuotationRequest &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                        <i className="fa-regular fa-circle-xmark text-sm"></i>
                        <span>Quotation Requested</span>
                      </div>
                    )}
                  {showQuotationupploded &&
                    reworkquotattionfiles &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                        <i className="fa-regular fa-circle-xmark text-sm"></i>
                        <span>Quotation Rework</span>
                      </div>
                    )}
                  {showQuotationupploded &&
                    !reworkquotattionfiles &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                        <i className="fa-solid fa-circle-check text-sm"></i>
                        <span>Quotation Uploaded</span>
                      </div>
                    )}

                  {/* Quotation Verify */}
                  {showQuotaionRequestupload &&
                    !QuotatationTabActivated &&
                    !reworkquotattionfiles &&
                    !AccountTabActivated && (
                      <div
                        className={`flex items-center gap-2 text-xs font-medium ${quotationverified ? "text-green-600" : "text-red-600"}`}
                      >
                        <i
                          className={
                            quotationverified
                              ? "fa-solid fa-circle-check text-sm"
                              : "fa-regular fa-circle-xmark text-sm"
                          }
                        ></i>
                        <span>Quotation Verify</span>
                      </div>
                    )}

                  {/* PI Status */}
                  {showPIRequest &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                        <i className="fa-regular fa-circle-xmark text-sm"></i>
                        <span>PI Requested</span>
                      </div>
                    )}
                  {showPIRequestupload &&
                    !reworkpifiles &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                        <i className="fa-solid fa-circle-check text-sm"></i>
                        <span>PI Files Uploaded</span>
                      </div>
                    )}
                  {showPIRequestupload &&
                    reworkpifiles &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                        <i className="fa-regular fa-circle-xmark text-sm"></i>
                        <span>PI Rework</span>
                      </div>
                    )}

                  {/* PI Verify */}
                  {showPIRequestupload &&
                    !AccountTabActivated &&
                    !QuotatationTabActivated && (
                      <div
                        className={`flex items-center gap-2 text-xs font-medium ${piverified ? "text-green-600" : "text-red-600"}`}
                      >
                        <i
                          className={
                            piverified
                              ? "fa-solid fa-circle-check text-sm"
                              : "fa-regular fa-circle-xmark text-sm"
                          }
                        ></i>
                        <span>PI Verify</span>
                      </div>
                    )}

                  {/* Reprocessed Quotation Verification Pending */}
                  {(sampleOrder.is_pushed_shop_floor === true || sampleOrder.is_pushed_shop_floor === 'true') && sampleOrder.is_qty_pending_approval && (
                    sampleOrder.is_reprocessed_approved ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                        <i className="fa-solid fa-circle-check text-sm"></i>
                        <span>Reprocessed Quotation Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                        <i className="fa-regular fa-circle-xmark text-sm"></i>
                        <span>Reprocessed Quotation Verification Pending</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- 4. ACTION BUTTONS SECTION --- */}
          {/* This section renders buttons dynamically based on which module is active */}
          <div className="grid grid-cols-2 gap-2 mt-auto flex-shrink-0">

            {/* A. View Order Button - Always Visible */}
            {/* <button
              className="py-2 px-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm font-medium transition flex items-center justify-center gap-2"
              onClick={() => {
                if (Accountpageonly) onView(sampleOrder);
                else if (Quotationpageonly) onViewQuote(sampleOrder);
                else if (onView) onView(sampleOrder);
              }}
            >
              <VisibilityIcon fontSize="small" />
              <span>View</span>
            </button> */}
            {/* A. View Order Button for Enquiry (JobInProgress/Dispatch) or Accounts or Quotation or Generic onView */}
            {((Accountpageonly || Quotationpageonly || onView || (Enquirypageonly && (JobInProgressActivated || DispatchActivated))) && !isProductionHub) && (
              <button
                className="py-2 px-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm font-medium transition flex items-center justify-center gap-2"
                onClick={() => {
                  if (JobInProgressActivated || DispatchActivated) {
                    setOpenOverviewDrawer(true);
                  } else if (Quotationpageonly && typeof onViewQuote === 'function') {
                    onViewQuote(sampleOrder);
                  } else if (typeof onView === 'function') {
                    onView(sampleOrder);
                  } else {
                    setSelectedProduct(sampleOrder);
                    setOpenViewActionDrawer(true);
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
                <span>View</span>
              </button>
            )}

            {/* View Designer Files */}
            {showdesignerfiles && Array.isArray(sampleOrder.designer_files) && sampleOrder.designer_files.length > 0 && (
              <button
                onClick={() => setOpenFilesModal(true)}
                className="py-2 px-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600 shadow-md text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <VisibilityIcon fontSize="small" />
                <span>Designer Files</span>
              </button>
            )}

            {showdesignerfiles && Array.isArray(sampleOrder.designer_files) && (
              <button
                onClick={() => {
                  setSelectedProduct(sampleOrder);
                  setOpenViewActionDrawer(true);
                }}
                className="py-2 px-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 shadow-md text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <VisibilityIcon fontSize="small" />
                <span>View/Action</span>
              </button>
            )}

            {/* Prepare BOM */}
            {requestedquotaion && !JobInProgressActivated && !sampleOrder.is_on_hold && (
              <div className={optionss === "view" ? "flex gap-2 w-full" : "w-full"}>
                <button
                  className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm hover:shadow ${optionss === "view" ? "flex-1" : "w-full"}`}
                  style={{ backgroundColor: "#7C3AED" }} // vibrant violet
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#6D28D9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#7C3AED")
                  }
                  onClick={() =>
                    navigate(
                      `/quotation/${optionss}/${sampleOrder.id}/${sampleOrder.bom_nanoid}`,
                    )
                  }
                >
                  <DescriptionIcon fontSize="small" />
                  <span> {op || Viewonlybom ? "View Bom" : "Prepare BOM"}</span>
                </button>
              </div>
            )}

            {/* Upload Files */}
            {requestedfiles && !JobInProgressActivated && !sampleOrder.is_on_hold && (
              <button
                className="py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow text-sm font-medium transition flex items-center justify-center gap-2"
                onClick={() => {
                  if (handleUpdateapproveddesign) {
                    handleUpdateapproveddesign(sampleOrder.id);
                  } else if (handleUpdateapprovedfiledesign) {
                    handleUpdateapprovedfiledesign(sampleOrder.id);
                  }
                }}
              >
                <UploadIcon fontSize="small" />
                <span>Upload</span>
              </button>
            )}

            {/* F. Upload PI Button (Accounts Module) */}
            {requestedaccountsfiles && !JobInProgressActivated && !sampleOrder.is_on_hold && (
              <button
                className="py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow text-sm font-medium transition flex items-center justify-center gap-2"
                onClick={() => handleUpdatepifiles(sampleOrder.id)}
              >
                <UploadIcon fontSize="small" />
                <span>Upload PI</span>
              </button>
            )}

            {/* Update Sales Order */}
            {!is_sales_order_filled && !AccountTabActivated && !JobInProgressActivated && !sampleOrder.is_on_hold && (
              <button
                className="py-2 px-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 shadow-md text-sm font-medium transition flex items-center justify-center gap-2 col-span-2"
                onClick={() =>
                  navigate(
                    `/sampleorderform/${sampleOrder.id}/${sampleOrder.type}`,
                  )
                }
              >
                <EditNoteOutlinedIcon fontSize="small" />
                <span>Update</span>
              </button>
            )}

            {/* Verify PI */}
            {Enquirypageonly &&
              showPIRequestupload &&
              AccountTabActivated &&
              !piverified && !sampleOrder.is_on_hold && (
                <button
                  onClick={() =>
                    handleVerifyPI(
                      sampleOrder.Pi_files,
                      sampleOrder.id,
                      sampleOrder,
                    )
                  }
                  className="py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm font-medium transition col-span-2"
                >
                  Verify PI
                </button>
              )}

            {/* Verify Quotation */}
            {Enquirypageonly &&
              showQuotaionRequestupload &&
              QuotatationTabActivated &&
              !quotationverified &&
              (accesstoverifyquotation || !marginVerify) && !sampleOrder.is_on_hold && (
                <button
                  onClick={() =>
                    handleVerifyQuotation(
                      sampleOrder.quatation_files,
                      sampleOrder.id,
                      sampleOrder,
                    )
                  }
                  className="py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm font-medium transition col-span-2"
                >
                  Verify Quotation
                </button>
              )}

            {/* Verify Reprocessed Quotation */}
            {Enquirypageonly &&
              ReprocessedTabActivated &&
              !sampleOrder.is_reprocessed_approved &&
              !sampleOrder.is_on_hold && (
                <button
                  onClick={() => handleVerifyReprocessed(sampleOrder)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-sm font-semibold transition col-span-2 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DescriptionIcon fontSize="small" />
                  <span>Verify Reprocessed Quotation</span>
                </button>
              )}

            {/* Admin Confirmation Needed */}
            {Enquirypageonly &&
              showQuotaionRequestupload &&
              QuotatationTabActivated &&
              !quotationverified &&
              marginVerify && (
                <div className="col-span-2 text-xs text-red-600 font-semibold text-center">
                  <i className="fa-solid fa-circle-xmark mr-1"></i>
                  Admin confirmation needed
                  {accesstoverifyquotation && (
                    <span className="text-blue-600 ml-1">
                      (
                      {marginType === "%"
                        ? `${marginPercent.toFixed(2)}`
                        : marginPercent.toFixed(2)}
                      % margin)
                    </span>
                  )}
                </div>
              )}

            {/* K. Proceed Button */}
            {Enquirysmoduleonly && allCompleted && !JobInProgressActivated && !DispatchActivated && !sampleOrder.is_on_hold &&
              ((sampleOrder.is_pushed_shop_floor !== true && sampleOrder.is_pushed_shop_floor !== 'true') || !sampleOrder.is_qty_pending_approval || sampleOrder.is_reprocessed_approved) && (
                <button
                  className="py-2 px-3 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow text-sm font-medium transition col-span-2"
                  onClick={() => handleUpdate(sampleOrder.id)}
                >
                  Proceed
                </button>
              )}

            {/* Assign Production */}
            {requestedquotaion &&
              prouductionmember &&
              !sampleOrder.production_team_person && !sampleOrder.is_on_hold && (
                <button
                  className="py-2 px-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600 shadow-md text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm hover:shadow"
                  onClick={() => setOpenAssignModal(true)}
                >
                  <PersonIcon fontSize="small" />
                  <span>Assign</span>
                </button>
              )}

            {/* Hold Button */}
            {!sampleOrder.is_on_hold && canHoldUnhold && !isCompletedView && (
              <button
                className="py-2 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium transition flex items-center justify-center gap-2"
                onClick={() => setHoldModalOpen(true)}
              >
                <i className="fa-solid fa-pause"></i>
                <span>Hold</span>
              </button>
            )}

            {/* Unhold Button */}
            {sampleOrder.is_on_hold && canHoldUnhold && !isCompletedView && (
              <button
                className="py-2 px-3 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 text-sm font-medium transition flex items-center justify-center gap-2"
                onClick={() => setUnholdModalOpen(true)}
              >
                <i className="fa-solid fa-play"></i>
                <span>Unhold</span>
              </button>
            )}

            {/* Edit Button - visible when the sales order is already filled */}
            {((authAdmin || AdminRole || SalesRole) && Enquirysmoduleonly || prouductionmember) && is_sales_order_filled && !JobInProgressActivated && !isCompletedView && (
              <button
                className="py-2 px-3 rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2"
                style={{ backgroundColor: "#4B5563" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#374151")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4B5563")}
                onClick={handleOpenEditModal}
              >
                <EditIcon fontSize="small" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Designer Files Modal */}
      {openFilesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <button
              onClick={() => setOpenFilesModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <CloseIcon style={{ fontSize: 26 }} />
            </button>

            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <InsertDriveFileIcon className="text-blue-500" />
              Designer Files
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {sampleOrder.designer_files.map((file, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <InsertDriveFileIcon className="text-gray-600 flex-shrink-0" />
                    <span className="text-gray-800 text-sm font-medium truncate max-w-[200px] sm:max-w-[260px]">
                      {getFileName(file)}
                    </span>
                  </div>
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <OpenInNewIcon className="!text-[20px]" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!JobInProgressActivated && (
        <ProductViewActionDrawer
          show={openViewActionDrawer}
          onClose={() => setOpenViewActionDrawer(false)}
          data={sampleOrder}
          fetchSampleorders={fetchSampleorders}
        />
      )}

      {/* New Overview Drawer for Job In Progress */}
      <JobProgressOverviewDrawer
        show={openOverviewDrawer}
        onClose={() => setOpenOverviewDrawer(false)}
        data={sampleOrder}
      />

      {/* Hold History Modal for Job In Progress */}
      {holdHistoryModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setHoldHistoryModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-blue-500"></i>
                Hold History &mdash; {sampleOrder.sub_job_no || sampleOrder.job_no}
              </h3>
              <button
                onClick={() => setHoldHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <CloseIcon style={{ fontSize: 22 }} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 font-medium">
              Product: <span className="font-semibold text-slate-700">{sampleOrder.product_name || sampleOrder.enquiry_id?.product_name || "—"}</span>
            </p>

            {sampleOrder.hold_history && sampleOrder.hold_history.length > 0 ? (
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {sampleOrder.hold_history.map((hold, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-red-600 flex items-center gap-1">
                        <i className="fa-solid fa-pause text-[10px]"></i> Reason: {hold.reason || "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Hold By:</span>
                        <span className="font-medium text-slate-800">{hold.hold_by?.name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Start Date:</span>
                        <span className="font-medium text-slate-800">{hold.start_time || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Unhold By:</span>
                        <span className="font-medium text-slate-800">{hold.unhold_by?.name || (hold.end_time ? "N/A" : "-")}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">End Date:</span>
                        <span className="font-medium text-slate-800">{hold.end_time || (hold.start_time ? "Ongoing" : "N/A")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm italic">
                No hold history records found for this job.
              </div>
            )}

            <div className="mt-5 text-right">
              <button
                onClick={() => setHoldHistoryModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <HoldModal
        open={holdModalOpen}
        onClose={() => setHoldModalOpen(false)}
        onConfirm={handleHoldSubmit}
        jobId={sampleOrder.sub_job_no}
      />

      <UnholdModal
        open={unholdModalOpen}
        onClose={() => setUnholdModalOpen(false)}
        onConfirm={handleUnholdSubmit}
        enquiry={sampleOrder}
        type="order"
        currentDate={sampleOrder.delivery_date}
        currentJobCompletionDate={sampleOrder.job_completion_datetime}
        hideDates={hideDates}
        proceedShowDate={is_sales_order_filled}
      />

      {/* Assign Production Modal */}
      <AssignProductionModal
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        sampleOrderId={sampleOrder.id}
        // onAssignSuccess={() => {}}
        onAssignSuccess={onAssignSuccess}
      />

      {/* Edit Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <EditIcon className="text-blue-500" fontSize="small" />
                Edit Order Details
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <CloseIcon style={{ fontSize: 22 }} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
              {sampleOrder.sub_job_no} &mdash; {sampleOrder.product_name || sampleOrder.enquiry_id?.product_name}
            </p>

            {/* Job Completion Date */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Job Completion Date
              </label>
              <input
                type="date"
                value={editJobCompletionDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEditJobCompletionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Delivery Date */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Delivery Date
              </label>
              <input
                type="date"
                value={editDeliveryDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEditDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter quantity"
              />
            </div>

            {/* Remark - Mandatory */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none ${!editRemark.trim() ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                placeholder="Enter reason / remark for this change (required)"
              />
              {/* {!editRemark.trim() && (
                <p className="text-[10px] text-red-500 mt-0.5">Remark is mandatory.</p>
              )} */}
            </div>

            {/* Remark History */}
            {/* {Array.isArray(sampleOrder.edit_remarks) && sampleOrder.edit_remarks.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Remark History
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {[...sampleOrder.edit_remarks].reverse().map((r, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-slate-700">{r.edited_by?.name || "User"}</span>
                        <span className="text-gray-400 text-[10px]">{r.edited_at || ""}</span>
                      </div>

                      {Array.isArray(r.field_changes) && r.field_changes.length > 0 && (
                        <div className="mb-1.5 border border-slate-200 rounded overflow-hidden">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-500 uppercase">
                                <th className="text-left px-2 py-1 font-semibold w-1/3">Field</th>
                                <th className="text-left px-2 py-1 font-semibold w-1/3 text-red-500">Before</th>
                                <th className="text-left px-2 py-1 font-semibold w-1/3 text-green-600">After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.field_changes.map((fc, fi) => (
                                <tr key={fi} className="border-t border-slate-100">
                                  <td className="px-2 py-1 text-slate-600 font-medium">{fc.field}</td>
                                  <td className="px-2 py-1 text-red-500">{fc.before || "—"}</td>
                                  <td className="px-2 py-1 text-green-600 font-semibold">{fc.after || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <p className="text-slate-600 italic">"{r.remark}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        src={previewImage}
        fileName={sampleOrder.sub_job_no || "Product Image"}
        onClose={() => setPreviewImage(null)}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .workflow-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .workflow-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .workflow-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
};

export default SampleorderCard;
