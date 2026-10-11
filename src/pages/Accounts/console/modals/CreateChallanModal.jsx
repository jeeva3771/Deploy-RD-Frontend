import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";

export default function CreateChallanModal({ job, onClose, onSuccess }) {
  const totalQty = Number(job.qty || 1);
  const alreadyChallanedQty = (job.challans || []).reduce((s, ch) => s + (Number(ch.qty) || 0), 0);
  const remainingQty = Math.max(0, totalQty - alreadyChallanedQty);

  const todayStr = new Date().toISOString().split("T")[0];
  const nextDcNum = (job.challans?.length || 0) + 1;
  const suggestedDcNo = `DC-${new Date().getFullYear()}-${String(nextDcNum).padStart(4, "0")}`;

  const [challanNo, setChallanNo] = useState(suggestedDcNo);
  const [challanDate, setChallanDate] = useState(todayStr);
  const [qty, setQty] = useState(remainingQty > 0 ? remainingQty : 1);
  const [challanFile, setChallanFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Validation errors
  const numQty = Number(qty) || 0;
  const qtyErr =
    numQty <= 0
      ? "Quantity must be greater than 0"
      : numQty > remainingQty && remainingQty > 0
        ? `Cannot exceed remaining ${remainingQty} units`
        : null;

  const canSubmit =
    remainingQty > 0 &&
    !qtyErr &&
    challanNo.trim().length > 0 &&
    !isSubmitting;

  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|jpe?g|png|webp)$/)) {
      toast.warning("Please upload a PDF or image file (PNG, JPG, WEBP)");
      return;
    }
    setChallanFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setChallanFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("sub_job_no", job.sub_job_no || job.id);
      formData.append("job_no", job.job_no || (job.sub_job_no ? job.sub_job_no.split("-")[0] : "RD"));
      formData.append("client", job.client || "");
      formData.append("product", job.product || "");
      formData.append("challanNo", challanNo.trim());
      formData.append("qty", numQty);
      formData.append("challanDate", challanDate || todayStr);
      if (challanFile) {
        formData.append("challan_file", challanFile);
      }

      const res = await axiosInstance.post("/accounts/create-challan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(`Delivery Challan ${challanNo.trim()} created successfully!`);
        if (onSuccess) onSuccess(res.data.challan);
        onClose();
      } else {
        toast.error(res.data?.message || "Failed to create Delivery Challan");
      }
    } catch (err) {
      console.error("Delivery Challan creation error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create Delivery Challan");
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
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
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
            borderBottom: "2px solid #0D9488",
            flexShrink: 0
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#FFF", margin: 0, letterSpacing: "0.5px" }}>
                Generate Delivery Challan
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
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
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
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Challaned Qty</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: alreadyChallanedQty > 0 ? "#059669" : "#64748B", marginTop: 2 }}>
                {alreadyChallanedQty} units
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Available to Challan</div>
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
              <span>All {totalQty} units have already been challaned for this sub-job.</span>
            </div>
          )}

          {/* Challan No & Date Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Challan No */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 5, textTransform: "uppercase" }}>
                Challan No *
              </label>
              <input
                type="text"
                disabled={remainingQty <= 0 || isSubmitting}
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                placeholder="e.g. DC-2026-0001"
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "1.5px solid #CBD5E1",
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Challan Date */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 5, textTransform: "uppercase" }}>
                Challan Date *
              </label>
              <input
                type="date"
                disabled={remainingQty <= 0 || isSubmitting}
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "1.5px solid #CBD5E1",
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 5, textTransform: "uppercase" }}>
              Challan Quantity (units) *
            </label>
            <input
              type="number"
              min="1"
              max={remainingQty > 0 ? remainingQty : 1}
              disabled={remainingQty <= 0 || isSubmitting}
              value={qty}
              onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
              required
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

          {/* Delivery Challan File Upload */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 6, textTransform: "uppercase" }}>
              Upload Delivery Challan Document <span style={{ color: "#94A3B8", fontWeight: 600, textTransform: "none" }}>(Optional · PDF / Scanned Copy / Image)</span>
            </label>

            {challanFile ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#F0FDFA",
                  border: "1.5px solid #0D9488",
                  borderRadius: 10,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>
                    {challanFile.name.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: "#0F766E",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                      title={challanFile.name}
                    >
                      {challanFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#0D9488", marginTop: 2 }}>
                      {(challanFile.size / (1024 * 1024) >= 1
                        ? (challanFile.size / (1024 * 1024)).toFixed(2) + " MB"
                        : (challanFile.size / 1024).toFixed(1) + " KB")} · Attached &amp; Ready to Upload
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 900,
                    flexShrink: 0,
                    marginLeft: 10,
                    transition: "all 0.15s"
                  }}
                  title="Remove attached file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 14px",
                  border: isDragging ? "2px dashed #0D9488" : "1.5px dashed #CBD5E1",
                  borderRadius: 10,
                  background: isDragging ? "#F0FDFA" : "#F8FAFC",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0D9488", fontWeight: 800, fontSize: 12.5 }}>
                  <span style={{ fontSize: 18 }}>📤</span>
                  <span>Click to browse or Drag &amp; Drop Challan</span>
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                  Supports PDF, PNG, JPG, JPEG (Max 25MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  disabled={isSubmitting}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div
            style={{
              background: "#F0FDFA",
              border: "1.5px solid #99F6E4",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: "#0F766E" }}>
              <span>Sub-Job Item:</span>
              <span style={{ fontWeight: 800 }}>{job.product || "Custom Trophy"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: "#0F766E" }}>
              <span>Dispatch Quantity:</span>
              <span style={{ fontWeight: 800 }}>{numQty} units</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#0F766E" }}>
              <span>Remaining After Dispatch:</span>
              <span style={{ fontWeight: 800, color: remainingQty - numQty === 0 ? "#059669" : "#D97706" }}>
                {Math.max(0, remainingQty - numQty)} units
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                color: "#64748B",
                background: "#F1F5F9",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "9px 22px",
                fontSize: 13,
                fontWeight: 800,
                color: "#FFF",
                background: canSubmit ? "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)" : "#94A3B8",
                border: "none",
                borderRadius: 8,
                cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit ? "0 4px 12px rgba(13,148,136,0.3)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                  <span>Generating Challan...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Confirm &amp; Generate Delivery Challan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
