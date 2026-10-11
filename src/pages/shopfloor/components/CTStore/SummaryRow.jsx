import React from 'react';

export function SummaryRow({ label, value, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: big ? 0 : 6 }}>
      <span style={{ fontSize: big ? 13 : 12, fontWeight: big ? 900 : 600, color: big ? 'var(--txt)' : 'var(--txt2)', textTransform: big ? 'uppercase' : 'none' }}>{label}</span>
      <span style={{ fontSize: big ? 20 : 13, fontWeight: 900, color: big ? '#7C3AED' : 'var(--txt)', fontFamily: 'monospace' }}>₹{value.toFixed(2)}</span>
    </div>
  );
}