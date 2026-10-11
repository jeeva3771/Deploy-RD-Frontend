import jsPDF from "jspdf";

const BRAND = [30, 41, 59];       // Dark Slate
const PRIMARY = [13, 148, 136];   // Teal Accent
const MUTED = [100, 116, 139];    // Slate 500
const GRAY_ROW = [248, 250, 252]; // Zebra fill
const GRAY_LINE = [226, 232, 240];
const TEXT_DARK = [15, 23, 42];

/**
 * Generate and download an official Delivery Challan PDF
 */
export async function downloadChallanPDF(challanData, job = {}, mode = "download") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const rightX = pageW - marginX;

  // Helper to load SVG and convert to PNG base64
  const getLogoPng = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 90;
        canvas.height = img.height || 60;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = "/logo.svg";
    });
  };

  const logoBase64 = await getLogoPng();

  let textStartX = marginX;
  if (logoBase64) {
    try {
      const imgProps = doc.getImageProperties(logoBase64);
      const maxWidth = 20;
      const scale = maxWidth / imgProps.width;
      const logoWidth = maxWidth;
      const logoHeight = imgProps.height * scale;
      const logoY = 12;
      doc.addImage(logoBase64, "PNG", marginX, logoY, logoWidth, logoHeight);
      textStartX = marginX + logoWidth + 4;
    } catch (err) {
      console.warn("Logo load error in Challan PDF:", err);
    }
  }

  // Header Company Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY);
  doc.text("RD Custom Awards Pvt. Ltd.", textStartX, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("410, Sagar Prabhat Indl Est, near Dahisar Toll Plaza,", textStartX, 23);
  doc.text("Naka, Dahisar East, Mumbai, Maharashtra 400068", textStartX, 27);
  doc.text("GSTIN: 27AABCR1234F1Z5 · Email: accounts@rdcustomawards.com", textStartX, 31);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text("DELIVERY CHALLAN", rightX, 22, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PRIMARY);
  doc.text("Proof of Dispatch / Gate Pass", rightX, 28, { align: "right" });

  // Divider line
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(marginX, 35, rightX, 35);

  // Meta Details Box
  const challanNo = challanData.challanNo || challanData.id || "DC-N/A";
  const challanDate = challanData.challanDate || challanData.date || new Date().toLocaleDateString("en-IN");
  const subJobNo = challanData.sub_job_no || job.sub_job_no || job.id || "—";
  const jobNo = challanData.job_no || job.job_no || "—";
  const dispatchMode = challanData.dispatchMode || challanData.courierName || "Courier / Transport";
  const clientName = challanData.client || job.client || "Client";
  const destAddress = challanData.destName || challanData.destination || job.delivery_address || "Consignee Delivery Address";

  let y = 44;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text("Challan No:", marginX, y);
  doc.text("Date:", marginX, y + 6);
  doc.text("Sub-Job Ref:", marginX, y + 12);
  doc.text("Job No:", marginX, y + 18);
  doc.text("Dispatch Mode:", marginX, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(String(challanNo), marginX + 28, y);
  doc.text(String(challanDate), marginX + 28, y + 6);
  doc.text(String(subJobNo), marginX + 28, y + 12);
  doc.text(String(jobNo), marginX + 28, y + 18);
  doc.text(String(dispatchMode), marginX + 28, y + 24);

  // Consignee (Right side)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text("Deliver To (Consignee):", rightX, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);

  const consigneeLines = [
    clientName,
    destAddress,
    job.contact ? `Contact: ${job.contact}` : "",
    job.phone ? `Phone: ${job.phone}` : "",
  ].filter(Boolean);

  let by = y + 6;
  consigneeLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 80);
    wrapped.forEach((w) => {
      doc.text(w, rightX, by, { align: "right" });
      by += 5;
    });
  });

  // Table Top
  const tableTop = Math.max(y + 32, by + 4);
  const cols = {
    sno: marginX,
    desc: marginX + 12,
    hsn: marginX + 115,
    qty: rightX,
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("S.No", cols.sno, tableTop);
  doc.text("Item Description", cols.desc, tableTop);
  doc.text("HSN / SAC", cols.hsn, tableTop);
  doc.text("Dispatched Qty", cols.qty, tableTop, { align: "right" });

  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.4);
  doc.line(marginX, tableTop + 3, rightX, tableTop + 3);

  // Items Row
  const rowH = 14;

  doc.setFillColor(...GRAY_ROW);
  doc.rect(marginX, tableTop + 3.5, rightX - marginX, rowH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);

  const productName = challanData.product || job.product || "Custom Trophy / Award";
  const qty = Number(challanData.qty || job.qty || 1);

  doc.text("1", cols.sno, tableTop + 10);
  doc.setFont("helvetica", "bold");
  doc.text(productName, cols.desc, tableTop + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Sub-Job: ${subJobNo} · Finished Goods for Dispatch`, cols.desc, tableTop + 13);

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("8306", cols.hsn, tableTop + 10);

  doc.setFont("helvetica", "bold");
  doc.text(`${qty.toLocaleString("en-IN")} pcs`, cols.qty, tableTop + 10, { align: "right" });

  doc.setDrawColor(...GRAY_LINE);
  doc.line(marginX, tableTop + 3.5 + rowH, rightX, tableTop + 3.5 + rowH);

  // Total Summary
  const summaryY = tableTop + 3.5 + rowH + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Total Dispatched Quantity:", marginX + 115, summaryY);
  doc.setTextColor(...PRIMARY);
  doc.text(`${qty.toLocaleString("en-IN")} pcs`, rightX, summaryY, { align: "right" });

  // Remarks / Special Note
  let notesY = summaryY + 12;
  if (challanData.remarks || challanData.challanNote) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text("Remarks / Notes:", marginX, notesY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(String(challanData.remarks || challanData.challanNote), marginX, notesY + 5);
    notesY += 12;
  }

  // Declaration box
  const declY = Math.max(notesY + 4, 150);
  doc.setFillColor(254, 252, 232); // Amber light
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(marginX, declY, rightX - marginX, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text("DECLARATION & TERMS:", marginX + 4, declY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text("1. Goods dispatched are as per the approved purchase order and specification.", marginX + 4, declY + 9.5);
  doc.text("2. Please verify the quantity and condition upon delivery and endorse a copy of this challan.", marginX + 4, declY + 13.5);

  // Signatures at the bottom
  const sigY = pageH - 40;

  // Left side: Receiver's endorsement
  doc.setDrawColor(...GRAY_LINE);
  doc.line(marginX, sigY, marginX + 65, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Received By (Signature & Stamp)", marginX, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Date: ________________________", marginX, sigY + 9);

  // Right side: Authorized Signatory
  doc.setDrawColor(...GRAY_LINE);
  doc.line(rightX - 65, sigY, rightX, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("For RD Custom Awards Pvt. Ltd.", rightX, sigY + 5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Authorized Signatory", rightX, sigY + 9, { align: "right" });

  // Output
  const filename = `${String(challanNo).replace(/[/\\?%*:|"<>]/g, "_")}_Challan.pdf`;
  if (mode === "open") {
    const string = doc.output("bloburl");
    window.open(string, "_blank");
  } else {
    doc.save(filename);
  }
}
