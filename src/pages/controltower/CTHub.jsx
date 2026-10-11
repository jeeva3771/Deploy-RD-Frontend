import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CTShell from './CTShell';
import { STATUS_CLASS, DOT_CLASS, STATUS_LABELS, gDate, gNow, SEED_FLOORS } from './components/constants';
import { getAllControlTowerDepts, deleteControlTowerDept } from '../../reducer/controlTowerReducer';
import { fetchShopFloorJobs, updateShopFloorJobStatus, recordMaterialInward } from '../../reducer/shopFloorReducer';
import { FloorCreator, OperatorView } from './components';

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const SEED_JOBS = [
  { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', qty: 120, dueDate: '2026-06-20', priority: 'HIGH', routing: ['sf3', 'sf10', 'sf1', 'sf6', 'sf7', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf10: 'teal', sf1: 'teal', sf6: 'blue', sf7: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: { sf6: 85 } },
  { id: 'RD-2502', client: 'Automotive Ltd', product: 'Glass Acrylic Crest', qty: 350, dueDate: '2026-06-18', priority: 'URGENT', routing: ['sf3', 'sf1', 'sf2', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf1: 'red', sf2: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: { sf1: 140 } },
  { id: 'RD-2503', client: 'FMCG Group', product: 'Metal Star Award', qty: 80, dueDate: '2026-06-22', priority: 'NORMAL', routing: ['sf3', 'sf1', 'sf7', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf1: 'green', sf7: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: {} },
  { id: 'RD-2504', client: 'Banking Corp', product: 'Wooden Plaque', qty: 150, dueDate: '2026-06-25', priority: 'NORMAL', routing: ['sf3', 'sf9', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'grey', sf9: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: {} }
];

const SEED_POS = [
  { id: 'PO-9081', jobNo: 'RD-2501', poDate: '2026-06-12', expectedDelivery: '2026-06-18', vendorName: 'Apex Acrylics', materialName: 'Cast Acrylic Sheets 5mm', qty: 25, totalAmount: 48000, status: 'Pending', contact: '+919922114455' },
  { id: 'PO-9082', jobNo: 'RD-2502', poDate: '2026-06-14', expectedDelivery: '2026-06-19', vendorName: 'Timberland Woods', materialName: 'Solid Oak Base Blocks', qty: 100, totalAmount: 18500, status: 'Pending', contact: '+919876543210' },
  { id: 'PO-9083', jobNo: 'RD-2503', poDate: '2026-06-10', expectedDelivery: '2026-06-15', vendorName: 'SuperStar Metals', materialName: 'Brass Die Plates', qty: 210, totalAmount: 95000, status: 'Completed', contact: '+919666543211' }
];

const SEED_ABSENT = [
  { id: 1, name: 'Sohan Lal', role: 'Laser Operator', shift: 1, date: '16 Jun', dept: 'Laser Cutting Studio', backup: 'Vikram (Supervisor)' },
  { id: 2, name: 'Ramesh Sawant', role: 'UV Assistant', shift: 2, date: '16 Jun', dept: 'UV Printing Studio', backup: 'Aniket (Supervisor)' }
];

const SEED_OVERRIDES = [
  { id: 'OVR-501', jobNo: 'RD-2501', type: 'Material Shortage', remark: 'Run using backup 4mm sheets', supervisor: 'Vikram', timestamp: '15-Jun-2026 11:20 AM', status: 'Approved', approvedBy: 'Owner' },
  { id: 'OVR-502', jobNo: 'RD-2502', type: 'Reprint Approval', remark: 'Re-print 15 pcs due to bad masking adhesion', supervisor: 'Aniket', timestamp: '16-Jun-2026 09:45 AM', status: 'Pending' }
];

export default function CTHub() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jobs: allJobs } = useSelector((state) => state.shopFloor);
  const { depts: backendFloors } = useSelector((state) => state.controlTower);

  // States
  const [jobs, setJobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_jobs'); return s ? JSON.parse(s) : SEED_JOBS; } catch { return SEED_JOBS; } });
  const [pos] = useState(() => { try { const s = localStorage.getItem('rdControlTower_pos'); return s ? JSON.parse(s) : SEED_POS; } catch { return SEED_POS; } });
  const [absent] = useState(() => { try { const s = localStorage.getItem('rdControlTower_absent'); return s ? JSON.parse(s) : SEED_ABSENT; } catch { return SEED_ABSENT; } });
  const [overrides, setOverrides] = useState(() => { try { const s = localStorage.getItem('rdControlTower_overrides'); return s ? JSON.parse(s) : SEED_OVERRIDES; } catch { return SEED_OVERRIDES; } });
  const [inwardLogs, setInwardLogs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_inwardLogs'); return s ? JSON.parse(s) : {}; } catch { return {}; } });

  const [showCreator, setShowCreator] = useState(false);
  const [editFloor, setEditFloor] = useState(null);
  const [operatorFloor, setOperatorFloor] = useState(null);
  const [deleteTargetFloor, setDeleteTargetFloor] = useState(null);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('rdControlTower_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('rdControlTower_overrides', JSON.stringify(overrides)); }, [overrides]);
  useEffect(() => { localStorage.setItem('rdControlTower_inwardLogs', JSON.stringify(inwardLogs)); }, [inwardLogs]);

  // Fetch depts once
  useEffect(() => { dispatch(getAllControlTowerDepts()); }, [dispatch]);

  // Poll shop floor jobs
  const refreshJobsData = useCallback(() => { dispatch(fetchShopFloorJobs({})); }, [dispatch]);
  useEffect(() => {
    refreshJobsData();
    const interval = setInterval(refreshJobsData, 12000);
    return () => clearInterval(interval);
  }, [refreshJobsData]);

  // Merge backend jobs into local jobs
  useEffect(() => {
    if (allJobs && allJobs.length > 0) {
      setJobs((prev) => {
        const updated = [...prev];
        allJobs.forEach((bj) => {
          const id = bj.job_no || bj.id;
          const existsIdx = updated.findIndex((j) => j.id === id || j.job_no === id);
          const mappedJob = {
            id,
            client: bj.client_name || 'Client',
            product: bj.product_name || 'Product',
            qty: bj.total_qty || bj.quantity || 100,
            dueDate: bj.delivery_date || bj.due_date || gDate(),
            priority: bj.is_escalated ? 'URGENT' : (bj.priority || 'NORMAL'),
            routing: ['sf1', 'sf2', 'sf3', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'],
            deptStatus: {
              sf1: bj.status === 'In Progress' ? 'blue' : (bj.status === 'Completed' ? 'teal' : 'grey'),
              sf2: 'grey', sf3: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey'
            },
            deptTimers: {},
            dbRef: bj
          };
          if (existsIdx > -1) {
            updated[existsIdx] = { ...updated[existsIdx], ...mappedJob, deptStatus: { ...mappedJob.deptStatus, ...updated[existsIdx].deptStatus } };
          } else {
            updated.push(mappedJob);
          }
        });
        return updated;
      });
    }
  }, [allJobs]);

  // Merge default floors
  const rawFloors = backendFloors.length > 0 ? backendFloors : [];
  const DEFAULT_FLOORS = [
    { id: 'sf1', name: 'Laser Cutting Studio', type: 'mach', accent: '#0D9488', pattern: 'A', primaryVar: 'Time (mins)', spec: 'A (Bystronic), B (Trumpf)', supervisor: 'Vikram', icon: '✂️', sealed: true },
    { id: 'sf2', name: 'UV Printing Studio', type: 'mach', accent: '#7C3AED', pattern: 'A', primaryVar: 'Sq. inch', spec: 'Mimaki, Handtop Flatbed', supervisor: 'Aniket', icon: '🖨️', sealed: true },
    { id: 'sf3', name: 'DTP Pre-Press', type: 'man', accent: '#F97316', pattern: 'B', primaryVar: 'UPS / Sheet', spec: 'Artwork, Nesting, Plate', supervisor: 'Rakesh', icon: '💻', sealed: false },
    { id: 'sf4', name: 'Assembly Bay', type: 'man', accent: '#0e6e66ff', pattern: 'B', primaryVar: 'Pcs count', spec: 'Glues, Top fit, Engraving', supervisor: 'Ganesh', icon: '🔧', sealed: true },
  ];
  const dynamicFloors = rawFloors.filter((f) => {
    const uName = f.name.toUpperCase();
    return !uName.includes('LASER CUTTING') && !uName.includes('UV PRINTING') && !uName.includes('DTP PRE-PRESS') && !uName.includes('DTP') && !uName.includes('ASSEMBLY');
  });
  const floors = [...DEFAULT_FLOORS, ...dynamicFloors];

  console.log('floors', floors);
  // Helper functions
  function getStatus(job) {
    const routing = job.routing || [];
    const activeIndex = routing.findIndex((d) => (job.deptStatus?.[d] || 'grey') !== 'teal');
    if (activeIndex === -1) return 'teal';
    return job.deptStatus?.[routing[activeIndex]] || 'grey';
  }

  // Header badges derived state
  const totalBlocked = jobs.filter((j) => getStatus(j) === 'red').length;
  const pendingOwner = overrides.filter((o) => o.status === 'Pending').length;

  function getActiveDept(job) {
    const routing = job.routing || [];
    const active = routing.find((d) => (job.deptStatus?.[d] || 'grey') !== 'teal');
    return active || 'sf12';
  }

  function getInwardLogs(jobId) {
    const list = [];
    Object.entries(inwardLogs).forEach(([floorId, jobLogs]) => {
      if (jobLogs[jobId]) {
        const floor = floors.find((f) => (f.id || f._id) === floorId);
        list.push(...jobLogs[jobId].map((l) => ({ ...l, deptName: floor?.name || floorId })));
      }
    });
    return list;
  }

  function getInwardTotals(jobId) {
    let good = 0, bad = 0;
    Object.values(inwardLogs).forEach((jobLogs) => {
      if (jobLogs[jobId]) {
        jobLogs[jobId].forEach((l) => { good += l.goodQty || 0; bad += l.badQty || 0; });
      }
    });
    return { totalGood: good, totalBad: bad };
  }

  function advance(job, nextStatus) {
    setDeptStatus(job.id, getActiveDept(job), nextStatus);
  }

  function addLog(jobId, logObj) {
    const d = gDate() + ' ' + gNow().substring(0, 5);
    const floorId = operatorFloor?.id || operatorFloor?._id;
    setInwardLogs((prev) => {
      const floorLogs = prev[floorId] || {};
      const jobLogs = floorLogs[jobId] || [];
      return { ...prev, [floorId]: { ...floorLogs, [jobId]: [...jobLogs, { ...logObj, date: d }] } };
    });
  }

  async function setDeptStatus(jobId, deptId, status) {
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
  }

  const handleInwardSubmit = async (job, log) => {
    addLog(job.id, log);
    if (job.dbRef) {
      try {
        await dispatch(recordMaterialInward({ jobId: job.dbRef._id || job.dbRef.id, received_qty: log.qty, good_qty: log.goodQty, rejected_qty: log.badQty, received_by: log.receiver, remarks: log.note })).unwrap();
        toast.success('Inward recorded in database.');
      } catch (err) {
        toast.error(`Inward Sync failed: ${err.message}`);
      }
    } else {
      toast.success('Inward logged locally.');
    }
    const currentStatus = job.deptStatus[operatorFloor?.id] || 'grey';
    const totalGood = getInwardTotals(job.id).totalGood + log.goodQty;
    if (totalGood > 0 && currentStatus === 'amber') {
      setDeptStatus(job.id, operatorFloor.id, 'green');
    }
  };

  const handleNav = (path) => {
    navigate(path);
  };

  const handleDeleteFloor = (floor) => {
    const floorId = floor.id || floor._id;
    if (!floorId) {
      toast.error('Cannot delete this floor (missing ID).');
      return;
    }
    setDeleteTargetFloor(floor);
  };

  // Derived metrics
  const active = floors.length;
  const sealed = floors.filter((f) => f.sealed).length;
  const inProgress = jobs.filter((j) => Object.values(j.deptStatus).some((s) => s === 'blue')).length;
  const overduePos = pos.filter((p) => p.status === 'Pending').length;

  return (
    <CTShell
      totalBlocked={totalBlocked}
      pendingOwnerCount={pendingOwner}
      onNewFloorClick={() => setShowCreator(true)}
    >
      <div style={{ marginBottom: 20 }}>
        {/* <div className="sec-lbl">📊 Control Tower Dashboard</div>
        <div className="g4" style={{ marginBottom: 12 }}>
          <div className="metric" style={{ borderColor: '#0D9488' }}>
            <div className="metric-val" style={{ color: '#0D9488' }}>{active}</div>
            <div className="metric-lbl">Active Shop Floors</div>
            <div className="metric-sub">{sealed} sealed modules</div>
          </div>
          <div className="metric" style={{ borderColor: totalBlocked > 0 ? '#EF4444' : '#E2E8F0' }}>
            <div className="metric-val" style={{ color: totalBlocked > 0 ? '#EF4444' : '#475569' }}>{totalBlocked}</div>
            <div className="metric-lbl">Blocked Jobs</div>
            <div className="metric-sub">{inProgress} jobs in progress</div>
          </div>
          <div className="metric" style={{ borderColor: overduePos > 0 ? '#F59E0B' : '#E2E8F0' }}>
            <div className="metric-val" style={{ color: overduePos > 0 ? '#F59E0B' : '#475569' }}>{overduePos}</div>
            <div className="metric-lbl">PO Issues</div>
            <div className="metric-sub">12 vendors tracked</div>
          </div>
          <div className="metric" style={{ borderColor: pendingOwner > 0 ? '#7C3AED' : '#E2E8F0' }}>
            <div className="metric-val" style={{ color: pendingOwner > 0 ? '#7C3AED' : '#475569' }}>{pendingOwner}</div>
            <div className="metric-lbl">Owner Approvals</div>
            <div className="metric-sub">{absent.length} absent employees</div>
          </div>
        </div> */}

        {/* {totalBlocked > 0 && (
          <div className="alert-banner" onClick={() => handleNav('/control-tower/pipeline')}>
            <span className="alert-icon">⛔</span>
            <span className="alert-text"><b>{totalBlocked} job{totalBlocked > 1 ? 's' : ''} blocked</b> — tap to view pipeline and resolve</span>
          </div>
        )}
        {overduePos > 0 && (
          <div className="alert-banner" onClick={() => handleNav('/control-tower/po')}>
            <span className="alert-icon">📦</span>
            <span className="alert-text"><b>{overduePos} PO issue{overduePos > 1 ? 's' : ''}</b> — vendor action required · tap to view</span>
          </div>
        )}
        {absent.length > 0 && (
          <div className="alert-banner" onClick={() => handleNav('/control-tower/staff')}>
            <span className="alert-icon">👤</span>
            <span className="alert-text"><b>{absent.length} employee{absent.length > 1 ? 's' : ''} absent</b> — pending actions require supervisor batch approval · tap to action</span>
          </div>
        )}
        {pendingOwner > 0 && (
          <div className="alert-banner" onClick={() => handleNav('/control-tower/owner')}>
            <span className="alert-icon">👑</span>
            <span className="alert-text"><b>{pendingOwner} override{pendingOwner > 1 ? 's' : ''} awaiting owner approval</b> — tap to review and approve</span>
          </div>
        )}  

        <div className="sec-lbl" style={{ marginTop: 14 }}>Shop Floor Status</div> */}
        <div className="g3">
          {floors.map((f) => {
            const activeJobs = jobs.filter((j) => getActiveDept(j) === f.id);
            const status = activeJobs.length > 0 ? 'blue' : 'green';
            return (
              <div key={f.id || f._id} className="card" style={{ borderColor: f.accent + '44', cursor: 'pointer', position: 'relative' }}>
                {/* EDIT & DELETE ICONS */}
                {!(f.name.toUpperCase().includes('LASER') || f.name.toUpperCase().includes('UV') || f.name.toUpperCase().includes('DTP') || f.name.toUpperCase().includes('ASSEMBLY')) && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 2 }}>
                    <button
                      title="Edit Shop Floor"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditFloor(f);
                        setShowCreator(true);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'all 0.15s'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      title="Delete Shop Floor"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFloor(f);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: '80px' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 9, background: f.accent + '22', border: `1px solid ${f.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{f.icon || '🏭'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--txt)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{f.name}</div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`tag ${f.pattern === 'A' ? 't-mach' : f.pattern === 'B' ? 't-man' : 't-inv'}`}>Pat {f.pattern}</span>
                      <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 700 }}>{f.primary_variable?.symbol || f.primaryVar || ''}</span>
                      {f.sealed && <span className="tag t-seal">✅ Sealed</span>}
                    </div>
                  </div>
                  {(!f.is_active && !['laser', 'uv', 'dtp', 'assembly'].some(skip => (f.name || '').toLowerCase().includes(skip))) ? (
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF0000', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: status === 'blue' ? 'var(--blue-st)' : 'var(--grn-st)', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreator && (
        <FloorCreator
          onClose={() => { setShowCreator(false); setEditFloor(null); }}
          editFloor={editFloor}
          onSaved={() => dispatch(getAllControlTowerDepts())}
        />
      )}

      {operatorFloor && (
        <OperatorView
          floor={operatorFloor}
          jobs={jobs}
          getActiveDept={getActiveDept}
          getInwardTotals={getInwardTotals}
          getInwardLogs={getInwardLogs}
          onInwardSubmit={handleInwardSubmit}
          setDeptStatus={setDeptStatus}
          onClose={() => setOperatorFloor(null)}
          setOverrides={setOverrides}
          overrides={overrides}
          advance={advance}
          getStatus={getStatus}
        />
      )}

      {deleteTargetFloor && (
        <div className="ct-backdrop" onClick={() => setDeleteTargetFloor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-hdr" style={{ background: '#EF4444' }}>
              <span className="modal-title">⚠️ Delete Shop Floor?</span>
              <button className="modal-close" onClick={() => setDeleteTargetFloor(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '15px', color: 'var(--txt)', lineHeight: '1.5', marginBottom: '20px' }}>
                Are you sure you want to delete <b>{deleteTargetFloor.name}</b>?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setDeleteTargetFloor(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  style={{ background: '#EF4444', color: 'white' }}
                  onClick={async () => {
                    const floorId = deleteTargetFloor.id || deleteTargetFloor._id;
                    try {
                      await dispatch(deleteControlTowerDept(floorId)).unwrap();
                      toast.success(`Shop floor "${deleteTargetFloor.name}" deleted successfully.`);
                      dispatch(getAllControlTowerDepts());
                    } catch (err) {
                      toast.error(`Delete failed: ${err.message || err}`);
                    } finally {
                      setDeleteTargetFloor(null);
                    }
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CTShell>
  );
}
