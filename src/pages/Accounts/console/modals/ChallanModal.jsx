import React, { useState, useMemo, useEffect } from "react";
import { downloadChallanPDFDirect, downloadAllChallans } from "../utils/accountsFormatters";
import { axiosInstance } from "../../../../utils/url/config";

export default function ChallanModal({ data, allJobs = [], onClose }) {
  const [search, setSearch] = useState("");
  const [serverChallans, setServerChallans] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const subJob = data?.subJob || null;

  // Fetch all challans from backend if opening global repo
  useEffect(() => {
    if (!subJob) {
      setLoadingServer(true);
      axiosInstance
        .get("/accounts/all-challans")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setServerChallans(res.data.data);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch /accounts/all-challans, using allJobs fallback:", err);
        })
        .finally(() => setLoadingServer(false));
    }
  }, [subJob]);

  // Compile list of Delivery Challans to display
  const challanList = useMemo(() => {
    if (subJob) {
      // 1. If explicit subJob.challans array exists
      if (Array.isArray(subJob.challans) && subJob.challans.length > 0) {
        return subJob.challans.map((ch, idx) => ({
          ...ch,
          id: ch.id || ch._id || `${subJob.sub_job_no || subJob.id}_dc_${idx}`,
          challanNo: ch.challanNo || `DC-${idx + 1}`,
          sub_job_no: ch.sub_job_no || subJob.sub_job_no || subJob.id,
          job_no: ch.job_no || subJob.job_no,
          client: ch.client || subJob.client,
          product: ch.product || subJob.product,
          qty: ch.qty || subJob.qty || 1,
          by: ch.by || "Accounts",
          dt: ch.dt || ch.challanDate || subJob.bilAt || "—",
          destName: ch.destName || subJob.destinations?.[idx]?.name || subJob.delivery_address || "",
          dispatchMode: ch.dispatchMode || subJob.courierName || "Courier / Dispatch",
          url: ch.url || ch.downloadUrl || ch.challanFile || "",
          downloadUrl: ch.downloadUrl || ch.url || ch.challanFile || "",
          n: ch.n || `${ch.challanNo || subJob.sub_job_no || "Challan"}.pdf`,
        }));
      }

      // 2. If single delivery challan document attached in bilDocs
      if (subJob.bilDocs?.challan) {
        return [
          {
            id: subJob.sub_job_no || subJob.id,
            challanNo:
              subJob.challanNo ||
              subJob.bilDocs.challan.challanNo ||
              subJob.bilDocs.challan.n?.replace(/_Challan\.pdf$/i, "") ||
              "DC",
            sub_job_no: subJob.sub_job_no || subJob.id,
            job_no: subJob.job_no,
            client: subJob.client,
            product: subJob.product,
            qty: subJob.qty || 1,
            by: subJob.bilDocs.challan.by || "Accounts",
            dt: subJob.bilDocs.challan.dt || subJob.bilAt || "—",
            destName: subJob.destinations?.[0]?.name || subJob.delivery_address || "",
            dispatchMode: subJob.courierName || "Courier / Transport",
            url: subJob.bilDocs.challan.url || "",
            downloadUrl: subJob.bilDocs.challan.downloadUrl || "",
            n: subJob.bilDocs.challan.n || `${subJob.sub_job_no || subJob.id}_Challan.pdf`,
          },
        ];
      }

      // 3. If packing challanList is present on the subJob
      if (Array.isArray(subJob.challanList) && subJob.challanList.length > 0) {
        return subJob.challanList.map((ch, idx) => ({
          id: ch.id || `${subJob.sub_job_no}_dc_${idx}`,
          challanNo: ch.challanNo || `DC-${idx + 1}`,
          sub_job_no: subJob.sub_job_no || subJob.id,
          job_no: subJob.job_no,
          client: subJob.client,
          product: subJob.product,
          qty: ch.qty || subJob.qty || 1,
          by: ch.by || "Packing / Logistics",
          dt: ch.challanDate || subJob.bilAt || "—",
          destName: ch.destName || "",
          dispatchMode: ch.dispatchMode || subJob.courierName || "Courier",
          url: ch.url || ch.challanFile || "",
          downloadUrl: ch.downloadUrl || ch.challanFile || "",
          n: `${ch.challanNo || subJob.sub_job_no}_Challan.pdf`,
        }));
      }

      return [];
    }

    // Global repository mode across all jobs
    if (serverChallans && serverChallans.length > 0) {
      return serverChallans;
    }

    const all = [];
    (allJobs || []).forEach((j) => {
      if (Array.isArray(j.challans) && j.challans.length > 0) {
        j.challans.forEach((ch, idx) => {
          all.push({
            ...ch,
            id: ch.id || ch._id || `${j.sub_job_no || j.id}_dc_${idx}`,
            challanNo: ch.challanNo || `DC-${idx + 1}`,
            sub_job_no: ch.sub_job_no || j.sub_job_no || j.id,
            job_no: ch.job_no || j.job_no,
            client: ch.client || j.client,
            product: ch.product || j.product,
            qty: ch.qty || j.qty || 1,
            by: ch.by || "Accounts",
            dt: ch.dt || ch.challanDate || j.bilAt || "—",
            destName: ch.destName || j.destinations?.[idx]?.name || j.delivery_address || "",
            dispatchMode: ch.dispatchMode || j.courierName || "Courier / Dispatch",
            url: ch.url || ch.downloadUrl || ch.challanFile || "",
            downloadUrl: ch.downloadUrl || ch.url || ch.challanFile || "",
            n: ch.n || `${ch.challanNo || j.sub_job_no || "Challan"}.pdf`,
          });
        });
      } else if (j.bilDocs?.challan) {
        all.push({
          id: j.sub_job_no || j.id,
          challanNo:
            j.challanNo ||
            j.bilDocs.challan.challanNo ||
            j.bilDocs.challan.n?.replace(/_Challan\.pdf$/i, "") ||
            "DC",
          sub_job_no: j.sub_job_no || j.id,
          job_no: j.job_no,
          client: j.client,
          product: j.product,
          qty: j.qty || 1,
          by: j.bilDocs.challan.by || "Accounts",
          dt: j.bilDocs.challan.dt || j.bilAt || "—",
          destName: j.destinations?.[0]?.name || j.delivery_address || "",
          dispatchMode: j.courierName || "Courier / Transport",
          url: j.bilDocs.challan.url || "",
          downloadUrl: j.bilDocs.challan.downloadUrl || "",
          n: j.bilDocs.challan.n || `${j.sub_job_no || j.id}_Challan.pdf`,
        });
      }
    });
    return all;
  }, [subJob, allJobs, serverChallans]);

  const filteredChallans = useMemo(() => {
    if (!search.trim()) return challanList;
    const q = search.trim().toLowerCase();
    return challanList.filter((ch) => {
      return (
        String(ch.challanNo || "").toLowerCase().includes(q) ||
        String(ch.sub_job_no || "").toLowerCase().includes(q) ||
        String(ch.job_no || "").toLowerCase().includes(q) ||
        String(ch.client || "").toLowerCase().includes(q) ||
        String(ch.product || "").toLowerCase().includes(q) ||
        String(ch.by || "").toLowerCase().includes(q) ||
        String(ch.destName || "").toLowerCase().includes(q) ||
        String(ch.dispatchMode || "").toLowerCase().includes(q) ||
        String(ch.n || "").toLowerCase().includes(q)
      );
    });
  }, [challanList, search]);

  const totalQty = filteredChallans.reduce((s, c) => s + (Number(c.qty) || 0), 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 26, 46, 0.7)",
        backdropFilter: "blur(3px)",
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
          maxWidth: 820,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
          border: "1px solid #CBD5E1",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#0C1A2E",
            color: "#FFF",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1E293B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📄</span>
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
                {subJob ? `Delivery Challan PDFs · ${subJob.sub_job_no || subJob.id}` : "All Delivery Challans Repository"}
              </div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
                {subJob
                  ? `${subJob.client || "Client"} · ${subJob.product || "Product"} · ${filteredChallans.length} challan(s)`
                  : loadingServer
                    ? "Loading delivery challans..."
                    : `Showing ${filteredChallans.length} of ${challanList.length} total Delivery Challan PDF(s)`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {filteredChallans.length > 0 && (
              <button
                onClick={() => downloadAllChallans(filteredChallans, subJob || {})}
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
                title="Download all listed delivery challans"
              >
                <span>📥</span>
                <span>Download All ({filteredChallans.length})</span>
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

        {/* Search & Stats Bar */}
        <div
          style={{
            padding: "12px 20px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
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
              placeholder="Search Challan No, Sub-Job, Client, User, Destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 28px 7px 30px",
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

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
              Total Dispatched:{" "}
              <b style={{ color: "#0C1A2E", fontFamily: "monospace" }}>
                {totalQty.toLocaleString("en-IN")} pcs
              </b>
            </span>
          </div>
        </div>

        {/* Challans List Body */}
        <div
          style={{
            padding: "16px 20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {filteredChallans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>
                No Delivery Challan PDFs found
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {search
                  ? "No matches for your search query."
                  : "No delivery challans have been generated or recorded for this selection yet."}
              </div>
            </div>
          ) : (
            filteredChallans.map((ch, idx) => (
              <div
                key={ch.id || ch.challanNo || idx}
                style={{
                  background: "#FFF",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  transition: "all 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
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
                    📄
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 900,
                          color: "#0C1A2E",
                          fontFamily: "monospace",
                        }}
                      >
                        {ch.challanNo || ch.n}
                      </span>
                      <span
                        style={{
                          background: "#ECFDF5",
                          color: "#059669",
                          border: "1px solid #A7F3D0",
                          borderRadius: 4,
                          padding: "1px 6px",
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        Delivery Challan
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3 }}>
                      <b style={{ color: "#0D9488" }}>{ch.sub_job_no || "—"}</b> · {ch.client || "Client"} · {ch.product || "Custom Trophy"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span>Generated by <b style={{ color: "#475569" }}>{ch.by || "Accounts"}</b></span>
                      <span>· {ch.dt || ch.challanDate || "—"}</span>
                      {ch.destName && <span>· Dest: <b style={{ color: "#475569" }}>{ch.destName}</b></span>}
                      {ch.dispatchMode && <span>· Mode: <b style={{ color: "#475569" }}>{ch.dispatchMode}</b></span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: "#059669",
                        fontFamily: "monospace",
                      }}
                    >
                      Qty: {Number(ch.qty || 1).toLocaleString("en-IN")} pcs
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => {
                        if (ch.url || ch.downloadUrl) {
                          window.open(ch.url || ch.downloadUrl, "_blank");
                        } else {
                          downloadChallanPDFDirect(ch, subJob || {}, "open");
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#F1F5F9",
                        color: "#334155",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="Open Challan PDF Preview in new tab"
                    >
                      <span>👁️</span>
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => downloadChallanPDFDirect(ch, subJob || {}, "download")}
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
                      title="Download this specific Delivery Challan PDF"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  </div>
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
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Showing <b>{filteredChallans.length}</b> Delivery Challan PDF document(s)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "#FFF",
                border: "1px solid #CBD5E1",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            {filteredChallans.length > 0 && (
              <button
                onClick={() => downloadAllChallans(filteredChallans, subJob || {})}
                style={{
                  background: "#0D9488",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>📥</span>
                <span>Download All ({filteredChallans.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
