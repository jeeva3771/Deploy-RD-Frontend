import React, { useState } from 'react';
import CTShell from './CTShell';

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

const SEED_FG_JOBS = [
  { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', fgReceivedQty: 118, agreedRate: 450, invoiceStatus: 'pending', fgStatus: 'stored', clientGST: '27AAACI1082K1ZX', clientAddr: '404 Nariman Point, Mumbai 400021' },
  { id: 'RD-2502', client: 'Automotive Ltd', product: 'Glass Acrylic Crest', fgReceivedQty: 345, agreedRate: 620, invoiceStatus: 'printed', invoiceNo: 'RD/INV/2026/0204', invoiceDt: '12-Jun-2026', fgStatus: 'invoiced', clientGST: '27AABCJ0901A1Z2', clientAddr: 'MIDC Phase II, Pune 411018' },
  { id: 'RD-2503', client: 'FMCG Group', product: 'Metal Star Award', fgReceivedQty: 80, agreedRate: 980, invoiceStatus: 'pending', fgStatus: 'stored', clientGST: '07AAACF4020J1ZY', clientAddr: 'Connaught Place, New Delhi 110001' }
];

const SEED_PACK_JOBS = [
  { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', qty: 118, stage: 'fg_pending', pmatStatus: 'pending', pmatItems: [{ id: 'm1', name: 'Black Box (Custom)', qty: 118, unit: 'pcs', received: false }, { id: 'm2', name: 'Thermocol (Custom)', qty: 118, unit: 'pcs', received: false }], destinationType: 'single', instructionNote: 'Use bubble wrap before inserting in Black Box.' },
  { id: 'RD-2502', client: 'Automotive Ltd', product: 'Glass Acrylic Crest', qty: 345, stage: 'packing_in_progress', pmatStatus: 'received', pmatItems: [{ id: 'm1', name: 'Standard Kraft Box', qty: 345, unit: 'pcs', received: true }], destinationType: 'multiple', instructionNote: 'Split packing into 6 regional branches as per excel sheet.', instructionFile: 'Automotive_Logistics_Splits.xlsx' },
  { id: 'RD-2503', client: 'FMCG Group', product: 'Metal Star Award', qty: 80, stage: 'dispatch_pending', pmatStatus: 'received', pmatItems: [{ id: 'm1', name: 'Wooden Plaque Box', qty: 80, unit: 'pcs', received: true }], destinationType: 'single', instructionNote: 'Direct hand delivery to head office.' }
];

export default function CTMIS() {
  // States
  const [jobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_jobs'); return s ? JSON.parse(s) : SEED_JOBS; } catch { return SEED_JOBS; } });
  const [overrides] = useState(() => { try { const s = localStorage.getItem('rdControlTower_overrides'); return s ? JSON.parse(s) : SEED_OVERRIDES; } catch { return SEED_OVERRIDES; } });
  const [fgJobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_fgJobs'); return s ? JSON.parse(s) : SEED_FG_JOBS; } catch { return SEED_FG_JOBS; } });
  const [packJobs] = useState(() => { try { const s = localStorage.getItem('rdControlTower_packJobs'); return s ? JSON.parse(s) : SEED_PACK_JOBS; } catch { return SEED_PACK_JOBS; } });

  function getStatus(job) {
    const routing = job.routing || [];
    const activeIndex = routing.findIndex((d) => (job.deptStatus?.[d] || 'grey') !== 'teal');
    if (activeIndex === -1) return 'teal';
    return job.deptStatus?.[routing[activeIndex]] || 'grey';
  }

  // Calc metrics
  const totalRevenue = fgJobs.reduce((s, j) => s + j.agreedRate * j.fgReceivedQty, 0);
  const totalCost = totalRevenue * 0.58;
  const totalProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const completedCount = packJobs.filter((j) => j.stage === 'completed').length;
  const totalUnitsDispatched = packJobs.filter((j) => j.stage === 'completed').reduce((s, j) => s + j.qty, 0);

  // Derived shell metrics
  const totalBlocked = jobs.filter((j) => getStatus(j) === 'red').length;
  const pendingOwnerCount = overrides.filter((o) => o.status === 'Pending').length;

  return (
    <CTShell totalBlocked={totalBlocked} pendingOwnerCount={pendingOwnerCount}>
      <div>
        <div className="sec-lbl">📊 Business Intelligence (MIS)</div>
        <div className="g4" style={{ marginBottom: 14 }}>
          <div className="metric" style={{ borderColor: '#10B981' }}>
            <div className="metric-val" style={{ color: '#10B981' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="metric-lbl">Total Sales Revenue</div>
            <div className="metric-sub">Based on completed FG stocks</div>
          </div>
          <div className="metric" style={{ borderColor: '#EF4444' }}>
            <div className="metric-val" style={{ color: '#EF4444' }}>₹{totalCost.toLocaleString('en-IN')}</div>
            <div className="metric-lbl">Total Production Cost</div>
            <div className="metric-sub">Materials &amp; Outsource splits</div>
          </div>
          <div className="metric" style={{ borderColor: '#0D9488' }}>
            <div className="metric-val" style={{ color: '#0D9488' }}>₹{totalProfit.toLocaleString('en-IN')}</div>
            <div className="metric-lbl">Net Gross Profit</div>
            <div className="metric-sub">{overallMargin}% overall margin</div>
          </div>
          <div className="metric" style={{ borderColor: '#7C3AED' }}>
            <div className="metric-val" style={{ color: '#7C3AED' }}>{totalUnitsDispatched}</div>
            <div className="metric-lbl">Units Shipped</div>
            <div className="metric-sub">{completedCount} orders completed</div>
          </div>
        </div>
      </div>
    </CTShell>
  );
}
