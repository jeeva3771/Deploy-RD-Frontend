import React from "react";
import GeneralAccountTab from "./console/tabs/GeneralAccountTab";
import "./accountsConsole.css";

/**
 * Standalone wrapper for General Account page.
 * Accessible from sidebar at /general-account with permission 48.
 */
export default function GeneralAccountPage() {
  return (
    <div className="accounts-console-wrapper">
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#0C1A2E",
          padding: "10px 16px",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottom: "1px solid #1E293B",
        }}
      >
        <span style={{ fontSize: 18 }}>🏦</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF" }}>
            General Account
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
            Cash & Bank overview · P&L Snapshot · Expense breakdown
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="app-layout"
        style={{
          border: "1.5px solid #E2E8F0",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          overflow: "hidden",
        }}
      >
        <div className="inner-content">
          <GeneralAccountTab />
        </div>
      </div>
    </div>
  );
}
