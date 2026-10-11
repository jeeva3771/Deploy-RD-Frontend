import React from 'react';

export function PBtn({ children, color = "#0D9488", bg, border, onClick, disabled, full, sm }) {
  const c = color;
  const b = bg || c + "15";
  const br = border || c + "55";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#F1F5F9" : b, color: disabled ? "#64748B" : c,
        border: `1.5px solid ${disabled ? "#E2E8F0" : br}`, borderRadius: 9,
        padding: sm ? "6px 12px" : "9px 18px", fontSize: sm ? 13 : 15, fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
        transition: "all 0.15s", opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}
