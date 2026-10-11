import { useState } from "react";
import { fmtDate, fmtDateTime } from "./coordUtils";

// Log Entry: reusable history row used in VendorBatchDesk & StarLedger 
export function LogEntry({ l, isFirst = false }) {
    const bgClass =
        l.action === "ETA UPDATED" ? "bg-orange-50 border-orange-200" :
            l.action === "ETA RESTORED" ? "bg-green-50 border-green-200" :
                l.action === "STAGE MOVED" ? "bg-blue-50 border-blue-200" :
                    isFirst ? "bg-red-50 border-red-200" :
                        "bg-slate-50 border-slate-200";

    const textClass =
        l.action === "ETA UPDATED" ? "text-orange-700" :
            l.action === "ETA RESTORED" ? "text-green-700" :
                l.action === "STAGE MOVED" ? "text-blue-700" :
                    isFirst ? "text-red-700" :
                        "text-slate-600";

    return (
        <div className={`px-3 py-3 rounded-xl border flex flex-col gap-1 ${bgClass}`}>
            <div className="flex justify-between items-start flex-wrap gap-1">
                <span className={`text-[11px] font-black ${textClass}`}>{l.action}</span>
                <div className="flex flex-col items-end text-right">
                    <span className="text-[12px] font-black text-slate-600">BY: {l.user || "—"}</span>
                    <span className="text-[12px] opacity-50 font-medium normal-case">{fmtDateTime(l.date)}</span>
                </div>
            </div>
            <div className="text-xs font-medium normal-case text-slate-600 italic border-l-2 border-slate-300 pl-2">"{l.note}"</div>
        </div>
    );
}

// Confirm Modal — supports custom label, color and icon per stage action
export function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "CONFIRM", confirmClass = "bg-blue-600 hover:bg-blue-500", icon = "🚚" }) {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-slate-900/50 p-4">
            <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-sm font-black italic uppercase text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-sm font-black text-slate-800 mb-6 normal-case italic">{message}</div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-50 transition-colors"
                    >CANCEL</button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-2xl text-white text-xs font-black transition-colors shadow-md ${confirmClass}`}
                    >{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

// ETA Update Modal
export function EtaUpdateModal({ job, onConfirm, onCancel }) {
    const [newEta, setNewEta] = useState(
        job.poDeliveryDate ? new Date(job.poDeliveryDate).toISOString().slice(0, 16) : ''
    );
    const [remark, setRemark] = useState("");

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[900]">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 font-black italic uppercase">
                <div className="flex justify-between items-center mb-6 border-b-4 border-slate-900 pb-4">
                    <div>
                        <div className="text-lg font-black text-blue-600">Update ETA</div>
                        <div className="text-[12px] text-black mt-1">{job.poNumber} — {job.name}</div>
                    </div>
                    <button onClick={onCancel} className="text-3xl font-black text-slate-400 hover:text-slate-700">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="text-[12px] text-slate-400 mb-2 tracking-widest">CURRENT DELIVER BY</div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black">{fmtDateTime(job.poDeliveryDate)}</div>
                    </div>
                    <div>
                        <div className="text-[12px] text-slate-400 mb-2 tracking-widest">NEW DELIVER BY</div>
                        <input
                            type="datetime-local"
                            value={newEta}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={e => setNewEta(e.target.value)}
                            className="w-full p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm font-black italic outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <div className="text-[12px] text-slate-400 mb-2 tracking-widest">REMARK (REQUIRED)</div>
                        <textarea
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            placeholder="Reason for date change..."
                            rows={3}
                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[12px] font-black italic outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                    </div>
                    <button
                        disabled={!remark.trim() || !newEta || job.is_on_hold}
                        onClick={() => onConfirm(newEta, remark)}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black italic uppercase transition-all ${job.is_on_hold ? "bg-slate-200 text-slate-400 cursor-not-allowed" : (!remark.trim() || !newEta ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:scale-[1.01] shadow-lg")}`}
                    >
                        Confirm ETA Update
                    </button>

                </div>
            </div>
        </div>
    );
}

// Escalation Modal
export function EscalationModal({ job, isEscalated, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[2050]" style={{ zIndex: 1000 }}>
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 font-black italic uppercase text-center">
                <div className="text-5xl mb-4">{isEscalated ? "✅" : "⚠️"}</div>
                <div className="text-xl font-black text-slate-800 mb-2 leading-tight">
                    {isEscalated ? "Resolve / Clear Escalation" : "Trigger Urgent Escalation"}
                </div>
                <div className="text-[13px] text-slate-500 mb-8 tracking-widest leading-relaxed italic normal-case font-medium">
                    <span className="font-black uppercase">{job.poNumber}</span> — {job.name}<br />
                    {isEscalated
                        ? "This will resolve the alert and notify all departments."
                        : "This will flag the order as URGENT."}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 text-[11px] font-black hover:bg-slate-50 transition-colors italic uppercase"
                    >Cancel</button>
                    <button
                        onClick={() => onConfirm("")}
                        className={`flex-1 py-4 rounded-2xl text-white text-[11px] font-black transition-all shadow-lg italic uppercase hover:scale-[1.02] active:scale-[0.98] ${isEscalated ? "bg-emerald-600" : "bg-red-600"}`}
                    >
                        {isEscalated ? "Confirm De-escalate QC" : "Confirm Escalate QC"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Qty Alert Modal
export function QtyModal({ requests, onAccept, onClose }) {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2000] font-black italic uppercase">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 flex flex-col font-black italic">
                <div className="flex justify-between items-center mb-8 border-b-4 border-slate-900 pb-4">
                    <h3 className="text-2xl font-black text-purple-600">Pending Qty Amends — Sales Sync</h3>
                    <button onClick={onClose} className="text-3xl font-black italic text-slate-400 hover:text-slate-900">&times;</button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scroll">
                    {requests.map((r) => (
                        <div key={r._id} className="p-6 rounded-[32px] border-2 flex justify-between items-center italic bg-purple-50 border-purple-100 shadow-sm transition-transform hover:scale-[1.01]">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600 text-lg underline">{r.poNumber}</span>
                                    <span className="text-slate-400 text-[12px] tracking-widest">[{r.uid}]</span>
                                </div>
                                <div className="text-[11px] mt-1 text-slate-800 font-black">{r.name}</div>
                                <div className="text-[10px] opacity-50 italic font-black">{r.vendorName}</div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className={`text-center font-black italic`}>
                                    <div className="text-[10px] opacity-50 uppercase mb-1">PROPOSED JOB QTY</div>
                                    <div className="text-2xl font-black text-purple-700">{r.newQtyRequest}</div>
                                    <div className="text-[10px] opacity-50 uppercase mt-1 italic line-through">Baseline: {r.currentJobQty}</div>
                                </div>
                                <button
                                    disabled={r.is_on_hold}
                                    onClick={() => onAccept(r)}
                                    className={`px-8 py-3 rounded-2xl text-[10px] text-white shadow-lg uppercase font-black transition-all ${r.is_on_hold ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 hover:scale-105 active:scale-95'}`}
                                >
                                    {r.is_on_hold ? 'Acknowledge' : 'Acknowledge'}
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Date Change Modal
export function DateModal({ requests, onAccept, onClose }) {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2000] font-black italic uppercase">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 flex flex-col font-black italic">
                <div className="flex justify-between items-center mb-8 border-b-4 border-slate-900 pb-4">
                    <h3 className="text-2xl font-black text-orange-600">Pending Timeline Shifts</h3>
                    <button onClick={onClose} className="text-3xl font-black italic text-slate-400 hover:text-slate-900">&times;</button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scroll">
                    {requests.map((r) => (
                        <div key={r._id} className="p-6 rounded-[32px] border-2 flex justify-between items-center italic bg-orange-50 border-orange-100 shadow-sm transition-transform hover:scale-[1.01]">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600 text-lg underline">{r.poNumber}</span>
                                    <span className="text-slate-400 text-[10px] tracking-widest">[{r.uid}]</span>
                                </div>
                                <p className="text-[11px] mt-1 text-slate-800 font-black">{r.name}</p>
                                <p className="text-[10px] opacity-50 italic font-black">{r.vendorName}</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                {r.pendingDateChange && (
                                    <div className="flex items-center gap-6 border-b border-orange-200 pb-2">
                                        <div className="text-center font-black italic min-w-[200px]">
                                            <div className="text-[10px] opacity-40 uppercase mb-1">PROPOSED DELIVERY</div>
                                            <div className="text-lg font-black text-orange-700">{fmtDate(r.newDateRequest)}</div>
                                            {/* <div className="text-[10px] opacity-50 uppercase mt-1 italic line-through">Baseline: {fmtDate(r.current_delivery_date)}</div> */}
                                        </div>
                                    </div>
                                )}
                                {r.pendingJobCompletionChange && (
                                    <div className="flex items-center gap-6">
                                        <div className="text-center font-black italic min-w-[200px]">
                                            <div className="text-[10px] opacity-40 uppercase mb-1">PROPOSED JOB COMPLETION</div>
                                            <div className="text-lg font-black text-orange-700">{fmtDate(r.newJobCompletionRequest)}</div>
                                            {/* <div className="text-[10px] opacity-50 uppercase mt-1 italic line-through">Baseline: {fmtDate(r.current_job_completion_date)}</div> */}
                                        </div>
                                    </div>
                                )}
                                <button
                                    disabled={r.is_on_hold}
                                    onClick={() => onAccept(r)}
                                    className={`px-8 py-3 rounded-2xl text-[10px] text-white shadow-lg uppercase font-black transition-all ${r.is_on_hold ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 hover:scale-105 active:scale-95'}`}
                                >
                                    {r.is_on_hold ? 'Acknowledge' : 'Acknowledge'}
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
