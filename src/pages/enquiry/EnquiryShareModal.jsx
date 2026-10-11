import React, { useState } from "react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import axios from "axios";
import { toast } from "react-toastify";
import { axiosInstance, backendUrl } from "../../utils/url/config";
import { capitalizeFirst } from "../../utils/helper/capitalize";
import { useLoader } from "../../context/LoaderContext";
import { useDispatch, useSelector } from "react-redux";
import { sendEnquiryMail } from "../../reducer/enquiryReducer";

const EnquiryShareModal = ({ enquiry, onClose }) => {
  const { showLoader, hideLoader } = useLoader();
  const [selectNumberModal, setSelectNumberModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const dispatch = useDispatch();

  const handleWhatsApp = async (number) => {
    const expiryTimestamp = Date.now() + (enquiry.links_duration || 0) * 60 * 60 * 1000;

    const encodedExpiry = btoa(expiryTimestamp.toString());
    const currentDomain = window.location.origin;

    const link = `${currentDomain}/rd/clientconfirmation/${enquiry.id}?v=1&exp=${encodedExpiry}`;

    const expiryDate = new Date(expiryTimestamp).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const jobRef = enquiry.job_no || "N/A";
    const clientName = capitalizeFirst(enquiry.name) || "Customer";
    const productName = capitalizeFirst(enquiry.product_name) || "N/A";

    const values = {
      "1": `Design Update – Job No: ${jobRef}`,
      "2": clientName,
      "3": productName,
      "4": link,
      "5": expiryDate
    };

    showLoader();
    try {
      const response = await axiosInstance.post(`${backendUrl}/enquiry/send-enquiry-template`, {
        phone_number: number,
        values: values
      });
      if (response.data.success) {
        toast.success("WhatsApp message sent successfully!");
        onClose();
      } else {
        toast.error(response.data.message || "Failed to send WhatsApp message");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Server error while sending WhatsApp");
    } finally {
      hideLoader();
    }
  };


  const handleWhatsAppClick = (e) => {
    if (!enquiry.wp_number || enquiry.wp_number.length === 0) {
      toast.error("No mobile number available.");
      return;
    }

    if (Array.isArray(enquiry.wp_number) && enquiry.wp_number.length > 1) {
      setSelectNumberModal(true);
    } else {
      if (e?.currentTarget) e.currentTarget.disabled = true;
      handleWhatsApp(Array.isArray(enquiry.wp_number) ? enquiry.wp_number[0] : enquiry.wp_number);
    }
  };

  // const handleMail = async () => {
  //   showLoader();
  //   try {
  //     const response = await axiosInstance.get(`${backendUrl}/enquiry/mail/${enquiry.id}`);
  //     if (response.data.success) {
  //       toast.success("Mail sent successfully!");
  //     } else {
  //       toast.error(response.data.message || "Failed to send mail");
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Server error");
  //   } finally {
  //     hideLoader();
  //     onClose();
  //   }
  // };

  const handleMail = async (e) => {
    if (e?.currentTarget) e.currentTarget.disabled = true;
    showLoader();
    const result = await dispatch(sendEnquiryMail(enquiry.id));
    hideLoader();

    if (result.payload?.success) toast.success("Mail sent successfully!");
    else toast.error(result.payload?.message || "Unable to send mail");

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >

      <div
        className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">Share Enquiry</h2>
        <button
          className="flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleWhatsAppClick}
        >
          <WhatsAppIcon />
          WhatsApp
        </button>
        <button
          className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectNumberModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-72 shadow-lg flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-md font-semibold mb-2">Select WhatsApp Number</h3>
            {enquiry.wp_number.map((num, idx) => (
              <button
                key={idx}
                className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.currentTarget.disabled = true;
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

export default EnquiryShareModal;
