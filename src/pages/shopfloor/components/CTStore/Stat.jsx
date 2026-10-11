import React from 'react';

export function Stat({ label, value, color, last }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: last ? 'none' : '1px solid #E2E8F0', padding: 8 }}>
      <span style={{ fontSize: 9, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color }}>{value}</span>
    </div>
  );
}