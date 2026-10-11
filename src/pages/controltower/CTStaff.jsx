import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import CTShell from './CTShell';
import { gDate, SEED_FLOORS } from './components/constants';

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const SEED_JOBS = [
  { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', qty: 120, dueDate: '2026-06-20', priority: 'HIGH', routing: ['sf3', 'sf10', 'sf1', 'sf6', 'sf7', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf10: 'teal', sf1: 'teal', sf6: 'blue', sf7: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: { sf6: 85 } },
  { id: 'RD-2502', client: 'Automotive Ltd', product: 'Glass Acrylic Crest', qty: 350, dueDate: '2026-06-18', priority: 'URGENT', routing: ['sf3', 'sf1', 'sf2', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf1: 'red', sf2: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: { sf1: 140 } },
  { id: 'RD-2503', client: 'FMCG Group', product: 'Metal Star Award', qty: 80, dueDate: '2026-06-22', priority: 'NORMAL', routing: ['sf3', 'sf1', 'sf7', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'teal', sf1: 'green', sf7: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: {} },
  { id: 'RD-2504', client: 'Banking Corp', product: 'Wooden Plaque', qty: 150, dueDate: '2026-06-25', priority: 'NORMAL', routing: ['sf3', 'sf9', 'sf8', 'sf4', 'sf11', 'sf12', 'sf13', 'sf14'], deptStatus: { sf3: 'grey', sf9: 'grey', sf8: 'grey', sf4: 'grey', sf11: 'grey', sf12: 'grey', sf13: 'grey', sf14: 'grey' }, deptTimers: {} }
];

const SEED_ABSENT = [
  { id: 1, name: 'Sohan Lal', role: 'Laser Operator', shift: 1, date: '16 Jun', dept: 'Laser Cutting Studio', backup: 'Vikram (Supervisor)' },
  { id: 2, name: 'Ramesh Sawant', role: 'UV Assistant', shift: 2, date: '16 Jun', dept: 'UV Printing Studio', backup: 'Aniket (Supervisor)' }
];

const SEED_OVERRIDES = [
  { id: 'OVR-501', jobNo: 'RD-2501', type: 'Material Shortage', remark: 'Run using backup 4mm sheets', supervisor: 'Vikram', timestamp: '15-Jun-2026 11:20 AM', status: 'Approved', approvedBy: 'Owner' },
  { id: 'OVR-502', jobNo: 'RD-2502', type: 'Reprint Approval', remark: 'Re-print 15 pcs due to bad masking adhesion', supervisor: 'Aniket', timestamp: '16-Jun-2026 09:45 AM', status: 'Pending' }
];

export default function CTStaff() {
  // States
  const [jobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_jobs'); return s ? JSON.parse(s) : SEED_JOBS; } catch { return SEED_JOBS; } });
  const [overrides] = useState(() => { try { const s = localStorage.getItem('rdControlTower_overrides'); return s ? JSON.parse(s) : SEED_OVERRIDES; } catch { return SEED_OVERRIDES; } });
  const [absent, setAbsent] = useState(() => { try { const s = localStorage.getItem('rdControlTower_absent'); return s ? JSON.parse(s) : SEED_ABSENT; } catch { return SEED_ABSENT; } });

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [dept, setDept] = useState('Laser Cutting Studio');
  const [backup, setBackup] = useState('');

  // Sync state
  useEffect(() => { localStorage.setItem('rdControlTower_absent', JSON.stringify(absent)); }, [absent]);

  function getStatus(job) {
    const routing = job.routing || [];
    const activeIndex = routing.findIndex((d) => (job.deptStatus?.[d] || 'grey') !== 'teal');
    if (activeIndex === -1) return 'teal';
    return job.deptStatus?.[routing[activeIndex]] || 'grey';
  }

  function handleLog() {
    if (!name || !role || !backup) return;
    setAbsent([...absent, { id: Date.now(), name, role, shift: 1, date: gDate().substring(0, 6), dept, backup }]);
    setName('');
    setRole('');
    setBackup('');
    toast.success('Absentee registered.');
  }

  function handleReturn(id) {
    setAbsent(absent.filter((a) => a.id !== id));
    toast.success('Staff returned to active duty.');
  }

  // Derived metrics
  const totalBlocked = jobs.filter((j) => getStatus(j) === 'red').length;
  const pendingOwnerCount = overrides.filter((o) => o.status === 'Pending').length;

  return (
    <CTShell totalBlocked={totalBlocked} pendingOwnerCount={pendingOwnerCount}>
      <div className="g2">
        <div className="card">
          <div className="card-hdr"><span className="card-title">Register Workforce Absence</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-lbl">Operator Name</div>
              <input className="form-inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-row">
              <div className="form-lbl">Role / Designation</div>
              <input className="form-inp" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Laser Operator" />
            </div>
            <div className="form-row">
              <div className="form-lbl">Studio / Department</div>
              <select className="form-sel" value={dept} onChange={(e) => setDept(e.target.value)}>
                {SEED_FLOORS.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-lbl">Backup / Relief Allocation</div>
              <input className="form-inp" value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="Vikram (Supervisor)" />
            </div>
            <button className="btn btn-teal btn-full" style={{ marginTop: 8 }} onClick={handleLog}>
              ✓ Log Absence &amp; Routing Impact
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-title">Absentee Ledger</span></div>
          <div className="card-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {absent.map((a) => (
              <div key={a.id} className="absent-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="absent-name">{a.name}</div>
                    <div className="absent-dept">{a.role} · {a.dept}</div>
                  </div>
                  <button className="btn btn-teal btn-sm" onClick={() => handleReturn(a.id)}>
                    Return
                  </button>
                </div>
                <div className="pending-action">
                  <span className="pa-text">Backup: <b>{a.backup}</b></span>
                  <span className="pa-owner">shift {a.shift}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CTShell>
  );
}
