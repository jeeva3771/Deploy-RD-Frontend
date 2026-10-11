import React from 'react';

export function StageTrack({ stage }) {
  const stages = ['INWARD', 'QC', 'PACKING', 'INVOICE', 'DISPATCHED'];
  const currentIndex = stages.indexOf(stage);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
      {stages.map((s, i) => (
        <div key={s} style={{ flex: 1, height: '6px', borderRadius: '3px', background: i <= currentIndex ? '#14B8A6' : '#E2E8F0' }} title={s} />
      ))}
    </div>
  );
}