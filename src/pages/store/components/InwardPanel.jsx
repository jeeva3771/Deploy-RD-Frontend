/**
 * InwardPanel.jsx
 * Design: STORES_INWARD_OUTWARD_v22.1 — Transaction Audit Protocol side panel
 * Exact port of the HTML prototype's right side-panel design
 */

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { awardInwardAction, updateAwardCoordStage } from '../../../reducer/rfqReducer';
import { toast } from 'react-toastify';
import { EscalationModal, ConfirmModal } from '../../rfq/coord/CoordShared';

function formatETA(d) {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return String(d);
        return dt.toLocaleString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch { return String(d); }
}

function fmtTimeOnly(d) {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '—'; }
}

const s = {
    panel: (isOpen) => ({
        position: 'fixed', top: 0, right: 0, height: '100%', width: 720,
        background: 'white',
        boxShadow: '-20px 0 50px rgba(0,0,0,0.1)',
        borderLeft: '1px solid #e2e8f0',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', sans-serif", fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase',
    }),
    overlay: (isOpen) => ({
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(2px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s',
    }),
    ledger: {
        background: '#0f172a', color: 'white', borderRadius: 12,
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
    summaryItem: { textAlign: 'center', flex: 1 },
    sep: { width: 1, height: 30, background: 'rgba(255,255,255,0.1)' },
    actionCard: (borderColor) => ({
        border: `1px solid #e2e8f0`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 16, padding: 20,
        background: '#fff', marginBottom: 16,
    }),
    input: {
        width: '100%', border: '2px solid #e2e8f0', borderRadius: 8,
        padding: '8px 12px', fontSize: 11, fontWeight: 900, fontStyle: 'italic',
        outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
    },
    btn: (bg, color = 'white') => ({
        background: bg, color, width: '100%', padding: '12px 0', borderRadius: 8,
        fontSize: 10, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase',
        border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        letterSpacing: '0.05em', transition: 'opacity 0.2s',
    }),
    btnSm: (bg, color = 'white', extra = {}) => ({
        background: bg, color, padding: '8px 16px', borderRadius: 8,
        fontSize: 9, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase',
        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', ...extra,
    }),
    label: (color = '#64748b') => ({
        display: 'block', fontSize: 10, fontWeight: 900, fontStyle: 'italic',
        textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 4,
    }),
};

export default function InwardPanel({ isOpen, item, onClose }) {
    const dispatch = useDispatch();
    const [busy, setBusy] = useState(null);
    const [showArrivalConfirm, setShowArrivalConfirm] = useState(false);
    const [logNote, setLogNote] = useState('');
    const [qcRemark, setQcRemark] = useState('');
    const [showEscalationModal, setShowEscalationModal] = useState(false);

    // Refs for all inputs
    const arrQtyRef = useRef();
    const arrChlRef = useRef();
    const qcPassedRef = useRef();
    const qcFailedRef = useRef();
    const issueQtyRef = useRef();
    const reinQtyRef = useRef();

    // Prevent background scroll when panel is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!item) return <><div style={s.overlay(isOpen)} onClick={onClose} /><div style={s.panel(isOpen)} /></>;

    const pendingQC = item.received - item.qcGood - item.qcBad;
    const rejectsSummary = item.qcBad + item.returned;
    const stock = item.qcGood - item.issued;

    async function doAction(action, payload = {}) {
        setBusy(action);
        try {
            const res = await dispatch(awardInwardAction({
                rfqId: item.rfqId, poNumber: item.poNumber, action, ...payload
            })).unwrap();
            if (res) toast.success(`✅ ${action.replace(/_/g, ' ')} recorded`);
        } catch (err) {
            toast.error(err || 'Action failed');
        } finally {
            setBusy(null);
        }
    }

    function handleArrival() {
        const qty = parseInt(arrQtyRef.current?.value || 0);
        const challan = arrChlRef.current?.value || '';

        if (isNaN(qty) || qty <= 0) return toast.error('Enter a valid arrival quantity (must be > 0)');
        if (qty < 0) return toast.error('Arrival quantity cannot be negative');
        if (!challan.trim()) return toast.error('Challan # is mandatory to record arrival');

        // Strictly prevent receiving more than total PO qty
        if (qty + item.received > item.ordered) {
            return toast.error(`Arrival Denied: Total received would cross PO Limit (${item.ordered}). Current: ${item.received}`);
        }

        doAction('ARRIVAL_REGISTRY', { qty, challan });
        if (arrQtyRef.current) arrQtyRef.current.value = '';
        if (arrChlRef.current) arrChlRef.current.value = '';
    }

    function handleQC() {
        const g = parseInt(qcPassedRef.current?.value || 0);
        const b = parseInt(qcFailedRef.current?.value || 0);
        if (g < 0 || b < 0) return toast.error('QC values cannot be negative');
        if ((g + b) === 0) return toast.error('Enter at least one QC value (Passed or Failed)');
        if ((g + b) > pendingQC) return toast.error(`Validation Error: entered (${g + b}) exceeds queue (${pendingQC})`);
        doAction('QC_AUDIT', { qtyPassed: g, qtyFailed: b });
        if (qcPassedRef.current) qcPassedRef.current.value = '';
        if (qcFailedRef.current) qcFailedRef.current.value = '';
    }

    function handleRelease() {
        const qty = parseInt(issueQtyRef.current?.value || 0);
        if (isNaN(qty) || qty < 0) return toast.error('Release quantity cannot be negative');
        if (qty <= 0) return toast.error('Enter a valid release quantity (must be > 0)');
        if (qty > stock) return toast.error(`Release Denied: Only ${stock} available`);

        // Strictly prevent issuing more than PO Quantity
        if (item.issued + qty > item.ordered) {
            return toast.error(`Release Denied: Total issued (${item.issued + qty}) would exceed PO Qty (${item.ordered})`);
        }

        doAction('PRODUCTION_RELEASE', { qty });
        if (issueQtyRef.current) issueQtyRef.current.value = '';
    }

    function handleDispatchReturns() {
        if (item.qcBad === 0) return toast.error('No defectives ready for return');
        doAction('DISPATCH_RETURNS');
    }

    function handleReinward() {
        const qty = parseInt(reinQtyRef.current?.value || 0);
        if (isNaN(qty) || qty < 0) return toast.error('Re-inward quantity cannot be negative');
        if (qty <= 0) return toast.error('Enter a valid re-inward quantity (must be > 0)');
        if (qty > item.returned) return toast.error(`Accounting Error: Max allowed: ${item.returned}`);
        doAction('REINWARD', { qty });
        if (reinQtyRef.current) reinQtyRef.current.value = '';
    }

    function handleEscalate() {
        setShowEscalationModal(true);
    }

    function submitEscalation(note) {
        doAction('TOGGLE_ESCALATE', { note: (note || '').trim() });
        setShowEscalationModal(false);
    }

    async function executePushToQC() {
        if (!item) return;
        setBusy('PUSH_TO_QC');
        try {
            await dispatch(updateAwardCoordStage({
                rfqId: item.rfqId,
                poNumber: item.poNumber,
                coordStage: 'QC CHECK',
                note: qcRemark.trim() || "Moved to QC via Inward Module"
            })).unwrap();
            toast.success("✅ Pushed to QC Check");
            setQcRemark('');
            setShowArrivalConfirm(false);
            onClose(); // Automatically close the panel after success
        } catch (err) {
            toast.error(err || "Failed to push to QC");
        } finally {
            setBusy(null);
        }
    }

    function handlePushToQC() {
        setShowArrivalConfirm(true);
    }

    function handleSyncLedger() {
        if (!logNote.trim()) return toast.error('Enter a note before syncing');
        doAction('LOG_NOTE', { note: logNote.trim() });
        setLogNote('');
    }

    function handleWhatsApp() {
        const eta = formatETA(item.poDeliveryDate);
        const msg = encodeURIComponent(
            `📦 *STORES INWARD REPORT*\n` +
            `PO: ${item.poNumber} | UUID: ${item.rfqUid}\n` +
            `Job: ${item.jobId} | Vendor: ${item.vendor}\n` +
            `Material: ${item.material} | ETA: ${eta}\n\n` +
            `*BALANCES*\n` +
            `Ordered: ${item.ordered} | Received: ${item.received}\n` +
            `QC Good: ${item.qcGood} | Rejected: ${rejectsSummary}\n` +
            `Issued: ${item.issued} | In Stock: ${stock}\n\n` +
            `Stage: ${item.coordStage || '—'}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    }

    const auditVolumeCheck = item.issued + item.returned + stock;

    // ── Print portal — Transaction Audit Protocol ─────────────────────────────────────
    const printPortal = createPortal(
        <div id="inward-audit-print" style={{
            display: 'none',
            fontFamily: "'Inter','Segoe UI',sans-serif",
            fontWeight: 900, fontStyle: 'italic',
            textTransform: 'uppercase', color: '#1e293b',
        }}>
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 14mm 16mm; }
                    body > *:not(#inward-audit-print) { display: none !important; }
                    #inward-audit-print {
                        display: block !important;
                        width: 100%; height: auto; overflow: visible; margin: 0; padding: 0;
                    }
                    #inward-audit-print .plr { page-break-inside: avoid; break-inside: avoid; }
                }
            `}</style>

            {/* Header */}
            <div style={{ paddingBottom: 14, marginBottom: 18, borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 20, color: '#2563eb', fontWeight: 900, letterSpacing: '0.15em', marginBottom: 5 }}>
                    TRANSACTION AUDIT PROTOCOL
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, fontStyle: 'italic', color: '#0f172a', letterSpacing: '-0.01em' }}>
                    {item.poNumber} / {item.jobId} <span style={{ opacity: 0.4, fontSize: 18 }}>[{item.rfqUid}]</span>
                </div>
                {item.reference_no && (
                    <div style={{ fontSize: 14, fontWeight: 900, fontStyle: 'italic', color: '#64748b', letterSpacing: '0.1em', marginTop: 4 }}>
                        REF: {item.reference_no}
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div style={{ display: 'table', width: '100%', marginBottom: 22, background: '#0f172a', borderRadius: 10, padding: '14px 20px', color: 'white', tableLayout: 'fixed' }}>
                {[
                    { lbl: 'PO QTY', val: item.ordered, color: 'white' },
                    { lbl: 'TOTAL RECD', val: item.received, color: '#60a5fa' },
                    { lbl: 'REJECTS', val: rejectsSummary, color: '#fb923c' },
                    { lbl: 'ISSUED', val: item.issued, color: '#34d399' },
                ].map((sc, i, arr) => (
                    <div key={sc.lbl} style={{ display: 'table-cell', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                        <div style={{ fontSize: 17, opacity: 0.5, marginBottom: 4, fontWeight: 900 }}>{sc.lbl}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: sc.color }}>{sc.val}</div>
                    </div>
                ))}
            </div>

            {/* Physical Inventory Reconciliation */}
            <div className="plr" style={{ background: '#f8fafc', border: '3px double #0f172a', borderRadius: 14, padding: '20px 24px', marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 900, textDecoration: 'underline', textDecorationColor: '#0f172a', marginBottom: 20, letterSpacing: '0.18em' }}>
                    PHYSICAL INVENTORY RECONCILIATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 9.5, fontStyle: 'italic' }}>
                    {[
                        ['PHYSICALLY RETURNED TO VENDOR', `${item.returned} UNITS`, '#dc2626'],
                        ['REPLACEMENT STOCK RECD (RE-IN)', `${item.totalReIn} UNITS`, '#2563eb'],
                        ['PHYSICAL REJECTS IN QC BAY', `${item.qcBad} UNITS`, '#ea580c'],
                        ['UNACCOUNTED / AUDIT QUEUE', `${pendingQC} UNITS`, '#ea580c'],
                        ['NET GOOD STOCK IN BINS', `${stock} UNITS`, '#059669'],
                    ].map(([label, value, color]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 5 }}>
                            <span>{label}</span>
                            <span style={{ color, fontWeight: 900 }}>{value}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '4px solid #0f172a', marginTop: 6, paddingTop: 14, fontWeight: 900, color: '#0f172a', fontSize: 10 }}>
                        <span>AUDIT VOLUME CHECK (ISSUED + RETD + STOCK)</span>
                        <span style={{ textDecoration: 'underline', textDecorationStyle: 'double', textDecorationColor: '#2563eb', color: '#2563eb' }}>
                            {auditVolumeCheck} UNITS
                        </span>
                    </div>
                </div>
            </div>

            {/* System Transaction Log */}
            {item.history.length > 0 && (
                <div>
                    <div style={{ fontSize: 8.5, color: '#94a3b8', marginBottom: 14, letterSpacing: '0.15em', textDecoration: 'underline', textDecorationColor: '#e2e8f0' }}>
                        SYSTEM TRANSACTION LOG
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.history.map((h, i) => (
                            <div key={i} className="plr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #f8fafc', paddingBottom: 5, fontStyle: 'italic', color: h.msg?.includes('URGENT') ? '#dc2626' : '#1e293b' }}>
                                <span>{h.msg}</span>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                                    <div style={{ fontSize: 8.5, opacity: 0.45, fontWeight: 900, fontStyle: 'italic' }}>
                                        {h.date ? fmtTimeOnly(h.date) : (h.time || '—')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );

    return (
        <>
            {/* Backdrop */}
            <div className="no-print" style={s.overlay(isOpen)} onClick={onClose} />

            {/* Panel */}
            <div id="inward-panel-content" style={s.panel(isOpen)}>
                {/* ── Header — Transaction Audit Protocol ── */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', flexShrink: 0 }}>
                    <div>
                        <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 900, letterSpacing: '0.15em', display: 'block', marginBottom: 4 }}>Transaction Audit Protocol</span>
                        <h2 style={{ fontSize: 22, lineHeight: 1, fontStyle: 'italic', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                            {item.poNumber} / {item.jobId} <span style={{ opacity: 0.3, fontSize: 16 }}>[{item.rfqUid}]</span>
                        </h2>
                        {item.reference_no && (
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 900, fontStyle: 'italic', margin: '4px 0 0' }}>
                                REF: {item.reference_no}
                            </div>
                        )}
                        <div style={{ fontSize: 12, opacity: 0.5, margin: '4px 0 0', fontWeight: 900 }}>{item.material} · {item.vendor}</div>
                    </div>
                    <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {item.coordStage !== "EN ROUTE" && (
                            <button onClick={() => window.print()}
                                style={{ background: '#0f172a', color: 'white', padding: '10px 14px', borderRadius: 12, border: 'none', fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}>
                                🖨
                            </button>
                        )}
                        <button onClick={onClose} className="hover:text-red-500 transition-colors"
                            style={{ fontSize: 32, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', fontStyle: 'italic', fontWeight: 900, padding: '0 0 0 10px' }}>
                            ×
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="panel-scroll-body custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                    {item.isEscalated && (
                        <div style={{ background: '#fef2f2', border: '1px solid #eb6a6aff', borderBottomWidth: 15, borderRadius: 20, padding: 20, marginBottom: 28, animation: 'pulse-red 2s infinite' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <span style={{ fontSize: 24 }}>⚠️</span>
                                <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 950 }}>URGENT QC ESCALATION ACTIVE</div>
                            </div>
                            {item.coordLogs?.find(l => l.action === "ESCALATED") && (
                                <div style={{ fontSize: 12, color: '#b91c1c', fontStyle: 'italic', textTransform: 'none', borderLeft: '1px solid #ef4444', paddingLeft: 14, marginLeft: 8, fontWeight: 700 }}>
                                    "{item.coordLogs.find(l => l.action === "ESCALATED")?.note}"
                                    <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7, fontWeight: 800, textTransform: 'uppercase' }}>
                                        By {item.coordLogs.find(l => l.action === "ESCALATED")?.user} @ {new Date(item.coordLogs.find(l => l.action === "ESCALATED")?.date).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ pointerEvents: 'auto' }}>


                    {item.coordStage !== "EN ROUTE" && (
                        <>
                            {/* Ledger Summary */}
                            <div className="print-ledger" style={s.ledger}>
                                <div style={s.summaryItem}>
                                    <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900 }}>PO QTY</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'white' }}>{item.ordered}</div>
                                </div>
                                <div className="no-print" style={s.sep} />
                                <div style={s.summaryItem}>
                                    <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900, color: '#60a5fa' }}>TOTAL RECD</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa', margin: 0 }}>{item.received}</div>
                                </div>
                                <div className="no-print" style={s.sep} />
                                <div style={s.summaryItem}>
                                    <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900, color: '#fb923c' }}>REJECTS</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fb923c', margin: 0 }}>{rejectsSummary}</div>
                                </div>
                                <div className="no-print" style={s.sep} />
                                <div style={s.summaryItem}>
                                    <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900, color: '#34d399' }}>ISSUED</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', margin: 0 }}>{item.issued}</div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── EN-ROUTE SPECIAL ACTION ── */}
                    {item.coordStage === "EN ROUTE" && (
                        <div className="no-print" style={{ ...s.actionCard('#8b5cf6'), background: '#f5f3ff', borderLeftWidth: 8 }}>
                            <h4 style={{ fontSize: 13, marginBottom: 12, color: '#6d28d9', letterSpacing: '0.1em', fontWeight: 950, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🚚 INCOMING: PUSH TO QC CHECK</span>
                                <button onClick={handleEscalate} disabled={busy === 'TOGGLE_ESCALATE' || item.is_on_hold}
                                    style={{ ...s.btnSm(item.isEscalated ? '#dc2626' : 'transparent', item.isEscalated ? 'white' : '#dc2626'), border: '2px solid #dc2626', borderRadius: 6, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                    ⚠ {item.isEscalated ? 'Escalated' : 'Escalate QC'}
                                </button>
                            </h4>
                            <p style={{ fontSize: 12, color: '#7c3aed', marginBottom: 16, opacity: 0.8, textTransform: 'none', fontWeight: 600 }}>
                                Use this once the material has physically arrived at the gate and is ready for inspection.
                            </p>
                            <textarea
                                disabled={item.is_on_hold}
                                value={qcRemark}
                                onChange={e => setQcRemark(e.target.value)}
                                placeholder="Add arrival remarks (optional)..."
                                style={{ ...s.input, minHeight: 60, marginBottom: 12, fontSize: 12, border: '2px solid #ddd6fe', background: 'white', opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}
                            />
                            <button onClick={handlePushToQC} disabled={busy === 'PUSH_TO_QC' || item.is_on_hold}
                                style={{ ...s.btn('#7c3aed'), fontSize: 12, borderRadius: 12, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                {busy === 'PUSH_TO_QC' ? '⟳ Pushing...' : '✅ Confirm Arrival — Proceed to QC'}
                            </button>

                            {showArrivalConfirm && (
                                <ConfirmModal
                                    message={`Are you sure the delivery for ${item.poNumber} has physically arrived? This will move it to QC Check stage.`}
                                    confirmLabel="YES, ARRIVED"
                                    confirmClass="bg-purple-600 hover:bg-purple-700"
                                    icon="✅"
                                    onConfirm={executePushToQC}
                                    onCancel={() => setShowArrivalConfirm(false)}
                                />
                            )}
                        </div>
                    )}


                    {item.coordStage !== "EN ROUTE" && (
                        <>
                            {item.issued >= item.ordered ? (
                                <div className="no-print" style={{
                                    background: '#f0fdf4',
                                    border: '3px solid #16a34a',
                                    borderRadius: 24,
                                    padding: '40px 20px',
                                    marginBottom: 28,
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 16
                                }}>
                                    <div style={{ fontSize: 48 }}>✅</div>
                                    <div style={{ fontSize: 24, color: '#16a34a', fontWeight: 1000, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        PO FULLY COMPLETED
                                    </div>
                                    <div style={{ fontSize: 13, color: '#15803d', fontWeight: 800, opacity: 0.8 }}>
                                        All {item.ordered} units have been received, audited, and issued to production.
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Arrival Registry */}
                                    <div className="no-print" style={s.actionCard('#2563eb')}>
                                        <h4 style={{ fontSize: 12, marginBottom: 16, color: '#2563eb', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline' }}>
                                            1. Arrival Registry
                                        </h4>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                            <input ref={arrQtyRef} type="number" min={0} defaultValue={item.ordered || ''} placeholder="Arrival Qty" style={{ ...s.input, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }} disabled={item.is_on_hold} />
                                            <input ref={arrChlRef} type="text" placeholder="Challan #" style={{ ...s.input, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }} disabled={item.is_on_hold} />
                                        </div>
                                        <button onClick={handleArrival} disabled={busy === 'ARRIVAL_REGISTRY' || item.is_on_hold}
                                            style={{ ...s.btn('#2563eb'), opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                            {busy === 'ARRIVAL_REGISTRY' ? '⟳ Recording...' : 'Record Entry'}
                                        </button>
                                    </div>

                                    {/* 2. Quality Audit Queue */}
                                    <div className="no-print" style={{ ...s.actionCard('#ea580c'), ...(pendingQC > 0 ? { animation: 'glow-orange 2s infinite', borderColor: '#f97316' } : {}) }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h4 style={{ fontSize: 12, color: '#ea580c', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', margin: 0 }}>
                                                2. Quality Audit Queue
                                            </h4>
                                            <button onClick={handleEscalate} disabled={busy === 'TOGGLE_ESCALATE' || item.is_on_hold}
                                                style={{ ...s.btnSm(item.isEscalated ? '#dc2626' : 'transparent', item.isEscalated ? 'white' : '#dc2626'), border: '2px solid #dc2626', borderRadius: 6, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                                ⚠ {item.isEscalated ? 'Escalated' : 'Escalate QC'}
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 12, marginBottom: 16, color: '#ea580c', fontWeight: 900 }}>
                                            Pending Verification: {pendingQC} nos
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={s.label()}>Passed</label>
                                                <input ref={qcPassedRef} type="number" min={0} style={{ ...s.input, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }} disabled={item.is_on_hold} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={s.label()}>Failed</label>
                                                <input ref={qcFailedRef} type="number" min={0} style={{ ...s.input, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }} disabled={item.is_on_hold} />
                                            </div>
                                        </div>
                                        <button onClick={handleQC} disabled={busy === 'QC_AUDIT' || item.is_on_hold}
                                            style={{ ...s.btn('#ea580c'), opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                            {busy === 'QC_AUDIT' ? '⟳ Submitting...' : 'Submit Audit'}
                                        </button>
                                    </div>

                                    {/* 3. Production Release */}
                                    <div className="no-print" style={s.actionCard('#059669')}>
                                        <h4 style={{ fontSize: 12, marginBottom: 16, color: '#059669', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>3. Production Release</span>
                                            <span style={{ opacity: 0.5, fontWeight: 1000 }}>Ready: {stock}</span>
                                        </h4>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                                            <input ref={issueQtyRef} type="number" min={0} defaultValue={stock > 0 ? stock : ''} placeholder="Qty to Release" style={{ ...s.input, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }} disabled={item.is_on_hold} />
                                            <button onClick={handleRelease} disabled={busy === 'PRODUCTION_RELEASE' || item.is_on_hold}
                                                style={{ ...s.btnSm('#059669'), borderRadius: 8, padding: '10px 24px', fontSize: 12, border: 'none', opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                                {busy === 'PRODUCTION_RELEASE' ? '⟳' : 'Release'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4. Rejection & Replacement Cycle */}
                                    <div className="no-print" style={s.actionCard('#dc2626')}>
                                        <h4 style={{ fontSize: 12, marginBottom: 16, color: '#dc2626', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline' }}>
                                            4. Rejection &amp; Replacement Cycle
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.5, fontStyle: 'italic', marginBottom: 8 }}>Defective Inventory: {item.qcBad}</div>
                                                <button onClick={handleDispatchReturns} disabled={busy === 'DISPATCH_RETURNS' || item.qcBad === 0 || item.is_on_hold}
                                                    style={{ ...s.btnSm('white', '#dc2626', { border: '4px solid #dc2626', padding: '10px 0', width: '100%', fontSize: 11 }), borderRadius: 8, opacity: (item.qcBad === 0 || item.is_on_hold) ? 0.4 : 1, cursor: (item.qcBad === 0 || item.is_on_hold) ? 'not-allowed' : 'pointer' }}>
                                                    {busy === 'DISPATCH_RETURNS' ? '⟳' : 'Dispatch Returns'}
                                                </button>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.5, fontStyle: 'italic', marginBottom: 8 }}>Replacement Cap: {item.returned}</div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <input ref={reinQtyRef} type="number" min={0} placeholder="RE-IN" style={{ ...s.input, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }} disabled={item.is_on_hold} />
                                                    <button onClick={handleReinward} disabled={busy === 'REINWARD' || item.is_on_hold}
                                                        style={{ ...s.btnSm('#0f172a'), borderRadius: 8, padding: '10px 16px', border: 'none', fontSize: 12, flexShrink: 0, opacity: item.is_on_hold ? 0.7 : 1, cursor: item.is_on_hold ? 'not-allowed' : 'pointer' }}>
                                                        {busy === 'REINWARD' ? '⟳' : 'Re-In'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Delivery Schedule (If Split) */}
                    {/* {(item.deliverySchedule || []).length > 0 && (
                        <div className="plr" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 22 }}>
                            <div style={{ fontSize: 10, fontWeight: 950, marginBottom: 16, letterSpacing: '0.18em', color: '#1e293b' }}>
                                DELIVERY SCHEDULE (SPLITS)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {item.deliverySchedule.map((split, si) => (
                                    <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 16px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                        <div>
                                            <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 900 }}>SPLIT #{si + 1}</span>
                                            <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{split.date ? new Date(split.date).toLocaleDateString('en-IN') : '—'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 14, fontWeight: 950, color: '#2563eb' }}>{split.qty} NOS</div>
                                            <div style={{ fontSize: 9, opacity: 0.5, fontWeight: 900 }}>{split.time || ''}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )} */}

                    {item.coordStage !== "EN ROUTE" && (
                        <>
                            {/* Physical Inventory Reconciliation */}
                            <div className="print-reco" style={{ background: '#f8fafc', border: '3px double #0f172a', borderRadius: 16, padding: 24, marginTop: 8, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)' }}>
                                <h5 style={{ fontSize: 11, fontWeight: 900, textDecoration: 'underline', textDecorationColor: '#0f172a', marginBottom: 24, letterSpacing: '0.2em', fontStyle: 'italic' }}>
                                    Physical Inventory Reconciliation
                                </h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12, fontStyle: 'italic' }}>
                                    {[
                                        ['Physically Returned to Vendor', `${item.returned} units`, '#dc2626'],
                                        ['Replacement Stock Recd (Re-In)', `${item.totalReIn} units`, '#2563eb'],
                                        ['Physical Rejects in QC Bay', `${item.qcBad} units`, '#ea580c'],
                                        ['Unaccounted / Audit Queue', `${pendingQC} units`, '#ea580c'],
                                        ['Net Good Stock in Bins', `${stock} units`, '#059669'],
                                    ].map(([label, value, color]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
                                            <span>{label}</span>
                                            <span style={{ color, fontWeight: 900 }}>{value}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '4px solid #0f172a', marginTop: 8, paddingTop: 16, fontWeight: 900, color: '#0f172a', fontSize: 11 }}>
                                        <span>Audit Volume Check (Issued + Retd + Stock)</span>
                                        <span style={{ textDecoration: 'underline', textDecorationStyle: 'double', textDecorationColor: '#2563eb' }}>{auditVolumeCheck} units</span>
                                    </div>
                                </div>
                            </div>


                            {/* System Transaction Log */}
                            <div className="no-print" style={{ paddingTop: 28, borderTop: '1px solid #e2e8f0', marginTop: 24 }}>
                                <h5 style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 900, textDecoration: 'underline', textDecorationColor: '#e2e8f0' }}>
                                    System Transaction Log
                                </h5>
                                {item.history.length === 0 ? (
                                    <div style={{ fontSize: 12, opacity: 0.3, fontStyle: 'italic' }}>No transactions recorded yet</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {item.history.slice().reverse().map((h, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 11, fontWeight: 700, borderBottom: '1px solid #f8fafc', paddingBottom: 4, fontStyle: 'italic', textTransform: 'uppercase', color: h.msg?.includes('URGENT') ? '#dc2626' : '#1e293b' }}>
                                                <span style={{ paddingTop: 2 }}>{h.msg}</span>
                                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                                                    <div style={{ fontSize: 12, opacity: 0.4, fontWeight: 900 }}>
                                                        {h.date ? new Date(h.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : h.time}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Coordination Log — EN ROUTE & STAGE MOVED & ETA UPDATED */}
                    {(() => {
                        const SHOW_ACTIONS = ['PRODUCTION RELEASE', 'STAGE MOVED', 'ETA UPDATED', 'ETA RESTORED', 'COORDINATOR REMARK'];
                        const filteredLogs = (item.coordLogs || []).filter(l => SHOW_ACTIONS.includes(l.action));
                        if (filteredLogs.length === 0) return null;
                        return (
                            <div className="no-print" style={{ paddingTop: 20, borderTop: '1px solid #e2e8f0', marginTop: 16 }}>
                                <h5 style={{ fontSize: 11, color: '#2563eb', marginBottom: 12, letterSpacing: '0.15em', textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 900 }}>
                                    Coordination Log
                                </h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {filteredLogs.slice().reverse().map((l, i) => {
                                        const isStageMoved = l.action === 'STAGE MOVED';
                                        const isETA = l.action === 'ETA UPDATED' || l.action === 'ETA RESTORED';
                                        const isRelease = l.action === 'PRODUCTION RELEASE';

                                        const bg = isStageMoved ? '#eff6ff' : isRelease ? '#f0fdf4' : isETA ? '#fff7ed' : '#f8fafc';
                                        const border = isStageMoved ? '#bfdbfe' : isRelease ? '#bbf7d0' : isETA ? '#fed7aa' : '#e2e8f0';
                                        const actionColor = isStageMoved ? '#1d4ed8' : isRelease ? '#15803d' : isETA ? '#c2410c' : '#475569';

                                        return (
                                            <div key={i} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: '10px 14px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 950, color: actionColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                                        {l.action === 'STAGE MOVED' ? '🚀 ' : l.action === 'PRODUCTION RELEASE' ? '📤 ' : l.action.includes('ETA') ? '📅 ' : '📝 '}
                                                        {l.action}
                                                    </span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>{l.user || '—'}</div>
                                                        <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 800 }}>
                                                            {l.date ? new Date(l.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', fontStyle: 'italic', borderLeft: `2px solid ${actionColor}`, paddingLeft: 8, textTransform: 'none' }}>
                                                    "{l.note}"
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                    </div>
                </div>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                    @keyframes glow-orange {
                        0%   { box-shadow: 0 0 0px #f97316; }
                        50%  { box-shadow: 0 0 10px #f97316; }
                        100% { box-shadow: 0 0 0px #f97316; }
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
                    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    .custom-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; scroll-behavior: smooth; }
                `}</style>
                {/* Escalation Modal */}
                {showEscalationModal && (
                    <EscalationModal
                        job={{ poNumber: item.poNumber, name: item.material }}
                        isEscalated={item.isEscalated}
                        onConfirm={submitEscalation}
                        onCancel={() => setShowEscalationModal(false)}
                    />
                )}
                </div>

            {printPortal}
        </>
    );
}
