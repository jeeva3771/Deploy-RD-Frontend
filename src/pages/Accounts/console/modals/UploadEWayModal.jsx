import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";

export default function UploadEWayModal({ job, onClose, onSuccess }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [ewayDate, setEwayDate] = useState(todayStr);
  const [validUpto, setValidUpto] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const subJobNo = job.sub_job_no || job.id || "";
  const jobNo = job.job_no || (subJobNo ? subJobNo.split("-")[0] : "RD");
  const clientName = job.client || "Client";
  const productName = job.product || "Custom Trophy";

  const handleFilesAdded = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const validFiles = [];
    const validExtensions = ["pdf", "png", "jpg", "jpeg", "webp"];

    for (let i = 0; i < incoming.length; i++) {
      const f = incoming[i];
      const ext = f.name.split(".").pop().toLowerCase();
      if (!validExtensions.includes(ext) && !f.type.startsWith("image/") && f.type !== "application/pdf") {
        toast.warning(`File "${f.name}" is not a supported format (PDF or Image)`);
        continue;
      }
      // Check for duplicate in current list
      const already = selectedFiles.some(
        (sf) => sf.name === f.name && sf.size === f.size
      );
      if (!already) {
        validFiles.push(f);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
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
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.warning("Please select at least one E-Way Bill file to upload");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("sub_job_no", subJobNo);
      formData.append("job_no", jobNo);
      formData.append("client_name", clientName);
      formData.append("product_name", productName);
      formData.append("ewayBillNo", ewayBillNo.trim());
      formData.append("ewayDate", ewayDate || todayStr);
      formData.append("validUpto", validUpto || "");
      formData.append("remarks", remarks || "");

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await axiosInstance.post("/accounts/upload-eway", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(
          res.data.message || `${selectedFiles.length} E-Way Bill file(s) uploaded successfully!`
        );
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      } else {
        toast.error(res.data?.message || "Failed to upload E-Way Bill files");
      }
    } catch (err) {
      console.error("E-Way Bill upload error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to upload E-Way Bill files");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 26, 46, 0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 600,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          border: "1px solid #CBD5E1",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#0C1A2E",
            color: "#FFF",
            padding: "16px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1E293B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🚛</span>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#FFF",
                }}
              >
                Upload E-Way Bill · {subJobNo}
              </div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
                Upload multiple official E-Way Bill PDFs or receipts for this consignment
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              fontSize: 20,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "18px 22px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Sub-Job Context Banner */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0C1A2E" }}>
                {clientName}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>
                {productName}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#0D9488",
                background: "#CCFBF1",
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              {subJobNo}
            </span>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                E-Way Bill Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 181234567890"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                E-Way Bill Date
              </label>
              <input
                type="date"
                value={ewayDate}
                onChange={(e) => setEwayDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                Valid Upto (Optional)
              </label>
              <input
                type="date"
                value={validUpto}
                onChange={(e) => setValidUpto(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                Remarks / Vehicle / Transporter
              </label>
              <input
                type="text"
                placeholder="e.g. MH04AB1234 / Delhivery"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Multi-File Upload Drop Zone */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A" }}>
                Select E-Way Bill File(s) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {selectedFiles.length > 0 && (
                <span style={{ fontSize: 11.5, color: "#0D9488", fontWeight: 700 }}>
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#0D9488" : "#CBD5E1"}`,
                borderRadius: 10,
                padding: "20px 16px",
                background: isDragging ? "#F0FDFA" : "#F8FAFC",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,image/*,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesAdded(Array.from(e.target.files));
                  }
                }}
              />
              <div style={{ fontSize: 32, marginBottom: 4 }}>📁</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1E293B" }}>
                Click to browse or drag & drop multiple files
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3 }}>
                Supports PDF documents, PNG, JPG, WEBP
              </div>
            </div>

            {/* List of Selected Files */}
            {selectedFiles.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 180,
                  overflowY: "auto",
                }}
              >
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}_${idx}`}
                    style={{
                      background: "#FFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: "7px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      style={{
                        background: "#FEE2E2",
                        color: "#DC2626",
                        border: "none",
                        borderRadius: 4,
                        width: 22,
                        height: 22,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
              paddingTop: 12,
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: "#FFF",
                border: "1px solid #CBD5E1",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || isSubmitting}
              style={{
                background: selectedFiles.length === 0 || isSubmitting ? "#94A3B8" : "#0D9488",
                color: "#FFF",
                border: "none",
                borderRadius: 6,
                padding: "8px 18px",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: selectedFiles.length === 0 || isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 4px rgba(13,148,136,0.25)",
              }}
            >
              {isSubmitting ? (
                <>
                  <span>⏳</span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>
                    Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : "E-Way Bill"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
