import React, { useEffect, useState } from "react";
import {
  getStatusBadge,
  getStatusText,
} from "../../utils/enquiry/statusHelpers";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../utils/url/config";
import { toast } from "react-toastify";
import DeliveryPriorityColor from "../../components/deliveryPriorityColor/priorityColor";
import { capitalizeFirst } from "../../utils/helper/capitalize";
import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled';
import { markEnquiryAbandon, markEnquiryRedo } from "../../reducer/enquiryReducer";
import { useDispatch } from "react-redux";
import ConfirmAbandonModal from "./ConfirmAbondonModal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Typography } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import Modal from "./DesignAttachmentModel";
import ZoomModal from "./DesignZoomModal";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HoldModal from "./HoldModal";
import UnholdModal from "./UnholdModal";
import { holdEnquiry, unholdEnquiry } from "../../reducer/enquiryReducer";
import { useAuthData } from "../../utils/hooks/useAuthData";
import ImageLightbox from "../common/ImageLightbox";


const ViewModal = ({
  enquiry,
  onClose,
  showimagetable = false,
  handleAcceptReject,
  showadminbuttons = false,
  designheadviewdesign = false,
  Designerviewaccess = false,
  fetchEnquiries,
  AssociateRole = false,
  onUserAction,
  reassigndesignerbutton = false,
  onCountRefresh,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [images, setImages] = useState(enquiry.images || []);
  const [showConfirm, setShowConfirm] = useState(false);

  const [zoomImage, setZoomImage] = useState(null);




  const dispatch = useDispatch();
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [unholdModalOpen, setUnholdModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { userId, userRole, isHead, SalesRole, AdminRole } = useAuthData();

  const handleHoldSubmit = async (reason) => {
    try {
      await dispatch(holdEnquiry({ id: enquiry.id, reason, hold_all_sub_jobs: true })).unwrap();
      toast.success("Enquiry and all sub-jobs put on hold");
      setHoldModalOpen(false);
      if (fetchEnquiries) fetchEnquiries();
      if (onCountRefresh) onCountRefresh();
      onClose();
    } catch (error) {
      toast.error(error || "Failed to hold enquiry");
    }
  };

  const handleUnholdSubmit = async (data) => {
    try {
      await dispatch(unholdEnquiry({ id: enquiry.id, ...data, hold_all_sub_jobs: true })).unwrap();
      toast.success("Enquiry and all sub-jobs unhold successfully");
      setUnholdModalOpen(false);
      if (fetchEnquiries) fetchEnquiries();
      if (onCountRefresh) onCountRefresh();
      onClose();
    } catch (error) {
      toast.error(error || "Failed to unhold enquiry");
    }
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % (enquiry.images?.length || 1));
  };

  const handlePrevImage = () => {
    setActiveImageIndex(
      (prev) =>
        (prev - 1 + (enquiry.images?.length || 1)) %
        (enquiry.images?.length || 1)
    );
  };

  const allImagesReviewed = images.every(
    (img) => img.is_accepted === true || img.is_accepted === false
  );

  // console.log("AssociateRole33333333333333333view",AssociateRole)
  const allImagesRejected =
    Array.isArray(images) &&
    images.length > 0 &&
    images.length >= (enquiry?.no_of_options || 0) &&
    images.every((img) => img.is_accepted === false);



  const handleRedo = async () => {
    try {
      const result = await dispatch(markEnquiryRedo(enquiry.id)).unwrap();
      toast.success("Enquiry marked for Redo");
      onClose();
      fetchEnquiries();

    } catch (error) {
      toast.error(error || "Failed to mark redo");
    }
  };

  const shouldShowShareButton =
    !(enquiry.images?.length === 1 && !enquiry.images[0]?.url);


  const handleAbandon = async () => {
    try {
      const result = await dispatch(markEnquiryAbandon(enquiry.id)).unwrap();
      toast.success("Enquiry marked as Abonded");
      onClose();
      fetchEnquiries();
      onCountRefresh();

    } catch (error) {
      toast.error(error || "Failed to mark abonded");
    }
  };


  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleOpen = (files) => {
    setSelectedFiles(files);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const getFileName = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let fileName = withoutParams.split("---").pop();
    fileName = decodeURIComponent(fileName);
    fileName = fileName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9.]/g, '');
    return fileName;
  };


  const [width, setWidth] = useState(window.innerWidth < 640 ? '20rem' : '60rem');
  const [height, setHeight] = useState(window.innerWidth < 640 ? '75vh' : '90vh');

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth < 640 ? '20rem' : '50rem');
      setHeight(window.innerHeight < 640 ? '75vh' : '90vh');

    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hideDates = enquiry.status === "approveddesigns";

  return (
    <>
      <HoldModal
        open={holdModalOpen}
        onClose={() => setHoldModalOpen(false)}
        onConfirm={handleHoldSubmit}
        jobId={enquiry.job_no}
      />
      <UnholdModal
        open={unholdModalOpen}
        onClose={() => setUnholdModalOpen(false)}
        onConfirm={handleUnholdSubmit}
        enquiry={enquiry}
        type="enquiry"
        currentDate={enquiry.delivery_date}
        hideDates={hideDates}
      />
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: width,
            backgroundColor: 'white',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            padding: '1rem',
            transform: 'translateX(0)',
            transitionProperty: 'transform',
            transitionDuration: '300ms',
            transitionTimingFunction: 'ease-in-out',
          }}

          onClick={(e) => e.stopPropagation()}
        >




          {/* Header */}
          <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase text-gray-800 truncate">
              {enquiry.product_name || "Unnamed Product"}
            </h2>

            {enquiry.cloned_from && (
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                Cloned from: <span className="font-medium text-gray-600">{enquiry.cloned_from}</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            style={{
              overflowY: 'auto',
              height: height,
              boxSizing: 'border-box',
            }}
          >
            <div className="p-3 sm:p-4 md:p-6">
              {/* Image and Product Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Image Section */}

                {/* Image Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center order-1">
                  {images && images.length > 0 ? (
                    (() => {
                      // Filter only accepted or pending images
                      // const validImages = images.filter((img) => img.is_accepted !== false);

                      const validImages = (enquiry.images || []).filter(
                        (img) => img.url && img.url.trim() !== "" && img.is_accepted !== false
                      );


                      // If no valid images found
                      if (validImages.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-48 sm:h-56 md:h-64 text-gray-400">
                            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">
                              <i className="fa-regular fa-images"></i>
                            </div>
                            <p className="text-base sm:text-lg font-medium">No Accepted</p>
                            <p className="text-base sm:text-lg font-medium">Images Available</p>
                            <p className="text-xs sm:text-sm mt-2">
                              Uploaded: 0/{enquiry.no_of_options}
                            </p>
                          </div>
                        );
                      }

                      // Ensure index stays in range
                      const safeIndex =
                        activeImageIndex >= validImages.length ? 0 : activeImageIndex;

                      const handleNextImage = () => {
                        setActiveImageIndex((prev) => (prev + 1) % validImages.length);
                      };

                      const handlePrevImage = () => {
                        setActiveImageIndex(
                          (prev) => (prev - 1 + validImages.length) % validImages.length
                        );
                      };

                      return (
                        <div className="w-full">
                          <div className="relative w-full h-48 sm:h-56 md:h-64 flex items-center justify-center mb-4">
                            <img
                              src={validImages[safeIndex]?.url}
                              alt={`${enquiry.product_name} ${safeIndex + 1}`}
                              className="max-w-full max-h-full object-contain cursor-zoom-in"
                              onClick={() => setPreviewImage(validImages[safeIndex]?.url)}
                            />

                            {validImages.length > 1 && (
                              <>
                                <button
                                  onClick={handlePrevImage}
                                  className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-1.5 sm:p-2 cursor-pointer hover:bg-white/90 transition-colors"
                                >
                                  <i className="fa-solid fa-chevron-left text-gray-700 text-sm sm:text-base"></i>
                                </button>
                                <button
                                  onClick={handleNextImage}
                                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-1.5 sm:p-2 cursor-pointer hover:bg-white/90 transition-colors"
                                >
                                  <i className="fa-solid fa-chevron-right text-gray-700 text-sm sm:text-base"></i>
                                </button>
                              </>
                            )}
                          </div>

                          {validImages.length > 1 && (
                            <div className="flex justify-center gap-2">
                              {validImages.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setActiveImageIndex(index)}
                                  className={`w-2 h-2 rounded-full ${index === safeIndex ? "bg-blue-500" : "bg-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          )}

                          <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">
                            Uploaded: {validImages.length}/{enquiry.no_of_options}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-56 md:h-64 text-gray-400">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4">
                        <i className="fa-regular fa-images"></i>
                      </div>
                      <p className="text-base sm:text-lg font-medium">No Product</p>
                      <p className="text-base sm:text-lg font-medium">Image Available</p>
                      <p className="text-xs sm:text-sm mt-2">
                        Uploaded: 0/{enquiry.no_of_options}
                      </p>
                    </div>
                  )}
                </div>




                {/* Product Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 order-2">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-3 sm:mb-4">
                    Product Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 text-sm sm:text-base">Job Number</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base text-right break-all max-w-[60%]">
                        {enquiry.job_no || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 text-sm sm:text-base">Reference Number</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base text-right break-all max-w-[60%]">
                        {enquiry.reference_no || " "}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 text-sm sm:text-base">Quantity</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                        {enquiry.product_quantity || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Status</span>
                      <span
                        className={`inline-block px-2 sm:px-3 py-1 rounded text-xs font-semibold uppercase`}
                        style={{
                          color: "rgb(255, 255, 255)",
                          ...getStatusBadge(enquiry.status),
                        }}
                      >
                        {enquiry.status || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 text-sm sm:text-base">No. of option(s)</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                        {enquiry.no_of_options || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 text-sm sm:text-base">Created At</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                        {enquiry.created_at || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 text-sm sm:text-base">Created by</span>
                      <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                        {capitalizeFirst(enquiry.created_by.name) || "N/A"}
                      </span>
                    </div>

                    {enquiry.status === "abandon" && (
                      <>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Abonded by</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                            {capitalizeFirst(enquiry.is_cancelled_by?.user?.name) || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Abonded At</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                            {enquiry.is_cancelled_by?.date || "N/A"}
                          </span>
                        </div>
                      </>
                    )}

                  </div>

                </div>
              </div>

              {/* Design Images Table */}

              {showimagetable && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <h4 className="text-base sm:text-lg font-semibold text-blue-600">
                      Design Images
                    </h4>


                    {/* Hold/Unhold Buttons - Role based visibility */}
                    {/* {!AssociateRole && showadminbuttons && (AdminRole || (SalesRole && isHead)) && (
                      <>
                        {!enquiry.is_on_hold ? (
                          <button
                            onClick={() => setHoldModalOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md shadow font-medium transition"
                          >
                            Hold
                          </button>
                        ) : (
                          <button
                            onClick={() => setUnholdModalOpen(true)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md shadow font-medium transition"
                          >
                            Unhold
                          </button>
                        )}
                      </>
                    )} */}

                    {showadminbuttons && !enquiry.is_on_hold && (
                      <div className="flex justify-end gap-2 sm:gap-4 mt-2 sm:mt-0">

                        {!enquiry.is_cancelled && (
                          <button
                            onClick={() => setShowConfirm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md shadow font-medium transition"
                          >
                            Abandon
                          </button>
                        )}

                      </div>
                    )}


                  </div>

                  {enquiry.images && shouldShowShareButton && enquiry.images.length > 0 ? (
                    <div
                      className="border border-gray-200 rounded overflow-auto"
                      style={{
                        maxHeight: "420px",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#888 #f1f1f1",
                      }}
                    >
                      <div
                        className="inline-block min-w-full"
                        style={{ overflowX: "auto" }}
                      >
                        <table
                          className="w-full text-xs sm:text-sm text-left text-gray-800 min-w-[750px]"
                          style={{ borderCollapse: "collapse" }}
                        >
                          <thead className="bg-gray-100 text-xs uppercase text-gray-600 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-3 border-b whitespace-nowrap">S.No</th>
                              <th className="px-3 py-3 border-b whitespace-nowrap">Image</th>
                              <th className="px-3 py-3 border-b whitespace-nowrap">Start Time</th>
                              <th className="px-3 py-3 border-b whitespace-nowrap">End Time</th>
                              <th className="px-3 py-3 border-b whitespace-nowrap">Size</th>
                              {!Designerviewaccess && (
                                <th className="px-3 py-3 border-b whitespace-nowrap">Designer</th>
                              )}
                              <th className="px-3 py-3 border-b text-center whitespace-nowrap">
                                {!Designerviewaccess ? "Action" : "Status"}
                              </th>
                              <th className="px-3 py-3 border-b whitespace-nowrap w-40 sm:w-64">
                                Client Feedback
                              </th>
                              <th className="px-3 py-3 border-b whitespace-nowrap w-40 sm:w-64">
                                Approving Time
                              </th>
                              <th className="px-3 py-3 border-b whitespace-nowrap w-40 sm:w-64">
                                Attachments
                              </th>
                              <th className="px-3 py-3 border-b whitespace-nowrap w-40 sm:w-64">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {images
                              .filter((img) => img.url && img.url.trim() !== "")
                              .map((img, idx) => (
                                <tr key={img._id || idx} className="hover:bg-gray-50 border-t transition-colors">
                                  <td className="px-3 py-3">{idx + 1}</td>
                                  <td className="px-3 py-3">
                                    <img
                                      src={img.url}
                                      alt={`Design ${idx + 1}`}
                                      className="h-12 w-16 sm:h-16 sm:w-24 object-cover cursor-zoom-in"
                                      onClick={() => setPreviewImage(img.url)}
                                    />
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap">{img.starttime || "N/A"}</td>
                                  <td className="px-3 py-3 whitespace-nowrap">{img.endtime || "N/A"}</td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    {img.image_product_size?.length
                                      ? img.image_product_size.map((sizeObj, i) => (
                                        <div key={i}>
                                          {Object.entries(sizeObj).map(([key, value], j, arr) => (
                                            <span key={j}>
                                              {key}: {value?.toString().trim() || "N/A"} {img.imageunit || ""}
                                              {j < arr.length - 1 ? " | " : ""}
                                            </span>
                                          ))}
                                        </div>
                                      ))
                                      : "N/A"}
                                  </td>

                                  {!Designerviewaccess && (
                                    <td className="px-3 py-3 whitespace-nowrap capitalize">{img.designer_person || "N/A"}</td>
                                  )}

                                  <td className="px-3 py-3 text-center">
                                    <div className="flex justify-center gap-1 sm:gap-3">
                                      {/* Check if the image is reworked */}
                                      {img.is_accepted === false && img.image_rework === true ? (
                                        <Tooltip title="Rework">
                                          <ReplayCircleFilledIcon sx={{ fontSize: 26, color: "#5c4609ff" }} />
                                        </Tooltip>
                                      ) : img.is_accepted === undefined ? (
                                        // designheadviewdesign || Designerviewaccess ? (
                                        designheadviewdesign || Designerviewaccess || !designheadviewdesign ? (

                                          <>
                                            <CheckCircleRoundedIcon sx={{ fontSize: 26, color: "#a5d6a7" }} />
                                            <CancelRoundedIcon sx={{ fontSize: 26, color: "#ef9a9a" }} />
                                          </>
                                        ) : (
                                          <>
                                            <Tooltip title="Approve">
                                              <IconButton
                                                onClick={() =>
                                                  handleAcceptReject(
                                                    enquiry,
                                                    img._id,
                                                    true,

                                                    (updatedImage) =>
                                                      setImages((prev) =>
                                                        prev.map((i) =>
                                                          i._id === updatedImage._id ? { ...i, ...updatedImage } : i
                                                        )
                                                      ),
                                                    fetchEnquiries

                                                  )
                                                }
                                                sx={{ color: "#2e7d32" }}
                                              >
                                                <CheckCircleRoundedIcon sx={{ fontSize: 24 }} />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reject">
                                              <IconButton
                                                onClick={() =>
                                                  handleAcceptReject(
                                                    enquiry,
                                                    img._id,
                                                    false,

                                                    (updatedImage) =>
                                                      setImages((prev) =>
                                                        prev.map((i) =>
                                                          i._id === updatedImage._id ? { ...i, ...updatedImage } : i
                                                        )
                                                      ),

                                                    fetchEnquiries,
                                                  )
                                                }
                                                sx={{ color: "#c62828" }}
                                              >
                                                <CancelRoundedIcon sx={{ fontSize: 24 }} />
                                              </IconButton>
                                            </Tooltip>
                                          </>
                                        )
                                      ) : img.is_accepted ? (
                                        <Tooltip title="Approved">
                                          <CheckCircleRoundedIcon sx={{ fontSize: 26, color: "#2e7d32" }} />
                                        </Tooltip>
                                      ) : (
                                        <Tooltip title="Rejected">
                                          <CancelRoundedIcon sx={{ fontSize: 26, color: "#c62828" }} />
                                        </Tooltip>
                                      )}
                                    </div>
                                  </td>



                                  <td className="px-3 py-3 text-gray-700 max-w-[200px] sm:max-w-[250px] break-words">
                                    {img.feedback || <span className="text-gray-400 italic text-xs">No feedback</span>}
                                  </td>

                                  <td className="px-3 py-3 text-gray-700 max-w-[200px] sm:max-w-[250px] break-words">
                                    {!Designerviewaccess && img.accepted_date_time ? img.accepted_date_time : <span className="text-gray-400 italic text-xs">N/A</span>}
                                  </td>

                                  <td className="px-3 py-3 text-gray-700 max-w-[200px] sm:max-w-[250px] break-words">
                                    {Array.isArray(img.additional_files) && img.additional_files.length > 0 ? (
                                      <IconButton onClick={() => handleOpen(img.additional_files)}>
                                        <VisibilityIcon className="text-blue-600" />
                                      </IconButton>
                                    ) : (
                                      <span className="text-gray-400 italic text-xs">N/A</span>
                                    )}
                                  </td>

                                  <td className="px-3 py-3 text-gray-700 max-w-[200px] sm:max-w-[250px] break-words">
                                    {img.image_to_sample ? (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                        Sampling
                                      </span>
                                    ) : img.image_to_production ? (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                        Production
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
                                        N/A
                                      </span>
                                    )}
                                  </td>


                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Custom Scrollbar Inline */}
                      <style>
                        {`
                        div::-webkit-scrollbar {
                          height: 8px;
                          width: 8px;
                        }
                        div::-webkit-scrollbar-track {
                          background: #f1f1f1;
                          border-radius: 4px;
                        }
                        div::-webkit-scrollbar-thumb {
                          background: #888;
                          border-radius: 4px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background: #555;
                        }
                      `}
                      </style>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">No Designs available.</p>
                  )}
                </div>
              )}










              <div className="grid grid-cols-1 gap-4 sm:gap-6">

                {Array.isArray(enquiry.reference_images) && enquiry.reference_images.length > 0 && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="reference-images-content"
                      id="reference-images-header"
                    >
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        Reference Images
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <ul className="space-y-2">
                        {enquiry.reference_images.map((fileUrl, index) => {
                          const fileName = getFileName(fileUrl);

                          return (
                            <li
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                            >
                              <span className="text-sm text-gray-700">{fileName}</span>

                              <button
                                onClick={() => window.open(fileUrl, "_blank")}
                                className="text-blue-600 text-xs sm:text-sm underline hover:text-blue-800"
                              >
                                View
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                )}


                {Array.isArray(enquiry.additional_attachments) && enquiry.additional_attachments.length > 0 && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="additional-attachments-content"
                      id="additional-attachments-header"
                    >
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        Additional Attachments
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <ul className="space-y-2">
                        {enquiry.additional_attachments.map((fileUrl, index) => {
                          const fileName = getFileName(fileUrl);

                          return (
                            <li
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                            >
                              <span className="text-sm text-gray-700">{fileName}</span>

                              <button
                                onClick={() => window.open(fileUrl, "_blank")}
                                className="text-blue-600 text-xs sm:text-sm underline hover:text-blue-800"
                              >
                                View
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                )}



                {Array.isArray(enquiry.client_design_files) && enquiry.client_design_files.length > 0 && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="client-design-files-content"
                      id="client-design-files-header"
                    >
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        Client Design Files
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <ul className="space-y-2">
                        {enquiry.client_design_files.map((fileUrl, index) => {
                          const fileName = getFileName(fileUrl);

                          return (
                            <li
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                            >
                              <span className="text-sm text-gray-700">{fileName}</span>
                              <button
                                onClick={() => window.open(fileUrl, "_blank")}
                                className="text-blue-600 text-xs sm:text-sm underline hover:text-blue-800"
                              >
                                View
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Client Information */}
                {!AssociateRole && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="client-info-content"
                      id="client-info-header"
                    >
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        Client Information
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Client</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base text-right break-words max-w-[60%]">
                            {enquiry.name || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Email</span>
                          <span className="font-medium text-blue-600 text-sm sm:text-base text-right break-all max-w-[60%]">
                            {Array.isArray(enquiry.email)
                              ? enquiry.email.map((email, idx) => <div key={idx}>{email}</div>)
                              : enquiry.email || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Contact Number</span>
                          <span className="font-medium text-blue-600 text-sm sm:text-base text-right">
                            {enquiry.mobile_no || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Whatsapp Number</span>
                          <span className="font-medium text-blue-600 text-sm sm:text-base text-right break-all max-w-[60%]">
                            {Array.isArray(enquiry.wp_number)
                              ? enquiry.wp_number.map((wp_number, idx) => <div key={idx}>{wp_number}</div>)
                              : enquiry.wp_number || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Enquiry Origin</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                            {enquiry.enquiry_origin || "N/A"}
                          </span>
                        </div>
                      </div>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Financial Details */}
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="financial-details-content"
                    id="financial-details-header"
                  >
                    <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                      Financial Details
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Budget From</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          ₹ {enquiry.budget || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Budget To</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          ₹ {enquiry.budget_to || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Payment Terms</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-justify break-words max-w-[60%]">
                          {enquiry.payment_terms || "N/A"}
                        </span>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>


                {/* Delivery Information */}
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="delivery-info-content"
                    id="delivery-info-header"
                  >
                    <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                      Delivery Information
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Delivery Date</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          {enquiry.delivery_date || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Location</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-justify break-words max-w-[60%]">
                          {enquiry.delivery_location || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Who will pay</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          {enquiry.who_will_pay || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Delivery Type</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          {enquiry.delivery_type || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Delivery Mode</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          {enquiry.delivery_mode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>


                {/* Product Specifications */}
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="product-specs-content"
                    id="product-specs-header"
                  >
                    <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                      Product Specifications
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Preferred Material</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right max-w-[60%]">
                          {enquiry.preferred_material || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Unit of Measurement</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          {enquiry.unit || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Size</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-right">
                          {enquiry.product_size && enquiry.product_size.length > 0 ? (
                            enquiry.product_size.map((sizeObj, idx) => {
                              const entries = Array.from(
                                sizeObj.entries ? sizeObj.entries() : Object.entries(sizeObj)
                              );

                              return (
                                <div key={idx}>
                                  {entries.map(([key, value], i) => (
                                    <span key={i}>
                                      {key}: {value && value.toString().trim() !== "" ? value : "N/A"}
                                      {i < entries.length - 1 ? " | " : ""}
                                    </span>
                                  ))}
                                </div>
                              );
                            })
                          ) : (
                            "N/A"
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Description</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-justify break-words max-w-[60%]">
                          {enquiry.product_description || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 text-sm sm:text-base">Briefing</span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base text-justify break-words max-w-[60%]">
                          {enquiry.briefing || "N/A"}
                        </span>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>




                {/* Designers Details */}

                {!AssociateRole && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="designer-content"
                      id="designer-header"
                    >
                      <div className="flex justify-between items-center w-full">
                        <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                          Designers Details
                        </Typography>

                        {reassigndesignerbutton && enquiry.is_designer_allocated && !enquiry.is_completed && !enquiry.is_on_hold && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUserAction(true, true);
                            }}
                            className="bg-teal-500 text-white px-3 py-1 rounded-lg hover:bg-teal-600 transition-colors flex items-center cursor-pointer"
                          >
                            <PersonAddIcon fontSize="small" />
                            <span className="ml-1">Reassign</span>
                          </div>
                        )}
                      </div>
                    </AccordionSummary>

                    <AccordionDetails>
                      <div className="space-y-2 sm:space-y-3">
                        {!Designerviewaccess && (
                          <>
                            {enquiry.designer_person && enquiry.designer_person.length > 0 ? (
                              enquiry.designer_person.map((item) => (
                                <div
                                  key={item._id}
                                  className="flex justify-between items-start text-sm sm:text-base"
                                >
                                  <span className="text-gray-600">{item.user?.name || "N/A"}</span>
                                  <span
                                    className={`font-medium ${item.completed ? "text-green-600" : "text-yellow-600"
                                      }`}
                                  >
                                    {item.completed ? "Completed" : "Processing"}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-sm sm:text-base">
                                No designers available
                              </div>
                            )}
                          </>
                        )}

                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Remarks</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base text-justify break-words max-w-[60%]">
                            {enquiry.designer_remarks || "N/A"}
                          </span>
                        </div>
                      </div>
                    </AccordionDetails>
                  </Accordion>
                )}




                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="marketing-content"
                    id="marketing-header"
                  >
                    <Typography className="font-semibold text-blue-600">Marketing Coordinators</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-2">
                      {enquiry.marketing_cordinator.map((coord, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <span className="text-gray-600 text-sm sm:text-base">Coordinator</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base break-words max-w-[60%]">
                            {coord.name || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* All Hold History */}
                {!AssociateRole && showadminbuttons && (AdminRole || (SalesRole && isHead)) && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="hold-history-content"
                      id="hold-history-header"
                    >
                      <Typography className="font-semibold text-blue-600">Hold History</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {enquiry.hold_history && enquiry.hold_history.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-gray-600 uppercase">
                                <th className="px-2 py-2 border-b">Hold Reason</th>
                                <th className="px-2 py-2 border-b">Hold By</th>
                                <th className="px-2 py-2 border-b">Start Date</th>
                                <th className="px-2 py-2 border-b">Unhold By</th>
                                <th className="px-2 py-2 border-b">End Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enquiry.hold_history.map((hold, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 border-b font-medium text-gray-800 break-all">
                                    {hold.reason || "N/A"}
                                  </td>
                                  <td className="px-2 py-2 border-b text-gray-700">
                                    {hold.hold_by?.name || "N/A"}
                                  </td>
                                  <td className="px-2 py-2 border-b text-gray-600 whitespace-nowrap">
                                    {hold.start_time || "N/A"}
                                  </td>
                                  <td className="px-2 py-2 border-b text-gray-700">
                                    {hold.unhold_by?.name || (hold.end_time ? "N/A" : "-")}
                                  </td>
                                  <td className="px-2 py-2 border-b text-gray-600 whitespace-nowrap">
                                    {hold.end_time || (hold.start_time ? "Ongoing" : "N/A")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No hold history available for this enquiry.</p>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}
              </div>
            </div>
          </div>
        </div>

        <ConfirmAbandonModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={async () => {
            await handleAbandon();
            setShowConfirm(false);
          }}
        />

        <Modal open={open} onClose={() => setOpen(false)}>
          <h2 className="text-xl font-semibold mb-4">Additional Files</h2>

          <div className="grid grid-cols-2 gap-4">
            {selectedFiles.map((file, index) => {
              const url = file.additional_files || file;

              return (
                <div key={index} className="relative flex flex-col items-center">

                  {/* Zoom Button */}
                  <button
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
                    onClick={() => setZoomImage(url)}
                  >
                    <ZoomInIcon fontSize="small" className="text-gray-700" />
                  </button>

                  {/* Thumbnail Image */}
                  <img
                    src={url}
                    alt=""
                    className="w-full h-40 object-cover rounded-lg border cursor-pointer"
                    onClick={() => setZoomImage(url)}
                  />

                  <p className="text-sm text-gray-600 mt-2">
                    File {index + 1}
                  </p>
                </div>
              );
            })}
          </div>
        </Modal>

        {/* ZOOM MODAL */}
        <ZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />



        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>

      </div>
      <ImageLightbox
        src={previewImage}
        fileName={enquiry.job_no || "Product View"}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};

export default ViewModal;