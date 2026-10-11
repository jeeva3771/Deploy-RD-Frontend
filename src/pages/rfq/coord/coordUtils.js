// Shared constants & utility functions for Procurement Coordination 

export const COORD_STAGES = ["ESCALATED", "PENDING RACK", "EN ROUTE", "QC CHECK", "STORES INWARD"];

export const STAR_STAGES = new Set(["QC CHECK", "STORES INWARD"]);

export const COORD_CSS = `
  .po-root { font-family: 'Inter', sans-serif; text-transform: uppercase; font-style: italic; font-weight: 900; }
  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .custom-scroll { scrollbar-width: thin; scrollbar-color: #bcbfc2ff #f1f5f9; scroll-behavior: smooth; }
  .side-panel { transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
  .side-panel.open { transform: translateX(0); }
  .kanban-col { min-width: 290px; max-width: 320px; background: #fff; border-radius: 10px; display: flex; flex-direction: column; border: 1px solid #e2e8f0; flex-shrink: 0; }
  @media (min-width: 640px) { .kanban-col { min-width: 320px; } }
  .job-card { background: #f0f7ff; border: 2px solid #3b82f6; border-radius: 24px; padding: 18px; position: relative; transition: all 0.3s ease; cursor: pointer; }
  .job-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,.18); }
  .job-card.selected { border-color: #2563eb; background: #eff6ff; box-shadow: inset 0 2px 6px rgba(37,99,235,.12); }
  .job-card.glow-red-delay { border: 4px solid #ef4444 !important; animation: pulse-red 1.5s infinite; background: #fef2f2 !important; z-index: 10; }
  .eta-pill { background: #1e293b; color: white; border-radius: 16px; padding: 10px 8px; text-align: center; margin-top: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,.3); display: flex; flex-direction: column; gap: 2px; }
  @keyframes pulse-red { 0%, 100% { box-shadow: 0 0 0px #ef4444; } 50% { box-shadow: 0 0 20px #ef4444; } }
  @media print { .no-print { display: none !important; } body { background: white !important; } }
  .vendor-card { min-height: 420px; display: flex; flex-direction: column; }
  .vendor-card-scroll { flex: 1; overflow-y: auto; }
`;

export function fmtDate(d) {
    if (!d) return "—";
    try {
        const date = new Date(d);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    } catch { return "—"; }
}

export function fmtDateTime(d) {
    if (!d) return "—";
    try {
        const dt = new Date(d);
        return dt.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true
        });
    } catch { return "—"; }
}

export function getCountdown(eta) {
    if (!eta) return "NO ETA";
    let target;
    if (eta instanceof Date) {
        target = new Date(eta.getFullYear(), eta.getMonth(), eta.getDate(), 18, 0, 0);
    } else {
        const dateOnly = typeof eta === "string" && eta.includes("T") ? eta.split("T")[0] : String(eta);
        target = new Date(dateOnly + "T18:00:00");
    }
    if (isNaN(target.getTime())) return "INVALID DATE";
    const diff = target - Date.now();
    if (diff < 0) return "OVERDUE";
    const days = Math.floor(diff / 86400000);
    return `${days} Day(s)`;
}

// Maps an award to its workflow stage.
export function mapRfqToCoordStage(award) {
    if (award.coordStage === "ESCALATED") return "PENDING RACK";
    if (award.coordStage) return award.coordStage;
    // Default: all new POs start at PENDING RACK
    return "PENDING RACK";
}


export function stageBadgeClass(stage) {
    switch (stage) {
        case "ESCALATED": return "bg-red-100 text-red-700";
        case "PENDING RACK": return "bg-amber-100 text-amber-700";
        case "EN ROUTE": return "bg-blue-100 text-blue-700";
        case "QC CHECK": return "bg-purple-100 text-purple-700";
        default: return "bg-green-100 text-green-700";
    }
}

/**
 * Parses the ETA UPDATED log note to extract previous and new dates.
 * Backend note format: "userRemark [2026-03-18 → 2026-04-23]"
 * Returns { prevDate: '2026-03-18', newDate: '2026-04-23' } or null.
 */
export function parseEtaMovement(coordLogs = []) {
    // Logs are newest-first ($position: 0), so the latest ETA update is at index 0
    const latestEtaLog = coordLogs.find(l => l.action === "ETA UPDATED");
    if (!latestEtaLog?.note) return null;
    const match = latestEtaLog.note.match(/\[(\d{4}-\d{2}-\d{2}) → (\d{4}-\d{2}-\d{2})\]/);
    if (!match) return null;
    return { prevDate: match[1], newDate: match[2] };
}

/**
 * Determines if a PO is "postponed" (i.e., should appear in ESCALATED).
 *
 * Rules:
 * 1. If the ETA was updated and the new date is EARLIER than before → escalated.
 * 2. If time has passed and ETA has no update log, fall back to "is it overdue today?".
 * 3. Even with ETA updates, if the current ETA date is past today → still escalated.
 *
 * QC CHECK and STORES INWARD are always excluded.
 */
export function isPostponedPO(award, poDeliveryDate) {
    const baseStage = award.coordStage || "PENDING RACK";
    // Terminal stages are never considered escalated once they reach this point
    if (["QC CHECK", "STORES INWARD"].includes(baseStage)) return false;

    const isEdited = !!award.oldPoDeliveryDate;

    // Show in Escalations ONLY if it was manually escalated via an ETA update
    return isEdited;
}
