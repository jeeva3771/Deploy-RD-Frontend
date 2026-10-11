import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import JobDetails from "./JobDetails";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchSamplesalesOrderById, updateSampleSalesOrder } from "../../../reducer/sampleSalesorderReducer";
import MaterialSelect from "./MaterialSelect";
import Specification from "./Specification";
import MaterialGroup from "./MaterialGroup";
import MaterialGroupWithProcesses from "./materialProcess";
import PackingStep from "./PackingStepper";
import CostingDetails from "./CostingDetails";
import jobSheet from "./JobSheet";
import QuotationStep from "./QuotationStep";
import { createBOM, fetchBOMById, updateBOM, saveBOMDraft } from "../../../reducer/standalone_bomReducer";
import ImageLightbox from "../../common/ImageLightbox";


const steps = [
  "Job ",
  "Mat",
  "Spec",
  "Grp",
  "Proc",
  "Pak",
  "cost",
  "Job",
  "quote"
];

const stepComponents = [
  JobDetails,
  MaterialSelect,
  Specification,
  MaterialGroup,
  MaterialGroupWithProcesses,
  PackingStep,
  CostingDetails,
  jobSheet,
  QuotationStep,
];

export default function StepperForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
   const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isStepRestored, setIsStepRestored] = useState(false);


  const CurrentStep = stepComponents[activeStep];

  const dispatch = useDispatch();
  const { sampleOrderid } = useParams();
  const { bomid } = useParams();

  const { sotype } = useParams();


  const location = useLocation();

  const isViewMode = location.pathname.includes(
    "/standalone/quotation/view"
  );

  const { singleSamplesalesOrder, loadingSingle } = useSelector(
    (state) => state.sampleSalesOrders
  );

  const { selectedBOM, loading } = useSelector(
    (state) => state.standalonebom
  );

  useEffect(() => {
    if (sampleOrderid) {
      dispatch(fetchSamplesalesOrderById(sampleOrderid));
    }
  }, [sampleOrderid, dispatch]);


  useEffect(() => {
    if (bomid) {
      dispatch(fetchBOMById(bomid));
    }
  }, [bomid, dispatch]);

  console.log("selectedBOM", selectedBOM);

  useEffect(() => {
    if (!bomid || !selectedBOM) return;

    setFormData((prev) => ({
      ...prev,

      // Job
      jobQty: selectedBOM.job_quantity,
      originalJobQty: selectedBOM.job_quantity,
      subJobNo: selectedBOM.sub_job_no,
      jobNo: selectedBOM.job_no,
      productName: selectedBOM.product_name,
      orgimage: selectedBOM.org_image,
      jobDescription: selectedBOM.jobDescription,
      reference_no: selectedBOM.enquiry_id?.reference_no || "",

      // Materials
      customItems: selectedBOM.items || [],

      materialSpecification: selectedBOM.material_specification || [],

      materialGroups: selectedBOM.material_groups || [],

      materialprocess: selectedBOM.materialprocess || [],

      packingdatas: selectedBOM.packingdatas || [],

      costDetails: selectedBOM.costdetails || {},

      jobSheet: selectedBOM.jobSheet || {},

      quotation: selectedBOM.quotation || {},

      artwork_pdf: selectedBOM.artwork_pdf || "",
      artwork_cdr: selectedBOM.artwork_cdr || "",

      artwork_pdf_url: selectedBOM.artwork_pdf_url || "",
      artwork_cdr_url: selectedBOM.artwork_cdr_url || "",


      totalUnitCost: selectedBOM.quotation?.finalUnitPrice,
      totalJobCost: selectedBOM.quotation?.finalJobPrice,
    }));
  }, [bomid, selectedBOM]);

  // Restore the step the user was on when they saved the draft
  useEffect(() => {
    if (bomid && selectedBOM && selectedBOM.is_bom_draft && !isStepRestored) {
      if (selectedBOM.draft_step !== undefined) {
        setActiveStep(Number(selectedBOM.draft_step));
        setIsStepRestored(true);
      }
    }
  }, [bomid, selectedBOM, isStepRestored]);

  // console.log("selectedBOM.org_image", selectedBOM?.org_image)
  // console.log("orgimage",formData.orgimage)

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

      emails: Array.isArray(data.email) ? data.email : prev.emails || [],

      // whatsapp
      whatsapp_numbers: Array.isArray(data.wp_number)
        ? data.wp_number.map((x) => x.toString())
        : prev.whatsapp_numbers || [],

      // product
      productName: data.product_name || prev.productName || "",
      reference_no: data.reference_no || prev.reference_no || "",
    }));
  }, [singleSamplesalesOrder]);

  const handleNext = (stepData) => {
    console.log("stepData", stepData)
    setFormData({ ...formData, ...stepData });
    setActiveStep((prev) => prev + 1);
  };


  const handleBack = () => setActiveStep((prev) => prev - 1);


  const goToStep = (index) => setActiveStep(index);

  // SAVE AS DRAFT — uses upsert endpoint to avoid duplicate BOM records
  const handleSaveDraft = async (currentStepData = {}) => {
    if (isViewMode) {
      toast.info("View only mode");
      return;
    }
    try {
      setIsSubmitting(true);
      const combinedData = { ...formData, ...currentStepData };
      const fd = new FormData();

      // For standalone, some fields are optional
      fd.append("sales_order_id",  sampleOrderid || "");
      if (bomid) {
        fd.append("bom_id", bomid);
      }
      fd.append("enquiry_id",      singleSamplesalesOrder?.enquiry_id?._id
                                || singleSamplesalesOrder?.enquiry_id
                                || selectedBOM?.enquiry_id?._id
                                || selectedBOM?.enquiry_id
                                || "");
      fd.append("job_quantity",    combinedData.jobQty      || 0);
      fd.append("sub_job_no",      combinedData.subJobNo    || "");
      fd.append("product_name",    combinedData.productName || "");
      fd.append("job_no",          combinedData.jobNo       || "");
      fd.append("jobDescription",  combinedData.jobDescription || "");
      fd.append("draft_step",      activeStep);

      if (combinedData.imageFile instanceof File) {
        fd.append("image", combinedData.imageFile);
      } else if (combinedData.orgimage) {
        fd.append("orgimage", combinedData.orgimage);
      }

      if (combinedData.customItems?.length > 0)
        fd.append("items", JSON.stringify(combinedData.customItems));

      if (combinedData.materialSpecification)
        fd.append("material_specification", JSON.stringify(combinedData.materialSpecification));

      if (combinedData.materialGroups)
        fd.append("material_groups", JSON.stringify(combinedData.materialGroups));

      if (combinedData.materialprocess)
        fd.append("materialprocess", JSON.stringify(combinedData.materialprocess));

      if (combinedData.packingdatas)
        fd.append("packingdatas", JSON.stringify(combinedData.packingdatas));

      if (combinedData.costDetails)
        fd.append("costdetails", JSON.stringify(combinedData.costDetails));

      if (combinedData.jobSheet)
        fd.append("jobSheet", JSON.stringify(combinedData.jobSheet));

      if (combinedData.quotation) {
        const q = { ...combinedData.quotation };
        delete q.artwork;
        fd.append("quotation", JSON.stringify(q));
      }

      const artwork = combinedData.quotation?.artwork || {};
      if (artwork.pdf instanceof File) {
        fd.append("artwork_pdf", artwork.pdf);
      } else if (artwork.existing_pdf) {
        fd.append("clone_artwork_pdf_key", formData.artwork_pdf);
      }

      if (artwork.cdr instanceof File) {
        fd.append("artwork_cdr", artwork.cdr);
      } else if (artwork.existing_cdr) {
        fd.append("clone_artwork_cdr_key", formData.artwork_cdr);
      }

      await dispatch(saveBOMDraft(fd)).unwrap();
      toast.success("BOM saved as draft!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error(error?.message || "Error saving draft");
    } finally {
      setIsSubmitting(false);
    }
  };


  //   console.log("customItems", JSON.stringify(formData.customItems));
  //   console.log("________________________________________________________________________________")
  //       console.log("materialSpecification",JSON.stringify(formData.materialSpecification) );

  //   console.log("________________________________________________________________________________")

  //       console.log("materialGroups",  JSON.stringify(formData.materialGroups) );

  //   console.log("________________________________________________________________________________")

  //       console.log("materialprocess",  JSON.stringify(formData.materialprocess) );

  //   console.log("________________________________________________________________________________")

  //       console.log("packingdatas",  JSON.stringify(formData.packingdatas) );

  //         console.log("________________________________________________________________________________")

  //       console.log("costdetails",  JSON.stringify(formData.costDetails) );
  //       console.log("________________________________________________________________________________")

  //       console.log("jobSheet",  JSON.stringify(formData.jobSheet) );


  // console.log("totalUnitCost",formData.totalUnitCost)
  // console.log("totalJobCost",formData.totalJobCost)


  //   console.log("________________________________________________________________________________")

  //       console.log("quotation",  JSON.stringify(formData.quotation) );


  // console.log("singleSamplesalesOrder",singleSamplesalesOrder)

  const handleFinalSubmit = async (finalData) => {
    if (isViewMode) {
      toast.info("View only mode");
      return;
    }
    try {
      setIsSubmitting(true);
      const fd = new FormData();


      fd.append("sales_order_id", sampleOrderid)

      fd.append("enquiry_id", singleSamplesalesOrder?.enquiry_id?._id);

      fd.append("job_quantity", formData.jobQty);
      fd.append("sub_job_no", formData.subJobNo);
      fd.append("product_name", formData.productName);
      fd.append("job_no", formData.jobNo);
      // fd.append("orgimage", formData.orgimage);     
      fd.append("jobDescription", formData.jobDescription);


      if (formData.imageFile instanceof File) {
        fd.append("image", formData.imageFile);
      } else if (formData.orgimage) {
        fd.append("orgimage", formData.orgimage);
      }



      // Material DETAILS
      if (formData.customItems && formData.customItems.length > 0) {
        fd.append("items", JSON.stringify(formData.customItems));
      }

      fd.append(
        "material_specification",
        JSON.stringify(formData.materialSpecification)
      );

      fd.append(
        "material_groups",
        JSON.stringify(formData.materialGroups)
      );

      fd.append(
        "materialprocess",
        JSON.stringify(formData.materialprocess)
      );

      fd.append("packingdatas", JSON.stringify(formData.packingdatas));

      fd.append("costdetails", JSON.stringify(formData.costDetails));

      fd.append("jobSheet", JSON.stringify(formData.jobSheet));


      // Quotation data except files
      const quotationData = { ...finalData.quotation };
      delete quotationData.artwork;
      fd.append("quotation", JSON.stringify(quotationData));

      // // Now append files separately
      // if (finalData.quotation.artwork) {
      //   if (finalData.quotation.artwork.pdf) {
      //     fd.append("artwork_pdf", finalData.quotation.artwork.pdf);
      //   }
      //   if (finalData.quotation.artwork.cdr) {
      //     fd.append("artwork_cdr", finalData.quotation.artwork.cdr);
      //   }
      // }

      const artwork = finalData.quotation?.artwork || {};

      // PDF
      if (artwork.pdf instanceof File) {
        fd.append("artwork_pdf", artwork.pdf); // new upload
      } else if (artwork.existing_pdf) {
        fd.append("clone_artwork_pdf_key", formData.artwork_pdf);
      }

      // CDR
      if (artwork.cdr instanceof File) {
        fd.append("artwork_cdr", artwork.cdr);
      } else if (artwork.existing_cdr) {
        fd.append("clone_artwork_cdr_key", formData.artwork_cdr);
      }






      console.log("FormData contents:", formData);





      if (bomid) {
        await dispatch(
          updateBOM({
            id: bomid,
            payload: fd,
          })
        ).unwrap();

        toast.success("BOM updated successfully!");
      } else {

        await dispatch(createBOM(fd)).unwrap();

        toast.success("BOM created successfully!");
      }

      navigate(-1);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error submitting Bom"
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      {/* <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 mt-12"> */}
      {/* <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 mt-12" style ={ {backgroundColor: "#4f46e5"}}> */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 mt-12 p-6 rounded-xl shadow-md"
        style={{ backgroundColor: "#4f46e5", color: "white" }}>

        <div className="md:w-1/4 flex justify-start">
          {/* {singleSamplesalesOrder?.image ? (
        <img
          src={singleSamplesalesOrder.image}
          alt="Sample"
          className="max-w-full max-h-16 object-contain"
        />
      ) : (
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          No Image
        </div>
      )} */}
          {formData?.orgimage || singleSamplesalesOrder?.image ? (
             <img
              src={formData?.orgimage || singleSamplesalesOrder?.image}
              alt="Sample"
              className="max-w-full max-h-16 object-contain cursor-zoom-in"
              onClick={() => setPreviewImage(formData?.orgimage || singleSamplesalesOrder?.image)}
            />

          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              No Image
            </div>
          )}

        </div>

        <div className="md:w-1/2 text-center">
          <div className="text-3xl font-bold text-gray-100">Pricing Engine</div>
          <div className="text-sm text-gray-100">Complete all steps</div>
        </div>

        <div className="md:w-1/4 flex flex-col items-end text-sm">
          <div className="font-bold text-gray-100">Job No: {formData.subJobNo || singleSamplesalesOrder?.sub_job_no}</div>
          <div className="font-bold text-gray-100">Reference No: {singleSamplesalesOrder?.enquiry_id?.reference_no || " "}</div>
          <div className="font-bold text-gray-100">Job Qty: {formData.jobQty || singleSamplesalesOrder?.job_quantity}</div>
        </div>
      </div>




      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
          {steps.map((label, idx) => {
            const isActive = idx === activeStep;
            const isCompleted = idx < activeStep;

            return (
              <div
                key={idx}
                // onClick={() => goToStep(idx)}
                className={`
                cursor-pointer px-4 py-2 rounded-md text-sm font-medium
                transition-all
                ${isCompleted
                    ? "bg-violet-100 text-violet-700"
                    : !isActive
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : ""
                  }
              `}
                style={isActive ? { backgroundColor: "#4f46e5", color: "white" } : {}}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center items-start min-h-screen p-4 bg-gray-100 ">
        <div className="w-full bg-white rounded-xl shadow-md p-6">






          {/* <div className="flex justify-center mb-6">
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
        {steps.map((label, idx) => {
          const isActive = idx === activeStep;
          const isCompleted = idx < activeStep;

          return (
            <div
              key={idx}
              // onClick={() => goToStep(idx)}
              className={`
                cursor-pointer px-4 py-2 rounded-md text-sm font-medium
                transition-all
                ${isCompleted
                  ? "bg-violet-100 text-violet-700"
                  : !isActive
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : ""
                }
              `}
              style={isActive ? { backgroundColor: "#4f46e5", color: "white" } : {}}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div> */}



          {/* Current step form */}
          <CurrentStep
            handleNext={(stepData) => {
              if (activeStep === steps.length - 1) {
                const finalData = { ...formData, ...stepData };
                setFormData(finalData);
                handleFinalSubmit(finalData);
              } else {
                handleNext(stepData);
              }
            }}
            handleBack={handleBack}
            formData={formData}
            setFormData={setFormData}
            SamplesalesOrderdata={singleSamplesalesOrder}
            handleSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            sotype={sotype}
            isViewMode={isViewMode}
          />
        </div>
      </div>
       {previewImage && (
        <ImageLightbox
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>

  );
}
