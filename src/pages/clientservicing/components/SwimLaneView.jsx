import React from "react";
import { Icon } from "./Icon";

const inr = (n) => "\u20B9" + n.toLocaleString("en-IN");

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

function StationCard({
  name,
  color,
  count,
  dots,
  sublabel,
  avgScoreVal,
  isSelected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-44 text-left rounded-xl border px-3.5 py-3 transition bg-white hover:shadow-md ${
        isSelected ? "" : "border-slate-200"
      }`}
      style={
        isSelected
          ? { borderColor: color, boxShadow: "0 0 0 2px " + color + "33" }
          : {}
      }
    >
      <div className="text-[11.5px] font-semibold text-slate-700 leading-snug min-h-[30px]">
        {name}
      </div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-xl font-extrabold" style={{ color }}>
          {count}
        </div>
        {dots && dots.length > 0 && (
          <div className="flex gap-1">
            {dots.map(
              (d, i) =>
                d.count > 0 && (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: d.color }}
                    title={d.count}
                  ></span>
                ),
            )}
          </div>
        )}
      </div>
      {/* {avgScoreVal != null && (
        <div className="text-[10px] font-semibold mt-1" style={{ color: scoreBand(avgScoreVal).color }}>Health {avgScoreVal}</div>
      )} */}
      {sublabel && (
        <div className="text-[10px] text-slate-400 mt-1">{sublabel}</div>
      )}
    </button>
  );
}

function Lane({
  lane,
  clientFilter,
  ownerFilter,
  selected,
  onSelectStation,
  getStationRows,
  getClientAggregates,
  totalJobs,
  totalInvoices,
  stats,
}) {
  let laneTotal = 0;

  const stationStats = lane.stations.map((st) => {
    if (lane.type === "collection" && st.id === "clientwise") {
      const aggs = getClientAggregates(clientFilter, ownerFilter);
      return {
        station: st,
        count: aggs.length,
        sublabel: aggs.length + " client(s) with dues",
      };
    }
    const rows = getStationRows(lane, st, clientFilter, ownerFilter);
    if (lane.type === "collection") {
      return {
        station: st,
        count: rows.length,
        sublabel: rows.length
          ? inr(rows.reduce((s, r) => s + r.amount, 0)) + " total"
          : null,
      };
    }
    return {
      station: st,
      count: rows.length,
      dots: [
        {
          color: "#EF4444",
          count: rows.filter((r) => r.priority === "Critical").length,
        },
        {
          color: "#E879F9",
          count: rows.filter((r) => r.priority === "Upcoming").length,
        },
        {
          color: "#CBD5E1",
          count: rows.filter((r) => r.priority === "Normal").length,
        },
      ],
      avgScoreVal: avgScore(rows),
    };
  });

  if (lane.type === "ledger") {
    laneTotal =
      stats && stats.totalActive != null
        ? stats.totalActive
        : new Set(totalJobs.map((j) => j.jobNo || j.id)).size;
  } else if (lane.type === "collection") {
    const outstandingStat = stationStats.find((s) => s.station.id === "outstanding");
    laneTotal = outstandingStat ? outstandingStat.count : 0;
  } else {
    laneTotal = stationStats.reduce((s, x) => s + (x.count || 0), 0);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <div
        onClick={() => onSelectStation({ laneId: lane.id, stationId: "all" })}
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-100/50 active:bg-slate-100 transition-all select-none"
        style={{ background: lane.color + "10" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
            style={{ background: lane.color }}
          >
            <Icon name={lane.icon} size={17} />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">{lane.name}</div>
            <div className="text-[11px] text-slate-400">
              {lane.stations.length} activity stations
            </div>
          </div>
        </div>
        {lane.type === "ledger" ? (
          <div className="text-right shrink-0 flex items-center gap-6">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-4 bg-white/80 border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs">
              <div>
                Parent Enquiries:{" "}
                <span className="font-bold text-slate-800">
                  {stats?.parentEnquiries ??
                    totalJobs.filter((j) => j.isParentEnquiry).length}
                </span>
              </div>
              <div className="h-3 w-px bg-slate-300"></div>
              <div>
                Sub-jobs:{" "}
                <span className="font-bold text-slate-800">
                  {stats?.subJobs ??
                    totalJobs.filter((j) => !j.isParentEnquiry).length}
                </span>
              </div>
            </div>
            <div
              className="text-2xl font-extrabold"
              style={{ color: lane.color }}
            >
              {laneTotal}
            </div>
          </div>
        ) : (
          <div
            className="text-2xl font-extrabold"
            style={{ color: lane.color }}
          >
            {laneTotal}
          </div>
        )}
      </div>
      <div className="lane-scroll flex flex-nowrap gap-3 items-stretch px-5 py-4 overflow-x-auto scrollbar-classic">
        {stationStats.map((s, i) => (
          <React.Fragment key={s.station.id}>
            <StationCard
              name={s.station.name}
              color={lane.color}
              count={s.count}
              dots={s.dots}
              sublabel={s.sublabel}
              avgScoreVal={s.avgScoreVal}
              isSelected={
                selected &&
                selected.laneId === lane.id &&
                selected.stationId === s.station.id
              }
              onClick={() =>
                onSelectStation({ laneId: lane.id, stationId: s.station.id })
              }
            />
            {i < stationStats.length - 1 && (
              <div className="flex items-center text-slate-300 shrink-0">
                <Icon name="chevron" size={18} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function SwimLaneView({
  allLanes = [],
  clientFilter,
  ownerFilter,
  selected,
  onSelectStation,
  getStationRows,
  getClientAggregates,
  totalJobs = [],
  totalInvoices = [],
  stats,
}) {
  return (
    <div className="px-6 pb-10">
      {allLanes.map((lane) => (
        <Lane
          key={lane.id}
          lane={lane}
          clientFilter={clientFilter}
          ownerFilter={ownerFilter}
          selected={selected}
          onSelectStation={onSelectStation}
          getStationRows={getStationRows}
          getClientAggregates={getClientAggregates}
          totalJobs={totalJobs}
          totalInvoices={totalInvoices}
          stats={stats}
        />
      ))}
    </div>
  );
}
