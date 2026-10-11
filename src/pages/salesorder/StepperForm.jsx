import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSamplesalesOrderById,
  updateSampleSalesOrder,
} from "../../reducer/sampleSalesorderReducer";
import JobDetails from "./JobDetails";
import ClientDetails from "./ClientDetails";
import MarketingCoordinator from "./MarketingCoordinator";
import PackagingDetails from "./PackagingDetails";
import DeliveryDetails from "./DeliveryDetails";
import PaymentDetails from "./PaymentDetails";
import ApprovedProductImages from "./ApprovedProductImages";
import BankAccountDetails from "./BankAccountDetails";
import Remarks from "./Remarks";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SalesOrderShareModal from "./SalesOrderShareModal";

const steps = [
  "Job Details",
  "Client Details",
  "Assign Coordinator",
  "Packaging Details",
  "Delivery Details",
  "Payment",
  "Approved Product Images",
  "Bank Account Details",
  "Remarks",
];

const stepComponents = [
  JobDetails,
  ClientDetails,
  MarketingCoordinator,
  PackagingDetails,
  DeliveryDetails,
  PaymentDetails,
  ApprovedProductImages,
  BankAccountDetails,
  Remarks,
];

export default function StepperForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const CurrentStep = stepComponents[activeStep];

  const dispatch = useDispatch();
  const { sampleOrderid } = useParams();
  const { sotype } = useParams();



  const { singleSamplesalesOrder, loadingSingle } = useSelector(
    (state) => state.sampleSalesOrders
  );

  useEffect(() => {
    if (sampleOrderid) {
      dispatch(fetchSamplesalesOrderById(sampleOrderid));
    }
  }, [sampleOrderid, dispatch]);

  useEffect(() => {
    if (!singleSamplesalesOrder) return;

    // Always read from enquiry_id if available
    const data = singleSamplesalesOrder.enquiry_id || {};

    // preload image (optional)
    if (singleSamplesalesOrder.image) {
      const img = new Image();
      img.src = singleSamplesalesOrder.image;
    }

  
    // NORMALIZE PRODUCT SIZE
    // [{ cms: "3" }] → { cms: "3" }
    let productSizeObj = {};

    if (Array.isArray(data.product_size)) {
      data.product_size.forEach((item) => {
        const key = Object.keys(item)[0];
        const value = item[key];
        productSizeObj[key] = value;
      });
    }

    // MARKETING COORDINATOR IDS
    const coordinatorIds = Array.isArray(data.marketing_cordinator)
      ? data.marketing_cordinator.map((c) => c._id)
      : [];

    // SET FORM DATA (single update)
    setFormData((prev) => ({
      ...prev,

      // category
      category: data.category || prev.category || "",
      subcategory: data.subcategory || prev.subcategory || "",

      // basic
      clientName: data.name || data.client_name || prev.clientName || "",
      contactPerson: data.contact_person || prev.contactPerson || "",
      phoneNumber:
        data.mobile_no != null
          ? data.mobile_no.toString()
          : prev.phoneNumber || "",

      // email
      emails: Array.isArray(data.email) ? data.email : prev.emails || [],

      // whatsapp
      whatsapp_numbers: Array.isArray(data.wp_number)
        ? data.wp_number.map((x) => x.toString())
        : prev.whatsapp_numbers || [],

      // product
      productName: data.product_name || prev.productName || "",
      unit: data.unit || prev.unit || "",
      product_size: productSizeObj,

      // marketing coordinator
      coordinatorIds: coordinatorIds.length
        ? coordinatorIds
        : prev.coordinatorIds || [],
    }));
  }, [singleSamplesalesOrder]);

  const handleNext = (stepData) => {
    setFormData({ ...formData, ...stepData });
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const goToStep = (index) => setActiveStep(index);

  const handleFinalSubmit = async (finalData) => {
    try {
      setIsSubmitting(true); // Start loader
      const fd = new FormData();
      // JOB DETAILS
      fd.append("job_quantity", formData.jobQty);
      fd.append("job_completion_datetime", formData.completionDate);
      fd.append("category", formData.category);
      fd.append("subcategory", formData.subcategory);

      // CLIENT DETAILS
      fd.append("client_name", formData.clientName);
      fd.append("contact_person", formData.contactPerson);
      fd.append("mobile_no", formData.phoneNumber);

      // Send emails as array
      if (formData.emails && formData.emails.length > 0) {
        formData.emails.forEach((email, index) => {
          fd.append(`email[${index}]`, email);
        });
      }

      // Send WhatsApp numbers as array
      if (formData.whatsapp_numbers && formData.whatsapp_numbers.length > 0) {
        formData.whatsapp_numbers.forEach((number, index) => {
          fd.append(`wp_number[${index}]`, parseInt(number));
        });
      }
      fd.append("billing_address_1", formData.billingAddress1);
      fd.append("billing_address_2", formData.billingAddress2);
      fd.append("billing_city", formData.city);
      fd.append("billing_state", formData.state);
      fd.append("billing_postal_code", formData.postalCode);
      fd.append("billing_gst_no", formData.gstNumber);

      // PRODUCT DETAILS
      fd.append("product_name", formData.productName);
      // fd.append("unit_of_measurement", formData.unit);
      fd.append("price_per_piece", formData.pricePerPiece);
      fd.append("unit", formData.unit);

      const isSampleReq = formData.sample_required?.toLowerCase() === "yes" || sotype === "sample";
      fd.append("sample_required", isSampleReq);

      // Only proceed if product_size exists and has keys
      if (
        formData.product_size &&
        Object.keys(formData.product_size).length > 0
      ) {
        // Create a new clean object (no undefined keys)
        const cleaned = {};

        // Loop through product_size entries
        Object.entries(formData.product_size).forEach(([key, value]) => {
          // Skip invalid keys: empty, string, null,undefined, key literally equal to "undefined"
          if (!key || key === "undefined" || value === undefined) {
            return; // skip this entry
          }

          // Add only valid key–value pair
          cleaned[key] = value;
        });

        // Wrap inside array → backend expects array format
        const finalArray = [cleaned];

        // Append to FormData
        fd.append("product_size", JSON.stringify(finalArray));
      }

      // PACKAGING DETAILS
      fd.append("packing_type", formData.packingType);
      fd.append("inner_packing_type", formData.innerPackingType);
      fd.append("premium_packing_option", formData.premiumOptions);
      fd.append("packing_instruction", formData.packingInstructions);
      fd.append("packing_mode", formData.packingMode);

      // DELIVERY DETAILS
      fd.append("delivery_date", formData.deliveryDate);
      fd.append("delivery_address", formData.deliveryLocation);
      fd.append("delivery_type", formData.deliveryType);
      fd.append(
        "delivery_mode",
        formData.customDeliveryMode || formData.deliveryMode
      );
      fd.append("who_will_pay", formData.whoWillPay);

      if (formData.whoWillPay === "RD Courier" || formData.courierAmount) {
        fd.append("courier_amount", formData.courierAmount || 0);
        fd.append("add_in_invoice", formData.addInInvoice || false);
      }

      if (formData.multiDeliveries && formData.multiDeliveries.length > 0) {
        fd.append("multi_deliveries", JSON.stringify(formData.multiDeliveries));
      }

      // PAYMENT DETAILS
      fd.append("payment", formData.payment_terms);

      // BANK DETAILS additionalNotes
      if (formData.additionalNotes) {
        fd.append("bank_details_description", formData.additionalNotes);
      }

      // MARKETING COORDINATOR
      if (formData.coordinatorIds && formData.coordinatorIds.length > 0) {
        const formatted = formData.coordinatorIds.map((id) => ({
          user: id,
          remarks: "",
        }));

        fd.append("marketing_cordinator", JSON.stringify(formatted));
      }

      // REMARKS
      if (finalData.remarks) {
        fd.append("remarks", finalData.remarks);
      }

      // multiple files
      formData.productFile.forEach((file) => {
        fd.append("product_files", file);
      });

      console.log("FormData contents:", formData);

      await dispatch(
        updateSampleSalesOrder({ sampleOrderid, formData: fd })
      ).unwrap();

      toast.success("Sales order updated successfully!");
      setShowShareModal(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error submitting sales order"
      );
    } finally {
      setIsSubmitting(false); // Stop loader
    }
  };

  return (
    <div className="flex justify-center items-start h-[calc(100vh-80px)] bg-gray-100 mt-20 overflow-hidden mb-10">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-md p-6 flex flex-col max-h-full overflow-hidden">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
      { sotype === "production" ?  "Production Order Form": "Sample Order Form"}
          
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Complete all steps
        </p>

        {/* Responsive Stepper - Wraps on smaller screens, single line on large */}
        <div className="flex flex-wrap justify-center md:justify-between items-start mb-6 gap-y-4">
          {steps.map((label, idx) => {
            const isActive = idx === activeStep;
            const isCompleted = idx < activeStep;

            return (
              <div
                key={idx}
                className="flex flex-col items-center w-[calc(33.333%-0.5rem)] sm:w-auto sm:flex-1 sm:min-w-[80px] relative px-1"
                // onClick={() => goToStep(idx)}
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 transition-colors z-10 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <span className="text-sm md:text-base">{idx + 1}</span>
                </div>

                <span
                  className={`text-[9px] sm:text-[10px] md:text-xs text-center leading-tight ${
                    isActive
                      ? "text-blue-600 font-medium"
                      : isCompleted
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {label}
                </span>

                {/* Connection line - only visible on larger screens */}
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden sm:block absolute top-5 md:top-6 left-[calc(50%+20px)] md:left-[calc(50%+24px)] right-[calc(-50%+20px)] md:right-[calc(-50%+24px)] h-0.5 ${
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
          <CurrentStep
            handleNext={(stepData) => {
              if (activeStep === steps.length - 1) {
                // Merge final data correctly
                const finalData = { ...formData, ...stepData };

                // Update UI state
                setFormData(finalData);

                // Submit using merged data
                handleFinalSubmit(finalData);
              } else {
                handleNext(stepData);
              }
            }}
            handleBack={handleBack}
            formData={formData}
            setFormData={setFormData}
            SamplesalesOrderdata={singleSamplesalesOrder}
            isSubmitting={isSubmitting}
            sotype={sotype}
          />
        </div>
      </div>
      
      {showShareModal && (
        <SalesOrderShareModal 
          salesOrder={singleSamplesalesOrder} 
          onClose={() => {
            setShowShareModal(false);
            navigate(-1);
          }} 
        />
      )}
    </div>
  );
}
