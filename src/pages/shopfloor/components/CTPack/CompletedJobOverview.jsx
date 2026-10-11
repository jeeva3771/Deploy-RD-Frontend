import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { axiosInstance } from '../../../../utils/url/config';
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { ShippingLabelModal } from './ShippingLabelModal';
import ImageLightbox from '../../../common/ImageLightbox';

const SECTION_ICONS = {
  qc: '📦',
  pmat: '🗃',
  dest: '📍',
  log: '🚚',
  audit: '🕓',
};

export function CompletedJobOverview({ job, onBack, onLog, hideHeader = false }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const packData = job?.ct_pack || job || {};
  const packId = packData._id || job?._id || job?.id || job?.sub_job_no || job?.job_no || packData?.sub_job_no || packData?.job_no;

  const jobId = job?.id || job?.sub_job_no || job?.job_no || packData?.sub_job_no || packData?.job_no || "N/A";
  const clientName = job?.client || job?.client_name || packData?.client_name || job?.enquiry_id?.name || "Client";
  const productName = job?.product || job?.product_name || packData?.product_name || job?.enquiry_id?.product_name || "Product";
  const totalQty = job?.qty || job?.total_qty || packData?.total_qty || job?.job_quantity || job?.product_quantity || 0;
  const qcBadQty = packData?.qc_bad_qty || job?.qc_bad_qty || 0;
  const qcGoodQty = packData?.qc_good_qty || job?.qc_good_qty || packData?.qcAcceptedQty || job?.qcAcceptedQty || (totalQty - qcBadQty);
  const boxCount = packData?.boxCount || job?.boxCount || job?.packing?.boxes || 1;

  const invoiceNo = job?.invoiceNo || job?.invoice_number || packData?.invoiceNo || (job?.fg?.invoiced_qty > 0 ? `INV-${jobId}` : "");
  const challanNo = packData?.challanNo || job?.challanNo || "";
  const challanFile = packData?.challanFile || job?.challanFile || "";
  const productImage = job?.product_image || job?.image || packData?.product_image || job?.enquiry_id?.image || null;

  const pmatItems = (packData?.pmatItems && packData.pmatItems.length > 0) ? packData.pmatItems : (job?.pmatItems || job?.packing?.pmatItems || []);

  const rawDestinations = (packData?.destinations && packData.destinations.length > 0)
    ? packData.destinations
    : (job?.destinations && job.destinations.length > 0)
      ? job.destinations
      : (job?.packing?.destinations && job.packing.destinations.length > 0)
        ? job.packing.destinations
        : (job?.sales_order?.delivery_address || job?.delivery_address ? [{
          name: job?.sales_order?.contact_person || job?.contact || clientName,
          addr: job?.sales_order?.delivery_address || job?.delivery_address || "Standard Delivery Address",
          qty: totalQty,
          contact_person: job?.sales_order?.contact_person || job?.contact || "",
          contact_number: job?.sales_order?.contact_number || job?.phone || job?.mobile_no || "",
          delivery_mode: job?.sales_order?.delivery_mode || job?.delivery_mode || "Courier",
          who_will_pay: job?.sales_order?.who_will_pay || job?.who_will_pay || "",
          courier_amount: job?.sales_order?.courier_amount || job?.courier_amount || ""
        }] : []);

  const challanList = packData?.challanList || job?.challanList || [];
  const destinations = (challanList && challanList.length > 0)
    ? challanList.map((c, idx) => {
        const matched = rawDestinations.find(d => String(d.id || rawDestinations.indexOf(d)) === String(c.destId)) || rawDestinations[0] || {};
        return {
          name: matched.name || c.destName || matched.contact_person || clientName,
          addr: matched.addr || matched.deliveryLocation || matched.delivery_address || job?.sales_order?.delivery_address || "Standard Delivery Address",
          qty: c.qty !== undefined ? Number(c.qty) : (matched.qty || totalQty),
          contact_person: matched.contact_person || job?.sales_order?.contact_person || "",
          contact_number: matched.contact_number || job?.phone || job?.sales_order?.contact_number || "",
          delivery_mode: matched.delivery_mode || job?.sales_order?.delivery_mode || "Courier",
          who_will_pay: matched.who_will_pay || job?.sales_order?.who_will_pay || "",
          courier_amount: matched.courier_amount || job?.sales_order?.courier_amount || "",
          add_in_invoice: matched.add_in_invoice,
          challanNo: c.challanNo,
          challanFile: c.challanFile || matched.challanFile || ""
        };
      })
    : rawDestinations;

  const packedBy = packData?.packedBy || job?.packedBy || job?.packing?.packedBy || 'Operator';
  const packingDt = packData?.packingDt || job?.packingDt || job?.packing?.packDt || packData?.completedDt || job?.completedDt || 'N/A';
  const packingNote = packData?.packingNote || job?.packingNote || job?.packing?.packingInstruction || '';

  const shipments = packData?.shipments && packData.shipments.length > 0 ? packData.shipments : (job?.shipments || []);
  const handDelivery = packData?.handDelivery && packData.handDelivery.length > 0 ? packData.handDelivery : (job?.handDelivery || []);
  const clientPickup = packData?.clientPickup && packData.clientPickup.length > 0 ? packData.clientPickup : (job?.clientPickup || []);

  const courierName = packData?.courierName || job?.courierName || job?.packing?.courier || '';
  const awbNumbers = packData?.awbNumbers && packData.awbNumbers.length > 0 ? packData.awbNumbers : (job?.awbNumbers || []);
  const dispatchDt = packData?.dispatchDt || job?.dispatchDt || job?.packing?.dispatchDt || '';
  const expectedDelivery = packData?.expectedDelivery || job?.expectedDelivery || '';

  const misLabelFiles = packData?.misLabelFiles && packData.misLabelFiles.length > 0 ? packData.misLabelFiles : (job?.misLabelFiles || []);
  const labelFiles = packData?.labelFiles && packData.labelFiles.length > 0 ? packData.labelFiles : (job?.labelFiles || []);
  const dispatchFiles = packData?.dispatchFiles && packData.dispatchFiles.length > 0 ? packData.dispatchFiles : (job?.dispatchFiles || []);
  const instructionFile = packData?.instructionFile || job?.instructionFile || '';
  const instructionNote = packData?.instructionNote || job?.instructionNote || '';

  const logs = (packData?.logs && packData.logs.length > 0)
    ? packData.logs
    : (job?.logs && job.logs.length > 0)
      ? job.logs
      : (job?.csHistory || []);

  const labelsGenerated = Boolean(packData?.labelsGenerated || job?.labelsGenerated);

  async function handleDownloadDispatchFile() {
    const hasFiles = Boolean(
      (dispatchFiles && dispatchFiles.length > 0) ||
      instructionFile ||
      (misLabelFiles && misLabelFiles.length > 0) ||
      (labelFiles && labelFiles.length > 0) ||
      (job?.sales_order?.product_files && job.sales_order.product_files.length > 0) ||
      (job?.designer_files && job.designer_files.length > 0) ||
      (job?.quatation_files && job.quatation_files.length > 0) ||
      (job?.Pi_files && job.Pi_files.length > 0)
    );

    if (!hasFiles) {
      toast.info("No dispatch files available to download.");
      return;
    }
    setIsDownloading(true);
    if (onLog) onLog(`📥 Downloading dispatch file(s) (ZIP)`);
    toast.info(`Generating ZIP file...`);

    try {
      const response = await axiosInstance.get(`/ct-pack/${packId}/download-dispatch`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${jobId}_pack_file.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`ZIP downloaded successfully!`);
    } catch (error) {
      console.error("Error downloading zip:", error);
      toast.error("Failed to download ZIP file");
    } finally {
      setIsDownloading(false);
    }
  }

  const hasCourier = (shipments && shipments.length > 0) || Boolean(courierName) || (awbNumbers && awbNumbers.length > 0);
  const hasHandDelivery = handDelivery && handDelivery.length > 0;
  const hasClientPickup = clientPickup && clientPickup.length > 0;

  const activeModes = [];
  if (hasCourier) activeModes.push("Courier");
  if (hasHandDelivery) activeModes.push("Hand Delivery");
  if (hasClientPickup) activeModes.push("Client Pickup");

  const dispatchLabel = activeModes.length > 0 ? activeModes.join(" & ") : (
    packData?.dispatchType === "hand_delivery" || job?.dispatchType === "hand_delivery" ? "Hand Delivery"
      : packData?.dispatchType === "client_pickup" || job?.dispatchType === "client_pickup" ? "Client Pickup"
        : "Courier"
  );
  const dispatchIcon = hasHandDelivery && !hasCourier && !hasClientPickup ? "🚚"
    : hasClientPickup && !hasCourier && !hasHandDelivery ? "🏪"
      : "📦";

  return (
    <div className="cjo-wrap">
      <style>{`
        :root {
          --cjo-ink: #0B1526;
          --cjo-sub: #5B6B82;
          --cjo-line: #E4E9F0;
          --cjo-surface: #FFFFFF;
          --cjo-canvas: #F3F5F9;
          --cjo-accent: #0D6E6E;
          --cjo-accent-soft: #E4F4F2;
        }

        .cjo-wrap {
          width: 100%;
          box-sizing: border-box;
          padding: clamp(12px, 2vw, 28px) clamp(12px, 3vw, 40px) 60px;
          background: var(--cjo-canvas);
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: var(--cjo-ink);
        }
        .cjo-wrap *, .cjo-wrap *::before, .cjo-wrap *::after { box-sizing: border-box; }
        .cjo-inner { max-width: 1600px; margin: 0 auto; }

        /* ===== Manifest header ===== */
        .cjo-manifest {
          position: relative;
          background: var(--cjo-surface);
          border: 1px solid var(--cjo-line);
          border-radius: 16px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 10px 30px -18px rgba(15,23,42,0.25);
          overflow: hidden;
          margin-bottom: 22px;
        }
        .cjo-manifest-strip {
          height: 6px;
          background: repeating-linear-gradient(135deg, var(--cjo-accent) 0 14px, #14B8A6 14px 28px);
        }
        .cjo-manifest-body {
          display: flex; justify-content: space-between; align-items: flex-start;
          flex-wrap: wrap; gap: 16px; padding: 20px 24px;
        }
        .cjo-manifest-left { display: flex; gap: 16px; align-items: flex-start; min-width: 0; }
        .cjo-back-btn {
          background: var(--cjo-canvas); border: 1px solid var(--cjo-line); border-radius: 10px;
          padding: 9px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; color: var(--cjo-sub);
          letter-spacing: 0.02em; text-transform: uppercase; display: flex; align-items: center; gap: 6px;
          flex-shrink: 0; white-space: nowrap; transition: background 0.15s, color 0.15s;
        }
        .cjo-back-btn:hover { background: #EAECF1; color: var(--cjo-ink); }

        .cjo-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--cjo-sub); text-transform: uppercase; margin-bottom: 3px; }
        .cjo-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cjo-id { font-size: 30px; font-weight: 800; font-family: 'JetBrains Mono', ui-monospace, monospace; color: var(--cjo-ink); letter-spacing: -0.02em; word-break: break-word; }
        .cjo-client-chip {
          font-size: 12.5px; font-weight: 700; color: var(--cjo-accent);
          background: var(--cjo-accent-soft); padding: 3px 10px; border-radius: 999px;
        }
        .cjo-status-chip {
          background: #ECFDF5; color: #067A46; border: 1px solid #A7F3D0; border-radius: 999px;
          padding: 4px 12px; font-size: 12px; font-weight: 800; letter-spacing: 0.02em;
          display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase;
        }
        .cjo-subline { font-size: 13.5px; font-weight: 500; color: var(--cjo-sub); margin-top: 6px; }
        .cjo-subline b { color: var(--cjo-ink); font-weight: 700; }

        .cjo-download-btn {
          background: var(--cjo-ink); color: white; border: none; border-radius: 10px; padding: 12px 20px;
          font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px;
          flex-shrink: 0; white-space: nowrap; transition: transform 0.12s, background 0.15s;
        }
        .cjo-download-btn:not(:disabled):hover { background: var(--cjo-accent); }
        .cjo-download-btn:disabled { cursor: not-allowed; opacity: 0.6; }
        .cjo-download-btn:not(:disabled) { cursor: pointer; }

        /* ===== Metrics ===== */
        .cjo-metrics-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px;
        }
        .cjo-metric-card {
          background: var(--cjo-surface); border: 1px solid var(--cjo-line); border-radius: 14px;
          padding: 16px 18px; min-width: 0; position: relative; overflow: hidden;
        }
        .cjo-metric-card::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--bar, var(--cjo-accent));
        }
        .cjo-metric-label { font-size: 10.5px; font-weight: 800; color: var(--cjo-sub); text-transform: uppercase; letter-spacing: 0.08em; }
        .cjo-metric-value { font-size: 27px; font-weight: 800; color: var(--cjo-ink); font-family: ui-monospace, monospace; margin-top: 4px; letter-spacing: -0.02em; }
        .cjo-metric-note { font-size: 11px; font-weight: 600; color: var(--cjo-sub); margin-top: 3px; }

        /* ===== Sections ===== */
        .cjo-sections { display: grid; grid-template-columns: 1fr; gap: 18px; }
        .cjo-section {
          background: var(--cjo-surface); border: 1px solid var(--cjo-line); border-radius: 14px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .cjo-section-head {
          display: flex; align-items: center; gap: 10px; padding: 15px 20px;
          border-bottom: 1px solid var(--cjo-line);
        }
        .cjo-section-icon {
          width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0; background: var(--icon-bg); color: var(--icon-fg);
        }
        .cjo-section-title { font-size: 13.5px; font-weight: 800; color: var(--cjo-ink); letter-spacing: 0.01em; }
        .cjo-section-body { padding: 18px 20px; }

        /* QC grid */
        .cjo-qc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .cjo-field-label { font-size: 10.5px; font-weight: 800; color: var(--cjo-sub); text-transform: uppercase; letter-spacing: 0.06em; }
        .cjo-field-value { font-size: 15px; font-weight: 700; color: var(--cjo-ink); margin-top: 4px; word-break: break-word; }

        /* PMAT table */
        .cjo-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: -4px -4px 0; }
        .cjo-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 480px; }
        .cjo-table th {
          padding: 8px 14px; font-weight: 700; color: var(--cjo-sub); text-align: left;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
          border-bottom: 1px solid var(--cjo-line);
        }
        .cjo-table td { padding: 12px 14px; border-bottom: 1px solid #F1F3F7; }
        .cjo-table tr:last-child td { border-bottom: none; }
        .cjo-empty-note { padding: 4px; color: var(--cjo-sub); font-size: 13px; }
        .cjo-status-pill { background: #ECFDF5; color: #067A46; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }

        /* Destinations */
        .cjo-instruction {
          background: #FFFAEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 12px 14px;
          margin-bottom: 14px; font-size: 13px; font-weight: 600; color: #7C4A03; word-break: break-word;
        }
        .cjo-dest-list { display: flex; flex-direction: column; gap: 12px; }
        .cjo-dest-card { background: var(--cjo-canvas); border: 1px solid var(--cjo-line); border-radius: 12px; padding: 14px 16px; }
        .cjo-dest-head {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
          flex-wrap: wrap; gap: 8px;
        }
        .cjo-dest-name { font-size: 14.5px; font-weight: 800; color: var(--cjo-ink); word-break: break-word; }
        .cjo-dest-qty {
          background: var(--cjo-ink); color: white; padding: 3px 11px;
          border-radius: 999px; font-size: 11.5px; font-weight: 700; white-space: nowrap;
        }
        .cjo-dest-addr { font-size: 13px; color: var(--cjo-sub); margin-bottom: 10px; line-height: 1.5; word-break: break-word; }
        .cjo-dest-addr b { color: var(--cjo-ink); }
        .cjo-dest-grid { display: grid; grid-template-columns: repeat(4, 1fr); font-size: 12px; color: var(--cjo-sub); gap: 10px; }
        .cjo-dest-grid b { color: var(--cjo-ink); }

        /* Packing & logistics */
        /* align-items: start keeps each box only as tall as its own content,
           instead of both columns stretching to match the tallest sibling
           (which was the cause of the big empty gap under Physical Packing) */
        .cjo-log-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; align-items: start; }
        .cjo-log-box { background: var(--cjo-canvas); border: 1px solid var(--cjo-line); border-radius: 12px; padding: 14px 16px; min-width: 0; }
        .cjo-log-box-title { font-size: 11px; font-weight: 800; color: var(--cjo-sub); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .cjo-log-box-body { font-size: 13px; color: var(--cjo-ink); line-height: 1.8; }
        .cjo-log-box-body b { color: var(--cjo-sub); font-weight: 600; margin-right: 4px; }

        /* Compact stat-tile layout for Physical Packing Details, replacing the
           tall vertical list so the box reads as a compact summary card */
        .cjo-pack-stats { display: flex; flex-wrap: wrap; gap: 10px; }
        .cjo-pack-stat {
          flex: 1 1 110px; min-width: 100px;
          background: var(--cjo-surface); border: 1px solid var(--cjo-line); border-radius: 10px;
          padding: 10px 12px;
        }
        .cjo-pack-stat-label { font-size: 10px; font-weight: 800; color: var(--cjo-sub); text-transform: uppercase; letter-spacing: 0.05em; }
        .cjo-pack-stat-value { font-size: 14px; font-weight: 700; color: var(--cjo-ink); margin-top: 3px; word-break: break-word; }
        .cjo-pack-note { margin-top: 10px; font-size: 12.5px; color: var(--cjo-sub); background: var(--cjo-surface); border: 1px solid var(--cjo-line); border-radius: 10px; padding: 10px 12px; }
        .cjo-pack-note b { color: var(--cjo-sub); font-weight: 700; margin-right: 4px; }

        /* Audit log */
        .cjo-audit-scroll { max-height: 360px; overflow-y: auto; }
        .cjo-audit-row { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid #F1F3F7; font-size: 13px; flex-wrap: wrap; }
        .cjo-audit-row:last-child { border-bottom: none; }
        .cjo-audit-dt { color: var(--cjo-sub); font-weight: 700; min-width: 140px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
        .cjo-audit-msg { color: var(--cjo-ink); font-weight: 500; word-break: break-word; flex: 1; min-width: 160px; }

        /* Tablet */
        @media (max-width: 980px) {
          .cjo-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .cjo-qc-grid { grid-template-columns: repeat(2, 1fr); }
          .cjo-dest-grid { grid-template-columns: repeat(2, 1fr); }
          .cjo-log-grid { grid-template-columns: 1fr; }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .cjo-wrap { padding: 10px 8px 40px; }
          .cjo-manifest-body { padding: 16px; }
          .cjo-id { font-size: 21px; }
          .cjo-download-btn { width: 100%; justify-content: center; }
          .cjo-metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .cjo-metric-card { padding: 12px 14px; }
          .cjo-metric-value { font-size: 21px; }
          .cjo-qc-grid { grid-template-columns: 1fr; }
          .cjo-dest-grid { grid-template-columns: 1fr; }
          .cjo-section-body { padding: 14px 16px; }
          .cjo-section-head { padding: 13px 16px; }
          .cjo-pack-stat { flex: 1 1 45%; }
        }

        .cjo-img-thumb {
          width: 84px; height: 84px; border-radius: 12px; overflow: hidden;
          border: 1.5px solid var(--cjo-line); background: #F8FAFC; cursor: zoom-in;
          flex-shrink: 0; position: relative; transition: transform 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(15,23,42,0.08);
        }
        .cjo-img-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cjo-img-thumb .cjo-img-overlay {
          position: absolute; inset: 0; background: rgba(15,23,42,0.4); opacity: 0;
          display: flex; align-items: center; justify-content: center; color: white;
          font-size: 18px; transition: opacity 0.2s;
        }
        .cjo-img-thumb:hover { transform: scale(1.04); box-shadow: 0 4px 14px rgba(15,23,42,0.18); }
        .cjo-img-thumb:hover .cjo-img-overlay { opacity: 1; }
      `}</style>

      <div className="cjo-inner">
        {/* Manifest header */}
        {!hideHeader && (
          <div className="cjo-manifest">
            <div className="cjo-manifest-strip" />
            <div className="cjo-manifest-body">
              <div className="cjo-manifest-left">
                {onBack && (
                  <button className="cjo-back-btn" onClick={onBack}>
                    ← Back
                  </button>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="cjo-eyebrow">Job Manifest</div>
                  <div className="cjo-title-row">
                    <span className="cjo-id">{jobId}</span>
                    <span className="cjo-client-chip">{clientName}</span>
                    <span className="cjo-status-chip">🏆 Completed</span>
                  </div>
                  <div className="cjo-subline">
                    <b>{productName}</b> · Order Qty: <b style={{ color: '#ef8e44ff', fontSize: 15 }}>{totalQty}</b> pcs
                    {qcBadQty > 0 && (
                      <span style={{ color: "#DC2626", marginLeft: 8, fontWeight: 800, background: "#FEF2F2", border: "1px solid #FECACA", padding: "1px 8px", borderRadius: 6, fontSize: 12 }}>
                        (QC Rejected: {qcBadQty} pcs · Net Good: {qcGoodQty} pcs)
                      </span>
                    )}
                    {invoiceNo && <> · Invoice {invoiceNo}</>}
                    {challanNo && (
                      <> · DC: <b>{challanNo}</b></>
                    )}
                  </div>
                </div>
              </div>

              <div className="cjo-manifest-right" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {productImage && (
                  <div
                    onClick={() => setPreviewImage(productImage)}
                    className="cjo-img-thumb"
                    title="Click to expand product image"
                  >
                    <img
                      src={productImage}
                      alt={productName || "Product"}
                    />
                  </div>
                )}

                {(dispatchFiles?.length > 0 || instructionFile || job?.sales_order?.product_files?.length > 0) && (
                  <button
                    className="cjo-download-btn"
                    onClick={handleDownloadDispatchFile}
                    disabled={isDownloading}
                  >
                    <span style={{ fontSize: 16 }}>📥</span>
                    {isDownloading ? "Downloading…" : "Download Dispatch ZIP"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metrics Overview Bar */}
        <div className="cjo-metrics-grid" style={{ display: 'grid', gridTemplateColumns: qcBadQty > 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
          <div className="cjo-metric-card" style={{ '--bar': '#0D6E6E' }}>
            <div className="cjo-metric-label">Order Quantity</div>
            <div className="cjo-metric-value">{totalQty} pcs</div>
            <div className="cjo-metric-note">Total Sales Order Qty</div>
          </div>
          {qcBadQty > 0 && (
            <div className="cjo-metric-card" style={{ '--bar': '#DC2626' }}>
              <div className="cjo-metric-label" style={{ color: '#DC2626' }}>QC Rejected</div>
              <div className="cjo-metric-value" style={{ color: '#DC2626' }}>{qcBadQty} pcs</div>
              <div className="cjo-metric-note">Physical Rejects in QC</div>
            </div>
          )}
          <div className="cjo-metric-card" style={{ '--bar': '#059669' }}>
            <div className="cjo-metric-label">Net Good (Packed)</div>
            <div className="cjo-metric-value" style={{ color: '#059669' }}>
              {qcGoodQty} pcs
            </div>
            <div className="cjo-metric-note">Passed &amp; Dispatched</div>
          </div>
          <div className="cjo-metric-card" style={{ '--bar': '#7C3AED' }}>
            <div className="cjo-metric-label">Box Count</div>
            <div className="cjo-metric-value">{boxCount} box(es)</div>
            <div className="cjo-metric-note">Dispatched Packages</div>
          </div>
        </div>

        <div className="cjo-sections">

          {/* PMAT */}
          <div className="cjo-section">
            <div className="cjo-section-head">
              <div className="cjo-section-icon" style={{ '--icon-bg': '#EEF2FF', '--icon-fg': '#4338CA' }}>{SECTION_ICONS.pmat}</div>
              <div className="cjo-section-title">Packing Materials (PMAT) Checklist</div>
            </div>
            <div className="cjo-section-body">
              {(() => {
                const physicalPmat = (pmatItems || []).filter(item => {
                  if (!item || (!item.name && !item.itemType)) return false;
                  const n = String(item.name || item.itemType).toLowerCase();
                  return !n.includes('labour') && !n.includes('labor') && !n.includes('charge') && !n.includes('freight');
                });
                if (physicalPmat.length === 0) {
                  return <div className="cjo-empty-note">No packing materials listed for this job.</div>;
                }
                return (
                  <div className="cjo-table-scroll">
                    <table className="cjo-table">
                      <thead>
                        <tr>
                          <th>Material Name</th>
                          <th>Req. Qty</th>
                          <th>Issued Qty</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {physicalPmat.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: "var(--cjo-ink)" }}>{item.name || item.itemType}</td>
                            <td style={{ fontWeight: 600, color: "var(--cjo-sub)" }}>{item.qty || item.total_qty || 0} {item.unit || "nos"}</td>
                            <td style={{ fontWeight: 600, color: "var(--cjo-sub)" }}>{item.issued_qty || item.receivedQty || item.qty || 0} {item.unit || "nos"}</td>
                            <td><span className="cjo-status-pill">✓ Verified</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Destinations */}
          <div className="cjo-section">
            <div className="cjo-section-head">
              <div className="cjo-section-icon" style={{ '--icon-bg': '#EFF6FF', '--icon-fg': '#1D4ED8' }}>{SECTION_ICONS.dest}</div>
              <div className="cjo-section-title">Delivery Destinations & Dispatch Details</div>
            </div>
            <div className="cjo-section-body">
              {instructionNote && (
                <div className="cjo-instruction">
                  📌 Special Instructions: {instructionNote}
                </div>
              )}

              <div className="cjo-dest-list">
                {destinations.map((dest, idx) => (
                  <div key={idx} className="cjo-dest-card">
                    <div className="cjo-dest-head">
                      <div className="cjo-dest-name">
                        📍 Destination #{idx + 1}: {dest.name || dest.contact_person || "Delivery Location"}
                      </div>
                      <span className="cjo-dest-qty">
                        Qty: {dest.qty || totalQty} pcs
                      </span>
                    </div>

                    <div className="cjo-dest-addr">
                      <b>Address:</b> {dest.addr || dest.address || "Standard Delivery Address"}
                    </div>

                    <div className="cjo-dest-grid" style={{ fontSize: '13px' }}>
                      <div><b>Contact Person:</b> {dest.contact_person || dest.name || "N/A"}</div>
                      <div><b>Contact Number:</b> {dest.contact_number || dest.mobile_no || "N/A"}</div>
                      <div><b>Delivery Mode:</b> {dest.delivery_mode || dest.custom_delivery_mode || job?.sales_order?.delivery_mode || "Courier"}</div>
                      <div><b>Who Will Pay:</b> {dest.who_will_pay || job?.sales_order?.who_will_pay || "N/A"}</div>
                      {dest.courier_amount && <div><b>Courier Charge:</b> ₹{dest.courier_amount}</div>}
                      {dest.add_in_invoice !== undefined && <div><b>Add In Invoice:</b> {dest.add_in_invoice ? "Yes" : "No"}</div>}
                    </div>
                    {dest.challanFile && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => window.open(dest.challanFile, '_blank')}
                          style={{
                            background: '#F1F5F9',
                            border: '1.5px solid #CBD5E1',
                            color: '#334155',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          📄 View / Download DC
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Packing & logistics */}
          <div className="cjo-section">
            <div className="cjo-section-head">
              <div className="cjo-section-icon" style={{ '--icon-bg': '#F0FDFA', '--icon-fg': '#0D6E6E' }}>{SECTION_ICONS.log}</div>
              <div className="cjo-section-title">Physical Packing & Courier Dispatch Log</div>
            </div>
            <div className="cjo-section-body">
              <div className="cjo-log-grid">
                <div className="cjo-log-box">
                  <div className="cjo-log-box-title">Physical Packing Details</div>
                  {(() => {
                    const packingLogs = (job?.logs || []).filter(l => {
                      const m = String(l.msg || l.remarks || l.details || "");
                      return m.includes("Physical packing complete") && !m.includes("ready for Courier");
                    });
                    
                    if (packingLogs.length > 0) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {[...packingLogs].reverse().map((log, idx) => {
                            const dtStr = log.dt || (log.date ? new Date(log.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }) : "-");
                            const msgStr = log.msg || log.remarks || log.details || "";
                            return (
                              <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                                {packingLogs.length > 1 && <div style={{ fontSize: 11, fontWeight: 800, color: '#0D6E6E', textTransform: 'uppercase', marginBottom: 4 }}>Packing Round #{packingLogs.length - idx}</div>}
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>{msgStr.replace("📫 ", "")}</div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: "#0D6E6E" }}>{dtStr}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <div className="cjo-pack-stats">
                          <div className="cjo-pack-stat">
                            <div className="cjo-pack-stat-label">Packed By</div>
                            <div className="cjo-pack-stat-value">{packedBy}</div>
                          </div>
                          <div className="cjo-pack-stat">
                            <div className="cjo-pack-stat-label">Packing Date</div>
                            <div className="cjo-pack-stat-value">{packingDt}</div>
                          </div>
                          <div className="cjo-pack-stat">
                            <div className="cjo-pack-stat-label">No. of Boxes</div>
                            <div className="cjo-pack-stat-value">{boxCount} box(es)</div>
                          </div>
                        </div>
                        {packingNote && (
                          <div className="cjo-pack-note"><b>Packing Note:</b>{packingNote}</div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="cjo-log-box">
                  <div className="cjo-log-box-title">Dispatch Tracking Info</div>
                  <div className="cjo-log-box-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {hasHandDelivery && (
                      <div style={{ borderBottom: (hasClientPickup || hasCourier) ? '1px dashed #CBD5E1' : 'none', paddingBottom: (hasClientPickup || hasCourier) ? 10 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#0D6E6E', textTransform: 'uppercase', marginBottom: 6 }}>🚚 Hand Delivery Log</div>
                        {handDelivery && handDelivery.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                            {handDelivery.map((hd, idx) => (
                              <div key={hd.id || idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                                {handDelivery.length > 1 && <div style={{ fontSize: 11, fontWeight: 800, color: '#0D6E6E', textTransform: 'uppercase', marginBottom: 2 }}>Entry #{idx + 1}</div>}
                                <div><b>Hand Delivered By:</b> {hd.handDeliveryBy || 'Delivery Person'}</div>
                                <div><b>Delivery Vehicle/Mode:</b> {hd.handDeliveryMode || 'Tempo / Bike'}</div>
                                {hd.qty ? <div><b>Quantity:</b> {hd.qty} pcs</div> : null}
                                {hd.handDeliveryCharge > 0 && <div><b>Delivery Charge:</b> ₹{hd.handDeliveryCharge}</div>}
                                {hd.dispatchDt && <div><b>Dispatch Date:</b> {hd.dispatchDt}</div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div><b>Hand Delivered By:</b> {job?.handDeliveryBy || 'Delivery Person'}</div>
                            <div><b>Delivery Vehicle/Mode:</b> {job?.handDeliveryMode || 'Tempo / Bike'}</div>
                            {job?.deliveredQty > 0 && <div><b>Quantity:</b> {job.deliveredQty} pcs</div>}
                            {job?.handDeliveryCharge > 0 && <div><b>Delivery Charge:</b> ₹{job.handDeliveryCharge}</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {hasClientPickup && (
                      <div style={{ borderBottom: hasCourier ? '1px dashed #CBD5E1' : 'none', paddingBottom: hasCourier ? 10 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#0D6E6E', textTransform: 'uppercase', marginBottom: 6 }}>🏪 Client Pickup Log</div>
                        {clientPickup && clientPickup.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                            {clientPickup.map((pu, idx) => (
                              <div key={pu.id || idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                                {clientPickup.length > 1 && <div style={{ fontSize: 11, fontWeight: 800, color: '#0D6E6E', textTransform: 'uppercase', marginBottom: 2 }}>Entry #{idx + 1}</div>}
                                <div><b>Pickup Person Name:</b> {pu.pickupPersonName || 'Customer Representative'}</div>
                                <div><b>Pickup Mode:</b> {pu.pickupMode || 'Self Pickup'}</div>
                                {pu.qty ? <div><b>Quantity:</b> {pu.qty} pcs</div> : null}
                                {pu.dispatchDt && <div><b>Dispatch Date:</b> {pu.dispatchDt}</div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div><b>Pickup Person Name:</b> {job?.pickupPersonName || 'Customer Representative'}</div>
                            <div><b>Pickup Mode:</b> {job?.pickupMode || 'Self Pickup'}</div>
                            {job?.deliveredQty > 0 && <div><b>Quantity:</b> {job.deliveredQty} pcs</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {(hasCourier || (!hasHandDelivery && !hasClientPickup)) && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#0D6E6E', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📦 Courier Shipments & History</span>
                        </div>
                        {shipments && shipments.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {shipments.map((s, idx) => (
                              <div key={s.id || idx} style={{ background: "#F8FAFC", border: "1.5px solid #CCFBF1", borderRadius: 10, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <div style={{ fontSize: 11, fontWeight: 900, color: '#0D6E6E', textTransform: 'uppercase' }}>
                                    Shipment #{idx + 1}
                                  </div>
                                  {s.qty && (
                                    <span style={{ background: "#0D6E6E", color: "white", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                                      {s.qty} pcs
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 13, color: "#0B1526", lineHeight: 1.6 }}>
                                  <div><b>Destination:</b> {s.destName || 'N/A'}</div>
                                  {s.destAddr && <div style={{ fontSize: 12, color: "#5B6B82" }}><b>Address:</b> {s.destAddr}</div>}
                                  <div><b>Courier Partner:</b> {s.courier || courierName || 'N/A'}</div>
                                  <div><b>AWB Number:</b> <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0284C7" }}>{s.awb || 'N/A'}</span></div>
                                  {s.dispatchDt && <div><b>Dispatch Date:</b> {s.dispatchDt}</div>}
                                  {s.expDel && <div><b>Expected Delivery:</b> {s.expDel}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, fontSize: 13 }}>
                            <div><b>Courier Partner:</b> {courierName || 'Standard Courier'}</div>
                            <div><b>AWB Number(s):</b> <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0284C7" }}>{awbNumbers && awbNumbers.length > 0 ? awbNumbers.join(", ") : "N/A"}</span></div>
                            {dispatchDt && <div><b>Dispatch Date:</b> {dispatchDt}</div>}
                            {expectedDelivery && <div><b>Expected Delivery:</b> {expectedDelivery}</div>}
                          </div>
                        )}

                      </div>
                    )}

                    {/* Courier & Dispatch File Links (Always visible if files exist) */}
                    {(misLabelFiles?.length > 0 || labelFiles?.length > 0 || dispatchFiles?.length > 0 || instructionFile || job?.sales_order?.product_files?.length > 0) && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1.5px dashed #CBD5E1", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        {misLabelFiles?.map((fileUrl, idx) => (
                          <a key={`mis-${idx}`} href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            📥 View MIS AWB ({idx + 1})
                          </a>
                        ))}
                        {labelFiles?.map((fileUrl, idx) => (
                          <a key={`lbl-${idx}`} href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ECFDF5", color: "#047857", border: "1.5px solid #A7F3D0", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            🏷 View Legacy Shipping Label ({idx + 1})
                          </a>
                        ))}
                        {labelsGenerated && (
                          <button
                            onClick={() => setShowLabelModal(true)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "#059669",
                              color: "#FFFFFF",
                              border: "1.5px solid #047857",
                              padding: "8px 14px",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: "pointer",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}
                            title="Download Fresh Shipping Label PDF"
                          >
                            🏷 View / Download Shipping Label PDF
                          </button>
                        )}
                        {hideHeader && (
                          <button
                            onClick={handleDownloadDispatchFile}
                            disabled={isDownloading}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "#0F172A",
                              color: "#FFFFFF",
                              border: "1.5px solid #334155",
                              padding: "8px 14px",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: isDownloading ? "not-allowed" : "pointer",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              opacity: isDownloading ? 0.7 : 1
                            }}
                            title="Download Dispatch ZIP File"
                          >
                            <span style={{ fontSize: 14 }}>📥</span>
                            <span>{isDownloading ? "Downloading…" : "Download Dispatch ZIP"}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit log */}
          {logs && logs.length > 0 && (
            <div className="cjo-section">
              <div className="cjo-section-head">
                <div className="cjo-section-icon" style={{ '--icon-bg': '#F8FAFC', '--icon-fg': '#475569' }}>{SECTION_ICONS.audit}</div>
                <div className="cjo-section-title">Complete Activity Log Audit Trail</div>
              </div>
              <div className="cjo-section-body">
                <div className="cjo-audit-scroll">
                  {[...logs].reverse().map((l, idx) => {
                    const dtStr = l.dt || (l.date ? (() => {
                      try {
                        return new Date(l.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
                      } catch (e) {
                        return String(l.date);
                      }
                    })() : (l.event ? 'Recorded' : '-'));

                    const msgStr = l.msg || l.remarks || l.details || (
                      [
                        l.event || l.type || l.action,
                        l.detail,
                        l.qty !== undefined ? `${l.qty} pcs` : null,
                        l.good !== undefined ? `Good: ${l.good}` : null,
                        l.bad !== undefined ? `Bad: ${l.bad}` : null,
                        l.by || l.user?.name ? `by ${l.by || l.user?.name}` : null
                      ].filter(Boolean).join(" — ")
                    ) || "System Update";

                    return (
                      <div key={idx} className="cjo-audit-row">
                        <span className="cjo-audit-dt">{dtStr}</span>
                        <span className="cjo-audit-msg">{msgStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewImage && (
        <ImageLightbox
          src={previewImage}
          fileName={job.product || job.product_name || "Product Preview"}
          onClose={() => setPreviewImage(null)}
        />
      )}
      {showLabelModal && (
        <ShippingLabelModal
          job={packData || job}
          mode="download"
          showAllLabels={true}
          autoDownload={true}
          onClose={() => setShowLabelModal(false)}
        />
      )}
    </div>
  );
}