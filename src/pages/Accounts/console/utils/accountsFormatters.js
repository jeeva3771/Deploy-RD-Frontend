import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Utility formatting functions
export const gNow = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmt = n => n >= 10000000 ? (n / 10000000).toFixed(1) + 'Cr' : n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
export const fmtR = n => 'Rs ' + Number(n || 0).toLocaleString('en-IN');

// Generic direct file download helper (forces browser save dialog / file save)
export const downloadFileDirectly = async (fileUrl, desiredFilename) => {
  const filename = desiredFilename || 'document.pdf';
  if (!fileUrl) {
    toast.error("No download URL available");
    return false;
  }

  // Strategy 1: Fetch as blob from direct URL (fastest if CORS allows)
  try {
    const res = await fetch(fileUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`Downloaded ${filename}`);
      return true;
    }
  } catch (err) {
    console.warn("Direct blob fetch failed, trying backend download proxy:", err);
  }

  // Strategy 2: Download through backend API proxy with axiosInstance (guaranteed no CORS, uses token)
  try {
    const res = await axiosInstance.get('/image/download', {
      params: { url: fileUrl, filename: filename },
      responseType: 'blob'
    });
    if (res.data) {
      const blob = new Blob([res.data], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`Downloaded ${filename}`);
      return true;
    }
  } catch (err) {
    console.warn("Backend proxy download failed:", err);
  }

  // Strategy 3: Hidden anchor with download attribute
  try {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info(`Download initiated for ${filename}`);
    return true;
  } catch (err) {
    toast.error("Failed to download file: " + err.message);
    return false;
  }
};

// Direct helper to download an invoice PDF
export const downloadInvoicePDFDirect = async (inv) => {
  if (!inv) return;
  const filename = inv.n || `${inv.invoiceNo || inv.sub_job_no || 'Invoice'}.pdf`;

  // If there is an existing uploaded PDF URL, download it directly:
  const targetUrl = inv.downloadUrl || inv.url;
  if (targetUrl) {
    const success = await downloadFileDirectly(targetUrl, filename);
    if (success) return;
  }

  // Fallback: Generate the professional Tax Invoice PDF client-side using jsPDF
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const BRAND = [12, 26, 46];
    const TEAL = [13, 148, 136];

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...BRAND);
    doc.text("RD Custom Awards", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Tax Invoice · GST Registered Manufacturing", 14, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...TEAL);
    doc.text(inv.invoiceNo || "TAX INVOICE", pageWidth - 14, 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${inv.date || new Date().toLocaleDateString("en-IN")}`, pageWidth - 14, 24, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 28, pageWidth - 14, 28);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, pageWidth - 28, 22, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(inv.client || "Client", 18, 39);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Sub-Job: ${inv.sub_job_no || "—"}   |   Job No: #${inv.job_no || "—"}   |   Issued By: ${inv.by || "Accounts"}`, 18, 47);

    const subtotal = Number(inv.subtotal !== undefined ? inv.subtotal : (inv.totalAmt || 0));
    const gstPct = inv.gstPct !== undefined && inv.gstPct !== null ? Number(inv.gstPct) : (inv.gstRate !== undefined ? Number(inv.gstRate) : 5);
    const gstAmt = Number(inv.gstAmt !== undefined ? inv.gstAmt : (subtotal * gstPct / 100));
    const grandTotal = Number(inv.totalAmt !== undefined ? inv.totalAmt : (subtotal + gstAmt));

    autoTable(doc, {
      startY: 60,
      head: [["#", "Description / Product", "Qty", "Unit Rate (Rs)", "GST %", "Total (Rs)"]],
      body: [
        [
          "1",
          inv.product || "Custom Trophy Fabrication",
          inv.qty || 1,
          (Number(inv.pricePerQty) || (subtotal / (inv.qty || 1))).toFixed(2),
          gstPct === 0 ? "0% (No GST)" : `${gstPct}%`,
          grandTotal.toFixed(2)
        ]
      ],
      theme: "grid",
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: "bold" },
      foot: [
        ["", "", "", "SUBTOTAL", "", subtotal.toFixed(2)],
        ["", "", "", `GST (${gstPct === 0 ? "No GST" : `${gstPct}%`})`, "", gstAmt.toFixed(2)],
        ["", "", "", "GRAND TOTAL", "", grandTotal.toFixed(2)]
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: BRAND, fontStyle: "bold" }
    });

    doc.save(filename);
    toast.success(`Generated & downloaded ${filename}`);
  } catch (err) {
    console.error("Error generating invoice PDF:", err);
    toast.error("Failed to generate PDF: " + err.message);
  }
};

// Batch download helper
export const downloadAllInvoices = async (invoiceList) => {
  if (!invoiceList || invoiceList.length === 0) {
    toast.warning("No invoices available to download");
    return;
  }
  toast.info(`Starting direct download for ${invoiceList.length} invoice(s)...`);
  for (let i = 0; i < invoiceList.length; i++) {
    const inv = invoiceList[i];
    await downloadInvoicePDFDirect(inv);
    if (i < invoiceList.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  toast.success(`Downloaded all ${invoiceList.length} invoice(s)!`);
};

// Direct helper to download or preview a Delivery Challan PDF
export const downloadChallanPDFDirect = async (challan, job = {}, mode = "download") => {
  if (!challan) return;
  const filename = challan.n || `${challan.challanNo || challan.sub_job_no || "Challan"}.pdf`;

  // If there is an existing uploaded PDF URL from R2, handle directly:
  const targetUrl = challan.downloadUrl || challan.url || challan.challanFile;
  if (targetUrl) {
    if (mode === "open") {
      window.open(targetUrl, "_blank");
      return;
    }
    const success = await downloadFileDirectly(targetUrl, filename);
    if (success) return;
  }

  // Fallback / standard: Generate professional Delivery Challan PDF client-side
  try {
    const { downloadChallanPDF } = await import("./downloadChallanPDF");
    await downloadChallanPDF(challan, job, mode);
    if (mode === "download") {
      toast.success(`Generated & downloaded ${filename}`);
    }
  } catch (err) {
    console.error("Error generating challan PDF:", err);
    toast.error("Failed to generate Challan PDF: " + err.message);
  }
};

// Batch download challans helper
export const downloadAllChallans = async (challanList, job = {}) => {
  if (!challanList || challanList.length === 0) {
    toast.warning("No challans available to download");
    return;
  }
  toast.info(`Starting download for ${challanList.length} challan(s)...`);
  for (let i = 0; i < challanList.length; i++) {
    const ch = challanList[i];
    await downloadChallanPDFDirect(ch, job);
    if (i < challanList.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  toast.success(`Downloaded all ${challanList.length} challan(s)!`);
};

