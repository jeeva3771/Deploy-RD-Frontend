import React, { useState } from "react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useDispatch, useSelector } from "react-redux";
import { useLoader } from "../../../context/LoaderContext";
import { sendsampleorderMailQuoatation } from "../../../reducer/sampleSalesorderReducer";

const QuotationShareModal = ({ sampleorder, type, onClose }) => {
  const { showLoader, hideLoader } = useLoader();
  const [selectNumberModal, setSelectNumberModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const dispatch = useDispatch();

  const handleWhatsApp = (number) => {
    if (!number) return;

    const phone = `+91${number}`;


    const capitalizeFirst = (str) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const jobNo = sampleorder?.job_no || "N/A";
    const subjobNo = sampleorder?.sub_job_no || "N/A";

    const customerName = capitalizeFirst(sampleorder?.client_name) || "Customer";
    const productName = capitalizeFirst(sampleorder?.product_name) || "N/A";


    const quotationFiles = sampleorder?.quatation_files || [];
    // const lastQuotationFile = quotationFiles.length > 0 ? quotationFiles[quotationFiles.length - 1] : "Link not available";

    const expiryTimestamp = Date.now() + 24 * 60 * 60 * 1000

    const encodedExpiry = btoa(expiryTimestamp.toString());
    const currentDomain = window.location.origin;

    const link = `${currentDomain}/rd/clientconfirmation/${sampleorder?.enquiry_id?.id}/${sampleorder?.id}/?v=1&exp=${encodedExpiry}`;

    const expiryDate = new Date(expiryTimestamp).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });


    const subjectText = type === "reprocessed"
      ? `Reprocessed Quotation Update – Sub Job No: ${subjobNo}`
      : `Quotation Update – Sub Job No: ${subjobNo}`;

    const values = {
      "1": subjectText,
      "2": customerName,
      "3": productName,
      "4": link,
      "5": expiryDate
    };

    showLoader();
    axiosInstance.post(`${backendUrl}/enquiry/send-enquiry-template`, {
      phone_number: number,
      values: values
    }).then(response => {
      if (response.data.success) {
        toast.success("WhatsApp message sent successfully!");
        onClose();
      } else {
        toast.error(response.data.message || "Failed to send WhatsApp message");
      }
    }).catch(error => {
      toast.error(error.response?.data?.message || "Server error while sending WhatsApp");
    }).finally(() => {
      hideLoader();
    });
  };

  // You can review your latest Quotation details here:
  // ${lastQuotationFile}



  // const handleWhatsApp = (number) => {
  //   const phone = `+91${number}`;

  //   const expiryTimestamp = Date.now() + (enquiry.links_duration || 0) * 60 * 60 * 1000;

  //   const encodedExpiry = btoa(expiryTimestamp.toString());
  //   const currentDomain = window.location.origin;

  //   const link = `${currentDomain}/rd/clientconfirmation/${enquiry.id}?v=1&exp=${encodedExpiry}`;

  //   const expiryDate = new Date(expiryTimestamp).toLocaleString("en-IN", {
  //     dateStyle: "medium",
  //     timeStyle: "short",
  //   });

  //   const message = `
  // *Design Update – Job No:* ${enquiry.job_no || "N/A"}

  // Dear *${capitalizeFirst(enquiry.name) || "Customer"}*,

  // We are pleased to provide you with the details of your product:

  // *Product Name:* ${capitalizeFirst(enquiry.product_name) || "N/A"}

  // For your convenience, you can review the product details using the following link:
  // ${link}

  // 🔒 *This link will expire on:* ${expiryDate}

  // Thank you for your attention. Please do not hesitate to contact us if you have any questions or require further assistance.
  // `;

  //   const encodedMessage = encodeURIComponent(message);
  //   const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
  //   window.open(whatsappUrl, "_blank");
  //   onClose();
  // };


  const handleWhatsAppClick = () => {
    if (!sampleorder.wp_number || sampleorder.wp_number.length === 0) {
      toast.error("No mobile number available.");
      return;
    }

    if (Array.isArray(sampleorder.wp_number) && sampleorder.wp_number.length > 1) {
      setSelectNumberModal(true);
    } else {
      handleWhatsApp(Array.isArray(sampleorder.wp_number) ? sampleorder.wp_number[0] : sampleorder.wp_number);
    }
  };


  const handleMail = async () => {
    showLoader();
    const result = await dispatch(sendsampleorderMailQuoatation(sampleorder.id));
    hideLoader();

    if (result.payload?.success) toast.success("Mail sent successfully!");
    else toast.error(result.payload?.message || "Unable to send mail");

    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >


      <div
        className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">Share Quotation</h2>
        <button
          className="flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
          onClick={handleWhatsAppClick}
        >
          <WhatsAppIcon />
          WhatsApp
        </button>
        <button
          className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          onClick={handleMail}
        >
          <EmailIcon />
          Mail
        </button>
        <button
          className="mt-2 text-sm text-gray-500 hover:underline"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>

      {/* Modal to select WhatsApp number */}
      {selectNumberModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectNumberModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-72 shadow-lg flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-md font-semibold mb-2">Select WhatsApp Number</h3>
            {sampleorder.wp_number.map((num, idx) => (
              <button
                key={idx}
                className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                onClick={() => {
                  handleWhatsApp(num);
                  setSelectNumberModal(false);
                }}
              >
                {num}
              </button>
            ))}
            <button
              className="mt-2 text-sm text-gray-500 hover:underline"
              onClick={() => setSelectNumberModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationShareModal;
