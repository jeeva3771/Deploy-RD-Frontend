import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import DeliveryPriorityColor from '../../../../components/deliveryPriorityColor/priorityColor';
import { formatDateSafe } from '../../../../utils/dateUtils';

const s = {
    panel: (isOpen) => ({
        position: 'fixed', top: 0, right: 0, height: '100%', width: 560,
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

export function QcPanel({ isOpen, job, onClose, onSubmitArrival, onSubmitQc, onSubmitHandover, onSubmitRejection }) {
    const [busy, setBusy] = useState(null); // 'ARRIVAL', 'QC_AUDIT', 'PRODUCTION_RELEASE', 'REJECTION_HANDOVER'
    const [arrivalQty, setArrivalQty] = useState('');

    // QC Check State
    const [goodQty, setGoodQty] = useState('');
    const [badQty, setBadQty] = useState('');

    // Packing Release State
    const [releaseQty, setReleaseQty] = useState('');

    // Rejection Handover State
    const [rejectionQty, setRejectionQty] = useState('');
    const [rejectionDept, setRejectionDept] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setArrivalQty('');
            setGoodQty(''); setBadQty('');
            setReleaseQty('');
            setRejectionQty(''); setRejectionDept('');
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!job) return <><div style={s.overlay(isOpen)} onClick={onClose} /><div style={s.panel(isOpen)} /></>;

    const pendingQC = job.qc?.pending || 0;
    const rejectsSummary = job.qc?.bad || 0;
    const stock = (job.qc?.good || 0) - (job.packing?.packed || 0);
    const pendingArrival = job.qc?.pendingArrival || 0;
    const pendingRejects = (job.qc?.bad || 0) - (job.qc?.rejectedHandover || 0);

    const totalAudited = (job.qc?.good || 0) + (job.qc?.bad || 0);
    const isJobCompleted = job.order_qty > 0 &&
                           pendingArrival <= 0 &&
                           pendingQC <= 0 &&
                           stock <= 0 &&
                           pendingRejects <= 0 &&
                           totalAudited >= job.order_qty;

    const handleArrival = async () => {
        if (busy) return;
        const qty = parseInt(arrivalQty || 0);
        if (qty <= 0) return toast.error('Enter a valid arrival quantity');
        setBusy('ARRIVAL_REGISTRY');
        try {
            await onSubmitArrival(job.id, qty);
            setArrivalQty('');
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    };

    const handleQC = async () => {
        if (busy) return;
        const g = parseInt(goodQty || 0);
        const b = parseInt(badQty || 0);
        if (g < 0 || b < 0) return toast.error('QC values cannot be negative');
        if ((g + b) === 0) return toast.error('Enter at least one QC value (Passed or Failed)');
        if ((g + b) > pendingQC) return toast.error(`Validation Error: entered (${g + b}) exceeds queue (${pendingQC})`);

        setBusy('QC_AUDIT');
        try {
            await onSubmitQc(job.id, { good: g, bad: b });
            setGoodQty(''); setBadQty('');
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    };

    const handleRelease = async () => {
        if (busy) return;
        const qty = parseInt(releaseQty || 0);
        if (isNaN(qty) || qty < 0) return toast.error('Release quantity cannot be negative');
        if (qty <= 0) return toast.error('Enter a valid release quantity (must be > 0)');
        if (qty > stock) return toast.error(`Release Denied: Only ${stock} available`);

        setBusy('PRODUCTION_RELEASE');
        try {
            await onSubmitHandover(job.id, qty);
            setReleaseQty('');
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    };

    const handleRejection = async () => {
        if (busy) return;
        const qty = parseInt(rejectionQty || 0);
        if (isNaN(qty) || qty <= 0) return toast.error('Enter a valid rejection handover quantity (must be > 0)');
        if (qty > pendingRejects) return toast.error(`Cannot handover more than ${pendingRejects} rejected items`);
        if (!rejectionDept) return toast.error('Please select a department to handover the rejects');

        setBusy('REJECTION_HANDOVER');
        try {
            await onSubmitRejection(job.id, { qty, department: rejectionDept });
            setRejectionQty('');
            setRejectionDept('');
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="no-print" style={s.overlay(isOpen)} onClick={onClose} />

            {/* Panel */}
            <div id="qc-panel-content" style={s.panel(isOpen)}>
                {/* ── Header — Transaction Audit Protocol ── */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', flexShrink: 0 }}>
                    <div>
                        <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 900, letterSpacing: '0.15em', display: 'block', marginBottom: 4 }}>Transaction Audit Protocol</span>
                        <h2 style={{ fontSize: 22, lineHeight: 1, fontStyle: 'italic', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                            {job.job_no}
                        </h2>
                        <div style={{ fontSize: 12, opacity: 0.5, margin: '4px 0 0', fontWeight: 900 }}>{job.client_name} · {job.product}</div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', marginTop: 8 }}>
                            <span style={{ marginRight: 16 }}>COMPLETION: <span style={{ color: '#0f172a' }}>{formatDateSafe(job.job_completion_date, { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                            <span>DELIVERY: <span style={{ color: '#0f172a' }}>{formatDateSafe(job.delivery_date, { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                        </div>
                    </div>
                    <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {job.job_completion_date && (
                            <DeliveryPriorityColor
                                deliveryDate={job.job_completion_date}
                                showPriorityName={true}
                                badgeClassName="!text-[9px] !font-[900] !py-[2px] !px-2 uppercase !rounded-full border shadow-sm"
                            />
                        )}
                        <button onClick={onClose} className="hover:text-red-500 transition-colors"
                            style={{ fontSize: 32, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', fontStyle: 'italic', fontWeight: 900, padding: '0 0 0 10px' }}>
                            ×
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="panel-scroll-body custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                    <div style={{ pointerEvents: 'auto' }}>

                        {/* Ledger Summary */}
                        <div className="print-ledger" style={s.ledger}>
                            <div style={s.summaryItem}>
                                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900 }}>ORDER QTY</div>
                                <div style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'white' }}>{job.order_qty}</div>
                            </div>
                            <div className="no-print" style={s.sep} />
                            <div style={s.summaryItem}>
                                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900, color: '#60a5fa' }}>TOTAL RECD</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa', margin: 0 }}>{job.qc?.received || 0}</div>
                            </div>
                            <div className="no-print" style={s.sep} />
                            <div style={s.summaryItem}>
                                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900, color: '#fb923c' }}>REJECTS</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#fb923c', margin: 0 }}>{rejectsSummary}</div>
                            </div>
                            <div className="no-print" style={s.sep} />
                            <div style={s.summaryItem}>
                                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, fontWeight: 900, color: '#34d399' }}>HANDOVERED PACKS</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', margin: 0 }}>{job.packing?.packed || 0}</div>
                            </div>
                        </div>

                        {/* Completion Banner & Reconciliation */}
                        {isJobCompleted && (
                            <div className="no-print">
                                <div style={{ border: '2px solid #22c55e', borderRadius: 16, padding: '24px', textAlign: 'center', background: '#f0fdf4', marginBottom: 16 }}>
                                    <div style={{ background: '#22c55e', color: 'white', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', transform: 'rotate(10deg)' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <h3 style={{ fontSize: 20, color: '#15803d', margin: '0 0 8px', letterSpacing: '0.05em', fontStyle: 'italic', fontWeight: 900 }}>QC LIFECYCLE COMPLETED</h3>
                                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>
                                        ALL {job.order_qty} UNITS HAVE BEEN AUDITED AND HANDED OVER.<br/>
                                        (PASSED: {job.qc?.good || 0} | REJECTED: {job.qc?.bad || 0})
                                    </div>
                                </div>
                                
                                <div style={{ border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 24, background: '#fff' }}>
                                    <h4 style={{ fontSize: 11, color: '#0f172a', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', marginBottom: 16, marginTop: 0 }}>
                                        QC INVENTORY RECONCILIATION
                                    </h4>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #f1f5f9', marginBottom: 10, fontSize: 11, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                        <span style={{ color: '#0f172a' }}>RECEIVED FROM INWARD</span>
                                        <span style={{ color: '#2563eb' }}>{job.qc?.received || 0} UNITS</span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #f1f5f9', marginBottom: 10, fontSize: 11, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                        <span style={{ color: '#0f172a' }}>ARRIVED IN QC BAY</span>
                                        <span style={{ color: '#2563eb' }}>{job.qc?.arrived || 0} UNITS</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #f1f5f9', marginBottom: 10, fontSize: 11, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                        <span style={{ color: '#0f172a' }}>PHYSICAL REJECTS (FAILED)</span>
                                        <span style={{ color: '#dc2626' }}>{job.qc?.bad || 0} UNITS</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #f1f5f9', marginBottom: 10, fontSize: 11, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                        <span style={{ color: '#0f172a' }}>NET GOOD STOCK (PASSED)</span>
                                        <span style={{ color: '#16a34a' }}>{job.qc?.good || 0} UNITS</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, fontSize: 11, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                        <span style={{ color: '#0f172a' }}>TOTAL HANDOVERED TO PACKING</span>
                                        <span style={{ color: '#16a34a', textDecoration: 'underline' }}>{job.packing?.packed || 0} UNITS</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isJobCompleted && (
                            <>
                                {/* 1. Arrival Registry */}
                        <div className="no-print" style={s.actionCard('#2563eb')}>
                            <h4 style={{ fontSize: 12, marginBottom: 16, color: '#2563eb', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', display: 'flex', justifyContent: 'space-between' }}>
                                <span>1. Arrival Registry</span>
                                <span style={{ opacity: 0.5, fontWeight: 1000 }}>Pending: {pendingArrival}</span>
                            </h4>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                                <input value={arrivalQty} onChange={e => setArrivalQty(e.target.value)} type="number" min={0} placeholder="Arrival Qty" style={{ ...s.input, opacity: 1, cursor: 'text' }} disabled={pendingArrival <= 0} />
                                <button onClick={handleArrival} disabled={busy === 'ARRIVAL_REGISTRY' || pendingArrival <= 0}
                                    style={{ ...s.btn('#2563eb'), width: 'auto', padding: '8px 24px', opacity: pendingArrival <= 0 ? 0.5 : 1, cursor: pendingArrival <= 0 ? 'not-allowed' : 'pointer' }}>
                                    {busy === 'ARRIVAL_REGISTRY' ? '⟳' : 'Record Entry'}
                                </button>
                            </div>
                        </div>

                        {/* 2. Quality Audit Queue */}
                        <div className="no-print" style={{ ...s.actionCard('#ea580c'), ...(pendingQC > 0 ? { animation: 'glow-orange 2s infinite', borderColor: '#f97316' } : {}) }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ fontSize: 12, color: '#ea580c', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', margin: 0 }}>
                                    2. Quality Audit Queue
                                </h4>
                            </div>
                            <div style={{ fontSize: 12, marginBottom: 16, color: '#ea580c', fontWeight: 900 }}>
                                Pending Verification: {pendingQC} nos
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={s.label()}>Passed (Good Qty)</label>
                                    <input value={goodQty} onChange={e => setGoodQty(e.target.value)} type="number" min={0} style={{ ...s.input, opacity: 1, cursor: 'text' }} disabled={pendingQC <= 0} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={s.label()}>Failed (Bad Qty)</label>
                                    <input value={badQty} onChange={e => setBadQty(e.target.value)} type="number" min={0} style={{ ...s.input, opacity: 1, cursor: 'text' }} disabled={pendingQC <= 0} />
                                </div>
                            </div>
                            <button onClick={handleQC} disabled={busy === 'QC_AUDIT' || pendingQC <= 0}
                                style={{ ...s.btn('#ea580c'), opacity: pendingQC <= 0 ? 0.5 : 1, cursor: pendingQC <= 0 ? 'not-allowed' : 'pointer' }}>
                                {busy === 'QC_AUDIT' ? '⟳ Submitting...' : 'Submit Audit'}
                            </button>
                        </div>

                        {/* 3. Packing Release */}
                        <div className="no-print" style={s.actionCard('#059669')}>
                            <h4 style={{ fontSize: 12, marginBottom: 16, color: '#059669', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', display: 'flex', justifyContent: 'space-between' }}>
                                <span>3. Packing Release</span>
                                <span style={{ opacity: 0.5, fontWeight: 1000 }}>Ready: {stock}</span>
                            </h4>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                                <input value={releaseQty} onChange={e => setReleaseQty(e.target.value)} type="number" min={0} placeholder="Qty to Release" style={{ ...s.input, opacity: 1, cursor: 'text' }} disabled={stock <= 0} />
                                <button onClick={handleRelease} disabled={busy === 'PRODUCTION_RELEASE' || stock <= 0}
                                    style={{ ...s.btnSm('#059669'), borderRadius: 8, padding: '10px 24px', fontSize: 12, border: 'none', opacity: stock <= 0 ? 0.5 : 1, cursor: stock <= 0 ? 'not-allowed' : 'pointer' }}>
                                    {busy === 'PRODUCTION_RELEASE' ? '⟳' : 'Release'}
                                </button>
                            </div>
                        </div>


                        {/* 4. Rejection & Replacement Cycle */}
                        {rejectsSummary > 0 && (
                            <div className="no-print" style={s.actionCard('#ef4444')}>
                                <h4 style={{ fontSize: 12, marginBottom: 16, color: '#ef4444', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textDecoration: 'underline', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>4. Rejection & Replacement Cycle</span>
                                    <span style={{ opacity: 0.5, fontWeight: 1000 }}>Pending Returns: {pendingRejects}</span>
                                </h4>
                                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label()}>Return Qty</label>
                                        <input value={rejectionQty} onChange={e => setRejectionQty(e.target.value)} type="number" min={0} placeholder="Qty" style={{ ...s.input, opacity: 1, cursor: 'text' }} disabled={pendingRejects <= 0} />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <label style={s.label()}>Fault Department</label>
                                        <select value={rejectionDept} onChange={e => setRejectionDept(e.target.value)} style={{ ...s.input, opacity: 1, cursor: 'pointer' }} disabled={pendingRejects <= 0}>
                                            <option value="">-- Select Dept --</option>
                                            {['DTP', 'LASER', 'BENDING', 'CNC', 'ACRYLIC', 'POLISH', 'PAINTING', 'UV', 'STICKERING', 'PACKING'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleRejection} disabled={busy === 'REJECTION_HANDOVER' || pendingRejects <= 0}
                                    style={{ ...s.btn('#ef4444'), width: '100%', opacity: pendingRejects <= 0 ? 0.5 : 1, cursor: pendingRejects <= 0 ? 'not-allowed' : 'pointer' }}>
                                    {busy === 'REJECTION_HANDOVER' ? '⟳ Submitting...' : 'Handover Reject to Department'}
                                </button>
                            </div>
                        )}
                            </>
                        )}

                        {/* System Transaction Log */}
                        <div className="no-print" style={{ paddingTop: 28, borderTop: '1px solid #e2e8f0', marginTop: 24 }}>
                            <h5 style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 900, textDecoration: 'underline', textDecorationColor: '#e2e8f0' }}>
                                System Transaction Log
                            </h5>
                            {(!job.logs || job.logs.length === 0) ? (
                                <div style={{ fontSize: 12, opacity: 0.3, fontStyle: 'italic' }}>No transactions recorded yet</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {job.logs.slice().reverse().map((h, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 11, fontWeight: 700, borderBottom: '1px solid #f8fafc', paddingBottom: 4, fontStyle: 'italic', textTransform: 'uppercase', color: '#1e293b' }}>
                                            <span style={{ paddingTop: 2 }}>
                                                {h.type} {h.qty !== undefined ? `— ${h.qty} PCS` : ''} 
                                                {h.department ? ` TO [${h.department}] ` : ''}
                                                {h.good !== undefined ? `(Good: ${h.good}) ` : ''}
                                                {h.bad !== undefined ? `(Bad: ${h.bad})` : ''}
                                                {h.total !== undefined && h.qty === undefined ? `— ${h.total} PCS` : ''}
                                            </span>
                                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>{h.by || '—'}</div>
                                                <div style={{ fontSize: 10, opacity: 0.4, fontWeight: 900 }}>
                                                    {h.time}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                    @keyframes glow-orange {
                        0%   { box-shadow: 0 0 0px #f97316; }
                        50%  { box-shadow: 0 0 10px #f97316; }
                        100% { box-shadow: 0 0 0px #f97316; }
                    }
                    .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
                    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    .custom-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; scroll-behavior: smooth; }
                `}</style>
            </div>
        </>,
        document.body
    );
}
