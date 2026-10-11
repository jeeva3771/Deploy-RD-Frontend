import React, { useState, useEffect, useCallback } from "react";
import { fmt } from "../utils/accountsFormatters";
import { Met } from "../common/UIHelpers";
import { PeriodFilter, getCurrentMonthValue } from "../common/PeriodFilter";
import { axiosInstance } from "../../../../utils/url/config";

export default function Dashboard({
  jobs,
  total,
  payable,
  pings,
  onQA,
  clientData = [],
}) {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonthValue());
  const [availableFinancialYears, setAvailableFinancialYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [plData, setPlData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [machines, setMachines] = useState([]);

  // Fetch all dashboard metrics dynamically based on selected period (Month / FY / All Time)
  const fetchDashboardData = useCallback(async (period) => {
    try {
      setLoading(true);
      const params = period ? { month: period } : {};
      const [plRes, stockRes, gstRes, machineRes] = await Promise.allSettled([
        axiosInstance.get("/accounts/pl-summary", { params }),
        axiosInstance.get("/accounts/stock-summary", { params }),
        axiosInstance.get("/accounts/gst-tds-summary", { params }),
        axiosInstance.get("/machine?all=true"),
      ]);

      if (plRes.status === "fulfilled" && plRes.value.data?.success) {
        const pld = plRes.value.data.data;
        setPlData(pld);
        if (pld?.availableFinancialYears)
          setAvailableFinancialYears(pld.availableFinancialYears);
        if (pld?.availableMonths) setAvailableMonths(pld.availableMonths);
      }
      if (stockRes.status === "fulfilled" && stockRes.value.data?.success) {
        setStockData(stockRes.value.data);
      }
      if (gstRes.status === "fulfilled" && gstRes.value.data?.success) {
        setGstData(gstRes.value.data.data);
        if (gstRes.value.data.data?.availableFinancialYears?.length) {
          setAvailableFinancialYears(
            gstRes.value.data.data.availableFinancialYears,
          );
        }
        if (gstRes.value.data.data?.availableMonths?.length) {
          setAvailableMonths(gstRes.value.data.data.availableMonths);
        }
      }
      if (
        machineRes.status === "fulfilled" &&
        machineRes.value.data?.success &&
        Array.isArray(machineRes.value.data.data)
      ) {
        setMachines(machineRes.value.data.data);
      }
    } catch (err) {
      console.warn("Error loading live dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedPeriod);
  }, [fetchDashboardData, selectedPeriod]);

  const fysToRender = availableFinancialYears;
  const monthsToRender = availableMonths;

  // Dynamic Revenue & Margin calculations
  const periodLabel = plData?.period || "Current Month";
  const invoicedRevenue = Number(plData?.revenue?.invoiced || 0);
  const collectedRevenue = Number(plData?.revenue?.collected || 0);
  const pendingRevenue = Number(
    plData?.revenue?.pending ?? invoicedRevenue - collectedRevenue,
  );
  const revenueTarget = Number(plData?.revenue?.target || 2500000);

  const rawCosts = plData?.costs || {
    material: 0,
    labour: 0,
    overhead: 0,
    logistics: 0,
    misc: 0,
  };
  const totalCost = Number(
    plData?.costs?.total ??
      Object.values(rawCosts).reduce((s, v) => s + (Number(v) || 0), 0),
  );
  const grossProfit = Number(
    plData?.grossProfit ?? invoicedRevenue - totalCost,
  );
  const grossMarginPct =
    plData?.grossMarginPct ??
    (invoicedRevenue > 0
      ? ((grossProfit / invoicedRevenue) * 100).toFixed(1)
      : "0.0");

  // Dynamic Stock & Asset Block calculations
  const stockVal = Number(stockData?.metrics?.totalStockValue || 0);
  const lowStockCount = Number(stockData?.metrics?.lowStockAlerts || 0);
  const totalStockItems = Number(stockData?.metrics?.totalItems || 0);
  const stockList = stockData?.stock || [];
  const uniqueLocations = Array.from(
    new Set(stockList.map((i) => i.loc).filter(Boolean)),
  );
  const activeGodownsCount =
    uniqueLocations.length > 0 ? uniqueLocations.length : 1;
  const godownsWithStock =
    stockList.filter((i) => (i.cl || 0) > 0).length > 0
      ? activeGodownsCount
      : 0;

  const assetNet = machines.reduce((s, m) => {
    const cost = Number(m.gross_cost) || 0;
    const book = Number(m.book_value) || 0;
    const dep = Number(m.accumulated_depreciation) || Math.max(0, cost - book);
    return s + (book > 0 ? book : Math.max(0, cost - dep));
  }, 0);
  const activeMachines = machines.filter(
    (m) =>
      m.is_active !== false && m.is_active !== 0 && m.is_active !== "false",
  ).length;

  // Dynamic GST & TDS
  const gstNet = Number(gstData?.gst?.netPayable || 0);
  const gstr1DueDate = gstData?.gst?.gstr1DueDate || "11th";

  // Dynamic Overdue calculation from live clientData
  const overdueClients = (clientData || []).filter((c) =>
    (c.subjobs || []).some(
      (i) => i.status === "overdue" || (i.due > 0 && i.outstanding > 0),
    ),
  ).length;

  const collectionAchievedPct =
    revenueTarget > 0
      ? Math.min(100, Math.round((collectedRevenue / revenueTarget) * 100))
      : 0;
  const invoicedPct = invoicedRevenue > 0 ? 100 : 0;
  const collectedPct =
    invoicedRevenue > 0
      ? Math.min(100, Math.round((collectedRevenue / invoicedRevenue) * 100))
      : 0;
  const pendingPct = invoicedRevenue > 0 ? Math.max(0, 100 - collectedPct) : 0;

  return (
    <div>
      <PeriodFilter
        value={selectedPeriod}
        onChange={setSelectedPeriod}
        availableFinancialYears={fysToRender}
        availableMonths={monthsToRender}
        label="Dashboard Period:"
        loading={loading}
        onRefresh={() => fetchDashboardData(selectedPeriod)}
        showAllTime={true}
      />

      {/* Top Metric Cards (Row 1) */}
      <div className="g4mb">
        <Met
          v={"Rs " + fmt(total)}
          l="Total Receivable"
          c="#F59E0B"
          bg="#FFFBEB"
          bd="#FDE68A"
        />
        <Met
          v={"Rs " + fmt(payable)}
          l="Total Payable"
          c="#EF4444"
          bg="#FEF2F2"
          bd="#FECACA"
        />
        <Met
          v={"Rs " + fmt(invoicedRevenue)}
          l={`${periodLabel} Revenue`}
          c="#059669"
          bg="#ECFDF5"
          bd="#6EE7B7"
        />
        <Met
          v={`${grossMarginPct}%`}
          l="Gross Margin"
          c="#8B5CF6"
          bg="#F5F3FF"
          bd="#DDD6FE"
        />
      </div>

      {/* Top Metric Cards (Row 2) */}
      <div className="g4mb">
        <Met
          v={"Rs " + fmt(stockVal)}
          l="Total Stock Value"
          c="#0D9488"
          bg="#F0FDFA"
          bd="#99F6E4"
        />
        <Met
          v={"Rs " + fmt(assetNet)}
          l="Net Asset Block"
          c="#6366F1"
          bg="#EEF2FF"
          bd="#C7D2FE"
        />
        <Met
          v={`${activeGodownsCount} Locations`}
          l="Active Stock Locations"
          c="#F59E0B"
          bg="#FFFBEB"
          bd="#FDE68A"
        />
        <Met
          v={`${activeMachines} Active Machines`}
          l="Plant & Machinery"
          c="#059669"
          bg="#ECFDF5"
          bd="#6EE7B7"
        />
      </div>

      {/* Middle Grid: Action Required, Revenue Collection, Cost Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Action Required */}
        <div className="card">
          <div className="ch">
            <div className="cht" style={{ color: "#EF4444" }}>
              Action Required
            </div>
          </div>
          <div className="cb">
            {[
              {
                i: "🔔",
                t: `${pings} billing doc requests`,
                sub: "Pending Invoice/Challan/E-Way",
                c: "#F59E0B",
                bg: "#FFFBEB",
              },
              {
                i: "⏰",
                t: `${overdueClients} client invoices overdue`,
                sub: "Follow up for payment",
                c: "#EF4444",
                bg: "#FEF2F2",
              },
              {
                i: "📦",
                t: `${lowStockCount} items low stock`,
                sub: "Below minimum reorder level",
                c: "#8B5CF6",
                bg: "#F5F3FF",
              },
              {
                i: "🧾",
                t: `GST GSTR-1 due by ${gstr1DueDate}`,
                sub: `Rs ${fmt(gstNet)} net payable`,
                c: "#0EA5E9",
                bg: "#F0F9FF",
              },
            ].map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "9px 11px",
                  background: a.bg,
                  borderRadius: 9,
                  marginBottom: 6,
                  borderLeft: "3px solid " + a.c,
                }}
              >
                <span style={{ fontSize: 15 }}>{a.i}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: a.c }}>
                    {a.t}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748B",
                      marginTop: 1,
                    }}
                  >
                    {a.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Monthly Collection */}
        <div className="card">
          <div className="ch">
            <div className="cht" style={{ color: "#059669" }}>
              {periodLabel} Collection
            </div>
          </div>
          <div className="cb">
            {[
              {
                l: "Invoiced",
                v: invoicedRevenue,
                c: "#0C1A2E",
                pct: invoicedPct,
              },
              {
                l: "Collected",
                v: collectedRevenue,
                c: "#059669",
                pct: collectedPct,
              },
              {
                l: "Pending",
                v: pendingRevenue,
                c: "#F59E0B",
                pct: pendingPct,
              },
            ].map((r) => (
              <div key={r.l} style={{ marginBottom: 9 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#64748B",
                    }}
                  >
                    {r.l}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: r.c,
                      fontFamily: "monospace",
                      marginLeft: "auto",
                    }}
                  >
                    Rs {fmt(r.v)}
                  </span>
                </div>
                <div
                  style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: r.c,
                      borderRadius: 3,
                      width: r.pct + "%",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
            <div
              style={{
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: 8,
                padding: "8px 12px",
                marginTop: 10,
              }}
            >
              <div
                style={{ fontSize: 11.5, fontWeight: 700, color: "#059669" }}
              >
                Target: Rs {fmt(revenueTarget)} — {collectionAchievedPct}%
                collected
              </div>
            </div>
          </div>
        </div>

        {/* Live Cost Breakdown */}
        <div className="card">
          <div className="ch">
            <div className="cht" style={{ color: "#6366F1" }}>
              Live Cost Breakdown
            </div>
          </div>
          <div className="cb">
            {Object.entries(rawCosts).map(([k, v]) => {
              const L = {
                material: "Raw Material",
                labour: "Labour",
                overhead: "Overhead",
                logistics: "Logistics",
                misc: "Misc",
              };
              const C = {
                material: "#EF4444",
                labour: "#F59E0B",
                overhead: "#6366F1",
                logistics: "#0D9488",
                misc: "#94A3B8",
              };
              const numV = Number(v) || 0;
              const pct =
                totalCost > 0 ? Math.round((numV / totalCost) * 100) : 0;
              return (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 7,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: C[k] || "#64748B",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>
                    {L[k] || k}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: C[k] || "#1E293B",
                      fontFamily: "monospace",
                      minWidth: 65,
                      textAlign: "right",
                    }}
                  >
                    Rs {fmt(numV)}
                  </span>
                  <div
                    style={{
                      width: 44,
                      height: 4,
                      background: "#F1F5F9",
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: C[k] || "#64748B",
                        borderRadius: 2,
                        width: pct + "%",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#94A3B8",
                      minWidth: 26,
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="card">
        <div className="ch">
          <div className="cht">Quick Actions</div>
        </div>
        <div className="cb">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            {[
              {
                i: "🧾",
                l: "Create Invoice",
                c: "#059669",
                bg: "#ECFDF5",
                bd: "#A7F3D0",
              },
              {
                i: "📄",
                l: "Create Challan",
                c: "#0EA5E9",
                bg: "#E0F2FE",
                bd: "#BAE6FD",
              },
              {
                i: "🚛",
                l: "E-Way Bill",
                c: "#F59E0B",
                bg: "#FFFBEB",
                bd: "#FDE68A",
              },
              {
                i: "📋",
                l: "New Sales Order",
                c: "#6366F1",
                bg: "#EEF2FF",
                bd: "#C7D2FE",
              },
              {
                i: "📥",
                l: "Record Payment",
                c: "#0D9488",
                bg: "#F0FDFA",
                bd: "#99F6E4",
              },
              // { i: "📊", l: "Export Report", c: "#8B5CF6", bg: "#F5F3FF", bd: "#DDD6FE" }
            ].map((a) => (
              <button
                key={a.l}
                className="btn bl"
                style={{
                  background: a.bg,
                  color: a.c,
                  borderColor: a.bd,
                  flexDirection: "column",
                  gap: 5,
                  padding: "10px 8px",
                  height: "auto",
                  cursor: "pointer",
                }}
                onClick={() => onQA(a.l)}
              >
                <span style={{ fontSize: 22 }}>{a.i}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  {a.l}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
