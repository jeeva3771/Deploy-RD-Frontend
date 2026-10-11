import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

const SEED_OVERRIDES = [
  { id: 'OVR-501', jobNo: 'RD-2501', type: 'Material Shortage', remark: 'Run using backup 4mm sheets', supervisor: 'Vikram', timestamp: '15-Jun-2026 11:20 AM', status: 'Approved', approvedBy: 'Owner' },
  { id: 'OVR-502', jobNo: 'RD-2502', type: 'Reprint Approval', remark: 'Re-print 15 pcs due to bad masking adhesion', supervisor: 'Aniket', timestamp: '16-Jun-2026 09:45 AM', status: 'Pending' }
];

function SPill({ st }) {
  const cls = STATUS_CLASS[st] || 'sp-grey';
  const lbl = STATUS_LABELS[st] || st;
  return (
    <span className={`spill ${cls}`}>
      <span className={`sdot ${DOT_CLASS[st] || 's-grey'}`} />
      {lbl}
    </span>
  );
}

export default function CTFloors() {
  const dispatch = useDispatch();
  const { jobs: allJobs } = useSelector((state) => state.shopFloor);
  const { depts: backendFloors } = useSelector((state) => state.controlTower);

  // Dynamic / local states
  const [jobs, setJobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_jobs'); return s ? JSON.parse(s) : SEED_JOBS; } catch { return SEED_JOBS; } });
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
  const rawFloors = backendFloors.length > 0 ? backendFloors : SEED_FLOORS;
  const DEFAULT_FLOORS = [
    { id: 'sf1', name: 'Laser Cutting Studio', type: 'mach', accent: '#0D9488', pattern: 'A', primaryVar: 'Time (mins)', spec: 'A (Bystronic), B (Trumpf)', supervisor: 'Vikram', icon: '✂️', sealed: true },
    { id: 'sf2', name: 'UV Printing Studio', type: 'mach', accent: '#7C3AED', pattern: 'A', primaryVar: 'Sq. inch', spec: 'Mimaki, Handtop Flatbed', supervisor: 'Aniket', icon: '🖨️', sealed: true },
    { id: 'sf3', name: 'DTP Pre-Press', type: 'man', accent: '#F97316', pattern: 'B', primaryVar: 'UPS / Sheet', spec: 'Artwork, Nesting, Plate', supervisor: 'Rakesh', icon: '💻', sealed: false },
    { id: 'sf4', name: 'Assembly Bay', type: 'man', accent: '#0F766E', pattern: 'B', primaryVar: 'Pcs count', spec: 'Glues, Top fit, Engraving', supervisor: 'Ganesh', icon: '🔧', sealed: true },
  ];
  const dynamicFloors = rawFloors.filter((f) => {
    const uName = f.name.toUpperCase();
    return !uName.includes('LASER CUTTING') && !uName.includes('UV PRINTING') && !uName.includes('DTP PRE-PRESS') && !uName.includes('DTP') && !uName.includes('ASSEMBLY');
  });
  const floors = [...DEFAULT_FLOORS, ...dynamicFloors];

  // Helper functions
  function getStatus(job) {
    const routing = job.routing || [];
    const activeIndex = routing.findIndex((d) => (job.deptStatus?.[d] || 'grey') !== 'teal');
    if (activeIndex === -1) return 'teal';
    return job.deptStatus?.[routing[activeIndex]] || 'grey';
  }

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

  const handleDeleteFloor = (floor) => {
    const floorId = floor.id || floor._id;
    if (!floorId) {
      toast.error('Cannot delete this floor (missing ID).');
      return;
    }
    setDeleteTargetFloor(floor);
  };

  // Header badges derived state
  const totalBlocked = jobs.filter((j) => getStatus(j) === 'red').length;
  const pendingOwnerCount = overrides.filter((o) => o.status === 'Pending').length;

  return (
    <CTShell
      totalBlocked={totalBlocked}
      pendingOwnerCount={pendingOwnerCount}
      onNewFloorClick={() => setShowCreator(true)}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="sec-lbl" style={{ marginBottom: 0 }}>Shop Floor Status ({floors.length} Floors)</div>
          <button className="btn btn-teal btn-sm" onClick={() => setShowCreator(true)}>+ Register New Studio</button>
        </div>
        <div className="g4">
          {floors.map((f) => {
            const activeJobs = jobs.filter((j) => getActiveDept(j) === f.id);
            const status = activeJobs.length > 0 ? 'blue' : 'grey';
            return (
              <div key={f.id || f._id} className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setOperatorFloor(f)}>
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
                        cursor: 'pointer',
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
                        cursor: 'pointer',
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

                <div className="card-hdr" style={{ background: f.accent || 'var(--teal)' }}>
                  <span className="card-title" style={{ color: 'white' }}>
                    {f.icon ? `${f.icon} ` : ''}{f.name}
                  </span>
                  <span className={`tag ${f.pattern === 'A' ? 't-mach' : f.pattern === 'B' ? 't-man' : 't-qc'}`}>
                    {f.pattern === 'A' ? 'mach' : f.pattern === 'B' ? 'man' : 'inv'}
                  </span>
                </div>
                <div className="card-body">
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt2)' }}>
                    Supervisor: {f.supervisors && f.supervisors.length > 0 ? f.supervisors.map((s) => s.name || s).join(', ') : 'N/A'}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--txt3)', marginTop: 2 }}>
                    {f.machines && f.machines.length > 0 ? `Machines: ${f.machines.join(', ')}` : (f.spec || 'Standard Studio Department')}
                  </div>
                  <div className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SPill st={status} />
                    <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}>{activeJobs.length} Active</span>
                  </div>
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
              <p style={{ fontSize: '14px', color: 'var(--txt)', lineHeight: '1.5', marginBottom: '20px' }}>
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
