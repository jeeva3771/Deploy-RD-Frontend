import React from "react";

export default function TeamKRAScorecard({
  ownersList = [],
  mode,
  currentUser,
  clientFilter,
  users = [],
  userEnquiryCounts = {},
  ownerCounts = null
}) {
  let list = ownersList.sort((a, b) => a.localeCompare(b));

  if (mode === "my") {
    list = list.filter(ownerName => ownerName === currentUser);
  }

  if (list.length === 0) return null;

  return (
    <div className="mx-6 mt-4">
      <div className="text-xs font-bold text-slate-500 tracking-wide mb-2 uppercase">
        {mode === "my" ? "MY KRA SCORE" : "TEAM KRA SCORECARD"}
        {clientFilter ? ` \u2014 ${clientFilter}` : ""}
      </div>
      <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 w-full scrollbar-classic lane-scroll">
        {list.map(ownerName => {
          const userObj = users.find(u => u.name === ownerName);
          const userId = userObj?._id;
          const enquiryCount = ownerCounts !== null
            ? (ownerCounts[ownerName] || 0)
            : (userId ? (userEnquiryCounts[userId] || 0) : 0);
          return (
            <div key={ownerName} className="shrink-0 w-52 bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold">
                    {ownerName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{ownerName}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Enquiries Created:</span>
                  <span className="font-semibold text-slate-700">{enquiryCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
