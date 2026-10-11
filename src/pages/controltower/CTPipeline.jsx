import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CTShell from './CTShell';
import { STATUS_CLASS, DOT_CLASS, STATUS_LABELS, gDate, SEED_FLOORS } from './components/constants';
import { getAllControlTowerDepts } from '../../reducer/controlTowerReducer';
import { fetchShopFloorJobs } from '../../reducer/shopFloorReducer';
import { JobDetailModal } from './components';

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

export default function CTPipeline() {
  const dispatch = useDispatch();
  const { jobs: allJobs } = useSelector((state) => state.shopFloor);
  const { depts: backendFloors } = useSelector((state) => state.controlTower);

  // States
  const [jobs, setJobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_jobs'); return s ? JSON.parse(s) : SEED_JOBS; } catch { return SEED_JOBS; } });
  const [overrides] = useState(() => { try { const s = localStorage.getItem('rdControlTower_overrides'); return s ? JSON.parse(s) : SEED_OVERRIDES; } catch { return SEED_OVERRIDES; } });
  const [inwardLogs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_inwardLogs'); return s ? JSON.parse(s) : {}; } catch { return {}; } });
  const [selectedJob, setSelectedJob] = useState(null);

  // Sync jobs to localstorage
  useEffect(() => { localStorage.setItem('rdControlTower_jobs', JSON.stringify(jobs)); }, [jobs]);

  // Fetch depts
  useEffect(() => { dispatch(getAllControlTowerDepts()); }, [dispatch]);

  // Poll shop floor jobs
  const refreshJobsData = useCallback(() => { dispatch(fetchShopFloorJobs({})); }, [dispatch]);
  useEffect(() => {
    refreshJobsData();
    const interval = setInterval(refreshJobsData, 12000);
    return () => clearInterval(interval);
  }, [refreshJobsData]);

  // Merge backend jobs
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

  // Helpers
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

  // Header badges derived state
  const totalBlocked = jobs.filter((j) => getStatus(j) === 'red').length;
  const pendingOwnerCount = overrides.filter((o) => o.status === 'Pending').length;

  return (
    <CTShell totalBlocked={totalBlocked} pendingOwnerCount={pendingOwnerCount}>
      <div>
        <div className="sec-lbl">Live Production Pipeline</div>
        {jobs.map((job) => {
          const curStatus = getStatus(job);
          return (
            <div key={job.id} className="card" style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setSelectedJob(job)}>
              <div className="card-hdr" style={{ borderBottom: 'none', paddingBottom: 6 }}>
                <div>
                  <span className="card-title" style={{ fontSize: 14 }}>{job.id} — {job.product}</span>
                  <div className="card-sub">{job.client} · Qty: {job.qty} units · Due: {job.dueDate}</div>
                </div>
                <SPill st={curStatus} />
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <div className="g5">
                  {job.routing.map((deptId) => {
                    const dept = floors.find((f) => f.id === deptId || f._id === deptId);
                    const st = job.deptStatus[deptId] || 'grey';
                    return (
                      <div key={deptId} className={`dept-node st-${st}`}>
                        <div className="dept-node-name">{dept?.name.replace('Studio', '').replace('Dept', '')}</div>
                        <div className="dept-node-meta">{STATUS_LABELS[st]}</div>
                        {job.deptTimers?.[deptId] && <div className="dept-node-timer">⏳ {job.deptTimers[deptId]} min</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          floors={floors}
          getInwardLogs={getInwardLogs}
          getInwardTotals={getInwardTotals}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </CTShell>
  );
}
