import React from "react";
import { Icon } from "./Icon";

function scoreBand(score) {
  if (score >= 80) return { label: "Healthy", color: "#16A34A" };
  if (score >= 60) return { label: "Watch", color: "#D97706" };
  return { label: "At Risk", color: "#DC2626" };
}

function avgScore(rows) {
  if (!rows || rows.length === 0) return null;
  const withScore = rows.filter(r => typeof r.score === "number");
  if (!withScore.length) return null;
  return Math.round(withScore.reduce((s, r) => s + r.score, 0) / withScore.length);
}

function hexToRgba(hex, alpha) {
  if (!hex) return "rgba(0,0,0,0)";
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HeatmapView({
  allLanes = [],
  clientFilter,
  ownerFilter,
  selected,
  onSelectStation,
  getStationRows,
  getClientAggregates
}) {
  return (
    <div className="px-6 pb-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {allLanes.map(lane => {
          const cells = lane.stations.map(st => {
            if (lane.type === "collection" && st.id === "clientwise") {
              const aggs = getClientAggregates(clientFilter, ownerFilter);
              return { station: st, count: aggs.length, rows: null };
            }
            const rows = getStationRows(lane, st, clientFilter, ownerFilter);
            return { station: st, count: rows.length, rows };
          });

          const maxCount = Math.max(1, ...cells.map(c => c.count));

          return (
            <div key={lane.id} className="flex items-center gap-4 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-40 shrink-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0" style={{ background: lane.color }}>
                  <Icon name={lane.icon} size={13} />
                </div>
                <span className="text-xs font-semibold text-slate-700 leading-tight">{lane.short}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {cells.map(c => {
                  const intensity = c.count === 0 ? 0.08 : 0.25 + 0.75 * (c.count / maxCount);
                  const isSel = selected && selected.laneId === lane.id && selected.stationId === c.station.id;
                  const avg = lane.type !== "collection" ? avgScore(c.rows) : null;
                  const band = avg != null ? scoreBand(avg) : null;

                  return (
                    <button key={c.station.id} title={c.station.name + ": " + c.count}
                      onClick={() => onSelectStation({ laneId: lane.id, stationId: c.station.id })}
                      className="relative w-11 h-11 rounded-lg flex items-center justify-center text-xs font-bold transition text-white"
                      style={{
                        backgroundColor: hexToRgba(lane.color, intensity),
                        color: "#fff",
                        outline: isSel ? "2px solid #1e293b" : "none",
                        outlineOffset: "1px"
                      }}>
                      {c.count}
                      {band && c.count > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white" style={{ background: band.color }}></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-3">Darker cell = more jobs/invoices at that station. Hover a cell for its name.</p>
    </div>
  );
}
