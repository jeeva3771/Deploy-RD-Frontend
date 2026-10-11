import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import CTShell from './CTShell';
import { updateShopFloorJobStatus } from '../../reducer/shopFloorReducer';

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const SEED_JOBS = [
  { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', qty: 120, dueDate: '2026-06-20', priority: 'HIGH', routing: ['sf3', 'sf10', 'sf1', 'sf6', 'sf7', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf10: 'teal', sf1: 'teal', sf6: 'blue', sf7: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: { sf6: 85 } },
  { id: 'RD-2502', client: 'Automotive Ltd', product: 'Glass Acrylic Crest', qty: 350, dueDate: '2026-06-18', priority: 'URGENT', routing: ['sf3', 'sf1', 'sf2', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf1: 'red', sf2: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: { sf1: 140 } },
  { id: 'RD-2503', client: 'FMCG Group', product: 'Metal Star Award', qty: 80, dueDate: '2026-06-22', priority: 'NORMAL', routing: ['sf3', 'sf1', 'sf7', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf1: 'green', sf7: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: {} },
  { id: 'RD-2504', client: 'Banking Corp', product: 'Wooden Plaque', qty: 150, dueDate: '2026-06-25', priority: 'NORMAL', routing: ['sf3', 'sf9', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'grey', sf9: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: {} }
];

const SEED_OVERRIDES = [
  { id: 'OVR-501', jobNo: 'RD-2501', type: 'Material Shortage', remark: 'Run using backup 4mm sheets', supervisor: 'Vikram', timestamp: '15-Jun-2026 11:20 AM', status: 'Approved', approvedBy: 'Owner' },
  { id: 'OVR-502', jobNo: 'RD-2502', type: 'Reprint Approval', remark: 'Re-print 15 pcs due to bad masking adhesion', supervisor: 'Aniket', timestamp: '16-Jun-2026 09:45 AM', status: 'Pending' }
];

export default function CTOwner() {
  const dispatch = useDispatch();

  // States
  const [jobs, setJobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_jobs'); return s ? JSON.parse(s) : SEED_JOBS; } catch { return SEED_JOBS; } });
  const [overrides, setOverrides] = useState(() => { try { const s = localStorage.getItem('rdControlTower_overrides'); return s ? JSON.parse(s) : SEED_OVERRIDES; } catch { return SEED_OVERRIDES; } });

  // Sync states
  useEffect(() => { localStorage.setItem('rdControlTower_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('rdControlTower_overrides', JSON.stringify(overrides)); }, [overrides]);

  function getStatus(job) {
    const routing = job.routing || [];
    const activeIndex = routing.findIndex((d) => (job.deptStatus?.[d] || 'grey') !== 'teal');
    if (activeIndex === -1) return 'teal';
    return job.deptStatus?.[routing[activeIndex]] || 'grey';
  }

  const setDeptStatus = async (jobId, deptId, status) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, deptStatus: { ...j.deptStatus, [deptId]: status } } : j)));
    const job = jobs.find((j) => j.id === jobId);
    if (job && job.dbRef) {
      let apiStatus = 'Pending';
      if (status === 'blue') apiStatus = 'In Progress';
      else if (status === 'teal') apiStatus = 'Completed';
      else if (status === 'red') apiStatus = 'Hold';
      try {
        await dispatch(updateShopFloorJobStatus({ id: job.dbRef._id || job.dbRef.id, payload: { status: apiStatus } })).unwrap();
        toast.success(`Job ${jobId} updated to ${apiStatus} in database.`);
      } catch (err) {
        toast.error(`Backend Update Error: ${err.message}`);
      }
    }
  };

  function handleApprove(id, approve) {
    const updated = overrides.map((o) =>
      o.id === id ? { ...o, status: approve ? 'Approved' : 'Rejected', approvedBy: 'Owner' } : o
    );
    setOverrides(updated);
    const ov = overrides.find((o) => o.id === id);
    if (ov && approve) {
      setDeptStatus(ov.jobNo, 'sf1', 'green');
    }
    toast.success(`Override ${id} ${approve ? 'Approved' : 'Rejected'}.`);
  }

  // Derived metrics
  const totalBlocked = jobs.filter((j) => getStatus(j) === 'red').length;
  const pendingOwnerCount = overrides.filter((o) => o.status === 'Pending').length;

  return (
    <CTShell totalBlocked={totalBlocked} pendingOwnerCount={pendingOwnerCount}>
      <div>
        <div className="sec-lbl">👑 Supervisor to Owner Approval overrides</div>
        <div className="card">
          <div className="card-body">
            {overrides.map((ov) => (
              <div
                key={ov.id}
                className="ov-row"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{ov.id} · Job: {ov.jobNo}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--txt2)' }}>Type: {ov.type} | Remark: {ov.remark}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
                    Escalated by supervisor {ov.supervisor} · {ov.timestamp}
                  </div>
                </div>
                <div>
                  {ov.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-grn btn-sm" onClick={() => handleApprove(ov.id, true)}>
                        Approve
                      </button>
                      <button className="btn btn-red btn-sm" onClick={() => handleApprove(ov.id, false)}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`tag ${ov.status === 'Approved' ? 't-auto' : 't-owner'}`}>{ov.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CTShell>
  );
}
