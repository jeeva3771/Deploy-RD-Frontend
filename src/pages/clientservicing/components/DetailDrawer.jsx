import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "./Icon";
import { fetchStationJobs, clearStationJobs } from "../../../reducer/clientServicingHubReducer";
import { fetchAllEnquiries } from "../../../reducer/enquiryReducer";

import DeliveryPriorityColor from "../../../components/deliveryPriorityColor/priorityColor";

const inr = (n) => "₹" + n.toLocaleString("en-IN");

function scoreBand(score) {
  if (score >= 80) return { label: "Healthy", color: "#16A34A", bg: "#DCFCE7" };
  if (score >= 60) return { label: "Watch", color: "#D97706", bg: "#FEF3C7" };
  return { label: "At Risk", color: "#DC2626", bg: "#FEE2E2" };
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-slate-300 text-[10px]">&mdash;</span>;
  const band = scoreBand(score);
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: band.color, background: band.bg }}>
      {score} &middot; {band.label}
    </span>
  );
}

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

export default function DetailDrawer({
  selected,
  clientFilter,
  ownerFilter,
  dueToday,
  onClose,
  highlightId,
  onClientJump,
  allLanes = [],
  getLedgerJobs,
  getPhaseJobs,
  getCollectionInvoices,
  getClientAggregates,
  jobLanes = []
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enquiries = [] } = useSelector((state) => state.enquiry);
  const { stationJobs = [], pagination = {}, loadingStationJobs } = useSelector((state) => state.clientServicingHub);

  const [cloneModalOpen, setCloneModalOpen] = React.useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = React.useState(null);
  const [cloneSearch, setCloneSearch] = React.useState("");
  
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    if (selected) {
      dispatch(fetchStationJobs({
        laneId: selected.laneId,
        stationId: selected.stationId,
        page,
        limit,
        search: searchTerm,
        client: clientFilter,
        owner: ownerFilter,
        dueToday: dueToday ? "true" : "false"
      }));
    } else {
      dispatch(clearStationJobs());
    }
  }, [dispatch, selected, page, limit, searchTerm, clientFilter, ownerFilter, dueToday]);

  React.useEffect(() => {
    if (!cloneModalOpen) return;
    const timer = setTimeout(() => {
      dispatch(fetchAllEnquiries({ search: cloneSearch.trim(), limit: 20 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, cloneModalOpen, cloneSearch]);

  const cloneableEnquiries = React.useMemo(() => {
    return enquiries || [];
  }, [enquiries]);

  if (!selected) return null;

  const lane = allLanes.find(l => l.id === selected.laneId);
  if (!lane) return null;

  const isAllStations = selected.stationId === "all";
  const station = isAllStations 
    ? { id: "all", name: `All Activities in ${lane.name}` }
    : lane.stations.find(s => s.id === selected.stationId);

  if (!station) return null;

  let body = null;
  let rowCount = pagination.total || (stationJobs.length);

  const jobStationName = (job) => {
    const phLane = jobLanes.find(l => l.id === job.laneId);
    const st = phLane && phLane.stations.find(s => s.id === job.stationId);
    return st ? st.name : "—";
  };

  if (lane.type === "ledger") {
    const rows = stationJobs;
    rowCount = rows.length;
    body = (
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="text-left px-6 py-2.5 font-semibold">Job No.</th>
            <th className="text-left px-3 py-2.5 font-semibold">Client</th>
            <th className="text-left px-3 py-2.5 font-semibold">Product</th>
            <th className="text-left px-3 py-2.5 font-semibold">Owner</th>
            <th className="text-left px-3 py-2.5 font-semibold">Priority</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(j => {
            return (
              <tr key={j.id} className={`border-b border-slate-100 hover:bg-slate-50 ${highlightId === j.id ? "bg-indigo-50" : ""}`}>
                <td className="px-6 py-2.5 font-semibold text-slate-700">{j.jobNo}</td>
                <td className="px-3 py-2.5 text-slate-600">{j.client}</td>
                <td className="px-3 py-2.5 text-slate-600">{j.product}</td>
                <td className="px-3 py-2.5 text-slate-600">{j.owner}</td>
                <td className="px-3 py-2.5">
                  <DeliveryPriorityColor
                    deliveryDate={j.delivery}
                    showPriorityName={true}
                    badgeClassName="!text-[10px] !font-bold !py-0.5 !px-2 !rounded-full text-white shadow-xs uppercase tracking-wide"
                  />
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan="5" className="text-center py-10 text-slate-400 text-sm">No jobs at this stage.</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (lane.type === "jobs") {
    const rows = stationJobs;
    body = (
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="text-left px-6 py-2.5 font-semibold">Job No.</th>
            <th className="text-left px-3 py-2.5 font-semibold">Client</th>
            <th className="text-left px-3 py-2.5 font-semibold">Product</th>
            <th className="text-left px-3 py-2.5 font-semibold">Qty</th>
            <th className="text-left px-3 py-2.5 font-semibold">Owner</th>
            <th className="text-left px-3 py-2.5 font-semibold">Delivery</th>
            <th className="text-left px-3 py-2.5 font-semibold">Priority</th>
            <th className="text-right px-6 py-2.5 font-semibold">Job Ledger</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(j => (
            <tr key={j.id} className={`border-b border-slate-100 hover:bg-slate-50 ${highlightId === j.id ? "bg-indigo-50" : ""}`}>
              <td 
                className="px-6 py-2.5 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                onClick={() => {
                  onClose();
                  navigate(`/job-ledger?jobId=${j.jobNo}`, { state: { openJobId: j.jobNo } });
                }}
                title="Open in Job Ledger"
              >
                {j.jobNo}
              </td>
              <td className="px-3 py-2.5 text-slate-600">{j.client}</td>
              <td className="px-3 py-2.5 text-slate-600">{j.product}</td>
              <td className="px-3 py-2.5 text-slate-600">{j.qty}</td>
              <td className="px-3 py-2.5 text-slate-600">{j.owner}</td>
              <td className="px-3 py-2.5 text-slate-600">{j.delivery}</td>
              <td className="px-3 py-2.5">
                <DeliveryPriorityColor
                  deliveryDate={j.delivery}
                  showPriorityName={true}
                  badgeClassName="!text-[10px] !font-bold !py-0.5 !px-2 !rounded-full text-white shadow-xs uppercase tracking-wide"
                />
              </td>
              {/* <td className="px-3 py-2.5"><ScoreBadge score={j.score} /></td> */}
              <td className="px-6 py-2.5 text-right">
                <div className="flex items-center justify-end gap-3.5">
                  {j.stationId === "dtp" && (
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/dtp-studio?jobId=${j.jobNo}`, { state: { openJobId: j.jobNo } });
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-2.5 py-1 rounded-md transition inline-flex items-center gap-1 shrink-0"
                    >
                      Go to DTP <i className="fa-solid fa-arrow-right text-[9px]" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/job-ledger?jobId=${j.jobNo}`, { state: { openJobId: j.jobNo } });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan="9" className="text-center py-10 text-slate-400 text-sm">No jobs currently at this activity.</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (lane.type === "collection" && station.id !== "clientwise") {
    let rows = stationJobs || [];
    rowCount = pagination.total || rows.length;
    body = (
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="text-left px-6 py-2.5 font-semibold">Invoice No.</th>
            <th className="text-left px-3 py-2.5 font-semibold">Client</th>
            <th className="text-left px-3 py-2.5 font-semibold">Job No.</th>
            <th className="text-left px-3 py-2.5 font-semibold">Amount</th>
            <th className="text-left px-3 py-2.5 font-semibold">Status</th>
            <th className="text-left px-3 py-2.5 font-semibold">Days Overdue</th>
            <th className="text-left px-3 py-2.5 font-semibold">Owner</th>
            <th className="text-left px-3 py-2.5 font-semibold">Last Follow-up</th>
            <th className="text-right px-6 py-2.5 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(inv => (
            <tr key={inv.id} className={`border-b border-slate-100 hover:bg-slate-50 ${highlightId === inv.id ? "bg-amber-50" : ""}`}>
              <td className="px-6 py-2.5 font-semibold text-slate-700">{inv.invoiceNo}</td>
              <td className="px-3 py-2.5 text-slate-600">{inv.client}</td>
              <td className="px-3 py-2.5 text-slate-600">{inv.jobNo}</td>
              <td className="px-3 py-2.5 text-slate-600 font-medium">{inr(inv.amount)}</td>
              <td className="px-3 py-2.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${INV_STATUS_STYLE[inv.stationId] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{INV_STATUS_LABEL[inv.stationId] || "Outstanding"}</span>
              </td>
              <td className="px-3 py-2.5 text-slate-600">{inv.daysOverdue > 0 ? inv.daysOverdue + " d" : inv.dueIn ? "due in " + inv.dueIn + "d" : "\u2014"}</td>
              <td className="px-3 py-2.5 text-slate-600">{inv.owner}</td>
              <td className="px-3 py-2.5 text-slate-600">{inv.lastFollowUp}</td>
              <td className="px-6 py-2.5 text-right">
                <button className="text-xs font-semibold text-amber-700 hover:underline">Follow up</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan="9" className="text-center py-10 text-slate-400 text-sm">No invoices in this bucket.</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (lane.type === "collection" && station.id === "clientwise") {
    const aggsMap = new Map();
    (stationJobs || []).forEach(inv => {
      const c = inv.client || "Unknown Client";
      if (!aggsMap.has(c)) {
        aggsMap.set(c, { client: c, count: 0, total: 0, oldest: 0 });
      }
      const agg = aggsMap.get(c);
      agg.count += 1;
      agg.total += (inv.amount || 0);
      agg.oldest = Math.max(agg.oldest, inv.daysOverdue || 0);
    });
    let aggs = Array.from(aggsMap.values());
    rowCount = aggs.length;
    body = (
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="text-left px-6 py-2.5 font-semibold">Client</th>
            <th className="text-left px-3 py-2.5 font-semibold">Open Invoices</th>
            <th className="text-left px-3 py-2.5 font-semibold">Total Outstanding</th>
            <th className="text-left px-3 py-2.5 font-semibold">Oldest Overdue</th>
            <th className="text-right px-6 py-2.5 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {aggs.map(a => (
            <tr key={a.client} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-6 py-2.5 font-semibold text-slate-700">{a.client}</td>
              <td className="px-3 py-2.5 text-slate-600">{a.count}</td>
              <td className="px-3 py-2.5 text-slate-600 font-medium">{inr(a.total)}</td>
              <td className="px-3 py-2.5 text-slate-600">{a.oldest > 0 ? a.oldest + " days" : "\u2014"}</td>
              <td className="px-6 py-2.5 text-right">
                <button onClick={() => onClientJump(a.client)} className="text-xs font-semibold text-indigo-600 hover:underline">View client &rarr;</button>
              </td>
            </tr>
          ))}
          {aggs.length === 0 && (
            <tr><td colSpan="5" className="text-center py-10 text-slate-400 text-sm">No outstanding balances.</td></tr>
          )}
        </tbody>
      </table>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 fade-anim p-4 md:p-10" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-0"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 shrink-0" style={{ background: lane.color + "10" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: lane.color }}>
              <Icon name={lane.icon} size={17} />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: lane.color }}>{lane.name}</div>
              <div className="font-bold text-slate-800 text-sm">
                {station.name} <span className="text-slate-400 font-normal">&middot; {rowCount} {lane.type === "collection" && station.id === "clientwise" ? "clients" : "records"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {(selected.laneId === "enquiry" && selected.stationId === "create") && (
              <button 
                onClick={() => {
                  onClose();
                  navigate("/enquiries/add");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus" /> Create Enquiry
              </button>
            )}
            {(selected.laneId === "enquiry" && selected.stationId === "clone") && (
              <button 
                onClick={() => {
                  setCloneModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-copy" /> Clone Enquiry
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition shrink-0">
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Search bar inside drawer */}
        <div className="px-6 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search jobs by Job No, Client, Product..."
            className="w-72 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 scrollbar scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50">
          {loadingStationJobs ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-medium">
              <i className="fa-solid fa-spinner fa-spin mr-2 text-base text-indigo-500" /> Loading station jobs...
            </div>
          ) : (
            body
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-slate-150 bg-slate-50 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div>
            Showing <span className="font-bold">{lane.type === "collection" ? rowCount : stationJobs.length}</span> of <span className="font-bold">{lane.type === "collection" ? rowCount : (pagination.total || stationJobs.length)}</span> {lane.type === "collection" && station.id === "clientwise" ? "clients" : "records"}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-slate-200 rounded px-2 py-1 bg-white outline-none font-medium"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Prev
              </button>
              <span className="px-2 font-semibold">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {cloneModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setCloneModalOpen(false)}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[70vh] border border-slate-100"
          >
            <div className="px-5 py-3.5 border-b border-slate-150 flex items-center justify-between bg-indigo-50">
              <span className="font-bold text-slate-800 text-sm">Select Parent Enquiry to Clone</span>
              <button onClick={() => setCloneModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                value={cloneSearch}
                onChange={(e) => setCloneSearch(e.target.value)}
                placeholder="Search by Job No, Client or Product..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50 min-h-[200px] max-h-[350px]">
              {cloneableEnquiries.map(enq => {
                const isSelected = selectedEnquiry?._id === enq._id;
                return (
                  <div
                    key={enq._id || enq.id}
                    onClick={() => setSelectedEnquiry(enq)}
                    className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between text-xs hover:bg-slate-50 ${
                      isSelected ? "bg-indigo-50 border border-indigo-100 font-medium" : "border border-transparent"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-700">{enq.job_no}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{enq.name || "Unknown Client"} &middot; {enq.product_name || "Unknown Product"}</div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <i className="fa-solid fa-check text-[10px]" />
                      </span>
                    )}
                  </div>
                );
              })}
              {cloneableEnquiries.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">
                  {cloneSearch.trim() !== "" ? "No matching enquiries found." : "No enquiries available to clone."}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setCloneModalOpen(false)}
                className="px-3 py-1.5 border border-slate-250 text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedEnquiry) {
                    setCloneModalOpen(false);
                    onClose();
                    navigate(`/enquiries/edit/${selectedEnquiry._id}`);
                  }
                }}
                disabled={!selectedEnquiry}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition ${
                  selectedEnquiry ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer" : "bg-indigo-300 cursor-not-allowed"
                }`}
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
