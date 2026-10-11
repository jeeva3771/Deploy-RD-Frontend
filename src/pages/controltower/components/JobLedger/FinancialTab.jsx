import React from "react";
import { fmtR, pct } from "./data.js";
import { getUserRole } from "../../../../utils/permission/auth.jsx";

function FinancialTab({ job }) {
  const userRole = getUserRole();
  const userRoleLower = String(userRole?.name || userRole || "").toLowerCase();
  const isAdmin =
    userRoleLower.includes("admin") ||
    userRoleLower === "super admin" ||
    userRoleLower === "superadmin";

  const defaultFinancial = {
    revenue: {
      subtotal: job?.soAmt || 0,
      gstAmt: ((job?.soAmt || 0) * (job?.gst || 18)) / 100,
      total: job?.soTotal || 0,
    },
    materialCost: { bom: 0, actual: 0, variance: 0, is_actual: false },
    processCost: {
      bom: 0,
      actual: 0,
      variance: 0,
      inhouse: 0,
      outsource: 0,
      is_actual: false,
    },
    packingCost: { total: 0, bom_estimate: 0, is_actual: false },
    overhead: { pct: 10, amt: 0 },
  };
  const fin = job?.financial || defaultFinancial;
  const totalCost =
    (fin.materialCost?.actual || 0) +
    (fin.processCost?.actual || 0) +
    (fin.packingCost?.total || 0) +
    (fin.overhead?.amt || 0);
  const revSub = fin.revenue?.subtotal || 0;
  const gp = revSub - totalCost;
  const gpm = pct(gp, revSub);

  React.useEffect(() => {
    if (job) {
      console.log(
        `%c[Job Ledger Financial P&L] SO Rate Calculation for Job ${job.id || job.job_no}:`,
        "color: #059669; font-weight: bold; font-size: 13px;",
        {
          jobId: job.id,
          jobNo: job.job_no,
          subJobNo: job.sub_job_no,
          client: job.client,
          product: job.product,
          soRate: job.soRate,
          qty: job.qty,
          soAmt: job.soAmt,
          gst: job.gst,
          soTotal: job.soTotal,
          revenue: fin.revenue,
          costs: {
            materialBom: fin.materialCost?.bom,
            materialActual: fin.materialCost?.actual,
            processBom: fin.processCost?.bom,
            processActual: fin.processCost?.actual,
            packing: fin.packingCost?.total,
            overhead: fin.overhead?.amt,
          },
          grossProfit: gp,
          grossMargin: gpm + "%",
        },
      );
    }
  }, [job?.id, job?.soRate, job?.qty, job?.soAmt, fin, gp, gpm, job]);

  if (!job) return null;
  const COST_COLORS = {
    Material: "#EF4444",
    Process: "#F59E0B",
    Packing: "#6366F1",
    Overhead: "#94A3B8",
  };
  const costs = [
    ["Material", fin.materialCost?.actual || 0],
    ["Process", fin.processCost?.actual || 0],
    ["Packing", fin.packingCost?.total || 0],
    ["Overhead", fin.overhead?.amt || 0],
  ];
  const maxCost = Math.max(...costs.map((c) => c[1]), 1);

  // Data source badge helper
  const ActualBadge = ({ isActual }) => (
    <span
      style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 800,
        padding: "2px 6px",
        borderRadius: 4,
        marginLeft: 6,
        background: isActual ? "#DCFCE7" : "#F1F5F9",
        color: isActual ? "#166534" : "#64748B",
        border: `1px solid ${isActual ? "#86EFAC" : "#CBD5E1"}`,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        verticalAlign: "middle",
      }}
    >
      {isActual ? "✓ Live" : "BOM Est"}
    </span>
  );

  const formatRate = (r) => {
    if (!r) return "₹0";
    const num = Number(r);
    return num % 1 === 0
      ? "₹" + Math.round(num).toLocaleString("en-IN")
      : "₹" +
          num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
  };

  return (
    <div>
      <div
        className="rg4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[
          {
            l: "Revenue (ex-GST)",
            v: fmtR(fin.revenue.subtotal),
            c: "#059669",
            bg: "#ECFDF5",
            bd: "#6EE7B7",
          },
          {
            l: "Total Cost Actual",
            v: fmtR(totalCost),
            c: "#EF4444",
            bg: "#FEF2F2",
            bd: "#FECACA",
          },
          ...(isAdmin
            ? [
                {
                  l: "Gross Profit",
                  v: fmtR(gp),
                  c: gp > 0 ? "#059669" : "#EF4444",
                  bg: gp > 0 ? "#ECFDF5" : "#FEF2F2",
                  bd: gp > 0 ? "#6EE7B7" : "#FECACA",
                },
                {
                  l: "Gross Margin",
                  v: gpm + "%",
                  c: "#8B5CF6",
                  bg: "#F5F3FF",
                  bd: "#DDD6FE",
                },
              ]
            : []),
        ].map((m) => (
          <div
            key={m.l}
            style={{
              background: m.bg,
              border: "1.5px solid " + m.bd,
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: 28.5,
                fontWeight: 900,
                color: m.c,
                fontFamily: "monospace",
              }}
            >
              {m.v}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: m.c,
                textTransform: "uppercase",
                marginTop: 3,
              }}
            >
              {m.l}
            </div>
          </div>
        ))}
      </div>
      <div
        className="rg2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <div className="lcard">
          <div className="lch">
            <div className="lcht">P&L Statement — Job {job.id}</div>
          </div>
          <div className="lcb">
            <div className="fin-row hdr">REVENUE</div>
            <div className="fin-row">
              <span>SO Rate × Qty</span>
              <span className="mn">
                {formatRate(
                  job.soRate ||
                    (job.qty > 0 && fin.revenue?.subtotal > 0
                      ? fin.revenue.subtotal / job.qty
                      : 0),
                )}{" "}
                × {job.qty}
              </span>
            </div>
            <div className="fin-row subtotal">
              <span>Revenue (Ex-GST)</span>
              <span className="mn-g">{fmtR(fin.revenue.subtotal)}</span>
            </div>
            <div className="fin-row">
              <span>GST {job.gst}%</span>
              <span className="mn">{fmtR(fin.revenue.gstAmt)}</span>
            </div>
            <div className="fin-row subtotal">
              <span>Total Invoice Value</span>
              <span className="mn-g">{fmtR(fin.revenue.total)}</span>
            </div>
            <div className="fin-row hdr" style={{ marginTop: 8 }}>
              COSTS
            </div>
            <div className="fin-row">
              <span>Material Cost — BOM</span>
              <span className="mn">{fmtR(fin.materialCost.bom)}</span>
            </div>
            <div className="fin-row">
              <span>
                Material Cost — Actual
                <ActualBadge isActual={fin.materialCost?.is_actual} />
              </span>
              <span
                className="mn"
                style={{
                  color:
                    fin.materialCost.actual > fin.materialCost.bom
                      ? "#EF4444"
                      : "#059669",
                }}
              >
                {fmtR(fin.materialCost.actual)}
              </span>
            </div>
            <div className="fin-row">
              <span>Material Variance</span>
              <span
                className="mn"
                style={{
                  color: fin.materialCost.variance > 0 ? "#EF4444" : "#059669",
                }}
              >
                {fin.materialCost.variance > 0 ? "+" : ""}
                {fmtR(fin.materialCost.variance)}
              </span>
            </div>
            <div className="fin-row">
              <span>Process Cost — BOM</span>
              <span className="mn">{fmtR(fin.processCost.bom)}</span>
            </div>
            <div className="fin-row">
              <span>
                Process Cost — Actual
                <ActualBadge isActual={fin.processCost?.is_actual} />
              </span>
              <span
                className="mn"
                style={{
                  color:
                    fin.processCost.actual > fin.processCost.bom
                      ? "#EF4444"
                      : fin.processCost.actual === 0
                        ? "#94A3B8"
                        : "#059669",
                }}
              >
                {fin.processCost.actual
                  ? fmtR(fin.processCost.actual)
                  : "In Progress"}
              </span>
            </div>
            {(fin.processCost?.inhouse > 0 ||
              fin.processCost?.outsource > 0) && (
              <div
                className="fin-row"
                style={{ paddingLeft: 12, fontSize: 11, color: "#64748B" }}
              >
                <span>
                  ↳ Inhouse: {fmtR(fin.processCost.inhouse || 0)} &nbsp;|&nbsp;
                  Outsource: {fmtR(fin.processCost.outsource || 0)}
                </span>
              </div>
            )}
            <div className="fin-row">
              <span>
                Packing + Logistics
                <ActualBadge isActual={fin.packingCost?.is_actual} />
              </span>
              <span className="mn">{fmtR(fin.packingCost.total)}</span>
            </div>
            <div className="fin-row">
              <span>Overhead ({fin.overhead.pct}%)</span>
              <span className="mn">{fmtR(fin.overhead.amt)}</span>
            </div>
            <div className="fin-row subtotal">
              <span>Total Cost</span>
              <span className="mn-r">{fmtR(totalCost)}</span>
            </div>
            {isAdmin && (
              <div className="fin-row total">
                <span>GROSS PROFIT</span>
                <span
                  className="mn"
                  style={{
                    color: gp > 0 ? "#059669" : "#EF4444",
                    fontSize: 17,
                  }}
                >
                  {fmtR(gp)} ({gpm}%)
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="lcard">
          <div className="lch">
            <div className="lcht">Cost Composition</div>
          </div>
          <div className="lcb">
            <div className="fin-bar-wrap">
              {costs.map(([name, val]) => (
                <div key={name} className="fin-bar-row">
                  <div
                    style={{
                      minWidth: 80,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0C1A2E",
                    }}
                  >
                    {name}
                  </div>
                  <div className="fin-bar">
                    <div
                      className="fin-bar-fill"
                      style={{
                        width: pct(val, maxCost) + "%",
                        background: COST_COLORS[name],
                      }}
                    />
                  </div>
                  <div
                    style={{
                      minWidth: 80,
                      textAlign: "right",
                      fontSize: 11.5,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      color: COST_COLORS[name],
                    }}
                  >
                    {fmtR(val)}
                  </div>
                  <div
                    style={{
                      minWidth: 35,
                      textAlign: "right",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#94A3B8",
                    }}
                  >
                    {pct(val, totalCost)}%
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{ height: 1, background: "#E2E8F0", margin: "12px 0" }}
            />
            <div
              className="rg2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                ["BOM Material", fmtR(fin.materialCost.bom)],
                ["Actual Material", fmtR(fin.materialCost.actual)],
                ["BOM Process", fmtR(fin.processCost.bom)],
                [
                  "Actual Process",
                  fmtR(fin.processCost.actual) || "In Progress",
                ],
                ["Mat. Variance", fmtR(fin.materialCost.variance)],
                ["Proc. Variance", fmtR(fin.processCost.variance)],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 8,
                    padding: "7px 9px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      color: "#0C1A2E",
                      marginTop: 1,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialTab;
