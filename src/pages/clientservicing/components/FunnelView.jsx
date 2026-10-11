import React from "react";

const inr = (n) => "\u20B9" + n.toLocaleString("en-IN");

function scoreBand(score) {
  if (score >= 80) return { color: "#16A34A" };
  if (score >= 60) return { color: "#D97706" };
  return { color: "#DC2626" };
}

function avgScore(rows) {
  if (!rows || rows.length === 0) return null;
  const withScore = rows.filter(r => typeof r.score === "number");
  if (!withScore.length) return null;
  return Math.round(withScore.reduce((s, r) => s + r.score, 0) / withScore.length);
}

export default function FunnelView({
  clientFilter,
  ownerFilter,
  selected,
  onSelectStation,
  getLedgerJobs,
  getCollectionInvoices,
  ledgerLane,
  collectionLane
}) {
  const stages = ledgerLane.stations.map(st => {
    const rows = getLedgerJobs(st, clientFilter, ownerFilter);
    return { station: st, count: rows.length, avg: avgScore(rows) };
  });
  const maxCount = Math.max(1, ...stages.map(s => s.count));

  const collStages = collectionLane.stations.filter(s => s.id !== "clientwise").map(st => {
    const rows = getCollectionInvoices(st, clientFilter, ownerFilter);
    return { station: st, count: rows.length, amount: rows.reduce((s, r) => s + r.amount, 0) };
  });
  const maxColl = Math.max(1, ...collStages.map(s => s.amount));

  return (
    <div className="px-6 pb-10 grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-sm font-bold text-slate-800 mb-1">Job Ledger Funnel</div>
        <div className="text-[11px] text-slate-400 mb-4">Start to finish &mdash; bar width shows relative job volume at each stage; dot shows average health.</div>
        <div className="flex flex-col items-center gap-1.5">
          {stages.map((s) => {
            const widthPct = 30 + 70 * (s.count / maxCount);
            const band = s.avg != null ? scoreBand(s.avg) : null;
            const isSel = selected && selected.laneId === "ledger" && selected.stationId === s.station.id;
            return (
              <button key={s.station.id} onClick={() => onSelectStation({ laneId: "ledger", stationId: s.station.id })}
                style={{ width: widthPct + "%", background: ledgerLane.color, opacity: isSel ? 1 : 0.85 }}
                className="rounded-md py-2.5 px-4 flex items-center justify-between text-white text-xs font-semibold transition hover:opacity-100 shadow-xs">
                <span>{s.station.name}</span>
                <span className="flex items-center gap-2">
                  {band && <span className="w-2 h-2 rounded-full" style={{ background: band.color }}></span>}
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-sm font-bold text-slate-800 mb-1">Collections Risk</div>
        <div className="text-[11px] text-slate-400 mb-4">Outstanding amount by bucket.</div>
        <div className="space-y-3">
          {collStages.map(s => {
            const widthPct = 15 + 85 * (s.amount / maxColl);
            const isSel = selected && selected.laneId === "collection" && selected.stationId === s.station.id;
            return (
              <button key={s.station.id} onClick={() => onSelectStation({ laneId: "collection", stationId: s.station.id })} className="w-full text-left block">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                  <span>{s.station.name}</span>
                  <span className="font-semibold text-slate-700">{inr(s.amount)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: (s.amount ? widthPct : 0) + "%", background: collectionLane.color, opacity: isSel ? 1 : 0.75 }}></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
