import React, { useState, useMemo } from "react";
import { downloadInvoicePDFDirect, downloadAllInvoices } from "../utils/accountsFormatters";

export default function InvoiceModal({ data, allJobs = [], onClose }) {
  const [search, setSearch] = useState("");
  const subJob = data?.subJob || null;

  // Compile list of invoices to display
  const invoiceList = useMemo(() => {
    if (subJob) {
      if (Array.isArray(subJob.invoices) && subJob.invoices.length > 0) {
        return subJob.invoices;
      }
      if (subJob.bilDocs?.invoice) {
        return [{
          id: subJob.sub_job_no || subJob.id,
          invoiceNo: subJob.inv || `${subJob.sub_job_no || subJob.id}_INV`,
          sub_job_no: subJob.sub_job_no || subJob.id,
          job_no: subJob.job_no,
          client: subJob.client,
          product: subJob.product,
          qty: subJob.qty || 1,
          totalAmt: subJob.totalWithGst || subJob.amount || 0,
          by: subJob.bilDocs.invoice.by || 'Accounts',
          dt: subJob.bilDocs.invoice.dt || subJob.bilAt || '—',
          url: subJob.bilDocs.invoice.url || '',
          downloadUrl: subJob.bilDocs.invoice.downloadUrl || '',
          n: subJob.bilDocs.invoice.n || `${subJob.sub_job_no || subJob.id}_Invoice.pdf`
        }];
      }
      return [];
    }

    // All invoices across all jobs
    const all = [];
    (allJobs || []).forEach(j => {
      if (Array.isArray(j.invoices) && j.invoices.length > 0) {
        all.push(...j.invoices);
      } else if (j.bilDocs?.invoice) {
        all.push({
          id: j.sub_job_no || j.id,
          invoiceNo: j.inv || `${j.sub_job_no || j.id}_INV`,
          sub_job_no: j.sub_job_no || j.id,
          job_no: j.job_no,
          client: j.client,
          product: j.product,
          qty: j.qty || 1,
          totalAmt: j.totalWithGst || j.amount || 0,
          by: j.bilDocs.invoice.by || 'Accounts',
          dt: j.bilDocs.invoice.dt || j.bilAt || '—',
          url: j.bilDocs.invoice.url || '',
          downloadUrl: j.bilDocs.invoice.downloadUrl || '',
          n: j.bilDocs.invoice.n || `${j.sub_job_no || j.id}_Invoice.pdf`
        });
      }
    });
    return all;
  }, [subJob, allJobs]);

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoiceList;
    const q = search.trim().toLowerCase();
    return invoiceList.filter(inv => {
      return (
        String(inv.invoiceNo || "").toLowerCase().includes(q) ||
        String(inv.sub_job_no || "").toLowerCase().includes(q) ||
        String(inv.job_no || "").toLowerCase().includes(q) ||
        String(inv.client || "").toLowerCase().includes(q) ||
        String(inv.product || "").toLowerCase().includes(q) ||
        String(inv.by || "").toLowerCase().includes(q) ||
        String(inv.n || "").toLowerCase().includes(q)
      );
    });
  }, [invoiceList, search]);

  const totalValue = filteredInvoices.reduce((s, i) => s + (Number(i.totalAmt) || 0), 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12, 26, 46, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          border: '1px solid #CBD5E1'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: '#0C1A2E',
            color: '#FFF',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1E293B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🧾</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, color: '#FFF' }}>
                {subJob ? `Invoice PDFs · ${subJob.sub_job_no || subJob.id}` : 'All Tax Invoices Repository'}
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                {subJob
                  ? `${subJob.client || 'Client'} · ${subJob.product || 'Product'} · ${filteredInvoices.length} invoice(s)`
                  : `Showing ${filteredInvoices.length} of ${invoiceList.length} total invoice PDF(s)`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {filteredInvoices.length > 0 && (
              <button
                onClick={() => downloadAllInvoices(filteredInvoices)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0D9488',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                title="Download all listed invoices"
              >
                <span>📥</span>
                <span>Download All ({filteredInvoices.length})</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: 20,
                cursor: 'pointer',
                padding: '2px 6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', fontSize: 13 }}>🔍</span>
            <input
              type="text"
              placeholder="Search Invoice No, Sub-Job, Client, User..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 28px 7px 30px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11 }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Total Value: <b style={{ color: '#0C1A2E', fontFamily: 'monospace' }}>Rs {totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
            </span>
          </div>
        </div>

        {/* Invoices List Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>No invoice PDFs found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {search ? "No matches for your search query." : "No tax invoices have been generated or attached for this selection yet."}
              </div>
            </div>
          ) : (
            filteredInvoices.map((inv, idx) => (
              <div
                key={inv.id || inv.invoiceNo || idx}
                style={{
                  background: '#FFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#2563EB', flexShrink: 0 }}>
                    📄
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: '#0C1A2E', fontFamily: 'monospace' }}>
                        {inv.invoiceNo || inv.n}
                      </span>
                      <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                        Tax Invoice
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                      <b style={{ color: '#0D9488' }}>{inv.sub_job_no || "—"}</b> · {inv.client || "Client"} · {inv.product || "Custom Trophy"}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      Generated by <b style={{ color: '#475569' }}>{inv.by || "Accounts"}</b> · {inv.dt || inv.date || "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                      Rs {Number(inv.totalAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                      Qty: <b>{inv.qty || 1}</b> {inv.gstPct ? `· GST ${inv.gstPct}%` : ""}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {inv.url && (
                      <button
                        onClick={() => window.open(inv.url, '_blank')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#F1F5F9',
                          color: '#334155',
                          border: '1px solid #CBD5E1',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Open PDF Preview in new tab"
                      >
                        <span>👁️</span>
                        <span>Preview</span>
                      </button>
                    )}
                    <button
                      onClick={() => downloadInvoicePDFDirect(inv)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#0D9488',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Download this specific invoice PDF"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            Showing <b>{filteredInvoices.length}</b> invoice PDF document(s)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: '#FFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            {filteredInvoices.length > 0 && (
              <button
                onClick={() => downloadAllInvoices(filteredInvoices)}
                style={{
                  background: '#0D9488',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>📥</span>
                <span>Download All ({filteredInvoices.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
