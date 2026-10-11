import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateJobSheet = (formData, autoPrint = false) => {
  const {
    materialSpecification = [],
    materialprocess = [],
    packingdatas = [],
    jobQty,
    productName,
    subJobNo,
    reference_no,
  } = formData || {};

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  /* ================= HEADER ================= */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const jobLabel = reference_no ? `${subJobNo} - ${reference_no}` : subJobNo;
  doc.text(`PRODUCTION JOB SHEET ${jobLabel ? `- ${jobLabel}` : ""}`, 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Product Name: ${productName || "-"} `, pageWidth - 14, 16, { align: "right" });
  doc.text(`Total Qty: ${jobQty || "-"}`, pageWidth - 14, 22, { align: "right" });

doc.setFontSize(9);

const now = new Date();
const dd = String(now.getDate()).padStart(2, "0");
const mm = String(now.getMonth() + 1).padStart(2, "0"); 
const yyyy = now.getFullYear();

let hours = now.getHours();
const minutes = String(now.getMinutes()).padStart(2, "0");
const seconds = String(now.getSeconds()).padStart(2, "0");
const ampm = hours >= 12 ? "PM" : "AM";
hours = hours % 12 || 12; 
hours = String(hours).padStart(2, "0");

doc.text(`Generated: ${dd}/${mm}/${yyyy} ${hours}:${minutes}:${seconds} ${ampm}`, 14, 24);

  doc.setDrawColor(120, 90, 255);
  doc.setLineWidth(0.6);
  doc.line(14, 27, pageWidth - 14, 27);

  let startY = 34;
  

  /* ================= SECTION TITLE HELPER ================= */
  const sectionTitle = (title) => {
    doc.setFillColor(230, 235, 255);
    doc.rect(14, startY - 6, pageWidth - 28, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, 16, startY);
    startY += 6;
  };

  /* ================= 1. MATERIAL REQUISITION ================= */
  sectionTitle("1. Material Requisition");

  autoTable(doc, {
    startY,
    head: [["Material Name", "Size", "Alias / Custom", "Color", "Req Qty"]],
    body: materialSpecification.map((item) => [
      item.material_name || "-",
      item.input?.size || "-",
      item.alias || "-",
      item.color || "-",
      item.final_total !== undefined
    ? `${item.final_total} ${item.material_type === "sheet" ? "sheet" : "pcs"}`
    : "-"
    ]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: "bold",
    },
  });

  startY = doc.lastAutoTable.finalY + 12;

/* ================= 2. PROCESS WORKFLOW ================= */
sectionTitle("2. Process Workflow");

const leftMargin = 14;
const rightMargin = 14;
const usableWidth = pageWidth - leftMargin - rightMargin;

materialprocess.forEach((group, groupIndex) => {
  // Section Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    `Section: ${group.material_group_name}`,
    leftMargin + 2,
    startY
  );
  startY += 4;

  autoTable(doc, {
    startY,
    margin: { left: leftMargin, right: rightMargin },
    tableWidth: "auto",
    head: [["#", "Process Name", "Input"]],
    body: group.processes.map((proc, procIndex) => [
      // `${groupIndex + 1}.${procIndex + 1}`,
      proc.process_index,
      proc.process_name || "-",
      proc.input.actual_input ?? "-",
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.1 },  // #
      1: { cellWidth: usableWidth * 0.65 }, // Process Name
      2: { cellWidth: usableWidth * 0.25 }, // Input
    },
  });

  startY = doc.lastAutoTable.finalY + 8;
});


  /* ================= 3. PACKING INSTRUCTIONS ================= */
  sectionTitle("3. Packing Instructions");

  autoTable(doc, {
    startY,
    head: [["Item", "Spec / Qty"]],
    body: packingdatas.map((pack) => [
      pack.name || "-",
      pack.itemType === "logic"
        ? `${pack.logic1 || 1} x ${pack.logic2 || 1} x ${pack.logic3 || 1}`
        : pack.qty || "-"
     ]),

    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: "bold",
    },
  });

  /* ================= SAVE ================= */


  if (autoPrint) {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
     const fileName = reference_no 
    ? `job-sheet-${subJobNo}-${reference_no}.pdf` 
    : subJobNo ? `job-sheet-${subJobNo}.pdf` : "job-sheet.pdf";

  doc.save(fileName);
  }
};
