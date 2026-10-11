import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { fmtDate } from "./coordUtils";
import { LogEntry } from "./CoordShared";

// Helpers 
function formatETA(d) {
    if (!d) return "—";
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return String(d);
        return dt.toLocaleString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch { return "—"; }
}

// Print-only sub-components
function PrintLogEntry({ l, isFirst }) {
    const colors = {
        "ETA UPDATED": { border: "#fb923c", bg: "#fff7ed", text: "#c2410c" },
        "ETA RESTORED": { border: "#4ade80", bg: "#f0fdf4", text: "#15803d" },
        "STAGE MOVED": { border: "#60a5fa", bg: "#eff6ff", text: "#1d4ed8" },
    };
    const c = colors[l.action] || (isFirst
        ? { border: "#f87171", bg: "#fef2f2", text: "#991b1b" }
        : { border: "#cbd5e1", bg: "#f8fafc", text: "#475569" });

    return (
        <div style={{
            pageBreakInside: "avoid", breakInside: "avoid",
            marginBottom: 8, padding: "9px 12px",
            borderRadius: 10, border: `1.5px solid ${c.border}`, background: c.bg,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                <div>
                    <div style={{ fontSize: 7, opacity: 0.55, fontWeight: 700 }}>{fmtDate(l.date)}</div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: c.text, letterSpacing: "0.04em" }}>{l.action}</div>
                </div>
                <div style={{ fontSize: 7, fontWeight: 700, opacity: 0.6 }}>BY: {l.user || "—"}</div>
            </div>
            <div style={{
                fontSize: 8, fontStyle: "italic", fontWeight: 500,
                textTransform: "none", color: "#475569",
                paddingLeft: 8, borderLeft: `2px solid ${c.border}`,
            }}>"{l.note}"</div>
        </div>
    );
}

function PrintBalanceCard({ label, val, bg, border, color, date }) {
    return (
        <div style={{
            pageBreakInside: "avoid", breakInside: "avoid",
            borderRadius: 14, border: `1.5px solid ${border}`,
            background: bg, textAlign: "center", padding: "14px 10px",
        }}>
            <div style={{ fontSize: 7, color: "#94a3b8", letterSpacing: "0.28em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
            {date && <div style={{ fontSize: 7, opacity: 0.45, marginTop: 6 }}>{date}</div>}
        </div>
    );
}

// Main Component
export function StarLedger({ rfq, onClose }) {
    const dispatch = useDispatch();
    const logs = rfq.coordLogs || [];
    const acct = rfq.inwardAccounting || {};

    const ordered = (acct.ordered != null && acct.ordered !== 0) ? acct.ordered : (rfq.qty ?? 0);
    const good = acct.inwardGood ?? 0;
    const rejected = acct.rejected ?? 0;
    const reInward = acct.reInward ?? 0;
    const lastDate = acct.lastUpdated ? fmtDate(acct.lastUpdated) : null;

    // Prevent background scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const balanceDefs = [
        { label: "ORDERED", val: ordered, bg: "#f8fafc", border: "#cbd5e1", color: "#1e293b", date: null },
        // { label: "RECEIVED", val: acct.received || 0, bg: "#fef9c3", border: "#fde047", color: "#854d0e", date: lastDate },
        { label: "INWARD GOOD", val: good, bg: "#f0fdf4", border: "#86efac", color: "#15803d", date: lastDate },
        { label: "REJECTED", val: rejected, bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", date: lastDate },
        { label: "RE-INWARD", val: reInward, bg: "#eff6ff", border: "#93c5fd", color: "#2563eb", date: lastDate },
        // { label: "ISSUED (PROD)", val: acct.issued || 0, bg: "#faf5ff", border: "#e9d5ff", color: "#7e22ce", date: lastDate },
        // { label: "RETURNED", val: acct.returned || 0, bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", date: lastDate },
    ];

    function handleWhatsApp() {
        const msg = encodeURIComponent(
            `📦 *STORES INWARD REPORT*\n` +
            `PO: ${rfq.poNumber} | UUID: ${rfq.uid}\n` +
            `Vendor: ${rfq.vendorName || "—"}\n` +
            `Material: ${rfq.name} | Qty: ${rfq.qty} Nos\n` +
            `ETA: ${formatETA(rfq.poDeliveryDate)}\n` +
            `Stage: ${rfq._coordStage || "—"}\n\n` +
            `*INWARD BALANCES*\n` +
            `Ordered: ${ordered} | Inward Good: ${good}\n` +
            `Rejected: ${rejected} | Re-Inward: ${reInward}`
        );
        window.open(`https://wa.me/?text=${msg}`, "_blank");
    }

    // ── Print portal — injected at document.body for clean multi-page flow ────
    const printPortal = createPortal(
        <div id="star-ledger-print" style={{
            display: "none",
            fontFamily: "'Inter','Segoe UI',sans-serif",
            fontWeight: 900, fontStyle: "italic",
            textTransform: "uppercase", color: "#1e293b",
            padding: 0, margin: 0,
        }}>
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 14mm 16mm; }
                    body > *:not(#star-ledger-print) { display: none !important; }
                    #star-ledger-print {
                        display: block !important;
                        width: 100%; height: auto; overflow: visible;
                        margin: 0; padding: 0;
                    }
                    #star-ledger-print .plr { page-break-inside: avoid; break-inside: avoid; }
                }
            `}</style>

            {/* Dark header card */}
            <div className="plr" style={{
                background: "#0f172a", color: "white",
                borderRadius: 18, padding: "24px 30px", marginBottom: 20,
            }}>
                <div style={{ color: "#60a5fa", fontSize: 8.5, letterSpacing: "0.45em", marginBottom: 5 }}>
                    {rfq.vendorName || "—"}
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "0.08em", marginBottom: 14 }}>
                    {rfq.poNumber} <span style={{ opacity: 0.4, fontSize: 24 }}>[{rfq.uid}]</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12, display: "flex", gap: 36, flexWrap: "wrap" }}>
                    <div>
                        <div style={{ fontSize: 7.5, opacity: 0.4, marginBottom: 2 }}>MATERIAL</div>
                        <div style={{ fontSize: 15, fontWeight: 900 }}>{rfq.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 7.5, opacity: 0.4, marginBottom: 2 }}>QTY ORDERED</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#f59e0b" }}>{ordered} NOS</div>
                    </div>
                </div>
            </div>

            {/* Two-column body — table layout for reliable print rendering */}
            <div style={{ display: "table", width: "100%", tableLayout: "fixed", borderSpacing: "20px 0" }}>

                {/* Left — Audit History */}
                <div style={{ display: "table-cell", verticalAlign: "top", width: "50%" }}>
                    <div style={{ color: "#2563eb", fontSize: 7.5, letterSpacing: "0.4em", borderBottom: "2px solid #2563eb", paddingBottom: 5, marginBottom: 12 }}>
                        AUDIT HISTORY
                    </div>
                    {logs.length === 0
                        ? <div style={{ fontSize: 9, color: "#cbd5e1", fontStyle: "italic", textTransform: "none" }}>No log entries yet.</div>
                        : logs.map((l, i) => <PrintLogEntry key={i} l={l} isFirst={i === 0} />)
                    }
                </div>

                {/* Right — Balances */}
                <div style={{ display: "table-cell", verticalAlign: "top", width: "50%" }}>
                    <div style={{ color: "#2563eb", fontSize: 7.5, letterSpacing: "0.4em", borderBottom: "2px solid #2563eb", paddingBottom: 5, marginBottom: 12 }}>
                        BALANCES
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                        {balanceDefs.map(c => <PrintBalanceCard key={c.label} {...c} />)}
                    </div>
                    {rfq.specs && (
                        <div className="plr" style={{ marginTop: 18 }}>
                            <div style={{ color: "#2563eb", fontSize: 7.5, letterSpacing: "0.4em", borderBottom: "2px solid #2563eb", paddingBottom: 5, marginBottom: 9 }}>
                                SPECIFICATIONS
                            </div>
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 13px", fontSize: 8.5, fontStyle: "italic", fontWeight: 500, textTransform: "none", color: "#475569" }}>
                                {rfq.specs}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );

    const actualIsOnHold = rfq.is_on_hold && rfq._coordStage !== "QC CHECK" && rfq._coordStage !== "STORES INWARD";

    return (
        <>
            {/* ── Screen Modal ─────────────────────────────────────────────── */}
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-[700]">
                <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col font-black italic uppercase relative border border-white/20">

                    {/* Header */}
                    <div className="p-6 sm:p-10 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start gap-4 flex-shrink-0">
                        <div>
                            <div className="text-blue-400 text-[12px] tracking-[0.5em] mb-1">{rfq.vendorName || "—"}</div>
                            <div className="text-3xl sm:text-5xl font-black tracking-widest">
                                {rfq.poNumber} <span style={{ opacity: 0.3, fontSize: 34 }}>[{rfq.uid}]</span>
                            </div>
                            <div className="flex gap-6 sm:gap-10 mt-4 pt-4 border-t border-white/10 flex-wrap">
                                <div><div className="text-[12px] opacity-40">MATERIAL</div><div className="text-base sm:text-xl">{rfq.name}</div></div>
                                <div><div className="text-[12px] opacity-40">QTY ORDERED</div><div className="text-base sm:text-xl text-amber-400">{ordered} Nos</div></div>
                                <div><div className="text-[12px] opacity-40">ETA</div><div className="text-base sm:text-xl text-green-400">{formatETA(rfq.poDeliveryDate)}</div></div>
                                <div>
                                    <div className="text-[12px] opacity-40">STAGE</div>
                                    <div className="text-base sm:text-xl text-blue-400 flex items-center gap-3">
                                        {rfq._coordStage || "—"}
                                        {actualIsOnHold && (
                                            <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-lg animate-pulse font-black shadow-lg shadow-red-500/20">ON HOLD</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <button onClick={onClose} className="text-4xl sm:text-5xl leading-none hover:text-red-400 transition-colors">&times;</button>
                            <div className="flex gap-2">
                                <button onClick={handleWhatsApp} title={actualIsOnHold ? "Locked (On Hold)" : "Share via WhatsApp"}
                                    disabled={actualIsOnHold}
                                    className={`px-4 py-2 rounded-xl text-[11px] flex items-center gap-1 transition-colors text-white 
                                        ${actualIsOnHold 
                                            ? 'bg-[#25D366] cursor-not-allowed opacity-70' 
                                            : 'bg-[#25D366] hover:bg-[#1da851]'}`}>
                                    💬 WHATSAPP
                                </button>
                                <button onClick={() => window.print()}
                                    className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-[11px] flex items-center gap-1 transition-colors">
                                    🖨 PRINT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className={`p-5 sm:p-8 flex flex-col gap-8 overflow-y-auto flex-1 custom-scroll scroll-smooth pr-6 mr-1 ${actualIsOnHold ? 'select-none' : ''}`}>




                        {/* Inward Balances */}
                        <div>
                            <div className="text-blue-600 text-[12px] border-b-2 pb-2 mb-4 tracking-widest">INWARD BALANCES</div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {balanceDefs.map(r => (
                                    <div key={r.label} className="border rounded-2xl p-4 text-center"
                                        style={{ background: r.bg, borderColor: r.border }}>
                                        <div className="text-[9px] text-slate-400 mb-1 tracking-widest">{r.label}</div>
                                        <div className="text-2xl font-black" style={{ color: r.color }}>{r.val}</div>
                                        {r.date && <div className="text-[9px] opacity-40 mt-1">{r.date}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Specs */}
                        {rfq.specs && (
                            <div>
                                <div className="text-blue-600 text-[12px] border-b-2 pb-2 mb-3 tracking-widest">SPECIFICATIONS</div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[13px] font-medium normal-case text-slate-700 italic">{rfq.specs}</div>
                            </div>
                        )}

                        {/* Coordination Log */}
                        <div>
                            <div className="text-blue-600 text-[10px] border-b-2 pb-2 mb-4 tracking-widest">COORDINATION LOG</div>
                            {logs.length === 0
                                ? <div className="text-[9px] text-slate-300 italic normal-case">No log entries yet.</div>
                                : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scroll pr-1">
                                        {logs.map((l, i) => <LogEntry key={i} l={l} isFirst={i === 0} />)}
                                    </div>
                                )}
                        </div>

                        {/* Log Fresh Intel */}
                        <div>
                            <div className="text-blue-600 text-[12px] border-b-2 pb-2 mb-3 tracking-widest">LOG FRESH INTEL</div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <textarea rows={3} id="star-ledger-note"
                                    disabled={rfq.is_on_hold}
                                    className={`flex-1 p-4 rounded-2xl border-2 border-slate-200 text-[13px] font-medium normal-case italic outline-none focus:border-blue-500 transition-colors resize-none shadow-inner ${rfq.is_on_hold ? 'bg-slate-50 cursor-not-allowed opacity-50' : ''}`}
                                    placeholder={rfq.is_on_hold ? "Audit updates restricted..." : "Type coordinator note... (saved with RED highlight)"}
                                />
                                <button
                                    disabled={rfq.is_on_hold}
                                    onClick={async () => {
                                        const el = document.getElementById("star-ledger-note");
                                        const note = el?.value?.trim();
                                        if (!note) return toast.error("Enter a note before syncing");
                                        try {
                                            const { addAwardCoordRemark } = await import("../../../reducer/rfqReducer");
                                            await dispatch(addAwardCoordRemark({ rfqId: rfq.rfqId, poNumber: rfq.poNumber, note })).unwrap();
                                            toast.success("Ledger synced");
                                            if (el) el.value = "";
                                        } catch (e) {
                                            toast.error(e || "Failed to sync");
                                        }
                                    }}
                                    className={`px-8 rounded-2xl text-[10px] font-black italic uppercase transition-all py-4 sm:py-0 ${rfq.is_on_hold ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg'}`}
                                >SYNC LEDGER</button>

                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Portal: print content at document.body */}
            {printPortal}
        </>
    );
}
