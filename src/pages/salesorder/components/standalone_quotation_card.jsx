import React, { useState } from "react";
import { getStatusBadge, getStatusText } from "../../../utils/enquiry/statusHelpers";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import DeliveryPriorityColor from "../../../components/deliveryPriorityColor/priorityColor";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import Button from "@mui/material/Button";
import DesignerFileUploadModal from "./DesignerFileUploadModal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadIcon from '@mui/icons-material/Upload';
import { getFileName } from "../../../utils/helper/FilenameURL";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AssignProductionModal from "./AssignProductionModal";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from "@mui/icons-material/Edit";


const Standalonecard = ({
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
    finalUnitPrice
  } = sampleOrder;


  const [openFilesModal, setOpenFilesModal] = useState(false);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const showDesignRequest = is_sales_order_filled && !is_design_uploaded;
  const showDesignRequestupploded = is_sales_order_filled && is_design_uploaded;
  const showPIRequest = is_sales_order_filled && !is_pi_uploaded;
  const showPIRequestupload = is_sales_order_filled && is_pi_uploaded;
  const showQuotaionRequestupload = is_sales_order_filled && is_bom_filled;
  const piverified = is_sales_order_filled && is_pi_uploaded && is_pi_verified;
  const quotationverified = is_sales_order_filled && is_bom_filled && is_bom_verified;

  const allCompleted = is_sales_order_filled && is_design_uploaded && is_pi_uploaded && piverified;

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

  const accesstoverifyquotation = AdminRole && marginVerify;
  const reworkpifiles = !is_pi_rework && Pi_files?.length > 0;
  const reworkquotattionfiles = !is_bom_rework && quatation_files?.length > 0;
  const showQuotationRequest = is_sales_order_filled && !is_bom_filled;
  const showQuotationupploded = is_sales_order_filled && is_bom_filled;

  // Handle image array (if multiple images exist)
  const images = Array.isArray(sampleOrder.org_image) ? sampleOrder.org_image : [sampleOrder.org_image];
  const validImages = images.filter(img => img);

  const isDraft = sampleOrder.is_bom_draft === true;
  const op = (sampleOrder.is_bom_rework === true)

  const optionss = isDraft ? "edit" : ((op || Viewonlybom) ? "view" : "add");


  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
        {/* Top colored border */}
        <DeliveryPriorityColor
          deliveryDate={sampleOrder.delivery_date}
          className="h-2 w-full"
        />
        <div className="p-4 flex flex-col h-full">
          {/* Header Section */}
          <div className="mb-3">
            {/* First Row */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-lg mb-1">
                  {sampleOrder.sub_job_no}
                </h3>
              </div>

              {/* <span
      className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-2 flex-shrink-0"
      style={{ ...getStatusBadge(sampleOrder.status), color: "#333333" }}
    >
      {getStatusText(sampleOrder.status)}
    </span> */}
              <DeliveryPriorityColor
                deliveryDate={sampleOrder.delivery_date}
                as="span"
                className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-2 flex-shrink-0"
                style={{ color: "#f6f2f2ff" }}
                showPriorityName={true}
              >
                {getStatusText(sampleOrder.status)}
              </DeliveryPriorityColor>
            </div>

            {/* Second Row - Centered Product Name */}
            <div className="text-center mt-1">
              <p className="font-bold text-slate-800 text-lg truncate">
                {capitalizeFirst(sampleOrder.product_name || sampleOrder.enquiry_id?.product_name)}
              </p>
            </div>
          </div>


          {/* Image Section with Carousel */}
          <div className="mb-4 relative h-40 rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
            {validImages.length > 0 ? (
              <>
                <div className="flex overflow-x-auto h-full w-full snap-x snap-mandatory scrollbar-hide relative z-0">
                  <img
                    src={validImages[imageIndex] || validImages[0]}
                    alt={sampleOrder.product_name || sampleOrder.enquiry_id?.product_name}
                    loading="lazy"
                    className="w-full h-full flex-shrink-0 object-cover snap-center"
                  />
                </div>

                {/* Image dots indicator */}
                {validImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-1 rounded-full bg-black/20 backdrop-blur-sm">
                    {validImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${idx === imageIndex ? 'bg-white shadow-sm' : 'bg-white/50'
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
                        setImageIndex((prev) => prev === 0 ? validImages.length - 1 : prev - 1);
                      }}
                    >
                      <i className="fa-solid fa-chevron-left text-gray-700 text-xs"></i>
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 transition-all z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex((prev) => (prev + 1) % validImages.length);
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
                <span className="text-gray-400 text-xs uppercase block font-semibold">QTY</span>
                <span className="font-bold text-slate-700">
                  {sampleOrder.job_quantity ?? sampleOrder.product_quantity ?? "-"}
                </span>
              </div>

            </div>

            {/* Second Row: Production Person */}
            {sampleOrder.production_team_person && prouductionmember && (
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                <i className="fa-solid fa-user text-[10px]"></i>
                <span>Production Person: {sampleOrder.production_team_person.name}</span>
              </div>
            )}
          </div>



          {/* Action Buttons - Always at bottom */}
          <div className="grid grid-cols-1 gap-2 mt-auto flex-shrink-0">



            {/* Prepare BOM */}
            {requestedquotaion && (
              <div className={optionss === "view" ? "flex gap-2 w-full" : "w-full"}>
                <button
                  className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm hover:shadow ${optionss === "view" ? "flex-1" : "w-full"}`}
                  style={{ backgroundColor: "#7C3AED" }} // vibrant violet
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6D28D9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                  onClick={() =>
                    navigate(
                      `/standalone/quotation/${optionss}/${sampleOrder.id}`
                    )
                  }
                >
                  <DescriptionIcon fontSize="small" />
                  <span> {isDraft ? "Continue Draft" : ((op || Viewonlybom) ? "View Bom" : "Prepare BOM")}</span>
                </button>

                {optionss === "view" && (
                  <button
                    title="Edit BOM"
                    className="py-2 px-3 rounded-lg text-white text-sm font-medium transition flex items-center justify-center shadow-sm hover:shadow"
                    style={{ backgroundColor: "#4f46e5" }} // indigo-600
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338ca")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
                    onClick={() =>
                      navigate(
                        `/standalone/quotation/edit/${sampleOrder.id}`
                      )
                    }
                  >
                    <EditIcon fontSize="small" />
                  </button>
                )}
              </div>
            )}




            {/* {requestedquotaion && prouductionmember && !sampleOrder.production_team_person && (
              <button
          className="py-2 px-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600 shadow-md text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm hover:shadow"

                  onClick={() => setOpenAssignModal(true)}
                >
                 <PersonIcon fontSize="small" />
                  <span>Assign</span>
                </button>
              )} */}


          </div>
        </div>
      </div>


      {/* Assign Production Modal */}
      <AssignProductionModal
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        sampleOrderId={sampleOrder.id}
        // onAssignSuccess={() => {}}
        onAssignSuccess={onAssignSuccess}
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

export default Standalonecard;