import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateQuotationPDF = (formData, autoPrint = false,) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  const {
    productName = "-",
    jobQty = 0,
    totalUnitCost = 0,
    subJobNo = "JOB-NEW",
    reference_no = "",
    quotation = {},
    jobDescription
  } = formData;

  const gstRate = Number(quotation?.gstRate || 18);

  /* ================= COLORS ================= */
  const BRAND = [63, 63, 150];
  const MUTED = [120, 120, 120];

  /* ================= HEADER ================= */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text("RD Custom Awards", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Excellence in Craftsmanship", 14, 27);

  // Right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  doc.text("QUOTATION", pageWidth - 14, 20, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND);
  const jobLabel = reference_no ? `${subJobNo} - ${reference_no}` : subJobNo;
  doc.text(`#${jobLabel}`, pageWidth - 14, 26, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(
    `${new Date().toLocaleDateString("en-GB")}`,
    pageWidth - 14,
    32,
    { align: "right" }
  );

  // Divider line
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.7);
  doc.line(14, 38, pageWidth - 14, 38);

  /* ================= PROJECT DESCRIPTION ================= */
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("PROJECT DESCRIPTION", 14, y);

  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(productName, 14, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(jobDescription, 14, y);

  /* ================= CALCULATIONS ================= */
  const subtotal = jobQty * totalUnitCost;
  const gstAmount = (subtotal * gstRate) / 100;
  const grandTotal = subtotal + gstAmount;

/* ================= TABLE ================= */
autoTable(doc, {
  startY: y + 12,
  head: [["Description", "Qty", "Unit Price", "Total"]],
  body: [
    [
      jobDescription,
      jobQty,
      `RS ${totalUnitCost.toFixed(2)}`, 
      `RS ${subtotal.toFixed(2)}`
    ]
  ],
  theme: "plain",
  styles: {
    fontSize: 10,
    cellPadding: 5,
    textColor: 0, // default black
    font: "helvetica"
  },
  headStyles: {
    fillColor: [245, 246, 250],
    textColor: 0, // header stays black
    fontStyle: "bold",
    halign: "center"
  },
  columnStyles: {
    0: { halign: "left" },   
    1: { halign: "center" }, 
    2: { halign: "right" },  
    3: { halign: "right" }   
  },
  didParseCell: function (data) {
    // Only body cells (not header) and only currency columns (2 & 3)
    if (data.section === 'body' && (data.column.index === 0 || data.column.index === 1 || data.column.index === 2)) {
      data.cell.styles.textColor = MUTED;
    }
  }
});



  const tableEndY = doc.lastAutoTable.finalY + 10;

  /* ================= TOTALS ================= */
  const labelX = pageWidth - 70;
  const valueX = pageWidth - 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0);
 doc.setTextColor(...MUTED);
  doc.text("Subtotal", labelX, tableEndY);
  doc.text(`RS ${subtotal.toFixed(2)}`, valueX, tableEndY, { align: "right" });
 doc.setTextColor(...MUTED);
  doc.text(`GST (${gstRate}%)`, labelX, tableEndY + 8);
  doc.text(`RS ${gstAmount.toFixed(2)}`, valueX, tableEndY + 8, {
    align: "right"
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text("Total", labelX, tableEndY + 18);
  doc.text(`RS ${grandTotal.toFixed(2)}`, valueX, tableEndY + 18, {
    align: "right"
  });

  /* ================= SAVE ================= */
 /* ===== AUTO PRINT SUPPORT ===== */
  if (autoPrint) {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    const fileName = reference_no 
      ? `quotation-${subJobNo}-${reference_no}.pdf` 
      : `quotation-${subJobNo}.pdf`;
    doc.save(fileName);
  }
};
