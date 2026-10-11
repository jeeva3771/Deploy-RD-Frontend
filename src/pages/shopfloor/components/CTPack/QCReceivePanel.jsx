import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { nowStamp } from './constants';

export function QCReceivePanel({ job, onUpdate, onLog, advance, onComplete }) {
  const { users = [] } = useSelector((state) => state.user || {});

  // Filter for packing department (or fallback to all if none found)
  const packingUsers = users.filter(u => {
    if (!u.is_active) return false;
    const dept = (u.department_id?.name || u.departmentName || u.department || "").toLowerCase();
    return dept.includes("pack");
  });
  const displayUsers = packingUsers.length > 0 ? packingUsers : users;

  const remainingQty = (job.fgReceivedQty || 0) - (job.qcAcceptedQty || 0);
  const isFullyReceived = remainingQty <= 0;

  const [showForm, setShowForm] = useState(true);
  const [qty, setQty] = useState("");
  const [by, setBy] = useState(job.qcAcceptedBy || (displayUsers[0]?.name || ""));
  const [note, setNote] = useState(job.qcNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (job.qcAcceptedBy && !by) {
      setBy(job.qcAcceptedBy);
    }
  }, [job.qcAcceptedBy, by]);


  async function submit() {
    if (isSubmitting) return;
    const q = parseInt(qty) || 0;
    if (q <= 0 || !by || q > remainingQty) return;

    setIsSubmitting(true);
    const newTotal = (job.qcAcceptedQty || 0) + q;
    const patch = {
      incrementQc: q,
      qcAcceptedQty: newTotal,
      qcAcceptedBy: by,
      qcAcceptedDt: nowStamp(),
      qcNote: note,
      qcPartial: newTotal < job.qty,
    };

    const logMsg = `📦 QC receipt: ${q} pcs accepted by ${by}${note ? " — " + note : ""}`;

    if (job.stage === "qc_pending") {
      const success = await advance("pmat_pending", logMsg, patch);
      setIsSubmitting(false);
      if (success !== false) {
        setQty("");
        setNote("");
        if (onComplete) onComplete();
      }
      return;
    }

    const success = await onUpdate({
      ...patch,
      newLog: logMsg
    });
    setIsSubmitting(false);
    if (success !== false) {
      setQty("");
      setNote("");
      if (onComplete) onComplete();
    }
  }

  return (
    <PCard title="Step 1 — Receive From QC" icon="📦" color="#F59E0B" bg="#FFFBEB">
      {/* QC Rejection & Passed Breakdown Banner */}
      {(job.qc_bad_qty > 0 || job.qc_good_qty > 0) && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#991B1B", textTransform: "uppercase" }}>
            🔍 QC Inspection Audit Breakdown
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 12, fontWeight: 800 }}>
            <span style={{ color: "#166534", background: "#DCFCE7", border: "1px solid #86EFAC", padding: "2px 8px", borderRadius: 6 }}>
              ✓ Passed: {job.qc_good_qty || (job.qty - (job.qc_bad_qty || 0))} pcs
            </span>
            {job.qc_bad_qty > 0 && (
              <span style={{ color: "#991B1B", background: "#FEE2E2", border: "1px solid #FCA5A5", padding: "2px 8px", borderRadius: 6 }}>
                ✕ QC Rejected: {job.qc_bad_qty} pcs
              </span>
            )}
          </div>
        </div>
      )}

      <div className="rdpk-grid-4" style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "9px 12px", marginBottom: 14 }}>
        {[
          { l: "Order Qty", v: job.qty + " pcs", c: "#92400E" },
          { l: "Packing Inward", v: (job.qcAcceptedQty || 0) + " pcs", c: "#059669" },
          { l: "Balance to Inward", v: remainingQty + " pcs", c: "#D97706" },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Accepted Summary Card */}
      {(job.qcAcceptedQty || 0) > 0 && (
        <div style={{ background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 26 }}>✅</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#059669" }}>
                  FG Inwarded — {job.qcAcceptedQty} pcs
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#047857", marginTop: 2 }}>
                  {job.qcPartial ? `Partial Receipt (${remainingQty} pcs balance remaining)` : "Fully received from QC"}
                </div>
              </div>
            </div>
            {job.stage === "qc_pending" && (
              <PBtn sm onClick={() => advance("pmat_pending", "→ Proceeding to Packing Material", { qcAcceptedQty: job.qcAcceptedQty })} color="#059669" bg="#ECFDF5" border="#6EE7B7">
                Proceed to Packing Material →
              </PBtn>
            )}
          </div>
        </div>
      )}

      {/* Inward Form - Available when remainingQty > 0 */}
      {!isFullyReceived ? (
        <div style={{ marginTop: 10, background: "#FFFDF7", border: "1px solid #FDE68A", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#92400E", textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{(job.qcAcceptedQty || 0) > 0 ? `+ Inward Balance (${remainingQty} pcs remaining)` : "Inward Goods from QC"}</span>
            <span style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>Pending: {remainingQty} pcs</span>
          </div>

          <div className="rdpk-grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                Qty Accepted <span style={{ color: "#94A3B8", fontWeight: 500 }}>(Max: {remainingQty})</span>
              </div>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Enter qty" min="1" max={remainingQty}
                style={{ width: "100%", border: `1.5px solid ${parseInt(qty) > remainingQty || parseInt(qty) <= 0 ? '#EF4444' : '#E2E8F0'}`, borderRadius: 8, padding: 10, fontSize: 32, fontWeight: 900, textAlign: "center", color: parseInt(qty) > remainingQty || parseInt(qty) <= 0 ? '#EF4444' : '#0C1A2E', outline: "none", fontFamily: "monospace" }} />
              {parseInt(qty) > remainingQty && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>Cannot exceed {remainingQty}</div>}
              {parseInt(qty) <= 0 && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>Quantity must be at least 1</div>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>Received By</div>
              <select value={by} onChange={(e) => setBy(e.target.value)}
                style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 10, fontSize: 16, fontWeight: 700, color: "#0C1A2E", outline: "none", background: "white" }}>
                <option value="" disabled>Select Operator</option>
                {displayUsers.length > 0 ? (
                  displayUsers.map(u => (
                    <option key={u._id || u.id} value={u.name || u.firstName}>
                      {u.name || u.firstName} {u.lastName || ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Operator 1">Operator 1</option>
                    <option value="Operator 2">Operator 2</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (condition, batch details, partial reason…)"
            style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 9, fontSize: 15, marginBottom: 10, outline: "none", color: "#475569" }} />
          {parseInt(qty) > 0 && parseInt(qty) < remainingQty && (
            <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 8, padding: "7px 10px", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#713F12" }}>
              ⚠ Partial QC pass: {qty} of {remainingQty} pcs — remaining {remainingQty - parseInt(qty)} pcs to follow
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {(job.qcAcceptedQty || 0) > 0 && onComplete && (
              <PBtn sm color="#64748B" bg="#F1F5F9" border="#E2E8F0" onClick={onComplete} full>Cancel</PBtn>
            )}
            <PBtn onClick={submit} disabled={isSubmitting || !qty || !by || parseInt(qty) > remainingQty || parseInt(qty) <= 0} full color="#F59E0B" bg="#FFFBEB" border="#FDE68A">
              {isSubmitting ? "Processing..." : (job.stage === "qc_pending" ? "✓ Confirm & Proceed to Packing Material →" : "✓ Confirm Inward Balance")}
            </PBtn>
          </div>
        </div>
      ) : (
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 10, padding: 14, textAlign: "center", color: "#64748B", fontSize: 14, fontWeight: 700 }}>
          ✓ All {job.qty} pcs have been fully received into Packing.
        </div>
      )}
    </PCard>
  );
}
