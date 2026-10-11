import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { downloadFileDirectly } from "../utils/accountsFormatters";
import { axiosInstance } from "../../../../utils/url/config";

export default function EWayModal({ data, allJobs = [], onClose, onUploadNew, onRefresh }) {
  const [search, setSearch] = useState("");
  const [serverEways, setServerEways] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const subJob = data?.subJob || null;

  // Fetch all E-Way bills from backend
  const fetchEways = useCallback(() => {
    setLoadingServer(true);
    const endpoint = subJob
      ? `/accounts/all-eways?sub_job_no=${encodeURIComponent(subJob.sub_job_no || subJob.id)}`
      : "/accounts/all-eways";

    axiosInstance
      .get(endpoint)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setServerEways(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch /accounts/all-eways, using fallback:", err);
      })
      .finally(() => setLoadingServer(false));
  }, [subJob]);

  useEffect(() => {
    fetchEways();
  }, [fetchEways]);

  // Compile list of E-Way bills to display
  const ewayList = useMemo(() => {
    if (serverEways.length > 0) {
      return serverEways;
    }

    if (subJob) {
      if (Array.isArray(subJob.ewayBills) && subJob.ewayBills.length > 0) {
        return subJob.ewayBills;
      }
      if (subJob.bilDocs?.eway) {
        return [
          {
            id: subJob.sub_job_no || subJob.id,
            ewayBillNo: subJob.bilDocs.eway.n?.replace(/_EwayBill\.pdf$/i, "") || "EWB",
            sub_job_no: subJob.sub_job_no || subJob.id,
            job_no: subJob.job_no,
            client: subJob.client,
            product: subJob.product,
            by: subJob.bilDocs.eway.by || "Accounts",
            dt: subJob.bilDocs.eway.dt || "—",
            url: subJob.bilDocs.eway.url || "",
            downloadUrl: subJob.bilDocs.eway.downloadUrl || "",
            n: subJob.bilDocs.eway.n || `${subJob.sub_job_no || subJob.id}_EwayBill.pdf`,
          },
        ];
      }
      return [];
    }

    // Global repository mode
    const all = [];
    (allJobs || []).forEach((j) => {
      if (Array.isArray(j.ewayBills) && j.ewayBills.length > 0) {
        all.push(...j.ewayBills);
      } else if (j.bilDocs?.eway) {
        all.push({
          id: j.sub_job_no || j.id,
          ewayBillNo: j.bilDocs.eway.n?.replace(/_EwayBill\.pdf$/i, "") || "EWB",
          sub_job_no: j.sub_job_no || j.id,
          job_no: j.job_no,
          client: j.client,
          product: j.product,
          by: j.bilDocs.eway.by || "Accounts",
          dt: j.bilDocs.eway.dt || "—",
          url: j.bilDocs.eway.url || "",
          downloadUrl: j.bilDocs.eway.downloadUrl || "",
          n: j.bilDocs.eway.n || `${j.sub_job_no || j.id}_EwayBill.pdf`,
        });
      }
    });
    return all;
  }, [subJob, allJobs, serverEways]);

  const filteredEways = useMemo(() => {
    if (!search.trim()) return ewayList;
    const q = search.trim().toLowerCase();
    return ewayList.filter((ew) => {
      return (
        String(ew.ewayBillNo || "").toLowerCase().includes(q) ||
        String(ew.sub_job_no || "").toLowerCase().includes(q) ||
        String(ew.job_no || "").toLowerCase().includes(q) ||
        String(ew.client || "").toLowerCase().includes(q) ||
        String(ew.product || "").toLowerCase().includes(q) ||
        String(ew.by || "").toLowerCase().includes(q) ||
        String(ew.remarks || "").toLowerCase().includes(q) ||
        String(ew.validUpto || "").toLowerCase().includes(q) ||
        String(ew.ewayDate || "").toLowerCase().includes(q) ||
        String(ew.n || ew.fileName || "").toLowerCase().includes(q)
      );
    });
  }, [ewayList, search]);

  const handleDownloadAll = async () => {
    if (filteredEways.length === 0) return;
    toast.info(`Starting download for ${filteredEways.length} E-Way Bill file(s)...`);
    for (let i = 0; i < filteredEways.length; i++) {
      const ew = filteredEways[i];
      const targetUrl = ew.downloadUrl || ew.url;
      const filename = ew.n || ew.fileName || `${ew.ewayBillNo || "EWayBill"}.pdf`;
      if (targetUrl) {
        await downloadFileDirectly(targetUrl, filename);
      }
      if (i < filteredEways.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    toast.success(`Downloaded all ${filteredEways.length} file(s)!`);
  };

  const handleDeleteEway = async (ewId) => {
    if (!window.confirm("Are you sure you want to delete this E-Way Bill file?")) return;
    try {
      const res = await axiosInstance.delete(`/accounts/eway/${ewId}`);
      if (res.data?.success) {
        toast.success("E-Way Bill file deleted successfully");
        fetchEways();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.data?.message || "Failed to delete E-Way Bill");
      }
    } catch (err) {
      console.error("Delete E-Way Bill error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info(`Copied "${text}" to clipboard`);
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
          maxWidth: 860,
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          border: "1px solid #CBD5E1",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#0C1A2E",
            color: "#FFF",
            padding: "14px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1E293B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>🚛</span>
            <div>
              <div
                style={{
                  fontSize: 15.5,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#FFF",
                }}
              >
                {subJob ? `E-Way Bill Overview · ${subJob.sub_job_no || subJob.id}` : "All E-Way Bills Repository"}
              </div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
                {subJob
                  ? `${subJob.client || "Client"} · ${subJob.product || "Product"} · ${filteredEways.length} document(s)`
                  : loadingServer
                    ? "Loading E-Way bills..."
                    : `Showing ${filteredEways.length} of ${ewayList.length} total E-Way Bill PDF(s)`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {subJob && onUploadNew && (
              <button
                onClick={() => {
                  onClose();
                  onUploadNew(subJob);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#2563EB",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                title="Upload additional E-Way bill files"
              >
                <span>➕</span>
                <span>Upload More</span>
              </button>
            )}

            {filteredEways.length > 0 && (
              <button
                onClick={handleDownloadAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#0D9488",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                title="Download all listed E-Way bills"
              >
                <span>📥</span>
                <span>Download All ({filteredEways.length})</span>
              </button>
            )}

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
        </div>

        {/* Consignment Overview Banner (When SubJob context is active) */}
        {subJob && (
          <div
            style={{
              background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
              borderBottom: "1px solid #E2E8F0",
              padding: "12px 22px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Client / Consignee
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#0C1A2E", marginTop: 2 }}>
                {subJob.client || "Client"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Product / Description
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginTop: 2 }}>
                {subJob.product || "Custom Trophy"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Sub-Job & Job Reference
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#0D9488", fontFamily: "monospace", marginTop: 2 }}>
                {subJob.sub_job_no || subJob.id} {subJob.job_no ? `(#${subJob.job_no})` : ""}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Consignment Units
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#2563EB", fontFamily: "monospace", marginTop: 2 }}>
                {Number(subJob.qty || 1).toLocaleString("en-IN")} pcs
              </div>
            </div>
          </div>
        )}

        {/* Search & Stats Bar */}
        <div
          style={{
            padding: "12px 22px",
            background: "#FFF",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
                fontSize: 13,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by EWB Number, Sub-Job, Client, Vehicle, Transporter, User..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 28px 8px 32px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 12.5,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  fontSize: 11,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: "#0F766E",
                fontWeight: 700,
                background: "#CCFBF1",
                border: "1px solid #99F6E4",
                padding: "5px 12px",
                borderRadius: 6,
              }}
            >
              Total Documents: <b>{filteredEways.length}</b>
            </span>
          </div>
        </div>

        {/* E-Way Bills List Body */}
        <div
          style={{
            padding: "16px 22px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filteredEways.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#64748B" }}>
                No E-Way Bill files found
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {search
                  ? "No matches for your search query."
                  : "No E-Way bill documents have been uploaded for this consignment yet."}
              </div>
            </div>
          ) : (
            filteredEways.map((ew, idx) => (
              <div
                key={ew._id || ew.id || idx}
                style={{
                  background: "#FFF",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {/* Top Row: EWB Number + Badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        color: "#2563EB",
                        flexShrink: 0,
                      }}
                    >
                      🚛
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: "#0C1A2E",
                            fontFamily: "monospace",
                            letterSpacing: 0.3,
                          }}
                        >
                          {ew.ewayBillNo || ew.n || ew.fileName}
                        </span>
                        {ew.ewayBillNo && (
                          <button
                            onClick={() => copyToClipboard(ew.ewayBillNo)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              color: "#64748B",
                              padding: 0,
                            }}
                            title="Copy E-Way Bill Number"
                          >
                            📋
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
                        {ew.fileName || ew.n || "E-Way Bill Document"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        border: "1px solid #A7F3D0",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      E-Way Bill
                    </span>
                    {ew.validUpto && (
                      <span
                        style={{
                          background: "#FEF3C7",
                          color: "#B45309",
                          border: "1px solid #FDE68A",
                          borderRadius: 4,
                          padding: "2px 7px",
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        Valid till: {ew.validUpto}
                      </span>
                    )}
                  </div>
                </div>

                {/* Detailed Metadata Grid */}
                <div
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 8,
                    fontSize: 11.5,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B" }}>Sub-Job: </span>
                    <b style={{ color: "#0D9488" }}>{ew.sub_job_no || "—"}</b>
                    {ew.job_no ? <span style={{ color: "#94A3B8" }}> (#{ew.job_no})</span> : null}
                  </div>

                  <div>
                    <span style={{ color: "#64748B" }}>Client: </span>
                    <b style={{ color: "#1E293B" }}>{ew.client || "Client"}</b>
                  </div>

                  <div>
                    <span style={{ color: "#64748B" }}>Date: </span>
                    <b style={{ color: "#1E293B" }}>{ew.ewayDate || "—"}</b>
                  </div>

                  <div>
                    <span style={{ color: "#64748B" }}>File Size: </span>
                    <b style={{ color: "#475569" }}>{formatFileSize(ew.fileSize)}</b>
                  </div>

                  <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, borderTop: "1px solid #E2E8F0", paddingTop: 6, marginTop: 2 }}>
                    <div>
                      <span style={{ color: "#64748B" }}>Transporter / Vehicle / Remarks: </span>
                      <b style={{ color: "#0F172A" }}>{ew.remarks || "Direct Transport / Consignment"}</b>
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: 11 }}>
                      Uploaded by <b style={{ color: "#475569" }}>{ew.by || "Accounts"}</b> · {ew.dt || "—"}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 2 }}>
                  {(ew.url || ew.downloadUrl) && (
                    <button
                      onClick={() => window.open(ew.url || ew.downloadUrl, "_blank")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#EFF6FF",
                        color: "#2563EB",
                        border: "1px solid #BFDBFE",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      title="Open E-Way Bill in new browser tab"
                    >
                      <span>👁️</span>
                      <span>Open Tab ↗</span>
                    </button>
                  )}

                  {(ew.downloadUrl || ew.url) && (
                    <button
                      onClick={() =>
                        downloadFileDirectly(
                          ew.downloadUrl || ew.url,
                          ew.fileName || ew.n || `${ew.ewayBillNo || "EWayBill"}.pdf`
                        )
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#0D9488",
                        color: "#FFF",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                      title="Download E-Way Bill file"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  )}

                  {ew._id && (
                    <button
                      onClick={() => handleDeleteEway(ew._id)}
                      style={{
                        background: "#FFF",
                        border: "1px solid #FCA5A5",
                        color: "#EF4444",
                        borderRadius: 6,
                        padding: "6px 9px",
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Delete this E-Way Bill document"
                    >
                      <span>🗑️</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            padding: "12px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Showing <b>{filteredEways.length}</b> E-Way Bill document(s)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "#FFF",
                border: "1px solid #CBD5E1",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            {filteredEways.length > 0 && (
              <button
                onClick={handleDownloadAll}
                style={{
                  background: "#0D9488",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 18px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>📥</span>
                <span>Download All ({filteredEways.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
