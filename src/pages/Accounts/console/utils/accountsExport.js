import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadClientLedgerCSV = (c) => {
  if (!c) return;
  try {
    const clientName = c.client || "Client";
    const jobNo = c.job_no || "N/A";
    const contact = c.contact || "—";
    const phone = c.phone || "—";
    const email = c.email || "—";
    const subjobs = c.subjobs || [];
    const totalAmt = Number(c.totalAmount || 0);
    const totalPaid = Number(c.totalPaid || 0);
    const totalDue = Number(c.totalOutstanding || 0);
    const dateStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = [
      ["RD CUSTOM AWARDS - CLIENT STATEMENT OF ACCOUNT / SUB-JOB LEDGER"],
      ["Generated On", dateStr],
      ["Client Name", clientName],
      ["Job Number", jobNo],
      ["Contact Person", contact],
      ["Phone", phone],
      ["Email", email],
      [],
      ["--- FINANCIAL SUMMARY ---"],
      ["Total Quotation / Order Amount (Rs)", totalAmt.toFixed(2)],
      ["Total Paid Amount (Rs)", totalPaid.toFixed(2)],
      ["Net Outstanding Balance Due (Rs)", totalDue.toFixed(2)],
      ["Payment Status", totalDue === 0 ? "Fully Cleared" : totalPaid > 0 ? "Partial Paid" : "Pending"],
      [],
      ["--- SUB-JOB QUOTATION DETAILS ---"],
      ["#", "Sub-Job No", "Product", "Qty", "Amount (Rs)", "Paid (Rs)", "Outstanding (Rs)", "Status"],
    ];

    const STATUS_LABELS = {
      paid: "Fully Paid",
      partial_paid: "Partial Paid",
      pending: "Pending",
      invoiced: "Invoiced",
      partial_invoiced: "Partially Invoiced",
      unbilled: "Unbilled",
      advance_paid: "Advance Paid"
    };

    subjobs.forEach((sj, idx) => {
      const amt = Number(sj.amount || 0);
      const paid = Number(sj.paid || 0);
      const due = Number(sj.outstanding !== undefined ? sj.outstanding : amt - paid);
      rows.push([
        idx + 1,
        sj.sub_job_no || "—",
        sj.product || "—",
        sj.qty || 1,
        amt.toFixed(2),
        paid.toFixed(2),
        due.toFixed(2),
        STATUS_LABELS[sj.status] || (due === 0 ? "Fully Paid" : paid > 0 ? "Partial Paid" : "Pending"),
      ]);
    });

    rows.push([]);
    rows.push(["TOTAL", "", "", "", totalAmt.toFixed(2), totalPaid.toFixed(2), totalDue.toFixed(2), totalDue === 0 ? "CLEARED" : "PENDING"]);

    const payments = (c.subjobs || []).flatMap((s) => s.payments || []);
    if (payments.length > 0) {
      rows.push([]);
      rows.push(["--- PAYMENT TRANSACTIONS HISTORY ---"]);
      rows.push(["#", "Receipt Date", "Sub-Job No", "Payment Mode", "Reference / UTR", "Amount Received (Rs)", "Recorded By", "Notes"]);
      payments.forEach((p, idx) => {
        const pDate = p.payment_date || p.createdAt ? new Date(p.payment_date || p.createdAt).toLocaleDateString("en-IN") : "—";
        rows.push([
          idx + 1,
          pDate,
          p.sub_job_no || "—",
          p.payment_mode || "Bank Transfer",
          p.reference_no || "—",
          Number(p.amount || 0).toFixed(2),
          p.created_by_name || p.created_by?.name || p.created_by?.username || "—",
          p.notes || "",
        ]);
      });
    }

    const csvContent = "\uFEFF" + rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Ledger_${clientName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_${jobNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Ledger CSV downloaded successfully for ${clientName}!`);
  } catch (err) {
    console.error("Error exporting ledger CSV:", err);
    toast.error("Failed to export ledger CSV: " + err.message);
  }
};

// Export Client Ledger as PDF
export const downloadClientLedgerPDF = (c) => {
  if (!c) return;
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const clientName = c.client || "Client";
    const jobNo = c.job_no || "N/A";
    const contact = c.contact || "—";
    const phone = c.phone || "—";
    const email = c.email || "—";
    const subjobs = c.subjobs || [];
    const totalAmt = Number(c.totalAmount || 0);
    const totalPaid = Number(c.totalPaid || 0);
    const totalDue = Number(c.totalOutstanding || 0);

    const BRAND = [12, 26, 46]; // #0C1A2E
    const TEAL = [13, 148, 136]; // #0D9488
    const RED = [220, 38, 38];
    const GREEN = [5, 150, 105];

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...BRAND);
    doc.text("RD Custom Awards", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Accounts & Finance Division · Client Statement of Account", 14, 24);

    // Right Side Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...TEAL);
    doc.text("CLIENT LEDGER", pageWidth - 14, 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 14, 24, { align: "right" });

    // Decorative line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(14, 28, pageWidth - 14, 28);

    // Client Info Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, pageWidth - 28, 20, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(clientName, 18, 39);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Job No: #${jobNo}   |   Contact: ${contact}   |   Phone: ${phone}${email && email !== "—" ? `   |   Email: ${email}` : ""}`, 18, 46);

    // Financial Summary Metric Badges
    const boxWidth = (pageWidth - 28 - 8) / 3;
    const startY = 56;

    // Total Amount Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, boxWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL AMOUNT", 14 + boxWidth / 2, startY + 5.5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(`Rs ${totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 14 + boxWidth / 2, startY + 12.5, { align: "center" });

    // Paid Box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14 + boxWidth + 4, startY, boxWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREEN);
    doc.text("TOTAL PAID", 14 + boxWidth + 4 + boxWidth / 2, startY + 5.5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(`Rs ${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 14 + boxWidth + 4 + boxWidth / 2, startY + 12.5, { align: "center" });

    // Outstanding Box
    const outBg = totalDue > 0 ? [254, 242, 242] : [236, 253, 245];
    const outColor = totalDue > 0 ? RED : GREEN;
    doc.setFillColor(...outBg);
    doc.roundedRect(14 + (boxWidth + 4) * 2, startY, boxWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...outColor);
    doc.text(totalDue > 0 ? "OUTSTANDING DUE" : "CLEARED", 14 + (boxWidth + 4) * 2 + boxWidth / 2, startY + 5.5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...outColor);
    doc.text(`Rs ${totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 14 + (boxWidth + 4) * 2 + boxWidth / 2, startY + 12.5, { align: "center" });

    const STATUS_LABELS = {
      paid: "Fully Paid",
      partial_paid: "Partial",
      pending: "Pending",
      invoiced: "Invoiced",
      partial_invoiced: "Partially Invoiced",
      unbilled: "Unbilled",
      advance_paid: "Advance"
    };

    // Sub-Jobs Table
    const tableBody = subjobs.map((sj, i) => {
      const amt = Number(sj.amount || 0);
      const paid = Number(sj.paid || 0);
      const due = Number(sj.outstanding !== undefined ? sj.outstanding : amt - paid);
      const statusText = STATUS_LABELS[sj.status] || (due === 0 ? "Paid" : paid > 0 ? "Partial" : "Pending");
      return [
        i + 1,
        sj.sub_job_no || "—",
        sj.product || "—",
        sj.qty || 1,
        amt.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        paid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        due.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        statusText,
      ];
    });

    tableBody.push([
      "Total",
      "",
      "",
      "",
      totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalDue === 0 ? "Cleared" : "Pending",
    ]);

    autoTable(doc, {
      startY: startY + 22,
      head: [["#", "Sub-Job No", "Product", "Qty", "Amount (Rs)", "Paid (Rs)", "Outstanding (Rs)", "Status"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: BRAND,
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", fontStyle: "bold" },
        2: { halign: "left" },
        3: { halign: "center", cellWidth: 12 },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right", fontStyle: "bold" },
        7: { halign: "center" },
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: BRAND,
        fontStyle: "bold",
      },
    });

    // Payment transactions history if available
    const payments = (c.subjobs || []).flatMap((s) => s.payments || []);
    if (payments.length > 0) {
      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 50) + 8;
      if (finalY < 240) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...BRAND);
        doc.text("PAYMENT TRANSACTIONS HISTORY", 14, finalY);

        const paymentBody = payments.map((p, idx) => {
          const pDate = p.payment_date || p.createdAt ? new Date(p.payment_date || p.createdAt).toLocaleDateString("en-IN") : "—";
          return [
            idx + 1,
            pDate,
            p.sub_job_no || "—",
            p.payment_mode || "Bank Transfer",
            p.reference_no || "—",
            Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            p.created_by_name || p.created_by?.name || p.created_by?.username || "—",
            p.notes || "—",
          ];
        });

        autoTable(doc, {
          startY: finalY + 4,
          head: [["#", "Date", "Sub-Job No", "Mode", "Reference / UTR", "Amount (Rs)", "Recorded By", "Notes"]],
          body: paymentBody,
          theme: "grid",
          headStyles: {
            fillColor: [71, 85, 105],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { halign: "center", cellWidth: 8 },
            1: { halign: "center" },
            2: { halign: "left" },
            3: { halign: "center" },
            4: { halign: "left" },
            5: { halign: "right", fontStyle: "bold" },
            6: { halign: "left" },
            7: { halign: "left" },
          },
          styles: {
            fontSize: 7.5,
            cellPadding: 2,
          },
        });
      }
    }

    doc.save(`Ledger_${clientName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_${jobNo}.pdf`);
    toast.success(`Ledger PDF downloaded successfully for ${clientName}!`);
  } catch (err) {
    console.error("Error exporting ledger PDF:", err);
    toast.error("Failed to export ledger PDF: " + err.message);
  }
};

// Export Outsource Vendor Ledger as CSV / Excel

export const downloadVendorLedgerCSV = (v) => {
  if (!v) return;
  try {
    const vendorName = v.vendor || "Outsource Vendor";
    const contact = v.contact || "—";
    const phone = v.phone || "—";
    const email = v.email || "—";
    const gst = v.gst || "—";
    const bills = v.bills || [];
    const totalAmt = Number(v.totalAmount || 0);
    const totalPaid = Number(v.totalPaid || 0);
    const totalDue = Number(v.totalOutstanding || 0);
    const dateStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = [
      ["RD CUSTOM AWARDS - OUTSOURCE VENDOR STATEMENT OF ACCOUNT / BILLS LEDGER"],
      ["Generated On", dateStr],
      ["Vendor Name", vendorName],
      ["Contact Person", contact],
      ["Phone / WhatsApp", phone],
      ["Email", email],
      ["GST Number", gst],
      [],
      ["--- FINANCIAL SUMMARY ---"],
      ["Total Outsource Bills Amount (Rs)", totalAmt.toFixed(2)],
      ["Total Paid Amount (Rs)", totalPaid.toFixed(2)],
      ["Net Outstanding Balance Payable (Rs)", totalDue.toFixed(2)],
      ["Payment Status", totalDue === 0 ? "Fully Cleared" : totalPaid > 0 ? "Partial Paid" : "Pending"],
      [],
      ["--- OUTSOURCE JOBS & BILLS DETAILS ---"],
      ["#", "Sub-Job No", "Process & Part", "Qty / Sheets", "Rate (Rs)", "Amount (Rs)", "Paid (Rs)", "Outstanding (Rs)", "Status"],
    ];

    bills.forEach((b, idx) => {
      const amt = Number(b.amount || 0);
      const paid = Number(b.paid || 0);
      const due = Number(b.due !== undefined ? b.due : amt - paid);
      rows.push([
        idx + 1,
        b.sub_job_no || (b.bill_no && !String(b.bill_no).startsWith("OUT-") ? b.bill_no : b.job_no) || "—",
        `${b.process || "Outsource"} ${b.part_name ? " - " + b.part_name : ""}`.trim(),
        b.qty || b.sheets || 1,
        Number(b.rate || 0).toFixed(2),
        amt.toFixed(2),
        paid.toFixed(2),
        due.toFixed(2),
        due === 0 ? "Fully Paid" : paid > 0 ? "Partial Paid" : "Pending",
      ]);
    });

    rows.push([]);
    rows.push(["TOTAL", "", "", "", "", totalAmt.toFixed(2), totalPaid.toFixed(2), totalDue.toFixed(2), totalDue === 0 ? "CLEARED" : "PENDING"]);

    const payments = v.payments || [];
    if (payments.length > 0) {
      rows.push([]);
      rows.push(["--- PAYMENT VOUCHERS / REMITTANCE HISTORY ---"]);
      rows.push(["#", "Payment Date", "Sub-Job No", "Payment Mode", "Reference / UTR", "Amount Paid (Rs)", "Recorded By", "Notes"]);
      payments.forEach((p, idx) => {
        const pDate = p.payment_date || p.createdAt ? new Date(p.payment_date || p.createdAt).toLocaleDateString("en-IN") : "—";
        rows.push([
          idx + 1,
          pDate,
          p.sub_job_no || (p.bill_no && !String(p.bill_no).startsWith("OUT-") ? p.bill_no : p.job_no) || "—",
          p.payment_mode || "Bank Transfer",
          p.reference_no || "—",
          Number(p.amount || 0).toFixed(2),
          p.created_by_name || p.created_by?.name || p.created_by?.username || "—",
          p.notes || "",
        ]);
      });
    }

    const csvContent = "\uFEFF" + rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Vendor_Ledger_${vendorName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Vendor ledger CSV downloaded successfully for ${vendorName}!`);
  } catch (err) {
    console.error("Error exporting vendor ledger CSV:", err);
    toast.error("Failed to export vendor ledger CSV: " + err.message);
  }
};

// Export Outsource Vendor Ledger as PDF
export const downloadVendorLedgerPDF = (v) => {
  if (!v) return;
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const vendorName = v.vendor || "Outsource Vendor";
    const contact = v.contact || "—";
    const phone = v.phone || "—";
    const email = v.email || "—";
    const gst = v.gst || "—";
    const bills = v.bills || [];
    const totalAmt = Number(v.totalAmount || 0);
    const totalPaid = Number(v.totalPaid || 0);
    const totalDue = Number(v.totalOutstanding || 0);

    const BRAND = [12, 26, 46]; // #0C1A2E
    const TEAL = [13, 148, 136]; // #0D9488
    const RED = [220, 38, 38];
    const GREEN = [5, 150, 105];

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...BRAND);
    doc.text("RD Custom Awards", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Accounts & Purchase Division · Outsource Vendor Statement of Account", 14, 24);

    // Right Side Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...TEAL);
    doc.text("VENDOR STATEMENT", pageWidth - 14, 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 14, 24, { align: "right" });

    // Decorative line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(14, 28, pageWidth - 14, 28);

    // Vendor Info Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, pageWidth - 28, 20, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(vendorName, 18, 39);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Contact: ${contact}   |   Phone: ${phone}   |   GST: ${gst}${email && email !== "—" ? `   |   Email: ${email}` : ""}`, 18, 46);

    // Financial Summary Metric Badges
    const boxWidth = (pageWidth - 28 - 8) / 3;
    const startY = 56;

    // Total Bill Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, boxWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL BILL AMOUNT", 14 + boxWidth / 2, startY + 5.5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(`Rs ${totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 14 + boxWidth / 2, startY + 12.5, { align: "center" });

    // Paid Box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14 + boxWidth + 4, startY, boxWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREEN);
    doc.text("TOTAL PAID", 14 + boxWidth + 4 + boxWidth / 2, startY + 5.5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(`Rs ${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 14 + boxWidth + 4 + boxWidth / 2, startY + 12.5, { align: "center" });

    // Outstanding Payable Box
    const outBg = totalDue > 0 ? [254, 242, 242] : [236, 253, 245];
    const outColor = totalDue > 0 ? RED : GREEN;
    doc.setFillColor(...outBg);
    doc.roundedRect(14 + (boxWidth + 4) * 2, startY, boxWidth, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...outColor);
    doc.text(totalDue > 0 ? "NET PAYABLE DUE" : "CLEARED", 14 + (boxWidth + 4) * 2 + boxWidth / 2, startY + 5.5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...outColor);
    doc.text(`Rs ${totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 14 + (boxWidth + 4) * 2 + boxWidth / 2, startY + 12.5, { align: "center" });

    // Bills Table
    const tableBody = bills.map((b, i) => {
      const amt = Number(b.amount || 0);
      const paid = Number(b.paid || 0);
      const due = Number(b.due !== undefined ? b.due : amt - paid);
      const statusText = due === 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
      return [
        i + 1,
        b.sub_job_no || (b.bill_no && !String(b.bill_no).startsWith("OUT-") ? b.bill_no : b.job_no) || "—",
        `${b.process || "Outsource"} ${b.part_name ? " - " + b.part_name : ""}`.trim(),
        b.qty || b.sheets || 1,
        amt.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        paid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        due.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        statusText,
      ];
    });

    tableBody.push([
      "Total",
      "",
      "",
      "",
      totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalDue === 0 ? "Cleared" : "Pending",
    ]);

    autoTable(doc, {
      startY: startY + 22,
      head: [["#", "Sub-Job No", "Process & Part", "Qty", "Amount (Rs)", "Paid (Rs)", "Payable Due (Rs)", "Status"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: BRAND,
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", fontStyle: "bold" },
        2: { halign: "left" },
        3: { halign: "center", cellWidth: 10 },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right", fontStyle: "bold" },
        7: { halign: "center" },
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: BRAND,
        fontStyle: "bold",
      },
    });

    // Payment transactions history
    const payments = v.payments || [];
    if (payments.length > 0) {
      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 50) + 8;
      if (finalY < 240) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...BRAND);
        doc.text("PAYMENT VOUCHERS / REMITTANCE HISTORY", 14, finalY);

        const paymentBody = payments.map((p, idx) => {
          const pDate = p.payment_date || p.createdAt ? new Date(p.payment_date || p.createdAt).toLocaleDateString("en-IN") : "—";
          return [
            idx + 1,
            pDate,
            p.sub_job_no || (p.bill_no && !String(p.bill_no).startsWith("OUT-") ? p.bill_no : p.job_no) || "—",
            p.payment_mode || "Bank Transfer",
            p.reference_no || "—",
            Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            p.created_by_name || p.created_by?.name || p.created_by?.username || "—",
            p.notes || "—",
          ];
        });

        autoTable(doc, {
          startY: finalY + 4,
          head: [["#", "Date", "Sub-Job No", "Mode", "Reference / UTR", "Amount Paid (Rs)", "Recorded By", "Notes"]],
          body: paymentBody,
          theme: "grid",
          headStyles: {
            fillColor: [71, 85, 105],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { halign: "center", cellWidth: 8 },
            1: { halign: "center" },
            2: { halign: "left" },
            3: { halign: "center" },
            4: { halign: "left" },
            5: { halign: "right", fontStyle: "bold" },
            6: { halign: "left" },
            7: { halign: "left" },
          },
          styles: {
            fontSize: 7.5,
            cellPadding: 2,
          },
        });
      }
    }

    doc.save(`Vendor_Statement_${vendorName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}.pdf`);
    toast.success(`Vendor Statement PDF downloaded successfully for ${vendorName}!`);
  } catch (err) {
    console.error("Error exporting vendor statement PDF:", err);
    toast.error("Failed to export vendor statement PDF: " + err.message);
  }
};

// Export Sales Orders Sub-Jobs Ledger as CSV

export const downloadSalesOrdersCSV = (items = [], filterLabel = "All") => {
  if (!items || items.length === 0) {
    toast.warning("No sales orders data available to export");
    return;
  }
  try {
    const dateStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalAmt = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalGst = items.reduce((s, i) => s + (Number(i.gstAmount) || 0), 0);
    const totalWithGst = items.reduce((s, i) => s + (Number(i.totalWithGst) || 0), 0);
    const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);

    const rows = [
      ["RD CUSTOM AWARDS - SALES ORDERS & SUB-JOB QUOTATIONS LEDGER"],
      ["Report Type", `${filterLabel} Sub-Jobs`],
      ["Generated On", dateStr],
      ["Total Sub-Jobs Count", items.length],
      ["Total Base Amount / Subtotal (Rs)", totalAmt.toFixed(2)],
      ["Total GST (Rs)", totalGst.toFixed(2)],
      ["Total Quotation Value with GST (Rs)", totalWithGst.toFixed(2)],
      [],
      ["#", "Sub-Job No", "Order Type", "Client Name", "Product", "Qty", "Unit Price (Rs)", "Amount / Subtotal (Rs)", "GST %", "GST Amount (Rs)", "Total + GST (Rs)", "Job Stage", "Delivery Date", "Status"]
    ];

    items.forEach((item, idx) => {
      rows.push([
        idx + 1,
        item.sub_job_no || "—",
        item.type === "sample" ? "Sample" : "Production",
        item.client || "—",
        item.product || "—",
        item.qty || 1,
        Number(item.unitPrice || 0).toFixed(2),
        Number(item.amount || 0).toFixed(2),
        `${item.gstRate || 18}%`,
        Number(item.gstAmount || 0).toFixed(2),
        Number(item.totalWithGst || 0).toFixed(2),
        item.job_stage?.label || item.stage || "—",
        item.deliveryDate || "—",
        item.status || "—",
      ]);
    });

    rows.push([]);
    rows.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      totalQty,
      "",
      totalAmt.toFixed(2),
      "",
      totalGst.toFixed(2),
      totalWithGst.toFixed(2),
      "",
      "",
      ""
    ]);

    const csvContent = "\uFEFF" + rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sales_Orders_Ledger_${filterLabel.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Sales Orders CSV (${filterLabel}) downloaded successfully!`);
  } catch (err) {
    console.error("Error exporting sales orders CSV:", err);
    toast.error("Failed to export sales orders CSV: " + err.message);
  }
};

// Export Sales Orders Sub-Jobs Ledger as PDF
export const downloadSalesOrdersPDF = (items = [], filterLabel = "All") => {
  if (!items || items.length === 0) {
    toast.warning("No sales orders data available to export");
    return;
  }
  try {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const BRAND = [12, 26, 46];
    const TEAL = [13, 148, 136];

    const totalAmt = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalGst = items.reduce((s, i) => s + (Number(i.gstAmount) || 0), 0);
    const totalWithGst = items.reduce((s, i) => s + (Number(i.totalWithGst) || 0), 0);

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND);
    doc.text("RD Custom Awards", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Accounts Console · Sales Orders & Sub-Job Quotations Ledger (${filterLabel})`, 14, 21);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TEAL);
    doc.text(`Total + GST: Rs ${totalWithGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - 14, 15, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Base Amt: Rs ${totalAmt.toLocaleString("en-IN")} | GST: Rs ${totalGst.toLocaleString("en-IN")} | Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 14, 21, { align: "right" });

    const tableBody = items.map((item, idx) => [
      idx + 1,
      item.sub_job_no || "—",
      item.type === "sample" ? "Sample" : "Production",
      item.client || "—",
      item.product || "—",
      item.qty || 1,
      Number(item.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      `${item.gstRate || 18}%`,
      Number(item.gstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Number(item.totalWithGst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      item.job_stage?.label || item.stage || "—",
      item.status || "—",
    ]);

    tableBody.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "",
      totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      totalWithGst.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "",
      "",
    ]);

    autoTable(doc, {
      startY: 26,
      head: [["#", "Sub-Job No", "Type", "Client", "Product", "Qty", "Unit Rate (Rs)", "Amount (Amt)", "GST %", "GST Amt", "Total + GST (Rs)", "Job Stage", "Status"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: BRAND,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", fontStyle: "bold", cellWidth: 22 },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "left", cellWidth: 36 },
        4: { halign: "left" },
        5: { halign: "center", cellWidth: 10 },
        6: { halign: "right", cellWidth: 20 },
        7: { halign: "right", fontStyle: "bold", cellWidth: 24 },
        8: { halign: "center", cellWidth: 12 },
        9: { halign: "right", cellWidth: 20 },
        10: { halign: "right", fontStyle: "bold", cellWidth: 25 },
        11: { halign: "center", fontStyle: "bold", cellWidth: 24 },
        12: { halign: "center", cellWidth: 18 },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: BRAND,
        fontStyle: "bold",
      },
    });

    doc.save(`Sales_Orders_Ledger_${filterLabel.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(`Sales Orders PDF (${filterLabel}) downloaded successfully!`);
  } catch (err) {
    console.error("Error exporting sales orders PDF:", err);
    toast.error("Failed to export sales orders PDF: " + err.message);
  }
};

/**
 * Export GSTR-1 Outward Invoices dataset as CSV
 */
export const downloadGSTR1CSV = (invoices = [], period = "Current Month") => {
  try {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      toast.warn("No invoices found for GSTR-1 export in the selected period.");
      return;
    }
    const dateStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalTaxable = invoices.reduce((s, inv) => s + (Number(inv.subtotal) || 0), 0);
    const totalGst = invoices.reduce((s, inv) => s + (Number(inv.gstAmt) || 0), 0);
    const totalInvoiceVal = invoices.reduce((s, inv) => s + (Number(inv.totalAmt) || 0), 0);

    const rows = [
      ["RD CUSTOM AWARDS - GSTR-1 OUTWARD SUPPLIES STATEMENT"],
      ["Tax Period", period],
      ["Generated On", dateStr],
      ["Total Invoices Count", invoices.length],
      ["Total Taxable Subtotal (Rs)", totalTaxable.toFixed(2)],
      ["Total GST (Rs)", totalGst.toFixed(2)],
      ["Total Invoice Value (Rs)", totalInvoiceVal.toFixed(2)],
      [],
      [
        "#",
        "Invoice No",
        "Invoice Date",
        "Sub-Job No",
        "Job No",
        "Client / Customer Name",
        "Qty",
        "Unit Price (Rs)",
        "Taxable Subtotal (Rs)",
        "GST Rate (%)",
        "CGST (Rs)",
        "SGST (Rs)",
        "Total GST (Rs)",
        "Invoice Total (Rs)"
      ],
    ];

    invoices.forEach((inv, idx) => {
      const invDate = inv.date || inv.createdAt ? new Date(inv.date || inv.createdAt).toLocaleDateString("en-IN") : "—";
      const subtotal = Number(inv.subtotal || 0);
      const gstAmt = Number(inv.gstAmt || 0);
      const cgst = (gstAmt / 2).toFixed(2);
      const sgst = (gstAmt / 2).toFixed(2);
      const total = Number(inv.totalAmt || 0);

      rows.push([
        idx + 1,
        inv.invoiceNo || "—",
        invDate,
        inv.sub_job_no || "—",
        inv.job_no || "—",
        inv.client_name || "—",
        inv.qty || 1,
        Number(inv.pricePerQty || 0).toFixed(2),
        subtotal.toFixed(2),
        `${inv.gstPct || 18}%`,
        cgst,
        sgst,
        gstAmt.toFixed(2),
        total.toFixed(2)
      ]);
    });

    rows.push([]);
    rows.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      totalTaxable.toFixed(2),
      "",
      (totalGst / 2).toFixed(2),
      (totalGst / 2).toFixed(2),
      totalGst.toFixed(2),
      totalInvoiceVal.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `GSTR1_Outward_Supplies_${period.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`GSTR-1 CSV for ${period} downloaded successfully!`);
  } catch (err) {
    console.error("Error exporting GSTR-1 CSV:", err);
    toast.error("Failed to export GSTR-1 CSV: " + err.message);
  }
};

// Core Constant Datasets
