import React from "react";
import { Icon } from "./Icon";

export default function DueTodayAcrossFloor({ dueTodayFloor = null, onSelectStation }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const dtpCount = dueTodayFloor?.dtp || 0;
  const uvCount = dueTodayFloor?.uv || 0;
  const laserCount = dueTodayFloor?.laser || 0;
  const packingCount = dueTodayFloor?.packing || 0;
  const dispatchCount = dueTodayFloor?.dispatch || 0;

  const totalCount = dueTodayFloor?.total !== undefined
    ? dueTodayFloor.total
    : (dtpCount + uvCount + laserCount + packingCount + dispatchCount);

  const stations = [
    {
      id: "dtp",
      stationId: "uploads",
      name: "Artwork / DTP",
      count: dtpCount,
      icon: "palette",
      badgeColor: "bg-cyan-500 text-white",
      textColor: "text-cyan-600",
      borderColor: "border-cyan-200 hover:border-cyan-400"
    },
    {
      id: "uv",
      stationId: "laser",
      name: "UV Printing",
      count: uvCount,
      icon: "droplet",
      badgeColor: "bg-amber-500 text-white",
      textColor: "text-amber-600",
      borderColor: "border-amber-200 hover:border-amber-400"
    },
    {
      id: "laser",
      stationId: "laser",
      name: "Laser Cutting",
      count: laserCount,
      icon: "zap",
      badgeColor: "bg-orange-500 text-white",
      textColor: "text-orange-600",
      borderColor: "border-orange-200 hover:border-orange-400"
    },
    {
      id: "packing",
      stationId: "packing",
      name: "Packing",
      count: packingCount,
      icon: "box",
      badgeColor: "bg-purple-500 text-white",
      textColor: "text-purple-600",
      borderColor: "border-purple-200 hover:border-purple-400"
    },
    {
      id: "dispatch",
      stationId: "delivery",
      name: "Dispatch & Delivery",
      count: dispatchCount,
      icon: "truck",
      badgeColor: "bg-indigo-500 text-white",
      textColor: "text-indigo-600",
      borderColor: "border-indigo-200 hover:border-indigo-400"
    }
  ];

  return (
    <div className="mx-6 mt-4 bg-[#FEF8E7] border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Icon name="bell" size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Due Today Across the Floor
            </h2>
            <p className="text-xs text-amber-900/70 font-medium mt-0.5">
              {dateStr} &bull; shop-floor &amp; dispatch activities that need action today
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
          {totalCount}
        </div>
      </div>

      {/* 5 Station Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
        {stations.map((st) => (
          <div
            key={st.id}
            onClick={() => onSelectStation && onSelectStation(st.stationId)}
            className={`bg-white rounded-xl border ${st.borderColor} p-3.5 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md ${st.badgeColor} flex items-center justify-center text-xs shrink-0`}>
                <Icon name={st.icon} size={14} />
              </div>
              <span className="text-xs font-bold text-slate-700 truncate">{st.name}</span>
            </div>
            <div className="mt-2.5">
              <div className={`text-2xl font-black ${st.textColor}`}>
                {st.count}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                {st.count === 1 ? "1 Job due today" : `${st.count} Jobs due today`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
