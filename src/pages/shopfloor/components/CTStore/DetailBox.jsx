import React from 'react';

export function DetailBox({ label, value, bg, border, color }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
      <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ display: 'block', fontSize: 20, fontWeight: 900, color, marginTop: 4 }}>{value}</span>
    </div>
  );
}