import React, { useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";
const formatFull = (val) => Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CreateInvoiceModal({ job, onClose, onSuccess }) {
  const totalQty = Number(job.qty || 1);
  const alreadyInvoicedQty = (job.invoices || []).reduce((s, inv) => s + (Number(inv.qty) || 0), 0);
  const remainingQty = Math.max(0, totalQty - alreadyInvoicedQty);

  // Suggested unit price from BOM or calculated base amount
  const initialUnitPrice = Number(
    job.unitPrice ||
    (job.amount && totalQty > 0 ? Number((job.amount / totalQty).toFixed(2)) : 0)
  );

  const initialGstRate = Number(job.gstRate) === 18 || Number(job.gstPct) === 18
    ? 18
    : Number(job.gstRate) === 10 || Number(job.gstPct) === 10
      ? 10
      : Number(job.gstRate) === 5 || Number(job.gstPct) === 5
        ? 5
        : Number(job.gstRate) === 0 || Number(job.gstPct) === 0
          ? 0
          : 18;

  const [qty, setQty] = useState(remainingQty > 0 ? remainingQty : 1);
  const [pricePerQty, setPricePerQty] = useState(initialUnitPrice);
  const [gstPct, setGstPct] = useState(initialGstRate);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time calculations
  const numQty = Number(qty) || 0;
  const numPrice = Number(pricePerQty) || 0;
  const numGst = Number(gstPct) || 0;

  const subtotal = Number((numQty * numPrice).toFixed(2));
  const gstAmt = Number(((subtotal * numGst) / 100).toFixed(2));
  const totalAmt = Number((subtotal + gstAmt).toFixed(2));

  // Validation
  let qtyErr = "";
  if (remainingQty > 0) {
    if (numQty > remainingQty) {
      qtyErr = `Max ${remainingQty} units available to invoice`;
    } else if (numQty < 1) {
      qtyErr = "Min 1 unit required";
    }
  }

  const canSubmit = remainingQty > 0 && numQty > 0 && numPrice > 0 && !qtyErr && !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        sub_job_no: job.sub_job_no || job.id,
        qty: numQty,
        pricePerQty: numPrice,
        gstPct: numGst,
        remarks: remarks.trim()
      };

      const res = await axiosInstance.post("/accounts/create-invoice", payload);
      if (res.data?.success) {
        toast.success(res.data.message || "Tax Invoice created and attached successfully!");
        if (onSuccess) {
          onSuccess(res.data.invoice);
        }
        onClose();
      } else {
        toast.error(res.data?.error || "Failed to generate invoice");
      }
    } catch (err) {
      console.error("Invoice creation error:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Error generating invoice";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 26, 46, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 580,
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          overflow: "hidden",
          animation: "modalSlideIn 0.2s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0C1A2E 0%, #1E293B 100%)",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #0D9488"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧾</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#FFF", margin: 0, letterSpacing: "0.5px" }}>
                Generate Tax Invoice
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8", marginTop: 4 }}>
              Sub-Job: <b style={{ color: "#2DD4BF" }}>{job.sub_job_no || job.id}</b> · {job.client}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#FFF",
              width: 30,
              height: 30,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              transition: "background 0.15s"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          {/* Order Quantity Status Banner */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Order Qty</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0C1A2E", marginTop: 2 }}>{totalQty} units</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Invoiced Qty</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: alreadyInvoicedQty > 0 ? "#059669" : "#64748B", marginTop: 2 }}>
                {alreadyInvoicedQty} units
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Available to Invoice</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: remainingQty > 0 ? "#0D9488" : "#DC2626", marginTop: 2 }}>
                {remainingQty} units
              </div>
            </div>
          </div>

          {remainingQty <= 0 && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                color: "#DC2626",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>⚠️</span>
              <span>This sub-job has already been fully invoiced ({totalQty} / {totalQty} units).</span>
            </div>
          )}

          {/* Input Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Qty Input */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 5, textTransform: "uppercase" }}>
                Invoice Qty *
              </label>
              <input
                type="number"
                min="1"
                max={remainingQty > 0 ? remainingQty : totalQty}
                disabled={remainingQty <= 0 || isSubmitting}
                value={qty}
                onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 14,
                  fontWeight: 800,
                  border: `1.5px solid ${qtyErr ? "#EF4444" : "#CBD5E1"}`,
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {qtyErr && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444", marginTop: 4 }}>
                  {qtyErr}
                </div>
              )}
            </div>

            {/* Price Per Qty (Read-only) */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 5, textTransform: "uppercase" }}>
                Per Unit Price (₹) <span style={{ color: "#94A3B8", fontWeight: 600, fontSize: 10 }}>(Locked)</span>
              </label>
              <input
                type="number"
                readOnly
                tabIndex={-1}
                value={pricePerQty}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 14,
                  fontWeight: 800,
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  cursor: "not-allowed"
                }}
              />
            </div>
          </div>

          {/* GST % Selection */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 5, textTransform: "uppercase" }}>
              GST Rate
            </label>
            <select
              value={gstPct}
              disabled={remainingQty <= 0 || isSubmitting}
              onChange={(e) => setGstPct(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                fontWeight: 700,
                border: "1.5px solid #CBD5E1",
                borderRadius: 8,
                outline: "none",
                background: "#FFF",
                boxSizing: "border-box",
                cursor: "pointer"
              }}
            >
              <option value={0}>No GST (0%)</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={18}>18%</option>
            </select>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 5, textTransform: "uppercase" }}>
              Terms / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 50% advance invoice, part shipment #1..."
              value={remarks}
              disabled={remainingQty <= 0 || isSubmitting}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 12,
                border: "1.5px solid #CBD5E1",
                borderRadius: 8,
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Calculation Summary Box */}
          <div
            style={{
              background: "#F0FDFA",
              border: "1.5px solid #99F6E4",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#0F766E", marginBottom: 4 }}>
              <span>Subtotal ({numQty} × ₹{formatFull(numPrice)})</span>
              <span style={{ fontWeight: 800 }}>₹{formatFull(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#0F766E", marginBottom: 6 }}>
              <span>GST Amount ({numGst === 0 ? "No GST" : `${numGst}%`})</span>
              <span style={{ fontWeight: 800 }}>₹{formatFull(gstAmt)}</span>
            </div>
            <div style={{ height: 1, background: "#CCFBF1", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#042F2E" }}>Grand Total</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#0D9488", fontFamily: "monospace" }}>
                ₹{formatFull(totalAmt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                background: "#FFF",
                color: "#475569",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: canSubmit ? "linear-gradient(135deg, #0D9488, #059669)" : "#E2E8F0",
                color: canSubmit ? "#FFF" : "#94A3B8",
                fontSize: 13,
                fontWeight: 900,
                cursor: canSubmit ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: canSubmit ? "0 4px 12px rgba(13, 148, 136, 0.3)" : "none",
                transition: "all 0.15s"
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, border: "2px solid #FFF", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                  <span>Generating Invoice...</span>
                </>
              ) : (
                <>
                  <span>🧾</span>
                  <span>Generate Invoice — ₹{formatFull(totalAmt)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
