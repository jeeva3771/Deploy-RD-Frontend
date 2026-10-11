import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { axiosInstance } from '../../../../utils/url/config';
import { jsPDF } from 'jspdf';

export function ShippingLabelModal({ job, onClose, onUpdate, onLog, isPreviewOnly = false, autoPrint = false, showAllLabels = false, autoDownload = false }) {
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const rawDestinations = job?.destinations?.length
    ? job.destinations
    : [{
      id: "d1",
      name: job.sales_order?.contact_person || job.client_name || job.client || "Valued Client",
      addr: job.sales_order?.delivery_address || "Delivery Address Not Specified",
      qty: job.total_qty || job.qty || 1,
      contact_person: job.sales_order?.contact_person || "",
      contact_number: job.sales_order?.contact_number || job.sales_order?.mobile_no || "",
      delivery_mode: job.sales_order?.delivery_mode || "Courier",
      awb: job.awbNumbers?.[0] || ""
    }];

  // If challanList exists, EACH challan is processed as a separate shipping label!
  let cumulative = 0;
  const allDestinations = (job.challanList && Array.isArray(job.challanList) && job.challanList.length > 0)
    ? job.challanList.map((c, idx) => {
        const matched = rawDestinations.find(d => String(d.id || rawDestinations.indexOf(d)) === String(c.destId)) || rawDestinations[0] || {};
        const cQty = c.qty !== undefined ? Number(c.qty) : (matched.qty || 1);
        const locked = cumulative < (job.deliveredQty || 0);
        cumulative += cQty;
        return {
          id: c.id || `ch_lbl_${idx}`,
          originalIndex: idx,
          isLocked: locked,
          challanNo: c.challanNo || matched.challanNo || job.challanNo || "N/A",
          qty: cQty,
          name: matched.name || matched.contact_person || job.sales_order?.contact_person || job.client || "Valued Client",
          addr: matched.addr || matched.deliveryLocation || matched.delivery_address || job.sales_order?.delivery_address || "Delivery Address Not Specified",
          contact_person: matched.contact_person || job.sales_order?.contact_person || "",
          contact_number: matched.contact_number || job.sales_order?.contact_number || job.sales_order?.mobile_no || "",
          delivery_mode: matched.delivery_mode || job.sales_order?.delivery_mode || "Courier",
          awb: c.awb || matched.awb || job.awbNumbers?.[idx] || ""
        };
      })
    : (() => {
        let cumD = 0;
        return rawDestinations.map((d, idx) => {
          const locked = cumD < (job.deliveredQty || 0);
          cumD += Number(d.qty || 0);
          return { ...d, originalIndex: idx, isLocked: locked };
        });
      })();

  // Only show pending (unlocked) labels when generating/printing. Show all when previewing explicitly.
  const destinations = showAllLabels ? allDestinations : allDestinations.filter(d => !d.isLocked);

  const hasExistingAwb = Boolean(
    (job.awbNumbers && job.awbNumbers.some(a => a && String(a).trim())) ||
    (destinations && destinations.some(d => d.awb && String(d.awb).trim()))
  );

  const [includeAwb, setIncludeAwb] = useState(hasExistingAwb ? "yes" : "no");

  const [awbInputs, setAwbInputs] = useState(() => {
    const initial = {};
    destinations.forEach((d, idx) => {
      const origIdx = d.originalIndex !== undefined ? d.originalIndex : idx;
      initial[idx] = d.awb || job.awbNumbers?.[origIdx] || job.awbNumbers?.[idx] || "";
    });
    return initial;
  });

  const challanNo = job.challanNo || "N/A";
  const jobNo = job.job_no || job.id || job.sub_job_no || "N/A";
  const subJobNo = job.id || "N/A";
  const productName = job.product_name || job.product || "Trophy / Award";

  // Group destinations into pages of 3 labels per page
  const labelPages = React.useMemo(() => {
    const pages = [];
    for (let i = 0; i < destinations.length; i += 3) {
      pages.push(destinations.slice(i, i + 3));
    }
    return pages;
  }, [destinations]);

  // Save AWB ONLY when explicitly triggered
  const saveAwb = async (newAwbMap = awbInputs, isEnabled = includeAwb) => {
    if (!onUpdate) return;
    const updatedDests = rawDestinations.map((d, idx) => {
      const matchingIndex = destinations.findIndex(dest => (dest.originalIndex !== undefined ? dest.originalIndex : destinations.indexOf(dest)) === idx);
      if (matchingIndex !== -1) {
        return {
          ...d,
          awb: isEnabled === "yes" ? (newAwbMap[matchingIndex] || "").trim() : ""
        };
      }
      return d;
    });

    // awbNumbers MUST align 1:1 with all destinations, preserving previous and newly entered AWBs
    const fullAwbArray = updatedDests.map((d, idx) => {
      if (d.awb) return d.awb.trim();
      return (job.awbNumbers && job.awbNumbers[idx]) ? String(job.awbNumbers[idx]).trim() : "";
    });

    const patch = {
      awbNumbers: fullAwbArray,
      destinations: updatedDests
    };

    if (job.challanList && Array.isArray(job.challanList)) {
      patch.challanList = job.challanList.map((c, idx) => {
        const matchingDestIndex = destinations.findIndex(d => (d.originalIndex !== undefined ? d.originalIndex : destinations.indexOf(d)) === idx);
        if (matchingDestIndex !== -1 && isEnabled === "yes") {
          return {
            ...c,
            awb: (newAwbMap[matchingDestIndex] || "").trim()
          };
        }
        return c;
      });
    }

    const success = await onUpdate(patch);

    if (success !== false && isEnabled === "yes") {
      const validAwbs = fullAwbArray.filter(Boolean);
      if (validAwbs.length > 0) {
        toast.success("AWB Number(s) saved!");
        if (onLog) onLog("🏷 AWB Number(s) saved — " + validAwbs.join(", "));
      } else {
        toast.info("AWB settings updated.");
      }
    }
  };

  const buildJsPdfDocument = React.useCallback(() => {
    const PDFConstructor = jsPDF || (window.jspdf && window.jspdf.jsPDF);
    const doc = new PDFConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    for (let pageIdx = 0; pageIdx < labelPages.length; pageIdx++) {
      if (pageIdx > 0) doc.addPage();
      const pageDests = labelPages[pageIdx];

      pageDests.forEach((d, indexOnPage) => {
        const globalIdx = pageIdx * 3 + indexOnPage;
        const startY = 6 + indexOnPage * 90; // 6mm, 96mm, 186mm -> Fits comfortably within A4 height (297mm)

        const destName = d.contact_person || d.name || job.client_name || job.client || "N/A";
        const destAddr = d.addr || d.delivery_address || d.location || "N/A";
        const destPhone = d.contact_number || d.phone || d.mobile_no || "N/A";
        const destQty = d.qty || job.qty || 1;
        const courierName = d.delivery_mode || job.courierName || "Standard Dispatch";
        const currentAwb = awbInputs[globalIdx] ? awbInputs[globalIdx].trim() : "";
        const labelChallan = d.challanNo || job.challanNo || "N/A";

        // Outer Box (84mm height)
        doc.setLineWidth(0.4);
        doc.setDrawColor(0, 0, 0);
        doc.rect(10, startY, 190, 84);

        // Header Row Line
        doc.setLineWidth(0.3);
        doc.line(10, startY + 8, 200, startY + 8);

        // Top Row Text
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`Challan No : ${labelChallan}`, 13, startY + 5.5);
        const srNo = (d.originalIndex !== undefined ? d.originalIndex : globalIdx) + 1;
        doc.text(`Sr. No: ${srNo}`, 197, startY + 5.5, { align: "right" });

        // Second Row Text
        doc.text("TO,", 13, startY + 13);
        doc.text(`Job No : ${subJobNo}`, 197, startY + 13, { align: "right" });

        // Recipient Address
        doc.setFontSize(9);
        doc.text(`${destName},`, 13, startY + 18);
        const splitAddr = doc.splitTextToSize(`${destAddr}, TEL:${destPhone}`, 180);
        doc.text(splitAddr, 13, startY + 22.5);

        // Product Divider Line
        doc.line(10, startY + 31, 200, startY + 31);
        doc.setFontSize(9.5);
        doc.text(`Product: ${productName}`, 13, startY + 35.5);
        doc.text(`Qty: ${destQty}`, 197, startY + 35.5, { align: "right" });

        // Table
        doc.setFillColor(248, 250, 252);
        doc.rect(14, startY + 39, 182, 5.5, "F");
        doc.rect(14, startY + 39, 182, 13);
        doc.line(14, startY + 44.5, 196, startY + 44.5);
        doc.line(134, startY + 39, 134, startY + 52);
        doc.line(162, startY + 39, 162, startY + 52);

        doc.setFontSize(8.5);
        doc.text("Product / Description", 16, startY + 43);
        doc.text("Qty", 148, startY + 43, { align: "center" });
        doc.text("Grand Total", 179, startY + 43, { align: "center" });

        doc.text(String(productName).substring(0, 55), 16, startY + 49.5);
        doc.text(String(destQty), 148, startY + 49.5, { align: "center" });
        doc.text(String(destQty), 179, startY + 49.5, { align: "center" });

        // Courier Line
        doc.setFontSize(9);
        doc.text(`Courier : ${courierName}`, 13, startY + 59);

        // AWB Section
        if (includeAwb === "yes" && currentAwb) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`AWB No: ${currentAwb}`, 105, startY + 74, { align: "center" });
        }
      });
    }

    return doc;
  }, [labelPages, job, awbInputs, subJobNo, productName, includeAwb]);

  const generateAndUploadR2LabelFile = async () => {
    try {
      setIsUploading(true);
      await saveAwb();

      const pdf = buildJsPdfDocument();
      const blob = pdf.output('blob');
      const pdfFile = new File([blob], `${subJobNo}_shipping_labels.pdf`, { type: 'application/pdf' });

      // Trigger direct browser download of the REAL vector PDF file
      pdf.save(`${subJobNo}_shipping_labels.pdf`);

      const formData = new FormData();
      formData.append("dispatch_files", pdfFile);
      formData.append("labelsGenerated", "true");
      formData.append("labelsUploaded", "true");

      const res = await axiosInstance.patch(`/ct-pack/${job._id || job.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        toast.success("Shipping label PDF generated & saved!");
        const updatedJob = res.data.job;
        if (onUpdate && updatedJob) {
          onUpdate({
            labelsGenerated: true,
            labelsUploaded: true,
            awbNumbers: updatedJob.awbNumbers,
            destinations: updatedJob.destinations
          });
        }
        if (onLog) {
          onLog("⚡ Shipping label PDF generated & saved");
        }
      }
    } catch (err) {
      console.error("Failed to generate PDF label file:", err);
      toast.error("Failed to generate PDF label file: " + (err.message || String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = async () => {
    await generateAndUploadR2LabelFile();
    window.print();
  };

  const handleCloseModal = () => {
    onClose();
  };

  React.useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        const pdf = buildJsPdfDocument();
        pdf.save(`${subJobNo}_shipping_labels.pdf`);
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, buildJsPdfDocument, onClose, subJobNo]);

  return (
    <div className="no-print-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.75)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      {/* Print CSS block for browser print dialog */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 6mm;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print-overlay, .no-print-overlay * {
            visibility: visible !important;
          }
          .no-print-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            maxWidth: none !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .no-print-overlay > div {
            width: 100% !important;
            maxWidth: 100% !important;
            maxHeight: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .shipping-label-print-area {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .shipping-label-grid-page {
            display: flex !important;
            flex-direction: column !important;
            gap: 4mm !important;
            height: 275mm !important;
            page-break-after: always !important;
            box-sizing: border-box !important;
            border: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .shipping-label-card {
            border: 1.5px solid #000 !important;
            padding: 8px 12px !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: calc(33.33% - 3mm) !important;
            box-sizing: border-box !important;
            font-size: 11.5px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ background: "#F8FAFC", borderRadius: 16, width: "95%", maxWidth: 840, maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)" }}>

        {/* Modal Header */}
        <div className="no-print" style={{ padding: "16px 24px", background: "#0F172A", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8 }}>
              🏷 Shipping Labels ({destinations.length} Label{destinations.length > 1 ? "s" : ""} · 3 Labels / Page)
            </div>
            <div style={{ fontSize: 12.5, color: "#CBD5E1", marginTop: 3 }}>
              Job: <b style={{ color: "#38BDF8" }}>{subJobNo}</b>
              {job.challanList && job.challanList.length > 1 ? (
                <span> | Challans: <b style={{ color: "#FDE047" }}>{job.challanList.length} Separate DC</b></span>
              ) : (
                <span> | Challan: <b style={{ color: "hsla(203, 20%, 87%, 1.00)" }}>{challanNo}</b></span>
              )}
            </div>
          </div>
          <button onClick={handleCloseModal} style={{ background: "#334155", color: "#FFFFFF", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontWeight: 800, fontSize: 16 }}>✕</button>
        </div>

        {/* Modal Toolbar (Shown when generating/editing, hidden when previewing) */}
        {!isPreviewOnly && (
          <div className="no-print" style={{ padding: "12px 24px", background: "#FFF", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={handlePrint}
                disabled={isUploading}
                style={{ background: "#059669", color: "white", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(5,150,105,0.2)" }}
              >
                {isUploading ? "Uploading print & save..." : "🖨 Print & Save PDF"}
              </button>

              {/* AWB Number Select Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#0F766E" }}>Include AWB No?</span>
                <select
                  value={includeAwb}
                  onChange={(e) => {
                    setIncludeAwb(e.target.value);
                  }}
                  style={{ border: "1px solid #0D9488", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontWeight: 700, outline: "none", background: "white", color: "#0F766E", cursor: "pointer" }}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {/* If Yes, show AWB Number Inputs & Save Button */}
              {includeAwb === "yes" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0F9FF", border: "1.5px solid #93C5FD", borderRadius: 10, padding: "6px 14px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#1D4ED8", whiteSpace: "nowrap" }}>
                    {destinations.length === 1 ? "AWB No:" : "AWB Nos:"}
                  </span>
                  {destinations.length === 1 ? (
                    <input
                      type="text"
                      value={awbInputs[0] || ""}
                      onChange={(e) => setAwbInputs(prev => ({ ...prev, 0: e.target.value }))}
                      placeholder="Enter AWB Tracking No"
                      style={{ border: "1.5px solid #3B82F6", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, outline: "none", color: "#0F172A", background: "white", width: 240, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                    />
                  ) : (
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", maxWidth: 600, padding: "4px 2px", alignItems: "center" }}>
                      {destinations.map((d, idx) => {
                        const labelNo = (d.originalIndex !== undefined ? d.originalIndex : idx) + 1;
                        return (
                          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#3B82F6", textTransform: "uppercase" }}>
                              #{labelNo} {d.challanNo ? `[${d.challanNo}]` : ''} {d.contact_person || d.name ? `(${d.contact_person || d.name})` : ''} ({d.qty} pcs)
                            </span>
                            <input
                              type="text"
                              value={awbInputs[idx] || ""}
                              onChange={(e) => setAwbInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                              placeholder={`#${labelNo} AWB No.`}
                              style={{ border: "1.5px solid #3B82F6", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, outline: "none", color: "#0F172A", background: "white", width: 180, minWidth: 180, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => saveAwb(awbInputs, "yes")}
                    style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)" }}
                  >
                    💾 Save AWB
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Labels Scrollable Container — 3 Compact Labels per Page */}
        <div className="shipping-label-print-area scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scroll-auto" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {labelPages.map((pageDests, pageIdx) => (
            <div
              key={pageIdx}
              className="shipping-label-grid-page"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
                maxWidth: 760,
                background: "#FFF",
                padding: 14,
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}
            >
              {pageDests.map((d, indexOnPage) => {
                const globalIndex = pageIdx * 3 + indexOnPage;
                const destName = d.contact_person || d.name || job.client_name || job.client || "N/A";
                const destAddr = d.addr || d.delivery_address || d.location || "N/A";
                const destPhone = d.contact_number || d.phone || d.mobile_no || "N/A";
                const destQty = d.qty || job.qty || 1;
                const courierName = d.delivery_mode || job.courierName || "Standard Dispatch";
                const currentAwb = awbInputs[globalIndex] ? awbInputs[globalIndex].trim() : "";
                const srNo = (d.originalIndex !== undefined ? d.originalIndex : globalIndex) + 1;

                return (
                  <div
                    key={d.id || globalIndex}
                    className="shipping-label-card"
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '2px solid #000000',
                      borderRadius: 2,
                      padding: '8px 12px',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000000',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 220
                    }}
                  >
                    {/* Top Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: 3, marginBottom: 3 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        <u>Challan No</u> : {d.challanNo || job.challanNo || "N/A"},
                      </div>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Sr. No: {srNo}
                      </div>
                    </div>

                    {/* Second Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>TO,</div>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>Job No : {subJobNo} ,</div>
                    </div>

                    {/* Recipient Details */}
                    <div style={{ fontSize: 12, fontWeight: "bold", lineHeight: 1.3, marginBottom: 3, paddingLeft: 2 }}>
                      <div>{destName},</div>
                      <div>{destAddr}, TEL:{destPhone} ,</div>
                    </div>

                    {/* Product & Qty Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: "bold", borderTop: "1.5px solid #000", paddingTop: 3, marginBottom: 3 }}>
                      <div>Product: {productName} ,</div>
                      <div>Qty: {destQty}</div>
                    </div>

                    {/* Item / Breakdown Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #000", fontSize: 11, margin: "2px 0" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC" }}>
                          <th style={{ borderRight: "1.5px solid #000", padding: "3px 6px", textAlign: "left" }}>Product / Description</th>
                          <th style={{ borderRight: "1.5px solid #000", padding: "3px", width: 50, textAlign: "center" }}>Qty</th>
                          <th style={{ padding: "3px", width: 80, textAlign: "center" }}>Grand Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ borderRight: "1.5px solid #000", padding: "4px 6px", textAlign: "left", fontWeight: "bold" }}>{productName}</td>
                          <td style={{ borderRight: "1.5px solid #000", padding: "4px", fontWeight: "bold", textAlign: "center" }}>{destQty}</td>
                          <td style={{ padding: "4px", fontWeight: "bold", textAlign: "center" }}>{destQty}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Courier Line */}
                    <div style={{ fontSize: 11.5, fontWeight: "bold", marginTop: 2 }}>
                      Courier : {courierName}
                    </div>

                    {/* AWB Section */}
                    {includeAwb === "yes" && currentAwb && (
                      <div style={{ textAlign: "center", paddingTop: 4, marginTop: 2 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#000000", letterSpacing: "0.5px" }}>
                          AWB No: {currentAwb}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="no-print" style={{ padding: "12px 24px", background: "#F1F5F9", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>
          </div>
          <button
            onClick={handleCloseModal}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #CBD5E1", background: "white", color: "#475569", fontWeight: 700, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
