import React, { useState } from "react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useLoader } from "../../../context/LoaderContext";
// Assuming we might need a specific action for DTP mail if different, 
// otherwise reuse sendsampleorderMailQuoatation or a new one. 
// For now, I'll stick to the existing one or check if there's a DTP specific mailer.
// The user previously mentioned "backend integration" in conversation eec09c5e, 
// but didn't explicitly ask for a new mail action here, just a separate modal.
// I will reuse sendsampleorderMailQuoatation for now, but name it clearly.
import {
    sendsampleorderMailQuoatation,
    sendSampleOrderMailDtp,
    sendSampleOrderWhatsAppDtp
} from "../../../reducer/sampleSalesorderReducer";

const DtpFileShareModal = ({ job, onClose, shareType }) => {
    const { showLoader, hideLoader } = useLoader();
    const [selectNumberModal, setSelectNumberModal] = useState(false);
    const [isSubmittingWhatsApp, setIsSubmittingWhatsApp] = useState(false);
    const [isSubmittingMail, setIsSubmittingMail] = useState(false);
    const dispatch = useDispatch();

    // Extract necessary data from job
    // Note: job prop here is the DTP job object from JobDetailsPanel
    // We need to ensure we have the correct IDs for the link.
    // In JobDetailsPanel, it was passing:
    // id: job.sample_order_id?.id || job.sample_order_id
    const sampleOrderId = job.sample_order_id?.id || job.sample_order_id?._id || job.sample_order_id;
    const enquiryId = job.enquiry_id?.id || job.enquiry_id?._id || job.enquiry_id;

    const clientName = job.enquiry_id?.name || job.client_name || "Customer";
    const productName = job.enquiry_id?.product_name || job.product_name || "N/A";
    const jobNo = job.job_no || "N/A";
    const subJobNo = job.sub_job_no || "N/A";

    const mobileNumbers = job.sales_order_form?.wp_number || job.enquiry_id?.wp_number || job.wp_number || [];

    const handleWhatsApp = async (number) => {
        if (!number) return;

        setSelectNumberModal(false);
        setIsSubmittingWhatsApp(true);
        showLoader();
        try {
            const dtpId = job._id || job.id;
            const result = await dispatch(sendSampleOrderWhatsAppDtp({
                id: sampleOrderId,
                type: shareType,
                dtpId,
                phone: number
            }));

            if (result.payload?.success) {
                toast.success("WhatsApp sent successfully!");
            } else {
                toast.error(result.payload?.message || "Unable to send WhatsApp message");
            }
        } catch (error) {
            toast.error("Error sending WhatsApp message");
        } finally {
            hideLoader();
            setIsSubmittingWhatsApp(false);
            onClose();
        }
    };

    const handleWhatsAppClick = () => {
        if (!mobileNumbers || mobileNumbers.length === 0) {
            toast.error("No mobile number available.");
            return;
        }

        if (Array.isArray(mobileNumbers) && mobileNumbers.length > 1) {
            setSelectNumberModal(true);
        } else {
            handleWhatsApp(Array.isArray(mobileNumbers) ? mobileNumbers[0] : mobileNumbers);
        }
    };

    const handleMail = async () => {
        // Assuming backend handles mail content based on stage or similar, 
        // or we might need a specific DTP mail endpoint.
        // Given the previous code just called sendsampleorderMailQuoatation, 
        // we'll stick with that for now, but realize it might send a "Quotation" email 
        // unless the backend is smart enough or we change the endpoint.
        // The user instruction "dont use quotation sharemodal" suggests UI separation,
        // but without backend changes, the email logic remains the same action.

        setIsSubmittingMail(true);
        showLoader();
        try {
            let result;
            if (shareType === 'master' || shareType === 'proofing') {
                const dtpId = job._id || job.id;
                result = await dispatch(sendSampleOrderMailDtp({ id: sampleOrderId, type: shareType, dtpId }));
            } else {
                result = await dispatch(sendsampleorderMailQuoatation(sampleOrderId));
            }

            if (result.payload?.success) {
                toast.success("Mail sent successfully!");
            } else {
                toast.error(result.payload?.message || "Unable to send mail");
            }
        } catch (error) {
            toast.error("Error sending mail");
        } finally {
            hideLoader();
            setIsSubmittingMail(false);
            onClose();
        }
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
                zIndex: 9999,
            }}
        >
            <div
                className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold mb-2">
                    {shareType === 'master' ? "Share Master Template" :
                        shareType === 'proofing' ? "Share Content Proof" :
                            "Share Files"}
                </h2>

                <button
                    className={`flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-all ${isSubmittingWhatsApp || isSubmittingMail ? "bg-green-500 opacity-70 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                    onClick={handleWhatsAppClick}
                    disabled={isSubmittingWhatsApp || isSubmittingMail}
                >
                    {isSubmittingWhatsApp ? "Processing..." : (
                        <>
                            <WhatsAppIcon />
                            WhatsApp
                        </>
                    )}
                </button>

                <button
                    className={`flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-all ${isSubmittingWhatsApp || isSubmittingMail ? "bg-blue-500 opacity-70 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
                    onClick={handleMail}
                    disabled={isSubmittingWhatsApp || isSubmittingMail}
                >
                    {isSubmittingMail ? "Sending..." : (
                        <>
                            <EmailIcon />
                            Mail
                        </>
                    )}
                </button>

                <button
                    className={`mt-2 text-sm transition-all ${isSubmittingWhatsApp || isSubmittingMail ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:underline"}`}
                    onClick={onClose}
                    disabled={isSubmittingWhatsApp || isSubmittingMail}
                >
                    Cancel
                </button>
            </div>

            {/* Modal to select WhatsApp number */}
            {selectNumberModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectNumberModal(false);
                    }}
                >
                    <div
                        className="bg-white rounded-lg p-6 w-72 shadow-lg flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-md font-semibold mb-2">Select WhatsApp Number</h3>
                        {Array.isArray(mobileNumbers) && mobileNumbers.map((num, idx) => (
                            <button
                                key={idx}
                                className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                                onClick={() => handleWhatsApp(num)}
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

export default DtpFileShareModal;
