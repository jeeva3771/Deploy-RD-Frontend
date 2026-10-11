import React from 'react';

export default function JobDetailModal({ job, floors, getInwardLogs, getInwardTotals, onClose }) {
  const totals = getInwardTotals(job.id);
  const logs = getInwardLogs(job.id);
  return (
    <div className="ct-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hdr">
          <span className="modal-title">Job Progression Dossier</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900 }}>{job.id} — {job.product}</h3>
            <p style={{ fontSize: 12, color: 'var(--txt2)' }}>Client: {job.client} · Qty: {job.qty} units</p>
          </div>
          <div className="divider" />
          <div className="sec-lbl">Material Inward totals</div>
          <div className="g2" style={{ marginBottom: 12 }}>
            <div style={{ background: 'var(--bg3)', padding: 8, borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--grn)' }}>{totals.totalGood} pcs</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--txt3)' }}>Good Issued</div>
            </div>
            <div style={{ background: 'var(--bg3)', padding: 8, borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--red)' }}>{totals.totalBad} pcs</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--txt3)' }}>Rejected</div>
            </div>
          </div>
          <div className="sec-lbl">Process Inward Audit Trail</div>
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {logs.map((l, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 8px',
                  background: 'var(--bg3)',
                  border: '1px solid var(--bdr)',
                  borderRadius: 8,
                  marginBottom: 4,
                  fontSize: 11
                }}
              >
                <b>{l.date}</b> @ {l.deptName} - Received: {l.qty} pcs (Good: {l.goodQty}, Bad: {l.badQty}) by <i>{l.receiver}</i>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
