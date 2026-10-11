import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobLedgerList } from "../../reducer/jobLedgerReducer.js";
import { useLoader } from "../../context/LoaderContext.jsx";
import "./components/JobLedger/style.css";
import {
  STATUS_CFG,
  isJobFullyDispatched,
  isJobOnHold,
} from "./components/JobLedger/data.js";
import JobBanner from "./components/JobLedger/JobBanner.jsx";
import OverviewTab from "./components/JobLedger/OverviewTab.jsx";
import BOMTab from "./components/JobLedger/BOMTab.jsx";
import FlowLedger from "./components/JobLedger/FlowLedger.jsx";
import CSTab from "./components/JobLedger/CSTab.jsx";
import JourneyTab from "./components/JobLedger/JourneyTab.jsx";
import FGPackTab from "./components/JobLedger/FGPackTab.jsx";
import FinancialTab from "./components/JobLedger/FinancialTab.jsx";
import DeliveryPriorityColor from "../../components/deliveryPriorityColor/priorityColor";
import { usePriorityColors } from "../../context/PriorityColorContext";

import { useLocation, useNavigate } from "react-router-dom";

function JobLedger() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    jobs = [],
    loading,
    pagination,
  } = useSelector((state) => state.jobLedger);
  const { showLoader, hideLoader } = useLoader();
  const { priorityColors } = usePriorityColors();

  // Read initial incoming job ID from URL param or router state
  const queryParams = new URLSearchParams(location.search);
  const initialJobId =
    queryParams.get("jobId") || location.state?.openJobId || "";

  const [sel, setSel] = useState("");
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState(initialJobId);
  const [debouncedSearch, setDebouncedSearch] = useState(initialJobId);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 860,
  );
  const [previewImg, setPreviewImg] = useState(null);

  // Sync incoming jobId from URL or state when route changes
  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const target = qParams.get("jobId") || location.state?.openJobId;
    if (target && target !== search) {
      setSearch(target);
      setDebouncedSearch(target);
      setPage(1);
      setFilter("all");
    }
  }, [search, location.search, location.state]);

  // Debounce search input to avoid spamming requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFetch = useCallback(async () => {
    showLoader();
    try {
      await dispatch(
        fetchJobLedgerList({
          page,
          limit,
          search: debouncedSearch,
          filter,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to fetch Job Ledger records:", error);
    } finally {
      hideLoader();
    }
  }, [dispatch, showLoader, hideLoader, page, limit, debouncedSearch, filter]);

  // Fetch live Job Ledger records on mount or when page/limit/search/filter changes
  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  // Automatically select the job matching jobId search param/state/search, falling back to first job
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      const qParams = new URLSearchParams(location.search);
      const targetJobId =
        qParams.get("jobId") ||
        location.state?.openJobId ||
        debouncedSearch ||
        search;

      let targetSel = "";

      if (targetJobId) {
        const targetLower = String(targetJobId).toLowerCase().trim();
        const matchedJob = jobs.find(
          (j) =>
            String(j.id || "")
              .toLowerCase()
              .trim() === targetLower ||
            String(j.job_no || "")
              .toLowerCase()
              .trim() === targetLower ||
            String(j.sub_job_no || "")
              .toLowerCase()
              .trim() === targetLower ||
            String(j.soNo || "")
              .toLowerCase()
              .trim() === targetLower ||
            String(j.reference_no || "")
              .toLowerCase()
              .trim() === targetLower ||
            (j.id && String(j.id).toLowerCase().includes(targetLower)) ||
            (targetLower.includes(String(j.id || "").toLowerCase()) &&
              String(j.id || "").length > 3),
        );
        if (matchedJob) {
          targetSel = matchedJob.id;
        }
      }

      if (!targetSel) {
        if (sel && jobs.some((j) => j.id === sel)) {
          targetSel = sel;
        } else {
          targetSel = jobs[0]?.id || "";
        }
      }

      if (targetSel && sel !== targetSel) {
        setSel(targetSel);
      }
    }
  }, [jobs, location.search, location.state, debouncedSearch, search, sel]);

  const total = pagination?.total ?? jobs.length;
  const totalPages =
    pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = total > 0 ? Math.min(page * limit, total) : 0;

  const job = (jobs || []).find((j) => j.id === sel) || jobs?.[0];

  function selJob(id) {
    setSel(id);
    setTab("overview");
    if (typeof window !== "undefined" && window.innerWidth <= 860) {
      setSidebarOpen(false);
    }
    navigate(`/job-ledger?jobId=${id}`, { replace: true });
  }

  const handleFilterChange = (k) => {
    if (filter !== k) {
      setFilter(k);
      setPage(1);
    }
  };

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <div className={"layout" + (!sidebarOpen ? " sidebar-closed" : "")}>
        <div
          className={"sidebar-overlay" + (sidebarOpen ? " open" : "")}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={"sidebar" + (sidebarOpen ? " open" : "")}>
          <div className="sb-search">
            <div className="sb-search-row" style={{ display: "flex", gap: 6 }}>
              <button
                className="sb-toggle"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label="Toggle job list"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <input
                className="sb-inp"
                placeholder="Search job / client / product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={handleFetch}
                title="Refresh live jobs"
                style={{
                  background: "#0D9488",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "0 10px",
                  height: 35,
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s",
                }}
                disabled={loading}
              >
                {loading ? "⏳" : "🔄"}
              </button>
            </div>
            <div className="sb-filter">
              {[
                ["all", "All"],
                ["due_today", "Due Today"],
                ["hold", "Hold"],
                ["done", "Done"],
                ["shipped", "Shipped"],
              ].map(([k, l]) => (
                <div
                  key={k}
                  className={"sf-btn" + (filter === k ? " on" : "")}
                  onClick={() => handleFilterChange(k)}
                >
                  {l}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                fontSize: 11,
                fontWeight: 700,
                color: "#64748B",
              }}
            >
              <span>
                Showing {startItem}–{endItem} of {total} live jobs
              </span>
              {search && (
                <span
                  style={{ color: "#0D9488", cursor: "pointer" }}
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setPage(1);
                    navigate("/job-ledger", { replace: true, state: {} });
                  }}
                >
                  Clear search
                </span>
              )}
            </div>
          </div>
          <div className="sb-list scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
            {loading && jobs.length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: "#0D9488",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ⏳ Fetching jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                No jobs matching current filter
              </div>
            ) : (
              jobs.map((j, idx) => {
                const isShippedJob = isJobFullyDispatched(j);
                const isOnHoldJob = isJobOnHold(j);
                const showBadge = isShippedJob || isOnHoldJob;
                const cardStatusKey = isOnHoldJob
                  ? "hold"
                  : isShippedJob
                    ? "dispatched"
                    : j.status;
                const sc =
                  STATUS_CFG[cardStatusKey] ||
                  STATUS_CFG[j.status] ||
                  STATUS_CFG.pending;
                const jobDeliveryDate =
                  j.job_completion_datetime || j.delivery_date || j.delivDate;

                return (
                  <div
                    key={`${j.id}_${idx}`}
                    className={"jcard" + (sel === j.id ? " sel" : "")}
                    onClick={() => selJob(j.id)}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      paddingLeft: jobDeliveryDate ? "18px" : "15px",
                    }}
                  >
                    {/* Left Edge Priority Color Strip */}
                    {jobDeliveryDate && (
                      <DeliveryPriorityColor
                        deliveryDate={jobDeliveryDate}
                        className="absolute left-0 top-0 bottom-0 w-1.5 h-full"
                        containerStyle={{
                          display: "block",
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "6px",
                        }}
                      />
                    )}

                    <div className="jc-row1">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span className="jc-id">{j.id}</span>
                        {/* Priority Name Badge */}
                        {jobDeliveryDate && (
                          <DeliveryPriorityColor
                            deliveryDate={jobDeliveryDate}
                            showPriorityName={true}
                            badgeClassName="!text-[8px] !font-black !py-0.5 !px-1.5 !rounded-md text-white shadow-xs uppercase tracking-tight"
                          />
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {j.image && (
                          <img
                            src={j.image}
                            alt="Product"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImg(j.image);
                            }}
                            title="Click to view full image"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              objectFit: "cover",
                              border: "1.5px solid #E2E8F0",
                              background: "#F8FAFC",
                              flexShrink: 0,
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                              transition: "transform 0.15s ease",
                            }}
                          />
                        )}
                        {showBadge && (
                          <span
                            className="jc-status"
                            style={{
                              background: sc.bg,
                              color: sc.c,
                              border: "1px solid " + sc.bd,
                            }}
                          >
                            {sc.l}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="jc-client">{j.client}</div>
                    <div className="jc-product">{j.product}</div>
                    <div className="jc-meta">
                      <span className="jc-m">
                        Qty: <span className="jc-v">{j.qty}</span>
                      </span>
                      <span className="jc-m">
                        Type:{" "}
                        <span
                          className="jc-v"
                          style={{
                            color: (j.type || "")
                              .toLowerCase()
                              .includes("sample")
                              ? "#D97706"
                              : "#0284C7",
                          }}
                        >
                          {j.type || "Production"}
                        </span>
                      </span>
                      <span className="jc-m">
                        Comp:{" "}
                        <span className="jc-v">
                          {j.completionDate ||
                            j.job_completion_datetime ||
                            j.delivDate ||
                            "-"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SIDEBAR PAGINATION CONTROLS */}
          <div className="sb-pagination">
            <div className="sb-pagination-row">
              <span>
                Page <b>{page}</b> of <b>{totalPages}</b>
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Rows:</span>
                <select
                  className="sb-limit-select"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  disabled={loading}
                  title="Jobs per page"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="sb-pagination-nav">
              <button
                className="sb-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                title="Previous Page"
              >
                <i
                  className="fa-solid fa-chevron-left"
                  style={{ fontSize: 11 }}
                ></i>{" "}
                Prev
              </button>
              <span className="sb-page-indicator">
                {page} / {totalPages}
              </span>
              <button
                className="sb-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                title="Next Page"
              >
                Next{" "}
                <i
                  className="fa-solid fa-chevron-right"
                  style={{ fontSize: 11 }}
                ></i>
              </button>
            </div>
          </div>
        </div>

        <div className="main" style={{ position: "relative" }}>
          {!job ? (
            <div className="empty-state">
              {!sidebarOpen && (
                <button
                  className="sb-toggle"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open job list"
                  style={{ position: "absolute", top: 18, left: 18 }}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              )}
              <div className="empty-icon">📋</div>
              <div className="empty-title">
                {loading ? "Loading job records..." : "No jobs found"}
              </div>
              <div className="empty-sub">
                {loading
                  ? "Please wait while jobs load from database"
                  : "Create or sync jobs on the shopfloor to view complete ledgers"}
              </div>
            </div>
          ) : (
            <div className="main-inner">
              <JobBanner
                job={job}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />

              <div className="tab-row">
                {[
                  ["overview", "Overview"],
                  ["bom", "BOM + Process"],
                  ["material", "Flow Ledger"],
                  ["cs", "CS + Approvals"],
                  ["journey", "Shop Floor Journey"],
                  ["fgpack", "FG + QC + Packing"],
                  ["financial", "Financial P&L"],
                ].map(([id, l]) => (
                  <div
                    key={id}
                    className={"ltab" + (tab === id ? " on" : "")}
                    onClick={() => setTab(id)}
                  >
                    {l}
                  </div>
                ))}
              </div>

              {tab === "overview" && <OverviewTab job={job} />}
              {tab === "bom" && <BOMTab job={job} />}
              {tab === "material" && <FlowLedger job={job} />}
              {tab === "cs" && <CSTab job={job} />}
              {tab === "journey" && <JourneyTab job={job} />}
              {tab === "fgpack" && <FGPackTab job={job} />}
              {tab === "financial" && <FinancialTab job={job} />}
            </div>
          )}
        </div>
      </div>

      {/* FULL IMAGE LIGHTBOX PREVIEW MODAL */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImg(null)}
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                background: "#EF4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontSize: 16,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              ✕
            </button>
            <img
              src={previewImg}
              alt="Full Preview"
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 8,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default JobLedger;
