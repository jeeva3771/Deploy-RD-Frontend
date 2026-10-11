import React, { useState } from 'react';
import { PackJobDetail } from './PackJobDetail';
import { stageInfo, PACK_STAGES, nowStamp } from './constants';
import { useDispatch } from 'react-redux';
import { updateCtPackJobLocal, addCtPackLogLocal, updateCtPackJobDb } from '../../../../reducer/ctPackReducer';
import DeliveryPriorityColor from '../../../../components/deliveryPriorityColor/priorityColor';
import ImageLightbox from '../../../common/ImageLightbox';
import Pagination from '../../../components/Pagination';
import { useLoader } from '../../../../context/LoaderContext';

export function PackLogisticsView({
  packJobs = [],
  onRefresh,
  page,
  setPage,
  limit,
  setLimit,
  pagination = {},
  statusFilter: propStatusFilter,
  setStatusFilter: propSetStatusFilter,
  counts = {},
  search = '',
  setSearch
}) {
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("list");
  const [previewImage, setPreviewImage] = useState(null);
  const sel = packJobs.find((j) => j.id === selectedId);

  const [localStatusFilter, setLocalStatusFilter] = useState("ALL");
  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
  const handleFilterClick = (newFilter) => {
    if (propSetStatusFilter) {
      propSetStatusFilter(newFilter);
    } else {
      setLocalStatusFilter(newFilter);
    }
  };

  async function updateJob(id, patch) {
    const dbJob = packJobs.find((j) => j.id === id);
    if (dbJob && dbJob._id) {
      showLoader();
      try {
        let payload = patch;
        let hasFiles = false;

        if (patch && typeof patch === 'object' && !(patch instanceof FormData)) {
          const keys = Object.keys(patch);
          for (const key of keys) {
            const val = patch[key];
            if (val instanceof File || (Array.isArray(val) && val.length > 0 && val[0] instanceof File)) {
              hasFiles = true;
              break;
            }
          }
        }

        if (hasFiles) {
          const fd = new FormData();
          Object.keys(patch).forEach(key => {
            const val = patch[key];
            if (Array.isArray(val)) {
              val.forEach(item => {
                if (item instanceof File) {
                  fd.append(key, item);
                } else {
                  fd.append(key, typeof item === 'object' ? JSON.stringify(item) : item);
                }
              });
            } else if (val instanceof File) {
              fd.append(key, val);
            } else {
              fd.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
            }
          });
          payload = fd;
        }

        const resJob = await dispatch(updateCtPackJobDb({ id: dbJob._id, patch: payload })).unwrap();
        
        let finalPatch = {};
        if (payload instanceof FormData) {
          if (resJob) {
            const jobData = resJob.job || resJob;
            finalPatch = {
              ...jobData,
              id: jobData.sub_job_no || id
            };
          }
        } else {
          finalPatch = { ...patch };
          if (resJob) {
            const jobData = resJob.job || resJob;
            finalPatch = {
              ...finalPatch,
              ...jobData,
              id: jobData.sub_job_no || id
            };
            if (typeof jobData.qcAcceptedQty === "number") {
              finalPatch.qcAcceptedQty = jobData.qcAcceptedQty;
              finalPatch.qcPartial = jobData.qcAcceptedQty < (jobData.total_qty || dbJob.qty);
            }
          }
        }
        
        dispatch(updateCtPackJobLocal({ id, patch: finalPatch }));
        return true;
      } catch (err) {
        const msg = err?.error || err?.message || (typeof err === "string" ? err : "Failed to update job");
        import("react-toastify").then(({ toast }) => {
          toast.error(msg);
        });
        return false;
      } finally {
        hideLoader();
      }
    }
    return false;
  }

  function addLog(id, msg) {
    const logObj = { msg, dt: nowStamp() };
    // 1. Optimistic UI
    dispatch(addCtPackLogLocal({ id, ...logObj }));

    // 2. Real DB update sending ONLY the new log to be $pushed atomically by backend
    const dbJob = packJobs.find((j) => j.id === id);
    if (dbJob && dbJob._id) {
      dispatch(updateCtPackJobDb({ id: dbJob._id, patch: { newLog: logObj } }));
    }
  }

  if (view === "detail" && sel) {
    return (
      <PackJobDetail
        job={sel}
        onBack={() => {
          setView("list");
          if (onRefresh) onRefresh();
        }}
        onUpdate={async (patch) => {
          const res = await updateJob(sel.id, patch);
          if (res && onRefresh) onRefresh();
          return res;
        }}
        onLog={(msg) => addLog(sel.id, msg)}
      />
    );
  }

  const allCount = counts.ALL !== undefined ? counts.ALL : packJobs.length;
  const pendingCount = counts.PENDING !== undefined ? counts.PENDING : (counts['Pending'] || 0);
  const inProgressCount = counts.IN_PROGRESS !== undefined ? counts.IN_PROGRESS : (counts['Packing in Progress'] || 0);
  const completeCount = counts.COMPLETE !== undefined ? counts.COMPLETE : ((counts['Packed'] || 0) + (counts['Complete'] || 0));

  const displayJobs = propSetStatusFilter ? packJobs : packJobs.filter(j => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return j.status === "Pending";
    if (statusFilter === "IN_PROGRESS") return j.status === "Packing in Progress";
    if (statusFilter === "COMPLETE") return j.status === "Packed" || j.status === "Complete";
    return true;
  });

  return (
    <div className="rdpk">
      <div className="rdpk-page">
        <div className="rdpk-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 3 }}>Packing &amp; Logistics</div>
            <div style={{ fontSize: 29, fontWeight: 900, color: "#0C1A2E" }}>📫 Packing Console</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {setSearch !== undefined && (
              <div style={{ position: 'relative', width: 280 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search Job, Sub-Job, Client, Courier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 32px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#fff',
                    color: '#0F172A',
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
                      color: '#94A3B8',
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
            )}
            <div className="rdpk-stats" style={{ display: 'flex', gap: 10 }}>
              <div onClick={() => handleFilterClick("ALL")} style={{ cursor: 'pointer', background: "#F1F5F9", border: `1.5px solid ${statusFilter === "ALL" ? "#94A3B8" : "#E2E8F0"}`, opacity: statusFilter === "ALL" ? 1 : 0.6, borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 100, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 29, fontWeight: 900, color: "#475569" }}>{allCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>All</div>
              </div>
              <div onClick={() => handleFilterClick("PENDING")} style={{ cursor: 'pointer', background: "#FEF2F2", border: `1.5px solid ${statusFilter === "PENDING" ? "#F87171" : "#FECACA"}`, opacity: statusFilter === "PENDING" ? 1 : 0.6, borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 100, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 29, fontWeight: 900, color: "#DC2626" }}>{pendingCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", textTransform: "uppercase" }}>Pending</div>
              </div>
              <div onClick={() => handleFilterClick("IN_PROGRESS")} style={{ cursor: 'pointer', background: "#FFFBEB", border: `1.5px solid ${statusFilter === "IN_PROGRESS" ? "#FBBF24" : "#FDE68A"}`, opacity: statusFilter === "IN_PROGRESS" ? 1 : 0.6, borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 100, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 29, fontWeight: 900, color: "#D97706" }}>{inProgressCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>In Progress</div>
              </div>
              <div onClick={() => handleFilterClick("COMPLETE")} style={{ cursor: 'pointer', background: "#F0FDF4", border: `1.5px solid ${statusFilter === "COMPLETE" ? "#34D399" : "#A7F3D0"}`, opacity: statusFilter === "COMPLETE" ? 1 : 0.6, borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 100, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 29, fontWeight: 900, color: "#059669" }}>{completeCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>Complete</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rdpk-pipeline">
          <div style={{ fontSize: 12, fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Packing Pipeline</div>
          <div className="rdpk-pipeline-track">
            {PACK_STAGES.map((s, i) => (
              <div key={s.id} style={{ display: "contents" }}>
                <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: "6px 8px", textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 19, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: s.color, textTransform: "uppercase", letterSpacing: "0.3px", lineHeight: 1.2 }}>{s.label}</div>
                </div>
                {i < PACK_STAGES.length - 1 && <div style={{ color: "#CBD5E1", fontSize: 19, flexShrink: 0 }}>→</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="op-grid">
          {displayJobs.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)', gridColumn: '1/-1' }}>No jobs found for this filter</div>}
          {displayJobs.map((job) => {
            const [baseNo, suffix] = job.job_no.split('/');

            let pillColor = 'teal';
            if (job.status === 'Pending') pillColor = 'magenta';
            else if (job.status === 'Packing in Progress') pillColor = 'amber';
            else if (job.status === 'Packed' || job.status === 'Complete') pillColor = 'green';

            return (
              <div key={job.id} className="op-card" style={{ padding: 0 }}>
                <DeliveryPriorityColor
                  deliveryDate={job.job_completion_date}
                  className="w-full"
                  style={{ height: '6px' }}
                  containerStyle={{ display: 'block', width: '100%' }}
                />
                <div className="op-card-hdr">
                  <div className="op-card-title">
                    {job.id || job.job_no}
                  </div>
                  <div className="op-card-pills">
                    <div className={`op-card-pill ${pillColor}`}>{job.status}</div>
                    {job.job_completion_date && (
                      <DeliveryPriorityColor
                        deliveryDate={job.job_completion_date}
                        showPriorityName={true}
                        badgeClassName="!text-[9px] !font-[900] !py-[2px] !px-2 uppercase !rounded-full border shadow-sm"
                      />
                    )}
                  </div>
                </div>

                {job.product_image ? (
                  <div className="op-card-img group relative" style={{ height: 140, borderRadius: 8, marginBottom: 12, marginTop: 12, backgroundColor: '#f8f9fa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' }} onClick={() => setPreviewImage(job.product_image)}>
                    <img src={job.product_image} alt={job.product_name} style={{ width: '95%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="op-card-img-empty" style={{ height: 100, marginBottom: 12, marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>{job.client_name}</div>
                  </div>
                )}

                <div className="op-card-metrics-grid">
                  <div className="op-metric-item">
                    <div className="op-metric-label">QTY</div>
                    <div className="op-metric-value">{job.total_qty}</div>
                  </div>
                  <div className="op-metric-item" style={{ textAlign: 'center', alignItems: 'center' }}>
                    <div className="op-metric-label">PRODUCT</div>
                    <div className="op-metric-value" title={job.product_name} style={{ justifyContent: 'center' }}>{job.product_name}</div>
                  </div>
                  <div className="op-metric-item" style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                    <div className="op-metric-label">RECEIVED</div>
                    <div className="op-metric-value" style={{ justifyContent: 'flex-end', color: "#10B981" }}>
                      {job.received_from_qc}
                    </div>
                  </div>
                </div>

                <div className="op-card-divider"></div>

                <div className="op-card-btn-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <button className="op-btn2 op-btn2-action" onClick={() => { setSelectedId(job.id); setView("detail"); }} style={{ background: job.status === 'Packed' ? '#f8fafc' : '#ea580c', color: job.status === 'Packed' ? '#0f172a' : '#ffffff', border: job.status === 'Packed' ? '1px solid #cbd5e1' : 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    {job.status === 'Packed' ? 'View Details' : 'Pack'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', paddingBottom: 24 }}>
          <Pagination
            currentPage={page || 1}
            totalPages={pagination.totalPages || 1}
            onPageChange={(newPage) => setPage && setPage(newPage)}
            itemsPerPage={limit || 8}
            onItemsPerPageChange={(newLimit) => setLimit && setLimit(newLimit)}
            totalCount={pagination.total || 0}
            startIndex={((page || 1) - 1) * (limit || 8)}
            visibleItemCount={packJobs.length}
            customOptions={[8, 12, 16, 24, 32]}
          />
        </div>
      </div>

      {previewImage && (
        <ImageLightbox
          src={previewImage}
          fileName="Product Preview"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
