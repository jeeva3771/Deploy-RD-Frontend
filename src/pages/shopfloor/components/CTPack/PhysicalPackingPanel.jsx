import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { nowStamp, stageIndex } from './constants';

export function PhysicalPackingPanel({ job, onUpdate, onLog, advance }) {
  const [packedBy, setPackedBy] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { users = [] } = useSelector((state) => state.user || {});

  const packers = users.filter(u => {
    if (!u.is_active) return false;
    const dept = (u.department_id?.name || u.departmentName || u.department || "").toLowerCase();
    return dept.includes("pack");
  });

  async function confirm() {
    if (isSubmitting || !packedBy) return;
    setIsSubmitting(true);
    const now = nowStamp();
    const patch = { packedBy, packingDt: now, boxCount: Number(boxCount) || 0, packingNote: note };

    const success = await advance("logistics", "→ Physical packing complete — ready for Courier / Dispatch", patch);
    if (success) {
      onLog(`📫 Physical packing complete — ${boxCount || 0} boxes · by ${packedBy}`);
    }
    setTimeout(() => setIsSubmitting(false), 400);
  }
  return (
    <PCard title="Step 6 — Physical Packing In Progress" icon="📫" color="#EC4899" bg="#FDF2F8">
      {/* Previous Packing History */}
      {(() => {
        const packingLogs = (job.logs || []).filter(l => {
          const m = String(l.msg || l.remarks || l.details || "");
          return m.includes("Physical packing complete") && !m.includes("ready for Courier");
        });

        if (packingLogs.length > 0) {
          return (
            <div style={{ marginBottom: 16, borderBottom: "1.5px dashed #F9A8D4", paddingBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#BE185D", marginBottom: 10, textTransform: "uppercase" }}>
                🕒 Previous Packing History
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...packingLogs].reverse().map((log, idx) => {
                  const dtStr = log.dt || (log.date ? new Date(log.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }) : "-");
                  const msgStr = log.msg || log.remarks || log.details || "";
                  return (
                    <div key={idx} style={{ background: "white", border: "1px solid #FBCFE8", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#9D174D" }}>{msgStr.replace("📫 ", "")}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#F472B6", flexShrink: 0, textAlign: "right" }}>{dtStr}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="rdpk-grid-2" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Packed By <span style={{ color: "#EF4444" }}>*</span></div>
          <select value={packedBy} onChange={(e) => setPackedBy(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 9, fontSize: 16, outline: "none", color: "#0C1A2E", background: "white" }}>
            <option value="" disabled>Select Operator</option>
            {packers.map(user => (
              <option key={user.id || user._id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>No. of Boxes / Parcels <span style={{ color: "#EF4444" }}>*</span></div>
          <input type="text" inputMode="numeric" value={boxCount} onChange={(e) => {
            let val = e.target.value.replace(/\D/g, '');
            val = val.replace(/^0+/, '');
            setBoxCount(val);
          }} placeholder="0"
            style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 9, fontSize: 32, fontWeight: 900, textAlign: "center", outline: "none", fontFamily: "monospace", color: "#0C1A2E" }} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Packing Note</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fragile items noted, special boxes used, extra padding…"
          style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 8, fontSize: 18, outline: "none", color: "#0C1A2E" }} />
      </div>
      <PBtn onClick={confirm} disabled={isSubmitting || !packedBy || Number(boxCount) <= 0} full color="#EC4899" bg="#FDF2F8" border="#F9A8D4">
        {isSubmitting ? "Processing..." : "✓ Packing Complete — Proceed to Dispatch"}
      </PBtn>
    </PCard>
  );
}
