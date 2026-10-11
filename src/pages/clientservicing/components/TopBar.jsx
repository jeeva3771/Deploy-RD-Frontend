import React from "react";
import { Icon } from "./Icon";
import { getUser } from "../../../utils/permission/auth";

const inr = (n) => "\u20B9" + n.toLocaleString("en-IN");

const priorityStyle = {
  Normal: "bg-slate-100 text-slate-600 border-slate-200",
  Upcoming: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  Critical: "bg-red-100 text-red-600 border-red-200",
};

const INV_STATUS_LABEL = {
  outstanding: "Outstanding",
  duesoon: "Due Soon",
  overdue: "Overdue",
  followup: "Follow-up Scheduled",
  partial: "Partially Paid"
};

const INV_STATUS_STYLE = {
  outstanding: "bg-slate-100 text-slate-600 border-slate-200",
  duesoon: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-red-100 text-red-600 border-red-200",
  followup: "bg-sky-100 text-sky-700 border-sky-200",
  partial: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

export default function TopBar({
  search,
  setSearch,
  results,
  onPickJob,
  onPickInvoice,
  legendOpen,
  setLegendOpen,
  clientFilter,
  setClientFilter,
  dueToday,
  setDueToday,
  availableClients,
  mode,
  setMode,
  currentUser,
  setCurrentUser,
  ownersList
}) {
  const loggedInUser = getUser();
  const userRoleLower = String(loggedInUser?.role?.name || loggedInUser?.role || "").toLowerCase();
  const isAdminOrManager = loggedInUser?.is_admin || userRoleLower.includes("admin") || userRoleLower.includes("superadmin") || userRoleLower.includes("manager") || userRoleLower.includes("head");
  const isExecutive = !isAdminOrManager && (userRoleLower.includes("executive") || userRoleLower.includes("client servicing"));

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center gap-3 sticky top-0 z-30 shadow-xs">
      <div className="relative flex-1 min-w-[280px]">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs, invoices, client or product..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
        />
        {search.trim() !== "" && (
          <div className="absolute mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-40 max-h-80 overflow-y-auto fade-anim">
            {results.jobs.length === 0 && results.invoices.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400">No matches found.</div>
            )}
            {results.jobs.map((j) => (
              <div key={j.id} onClick={() => onPickJob(j)}
                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-sm border-b border-slate-50">
                <div>
                  <span className="font-semibold text-slate-700">{j.jobNo}</span>
                  <span className="text-slate-400"> &middot; {j.client}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityStyle[j.priority]}`}>{j.priority}</span>
              </div>
            ))}
            {results.invoices.map((inv) => (
              <div key={inv.id} onClick={() => onPickInvoice(inv)}
                className="px-3 py-2 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-sm border-b border-slate-50 last:border-0">
                <div>
                  <span className="font-semibold text-slate-700">{inv.invoiceNo}</span>
                  <span className="text-slate-400"> &middot; {inv.client} &middot; {inr(inv.amount)}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${INV_STATUS_STYLE[inv.stationId]}`}>{INV_STATUS_LABEL[inv.stationId]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isExecutive && mode === "my" && (
        <div className="text-xs font-semibold border border-indigo-200 rounded-lg px-3 py-2 text-indigo-700 bg-indigo-50 max-w-[150px] flex items-center gap-1.5 shadow-sm">
          <Icon name="user" size={12} /> {loggedInUser?.name}
        </div>
      )}

      {/* Due Today Toggle Button */}
      <button
        onClick={() => setDueToday && setDueToday(!dueToday)}
        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
          dueToday
            ? "bg-amber-500 text-white border-amber-600 font-bold"
            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
        }`}
        title="Filter jobs due today"
      >
        <span className={dueToday ? "animate-pulse" : ""}>📅</span> Due Today
      </button>

      <select
        value={clientFilter || ""}
        onChange={(e) => setClientFilter(e.target.value || null)}
        className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-600 outline-none focus:border-indigo-400 bg-white max-w-[180px]">
        <option value="">All Clients (Company view)</option>
        {availableClients.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <div className="relative">
        <button onClick={() => setLegendOpen(!legendOpen)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
          <Icon name="info" size={14} /> Legend
        </button>
        {legendOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-40 fade-anim">
            <div className="text-[11px] font-bold text-slate-500 mb-1.5">JOB PRIORITY</div>
            {["Normal","Upcoming","Critical"].map((p) => (
              <div key={p} className="flex items-center justify-between py-1 text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${priorityStyle[p]}`}>{p}</span>
                <span className="text-slate-400">{p === "Normal" ? "On track" : p === "Upcoming" ? "Due soon" : "Overdue / escalate"}</span>
              </div>
            ))}
            {/* <div className="text-[11px] font-bold text-slate-500 mt-2 mb-1.5">JOB HEALTH SCORE</div>
            {["Healthy","Watch","At Risk"].map((label) => {
              const band = label === "Healthy"
                ? { color: "#16A34A", bg: "#DCFCE7" }
                : label === "Watch" ? { color: "#D97706", bg: "#FEF3C7" } : { color: "#DC2626", bg: "#FEE2E2" };
              return (
                <div key={label} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: band.color, background: band.bg }}>{label}</span>
                  <span className="text-slate-400">{label === "Healthy" ? "80-98" : label === "Watch" ? "60-79" : "below 60"}</span>
                </div>
              );
            })} */}
            <div className="text-[11px] font-bold text-slate-500 mt-2 mb-1.5">INVOICE STATUS</div>
            {Object.keys(INV_STATUS_LABEL).map((k) => (
              <div key={k} className="flex items-center justify-between py-1 text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${INV_STATUS_STYLE[k]}`}>{INV_STATUS_LABEL[k]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
          {mode === "my" ? currentUser.split(" ").map(w => w[0]).slice(0, 2).join("") : "CS"}
        </div>
        <div className="leading-tight">
          <div className="text-xs font-semibold text-slate-700">{mode === "my" ? currentUser : "Client Servicing"}</div>
          <div className="text-[10px] text-slate-400">{mode === "my" ? "My View" : "Admin View"}</div>
        </div>
      </div> */}
    </div>
  );
}
