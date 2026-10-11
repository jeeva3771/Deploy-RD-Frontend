import React from "react";

export function Th({ ch }) {
  return <th style={{ padding: '8px 10px', background: '#0C1A2E', color: 'rgba(255,255,255,.85)', fontWeight: 800, fontSize: 11, letterSpacing: '0.4px', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>{ch}</th>;
}

export function Td({ v, mono, bold, c, cls }) {
  return <td className={cls || ''} style={{ padding: '8px 10px', fontSize: 12.5, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: bold ? 900 : 600, color: c || '#475569' }}>{v}</td>;
}

export function Met({ v, l, c, bg, bd }) {
  return (
    <div style={{ background: bg, border: '1.5px solid ' + bd, borderRadius: 11, padding: '10px 14px' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: c, fontFamily: 'monospace' }}>{v}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
    </div>
  );
}

export function Tag2({ l, c, bg, bd }) {
  return <span style={{ background: bg || c + '15', color: c, border: '1px solid ' + (bd || c + '44'), borderRadius: 7, padding: '3px 8px', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', display: 'inline-block' }}>{l}</span>;
}
