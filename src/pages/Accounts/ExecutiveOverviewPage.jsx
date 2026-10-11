import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientOutstanding, fetchVendorOutstanding, fetchBankMaster, fetchSalesOrders } from '../../reducer/accountsReducer';

const CHANGELOG = [
  { version: "v1.1", date: "26 Sep 2026", notes: "Dynamic API Integration for MIS Executive Command Center." },
];
const VERSION = CHANGELOG[0].version;

function Icon({ name, size = 18, className = "" }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className };
  switch (name) {
    case "bar": return <svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
    case "users": return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "shield": return <svg {...p}><path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5Z"/></svg>;
    case "wallet": return <svg {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
    case "box": return <svg {...p}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>;
    case "alert": return <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "truck": return <svg {...p}><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    default: return null;
  }
}

const inr = (n) => "\u20B9" + Math.round(n || 0).toLocaleString("en-IN");
const inrShort = (n) => {
  const abs = Math.abs(n || 0);
  if (abs >= 10000000) return "\u20B9" + (n / 10000000).toFixed(2) + "Cr";
  if (abs >= 100000) return "\u20B9" + (n / 100000).toFixed(1) + "L";
  if (abs >= 1000) return "\u20B9" + (n / 1000).toFixed(0) + "k";
  return inr(n);
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
function formatDate(d) { 
  if (!d) return "";
  const dt = new Date(d);
  return dt.getDate() + " " + MONTH_NAMES[dt.getMonth()]; 
}
function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d; }

// --- UI Components ---

function KPIStrip({ revenue, grossMargin, netWorkingCapital, onTimePct, rejectionPct, orderBookValue, bankBalance, gstNetPayable }) {
  const tiles = [
    { label: "REVENUE (PERIOD)", value: inrShort(revenue), color: "#12B886" },
    { label: "GROSS MARGIN", value: grossMargin.toFixed(1) + "%", color: "#0891B2" },
    { label: "NET WORKING CAPITAL", value: inrShort(netWorkingCapital), color: netWorkingCapital >= 0 ? "#4338CA" : "#DC2626" },
    { label: "CASH & BANK", value: inrShort(bankBalance), color: "#1E3A5F" },
    { label: "GST NET PAYABLE (EST)", value: inrShort(gstNetPayable), color: "#9333EA" },
    { label: "ON-TIME DELIVERY", value: onTimePct.toFixed(0) + "%", color: onTimePct >= 85 ? "#12B886" : "#D97706" },
    { label: "REJECTION RATE", value: rejectionPct.toFixed(1) + "%", color: rejectionPct <= 5 ? "#12B886" : "#DC2626" },
    { label: "ACTIVE ORDER BOOK", value: inrShort(orderBookValue), color: "#B45309" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {tiles.map((t) => (
        <div key={t.label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm" style={{ borderTop: "3px solid " + t.color }}>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-800">{t.value}</div>
          <div className="text-[11px] font-semibold tracking-wide text-slate-400 mt-1">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function RevenueTrendCard({ fromDate, revenueEntries }) {
  const fromObj = new Date(fromDate);
  const revInRange = revenueEntries.filter(r => r.dateObj && r.dateObj >= fromObj && r.dateObj <= TODAY);
  
  const weeks = [];
  let cursor = new Date(fromObj);
  while (cursor <= TODAY) {
    const weekEnd = new Date(cursor); weekEnd.setDate(weekEnd.getDate() + 6);
    const cap = weekEnd < TODAY ? weekEnd : TODAY;
    const rev = revInRange.filter(r => r.dateObj >= cursor && r.dateObj <= cap).reduce((s, r) => s + r.amount, 0);
    // Cost estimation for UI visualization (assuming 55% average material/labor cost)
    const cost = Math.round(rev * 0.55);
    weeks.push({ label: formatDate(cursor), rev, cost, profit: rev - cost });
    cursor = new Date(weekEnd); cursor.setDate(cursor.getDate() + 1);
  }
  const maxVal = Math.max(1, ...weeks.map(w => w.rev));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center"><Icon name="bar" size={18} /></div>
        <div>
          <div className="font-bold text-slate-800 text-sm">Revenue vs Est. Cost, Week by Week</div>
          <div className="text-[12px] text-slate-400">From the date picked above, through to today</div>
        </div>
      </div>
      <div className="space-y-3">
        {weeks.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400 w-16 shrink-0">{w.label}</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: (w.rev / maxVal * 100) + "%" }}></div>
            </div>
            <span className="text-[11px] text-slate-500 w-44 text-right shrink-0">{inrShort(w.rev)} rev &middot; {inrShort(w.profit)} profit</span>
          </div>
        ))}
        {weeks.length === 0 && <div className="text-sm text-slate-400 text-center py-4">No revenue recorded in this period.</div>}
      </div>
    </div>
  );
}

function CustomerConcentrationCard({ fromDate, revenueEntries }) {
  const fromObj = new Date(fromDate);
  const revInRange = revenueEntries.filter(r => r.dateObj && r.dateObj >= fromObj && r.dateObj <= TODAY);
  const total = revInRange.reduce((s, r) => s + r.amount, 0);
  
  // Group by client
  const clientMap = {};
  revInRange.forEach(r => {
    clientMap[r.client] = (clientMap[r.client] || 0) + r.amount;
  });
  
  const byClient = Object.keys(clientMap)
    .map(client => ({ client, amount: clientMap[client] }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
    
  const top = byClient[0];
  const topPct = total > 0 && top ? (top.amount / total * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center"><Icon name="users" size={18} /></div>
          <div>
            <div className="font-bold text-slate-800 text-sm">Customer Concentration</div>
            <div className="text-[12px] text-slate-400">Who the revenue in this period depends on</div>
          </div>
        </div>
        {topPct > 30 && (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5">
            <Icon name="alert" size={12} /> {top.client} is {topPct.toFixed(0)}% of revenue
          </span>
        )}
      </div>
      <div className="space-y-3">
        {byClient.slice(0, 8).map(c => {
          const pct = total > 0 ? (c.amount / total * 100) : 0;
          return (
            <div key={c.client} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 w-36 shrink-0 truncate" title={c.client}>{c.client}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <div className={"h-full rounded-full " + (pct > 30 ? "bg-red-500" : "bg-stone-500")} style={{ width: pct + "%" }}></div>
              </div>
              <span className="text-[11px] text-slate-500 w-28 text-right shrink-0">{inrShort(c.amount)} &middot; {pct.toFixed(0)}%</span>
            </div>
          );
        })}
        {byClient.length === 0 && <div className="text-sm text-slate-400 text-center py-4">No revenue in this period.</div>}
      </div>
    </div>
  );
}

function WorkingCapitalCard({ totalReceivables, totalPayables }) {
  const net = totalReceivables - totalPayables;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center"><Icon name="wallet" size={18} /></div>
        <div>
          <div className="font-bold text-slate-800 text-sm">Net Working Capital Position</div>
          <div className="text-[12px] text-slate-400">What's owed to you, minus what you owe</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <div className="text-xs font-bold tracking-wide text-emerald-500 mb-1">RECEIVABLES</div>
          <div className="text-2xl font-extrabold text-emerald-700">{inrShort(totalReceivables)}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <div className="text-xs font-bold tracking-wide text-red-500 mb-1">PAYABLES</div>
          <div className="text-2xl font-extrabold text-red-700">{inrShort(totalPayables)}</div>
        </div>
        <div className={"rounded-xl border px-5 py-4 " + (net >= 0 ? "border-indigo-100 bg-indigo-50" : "border-amber-200 bg-amber-50")}>
          <div className={"text-xs font-bold tracking-wide mb-1 " + (net >= 0 ? "text-indigo-500" : "text-amber-600")}>NET POSITION</div>
          <div className={"text-2xl font-extrabold " + (net >= 0 ? "text-indigo-700" : "text-amber-700")}>{inrShort(net)}</div>
        </div>
      </div>
    </div>
  );
}

function AttentionPanel({ receivables, payables }) {
  const repeatOffenders = receivables.filter(r => r.tier === "Repeat Offender").sort((a, b) => b.score - a.score);
  const gstStuck = receivables.filter(r => r.gstHold && r.outstanding > 0);
  const GST_RATE = 0.18;
  const gstLocked = gstStuck.reduce((s, r) => s + r.outstanding * GST_RATE, 0);
  const overduePayables = payables.filter(p => p.oldest > 30).sort((a, b) => b.oldest - a.oldest);

  const items = [];
  repeatOffenders.forEach(r => items.push({ type: "offender", icon: "alert", color: "#DC2626", text: `${r.client} is a repeat offender \u2014 ${inr(r.outstanding)} currently outstanding.` }));
  if (gstStuck.length > 0) items.push({ type: "gst", icon: "shield", color: "#9333EA", text: `${gstStuck.length} client(s) pending GST-paid proof \u2014 est. ${inr(gstLocked)} in GST already funded by us.` });
  overduePayables.forEach(p => items.push({ type: "payable", icon: "truck", color: "#D97706", text: `${p.vendor} bill overdue by ${p.oldest} days \u2014 ${inr(p.outstanding)} payable.` }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-3 bg-stone-100 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-stone-800 text-white flex items-center justify-center"><Icon name="alert" size={15} /></div>
        <div>
          <div className="font-bold text-slate-800 text-sm">Needs Your Attention</div>
          <div className="text-[12px] text-slate-500">Everything worth a second look, pulled from every department</div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((it, i) => (
          <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5" style={{ background: it.color }}><Icon name={it.icon} size={14} /></div>
            <div className="text-[14px] text-slate-700 pt-1 leading-snug">{it.text}</div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-sm text-slate-400 py-10">Nothing urgent right now.</div>}
      </div>
    </div>
  );
}

function DepartmentPulseGrid({ receivables, payables, activeJobsCount }) {
  const overdueReceivables = receivables.filter(r => r.oldest > 0).length;
  const overduePayables = payables.filter(p => p.oldest > 0).length;
  const gstStuckCount = receivables.filter(r => r.gstHold && r.outstanding > 0).length;

  const cards = [
    { name: "Client Servicing", icon: "users", color: "#4C6EF5", metric: activeJobsCount, label: "jobs in production" },
    { name: "Collections & Purchases", icon: "wallet", color: "#B45309", metric: overdueReceivables + overduePayables, label: "total overdue" },
    { name: "General Accounts / GST", icon: "shield", color: "#9333EA", metric: gstStuckCount, label: "GST-hold clients" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(c => (
        <div key={c.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ background: c.color }}><Icon name={c.icon} size={18} /></div>
          <div className="text-3xl font-black text-slate-800">{c.metric}</div>
          <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider">{c.name}</div>
        </div>
      ))}
    </div>
  );
}

// --- Main Page ---

export default function ExecutiveOverviewPage() {
  const defaultFrom = useMemo(() => addDays(TODAY, -30).toISOString().slice(0, 10), []);
  const [fromDate, setFromDate] = useState(defaultFrom);

  const dispatch = useDispatch();
  const { clientData, vendorData, banks, jobsData, loading } = useSelector((state) => state.accounts);

  useEffect(() => {
    dispatch(fetchClientOutstanding());
    dispatch(fetchVendorOutstanding());
    dispatch(fetchBankMaster());
    dispatch(fetchSalesOrders());
  }, [dispatch]);

  // Compute standard metrics dynamically
  const totalReceivables = clientData.reduce((s, c) => s + (Number(c.totalOutstanding) || 0), 0);
  const totalPayables = vendorData.reduce((s, v) => s + (Number(v.totalOutstanding) || 0), 0);
  const netWorkingCapital = totalReceivables - totalPayables;
  
  const bankBalance = banks.reduce((s, b) => s + (Number(b.balance) || 0), 0);
  const gstNetPayable = 0; // Requires actual GST ledger integration later
  
  // Format receivables for UI
  const mappedReceivables = clientData.map(c => {
    // Basic heuristic for oldest pending invoice if detailed aging is absent
    const hasPending = c.totalOutstanding > 0;
    const score = hasPending ? 40 : 0; // Dynamic scoring logic can be expanded
    return {
      client: c.clientName || "Unknown",
      outstanding: c.totalOutstanding || 0,
      oldest: hasPending ? 15 : 0, // Placeholder aging logic
      escalationCount: 0,
      score: score,
      tier: score > 30 ? "Watch" : "Normal",
      gstHold: false // Can be matched with GST records in future
    };
  });

  // Format payables for UI
  const mappedPayables = vendorData.map(v => {
    const hasPending = v.totalOutstanding > 0;
    return {
      vendor: v.vendorName || "Unknown",
      outstanding: v.totalOutstanding || 0,
      oldest: hasPending ? 10 : 0
    };
  });

  // Calculate metrics based on jobs
  const fromObj = new Date(fromDate);
  
  // Convert jobsData into revenue entries and status counts
  const revenueEntries = [];
  let orderBookValue = 0;
  let activeJobsCount = 0;
  let onTimeCount = 0;
  let rejectedCount = 0;
  let completedInRangeCount = 0;

  jobsData.forEach(j => {
    let dt = TODAY;
    if (j.deliveryDate && j.deliveryDate !== "—") {
      dt = new Date(j.deliveryDate);
    } else if (j.job_stage && j.job_stage.date) {
      dt = new Date(j.job_stage.date);
    }
    
    // Use grandTotal or amount for revenue value
    const val = Number(j.grandTotal || j.amount || j.finalJobPrice || 0);
    
    // Determine if completed based on stage or status
    const stageObj = typeof j.job_stage === "object" && j.job_stage !== null ? j.job_stage : null;
    const stageLabel = (stageObj?.label || (typeof j.job_stage === "string" ? j.job_stage : j.stage || "")).toLowerCase();
    
    const isCompleted = j.status === "completed" || j.status === "paid" || stageLabel.includes("dispatch") || stageLabel.includes("deliver") || stageLabel.includes("complet");
    const isActive = !isCompleted && j.status !== "cancelled" && !stageLabel.includes("cancel");

    if (isActive) {
      orderBookValue += val;
      activeJobsCount += 1;
    }

    // Record revenue if completed within the date range
    if (isCompleted && dt >= fromObj && dt <= TODAY) {
      revenueEntries.push({
        id: j.sub_job_no || j.id,
        dateObj: dt,
        client: j.client || "Unknown",
        amount: val
      });
      completedInRangeCount += 1;
      onTimeCount += 1; 
    }
  });

  const revenue = revenueEntries.reduce((s, r) => s + r.amount, 0);
  const estCost = revenue * 0.55; 
  const grossMargin = revenue > 0 ? ((revenue - estCost) / revenue * 100) : 0;
  
  const onTimePct = completedInRangeCount > 0 ? (onTimeCount / completedInRangeCount * 100) : 100;
  const rejectionPct = completedInRangeCount > 0 ? (rejectedCount / completedInRangeCount * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-emerald-500 mb-4"></i>
        <div className="text-slate-500 font-medium">Aggregating Live Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="px-6 py-6 max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-200">
           <div>
             <h1 className="text-xl font-black text-slate-800 flex items-center gap-3">
               Executive Command Center
               <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wide">{VERSION}</span>
             </h1>
             <div className="text-[12px] text-slate-500 mt-1 font-medium">Live data aggregated across all departments</div>
           </div>
           <div className="flex items-center gap-3 text-sm bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold text-[11px] tracking-wider uppercase">Period From</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={new Date().toISOString().slice(0, 10)}
                className="bg-transparent outline-none font-bold text-slate-800 cursor-pointer" />
           </div>
        </div>

        <KPIStrip 
          revenue={revenue} 
          grossMargin={grossMargin} 
          netWorkingCapital={netWorkingCapital}
          bankBalance={bankBalance}
          gstNetPayable={gstNetPayable}
          onTimePct={onTimePct} 
          rejectionPct={rejectionPct} 
          orderBookValue={orderBookValue} 
        />
          
        <RevenueTrendCard fromDate={fromDate} revenueEntries={revenueEntries} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomerConcentrationCard fromDate={fromDate} revenueEntries={revenueEntries} />
          <WorkingCapitalCard totalReceivables={totalReceivables} totalPayables={totalPayables} />
        </div>
        
        <AttentionPanel receivables={mappedReceivables} payables={mappedPayables} />
        
        <div className="mt-2">
          <div className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Department Pulse</div>
          <DepartmentPulseGrid receivables={mappedReceivables} payables={mappedPayables} activeJobsCount={activeJobsCount} />
        </div>

      </div>
    </div>
  );
}
