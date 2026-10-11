import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../../utils/url/config";

export default function PaymentOverviewModal({ target, onClose, onPayAgain }) {
  const [history, setHistory] = useState(target.payments || []);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

  const handleOpenAttachment = async (item) => {
    let url = item?.url || item?.attachment;
    if (!url) return;
    setLoadingAttachment(true);
    // If not base64 and not already signed, fetch signed URL from /accounts/signed-url
    if (!url.startsWith("data:") && !url.includes("X-Amz-Signature") && !url.includes("AWSAccessKeyId")) {
      try {
        const res = await axiosInstance.get("/accounts/signed-url", { params: { url } });
        if (res.data?.success && res.data?.signedUrl) {
          url = res.data.signedUrl;
        }
      } catch (err) {
        console.warn("Could not sign URL on the fly:", err);
      }
    }
    setLoadingAttachment(false);
    setPreviewAttachment({
      url: url,
      name: item?.name || item?.attachment_name || "Payment Receipt / Proof",
    });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!target.sub_job_no || target.sub_job_no.includes("Sub-Jobs")) return;
      setLoadingHistory(true);
      try {
        const res = await axiosInstance.get(`/accounts/payments/${encodeURIComponent(target.sub_job_no)}`);
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.warn("Could not fetch payment history, using cached:", err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [target.sub_job_no]);

  const amt = Number(target.amount || target.amt || 0);
  const paid = Number(target.paid || 0);
  const due = Number(target.outstanding !== undefined ? target.outstanding : (target.due !== undefined ? target.due : Math.max(0, amt - paid)));
  const isPaid = due === 0 && amt > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 26, 46, 0.65)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          width: 780,
          maxWidth: "96vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1.5px solid #0D9488",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#F0FDFA",
            borderBottom: "1.5px solid #99F6E4",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Payment Overview & Receipt
              </div>
              <div style={{ fontSize: 11.5, color: "#115E59", fontWeight: 700, marginTop: 2 }}>
                {target.clientName || target.client} · Sub-Job: <b style={{ fontFamily: "monospace" }}>{target.sub_job_no}</b>
                {target.product ? ` (${target.product})` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#64748B",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Quotation Amt</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2 }}>
                Rs {amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#047857", textTransform: "uppercase" }}>Total Paid</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#059669", fontFamily: "monospace", marginTop: 2 }}>
                Rs {paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ background: due > 0 ? "#FEF2F2" : "#ECFDF5", border: "1px solid " + (due > 0 ? "#FECACA" : "#A7F3D0"), borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: due > 0 ? "#B91C1C" : "#047857", textTransform: "uppercase" }}>
                {due > 0 ? "Outstanding Due" : "Balance Due"}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: due > 0 ? "#EF4444" : "#059669", fontFamily: "monospace", marginTop: 2 }}>
                Rs {due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 10.5,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    background: isPaid ? "#ECFDF5" : paid > 0 ? "#F5F3FF" : "#FFFBEB",
                    color: isPaid ? "#059669" : paid > 0 ? "#8B5CF6" : "#F59E0B",
                    border: "1px solid " + (isPaid ? "#A7F3D0" : paid > 0 ? "#DDD6FE" : "#FDE68A"),
                  }}
                >
                  {isPaid ? "✓ Fully Paid" : paid > 0 ? "Partial Paid" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History List Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#0C1A2E", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              💳 Payment Transactions History ({history.length})
            </div>
            {loadingHistory && (
              <span style={{ fontSize: 11, color: "#0D9488", fontWeight: 700 }}>
                Loading live history...
              </span>
            )}
          </div>

          {/* Table */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden", background: "white" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#0C1A2E", color: "white" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>#</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>DATE</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>MODE</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>REFERENCE / UTR</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontWeight: 800 }}>AMOUNT (RS)</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 800 }}>RECEIPTS / PROOFS</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>RECORDED BY</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((tx, i) => {
                    const txDate = tx.payment_date || tx.createdAt ? new Date(tx.payment_date || tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                    return (
                      <tr key={tx._id || i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "8px 10px", color: "#64748B", fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: "8px 10px", color: "#0C1A2E", fontWeight: 700 }}>{txDate}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ background: "#F1F5F9", color: "#334155", padding: "2px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>
                            {tx.payment_mode || "Bank Transfer"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#0D9488", fontWeight: 700 }}>
                          {tx.reference_no || "—"}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#059669" }}>
                          Rs {Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          {(() => {
                            const rawAttList = Array.isArray(tx.attachments) && tx.attachments.length > 0
                              ? tx.attachments
                              : (tx.attachment ? [{ url: tx.attachment, name: tx.attachment_name || "Receipt Proof" }] : []);

                            // Deduplicate proofs by clean URL or filename to prevent duplicate display
                            const seenProofs = new Set();
                            const attList = [];
                            for (const att of rawAttList) {
                              const rawUrl = att?.url || att?.attachment || (typeof att === "string" ? att : "");
                              const cleanKey = rawUrl ? rawUrl.split("?")[0].split("/").pop() : (att?.name || JSON.stringify(att));
                              if (cleanKey && !seenProofs.has(cleanKey)) {
                                seenProofs.add(cleanKey);
                                attList.push(att);
                              } else if (!cleanKey) {
                                attList.push(att);
                              }
                            }

                            if (attList.length === 0) {
                              return <span style={{ color: "#94A3B8", fontSize: 11 }}>—</span>;
                            }

                            return (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                                {attList.map((att, attIdx) => (
                                  <button
                                    key={attIdx}
                                    type="button"
                                    onClick={() => handleOpenAttachment(att)}
                                    disabled={loadingAttachment}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      padding: "3px 8px",
                                      borderRadius: 5,
                                      background: "#F0FDFA",
                                      border: "1px solid #99F6E4",
                                      color: "#0D9488",
                                      fontSize: 11,
                                      fontWeight: 800,
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                    }}
                                    title={att.name || `View Receipt ${attIdx + 1}`}
                                  >
                                    📎 {attList.length === 1 ? "View Proof" : `Proof ${attIdx + 1}`}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 11, color: "#334155", fontWeight: 700 }}>
                          {tx.created_by_name || tx.created_by?.name || tx.created_by?.username ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F1F5F9", padding: "2px 7px", borderRadius: 4, color: "#1E293B", fontSize: 11, fontWeight: 700 }}>
                              👤 {tx.created_by_name || tx.created_by?.name || tx.created_by?.username}
                            </span>
                          ) : (
                            <span style={{ color: "#94A3B8" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#64748B", fontSize: 11 }}>
                          {tx.notes || "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "#64748B" }}>
                      {paid > 0 ? (
                        <span>
                          Payment of <b>Rs {paid.toLocaleString("en-IN")}</b> recorded. Detailed transaction receipt will appear on next entry.
                        </span>
                      ) : (
                        <span>No payments recorded yet for this sub-job.</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0" }}>
                  <td colSpan={4} style={{ padding: "8px 10px", fontWeight: 900, fontSize: 11.5, color: "#0C1A2E" }}>
                    TOTAL PAID RECORDED
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#059669", fontSize: 12.5 }}>
                    Rs {paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn bs"
            style={{ background: "white", borderColor: "#CBD5E1", color: "#0F766E", display: "flex", alignItems: "center", gap: 6 }}
            onClick={handlePrint}
          >
            🖨️ Print Overview / Receipt
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {due > 0 && typeof onPayAgain === "function" && (
              <button
                type="button"
                className="btn bs bg"
                style={{ fontSize: 11.5, padding: "6px 14px" }}
                onClick={() => {
                  onClose();
                  onPayAgain(target);
                }}
              >
                💳 Pay Remaining (Rs {Math.round(due).toLocaleString("en-IN")})
              </button>
            )}
            <button
              type="button"
              className="btn bs"
              style={{ background: "#0C1A2E", color: "white", borderColor: "#0C1A2E" }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Lightbox Preview Modal */}
      {previewAttachment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "none",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewAttachment(null);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              width: 780,
              maxWidth: "96vw",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              border: "1px solid #CBD5E1",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                background: "#0C1A2E",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 18 }}>🧾</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {previewAttachment.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ↗ Open in New Window
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: 20,
                    fontWeight: 900,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                flex: 1,
                overflowY: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#F8FAFC",
                minHeight: 350,
              }}
            >
              {previewAttachment.url.toLowerCase().includes(".pdf") ||
                previewAttachment.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewAttachment.url}
                  title="Receipt PDF Preview"
                  style={{
                    width: "100%",
                    height: "68vh",
                    border: "1px solid #CBD5E1",
                    borderRadius: 8,
                    background: "white",
                  }}
                />
              ) : (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "72vh",
                    objectFit: "contain",
                    borderRadius: 8,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    border: "1px solid #E2E8F0",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
