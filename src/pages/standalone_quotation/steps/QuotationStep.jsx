import React, { useState, useEffect } from "react";
import { FormControl, Select, MenuItem } from "@mui/material";
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { generateQuotationPDF } from "./generateQuotationPDF";
import { getFileName } from "../../../utils/helper/FilenameURL";
import axios from "axios";
import { useDispatch } from "react-redux";
import { downloadQuotationPDF } from "../../../reducer/standalone_bomReducer";
import { useNavigate } from "react-router-dom";

export default function QuotationStep({ formData, setFormData, handleNext, handleBack, handleSaveDraft, isSubmitting, isViewMode}) {
  
  const [margin, setMargin] = useState(formData?.quotation?.margin || 0);
  const [marginType, setMarginType] = useState(formData?.quotation?.marginType || "%");
  const [finalUnitPrice, setFinalUnitPrice] = useState(formData?.quotation?.finalUnitPrice || formData.totalUnitCost || 0);
  const [finalJobPrice, setFinalJobPrice] = useState(formData?.quotation?.finalJobPrice || formData.totalJobCost || 0);
  const [gstRate, setGstRate] = useState(formData?.quotation?.gstRate || "18");
const [artwork, setArtwork] = useState({
  pdf: null,
  cdr: null,
  existing_pdf: formData?.artwork_pdf_url || "",
  existing_cdr: formData?.artwork_cdr_url || "",
});

      const navigate = useNavigate();


// useEffect(() => {
//   setArtwork({
//     pdf: null,
//     cdr: null,
//     existing_pdf: formData?.artwork_pdf_url || "",
//     existing_cdr: formData?.artwork_cdr_url || "",
//   });
// }, [formData?.artwork_pdf, formData?.artwork_cdr]);


  // Recalculate prices when margin or base costs change
  useEffect(() => {
    const baseUnit = formData.totalUnitCost || 0;
    const baseJob = formData.totalJobCost || 0;

    const calculatedUnitPrice =
      marginType === "₹" ? baseUnit + Number(margin || 0) : baseUnit + (baseUnit * (Number(margin || 0) / 100));

    const calculatedJobPrice =
      marginType === "₹" ? baseJob + Number(margin || 0) : baseJob + (baseJob * (Number(margin || 0) / 100));

    setFinalUnitPrice(calculatedUnitPrice);
    setFinalJobPrice(calculatedJobPrice);
  }, [margin, marginType, formData.totalUnitCost, formData.totalJobCost]);

  // Automatically update formData whenever relevant state changes
  useEffect(() => {
    const quotationData = { margin, marginType, finalUnitPrice, finalJobPrice, gstRate, artwork };
    setFormData(prev => ({ ...prev, quotation: {...quotationData,  artwork,} }));
  }, [margin, marginType, finalUnitPrice, finalJobPrice, gstRate, artwork, setFormData]);

const handleUpload = (e, type) => {
  const file = e.target.files[0];
  if (!file) return;

  setArtwork((prev) => ({
    ...prev,
    [type]: file,
  }));
};




  // const generatequote = () => {
  //   generateQuotationPDF({ ...formData, quotation: { margin, marginType, finalUnitPrice, finalJobPrice, gstRate, artwork } });
  // };

const dispatch = useDispatch();



const buildPayload = () => {
  const formDataPayload = new FormData();

  formDataPayload.append("product_name", formData.productName);
  formDataPayload.append("job_quantity", formData.jobQty);
  formDataPayload.append("sub_job_no", formData.subJobNo);
  formDataPayload.append("reference_no", formData.reference_no || "");
  formDataPayload.append("jobDescription", formData.jobDescription);

  // Quotation fields
  formDataPayload.append("quotation[margin]", margin);
  formDataPayload.append("quotation[marginType]", marginType);
  formDataPayload.append("quotation[finalUnitPrice]", finalUnitPrice);
  formDataPayload.append("quotation[finalJobPrice]", finalJobPrice);
  formDataPayload.append("quotation[gstRate]", gstRate);

  // File
  if (formData.imageFile instanceof File) {
    formDataPayload.append("image", formData.imageFile);
  } else if (formData.orgimage) {
    formDataPayload.append("orgimage", formData.orgimage);
  }

  return formDataPayload;
};


const generatequote = async () => {
  try {
    await dispatch(
      downloadQuotationPDF({
        payload: buildPayload(),
        mode: "download",
      })
    ).unwrap();
  } catch {
    alert("Failed to generate quotation PDF");
  }
};

const printQuote = async () => {
  try {
    await dispatch(
      downloadQuotationPDF({
        payload: buildPayload(),
        mode: "print",
      })
    ).unwrap();
  } catch {
    alert("Failed to print quotation");
  }
};



//   const printQuote = () => {
//   generateQuotationPDF({ ...formData, quotation: { margin, marginType, finalUnitPrice, finalJobPrice, gstRate, artwork } }, true);
// };

  return (
    <div className="space-y-8">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            padding: "24px",
            borderRadius: "12px",
            backgroundColor: "rgb(238 242 255 / var(--tw-bg-opacity, 1))",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", textAlign: "center", color: "#4f46e5" }}>
            Finalize Quotation
          </h1>

          {/* Add Margin */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>Add Margin</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                 disabled={isViewMode}
                style={{ border: "1px solid #ccc", padding: "6px 8px", borderRadius: "4px", width: "100%" }}
              />
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setMarginType("%")}
                 disabled={isViewMode}

                  style={marginType === "%" ? { backgroundColor: "#4f46e5", color: "white", padding: "6px 12px", borderRadius: "4px", border: "1px solid #ccc" } : { padding: "6px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  %
                </button>
                <button
                  onClick={() => setMarginType("₹")}
                 disabled={isViewMode}

                  style={marginType === "₹" ? { backgroundColor: "#4f46e5", color: "white", padding: "6px 12px", borderRadius: "4px", border: "1px solid #ccc" } : { padding: "6px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  ₹
                </button>
              </div>
            </div>
          </div>

          {/* GST Rate */}
          <div style={{ marginBottom: "16px" }}>
            <FormControl fullWidth size="small">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select GST Rate</label>
              <Select
                labelId="gst-rate-label"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                displayEmpty
                 disabled={isViewMode}

              >
                <MenuItem value="18">18% GST</MenuItem>
                <MenuItem value="5">5% GST</MenuItem>
                <MenuItem value="0">0% (Export/Exempt)</MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Artwork Upload */}
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontWeight: "600", marginBottom: "8px" }}>Artwork Assets</h2>
            <div style={{ display: "flex", gap: "24px" }}>
            {/* Corel File */}
<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
  <span style={{ marginBottom: "4px", color: "#4f46e5", fontWeight: "500", fontSize: "12px" }}>
    Upload Corel (.cdr)
  </span>
  <input
    id="cdr-upload"
    type="file"
    accept=".cdr"
    style={{ display: "none" }}
    onChange={(e) => handleUpload(e, "cdr")}
  />
  <button
                 disabled={isViewMode}

    onClick={() => document.getElementById("cdr-upload").click()}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "#4f46e5",
      color: "white",
      padding: "8px 12px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
    }}
  >
    <DescriptionIcon />
    Choose File
  </button>

  {(artwork.cdr || artwork.existing_cdr) && (
    <div
      style={{
        marginTop: "8px",
        border: "1px solid #ccc",
        padding: "8px",
        width: "100%",
        height: "80px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
      }}
    >
      <DescriptionIcon style={{ color: "#4f46e5" }} />
      {artwork.cdr ? (
        <span>{artwork.cdr.name}</span>
      ) : artwork.existing_cdr ? (
        <a href={artwork.existing_cdr} target="_blank" rel="noreferrer">
          {getFileName(artwork.existing_cdr)}
        </a>
      ) : null}
    </div>
  )}
</div>


              {/* PDF File */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ marginBottom: "4px", color: "#4f46e5", fontWeight: "500", fontSize: "12px" }}>Upload PDF (.pdf)</span>
                <input id="pdf-upload" type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleUpload(e, "pdf")} />
                <button
                  onClick={() => document.getElementById("pdf-upload").click()}
                 disabled={isViewMode}

                  style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#4f46e5", color: "white", padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer" }}
                >
                  <PictureAsPdfIcon />
                  Choose File
                </button>
               {(artwork.pdf || artwork.existing_pdf) && (
                  <div style={{ marginTop: "8px", border: "1px solid #ccc", padding: "8px", width: "100%", height: "80px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    <PictureAsPdfIcon style={{ color: "#4f46e5" }} />
                     {artwork.pdf ? artwork.pdf.name : (
      <a href={artwork.existing_pdf} target="_blank" rel="noreferrer">

                     {artwork.existing_pdf ? getFileName(artwork.existing_pdf) : artwork.cdr}

      </a>
    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Final Prices */}
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    color: "#4f46e5",
    width: "100%",
  }}
>
  <span
    style={{
      fontWeight: 600,
      fontSize: "clamp(14px, 4vw, 16px)",
      flex: 1,
      textAlign: "left",
    }}
  >
    Final Unit Price (Excl. GST)
  </span>

  <div
    style={{
      fontSize: "clamp(18px, 5vw, 24px)",
      fontWeight: 700,
      textAlign: "right",
      whiteSpace: "nowrap",
    }}
  >
    ₹ {finalUnitPrice.toFixed(2)}
  </div>
</div>


          {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", color: "#4f46e5" }}>
            <span style={{ fontWeight: "600" }}>Final Total Job Price (Excl. GST)</span>
            <div style={{ fontSize: "24px", fontWeight: "700" }}>₹ {finalJobPrice.toFixed(2)}</div>
          </div> */}

        </div>
      </div>

     <div className="flex justify-center gap-3">
      <button
        onClick={generatequote}
        className="px-4 py-2 text-white rounded"
        style={{ fontWeight: 600, backgroundColor: "#4f46e5" }}
      >
        Generate PDF Quote
      </button>

      <button
        onClick={printQuote}
        className="px-4 py-2 text-white rounded"
        style={{ fontWeight: 600, backgroundColor: "#16a34a" }}
      >
        Print Quote
      </button>
    </div>


      <div className="flex justify-between mt-6">
        <button onClick={handleBack}    className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">
          Back
        </button>

        
 {isViewMode ? (
  <button
  onClick={() => navigate(-1)}
  className="px-4 py-2 rounded-md bg-red-600 text-white border border-red-700 hover:bg-red-700"
>
  Close
</button>

  ) : (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleSaveDraft({ quotation: formData.quotation })}
        className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save as Draft"}
      </button>
      <button
        onClick={handleNext}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin border-4 border-white border-t-transparent w-5 h-5 rounded-full mr-2" />
            <span>Submitting</span>
          </div>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  )}

      </div>
    </div>
  );
}
