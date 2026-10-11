import React, { useState, useEffect, useCallback } from "react";
import { fmt, fmtR } from "../utils/accountsFormatters";
import { Met } from "../common/UIHelpers";
import { PeriodFilter, getCurrentMonthValue } from "../common/PeriodFilter";
import { axiosInstance } from "../../../../utils/url/config";
import { toast } from "react-toastify";

export default function PLView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());

  const fetchPL = useCallback(async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await axiosInstance.get("/accounts/pl-summary", { params });
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching P&L summary:", err);
      toast.error("Failed to load P&L data from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPL(selectedMonth);
  }, [fetchPL, selectedMonth]);

  const period = data?.period || "Current Month";
  const revenue = data?.revenue || { invoiced: 0, collected: 0, pending: 0, totalWithGst: 0, gstCollected: 0 };
  const costs = data?.costs || { material: 0, labour: 0, overhead: 0, logistics: 0, misc: 0, total: 0 };
  const grossProfit = data?.grossProfit ?? (revenue.invoiced - (costs.material + costs.labour));
  const grossMarginPct = data?.grossMarginPct ?? (revenue.invoiced > 0 ? ((grossProfit / revenue.invoiced) * 100).toFixed(1) : 0);
  const netProfit = data?.netProfit ?? (grossProfit - (costs.overhead + costs.logistics + costs.misc) - (data?.tdsPayable || 0));
  const netMarginPct = data?.netMarginPct ?? (revenue.invoiced > 0 ? ((netProfit / revenue.invoiced) * 100).toFixed(1) : 0);
  const trend = data?.trend || [];
  const availableFinancialYears = data?.availableFinancialYears || [];
  const availableMonths = data?.availableMonths || [];

  const maxR = Math.max(1, ...(trend.map((t) => Math.max(t.r || 0, t.c || 0))));

  return (
    <div style={{ position: "relative", minHeight: 350 }}>
      <PeriodFilter
        value={selectedMonth}
        onChange={setSelectedMonth}
        availableFinancialYears={availableFinancialYears}
        availableMonths={availableMonths}
        label="P&L Period:"
        loading={loading}
        onRefresh={() => fetchPL(selectedMonth)}
      />

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

      {/* KPI Metrics Cards */}
      <div className="g4mb" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <Met v={"Rs " + fmt(revenue.invoiced)} l="Gross Revenue" c="#059669" bg="#ECFDF5" bd="#6EE7B7" />
        <Met v={"Rs " + fmt(costs.total)} l="Total Costs" c="#EF4444" bg="#FEF2F2" bd="#FECACA" />
        <Met v={"Rs " + fmt(grossProfit)} l="Gross Profit" c="#0D9488" bg="#F0FDFA" bd="#99F6E4" />
        <Met v={grossMarginPct + "%"} l="Gross Margin" c="#8B5CF6" bg="#F5F3FF" bd="#DDD6FE" />
      </div>

      {/* Charts & P&L Statement Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Trend Bar Chart */}
        <div className="card">
          <div className="ch">
            <div className="cht">Revenue vs Cost — Monthly Trend</div>
          </div>
          <div className="cb">
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 140, padding: "10px 0" }}>
              {trend.map((t) => (
                <div key={t.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "#059669", fontFamily: "monospace" }}>
                    Rs {fmt(t.r)}
                  </div>
                  <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                    <div
                      title={`Revenue: Rs ${fmt(t.r)}`}
                      style={{
                        flex: 1,
                        background: "linear-gradient(180deg,#059669,#0D9488)",
                        borderRadius: "4px 4px 0 0",
                        height: Math.max(4, Math.round(((t.r || 0) / maxR) * 100)) + "%",
                        minHeight: 4,
                      }}
                    />
                    <div
                      title={`Cost: Rs ${fmt(t.c)}`}
                      style={{
                        flex: 1,
                        background: "linear-gradient(180deg,#EF4444,#F59E0B)",
                        borderRadius: "4px 4px 0 0",
                        height: Math.max(4, Math.round(((t.c || 0) / maxR) * 100)) + "%",
                        minHeight: 4,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>{t.m}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, borderTop: "1px solid #F1F5F9", paddingTop: 8 }}>
              {[
                { c: "#059669", l: "Revenue (Invoiced)" },
                { c: "#EF4444", l: "Costs (Vendor / Production)" },
              ].map((x) => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: x.c }}>
                  <div style={{ width: 10, height: 10, background: x.c, borderRadius: 2 }} />
                  {x.l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* P&L Statement Table */}
        <div className="card">
          <div className="ch" style={{ background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="cht">P&L Statement — {period}</div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>Net Margin: {netMarginPct}%</span>
          </div>
          <div className="cb" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <tbody>
                {[
                  { l: "REVENUE", hdr: true },
                  { l: "Gross Invoiced (Excl. GST)", v: revenue.invoiced, c: "#059669" },
                  { l: "Collected (Client Receipts)", v: revenue.collected, c: "#059669" },
                  { l: "Pending Receivables", v: revenue.pending, c: "#F59E0B" },
                  { l: "COSTS & EXPENSES", hdr: true },
                  { l: "Raw Material Purchases", v: costs.material, c: "#EF4444" },
                  { l: "Labour & Fabrication (194C)", v: costs.labour, c: "#EF4444" },
                  { l: "Overhead & IT Services (194J)", v: costs.overhead, c: "#EF4444" },
                  { l: "Logistics & Transport", v: costs.logistics, c: "#EF4444" },
                  { l: "Miscellaneous Outsource", v: costs.misc, c: "#EF4444" },
                  { l: "Total Production & Operating Costs", v: costs.total, bold: true, c: "#EF4444", bg: "#FEF2F2" },
                  { l: "GROSS PROFIT", v: grossProfit, bold: true, c: "#0D9488", bg: "#F0FDFA" },
                  { l: "TDS Provision (Vendor TDS)", v: data?.tdsPayable || 0, c: "#8B5CF6" },
                  { l: "NET PROFIT", v: netProfit, bold: true, c: "#8B5CF6", bg: "#F5F3FF" },
                ].map((r, i) => (
                  <tr key={i} style={{ background: r.bg || "white", borderBottom: "1px solid #F1F5F9" }}>
                    <td
                      style={{
                        padding: "7px 14px",
                        fontWeight: r.bold || r.hdr ? 900 : 600,
                        color: r.hdr ? "#64748B" : r.bold ? r.c : "#475569",
                        fontSize: r.hdr ? 10.5 : 12,
                        textTransform: r.hdr ? "uppercase" : "none",
                        letterSpacing: r.hdr ? "0.5px" : "normal",
                      }}
                    >
                      {r.l}
                    </td>
                    <td
                      style={{
                        padding: "7px 14px",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: r.bold ? 900 : 700,
                        color: r.c || "#475569",
                        fontSize: r.bold ? 13 : 12,
                      }}
                    >
                      {r.v !== undefined && !r.hdr ? fmtR(r.v) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
