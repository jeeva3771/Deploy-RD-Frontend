import React from 'react';

export function InfoItem({ label, value, light }) {
  return (
    <div>
      <span style={{ fontSize: 9, fontWeight: 900, color: light ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: light ? '#fff' : '#0F172A', textTransform: 'uppercase' }}>{value}</span>
    </div>
  );
}