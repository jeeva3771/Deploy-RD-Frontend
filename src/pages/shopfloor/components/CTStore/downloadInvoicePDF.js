import jsPDF from 'jspdf';

// Theme
const TEAL = [24, 90, 112];      // header / footer band
const TEAL_LIGHT = [214, 233, 240]; // total highlight
const GRAY_ROW = [242, 245, 246];   // zebra row
const GRAY_LINE = [210, 216, 219];
const TEXT_DARK = [30, 41, 51];
const TEXT_MUTED = [110, 120, 128];

export async function downloadInvoicePDF(job, data, invoiceNo, company = {}, client = {}, mode = 'download') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
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
      img.src = '/logo.svg';
    });
  };

  const logoBase64 = await getLogoPng();

  // ---------- HEADER ----------
  const BRAND = [63, 63, 150];
  const MUTED = [120, 120, 120];

  let textStartX = marginX;
  let logoData = null;
  if (logoBase64) {
    try {
      const imgProps = doc.getImageProperties(logoBase64);
      const maxWidth = 20;
      const scale = maxWidth / imgProps.width;
      const logoWidth = maxWidth;
      const logoHeight = imgProps.height * scale;
      const logoY = 12;

      // We will draw the image at the end to prevent SMask graphics state issues in jsPDF
      logoData = { base64: logoBase64, x: marginX, y: logoY, w: logoWidth, h: logoHeight };

      textStartX = marginX + logoWidth + 4;
    } catch (err) {
      console.error("Logo load error in PDF:", err);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text("RD Custom Awards Pvt. Ltd.", textStartX, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text("410, Sagar Prabhat Indl Est, near Dahisar Toll Plaza,", textStartX, 23);
  doc.text("Naka, Dahisar East, Mumbai, Maharashtra 400068", textStartX, 28);

  // Right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...MUTED);
  doc.text("INVOICE", rightX, 24, { align: "right" });

  // Divider line
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.7);
  doc.line(marginX, 34, rightX, 34);

  // ---------- INVOICE META + BILL TO ----------
  let y = 46;
  doc.setTextColor(...TEXT_DARK);

  doc.setFontSize(9.5);
  doc.setFont(undefined, 'bold');
  doc.text('Invoice No.', marginX, y);
  doc.text('Date of Issue', marginX, y + 6);
  doc.text('Due Date', marginX, y + 12);
  doc.text('Job Ref', marginX, y + 18);

  doc.setFont(undefined, 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(String(invoiceNo), marginX + 28, y);
  doc.text(data.dateOfIssue || new Date().toLocaleDateString('en-GB'), marginX + 28, y + 6);
  doc.text(data.dueDate || '—', marginX + 28, y + 12);
  doc.text(job.job_no || '—', marginX + 28, y + 18);

  // Bill To, right aligned
  doc.setTextColor(...TEXT_DARK);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To', rightX, y, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...TEXT_MUTED);
  const billToLines = [
    client.name || job.client_name || 'Client Company Name',
    client.address || '',
    client.phone ? `Phone: ${client.phone}` : '',
    // client.email ? `Email: ${client.email}` : '',
  ].filter(Boolean);
  let by = y + 6;
  billToLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, 80);
    wrapped.forEach(wLine => {
      doc.text(wLine, rightX, by, { align: 'right' });
      by += 5; // Use 5 for slightly tighter line spacing on wrapped text
    });
    by += 1; // Add an extra 1 point between different billTo elements
  });

  // ---------- TABLE ----------
  const tableTop = Math.max(y + 30, by + 6);
  const cols = {
    item: marginX,
    desc: marginX + 14,
    hours: marginX + 110,
    rate: marginX + 138,
    amount: rightX,
  };

  doc.setFont(undefined, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Item', cols.item, tableTop);
  doc.text('Description', cols.desc, tableTop);
  doc.text('Qty', cols.hours, tableTop, { align: 'right' });
  doc.text('Rate', cols.rate, tableTop, { align: 'right' });
  doc.text('Amount', cols.amount, tableTop, { align: 'right' });

  doc.setDrawColor(...GRAY_LINE);
  doc.line(marginX, tableTop + 3, rightX, tableTop + 3);

  // Single line item row (extend to a loop if job carries multiple lines)
  const rowH = 9;
  let rowY = tableTop + 3 + rowH;

  doc.setFillColor(...GRAY_ROW);
  doc.rect(marginX, tableTop + 3, rightX - marginX, rowH, 'F');

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text('1', cols.item, rowY - 2.5);
  doc.text(job.product || job.description || '-', cols.desc, rowY - 2.5);
  doc.text(String(data.qty ?? ''), cols.hours, rowY - 2.5, { align: 'right' });
  doc.text((data.pricePerQty ?? 0).toFixed(2), cols.rate, rowY - 2.5, { align: 'right' });
  doc.text((data.subtotal ?? 0).toFixed(2), cols.amount, rowY - 2.5, { align: 'right' });

  // Empty banded rows to mirror the template's blank lines
  let blankY = tableTop + 3 + rowH;
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 1) {
      doc.setFillColor(...GRAY_ROW);
      doc.rect(marginX, blankY, rightX - marginX, rowH, 'F');
    }
    blankY += rowH;
  }

  doc.setDrawColor(...GRAY_LINE);
  doc.line(marginX, blankY, rightX, blankY);

  // ---------- TERMS (left) + TOTALS (right) ----------
  const totalsLabelX = rightX - 55;
  let ty = blankY + 12;

  doc.setFont(undefined, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Terms', marginX, ty);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(8.5);
  if (data.remarks) {
    const wrapped = doc.splitTextToSize(data.remarks, 90);
    doc.text(wrapped, marginX, ty + 6);
  }

  const taxPct = Number(data.gstPct ?? 0);
  const totalsRows = [
    ['Subtotal', (data.subtotal ?? 0).toFixed(2)],
    ['Tax Rate', taxPct === 0 ? '0.00% (No GST)' : `${taxPct.toFixed(2)}%`],
    ['Tax', (data.gstAmt ?? 0).toFixed(2)],
  ];

  doc.setFontSize(9.5);
  totalsRows.forEach(([label, val], i) => {
    const rowYPos = ty + i * 7;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(label, totalsLabelX, rowYPos, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(val, rightX, rowYPos, { align: 'right' });
  });

  const totalY = ty + totalsRows.length * 7 + 3;
  doc.setDrawColor(...GRAY_LINE);
  doc.line(totalsLabelX - 25, totalY - 5, rightX, totalY - 5);

  doc.setFillColor(...TEAL_LIGHT);
  doc.rect(totalsLabelX - 25, totalY - 2, 25 + (rightX - totalsLabelX), 9, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text('Total', totalsLabelX, totalY + 4.5, { align: 'right' });
  doc.text((data.totalAmt ?? 0).toFixed(2), rightX, totalY + 4.5, { align: 'right' });

  // ---------- FOOTER BAND ----------
  const footerH = 14;
  doc.setFillColor(...TEAL);
  doc.rect(0, pageH - footerH, pageW, footerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'italic');
  doc.setFontSize(10);
  doc.text('Thank you for your business!', pageW / 2, pageH - footerH / 2 + 2, { align: 'center' });

  // Render the logo last to avoid SMask graphics state corrupting subsequent vector fills
  if (logoData) {
    doc.addImage(logoData.base64, "PNG", logoData.x, logoData.y, logoData.w, logoData.h);
  }

  const filename = `${invoiceNo}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (mode === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(filename);
  }
}