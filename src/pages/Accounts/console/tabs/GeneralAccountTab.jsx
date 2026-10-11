import React, { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "../../../../utils/url/config";
import { fmt } from "../utils/accountsFormatters";
import { toast } from "react-toastify";

// ── Tiny helpers ─────────────────────────────────────────────────────────────
function KpiCard({ icon, value, label, color, sub }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderTop: `3px solid ${color}`,
        borderRadius: 10,
        padding: "11px 14px",
        minWidth: 0,
        flex: "1 1 140px",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color, fontFamily: "monospace", lineHeight: 1.1 }}>
        {icon && <span style={{ fontSize: 13, marginRight: 4 }}>{icon}</span>}
        {value}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function BankCard({ name, balance, type }) {
  const isBank = type === "bank";
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flex: "1 1 220px",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: isBank ? "#EEF2FF" : "#ECFDF5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {isBank ? "🏦" : "💵"}
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B" }}>{name}</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2 }}>
          ₹{fmt(balance)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GeneralAccountTab() {
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const firstOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const [fromDate, setFromDate] = useState(firstOfMonth());
  const [toDate, setToDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/accounts/general-account-summary", {
        params: { from, to },
      });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching general account summary:", err);
      toast.error("Failed to load General Account data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(fromDate, toDate);
  }, [fetchData, fromDate, toDate]);

  const kpis = data?.kpis || {};
  const bankAccounts = data?.bankAccounts || [];
  const pl = data?.plSnapshot || {};
  const expenses = pl.expensesBreakdown || [];
  const maxExpense = Math.max(1, ...expenses.map((e) => e.amount));
  const totalExpenses = pl.totalExpenses || 0;

  const netProfitPositive = (pl.netProfit || 0) >= 0;

  return (
    <div style={{ position: "relative", minHeight: 400 }}>

      {/* ── Top KPI Bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
          padding: "12px 16px",
          background: "#F8FAFC",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
        }}
      >
        <KpiCard
          label="Total Cash & Bank"
          value={`₹${fmt(kpis.totalCashBank || 0)}`}
          color="#0D9488"
          sub="All bank accounts + cash"
        />
        <KpiCard
          label="Unreconciled TXNs"
          value={String(kpis.unreconciledTxns || 0)}
          color="#F59E0B"
          sub="Payments not yet reconciled"
        />
        <KpiCard
          label="Net GST Payable"
          value={`₹${fmt(kpis.netGstPayable || 0)}`}
          color="#6366F1"
          sub="After ITC deduction"
        />
        <KpiCard
          label="Next GST Filing Due"
          value={kpis.nextGstFilingDue || "—"}
          color="#EF4444"
          sub="GSTR-3B deadline"
        />
        <KpiCard
          label="Revenue (MTD)"
          value={`₹${fmt(kpis.revenueMtd || 0)}`}
          color="#059669"
          sub="Month to date invoiced"
        />
        <KpiCard
          label="Expenses (MTD)"
          value={`₹${fmt(kpis.expensesMtd || 0)}`}
          color="#DC2626"
          sub="Vendor payments period"
        />
      </div>

      {/* ── Loading Overlay ────────────────────────────────────────── */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(2px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "3px solid #E2E8F0",
              borderTopColor: "#0D9488",
              animation: "spin 0.75s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Overview: Bank Accounts ─────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>📊</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0C1A2E" }}>
              Overview
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#64748B",
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                borderRadius: 5,
                padding: "2px 6px",
              }}
            >
              {data?.period || "Current Month"}
            </span>
          </div>
        </div>
        {bankAccounts.length === 0 ? (
          <div
            style={{
              padding: "18px 24px",
              background: "#F8FAFC",
              borderRadius: 10,
              color: "#94A3B8",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            No bank/cash account data found for this period.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {bankAccounts.map((acc) => (
              <BankCard key={acc.name} {...acc} />
            ))}
          </div>
        )}
      </div>

      {/* ── P&L Snapshot ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* P&L Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            padding: "12px 16px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>📈</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0C1A2E" }}>
                P&L Snapshot
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>
                Revenue, cost of goods and expenses for the period you choose
              </div>
            </div>
          </div>

          {/* Date Range Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>FROM</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: "5px 9px",
                borderRadius: 7,
                border: "1.5px solid #CBD5E1",
                fontSize: 12,
                fontWeight: 700,
                color: "#0F172A",
                background: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>TO</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: "5px 9px",
                borderRadius: 7,
                border: "1.5px solid #CBD5E1",
                fontSize: 12,
                fontWeight: 700,
                color: "#0F172A",
                background: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <button
              onClick={() => fetchData(fromDate, toDate)}
              disabled={loading}
              style={{
                padding: "5px 11px",
                borderRadius: 7,
                border: "1.5px solid #0D9488",
                background: "#0D9488",
                color: "#FFFFFF",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "⏳" : "🔄 TODAY"}
            </button>
          </div>
        </div>

        {/* P&L Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
          }}
        >
          {[
            { label: "REVENUE", value: pl.revenue || 0, color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
            { label: "COST OF GOODS (MATERIAL)", value: pl.cogsMaterial || 0, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
            { label: "GROSS PROFIT", value: pl.grossProfit || 0, color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD" },
            {
              label: "NET PROFIT (AFTER OPEX)",
              value: pl.netProfit || 0,
              color: netProfitPositive ? "#059669" : "#DC2626",
              bg: netProfitPositive ? "#ECFDF5" : "#FEF2F2",
              border: netProfitPositive ? "#6EE7B7" : "#FECACA",
            },
          ].map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: "14px 18px",
                background: m.bg,
                borderRight: i < 3 ? "1px solid #E2E8F0" : "none",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: m.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                  opacity: 0.7,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: m.color,
                  fontFamily: "monospace",
                }}
              >
                {m.value < 0 ? "-" : ""}₹{fmt(Math.abs(m.value))}
              </div>
            </div>
          ))}
        </div>

        {/* Expense Breakdown Bar Chart */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", marginBottom: 12 }}>
            OPERATING EXPENSES BY CATEGORY
            <span style={{ fontWeight: 600, color: "#64748B", marginLeft: 6 }}>
              (₹{fmt(totalExpenses)} total)
            </span>
          </div>

          {expenses.length === 0 ? (
            <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "8px 0" }}>
              No expense data for this period.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {expenses.map((exp) => {
                const pct = Math.round((exp.amount / maxExpense) * 100);
                return (
                  <div key={exp.category} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 140,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#475569",
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    >
                      {exp.category}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 14,
                        background: "#F1F5F9",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #0D9488 0%, #059669 100%)",
                          borderRadius: 4,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 90,
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: "#0C1A2E",
                        fontFamily: "monospace",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      ₹{fmt(exp.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
