import React from 'react';
import { formatDateSafe } from '../../../../utils/dateUtils';

export function QcViewDrawer({ job, onClose }) {
  if (!job) return null;

  return (
    <div className="ct-backdrop" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 800 }}>
        <div style={{ background: 'linear-gradient(to right, #0F172A, #1E293B)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>{job.job_no}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#38BDF8', marginTop: 4, textTransform: 'uppercase' }}>
              {job.client_name || '-'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>{job.product}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div className="modal-body scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto" style={{ padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Job Completion Date</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                {formatDateSafe(job.job_completion_date, { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Delivery Date</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                {formatDateSafe(job.delivery_date, { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

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
                                  {h.type || h.action} {h.qty !== undefined ? `— ${h.qty} PCS` : ''} 
                                  {h.good !== undefined ? `(Good: ${h.good}) ` : ''}
                                  {h.bad !== undefined ? `(Bad: ${h.bad})` : ''}
                                  {h.total !== undefined && h.qty === undefined ? `— ${h.total} PCS` : ''}
                              </span>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                                  <div style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>{h.by || h.user?.name || '—'}</div>
                                  <div style={{ fontSize: 10, opacity: 0.4, fontWeight: 900 }}>
                                      {h.time || (h.date ? new Date(h.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '')}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
