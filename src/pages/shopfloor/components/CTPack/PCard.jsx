import React from 'react';

export function PCard({ title, icon, color = "#0D9488", bg, children }) {
  const b = bg || color + "10";
  return (
    <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ background: b, padding: "10px 14px", display: "flex", alignItems: "center", gap: 7, borderBottom: `1.5px solid ${color}30` }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}
