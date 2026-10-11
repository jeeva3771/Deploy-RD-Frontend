import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { gDate, gNow } from './constants';
import InwardModal from './InwardModal';
import { STATUS_CLASS, DOT_CLASS, STATUS_LABELS } from './constants';

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

export default function OperatorView({
  floor,
  jobs,
  getActiveDept,
  getInwardTotals,
  getInwardLogs,
  onInwardSubmit,
  setDeptStatus,
  onClose,
  setOverrides,
  overrides,
  advance,
  getStatus
}) {
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [inwardModalJob, setInwardModalJob] = useState(null);
  const [opTab, setOpTab] = useState('process');
  const [machineRunCount, setMachineRunCount] = useState(0);
  const [goodQty, setGoodQty] = useState('');
  const [badQty, setBadQty] = useState('');

  const floorJobs = jobs.filter((j) => getActiveDept(j) === floor.id);
  const selectedJob = floorJobs.find((j) => j.id === selectedJobId) || floorJobs[0];
  const totals = selectedJob ? getInwardTotals(selectedJob.id) : { totalGood: 0, totalBad: 0 };
  const currentStatus = selectedJob ? (selectedJob.deptStatus[floor.id] || 'grey') : 'grey';

  function handleTriggerOverride() {
    if (!selectedJob) return;
    const newOvr = {
      id: 'OVR-' + Math.floor(Math.random() * 900 + 100),
      jobNo: selectedJob.id,
      type: 'Quality Deviation',
      remark: `Requesting override from ${floor.supervisor} at ${floor.name}`,
      supervisor: floor.supervisor || 'Operator',
      timestamp: gDate() + ' ' + gNow().substring(0, 5),
      status: 'Pending'
    };
    setOverrides([newOvr, ...overrides]);
    setDeptStatus(selectedJob.id, floor.id, 'red');
    toast.success('Deviation escalated to owner. Job locked on Hold.');
  }

  function handleDone() {
    if (!selectedJob) return;
    setDeptStatus(selectedJob.id, floor.id, 'teal');
    toast.success('Job completed on this floor department.');
  }

  return (
    <div className="ct-backdrop" style={{ padding: 0 }}>
      <div className="modal" style={{ width: '100vw', maxWidth: '100vw', height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
        <div className="modal-hdr">
          <span className="modal-title">👨‍✈️ {floor.name} Operator Console</span>
          <button className="modal-close" style={{ color: 'white' }} onClick={onClose}>×</button>
        </div>
        <div className="opwrap">
          <div className="opsb">
            <div className="opsbt">Floor Queue</div>
            <div className="opjl">
              {floorJobs.map((j) => (
                <div key={j.id} className={`opji ${j.priority === 'URGENT' ? 'urg' : ''} ${selectedJob?.id === j.id ? 'sel' : ''}`} onClick={() => setSelectedJobId(j.id)}>
                  <div style={{ fontSize: 12, fontWeight: 900 }}>{j.id} · {j.product}</div>
                  <div style={{ fontSize: 10.5, marginTop: 2 }}>Client: {j.client} · Qty: {j.qty}</div>
                </div>
              ))}
              {floorJobs.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--txt3)', fontSize: 12, fontWeight: 'bold' }}>Idle / No Jobs Assigned</div>}
            </div>
          </div>
          <div className="opmain">
            {selectedJob ? (
              <>
                <div className="job-banner">
                  <div><div className="jb-id">{selectedJob.id}</div><div className="jb-cust">{selectedJob.client}</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="tag t-qc" style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)' }}>Active Process</span>
                    <div className="jb-specs" style={{ marginTop: 4 }}>
                      <span className="jpill">{selectedJob.product}</span>
                      <span className="jpill">Target: {selectedJob.qty} pcs</span>
                    </div>
                  </div>
                </div>
                <div className="optabs">
                  <div className={`optab ${opTab === 'process' ? 'act' : ''}`} onClick={() => setOpTab('process')}>Process Console</div>
                  <div className={`optab ${opTab === 'spec' ? 'act' : ''}`} onClick={() => setOpTab('spec')}>Artwork Specs</div>
                  <div className={`optab ${opTab === 'history' ? 'act' : ''}`} onClick={() => setOpTab('history')}>Audit Logs</div>
                </div>
                <div className="oppanel">
                  {opTab === 'process' && (
                    <div className="proc-wrap">
                      <div className="pc-left">
                        {floor.pattern === 'A' ? (
                          <div className="cyc-card" style={{ background: 'var(--bg3)', padding: 10, color: 'var(--txt)' }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--txt3)', textTransform: 'uppercase' }}>Cycle Counter</div>
                            <div style={{ fontSize: 36, fontWeight: 900, textAlign: 'center', margin: '14px 0', fontFamily: 'monospace' }}>{machineRunCount}</div>
                            <button className="btn btn-teal btn-full" onClick={() => setMachineRunCount((c) => c + 1)}>+1 Run Cycle</button>
                          </div>
                        ) : (
                          <div style={{ padding: 10, color: 'white', fontSize: 12 }}><b>Manual Dept</b> — Sign off stages in Centre Panel.</div>
                        )}
                      </div>
                      <div className="pc-centre">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span className="sec-lbl" style={{ marginBottom: 0 }}>State Control</span>
                          <SPill st={currentStatus} />
                        </div>
                        {currentStatus === 'grey' && <button className="btn btn-amb btn-full" onClick={() => setDeptStatus(selectedJob.id, floor.id, 'amber')}>✓ Initiate Job &amp; Check Materials</button>}
                        {currentStatus === 'amber' && <button className="btn btn-teal btn-full" onClick={() => setInwardModalJob(selectedJob)}>📦 Material Inward &amp; Count Reconciliation</button>}
                        {currentStatus === 'green' && <button className="btn btn-teal btn-full" onClick={() => setDeptStatus(selectedJob.id, floor.id, 'blue')}>⚡ Start Production / Run Machine</button>}
                        {currentStatus === 'blue' && (
                          <div>
                            <div className="tile-grid">
                              <div className="tile"><div className="tile-val" style={{ color: 'var(--grn)' }}>{totals.totalGood}</div><div className="tile-lbl">Good Qty</div></div>
                              <div className="tile"><div className="tile-val" style={{ color: 'var(--red)' }}>{totals.totalBad}</div><div className="tile-lbl">Rejected</div></div>
                            </div>
                            <div className="inp-panel">
                              <div className="inp-title">Add Output Yield Logs</div>
                              <div className="qty-row">
                                <div><div className="qty-lbl">Good</div><input className="qty-inp" type="number" value={goodQty} onChange={(e) => setGoodQty(e.target.value)} /></div>
                                <div><div className="qty-lbl">Rejections</div><input className="qty-inp" type="number" value={badQty} onChange={(e) => setBadQty(e.target.value)} /></div>
                              </div>
                              <button className="btn btn-teal btn-full" onClick={() => { onInwardSubmit(selectedJob, { qty: (+goodQty || 0) + (+badQty || 0), goodQty: (+goodQty || 0), badQty: (+badQty || 0), receiver: 'Operator', note: 'Yield log' }); setGoodQty(''); setBadQty(''); }}>Submit Output Log</button>
                            </div>
                            <button className="btn btn-teal btn-full" onClick={handleDone}>✓ Mark Done &amp; Route Forward</button>
                          </div>
                        )}
                        {currentStatus === 'red' && <div className="alert-banner"><span className="alert-icon">⚠️</span><span className="alert-text">JOB BLOCKED. Escalated override request pending on owner.</span></div>}
                      </div>
                      <div className="pc-right">
                        <div className="sec-lbl">Escalation Controls</div>
                        <button className="btn btn-red btn-full btn-sm" style={{ marginBottom: 6 }} onClick={handleTriggerOverride}>⚠️ Quality Deviation Hold</button>
                        <button className="btn btn-ghost btn-full btn-sm" onClick={() => setDeptStatus(selectedJob.id, floor.id, 'grey')}>Reset to Idle</button>
                      </div>
                    </div>
                  )}
                  {opTab === 'spec' && (
                    <div style={{ padding: 16, fontSize: 13 }}>
                      <div className="sec-lbl">Production Blueprint &amp; Specs</div>
                      <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: 10, borderRadius: 8, color: '#B45309', marginBottom: 12 }}>⚠️ Design specifications locked by Pre-Press DTP.</div>
                      <div><b>Product:</b> {selectedJob.product}</div>
                      <div><b>Base Material:</b> Acrylic Cast (5mm clear)</div>
                    </div>
                  )}
                  {opTab === 'history' && (
                    <div style={{ padding: 16, fontSize: 12 }}>
                      <div className="sec-lbl">Activity logs</div>
                      {getInwardLogs(selectedJob.id).map((l, idx) => (
                        <div key={idx} style={{ padding: 6, borderBottom: '1px solid var(--bdr)' }}>
                          [{l.date}] Good: {l.goodQty} | Bad: {l.badQty} | Note: {l.note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--txt3)' }}>
                <h3>Please select a job from queue</h3>
              </div>
            )}
          </div>
        </div>
        {inwardModalJob && (
          <InwardModal job={inwardModalJob} floor={floor} getInwardTotals={getInwardTotals}
            onSubmit={(log) => { onInwardSubmit(inwardModalJob, log); setInwardModalJob(null); }}
            onClose={() => setInwardModalJob(null)} />
        )}
      </div>
    </div>
  );
}
