import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../../../reducer/userReducer';
import { InfoItem } from './InfoItem';

export function HandoverModal({ job, onClose, onSubmit, onGenerateInvoice }) {
  const received = job.inward?.received || 0;
  const alreadyHandedOver = job.qc?.received || 0;
  const availableQty = received - alreadyHandedOver;

  const [qty, setQty] = useState('');
  const [handedBy, setHandedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [err, setErr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const { users = [] } = useSelector((state) => state.user || {});

  useEffect(() => {
    dispatch(fetchAllUsers({ is_active: 'true' }));
  }, [dispatch]);

  const qcUsers = users.filter(u => {
    const dName = (u.department_id?.name || u.departmentName || '').toLowerCase();
    const rName = (u.role?.name || u.roleName || '').toLowerCase();
    return dName.includes('quality control') || rName.includes('qc inspector');
  });

  const handleQtyChange = (val) => {
    if (val.includes('-')) return;
    const num = val === '' ? '' : Number(val);
    setQty(num);

    if (num !== '') {
      if (num > availableQty) setErr(`Total cannot exceed ${availableQty} ${job.uom} available`);
      else if (num < 1) setErr(`Min 1 ${job.uom} required`);
      else setErr('');
    } else setErr('');
  };

  const canSubmit = handedBy !== '' && qty > 0 && !err;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit(job.id, { total: Number(qty) || 0, by: handedBy, remarks });
    setIsSubmitting(false);
  };

  return (
    <div className="ct-backdrop" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 1000 }}>
        <div style={{ background: 'linear-gradient(to right, #1E3A8A, #2563EB)', padding: '18px 20px', position: 'relative', borderRadius: '12px 12px 0 0' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', width: 26, height: 26, borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
          >✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔎</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>Handover to QC</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#BFDBFE', marginTop: 2 }}>{job.job_no} · {job.product}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px', marginTop: 16 }}>
            <InfoItem label="Order Qty" value={`${job.order_qty} ${job.uom}`} light />
            <InfoItem label="Received" value={`${received} ${job.uom}`} light />
            <InfoItem label="Available for QC" value={`${availableQty} ${job.uom}`} light />
          </div>
        </div>

        <div className="modal-body scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto" style={{ padding: 20, maxHeight: '65vh', overflowY: 'auto' }}>
          {received === 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>
              No material has been received yet for this job — record an inward first.
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--txt2)', marginBottom: 6 }}>Handed Over By</label>
            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 13 }} value={handedBy} onChange={e => setHandedBy(e.target.value)}>
              <option value="">Select person...</option>
              {qcUsers.length > 0
                ? qcUsers.map((u, i) => <option key={i} value={u.name}>{u.name}</option>)
                : users.map((u, i) => <option key={i} value={u.name}>{u.name}</option>)}
            </select>
          </div>

          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#0369A1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>Qty Handed Over to QC</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <input
                type="number"
                disabled={availableQty <= 0}
                value={qty}
                placeholder={`Max ${availableQty}`}
                onChange={e => handleQtyChange(e.target.value)}
                style={{ width: 180, padding: '8px 14px', fontSize: 28, fontWeight: 900, color: '#0F172A', border: `2px solid ${err ? '#EF4444' : '#38BDF8'}`, borderRadius: 8, outline: 'none', background: '#fff', textAlign: 'center' }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>of {availableQty} {job.uom} available</span>
            </div>
            {err && <div style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', marginTop: 8, textTransform: 'uppercase', textAlign: 'center' }}>{err}</div>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--txt2)', marginBottom: 6 }}>Remarks (optional)</label>
            <textarea style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 13 }} rows="1" placeholder="Notes..." value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
          </div>

          <button
            style={{ width: '100%', padding: '14px 16px', background: canSubmit && !isSubmitting ? '#2563EB' : '#E2E8F0', color: canSubmit && !isSubmitting ? '#fff' : '#94A3B8', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            disabled={!canSubmit || isSubmitting}
            onClick={submit}
          >
            {isSubmitting ? 'Submitting...' : (canSubmit ? `Handover to QC — ${qty} ${job.uom}` : (handedBy === '' ? 'Select Handed Over By First' : 'Enter Qty to Handover'))}
          </button>

          {job.inward?.received - (job.invoice?.qty || 0) > 0 && onGenerateInvoice && (
            <button
              onClick={() => onGenerateInvoice(job)}
              style={{ width: '100%', padding: '14px 16px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}
            >
              Generate Invoice (Available: {job.inward.received - (job.invoice?.qty || 0)})
            </button>
          )}

          {/* Past Handovers History */}
          {job.logs && job.logs.filter(l => (l.type || l.action || '').toUpperCase().includes('HANDOVER')).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: 12 }}>Handover History</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {job.logs.filter(l => (l.type || l.action || '').toUpperCase().includes('HANDOVER')).slice().reverse().map((log, idx) => (
                  <div key={idx} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {log.type || log.action || 'HANDOVER'}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginTop: 2 }}>
                          {new Date(log.date || log.time || new Date()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>USER</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{log.user?.name || log.by || 'System'}</div>
                      </div>
                    </div>

                    {(log.qty !== undefined || log.good !== undefined || log.bad !== undefined) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {log.qty !== undefined && (
                          <div style={{ fontSize: 10, fontWeight: 800, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6 }}>
                            QTY: {log.qty}
                          </div>
                        )}
                        {log.good !== undefined && (
                          <div style={{ fontSize: 10, fontWeight: 800, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '3px 8px', borderRadius: 6 }}>
                            GOOD: {log.good}
                          </div>
                        )}
                        {log.bad !== undefined && (
                          <div style={{ fontSize: 10, fontWeight: 800, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '3px 8px', borderRadius: 6 }}>
                            BAD: {log.bad}
                          </div>
                        )}
                      </div>
                    )}

                    {log.remarks && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 'auto', fontStyle: 'italic', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, wordBreak: 'break-word' }}>
                        "{log.remarks}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}