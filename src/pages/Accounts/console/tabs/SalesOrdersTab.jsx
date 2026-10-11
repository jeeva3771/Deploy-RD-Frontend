import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";
import { useLoader } from "../../../../context/LoaderContext";
import Pagination from "../../../components/Pagination";
import { STATUS_CFG } from "../constants/accountsConstants";
import { fmt } from "../utils/accountsFormatters";
import { downloadSalesOrdersPDF, downloadSalesOrdersCSV } from "../utils/accountsExport";
import { getUser, getUserRole } from "../../../../utils/permission/auth";

export default function SalesOrd({ soSummary = null, onRefreshDashboard }) {
  const { showLoader, hideLoader } = useLoader();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isSearchMounted = useRef(false);

  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'production' | 'sample'
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'amount_desc' | 'total_desc' | 'subjob'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [filterType, setFilterType] = useState('fy');
  const [filterValue, setFilterValue] = useState(() => {
    const d = new Date();
    return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString();
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filteredTotals, setFilteredTotals] = useState({ totalQty: 0, totalAmount: 0, totalGst: 0, totalWithGst: 0 });
  const [summary, setSummary] = useState(soSummary || null);

  const currentUser = getUser();
  const userRole = getUserRole();
  const userRoleLower = String(userRole?.name || userRole || currentUser?.role || currentUser?.role_name || "").toLowerCase();

  const isAdmin =
    currentUser?.is_admin === true ||
    userRoleLower.includes("admin");

  const SC = STATUS_CFG;

  const fetchBackendOrders = useCallback(async (overrides = {}) => {
    try {
      showLoader();
      setLoading(true);
      const params = {
        page: overrides.page !== undefined ? overrides.page : page,
        limit: overrides.limit !== undefined ? overrides.limit : limit,
        search: overrides.search !== undefined ? overrides.search : debouncedSearch,
        type: overrides.type !== undefined ? overrides.type : typeFilter,
        status: overrides.status !== undefined ? overrides.status : statusFilter,
        stage: overrides.stage !== undefined ? overrides.stage : stageFilter,
        sortBy: overrides.sortBy !== undefined ? overrides.sortBy : sortBy,
        filterType,
        filterValue
      };
      const res = await axiosInstance.get("/accounts/sales-orders", { params });
      if (res.data?.success) {
        setOrders(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.filteredTotals) setFilteredTotals(res.data.filteredTotals);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to load sales orders:", err);
      toast.error("Failed to load sales orders from server");
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [page, limit, debouncedSearch, typeFilter, statusFilter, stageFilter, sortBy, filterType, filterValue, showLoader, hideLoader]);

  // Debounce search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // When search query actually changes after mount, reset page back to 1
  useEffect(() => {
    if (!isSearchMounted.current) {
      isSearchMounted.current = true;
      return;
    }
    setPage(1);
  }, [debouncedSearch]);

  // Synchronize summary when parent AccountsConsole updates soSummary
  useEffect(() => {
    if (soSummary) {
      setSummary(soSummary);
    }
  }, [soSummary]);

  // Load when pagination, filters, or debouncedSearch change
  useEffect(() => {
    fetchBackendOrders();
  }, [fetchBackendOrders]);

  // Export complete filtered dataset from backend as PDF
  const handleExportPDF = async () => {
    if (!isAdmin) {
      toast.error("Only administrators are permitted to download Sales Orders PDF.");
      return;
    }

    let dateLabel = "";
    if (filterType === "today") dateLabel = `_Today_${filterValue}`;
    else if (filterType === "week") dateLabel = `_Week_${filterValue}`;
    else if (filterType === "month") dateLabel = `_Month_${filterValue}`;
    else if (filterType === "fy") dateLabel = `_FY_${filterValue}`;

    const typeLabel = typeFilter === "all" ? "All" : typeFilter === "production" ? "Production" : "Sample";
    const finalLabel = `${typeLabel}${dateLabel}`;

    try {
      showLoader();
      toast.info("Preparing complete Sales Orders PDF from server...");
      const res = await axiosInstance.get("/accounts/sales-orders", {
        params: {
          all: true,
          search: debouncedSearch,
          type: typeFilter,
          status: statusFilter,
          stage: stageFilter,
          sortBy,
          filterType,
          filterValue
        },
      });
      const exportItems = res.data?.data || orders;
      downloadSalesOrdersPDF(exportItems, finalLabel);
    } catch (err) {
      console.error("PDF export error:", err);
      downloadSalesOrdersPDF(orders, finalLabel);
    } finally {
      hideLoader();
    }
  };

  // Filtered summary totals from backend
  const filteredQty = filteredTotals.totalQty || 0;
  const filteredAmt = filteredTotals.totalAmount || 0;
  const filteredGst = filteredTotals.totalGst || 0;
  const filteredTotalWithGst = filteredTotals.totalWithGst || 0;

  // Summary statistics from backend
  const allSubjobsCount = summary?.totalSubjobs || pagination.total || 0;
  const allProdCount = summary?.productionCount || 0;
  const allSampleCount = summary?.sampleCount || 0;
  const allTotalAmt = summary?.totalAmount ?? filteredAmt;
  const allTotalGst = summary?.totalGst ?? filteredGst;
  const allTotalWithGst = summary?.totalWithGst ?? filteredTotalWithGst;

  const handleFilterSelect = (type) => {
    setFilterType(type);
    const d = new Date();
    if (type === 'today') {
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      setFilterValue(`${d.getFullYear()}-${mm}-${dd}`);
    } else if (type === 'fy') {
      setFilterValue((d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString());
    } else if (type === 'month') {
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      setFilterValue(`${d.getFullYear()}-${m}`);
    } else if (type === 'week') {
      const date = new Date(d.getTime());
      date.setDate(date.getDate() + 4 - (date.getDay() || 7));
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      setFilterValue(`${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`);
    }
    setPage(1);
  };

  return (
    <div>
      {/* KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Sub-Jobs</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2 }}>{allSubjobsCount}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "flex", gap: 8 }}>
            <span>🏭 Prod: <b style={{ color: "#2563EB" }}>{allProdCount}</b></span>
            <span>·</span>
            <span>🧪 Sample: <b style={{ color: "#D97706" }}>{allSampleCount}</b></span>
          </div>
        </div>

        <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Amount (Amt)</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0284C7", fontFamily: "monospace", marginTop: 2 }}>Rs {fmt(allTotalAmt)}</div>
          <div style={{ fontSize: 11, color: "#0369A1", marginTop: 2 }}>
            Base quotation subtotal (excl. GST)
          </div>
        </div>

        <div style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6D28D9", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total GST</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#7C3AED", fontFamily: "monospace", marginTop: 2 }}>Rs {fmt(allTotalGst)}</div>
          <div style={{ fontSize: 11, color: "#6D28D9", marginTop: 2 }}>
            Calculated tax component
          </div>
        </div>

        <div style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total + GST (Grand Total)</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#059669", fontFamily: "monospace", marginTop: 2 }}>Rs {fmt(allTotalWithGst)}</div>
          <div style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>
            Full quotation payable
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Type Filter Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F1F5F9", padding: "4px", borderRadius: 8 }}>
            <button
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                background: typeFilter === "all" ? "#0C1A2E" : "transparent",
                color: typeFilter === "all" ? "#FFFFFF" : "#64748B",
                transition: "all 0.15s",
              }}
              onClick={() => {
                setTypeFilter("all");
                setPage(1);
              }}
            >
              All Orders ({allSubjobsCount})
            </button>
            <button
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                background: typeFilter === "production" ? "#2563EB" : "transparent",
                color: typeFilter === "production" ? "#FFFFFF" : "#64748B",
                transition: "all 0.15s",
              }}
              onClick={() => {
                setTypeFilter("production");
                setPage(1);
              }}
            >
              🏭 Production ({allProdCount})
            </button>
            <button
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                background: typeFilter === "sample" ? "#D97706" : "transparent",
                color: typeFilter === "sample" ? "#FFFFFF" : "#64748B",
                transition: "all 0.15s",
              }}
              onClick={() => {
                setTypeFilter("sample");
                setPage(1);
              }}
            >
              🧪 Sample ({allSampleCount})
            </button>
          </div>

          <select
            onChange={(e) => handleFilterSelect(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", cursor: "pointer", background: "white", color: "#475569" }}
            value={filterType}
          >
            <option value="today">Today</option>
            <option value="week">By Week</option>
            <option value="month">By Month</option>
            <option value="fy">By Financial Year</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {filterType === "today" && (
              <input
                type="date"
                value={filterValue}
                readOnly
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", background: "#F8FAFC", color: "#94A3B8" }}
              />
            )}
            {filterType === "week" && (
              <input
                type="week"
                value={filterValue}
                onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", background: "white", color: "#0F172A" }}
              />
            )}
            {filterType === "month" && (
              <input
                type="month"
                value={filterValue}
                onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", background: "white", color: "#0F172A" }}
              />
            )}
            {filterType === "fy" && (
              <select
                value={filterValue}
                onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", cursor: "pointer", background: "white", color: "#0F172A" }}
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const yr = new Date().getFullYear() - 5 + i;
                  return <option key={yr} value={yr}>{yr} - {yr + 1}</option>;
                })}
              </select>
            )}
          </div>
        </div>

        {/* Search, Status, and Sorting */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <div style={{ minWidth: 220, maxWidth: 300, flex: 1 }}>
            <input
              type="text"
              className="inp"
              placeholder="🔍 Search Sub-Job, Job, Client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 12 }}
            />
          </div>

          <select
            className="sel"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", padding: "7px 10px", fontSize: 12 }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial_paid">Partial Paid</option>
            <option value="paid">Fully Paid</option>
          </select>



          <select
            className="sel"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", padding: "7px 10px", fontSize: 12 }}
          >
            <option value="newest">Newest First</option>
            <option value="amount_desc">Highest Amount (Amt)</option>
            <option value="total_desc">Highest Total + GST</option>
            <option value="subjob">Sub-Job No A-Z</option>
          </select>

          <button
            className="btn bs"
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "7px 11px" }}
            onClick={() => {
              fetchBackendOrders();
              if (onRefreshDashboard) onRefreshDashboard();
            }}
            disabled={loading}
            title="Reload latest live data from server"
          >
            <span>{loading ? "⏳" : "🔄"}</span>
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>

          {isAdmin && (
            <button
              className="btn bs"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, borderColor: "#0D9488", color: "#0D9488", padding: "7px 11px" }}
              onClick={handleExportPDF}
              title="Export filtered sub-jobs as PDF"
            >
              <span>📄</span> PDF
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ overflow: "hidden", border: "1.5px solid #E2E8F0" }}>
        <div className="cb" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#0C1A2E", color: "#FFFFFF" }}>
                  <th style={{ padding: "9px 8px", textAlign: "center", fontSize: 11, fontWeight: 800, width: 36 }}>#</th>
                  <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>Sub-Job No</th>
                  <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 11, fontWeight: 800 }}>Order Type</th>
                  <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>Client Name</th>
                  <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 800 }}>Product</th>
                  <th style={{ padding: "9px 8px", textAlign: "center", fontSize: 11, fontWeight: 800 }}>Qty</th>
                  <th style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, fontWeight: 800 }}>Unit Rate</th>
                  <th style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, fontWeight: 800, background: "#1E293B" }}>
                    Amount (Amt)
                  </th>
                  <th style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, fontWeight: 800 }}>GST</th>
                  <th style={{ padding: "9px 10px", textAlign: "right", fontSize: 11, fontWeight: 800, background: "#047857" }}>
                    Total + GST
                  </th>
                  <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 11, fontWeight: 800, background: "#1E293B" }}>
                    Job Stage
                  </th>
                  <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 11, fontWeight: 800 }}>Delivery</th>
                  <th style={{ padding: "9px 10px", textAlign: "center", fontSize: 11, fontWeight: 800 }}>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: "center", padding: 36, color: "#64748B", fontStyle: "italic" }}>
                      Loading live sales orders from server...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: "center", padding: 36, color: "#64748B" }}>
                      No sub-job sales orders found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((so, idx) => {
                    const isProd = so.type === "production";
                    const s = SC[so.status] || { c: "#64748B", bg: "#F1F5F9" };
                    return (
                      <tr
                        key={so.id || so.sub_job_no || idx}
                        className="bbl"
                        style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC", transition: "background 0.15s" }}
                      >
                        {/* # */}
                        <td style={{ padding: "9px 8px", textAlign: "center", color: "#94A3B8", fontWeight: 700, fontSize: 11 }}>
                          {((pagination.page || page) - 1) * (pagination.limit || limit) + idx + 1}
                        </td>

                        {/* Sub-Job No */}
                        <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 900, color: "#0D9488", fontSize: 12.5 }}>
                            {so.sub_job_no}
                          </span>
                        </td>

                        {/* Type (Production vs Sample) */}
                        <td style={{ padding: "9px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                          {isProd ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#EFF6FF",
                                color: "#1D4ED8",
                                border: "1px solid #BFDBFE",
                                borderRadius: 5,
                                padding: "2px 8px",
                                fontSize: 10.5,
                                fontWeight: 800,
                                letterSpacing: "0.3px",
                              }}
                            >
                              🏭 PRODUCTION
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#FFFBEB",
                                color: "#B45309",
                                border: "1px solid #FDE68A",
                                borderRadius: 5,
                                padding: "2px 8px",
                                fontSize: 10.5,
                                fontWeight: 800,
                                letterSpacing: "0.3px",
                              }}
                            >
                              🧪 SAMPLE
                            </span>
                          )}
                        </td>

                        {/* Client Name */}
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ fontWeight: 800, color: "#0C1A2E" }}>{so.client}</div>
                          {so.phone && so.phone !== "—" && (
                            <div style={{ fontSize: 10.5, color: "#94A3B8" }}>📞 {so.phone}</div>
                          )}
                        </td>

                        {/* Product & Description */}
                        <td style={{ padding: "9px 10px", maxWidth: 220 }}>
                          <div style={{ fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>{so.product}</div>
                          {so.description && (
                            <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {so.description}
                            </div>
                          )}
                        </td>

                        {/* Qty */}
                        <td style={{ padding: "9px 8px", textAlign: "center", fontFamily: "monospace", fontWeight: 800 }}>
                          {Number(so.qty || 1).toLocaleString("en-IN")}
                        </td>

                        {/* Unit Rate */}
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "#64748B" }}>
                          Rs {Number(so.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Amount ("Amt") */}
                        <td style={{ padding: "9px 10px", textAlign: "right", background: "rgba(15, 23, 42, 0.02)" }}>
                          <div style={{ fontFamily: "monospace", fontWeight: 900, color: so.hasInvoice ? "#0F172A" : "#94A3B8", fontSize: 13 }}>
                            Rs {Number(so.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: 9.5, color: so.hasInvoice ? "#64748B" : "#94A3B8", fontWeight: 700 }}>
                            {so.hasInvoice ? "Subtotal" : "Unbilled"}
                          </div>
                        </td>

                        {/* GST */}
                        <td style={{ padding: "9px 10px", textAlign: "right" }}>
                          <div style={{ fontWeight: 800, color: so.hasInvoice ? "#6366F1" : "#94A3B8", fontSize: 11 }}>
                            {so.hasInvoice ? `${so.gstRate}%` : "—"}
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 10.5, color: so.hasInvoice ? "#64748B" : "#94A3B8" }}>
                            Rs {Number(so.gstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>

                        {/* Total + GST */}
                        <td style={{ padding: "9px 10px", textAlign: "right", background: so.hasInvoice ? "rgba(5, 150, 105, 0.04)" : "rgba(15, 23, 42, 0.02)" }}>
                          <div
                            style={{
                              background: so.hasInvoice ? "#ECFDF5" : "#F8FAFC",
                              border: `1px solid ${so.hasInvoice ? "#A7F3D0" : "#E2E8F0"}`,
                              borderRadius: 6,
                              padding: "3px 7px",
                              display: "inline-block",
                              textAlign: "right",
                            }}
                          >
                            <div style={{ fontFamily: "monospace", fontWeight: 900, color: so.hasInvoice ? "#059669" : "#64748B", fontSize: 13.5 }}>
                              Rs {Number(so.totalWithGst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: 9.5, color: so.hasInvoice ? "#059669" : "#94A3B8", fontWeight: 800 }}>
                              {so.hasInvoice ? "Total + GST" : "Not Invoiced"}
                            </div>
                          </div>
                        </td>

                        {/* Job Stage */}
                        <td style={{ padding: "9px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                          {(() => {
                            const stageObj = typeof so.job_stage === "object" && so.job_stage !== null ? so.job_stage : null;
                            const label = stageObj?.label || (typeof so.job_stage === "string" ? so.job_stage : so.stage || "");
                            if (!label || label === "—") {
                              return <span style={{ color: "#94A3B8", fontSize: 11 }}>—</span>;
                            }
                            const icon = stageObj?.icon || (label.toLowerCase().includes("laser") ? "⚡" : label.toLowerCase().includes("assembly") ? "🔧" : label.toLowerCase().includes("dispatch") ? "🚚" : label.toLowerCase().includes("qc") ? "✅" : label.toLowerCase().includes("pack") ? "📦" : label.toLowerCase().includes("paint") ? "🎨" : "📋");
                            const color = stageObj?.color || "#0F172A";
                            const bgColor = stageObj?.bgColor || "#F8FAFC";
                            const borderColor = stageObj?.borderColor || "#E2E8F0";
                            const detail = stageObj?.detail || "";

                            return (
                              <div
                                style={{
                                  display: "inline-flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 2,
                                  background: bgColor,
                                  border: `1px solid ${borderColor}`,
                                  borderRadius: 6,
                                  padding: "3px 8px",
                                  minWidth: 105,
                                }}
                                title={`Department: ${stageObj?.department || label}${detail ? ` | ${detail}` : ""}`}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: color,
                                    letterSpacing: "0.2px",
                                  }}
                                >
                                  <span>{icon}</span>
                                  <span>{label}</span>
                                </div>
                                {detail && (
                                  <div
                                    style={{
                                      fontSize: 9.5,
                                      color: "#64748B",
                                      fontWeight: 600,
                                      maxWidth: 130,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {detail}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Delivery */}
                        <td style={{ padding: "9px 10px", textAlign: "center", fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                          {so.deliveryDate || "—"}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "9px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              background: s.bg || "#F1F5F9",
                              color: s.c || "#64748B",
                              borderRadius: 6,
                              padding: "2px 7px",
                              fontSize: 10.5,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              border: `1px solid ${s.c ? s.c + "44" : "#E2E8F0"}`,
                            }}
                          >
                            {String(so.status || "quoted").replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer */}
              <tfoot>
                <tr style={{ background: "#F1F5F9", borderTop: "2px solid #CBD5E1" }}>
                  <td colSpan={5} style={{ padding: "10px", fontWeight: 900, fontSize: 12, color: "#0C1A2E" }}>
                    TOTAL ({pagination.total || 0} Sub-Jobs)
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "center", fontFamily: "monospace", fontWeight: 900, fontSize: 12 }}>
                    {filteredQty.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "10px" }} />
                  <td style={{ padding: "10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#0F172A", fontSize: 13 }}>
                    Rs {filteredAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#6366F1", fontSize: 12 }}>
                    Rs {filteredGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#059669", fontSize: 14 }}>
                    Rs {filteredTotalWithGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Default Shared CRM Pagination Component */}
          <Pagination
            currentPage={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            itemsPerPage={pagination.limit || limit}
            totalCount={pagination.total || 0}
            startIndex={((pagination.page || page) - 1) * (pagination.limit || limit)}
            visibleItemCount={orders.length}
            onPageChange={(newPage) => setPage(newPage)}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            customOptions={[10, 15, 25, 50]}
          />
        </div>
      </div>
    </div>
  );
}

// WhatsApp Payment Reminder Modal (2Factor Template: payment reminder)
