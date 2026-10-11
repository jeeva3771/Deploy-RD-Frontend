import React, { useState, useMemo } from 'react';
import '../controltower/ControlTower.css';
import { QcPanel } from './components/CTStore';
import { axiosInstance } from '../../utils/url/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCtQcJobs, submitCtQcArrival, submitCtQcInward, submitCtQcHandover, submitCtQcRejectionHandover } from '../../reducer/ctQcReducer';
import ImageLightbox from '../common/ImageLightbox';
import DeliveryPriorityColor from '../../components/deliveryPriorityColor/priorityColor';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import { useLoader } from '../../context/LoaderContext';

export default function CTQc() {
  const dispatch = useDispatch();
  const { jobs = [], loading, counts = {}, pagination = { page: 1, totalPages: 1 } } = useSelector((state) => state.ctQc || {});
  const { user } = useSelector((state) => state.auth || {});
  const { showLoader, hideLoader } = useLoader();
  const loginUserName = user?.name || 'System';

  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [selectedJob, setSelectedJob] = useState(null);
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
      await dispatch(fetchCtQcJobs({ page, limit, status: filter, search: debouncedSearch })).unwrap();
    } catch (err) {
      console.error("Failed to fetch QC jobs:", err);
    } finally {
      hideLoader();
    }
  }, [dispatch, page, limit, filter, debouncedSearch, showLoader, hideLoader]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  React.useEffect(() => {
    if (selectedJob) {
      const updatedJob = jobs.find(j => j.id === selectedJob.id);
      if (updatedJob && JSON.stringify(updatedJob) !== JSON.stringify(selectedJob)) {
        setSelectedJob(updatedJob);
      }
    }
  }, [jobs, selectedJob]);

  const filtered = jobs; // Filtering is handled backend

  const handleQcInwardSubmit = async (jobId, entry) => {
    showLoader();
    try {
      await dispatch(submitCtQcInward({ jobId, payload: { ...entry, by: loginUserName } })).unwrap();
      fetchJobs();
      toast.success('QC Check recorded successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error(msg);
    } finally {
      hideLoader();
    }
  };

  const handleHandoverPackingSubmit = async (jobId, total) => {
    showLoader();
    try {
      await dispatch(submitCtQcHandover({ jobId, payload: { total, by: loginUserName } })).unwrap();
      fetchJobs();
      toast.success('Handed over to Packing successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error(msg);
    } finally {
      hideLoader();
    }
  };

  const handleArrivalSubmit = async (jobId, qty) => {
    showLoader();
    try {
      await dispatch(submitCtQcArrival({ jobId, payload: { qty, by: loginUserName } })).unwrap();
      fetchJobs();
      toast.success('Arrival recorded successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error(msg);
    } finally {
      hideLoader();
    }
  };

  const handleRejectionSubmit = async (jobId, { qty, department }) => {
    showLoader();
    try {
      await dispatch(submitCtQcRejectionHandover({ jobId, payload: { qty, department, by: loginUserName } })).unwrap();
      fetchJobs();
      toast.success('Rejected quantity handed over successfully');
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || (typeof err === 'string' ? err : 'Unknown error');
      toast.error(msg);
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="ct-scope" style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🔎</span>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--txt)' }}>Quality Control</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt3)', marginLeft: 34 }}>QC Inward · Good/Bad Sorting · Packing Handover</div>
        </div>

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
      </div>

      <div className="g5" style={{ marginBottom: 16 }}>
        <div className={`metric ${filter === 'ALL' ? 'active' : ''}`} onClick={() => { setFilter('ALL'); setPage(1); }} style={{ cursor: 'pointer', border: filter === 'ALL' ? '2px solid var(--teal)' : '' }}>
          <span className="metric-lbl">All Jobs</span>
          <span className="metric-val">{counts['ALL'] || 0}</span>
          <span className="metric-sub">Total in QC</span>
        </div>
        {['Pending', 'In QC', 'QC Completed'].map(st => (
          <div className={`metric ${filter === st ? 'active' : ''}`} key={st} onClick={() => { setFilter(st); setPage(1); }} style={{ cursor: 'pointer', border: filter === st ? `2px solid var(--teal)` : '' }}>
            <span className="metric-lbl">{st}</span>
            <span className="metric-val" style={{ color: 'var(--teal)' }}>{counts[st] || 0}</span>
            <span className="metric-sub">jobs</span>
          </div>
        ))}
      </div>

      <div className="op-grid">
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)', gridColumn: '1/-1' }}>No jobs in this stage</div>}
        {filtered.map(j => {
          const pending = j.qc.pending;
          const readyToHandover = j.qc.good > j.packing.packed;

          let pillColor = 'purple';
          if (j.status === 'Pending') pillColor = 'red';
          else if (j.status === 'In QC') pillColor = 'amber';
          else if (j.status === 'QC Completed') pillColor = 'green';

          const rejectsSummary = j.qc?.bad || 0;
          const stock = (j.qc?.good || 0) - (j.packing?.packed || 0);
          const pendingArrival = j.qc?.pendingArrival || 0;
          const pendingRejects = (j.qc?.bad || 0) - (j.qc?.rejectedHandover || 0);
          const totalAudited = (j.qc?.good || 0) + (j.qc?.bad || 0);

          const isJobCompleted = j.order_qty > 0 &&
            pendingArrival <= 0 &&
            pending <= 0 &&
            stock <= 0 &&
            pendingRejects <= 0 &&
            totalAudited >= j.order_qty;

          const [baseNo, suffix] = j.job_no.split('/');

          return (
            <div key={j.id} className="op-card" style={{ padding: 0 }}>
              <DeliveryPriorityColor
                deliveryDate={j.job_completion_date}
                className="w-full"
                style={{ height: '6px' }}
                containerStyle={{ display: 'block', width: '100%' }}
              />
              <div className="op-card-hdr">
                <div className="op-card-title">
                  {baseNo} {suffix ? `- ${suffix}` : ''}
                </div>
                <div className="op-card-pills">
                  <div className={`op-card-pill ${pillColor}`}>{j.status}</div>
                  {j.job_completion_date && (
                    <DeliveryPriorityColor
                      deliveryDate={j.job_completion_date}
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
                  <div className="op-metric-label">ORDER QTY</div>
                  <div className="op-metric-value">{j.order_qty}</div>
                </div>
                <div className="op-metric-item" style={{ textAlign: 'center', alignItems: 'center' }}>
                  <div className="op-metric-label">RECEIVED</div>
                  <div className="op-metric-value" style={{ justifyContent: 'center', color: '#0D9488' }}>{j.qc.received}</div>
                </div>
                <div className="op-metric-item" style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                  <div className="op-metric-label">PENDING QC</div>
                  <div className="op-metric-value" style={{ justifyContent: 'flex-end', color: '#F59E0B' }}>{pending}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: '#16A34A', textTransform: 'uppercase' }}>Good</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#15803D' }}>{j.qc.good}</div>
                </div>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: '#DC2626', textTransform: 'uppercase' }}>Bad</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#B91C1C' }}>{j.qc.bad}</div>
                </div>
              </div>

              <div className="op-card-divider"></div>

              <div className="op-card-btn-grid" style={{ gridTemplateColumns: '1fr' }}>
                <button
                  className="op-btn2 op-btn2-action"
                  onClick={() => setSelectedJob(j)}
                  style={isJobCompleted
                    ? { background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }
                    : { background: '#ea580c', color: '#ffffff', border: 'none' }
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  {isJobCompleted ? 'View Audit' : 'Audit'}
                </button>
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

      {selectedJob && <QcPanel isOpen={!!selectedJob} job={selectedJob} onClose={() => setSelectedJob(null)} onSubmitArrival={handleArrivalSubmit} onSubmitQc={handleQcInwardSubmit} onSubmitHandover={handleHandoverPackingSubmit} onSubmitRejection={handleRejectionSubmit} />}
      {previewImage && <ImageLightbox src={previewImage} fileName="QC Image" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}