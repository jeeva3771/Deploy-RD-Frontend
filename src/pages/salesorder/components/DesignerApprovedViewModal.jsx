import React, { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Typography, CircularProgress } from "@mui/material";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { getStatusBadge } from "../../../utils/enquiry/statusHelpers";
import { axiosInstance } from "../../../utils/url/config";
import { useDispatch } from "react-redux";
import { downloadFile } from "../../../reducer/standalone_bomReducer";

const DesignerApprovedViewModal = ({ order, onClose }) => {
  const dispatch = useDispatch();
  const [width, setWidth] = useState(window.innerWidth < 640 ? '20rem' : '50rem');
  const [height, setHeight] = useState(window.innerWidth < 640 ? '75vh' : '90vh');

  // Fetched full production form data
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth < 640 ? '20rem' : '50rem');
      setHeight(window.innerHeight < 640 ? '75vh' : '90vh');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch full data from sampleorderlist via /sampleorderlist/:ssoid
  useEffect(() => {
    const fetchFormData = async () => {
      // Prioritize sub_job_no as requested
      const ssoid = order?.sub_job_no || order?.sample_order_nanoid;

      if (!ssoid) {
        setError("Search identifier (Sub Job No) is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/sampleorderlist/${ssoid}`);
        setFormData(res.data?.data || null);
      } catch (err) {
        setError("Failed to load production form data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, [order?.sample_order_nanoid, order?.sub_job_no]);

  const getFileName = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let name = withoutParams.split("---").pop();
    return decodeURIComponent(name);
  };

  // Use fetched formData if available, fall back to original order prop for basic fields
  const data = formData || order;

  const handleDownload = (fileUrl) => {
    if (!fileUrl) return;
    dispatch(downloadFile(fileUrl));
  };

  return (
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
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateX(0)',
          transitionProperty: 'transform',
          transitionDuration: '300ms',
          transitionTimingFunction: 'ease-in-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase text-gray-800 truncate flex items-center gap-2">
            {capitalizeFirst(data.product_name || "Sample Order")}
            {data.Pi_files?.length > 0 && (
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                Rework PI
              </span>
            )}
            {data?.is_client_design && (
              <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                Client Design
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div
          style={{
            overflowY: 'auto',
            height: height,
            boxSizing: 'border-box',
          }}
        >
          {/* LOADING STATE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <CircularProgress size={36} />
              <p className="text-gray-500 text-sm">Loading production form data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
              <p className="text-red-500 text-sm font-medium">{error}</p>
              <p className="text-gray-400 text-xs">Basic order info shown below.</p>
            </div>
          ) : (
            <div className="p-3 sm:p-4 md:p-6">

              {/* TOP GRID: Image (left) + Product Info (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">

                {/* Image Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center order-1">
                  {data.image ? (
                    <div className="w-full">
                      <div className="relative w-full h-48 sm:h-56 md:h-64 flex items-center justify-center mb-2">
                        <img
                          src={data.image}
                          alt={data.product_name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-56 md:h-64 text-gray-400">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4">
                        <i className="fa-regular fa-images"></i>
                      </div>
                      <p className="text-base sm:text-lg font-medium">No Product</p>
                      <p className="text-base sm:text-lg font-medium">Image Available</p>
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 order-2">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-3 sm:mb-4">
                    Product Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <InfoRow label="Job Number" value={data.job_no} />
                    <InfoRow label="Sub Job Number" value={data.sub_job_no} />
                    <InfoRow label="Reference Number" value={data.enquiry_id?.reference_no} />
                    <InfoRow label="Quantity" value={data.job_quantity} />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Status</span>
                      <span
                        className="inline-block px-2 sm:px-3 py-1 rounded text-xs font-semibold uppercase"
                        style={{
                          color: "rgb(255, 255, 255)",
                          ...getStatusBadge(order.status),
                        }}
                      >
                        {capitalizeFirst(order.status)}
                      </span>
                    </div>
                    <InfoRow label="Type" value={capitalizeFirst(order.type || "N/A")} />
                    <InfoRow label="Delivery Date" value={data.delivery_date} />
                  </div>
                </div>
              </div>

              {/* ACCORDION SECTIONS */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">

                {/* Client Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                      Client Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-2 sm:space-y-3">
                      <InfoRow label="Client Name" value={data.client_name} />
                      <InfoRow label="Email" value={data.email?.join(", ")} />
                      <InfoRow label="Phone" value={data.mobile_no || "N/A"} />
                      <InfoRow label="WhatsApp" value={data.wp_number?.join(", ")} />
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* Billing Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                      Billing Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-2 sm:space-y-3">
                      <InfoRow label="Street Address" value={data.billing_address_1} />
                      <InfoRow label="Street Line 2" value={data.billing_address_2} />
                      <InfoRow label="City" value={data.billing_city} />
                      <InfoRow label="State" value={data.billing_state} />
                      <InfoRow label="Pincode" value={data.billing_postal_code} />
                      <InfoRow label="GST No" value={data.billing_gst_no} />
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* Delivery Details */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                      Delivery Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-2 sm:space-y-3">
                      <InfoRow label="Delivery Date" value={data.delivery_date} />
                      <InfoRow label="Delivery Address" value={data.delivery_address} />
                      <InfoRow label="Delivery Type" value={data.delivery_type} />
                      <InfoRow label="Delivery Mode" value={data.delivery_mode} />
                      <InfoRow label="Who Will Pay" value={data.who_will_pay} />
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* Quotation Files */}
                {data.quatation_files?.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        Quotation File
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="space-y-2">
                        {(() => {
                          const lastFile = data.quatation_files[data.quatation_files.length - 1];
                          return (
                            <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                              <span className="text-sm text-gray-700 truncate max-w-[75%]">
                                {getFileName(lastFile)}
                              </span>
                              <button
                                onClick={() => handleDownload(lastFile)}
                                className="text-green-600 text-xs sm:text-sm underline hover:text-green-800"
                              >
                                Download
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* PI Files */}
                {data.Pi_files?.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        PI Files
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="space-y-2">
                        {data.Pi_files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-sm text-gray-700 truncate max-w-[75%]">
                              {getFileName(file)}
                            </span>
                            <button
                              onClick={() => handleDownload(file)}
                              className="text-green-600 text-xs sm:text-sm underline hover:text-green-800"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                      {data.is_pi_verified_remarks && (
                        <p className="mt-2 text-gray-700 italic text-sm">
                          PI Remarks: {data.is_pi_verified_remarks}
                        </p>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Production Files */}
                {data.product_files?.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                        Production Files
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="space-y-2">
                        {data.product_files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-sm text-gray-700 truncate max-w-[60%]">
                              {getFileName(file)}
                            </span>
                            <button
                              onClick={() => handleDownload(file)}
                              className="text-green-600 text-xs sm:text-sm underline hover:text-green-800"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Marketing Coordinators */}
                {(data.marketing_cordinator?.length > 0 ||
                  data.enquiry_id?.marketing_cordinator?.length > 0) && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography className="font-semibold text-blue-600 text-base sm:text-lg">
                          Marketing Coordinators
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <div className="space-y-2">
                          {(data.enquiry_id?.marketing_cordinator || data.marketing_cordinator || []).map((coord, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <span className="text-gray-600 text-sm sm:text-base">
                                Coordinator {idx + 1}
                              </span>
                              <span className="font-medium text-gray-800 text-sm sm:text-base break-words max-w-[60%] text-right">
                                {coord.name || coord?.user?.name || "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  )}

              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-gray-600 text-sm sm:text-base">{label}</span>
    <span className="font-medium text-gray-800 max-w-[60%] text-right break-words text-sm sm:text-base">
      {Array.isArray(value) ? value.join(", ") : value || "N/A"}
    </span>
  </div>
);

export default DesignerApprovedViewModal;
