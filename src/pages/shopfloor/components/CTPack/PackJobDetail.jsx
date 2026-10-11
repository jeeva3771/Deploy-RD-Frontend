import React, { useState } from 'react';
import { QCReceivePanel } from './QCReceivePanel';
import { PmatPanel } from './PmatPanel';
import { InstructionsPanel } from './InstructionsPanel';
import { ProcessingPanel } from './ProcessingPanel';
import { PhysicalPackingPanel } from './PhysicalPackingPanel';
import { ChallanPanel } from './ChallanPanel';
import { LogisticsPanel } from './LogisticsPanel';
import { CompletedJobOverview } from './CompletedJobOverview';
import { stageInfo, stageIndex, PACK_STAGES, getTargetPackQty } from './constants';

export function PackJobDetail({ job, onBack, onUpdate, onLog }) {
  const si = stageInfo(job.stage);
  const isFullyDispatched = (job.deliveredQty || 0) >= (job.qty || 0) && (job.qty || 0) > 0;

  let initialSection = job.stage;
  if (initialSection === "complete" && !isFullyDispatched) {
    initialSection = "logistics";
  }
  const [activeSection, setActiveSection] = useState(initialSection);
  const [showQCModal, setShowQCModal] = useState(false);

  if (isFullyDispatched || job.status === "Complete") {
    return <CompletedJobOverview job={job} onBack={onBack} onLog={onLog} />;
  }

  // Fixes: completing a step now auto-advances the visible panel to the next
  // step (job.stage AND activeSection move together). Backward navigation is disabled.
  async function advance(toStage, logMsg, extraPatch = {}) {
    const targetQty = getTargetPackQty(job);
    const qcAccepted = (extraPatch.qcAcceptedQty !== undefined 
      ? Number(extraPatch.qcAcceptedQty) 
      : ((Number(job.qcAcceptedQty) || 0) + (Number(extraPatch.incrementQc) || 0)));

    // Must inward at least 1 qty from QC in Receive QC stage before allowing next stage
    if (stageIndex(toStage) > stageIndex("qc_pending") && qcAccepted <= 0) {
      const { toast } = await import("react-toastify");
      toast.error("Cannot proceed to next stage. Please inward at least 1 qty from QC in Step 1 (Receive QC) first.");
      return false;
    }

    // Must inward at least 1 qty of packing material before allowing next stage (Instructions & Files)
    if (stageIndex(toStage) > stageIndex("pmat_pending")) {
      const isLabourOrService = (name) => {
        if (!name) return false;
        const n = String(name).toLowerCase();
        return n.includes('labour') || n.includes('labor') || n.includes('charge') || n.includes('freight');
      };
      const pmatItems = (extraPatch.pmatItems || job.pmatItems || []).filter(p => !isLabourOrService(p.name || p.itemType));
      const hasPmatInwarded = pmatItems.length === 0 || pmatItems.some(p => (p.receivedQty || 0) > 0);
      if (!hasPmatInwarded) {
        const { toast } = await import("react-toastify");
        toast.error("Cannot proceed to next stage. Please inward at least 1 qty of packing material in Step 2 (Packing Material) first.");
        return false;
      }
    }



    if (stageIndex(toStage) >= stageIndex("processing") && qcAccepted <= 0) {
      const { toast } = await import("react-toastify");
      toast.error("Cannot proceed to File Processing & Label Generation. Please inward at least 1 qty from QC in Step 1 first.");
      return false;
    }

    if (stageIndex(toStage) >= stageIndex("processing")) {
      const dests = extraPatch.destinations || job.destinations || [];
      if (!dests || dests.length === 0) {
        const { toast } = await import("react-toastify");
        toast.error("Destination details are missing. Please complete Step 3 instructions.");
        return false;
      }
      for (let i = 0; i < dests.length; i++) {
        const d = dests[i];
        if (!d.contact_person || !String(d.contact_person).trim()) {
          const { toast } = await import("react-toastify");
          toast.error(`Cannot proceed to next step. Contact Person is missing for destination #${i + 1}.`);
          return false;
        }
        if (!d.contact_number || String(d.contact_number).trim().length !== 10) {
          const { toast } = await import("react-toastify");
          toast.error(`Cannot proceed to next step. Valid 10-digit Contact Number is required for destination #${i + 1}.`);
          return false;
        }
      }
    }

    // Check Shipping Labels generated and saved for stage >= packing
    if (stageIndex(toStage) >= stageIndex("packing")) {
      const labelsDone = Boolean(job.labelsGenerated);
      if (!labelsDone) {
        const { toast } = await import("react-toastify");
        toast.error("Cannot proceed to Physical Packing. Shipping Labels must be generated and saved (Save & Generate PDF) in Step 5 first.");
        return false;
      }
    }

    const nextHighestStage = stageIndex(job.stage) > stageIndex(toStage) ? job.stage : toStage;
    const patch = { stage: nextHighestStage, expectedStage: job.stage, ...extraPatch };
    const logsToPush = [];
    if (patch.newLog) {
      if (Array.isArray(patch.newLog)) logsToPush.push(...patch.newLog);
      else logsToPush.push(patch.newLog);
      delete patch.newLog;
    }
    if (logMsg) {
      logsToPush.push({ msg: logMsg, dt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) });
    }
    if (logsToPush.length === 1) {
      patch.newLog = logsToPush[0];
    } else if (logsToPush.length > 1) {
      patch.newLog = logsToPush;
    }

    const success = await onUpdate(patch);
    if (success !== false) {
      setActiveSection(toStage);
      return true;
    }
    return false;
  }

  return (
    <div className="rdpk">
      <div className="rdpk-banner">
        <div className="rdpk-banner-left">
          <button style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 800, cursor: "pointer", color: "#475569", textTransform: "uppercase" }} onClick={onBack}>← Back to Jobs</button>
          <div>
            <div className="rdpk-title-row" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: 29, fontWeight: 900, fontStyle: "italic", color: "#0C1A2E", fontFamily: "monospace" }}>{job.id}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0D9488", textTransform: "uppercase" }}>{job.client}</span>
              <span style={{ background: si.bg, color: si.color, border: `1px solid ${si.border}`, borderRadius: 8, padding: "2px 9px", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{si.icon} {si.label}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginTop: 1 }}>
              {job.product} · Order Qty: {job.qty} pcs
              {job.qc_bad_qty > 0 && (
                <span style={{ color: "#DC2626", marginLeft: 8, fontWeight: 800, background: "#FEF2F2", border: "1px solid #FECACA", padding: "1px 6px", borderRadius: 4 }}>
                  (QC Rejected: {job.qc_bad_qty} pcs · Net Good: {job.qty - job.qc_bad_qty} pcs)
                </span>
              )}
              {job.invoiceNo && ` · ${job.invoiceNo}`}
            </div>
          </div>
        </div>
        <div className="rdpk-ministages">
          {PACK_STAGES.map((s, i) => {
            const isCurrent = stageIndex(job.stage) === i;
            const hasQcInwarded = (job.qcAcceptedQty || 0) > 0;
            const isLabourOrService = (name) => {
              if (!name) return false;
              const n = String(name).toLowerCase();
              return n.includes('labour') || n.includes('labor') || n.includes('charge') || n.includes('freight');
            };
            const pmatItems = (job.pmatItems || []).filter(p => !isLabourOrService(p.name || p.itemType));
            const hasPmatInwarded = pmatItems.length === 0 || pmatItems.some(p => (p.receivedQty || 0) > 0);

            const pmatStageIdx = stageIndex("pmat_pending");
            const isAccessible = (i === 0) 
              ? true 
              : (i <= pmatStageIdx) 
                ? (hasQcInwarded && stageIndex(job.stage) >= i)
                : (hasQcInwarded && hasPmatInwarded && stageIndex(job.stage) >= i);

            const isActive = activeSection === s.id;
            return (
              <div key={s.id} 
                title={!hasQcInwarded && i > 0 ? "Inward at least 1 qty from QC in Step 1 first" : !hasPmatInwarded && i > pmatStageIdx ? "Inward at least 1 qty of packing material in Step 2 first" : s.label} 
                onClick={async () => {
                  if (!hasQcInwarded && i > 0) {
                    const { toast } = await import("react-toastify");
                    toast.error("Please inward at least 1 qty from QC in Step 1 (Receive QC) first.");
                    return;
                  }
                  if (!hasPmatInwarded && i > pmatStageIdx) {
                    const { toast } = await import("react-toastify");
                    toast.error("Please inward at least 1 qty of packing material in Step 2 (Packing Material) first.");
                    return;
                  }
                  if (isAccessible) setActiveSection(s.id);
                }}
                style={{
                  width: stageIndex(job.stage) >= i ? 18 : 14, height: stageIndex(job.stage) >= i ? 18 : 14, flexShrink: 0,
                  borderRadius: "50%", background: stageIndex(job.stage) > i ? s.color : isCurrent ? s.color : "#E2E8F0",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: stageIndex(job.stage) >= i ? 9 : 7,
                  transition: "all 0.2s", cursor: isAccessible ? "pointer" : "not-allowed", border: isActive ? `2px solid #0F172A` : isCurrent ? `2px solid ${s.color}` : "none",
                }}>
                {stageIndex(job.stage) > i ? "✓" : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rdpk-detail-grid">
        <div>
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: "#0C1A2E", padding: "10px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 2 }}>Stages</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{job.product}</div>
            </div>
            {PACK_STAGES.map((s, i) => {
              const done = stageIndex(job.stage) > i;
              const active = activeSection === s.id;
              const hasQcInwarded = (job.qcAcceptedQty || 0) > 0;
              const isLabourOrService = (name) => {
                if (!name) return false;
                const n = String(name).toLowerCase();
                return n.includes('labour') || n.includes('labor') || n.includes('charge') || n.includes('freight');
              };
              const pmatItems = (job.pmatItems || []).filter(p => !isLabourOrService(p.name || p.itemType));
              const hasPmatInwarded = pmatItems.length === 0 || pmatItems.some(p => (p.receivedQty || 0) > 0);

              const pmatStageIdx = stageIndex("pmat_pending");
              const isAccessible = (i === 0) 
                ? true 
                : (i <= pmatStageIdx) 
                  ? (hasQcInwarded && stageIndex(job.stage) >= i)
                  : (hasQcInwarded && hasPmatInwarded && stageIndex(job.stage) >= i);

              return (
                <div key={s.id} 
                  title={!hasQcInwarded && i > 0 ? "Inward at least 1 qty from QC in Step 1 first" : !hasPmatInwarded && i > pmatStageIdx ? "Inward at least 1 qty of packing material in Step 2 first" : isAccessible ? `Open ${s.label}` : "Complete previous steps first"}
                  onClick={async () => {
                    if (!hasQcInwarded && i > 0) {
                      const { toast } = await import("react-toastify");
                      toast.error("Please inward at least 1 qty from QC in Step 1 (Receive QC) first.");
                      return;
                    }
                    if (!hasPmatInwarded && i > pmatStageIdx) {
                      const { toast } = await import("react-toastify");
                      toast.error("Please inward at least 1 qty of packing material in Step 2 (Packing Material) first.");
                      return;
                    }
                    if (isAccessible) setActiveSection(s.id);
                  }}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 10, 
                    padding: "9px 12px", 
                    borderBottom: "1px solid #F8FAFC", 
                    background: active ? s.bg : "white", 
                    cursor: isAccessible ? "pointer" : "not-allowed", 
                    opacity: isAccessible ? 1 : 0.4, 
                    borderLeft: active ? `3px solid ${s.color}` : "3px solid transparent", 
                    transition: "all 0.15s ease" 
                  }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? s.color : active ? s.bg : "#F1F5F9", border: `1.5px solid ${done || active ? s.color : "#E2E8F0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {done ? <span style={{ color: "white", fontSize: 14 }}>✓</span> : <span>{s.icon}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: done || active ? 800 : 700, color: done || active ? s.color : "#64748B", textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {job.logs.length > 0 && (
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, marginTop: 10, overflow: "hidden" }}>
              <div style={{ background: "#F8FAFC", padding: "7px 12px", borderBottom: "1px solid #E2E8F0", fontSize: 12, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px" }}>Activity Log</div>
              <div style={{ maxHeight: 280, overflowY: "auto", padding: "6px 12px" }} className="scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                {[...job.logs].reverse().map((l, i) => {
                  const dtStr = l.dt || (l.date ? (() => {
                    try {
                      return new Date(l.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
                    } catch (e) {
                      return String(l.date);
                    }
                  })() : "-");

                  const msgStr = l.msg || l.remarks || l.details || (
                    [
                      l.type || l.action,
                      l.qty !== undefined ? `${l.qty} pcs` : null,
                      l.good !== undefined ? `Good: ${l.good}` : null,
                      l.bad !== undefined ? `Bad: ${l.bad}` : null,
                      l.by || l.user?.name ? `by ${l.by || l.user?.name}` : null
                    ].filter(Boolean).join(" — ")
                  ) || "System Update";

                  return (
                    <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0", borderBottom: "1px solid #F8FAFC", fontSize: 12, fontWeight: 600 }}>
                      <span style={{ color: "#94A3B8", flexShrink: 0 }}>{dtStr}</span>
                      <span style={{ color: "#475569", wordBreak: "break-word", overflowWrap: "anywhere" }}>{msgStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {/* Warning Banner when target packing quantity is not yet inwarded */}
            {(() => {
              const targetQty = getTargetPackQty(job);
              const qcAccepted = job.qcAcceptedQty || 0;
              const pendingInward = (job.fgReceivedQty || 0) - qcAccepted;
              if (qcAccepted < targetQty && activeSection !== "qc_pending" && stageIndex(activeSection) <= stageIndex("instructions")) {
                return (
                  <div style={{ background: "#FEF9C3", border: "1.5px solid #FDE047", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, flexGrow: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#713F12", display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>⚠️</span>
                      {pendingInward > 0 ? (
                        <span>Pending QC Inward: <b>{pendingInward} pcs</b> handed over by QC waiting to be inwarded into Packing. (Inwarded: {qcAccepted} / {targetQty} pcs)</span>
                      ) : !job.qc_completed ? (
                        <span>QC Audit In Progress: <b>{qcAccepted} of {targetQty} pcs</b> inwarded. Full order quantity ({targetQty} pcs) must be audited &amp; completed in QC before moving to File Processing &amp; Label Generation.</span>
                      ) : (
                        <span>Partial Order Inward: <b>{qcAccepted} of {targetQty} pcs</b> inwarded. Full QC-passed quantity ({targetQty} pcs) must be inwarded before moving to File Processing &amp; Label Generation.</span>
                      )}
                    </div>
                    {pendingInward > 0 && (
                      <button
                        onClick={() => setShowQCModal(true)}
                        style={{ background: "white", color: "#D97706", border: "1.5px solid #FDE047", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer", textTransform: "uppercase" }}
                      >
                        Inward QC Balance
                      </button>
                    )}
                  </div>
                );
              }
              return <div />;
            })()}

            {["instructions"].includes(activeSection) && (
              <div style={{ flexShrink: 0, marginTop: ((job.fgReceivedQty || job.qty) - (job.qcAcceptedQty || 0)) > 0 && activeSection !== "qc_pending" && stageIndex(activeSection) <= stageIndex("instructions") ? 4 : 0 }}>
                <PmatPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} isWidget={true} />
              </div>
            )}
          </div>

          {activeSection === "qc_pending" && (
            <QCReceivePanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
          {activeSection === "pmat_pending" && (
            <PmatPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
          {activeSection === "instructions" && (
            <InstructionsPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
          {activeSection === "processing" && (
            <ProcessingPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
          {activeSection === "packing" && (
            <PhysicalPackingPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
          {activeSection === "challan" && (
            <ChallanPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
          {(activeSection === "logistics" || activeSection === "complete") && (
            <LogisticsPanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} />
          )}
        </div>
      </div>

      {showQCModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "transparent", borderRadius: 12, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ position: "absolute", top: 12, right: 12, cursor: "pointer", fontSize: 20, color: "#64748B", zIndex: 10, background: "white", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }} onClick={() => setShowQCModal(false)}>✕</div>
            <div style={{ padding: 10 }}>
              <QCReceivePanel job={job} onUpdate={onUpdate} onLog={onLog} advance={advance} onComplete={() => setShowQCModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
