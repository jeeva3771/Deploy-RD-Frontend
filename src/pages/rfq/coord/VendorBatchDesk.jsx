import { useState } from "react";
import { fmtDate, fmtDateTime, getCountdown, stageBadgeClass } from "./coordUtils";
import { LogEntry, ConfirmModal } from "./CoordShared";

// Stage-push section component (reusable for EN ROUTE → QC CHECK → STORES INWARD)
function PushStageSection({ rfq, label, color, icon, remark, onRemarkChange, onPush, pushing, is_on_hold }) {
    const colorMap = {
        blue: {
            wrap: "bg-blue-50 border-blue-200",
            title: "text-blue-700",
            input: "border-blue-200 focus:border-blue-500",
            btn: "bg-blue-600 hover:bg-blue-500",
        },
        purple: {
            wrap: "bg-purple-50 border-purple-200",
            title: "text-purple-700",
            input: "border-purple-200 focus:border-purple-500",
            btn: "bg-purple-600 hover:bg-purple-500",
        },
        emerald: {
            wrap: "bg-emerald-50 border-emerald-200",
            title: "text-emerald-700",
            input: "border-emerald-200 focus:border-emerald-500",
            btn: "bg-emerald-600 hover:bg-emerald-500",
        },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <div className={`mx-5 mt-4 mb-2 p-4 border rounded-2xl space-y-3 ${c.wrap}`}>
            <div className={`text-xs tracking-widest font-black ${c.title}`}>{icon} {label}</div>
            <textarea
                rows={2}
                value={remark}
                onChange={e => onRemarkChange(e.target.value)}
                placeholder={"Add a remark (optional)..."}
                className={`w-full p-3 bg-white border rounded-xl text-xs font-medium normal-case italic outline-none transition-colors resize-none ${c.input}`}
            />
            <button
                onClick={onPush}
                disabled={pushing || is_on_hold}
                className={`w-full py-3 text-white rounded-xl text-xs font-black italic uppercase transition-all hover:scale-[1.01] active:scale-[0.98] shadow-md disabled:opacity-60 ${c.btn} ${is_on_hold ? 'cursor-not-allowed grayscale-[0.5]' : ''}`}
            >
                {pushing ? "PUSHING..." : `CONFIRM → ${label.toUpperCase()}`}
            </button>
        </div>
    );
}

// Vendor Batch Desk Side Panel
export function VendorBatchDesk({ selectedCards, onClose, onEtaEdit, onRestoreEta, onPushToEnRoute, onPushToQCCheck, onPushToStoresInward, onToggleEscalate }) {
    const isOpen = selectedCards.length > 0;

    const [routeRemarks, setRouteRemarks] = useState({});
    const [qcRemarks, setQcRemarks] = useState({});
    const [storesRemarks, setStoresRemarks] = useState({});

    const [pushing, setPushing] = useState({});
    const [pushingQC, setPushingQC] = useState({});
    const [pushingStores, setPushingStores] = useState({});

    // Confirm modals: null or the rfq object being confirmed
    const [confirmEnRoute, setConfirmEnRoute] = useState(null);
    const [confirmQCCheck, setConfirmQCCheck] = useState(null);
    const [confirmStores, setConfirmStores] = useState(null);

    // ── EN ROUTE push ──────────────────────────────────────────────────────
    async function doConfirmEnRoute() {
        if (!confirmEnRoute) return;
        const id = confirmEnRoute._id;
        setConfirmEnRoute(null);
        setPushing(prev => ({ ...prev, [id]: true }));
        await onPushToEnRoute(id, routeRemarks[id] || "");
        setRouteRemarks(prev => ({ ...prev, [id]: "" }));
        setPushing(prev => ({ ...prev, [id]: false }));
    }

    // ── QC CHECK push ─────────────────────────────────────────────────────
    async function doConfirmQCCheck() {
        if (!confirmQCCheck) return;
        const id = confirmQCCheck._id;
        setConfirmQCCheck(null);
        setPushingQC(prev => ({ ...prev, [id]: true }));
        await onPushToQCCheck(id, qcRemarks[id] || "");
        setQcRemarks(prev => ({ ...prev, [id]: "" }));
        setPushingQC(prev => ({ ...prev, [id]: false }));
    }

    // ── STORES INWARD push ────────────────────────────────────────────────
    async function doConfirmStores() {
        if (!confirmStores) return;
        const id = confirmStores._id;
        setConfirmStores(null);
        setPushingStores(prev => ({ ...prev, [id]: true }));
        await onPushToStoresInward(id, storesRemarks[id] || "");
        setStoresRemarks(prev => ({ ...prev, [id]: "" }));
        setPushingStores(prev => ({ ...prev, [id]: false }));
    }

    const buildWhatsAppText = () => {
        const lines = ["*PROCUREMENT COORDINATION — RD CUSTOM AWARDS*\n"];
        selectedCards.forEach(rfq => {
            const vendors = rfq.vendorName || "—";
            const eta = fmtDate(rfq.poDeliveryDate);
            const countdown = getCountdown(rfq.poDeliveryDate);
            const jobStr = rfq.subJobNo && rfq.subJobNo !== 'MANUAL' ? `${rfq.jobNo}/${rfq.subJobNo}` : rfq.jobNo;
            lines.push(`*PO Number: ${rfq.poNumber}*\n   Ref: ${rfq.uid || '—'}\n   Job: ${jobStr || '—'}\n   Item: ${rfq.qty} Nos - ${rfq.name}\n   Vendor: ${vendors}\n   ETA: ${eta} (${countdown})\n   Stage: ${rfq._coordStage || "—"}`);
            if (rfq.isSplit && rfq.deliverySchedule?.length > 0) {
                lines.push(`   *DELIVERY SCHEDULE:`);
                rfq.deliverySchedule.forEach((s, si) => {
                    const sDate = s.date ? fmtDate(s.date) : '—';
                    const sTime = s.time || (s.date && fmtDateTime(s.date).split(', ')[1]) || '';
                    const timeStr = sTime && sTime !== '—' ? ` @ ${sTime}` : '';
                    lines.push(`   • Split #${si + 1}: ${sDate}${timeStr} - ${s.qty} nos`);
                });
            }
            const historyObj = (rfq.coordLogs || []).filter(
                l => ["ETA UPDATED", "ETA RESTORED", "COORDINATOR REMARK", "STAGE MOVED"].includes(l.action)
            );
            if (historyObj.length > 0) {
                lines.push(`   *DATE & REMARKS HISTORY:*`);
                historyObj.forEach(h => {
                    const dateStr = fmtDateTime(h.date);
                    lines.push(`   • ${dateStr} - ${h.user}\n     [${h.action}] "${h.note}"`);
                });
            }
            lines.push("");
        });
        lines.push(`_Sent from Coord Hub — ${fmtDateTime(new Date())}_`);
        return encodeURIComponent(lines.join("\n"));
    };

    return (
        <>
            {/* EN ROUTE confirm modal */}
            {confirmEnRoute && (
                <ConfirmModal
                    message={`Push PO: ${confirmEnRoute.poNumber} (${confirmEnRoute.name}) to EN ROUTE? This action will be logged.`}
                    onConfirm={doConfirmEnRoute}
                    onCancel={() => setConfirmEnRoute(null)}
                />
            )}

            {/* QC CHECK confirm modal */}
            {confirmQCCheck && (
                <ConfirmModal
                    message={`Push PO: ${confirmQCCheck.poNumber} (${confirmQCCheck.name}) to QC CHECK? The item will appear in Material Inward for store recording.`}
                    confirmLabel="Confirm Push to QC Check"
                    confirmClass="bg-purple-600 hover:bg-purple-500"
                    onConfirm={doConfirmQCCheck}
                    onCancel={() => setConfirmQCCheck(null)}
                />
            )}

            {/* STORES INWARD confirm modal */}
            {confirmStores && (
                <ConfirmModal
                    message={`Push PO: ${confirmStores.poNumber} (${confirmStores.name}) to STORES INWARD? Store team will record the inward quantities.`}
                    confirmLabel="Confirm Push to Stores Inward"
                    confirmClass="bg-emerald-600 hover:bg-emerald-500"
                    onConfirm={doConfirmStores}
                    onCancel={() => setConfirmStores(null)}
                />
            )}

            <div
                className={`fixed right-0 top-0 w-full sm:w-[600px] h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] side-panel flex flex-col font-black italic uppercase ${isOpen ? "open" : ""}`}
                style={{ zIndex: 1000 }}
            >
                {/* Header */}
                <div className="p-6 bg-blue-600 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <div className="text-xs opacity-60 tracking-[0.3em]">VENDOR DESK</div>
                        <div className="text-2xl font-black mt-1">{selectedCards.length} JOB(S) SELECTED</div>
                    </div>
                    <button onClick={onClose} className="text-5xl leading-none">&times;</button>
                </div>

                {/* Cards list — scrollable */}
                <div className="overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4 custom-scroll h-[calc(100vh-160px)]">
                    {selectedCards.map(rfq => {
                        const eta = fmtDate(rfq.poDeliveryDate);
                        const vendors = rfq.vendorName || "—";
                        const isPendingAck = rfq._coordStage === "PENDING RACK" || rfq._coordStage === "ESCALATED";
                        const isEnRoute = rfq._coordStage === "EN ROUTE";
                        const isQCCheck = rfq._coordStage === "QC CHECK";
                        const isStores = rfq._coordStage === "STORES INWARD";
                        const countdown = getCountdown(rfq.poDeliveryDate);
                        const history = (rfq.coordLogs || []).filter(
                            l => ["ETA UPDATED", "ETA RESTORED", "COORDINATOR REMARK", "STAGE MOVED"].includes(l.action)
                        );
                        const actualIsOnHold = rfq.is_on_hold && !isQCCheck && !isStores;

                        return (
                            <div key={rfq._id} className="vendor-card bg-white rounded-[24px] border border-slate-300 shadow-sm overflow-hidden">

                                {/* Job header */}
                                <div className="flex justify-between items-start bg-slate-100 border-b border-slate-300 px-5 pt-5 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-blue-600 underline text-sm font-black">{rfq.poNumber}</div>
                                            <div className="text-[11px] font-black py-0.5 px-2 bg-slate-200 rounded text-slate-700">Ref: {rfq.uid}</div>
                                            {actualIsOnHold && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-lg border border-red-200 font-black italic uppercase animate-pulse">On Hold</span>
                                            )}
                                        </div>
                                        <div className="text-[12px] font-black text-slate-400 mt-1">
                                            Job: <span className="text-slate-900">{rfq.subJobNo && rfq.subJobNo !== 'MANUAL' ? rfq.subJobNo : rfq.jobNo}</span>
                                        </div>
                                        {rfq.reference_no && (
                                            <div className="text-[12px] font-black text-slate-400 mt-0.5">
                                                Ref No: <span className="text-slate-900 font-bold italic">{rfq.reference_no}</span>
                                            </div>
                                        )}
                                        <div className="text-[12px] text-slate-600 mt-1 font-semibold normal-case">{rfq.name}</div>
                                        <div className="text-[12px] text-slate-500 mt-0.5 font-medium normal-case">{vendors}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`text-[12px] px-3 py-1 rounded-full font-black ${stageBadgeClass(rfq._coordStage)}`}>
                                            {rfq._coordStage}
                                            {rfq._isPostponed && <span className="ml-1 text-[12px]">⚠️</span>}
                                        </div>
                                        <div className="text-[10px] font-black py-0.5 px-3 bg-blue-100 text-blue-700 rounded-lg">
                                            QTY: {rfq.qty} NOS
                                        </div>
                                    </div>
                                </div>

                                {/* Escalation Overview Banner */}
                                {rfq.inwardAccounting?.isEscalated && (
                                    <div className="mx-5 my-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col gap-2 shadow-sm mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl leading-none">⚠️</span>
                                            <div className="text-[11px] text-red-800 font-black tracking-widest leading-none">URGENT QC ESCALATION</div>
                                        </div>
                                        {rfq.coordLogs?.find(l => l.action === "ESCALATED") && (
                                            <div className="text-[12px] text-red-700 font-bold normal-case border-l-2 border-red-300 pl-3 ml-2 leading-relaxed">
                                                "{rfq.coordLogs.find(l => l.action === "ESCALATED")?.note}"
                                                <div className="text-[10px] mt-1.5 opacity-60 uppercase font-black tracking-widest flex items-center gap-1">
                                                    <span>By {rfq.coordLogs.find(l => l.action === "ESCALATED")?.user}</span>
                                                    <span className="opacity-50">@</span>
                                                    <span>{new Date(rfq.coordLogs.find(l => l.action === "ESCALATED")?.date).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Card body — scrollable */}
                                <div className="vendor-card-scroll overflow-y-auto custom-scroll max-h-[480px]">
                                    {/* ETA Row */}
                                    <div className="px-5 py-3 flex justify-between items-center">
                                        <div>
                                            <div className="text-[12px] text-slate-400 mb-1 tracking-widest uppercase">DELIVER BY</div>
                                            <div className={`font-black text-sm ${countdown === "POSTPONED" ? "text-red-600" : "text-slate-800"}`}>
                                                {rfq.poDeliveryDate ? (
                                                    <>
                                                        {fmtDate(rfq.poDeliveryDate)}
                                                        <span className="text-blue-600 ml-1">@ {new Date(rfq.poDeliveryDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </>
                                                ) : "—"}
                                                {countdown === "POSTPONED" && (
                                                    <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">POSTPONED</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {isPendingAck && (
                                                <button
                                                    disabled={actualIsOnHold}
                                                    onClick={() => onEtaEdit(rfq)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-colors ${actualIsOnHold ? 'bg-slate-800 cursor-not-allowed opacity-70' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                                >EDIT ETA</button>
                                            )}
                                            {!isStores && (
                                                <button
                                                    disabled={actualIsOnHold}
                                                    onClick={() => onToggleEscalate(rfq._id)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-colors border-2 ${actualIsOnHold 
                                                        ? 'border-red-600 text-red-600 cursor-not-allowed opacity-70' 
                                                        : rfq.inwardAccounting?.isEscalated
                                                            ? "bg-white border-red-600 text-red-600 shadow-sm"
                                                            : "border-red-600 text-red-600 hover:bg-red-50"}`}
                                                >
                                                    {rfq.inwardAccounting?.isEscalated ? "DE-ESCALATE QC" : "ESCALATE QC"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Escalation Restoration */}
                                    {rfq.oldPoDeliveryDate && (
                                        <div className={`mx-5 mb-4 bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-row items-center justify-between gap-2 ${actualIsOnHold ? 'opacity-70' : ''}`}>
                                            <div className="flex-1 text-[9px] text-red-700 font-black tracking-widest">
                                                PREVIOUS ETA WAS {fmtDate(rfq.oldPoDeliveryDate)} @ {new Date(rfq.oldPoDeliveryDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <button
                                                disabled={actualIsOnHold}
                                                onClick={() => onRestoreEta(rfq)}
                                                className={`flex-shrink-0 py-2 px-4 rounded-xl text-[10px] font-black transition-colors shadow-sm ${actualIsOnHold ? 'bg-red-600 cursor-not-allowed opacity-70' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                            >USE OLD ETA</button>
                                        </div>
                                    )}

                                    {/* Split Schedule */}
                                    {rfq.isSplit && rfq.deliverySchedule?.length > 0 && (
                                        <div className="mx-5 mb-4">
                                            <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2 ml-1">DELIVERY SCHEDULE</div>
                                            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                <div className="grid grid-cols-2 bg-slate-50 px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                                    <span>Split</span><span className="text-right">Date / Qty</span>
                                                </div>
                                                <div className="bg-white">
                                                    {rfq.deliverySchedule.map((s, si) => (
                                                        <div key={si} className="grid grid-cols-2 px-4 py-3 border-b border-slate-100 last:border-0 items-center">
                                                            <span className="text-[12px] font-black text-slate-500 italic">#{si + 1}</span>
                                                            <div className="text-right">
                                                                <div className="text-[13px] font-black text-slate-900 leading-tight">
                                                                    {fmtDate(s.date)}
                                                                    {(s.time || fmtDateTime(s.date).split(', ')[1]) && (
                                                                        <span className="text-blue-600 ml-1">@ {s.time || fmtDateTime(s.date).split(', ')[1]}</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{s.qty} nos</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-b border-slate-200 w-full mb-2" />

                                    {/* ── Push to EN ROUTE (PENDING RACK / ESCALATED) ───────────── */}
                                    {isPendingAck && (
                                        <PushStageSection
                                            rfq={rfq}
                                            label="Push to En Route"
                                            color="blue"
                                            icon="🚚"
                                            remark={routeRemarks[rfq._id] || ""}
                                            onRemarkChange={v => setRouteRemarks(prev => ({ ...prev, [rfq._id]: v }))}
                                            onPush={() => setConfirmEnRoute(rfq)}
                                            pushing={pushing[rfq._id]}
                                            is_on_hold={rfq.is_on_hold}
                                        />
                                    )}

                                    {/* ── Push to QC CHECK (EN ROUTE) ───────────────────────────── */}
                                    {/* MIGRATED TO MATERIAL INWARD PAGE AS PER USER REQUEST */}
                                    {/* {isEnRoute && (
                                        <PushStageSection
                                            rfq={rfq}
                                            label="Push to QC Check"
                                            color="purple"
                                            icon="🔬"
                                            remark={qcRemarks[rfq._id] || ""}
                                            onRemarkChange={v => setQcRemarks(prev => ({ ...prev, [rfq._id]: v }))}
                                            onPush={() => setConfirmQCCheck(rfq)}
                                            pushing={pushingQC[rfq._id]}
                                        />
                                    )} */}

                                    {/* ── Push to STORES INWARD (QC CHECK) ─────────────────────── */}
                                    {isQCCheck && (
                                        <>
                                            {/* QC stage info banner */}
                                            <div className="mx-5 mb-3 mt-4 flex items-center gap-3 bg-purple-50 border border-purple-200 px-4 py-3 rounded-2xl">
                                                <span className="text-xl">🔬</span>
                                                <div>
                                                    <div className="text-[11px] font-black text-purple-700 uppercase tracking-widest">Currently in QC Check</div>
                                                    <div className="text-[11px] text-purple-600 font-semibold normal-case mt-0.5">Item is visible in Material Inward for tracking</div>
                                                </div>
                                            </div>
                                            {/* <PushStageSection
                                                rfq={rfq}
                                                label="Push to Stores Inward"
                                                color="emerald"
                                                icon="📦"
                                                remark={storesRemarks[rfq._id] || ""}
                                                onRemarkChange={v => setStoresRemarks(prev => ({ ...prev, [rfq._id]: v }))}
                                                onPush={() => setConfirmStores(rfq)}
                                                pushing={pushingStores[rfq._id]}
                                            /> */}
                                        </>
                                    )}

                                    {/* History */}
                                    {history.length > 0 && (
                                        <div className="mx-5 mb-4 mt-3 space-y-2">
                                            <div className="text-[13px] text-slate-500 tracking-[0.3em] pt-3 mb-2 font-black">DATE & REMARKS HISTORY</div>
                                            <div className="overflow-y-auto pr-1 custom-scroll space-y-2">
                                                {history.map((l, i) => (
                                                    <LogEntry key={i} l={l} isFirst={i === 0} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer — WhatsApp */}
                <div className="p-5 border-t bg-white flex-shrink-0">
                    <a
                        href={selectedCards.some(rfq => rfq.is_on_hold) ? undefined : `https://wa.me/?text=${buildWhatsAppText()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex w-full py-5 text-white rounded-[28px] items-center justify-center gap-3 shadow-xl text-sm font-black italic uppercase transition-all 
                            ${selectedCards.some(rfq => rfq.is_on_hold) 
                                ? "bg-[#25D366] cursor-not-allowed opacity-70" 
                                : "bg-[#25D366] hover:scale-[1.01] active:scale-[0.99]"}`}
                        onClick={e => { if (selectedCards.some(rfq => rfq.is_on_hold)) e.preventDefault(); }}
                    >
                        <span className="text-2xl">📱</span> 
                        SEND TO WHATSAPP ({selectedCards.length} Jobs)
                    </a>
                </div>
            </div>
        </>
    );
}
