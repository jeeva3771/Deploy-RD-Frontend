import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateCashVoucherPDF = (data) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(13, 148, 136); // Teal #0D9488
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("CASH RECEIPT / DISBURSEMENT VOUCHER", 14, 18);

  const voucherNo = data.voucherNo || data.cashVoucherNo || data.ref || `CR-${Date.now().toString().slice(-6)}`;
  const dateStr = data.date ? new Date(data.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");

  doc.setFontSize(9.5);
  doc.text(`Voucher No: ${voucherNo}`, pageW - 14, 13, { align: "right" });
  doc.text(`Date: ${dateStr}`, pageW - 14, 21, { align: "right" });

  // Details Table
  autoTable(doc, {
    startY: 35,
    head: [["Particulars", "Details"]],
    body: [
      ["Sub-Job / Job Number", data.subJobNo || data.sub_job_no || data.jobNo || "—"],
      ["Party Name (Client / Vendor)", data.clientName || data.vendorName || data.client_name || data.vendor_name || "—"],
      ["Payment Mode", "Cash Payment"],
      ["Cash Amount Paid / Received", `Rs ${Number(data.amount || 0).toLocaleString("en-IN")}`],
      ["TDS Amount (if applicable)", `Rs ${Number(data.tdsAmount || data.tds_amount || 0).toLocaleString("en-IN")}`],
      ["Gross Amount", `Rs ${Number(data.grossAmount || data.gross_amount || data.amount || 0).toLocaleString("en-IN")}`],
      ["Collected / Handed Over Person", data.personName || data.cashCollectedBy || data.cashPaidTo || data.cash_collected_by || data.cash_paid_to || "Accounts Dept"],
      ["Remarks / Notes", data.notes || "Cash transaction recorded and verified."],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const finalY = (doc.lastAutoTable?.finalY || 120) + 30;

  // Signature Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);

  doc.line(14, finalY, 70, finalY);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Payer / Receiver Signature", 14, finalY + 6);

  doc.line(pageW - 70, finalY, pageW - 14, finalY);
  doc.text("Authorized Signatory (Accounts)", pageW - 70, finalY + 6);

  doc.save(`${voucherNo}_Cash_Voucher.pdf`);
};
