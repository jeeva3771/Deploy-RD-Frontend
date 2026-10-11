import React from "react";
import { Icon } from "./Icon";

const inr = (n) => "\u20B9" + n.toLocaleString("en-IN");

export default function ClientSnapshot({ clientFilter, jobs = [], invoices = [], onClear }) {
  if (!clientFilter) return null;

  const activeJobsCount = jobs.filter(j => j.stationId !== "completed").length;
  const completedJobsCount = jobs.filter(j => j.stationId === "completed").length;
  const criticalCount = jobs.filter(j => j.priority === "Critical").length;
  const outstandingAmount = invoices.reduce((s, r) => s + r.amount, 0);
  const overdueCount = invoices.filter(i => i.stationId === "overdue").length;
  const oldestOverdueDays = invoices.reduce((m, r) => Math.max(m, r.daysOverdue || 0), 0);

  return (
    <div className="mx-6 mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 flex flex-wrap items-center justify-between gap-3 fade-anim shadow-xs">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="text-[10px] font-semibold text-indigo-400 tracking-wide">VIEWING CLIENT</div>
          <div className="text-sm font-bold text-indigo-800">{clientFilter}</div>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 border-l border-indigo-200 pl-5">
          <div><span className="font-bold text-slate-800">{activeJobsCount}</span> active jobs</div>
          <div><span className="font-bold text-slate-800">{completedJobsCount}</span> completed</div>
          <div><span className="font-bold text-red-500">{criticalCount}</span> critical</div>
          <div><span className="font-bold text-indigo-700">{inr(outstandingAmount)}</span> outstanding</div>
          <div>
            <span className="font-bold text-red-500">{overdueCount}</span> overdue invoice(s)
            {oldestOverdueDays > 0 ? ` &middot; oldest ${oldestOverdueDays}d` : ""}
          </div>
        </div>
      </div>
      <button onClick={onClear} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
        <Icon name="x" size={14} /> Clear filter
      </button>
    </div>
  );
}
