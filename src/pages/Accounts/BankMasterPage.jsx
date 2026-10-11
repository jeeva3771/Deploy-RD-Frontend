import React from "react";
import BankMasterTab from "./console/tabs/BankMasterTab";
import "./accountsConsole.css";

/**
 * Standalone wrapper for Bank Master page.
 * Accessible from sidebar at /bank-master with permission 49.
 */
export default function BankMasterPage() {
  return (
    <div className="accounts-console-wrapper">


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
          <BankMasterTab />
        </div>
      </div>
    </div>
  );
}
