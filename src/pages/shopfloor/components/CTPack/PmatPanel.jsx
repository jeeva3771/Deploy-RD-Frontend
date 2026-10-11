import React, { useState } from 'react';
import { PBtn } from './PBtn';
import { PCard } from './PCard';

export function PmatPanel({ job, onUpdate, onLog, advance, isWidget }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selItem, setSelItem] = useState("");
  const [inwardQty, setInwardQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Items needing inward or store issue attention (excluding non-material/labour entries)
  const isLabourOrService = (name) => {
    if (!name) return false;
    const n = String(name).toLowerCase();
    return n.includes('labour') || n.includes('labor') || n.includes('charge') || n.includes('freight');
  };

  const pmatList = (job.pmatItems || []).filter(p => !isLabourOrService(p.name || p.itemType));
  const pendingInwardItems = pmatList.filter((p) => (p.issued_qty || 0) > 0 && (p.receivedQty || 0) < (p.issued_qty || 0));
  const incompleteItems = pmatList.filter((p) => (p.receivedQty || 0) < (p.qty || p.total_qty || 0));
  const anyReceived = pmatList.some((p) => (p.receivedQty || 0) > 0);

  function openModal() {
    if (incompleteItems.length === 0) {
      import("react-toastify").then(({ toast }) => {
        toast.info("All packing materials for this job have been fully received!");
      });
      return;
    }
    const initialSel = pendingInwardItems[0]?.id || incompleteItems[0]?.id || "";
    setSelItem(initialSel);
    setInwardQty("");
    setModalOpen(true);
  }

  async function submitInward() {
    if (isSubmitting) return;
    const qtyNum = parseInt(inwardQty) || 0;
    const currentItem = pmatList.find(p => p.id === selItem);
    const targetQty = currentItem?.issued_qty || 0;
    const currentReceived = currentItem?.receivedQty || 0;

    if (!selItem || qtyNum <= 0 || targetQty <= 0 || (qtyNum + currentReceived > targetQty)) return;

    setIsSubmitting(true);
    const updated = pmatList.map((p) => {
      if (p.id !== selItem) return p;
      const itemTarget = p.issued_qty || 0;
      const newQty = currentReceived + qtyNum;
      return { ...p, receivedQty: newQty, received: newQty >= itemTarget && newQty > 0 };
    });
    const item = updated.find((p) => p.id === selItem);
    const itemTarget = item?.issued_qty || 0;

    const success = await onUpdate({ pmatItems: updated });
    if (success !== false) {
      onLog(`🗃 Material inward: ${item.name} +${qtyNum} (${item.receivedQty}/${itemTarget} ${item.unit})`);
    }

    setTimeout(() => {
      setModalOpen(false);
      setIsSubmitting(false);
    }, 400);
  }

  function proceedToInstructions() {
    if (!anyReceived && pmatList.length > 0) {
      import("react-toastify").then(({ toast }) => {
        toast.error("Please inward at least 1 qty of packing material in Step 2 first.");
      });
      return;
    }
    advance("instructions", "→ Moved to Instructions & Files stage");
  }

  const modalComponent = modalOpen ? (
    <div onClick={() => setModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: 18, width: "100%", maxWidth: 380, border: "1.5px solid #C7D2FE" }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#6366F1", textTransform: "uppercase", marginBottom: 12 }}>🗃 Inward Material</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Select Material</div>
          <select value={selItem} onChange={(e) => setSelItem(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 9, fontSize: 16, outline: "none", color: "#0C1A2E", background: "white" }}>
            {incompleteItems.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({(p.receivedQty || 0)}/{(p.issued_qty || 0)} {p.unit})</option>
            ))}
          </select>
          {selItem && (() => {
            const selectedP = pmatList.find(p => p.id === selItem);
            if (!selectedP) return null;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                {/* <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Order Qty</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{selectedP.qty} <span style={{ fontSize: 11, color: '#94A3B8' }}>{selectedP.unit}</span></div>
                </div> */}
                <div style={{ background: (selectedP.issued_qty || 0) === 0 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${(selectedP.issued_qty || 0) === 0 ? '#FECACA' : '#FDE68A'}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: (selectedP.issued_qty || 0) === 0 ? '#DC2626' : '#D97706', textTransform: 'uppercase' }}>Store Issued</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: (selectedP.issued_qty || 0) === 0 ? '#991B1B' : '#B45309', marginTop: 2 }}>{selectedP.issued_qty || 0} <span style={{ fontSize: 11, color: (selectedP.issued_qty || 0) === 0 ? '#FCA5A5' : '#FCD34D' }}>{selectedP.unit}</span></div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>Received Qty</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#15803D', marginTop: 2 }}>{selectedP.receivedQty || 0} <span style={{ fontSize: 11, color: '#86EFAC' }}>{selectedP.unit}</span></div>
                </div>
              </div>
            );
          })()}
        </div>

        {(() => {
          const selectedP = pmatList.find(p => p.id === selItem);
          const storeIssued = selectedP?.issued_qty || 0;
          const remaining = selectedP ? Math.max(0, storeIssued - (selectedP.receivedQty || 0)) : 0;
          const isOver = parseInt(inwardQty) > remaining;

          return (
            <>
              {storeIssued === 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 12, lineHeight: 1.4 }}>
                  ⚠️ Store Issue Pending: Store has issued 0 nos for this item. Please get the Store department to issue this material before inwarding.
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Inward Qty <span style={{ color: "#94A3B8", fontWeight: 500 }}>(Max: {remaining})</span>
                </div>
                <input type="text" inputMode="numeric" value={inwardQty} onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  val = val.replace(/^0+/, '');
                  setInwardQty(val);
                }} placeholder="0" max={remaining} disabled={storeIssued === 0}
                  style={{ width: "100%", border: `1.5px solid ${isOver ? '#EF4444' : '#E2E8F0'}`, borderRadius: 8, padding: 9, fontSize: 28, fontWeight: 900, textAlign: "center", outline: "none", fontFamily: "monospace", color: isOver ? '#EF4444' : '#0C1A2E', background: storeIssued === 0 ? '#F8FAFC' : 'white' }} />
                {isOver && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>Cannot exceed remaining store issue balance ({remaining})</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <PBtn sm color="#64748B" bg="#F1F5F9" border="#E2E8F0" onClick={() => setModalOpen(false)} full>Cancel</PBtn>
                <PBtn sm color="#6366F1" bg="#EEF2FF" border="#C7D2FE" onClick={submitInward} disabled={isSubmitting || !selItem || !inwardQty || isOver || storeIssued === 0 || remaining <= 0} full>
                  {isSubmitting ? "Processing..." : "✓ Submit"}
                </PBtn>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  ) : null;

  if (isWidget) {
    if (pmatList.length === 0) return null;
    return (
      <>
        <PBtn sm color="#6366F1" bg="#EEF2FF" border="#C7D2FE" onClick={openModal}>+ Packing Material Inward</PBtn>
        {modalComponent}
      </>
    );
  }

  return (
    <PCard title="Step 2 — Packing Material Inward" icon="🗃" color="#6366F1" bg="#EEF2FF">
      <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6366F1" }}>Inward material received from Stores against this job</div>
        <PBtn sm color="#6366F1" bg="#EEF2FF" border="#C7D2FE" onClick={openModal} disabled={incompleteItems.length === 0}>+ Inward Material</PBtn>
      </div>

      {job.pmatItems.map((item) => {
        const rq = item.receivedQty || 0;
        const iq = item.issued_qty || 0;
        const pct = iq > 0 ? Math.min(100, Math.round((rq / iq) * 100)) : 0;
        const status = item.received || (iq > 0 && rq >= iq) ? "Received" : iq === 0 ? "Store Issue Pending" : rq > 0 ? "Partial" : "Pending";
        const statusColor = item.received || (iq > 0 && rq >= iq) ? "#10B981" : iq === 0 ? "#EF4444" : rq > 0 ? "#F59E0B" : "#94A3B8";
        return (
          <div key={item.id} style={{ padding: "10px 12px", background: (item.received || (iq > 0 && rq >= iq)) ? "#F0FDF4" : iq === 0 ? "#FEF2F2" : "white", border: `1.5px solid ${(item.received || (iq > 0 && rq >= iq)) ? "#A7F3D0" : iq === 0 ? "#FECACA" : "#E2E8F0"}`, borderRadius: 10, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: (item.received || (iq > 0 && rq >= iq)) ? "#059669" : iq === 0 ? "#991B1B" : "#0C1A2E" }}>{item.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginTop: 2 }}>Order Qty: {item.qty} {item.unit} &nbsp;&bull;&nbsp; <span style={{ color: iq === 0 ? "#DC2626" : "#D97706", fontWeight: iq === 0 ? 800 : 700 }}>Store Issued: {iq} {item.unit}</span></div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: statusColor }}>{status} — {rq}/{iq} {item.unit}</div>
            </div>
            <div style={{ height: 6, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: statusColor, transition: "width 0.3s" }} />
            </div>
          </div>
        );
      })}

      <div className="rdpk-card-actions">
        <div style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>{job.pmatItems.filter((p) => p.received || ((p.issued_qty || 0) > 0 && (p.receivedQty || 0) >= p.issued_qty)).length} of {job.pmatItems.length} items received</div>
        <PBtn onClick={proceedToInstructions} disabled={!anyReceived} color="#6366F1" bg="#EEF2FF" border="#C7D2FE">→ Proceed to Instructions</PBtn>
      </div>

      {modalComponent}
    </PCard>
  );
}
