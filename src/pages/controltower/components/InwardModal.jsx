import React, { useState } from 'react';

export default function InwardModal({ job, floor, getInwardTotals, onSubmit, onClose }) {
  const [qty, setQty] = useState('');
  const [goodQty, setGoodQty] = useState('');
  const [badQty, setBadQty] = useState('');
  const [receiver, setReceiver] = useState('Operator');
  const [note, setNote] = useState('');
  const totals = getInwardTotals(job.id);

  function handleSave() {
    if (!qty || !goodQty || !receiver) return;
    onSubmit({ qty: +qty, goodQty: +goodQty, badQty: +badQty || 0, receiver, note });
  }

  return (
    <div className="ct-inward-backdrop" onClick={onClose}>
      <div className="imb" onClick={(e) => e.stopPropagation()}>
        <div className="imb-hdr">
          <div className="imb-title">Material Inward Count Check</div>
          <button className="modal-close" style={{ color: 'white' }} onClick={onClose}>×</button>
        </div>
        <div className="imb-body">
          <div className="imb-prog">
            <div className="imb-stat">
              <div className="imb-stat-val">{job.qty}</div>
              <div className="imb-stat-lbl">Target Qty</div>
            </div>
            <div className="imb-stat">
              <div className="imb-stat-val">{totals.totalGood}</div>
              <div className="imb-stat-lbl">Accumulated Good</div>
            </div>
            <div className="imb-stat" style={{ borderRight: 'none' }}>
              <div className="imb-stat-val">{totals.totalBad}</div>
              <div className="imb-stat-lbl">Rejections</div>
            </div>
          </div>
          <div className="imb-section">
            <div className="imb-sec-title">Inward count entries</div>
            <div className="form-row">
              <div className="form-lbl">Total physical count received</div>
              <input className="form-inp" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </div>
            <div className="g2">
              <div className="form-row">
                <div className="form-lbl">Good Qty</div>
                <input className="form-inp" type="number" value={goodQty} onChange={(e) => setGoodQty(e.target.value)} placeholder="0" />
              </div>
              <div className="form-row">
                <div className="form-lbl">Rejections count</div>
                <input className="form-inp" type="number" value={badQty} onChange={(e) => setBadQty(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
          <div className="imb-section">
            <div className="imb-sec-title">Reconciliation metadata</div>
            <div className="form-row">
              <div className="form-lbl">Received By / Operator name</div>
              <input className="form-inp" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-lbl">Deviation / Verification Note</div>
              <input
                className="form-inp"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Scratches on 3 units, sorted out."
              />
            </div>
          </div>
          <button className="btn btn-teal btn-full" style={{ background: '#F59E0B' }} onClick={handleSave}>
            Confirm Inward Count &amp; Update Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
