import React from 'react';

export function StatusPill({ stage }) {
  const colors = {
    INWARD: '#F59E0B', QC: '#3B82F6', PACKING: '#14B8A6',
    INVOICE: '#8B5CF6', DISPATCHED: '#10B981'
  };
  return <span style={{ padding: '4px 8px', borderRadius: 4, background: colors[stage] || '#ccc', color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{stage}</span>;
}