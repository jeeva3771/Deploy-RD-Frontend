import React from "react";

const inr = (n) => {
  const num = typeof n === "number" ? n : Number(n);
  return "\u20B9" + (isNaN(num) ? 0 : num).toLocaleString("en-IN");
};

function scoreBand(score) {
  if (score >= 80) return { color: "#16A34A" };
  if (score >= 60) return { color: "#D97706" };
  return { color: "#DC2626" };
}

function avgScore(rows) {
  if (!rows || rows.length === 0) return null;
  const withScore = rows.filter((r) => typeof r.score === "number");
  if (!withScore.length) return null;
  return Math.round(
    withScore.reduce((s, r) => s + r.score, 0) / withScore.length,
  );
}

export default function KPIStrip({ stats, jobs = [], invoices = [] }) {
  const totalActive = stats
    ? stats.totalActive
    : new Set(jobs.map((j) => j.jobNo || j.id)).size;
  const enquiryCount = stats
    ? stats.enquiryStage
    : new Set(
        jobs.filter((j) => j.laneId === "enquiry").map((j) => j.jobNo || j.id),
      ).size;
  const designCostingCount = stats
    ? stats.designCosting
    : new Set(
        jobs
          .filter((j) => j.laneId === "design" || j.laneId === "costing")
          .map((j) => j.jobNo || j.id),
      ).size;
  const awaitingClientCount = stats
    ? stats.awaitingClient
    : new Set(
        jobs
          .filter((j) => j.laneId === "quotation")
          .map((j) => j.jobNo || j.id),
      ).size;
  const inProductionCount = stats
    ? stats.inProduction
    : new Set(
        jobs
          .filter((j) => j.laneId === "prodrelease" || j.laneId === "shopfloor")
          .map((j) => j.jobNo || j.id),
      ).size;
  const readyDispatchedCount = stats
    ? stats.readyDispatched
    : new Set(
        jobs.filter((j) => j.laneId === "dispatch").map((j) => j.jobNo || j.id),
      ).size;

  const healthAvg = avgScore(jobs);
  const totalOutstanding =
    stats && stats.totalOutstanding !== undefined
      ? stats.totalOutstanding || 0
      : 0;

  const tiles = [
    { label: "TOTAL ACTIVE JOBS", value: totalActive, color: "#4338CA" },
    { label: "ENQUIRY STAGE", value: enquiryCount, color: "#4C6EF5" },
    { label: "DESIGN & COSTING", value: designCostingCount, color: "#F59F00" },
    {
      label: "AWAITING CLIENT / FINANCE",
      value: awaitingClientCount,
      color: "#FA5252",
    },
    { label: "IN PRODUCTION", value: inProductionCount, color: "#15AABF" },
    {
      label: "READY / DISPATCHED",
      value: readyDispatchedCount,
      color: "#7048E8",
    },
    /* {
      label: "AVG JOB HEALTH",
      value: healthAvg != null ? healthAvg : "\u2014",
      color: healthAvg != null ? scoreBand(healthAvg).color : "#94A3B8"
    }, */
    {
      label: "OUTSTANDING (\u20B9)",
      value: inr(totalOutstanding),
      color: "#E64980",
      small: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-7 lg:grid-cols-7 gap-3 px-6 pt-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs transition hover:shadow-sm"
          style={{ borderTop: "3px solid " + t.color }}
        >
          <div
            className={
              t.small
                ? "text-lg font-extrabold text-slate-800"
                : "text-2xl font-extrabold text-slate-800"
            }
          >
            {t.value}
          </div>
          <div className="text-[10px] font-semibold tracking-wide text-slate-400 mt-0.5 uppercase">
            {t.label}
          </div>
        </div>
      ))}
    </div>
  );
}
