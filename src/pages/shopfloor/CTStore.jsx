import React, { useState, useMemo } from 'react';
import '../controltower/ControlTower.css';
import { StatusPill, StageTrack, downloadInvoicePDF, InwardModal, HandoverModal, QcInwardModal, StageDrawer, InvoicePage } from './components/CTStore';
import { axiosInstance } from '../../utils/url/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFgStoreJobs, syncFgStoreJobs, submitFgStoreInward, submitFgStoreHandover, submitFgStoreInvoice } from '../../reducer/fgStoreReducer';
import ImageLightbox from '../common/ImageLightbox';
import DeliveryPriorityColor from '../../components/deliveryPriorityColor/priorityColor';
import { formatDateSafe } from '../../utils/dateUtils';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import { useLoader } from '../../context/LoaderContext';

const METRIC_DEFS = [
  { key: 'INWARD', label: 'Awaiting Inward', color: '#F59E0B' },
  { key: 'QC', label: 'In QC', color: '#3B82F6' },
  { key: 'PACKING', label: 'In Packing', color: '#14B8A6' },
  { key: 'INVOICE', label: 'Ready to Invoice', color: '#8B5CF6' },
  { key: 'DISPATCHED', label: 'Dispatched', color: '#10B981' },
];

export default function CTStore() {
  const dispatch = useDispatch();
  const { jobs, loading, counts = {}, pagination = { page: 1, totalPages: 1 } } = useSelector((state) => state.fgStore);
  const { user } = useSelector((state) => state.auth || {});
  const { showLoader, hideLoader } = useLoader();
  const loginUserName = user?.name || 'System';

  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inwardJob, setInwardJob] = useState(null);
  const [handoverJob, setHandoverJob] = useState(null);
  const [drawerJob, setDrawerJob] = useState(null);
  const [invoiceJob, setInvoiceJob] = useState(null);
  const [qcInwardJob, setQcInwardJob] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchJobs = React.useCallback(async () => {
    showLoader();
    try {
      await dispatch(fetchFgStoreJobs({ page, limit, stage: filter, search: debouncedSearch })).unwrap();
    } catch (err) {
      console.error("Failed to fetch FG store jobs:", err);
    } finally {
      hideLoader();
    }
  }, [dispatch, page, limit, filter, debouncedSearch, showLoader, hideLoader]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Counts are now coming from the Redux state (computed in backend)
  const filtered = jobs; // Filter is done on backend now

  // Step 1: record material received — quantity only, no QC split
  const handleInwardSubmit = async (jobId, entry) => {
    showLoader();
    try {
      await dispatch(submitFgStoreInward({ jobId, payload: { ...entry, by: loginUserName } })).unwrap();
      fetchJobs();
      setInwardJob(null);
      toast.success('Inward recorded successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error(msg);
    } finally {
      hideLoader();
    }
  };

  // Step 2: handover a chosen qty to QC
  const handleHandoverSubmit = async (jobId, entry) => {
    showLoader();
    try {
      await dispatch(submitFgStoreHandover({ jobId, payload: entry })).unwrap();
      fetchJobs();
      setHandoverJob(null);
      toast.success('Handed over to QC successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error(msg);
    } finally {
      hideLoader();
    }
  };

  // Generate Invoice — records invoice in backend
  const handleInvoiceSubmit = async (jobId, entry) => {
    showLoader();
    try {
      const result = await dispatch(submitFgStoreInvoice({ jobId, payload: entry })).unwrap();

      fetchJobs();
      setInvoiceJob(null);
      toast.success('Invoice generated successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error('Error generating invoice: ' + msg);
    } finally {
      hideLoader();
    }
  };

  // Default click target for a row — buttons in the Action column still open the exact modal requested
  const rowClick = (j) => {
    if (j.stage === 'INWARD') {
      if (j.inward.received >= j.order_qty) setHandoverJob(j);
      else setInwardJob(j);
    } else {
      setDrawerJob(j);
    }
  };

  // While an invoice is open, the FG page content is fully hidden and replaced by the
  // full-page Invoice view. Closing/back returns to the default FG page.
  if (invoiceJob) {
    return (
      <div className="ct-scope" style={{ padding: '20px' }}>
        <InvoicePage
          job={invoiceJob}
          onBack={() => setInvoiceJob(null)}
          onSubmit={handleInvoiceSubmit}
        />
      </div>
    );
  }

  return (
    <div className="ct-scope" style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🏬</span>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--txt)' }}>FG Store</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt3)', marginLeft: 34 }}>Material Inward · QC · Packing · Invoice · Dispatch Tracker</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', display: 'flex', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              type="text"
              placeholder="Search Job, Sub-Job, Client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 30px 8px 32px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--txt)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--txt3)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 12
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={async () => {
              if (isSyncing) return;
              setIsSyncing(true);
              showLoader();
              try {
                const res = await dispatch(syncFgStoreJobs()).unwrap();
                toast.success(res.message || 'Synced successfully!');
                fetchJobs();
              } catch (err) {
                const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
                toast.error(msg);
              } finally {
                setIsSyncing(false);
                hideLoader();
              }
            }}
            disabled={isSyncing}
            style={{
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Syncing...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>
                Sync Shopfloor Jobs
              </>
            )}
          </button>
        </div>
      </div>

      <div className="g5" style={{ marginBottom: 16 }}>
        <div className={`metric ${filter === 'ALL' ? 'active' : ''}`} onClick={() => { setFilter('ALL'); setPage(1); }} style={{ cursor: 'pointer', border: filter === 'ALL' ? '2px solid var(--teal)' : '' }}>
          <span className="metric-lbl">All Jobs</span>
          <span className="metric-val">{counts['ALL'] || 0}</span>
          <span className="metric-sub">Total in pipeline</span>
        </div>
        {METRIC_DEFS.map(m => (
          <div className={`metric ${filter === m.key ? 'active' : ''}`} key={m.key} onClick={() => { setFilter(m.key); setPage(1); }} style={{ cursor: 'pointer', border: filter === m.key ? `2px solid ${m.color}` : '' }}>
            <span className="metric-lbl">{m.label}</span>
            <span className="metric-val" style={{ color: m.color }}>{counts[m.key] || 0}</span>
            <span className="metric-sub">jobs</span>
          </div>
        ))}
      </div>

      <div className="op-grid">
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)', gridColumn: '1/-1' }}>No jobs in this stage</div>}
        {filtered.map(j => {
          const readyForHandover = j.stage === 'INWARD' && j.inward.received >= j.order_qty;

          let pillColor = 'teal';

          if (j.stage === 'INWARD') {
            pillColor = 'magenta';
          } else if (j.stage === 'QC') {
            pillColor = 'purple';
          } else if (j.stage === 'PACKING') {
            pillColor = 'amber';
          }

          const [baseNo, suffix] = j.job_no.split('/');

          return (
            <div key={j.id} className="op-card" style={{ padding: 0 }}>
              <DeliveryPriorityColor
                deliveryDate={j.job_completion_date || j.delivery_date}
                className="w-full"
                style={{ height: '6px' }}
                containerStyle={{ display: 'block', width: '100%' }}
              />
              <div className="op-card-hdr">
                <div className="op-card-title">
                  {baseNo} {suffix ? `- ${suffix}` : ''}
                </div>
                <div className="op-card-pills">
                  <div className={`op-card-pill ${pillColor}`}>{j.stage}</div>
                  {(j.job_completion_date || j.delivery_date) && (
                    <DeliveryPriorityColor
                      deliveryDate={j.job_completion_date || j.delivery_date}
                      showPriorityName={true}
                      badgeClassName="!text-[9px] !font-[900] !py-[2px] !px-2 uppercase !rounded-full border shadow-sm"
                    />
                  )}
                </div>
              </div>

              {j.product_image ? (
                <div
                  className="op-card-img group relative"
                  style={{
                    height: 140,
                    borderRadius: 8,
                    marginBottom: 12,
                    marginTop: 12,
                    backgroundColor: '#f8f9fa',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'zoom-in'
                  }}
                  onClick={() => setPreviewImage(j.product_image)}
                >
                  <img
                    src={j.product_image}
                    alt={j.product}
                    style={{ width: '95%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-all"></div>
                </div>
              ) : (
                <div className="op-card-img-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <div style={{ fontSize: 11 }}>No Image</div>
                </div>
              )}

              <div className="op-card-metrics-grid">
                <div className="op-metric-item">
                  <div className="op-metric-label">QTY</div>
                  <div className="op-metric-value">{j.order_qty}</div>
                </div>
                {/* <div className="op-metric-item">
                  <div className="op-metric-label">DESIGNER</div>
                  <div className="op-metric-value" style={{ color: '#3b82f6' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    testdesigner
                  </div>
                </div> */}
                <div className="op-metric-item" style={{ textAlign: 'center', alignItems: 'center' }}>
                  <div className="op-metric-label">PRODUCT</div>
                  <div className="op-metric-value" title={j.product} style={{ justifyContent: 'center' }}>{j.product}</div>
                </div>
                <div className="op-metric-item" style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                  <div className="op-metric-label">DELIVERY</div>
                  <div className="op-metric-value red" style={{ justifyContent: 'flex-end' }}>
                    {formatDateSafe(j.job_completion_date || j.delivery_date)}
                  </div>
                </div>
              </div>

              <div className="op-card-divider"></div>

              <div className="op-card-btn-grid" style={{ display: 'flex', gap: '8px' }}>
                <button className="op-btn2 op-btn2-view" style={{ flex: 1 }} onClick={() => setDrawerJob(j)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  View
                </button>
                {j.inward.received < j.order_qty && (
                  <button className="op-btn2 op-btn2-inward" style={{ flex: 1 }} onClick={() => setInwardJob(j)}>
                    Inward
                  </button>
                )}
                {j.inward.received > j.qc.received && (
                  <button className="op-btn2 op-btn2-handover" style={{ flex: 1 }} onClick={() => setHandoverJob(j)}>
                    Handover QC
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages || 1}
          onPageChange={(newPage) => setPage(newPage)}
          itemsPerPage={limit}
          onItemsPerPageChange={(newLimit) => setLimit(newLimit)}
          totalCount={pagination.total || 0}
          startIndex={(page - 1) * limit}
          visibleItemCount={filtered.length}
          customOptions={[8, 16, 24, 32]}
        />
      </div>

      {inwardJob && <InwardModal job={inwardJob} onClose={() => setInwardJob(null)} onSubmit={handleInwardSubmit} onGenerateInvoice={(j) => { setInwardJob(null); setInvoiceJob(j); }} />}
      {handoverJob && <HandoverModal job={handoverJob} onClose={() => setHandoverJob(null)} onSubmit={handleHandoverSubmit} onGenerateInvoice={(j) => { setHandoverJob(null); setInvoiceJob(j); }} />}
      {drawerJob && <StageDrawer job={drawerJob} onClose={() => setDrawerJob(null)} onGenerateInvoice={(j) => { setDrawerJob(null); setInvoiceJob(j); }} />}

      {/* Image Lightbox */}
      <ImageLightbox
        src={previewImage}
        fileName="FG Store Image"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

