import React from 'react';
import { StageTrack } from './StageTrack';
import { DetailBox } from './DetailBox';
import { STAGE_MESSAGES } from './constants';
import { PACK_STAGES } from '../CTPack/constants';
import { formatDateSafe } from '../../../../utils/dateUtils';

export function StageDrawer({ job, onClose, onGenerateInvoice }) {
  const balanceInward = job.order_qty - job.inward.received;
  const handoverQty = job.inward.good || 0;
  const balanceQc = job.order_qty - handoverQty;
  const packedQty = job.packing?.packed || 0;
  const balancePacking = job.order_qty - job.inward.received;
  const invoicedQty = job.invoice?.qty || 0;
  const pendingInvoice = job.order_qty - invoicedQty;
  const dispatchQty = job.dispatch?.qty || 0;
  const pendingDispatch = job.order_qty - dispatchQty;
  const invoiceCompleted = invoicedQty >= job.order_qty;

  const packStageId = job.pack?.stage || 'qc_pending';
  const currentPackStageIdx = PACK_STAGES.findIndex(s => s.id === packStageId);
  const currentPackStage = PACK_STAGES.find(s => s.id === packStageId) || PACK_STAGES[0];

  return (
    <div className="ct-backdrop" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 1000 }}>
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
        <div className="modal-body scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto" style={{ padding: 20 }}>
          {/* <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>Pipeline Progress</div>
            <StageTrack stage={job.stage} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontWeight: 800, color: '#94A3B8' }}>
              <span>INWARD</span><span>QC</span><span>PACKING</span><span>INVOICE</span><span>DISPATCHED</span>
            </div>
          </div> */}

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

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>Inward Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <DetailBox label="Order Qty" value={job.order_qty} bg="#fff" border="#E2E8F0" color="#0F172A" />
              <DetailBox label="Inward Qty" value={job.inward?.received || 0} bg="#F0FDFA" border="#99F6E4" color="#0D9488" />
              <DetailBox label="Balance Qty" value={balanceInward} bg="#FFFBEB" border="#FDE68A" color="#B45309" />
              <DetailBox label="Handover to QC" value={job.qc?.received || handoverQty || 0} bg="#FDF4FF" border="#F5D0FE" color="#C026D3" />
            </div>
          </div>

          {/* {job.stage === 'QC' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <DetailBox label="Order Qty" value={job.order_qty} bg="#fff" border="#E2E8F0" color="#0F172A" />
              <DetailBox label="Handover Qty" value={handoverQty} bg="#EFF6FF" border="#BFDBFE" color="#1D4ED8" />
              <DetailBox label="Balance Qty" value={balanceQc} bg="#FFFBEB" border="#FDE68A" color="#B45309" />
            </div>
          )} */}

          {/* {job.stage === 'PACKING' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              <DetailBox label="Order Qty" value={job.order_qty} bg="#fff" border="#E2E8F0" color="#0F172A" />
              <DetailBox label="Inward Qty" value={job.inward.received} bg="#F0FDFA" border="#99F6E4" color="#0D9488" />
              <DetailBox label="Balance Qty" value={balancePacking} bg="#FFFBEB" border="#FDE68A" color="#B45309" />
              <DetailBox label="Packed Qty" value={packedQty} bg="#F0FDF4" border="#BBF7D0" color="#16A34A" />
            </div>
          )} */}

          {/* {job.stage === 'INVOICE' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <DetailBox label="Order Qty" value={job.order_qty} bg="#fff" border="#E2E8F0" color="#0F172A" />
              <DetailBox label="Completed Invoice Qty" value={invoicedQty} bg="#FAF5FF" border="#E9D5FF" color="#7C3AED" />
              <DetailBox label="Pending Invoice Qty" value={pendingInvoice} bg="#FFFBEB" border="#FDE68A" color="#B45309" />
            </div>
          )} */}

          {/* {job.stage === 'DISPATCHED' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <DetailBox label="Order Qty" value={job.order_qty} bg="#fff" border="#E2E8F0" color="#0F172A" />
              <DetailBox label="Dispatch Qty" value={dispatchQty} bg="#F0FDF4" border="#BBF7D0" color="#16A34A" />
              <DetailBox label="Pending Qty" value={pendingDispatch} bg="#FFFBEB" border="#FDE68A" color="#B45309" />
            </div>
          )} */}

          {job.stage !== 'DISPATCHED' && (
            <div style={{ marginBottom: 20 }}>
              {job.inward.received === 0 ? (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 1 }}>No received quantity to invoice</span>
                </div>
              ) : job.inward.received - invoicedQty <= 0 ? (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#15803D', textTransform: 'uppercase', letterSpacing: 1 }}>✓ Fully Invoiced for Received Qty</span>
                </div>
              ) : (
                <button
                  onClick={() => onGenerateInvoice(job)}
                  style={{ width: '100%', padding: '12px 16px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >Generate Invoice (Available: {job.inward.received - invoicedQty})</button>
              )}
            </div>
          )}

          {job.qc && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>QC Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <DetailBox label="Arrival (QC)" value={job.qc.arrived || 0} bg="#F8FAFC" border="#E2E8F0" color="#475569" />
                <DetailBox label="Failed (Bad)" value={job.qc.bad || 0} bg="#FEF2F2" border="#FECACA" color="#DC2626" />
                <DetailBox label="Packing Release" value={job.qc.released_to_packing || 0} bg="#EFF6FF" border="#BFDBFE" color="#2563EB" />
                <DetailBox label="Rejection Cycle" value={job.qc.rejected_handover || 0} bg="#FFFBEB" border="#FDE68A" color="#D97706" />
              </div>
            </div>
          )}

          {/* CTPack Overview & Stage Track Pipeline */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📫 Packing &amp; Logistics Overview (Packing)
              </div>
              {job.pack && currentPackStage && (
                <span style={{ background: currentPackStage.bg, color: currentPackStage.color, border: `1px solid ${currentPackStage.border}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{currentPackStage.icon}</span>
                  <span>Stage: {currentPackStage.label}</span>
                </span>
              )}
            </div>

            {job.pack ? (
              <>
                {/* 8-Stage CTPack Pipeline Tracker */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                    Active Stage Pipeline Track
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    {PACK_STAGES.map((s, i) => {
                      const isDone = currentPackStageIdx > i;
                      const isCurrent = currentPackStageIdx === i;
                      return (
                        <React.Fragment key={s.id}>
                          <div style={{
                            flex: 1, minWidth: 90, background: isCurrent ? s.bg : isDone ? '#F1F5F9' : '#FFFFFF',
                            border: `1.5px solid ${isCurrent ? s.color : isDone ? '#CBD5E1' : '#E2E8F0'}`,
                            borderRadius: 8, padding: '6px 8px', textAlign: 'center', opacity: isCurrent ? 1 : isDone ? 0.85 : 0.45,
                            boxShadow: isCurrent ? `0 0 0 2px ${s.border}` : 'none', transition: 'all 0.2s'
                          }}>
                            <div style={{ fontSize: 14, marginBottom: 2 }}>{isDone ? '✅' : s.icon}</div>
                            <div style={{ fontSize: 10, fontWeight: isCurrent ? 900 : 700, color: isCurrent ? s.color : isDone ? '#334155' : '#94A3B8', textTransform: 'uppercase', lineHeight: 1.1 }}>
                              {s.label}
                            </div>
                          </div>
                          {i < PACK_STAGES.length - 1 && (
                            <div style={{ color: isDone ? '#94A3B8' : '#CBD5E1', fontSize: 12, flexShrink: 0 }}>→</div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* CTPack Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  <DetailBox label="HandOver By QC" value={job.pack.received_from_qc || 0} bg="#FFFBEB" border="#FDE68A" color="#D97706" />
                  <DetailBox label="Bal to Inward" value={(job.pack.received_from_qc || 0) - (job.pack.qc_accepted_qty || 0)} bg="#FEF3C7" border="#FDE68A" color="#B45309" />
                  <DetailBox label="Dispatched" value={job.pack.delivered_qty || 0} bg="#F0FDFA" border="#99F6E4" color="#0D9488" />
                  <DetailBox label="Box Count" value={`${job.pack.box_count || 0} box(es)`} bg="#F5F3FF" border="#DDD6FE" color="#7C3AED" />
                  <DetailBox label="Pack Status" value={job.pack.status || "Pending"} bg="#ECFDF5" border="#A7F3D0" color="#059669" />
                </div>
              </>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📦</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Packing Not Initiated Yet
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>
                  Awaiting QC inspection pass &amp; handover to CTPack.
                </div>
              </div>
            )}
          </div>

          {job.invoices && job.invoices.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: 8 }}>Generated Invoices</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...job.invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((inv, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#0F172A' }}>{inv.invoiceNo}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginTop: 2 }}>{inv.qty} {job.uom} · ₹{Number(inv.totalAmt).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          if (inv.pdf_url) {
                            window.open(inv.pdf_url, '_blank');
                          } else {
                            import('./downloadInvoicePDF').then(({ downloadInvoicePDF }) => {
                              downloadInvoicePDF(job, inv, inv.invoiceNo, {}, {
                                name: job.client_name,
                                address: job.client_address,
                                phone: job.client_phone,
                                email: job.client_email
                              }, 'view');
                            });
                          }
                        }}
                        style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#475569', cursor: 'pointer' }}
                        title="View / Print"
                      >
                        View / Print 🖨️
                      </button>
                      {/* <button
                        onClick={() => {
                          if (inv.pdf_url) {
                            window.open(inv.pdf_url, '_blank');
                          } else {
                            import('./downloadInvoicePDF').then(({ downloadInvoicePDF }) => {
                              downloadInvoicePDF(job, inv, inv.invoiceNo, {}, {
                                name: job.client_name,
                                address: job.client_address,
                                phone: job.client_phone,
                                email: job.client_email
                              }, 'print');
                            });
                          }
                        }}
                        style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#475569', cursor: 'pointer' }}
                        title="Print PDF"
                      >
                        🖨️
                      </button> */}
                      {/* <button
                        onClick={() => {
                          if (inv.pdf_url) {
                            const link = document.createElement('a');
                            link.href = inv.pdf_url;
                            link.target = '_blank';
                            link.download = `${inv.invoiceNo}.pdf`;
                            link.click();
                          } else {
                            import('./downloadInvoicePDF').then(({ downloadInvoicePDF }) => {
                              downloadInvoicePDF(job, inv, inv.invoiceNo, {}, {
                                name: job.client_name,
                                address: job.client_address,
                                phone: job.client_phone,
                                email: job.client_email
                              }, 'download');
                            });
                          }
                        }}
                        style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#475569', cursor: 'pointer' }}
                        title="Download PDF"
                      >
                        ⬇️
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* <div style={{ height: 1, background: '#E2E8F0', margin: '0 -20px 20px' }}></div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: 12 }}>Current Status</div> */}
          {/* <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F766E', lineHeight: 1.4 }}>{STAGE_MESSAGES[job.stage]}</span>
          </div> */}

          {job.logs && job.logs.length > 0 && (
            <div>
              <div style={{ height: 1, background: '#E2E8F0', margin: '0 -20px 20px' }}></div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: 12 }}>System Audit Logs</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {job.logs.slice().reverse().map((log, idx) => (
                  <div key={idx} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {log.type || log.action || 'System Update'}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginTop: 2 }}>
                          {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>USER</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{log.user?.name || log.by || 'System'}</div>
                      </div>
                    </div>

                    {/* Render Qty details if available */}
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
                    {log.details && !log.remarks && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 'auto', fontStyle: 'italic', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, wordBreak: 'break-word' }}>
                        "{log.details}"
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