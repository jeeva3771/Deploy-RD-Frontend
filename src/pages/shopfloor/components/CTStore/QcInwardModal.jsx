import React, { useState } from 'react';
import { InfoItem } from './InfoItem';
import { OPERATORS } from './constants';

export function QcInwardModal({ job, onClose, onSubmit }) {
  // Find QC record available to inward
  // From CTStore, we should pass available_to_qc
  const availableToQC = job.qc?.pending || 0; // we'll calculate this in CTStore

  const [goodQty, setGoodQty] = useState('');
  const [badQty, setBadQty] = useState('');
  const [handedBy, setHandedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [err, setErr] = useState('');

  const handleQtyChange = (val, type) => {
    if (val.includes('-')) return;
    const num = val === '' ? '' : Number(val);

    let newGood = type === 'good' ? num : goodQty;
    let newBad = type === 'bad' ? num : badQty;

    const sum = (Number(newGood) || 0) + (Number(newBad) || 0);

    if (type === 'good') setGoodQty(num === '' ? '' : num);
    if (type === 'bad') setBadQty(num === '' ? '' : num);

    if (sum > availableToQC) setErr(`Total cannot exceed ${availableToQC} ${job.uom} available for QC`);
    else if (sum < 1 && (newGood !== '' || newBad !== '')) setErr(`Min 1 ${job.uom} required`);
    else setErr('');
  };

  const total = (Number(goodQty) || 0) + (Number(badQty) || 0);
  const canSubmit = handedBy !== '' && availableToQC > 0 && total > 0 && total <= availableToQC && !err;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(job.id, { good: Number(goodQty) || 0, bad: Number(badQty) || 0, by: handedBy, remarks });
  };

  return (
    <div className="ct-backdrop" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ background: 'linear-gradient(to right, #1E3A8A, #2563EB)', padding: '18px 20px', position: 'relative', borderRadius: '12px 12px 0 0' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', width: 26, height: 26, borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
          >✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔎</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>QC Inward Check</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#BFDBFE', marginTop: 2 }}>{job.job_no} · {job.product}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginTop: 16 }}>
            <InfoItem label="Order Qty" value={`${job.order_qty} ${job.uom}`} light />
            <InfoItem label="Pending QC" value={`${availableToQC} ${job.uom}`} light />
          </div>
        </div>

        <div className="modal-body" style={{ padding: 20 }}>
          {availableToQC === 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>
              No material is pending for QC.
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--txt2)', marginBottom: 6 }}>Checked By</label>
            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 13 }} value={handedBy} onChange={e => setHandedBy(e.target.value)}>
              <option value="">Select person...</option>
              {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#0369A1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>QC Good / Bad Check</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', marginBottom: 4 }}>Good Qty</label>
                <input
                  type="number"
                  disabled={availableToQC <= 0}
                  value={goodQty}
                  onChange={e => handleQtyChange(e.target.value, 'good')}
                  style={{ width: '100%', padding: '8px', fontSize: 20, fontWeight: 900, color: '#16A34A', border: '2px solid #86EFAC', borderRadius: 8, outline: 'none', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: 4 }}>Bad Qty</label>
                <input
                  type="number"
                  disabled={availableToQC <= 0}
                  value={badQty}
                  onChange={e => handleQtyChange(e.target.value, 'bad')}
                  style={{ width: '100%', padding: '8px', fontSize: 20, fontWeight: 900, color: '#DC2626', border: '2px solid #FCA5A5', borderRadius: 8, outline: 'none', textAlign: 'center' }}
                />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>Available for QC: {availableToQC} {job.uom}</span>
            </div>
            {err && <div style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', marginTop: 8, textTransform: 'uppercase', textAlign: 'center' }}>{err}</div>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--txt2)', marginBottom: 6 }}>Remarks (optional)</label>
            <textarea style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 13 }} rows="1" placeholder="Notes..." value={remarks} onChange={e => setRemarks(e.target.value)}></textarea>
          </div>

          <button
            style={{ width: '100%', padding: '14px 16px', background: canSubmit ? '#2563EB' : '#E2E8F0', color: canSubmit ? '#fff' : '#94A3B8', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            disabled={!canSubmit}
            onClick={submit}
          >
            {canSubmit ? `Confirm QC Check — ${total} ${job.uom}` : (handedBy === '' ? 'Select Person First' : 'Enter Good or Bad Qty')}
          </button>
        </div>
      </div>
    </div>
  );
}
