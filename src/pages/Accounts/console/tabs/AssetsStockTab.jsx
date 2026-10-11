import React, { useState, useEffect, useCallback } from "react";
import { ACC } from "../constants/accountsConstants";
import { fmt } from "../utils/accountsFormatters";
import { Met, Th, Td, Tag2 } from "../common/UIHelpers";
import { axiosInstance } from "../../../../utils/url/config";
import { useLoader } from "../../../../context/LoaderContext";
import { toast } from "react-toastify";
import Pagination from "../../../components/Pagination";

export default function AssetsView() {
  const { showLoader, hideLoader } = useLoader();
  const [sub, setSub] = useState("assets");
  const [liveAssets, setLiveAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetFilter, setAssetFilter] = useState("active"); // 'active' | 'all'

  // Assets Pagination State
  const [assetsCurrentPage, setAssetsCurrentPage] = useState(1);
  const [assetsItemsPerPage, setAssetsItemsPerPage] = useState(8);
  const [assetsTotalCount, setAssetsTotalCount] = useState(0);
  const [assetsMetrics, setAssetsMetrics] = useState({ totalCost: 0, totalBook: 0, totalDep: 0 });
  const [assetsSearch, setAssetsSearch] = useState("");
  const [assetsFilterType, setAssetsFilterType] = useState('fy');
  const [assetsFilterValue, setAssetsFilterValue] = useState(() => {
    const d = new Date();
    return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString();
  });

  // Live Stock State (Stock Ledger)
  const [liveStock, setLiveStock] = useState([]);
  const [stockMetrics, setStockMetrics] = useState({
    totalStockValue: 0,
    totalItems: 0,
    lowStockAlerts: 0,
    zeroStock: 0,
  });
  const [stockLoading, setStockLoading] = useState(false);
  const [stockFilterType, setStockFilterType] = useState("fy");
  const [stockFilterValue, setStockFilterValue] = useState(() => {
    const d = new Date();
    return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString();
  });
  const [stockSearch, setStockSearch] = useState("");
  const [stockCurrentPage, setStockCurrentPage] = useState(1);
  const [stockItemsPerPage, setStockItemsPerPage] = useState(8);
  const [stockTotalCount, setStockTotalCount] = useState(0);

  const [liveGodownStock, setLiveGodownStock] = useState([]);
  const [godownStockLoading, setGodownStockLoading] = useState(false);
  const [godownCurrentPage, setGodownCurrentPage] = useState(1);
  const [godownItemsPerPage, setGodownItemsPerPage] = useState(8);
  const [godownTotalCount, setGodownTotalCount] = useState(0);
  const [godownMetrics, setGodownMetrics] = useState({ inStock: 0, outOfStock: 0, totalValue: 0 });
  const [godownFilterType, setGodownFilterType] = useState("fy");
  const [godownFilterValue, setGodownFilterValue] = useState(() => {
    const d = new Date();
    return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString();
  });
  const [godownSearch, setGodownSearch] = useState("");

  // Live BOM State
  const [liveBomData, setLiveBomData] = useState([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [bomCurrentPage, setBomCurrentPage] = useState(1);
  const [bomItemsPerPage, setBomItemsPerPage] = useState(8);
  const [bomTotalCount, setBomTotalCount] = useState(0);
  const [bomMetrics, setBomMetrics] = useState({ totalJobs: 0, overBom: 0, underBom: 0, exactBom: 0 });
  const [bomExpJob, setBomExpJob] = useState(null);
  const [bomFilterType, setBomFilterType] = useState("fy");
  const [bomFilterValue, setBomFilterValue] = useState(() => {
    const d = new Date();
    return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString();
  });
  const [bomSearch, setBomSearch] = useState("");
  const [emrModalData, setEmrModalData] = useState(null);

  const fetchGodownStock = useCallback(async () => {
    try {
      setGodownStockLoading(true);
      let url = `/shop-floor/inventory?shopfloor_name=All&page=${godownCurrentPage}&limit=${godownItemsPerPage}`;
      if (godownFilterType !== 'all' && godownFilterValue) {
        url += `&filterType=${godownFilterType}&filterValue=${encodeURIComponent(godownFilterValue)}`;
      }
      if (godownSearch && godownSearch.trim()) {
        url += `&search=${encodeURIComponent(godownSearch.trim())}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data?.success) {
        setLiveGodownStock(res.data.data || []);
        setGodownTotalCount(res.data.totalCount || 0);
        if (res.data.metrics) setGodownMetrics(res.data.metrics);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load godown stock summary");
    } finally {
      setGodownStockLoading(false);
    }
  }, [godownCurrentPage, godownItemsPerPage, godownFilterType, godownFilterValue, godownSearch]);

  const fetchBomAnalysis = useCallback(async () => {
    try {
      showLoader();
      let url = `/accounts/bom-analysis?page=${bomCurrentPage}&limit=${bomItemsPerPage}`;
      if (bomFilterType !== 'all' && bomFilterValue) {
        url += `&filterType=${bomFilterType}&filterValue=${encodeURIComponent(bomFilterValue)}`;
      }
      if (bomSearch && bomSearch.trim()) {
        url += `&search=${encodeURIComponent(bomSearch.trim())}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data?.success) {
        setLiveBomData(res.data.data || []);
        setBomTotalCount(res.data.totalCount || 0);
        if (res.data.metrics) setBomMetrics(res.data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      hideLoader();
    }
  }, [bomCurrentPage, bomItemsPerPage, bomFilterType, bomFilterValue, bomSearch, showLoader, hideLoader]);

  useEffect(() => {
    if (sub === 'godowns') {
      fetchGodownStock();
    } else if (sub === 'bom') {
      fetchBomAnalysis();
    }
  }, [sub, fetchGodownStock, fetchBomAnalysis]);

  const fetchLiveMachines = useCallback(async () => {
    try {
      showLoader();
      setAssetsLoading(true);
      let url = `/machine?page=${assetsCurrentPage}&limit=${assetsItemsPerPage}`;
      if (assetFilter === "active") {
        url += `&is_active=true`;
      }
      if (assetsSearch && assetsSearch.trim()) {
        url += `&search=${encodeURIComponent(assetsSearch.trim())}`;
      }
      if (assetsFilterType !== 'all' && assetsFilterValue) {
        url += `&filterType=${assetsFilterType}&filterValue=${encodeURIComponent(assetsFilterValue)}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAssetsTotalCount(res.data.total || res.data.data.length);
        if (res.data.metrics) setAssetsMetrics(res.data.metrics);
        const mapped = res.data.data.map((m) => {
          const cost = Number(m.gross_cost) || 0;
          const book = Number(m.book_value) || 0;
          const dep =
            Number(m.accumulated_depreciation) ||
            Math.max(0, cost - book);
          const isActive =
            m.is_active === true ||
            m.is_active === 1 ||
            m.is_active === "true";
          return {
            id: m.machine_number || m.id,
            n: m.name,
            cat: m.department?.name || m.type || "Machinery",
            yr:
              m.commission_date || "—",
            cost,
            book,
            dep,
            loc: m.location && m.location.trim() ? m.location.trim() : "—",
            status: isActive ? "active" : "inactive",
            svc: m.last_service_date || "—",
          };
        });
        setLiveAssets(mapped);
      } else {
        setLiveAssets([]);
      }
    } catch (err) {
      console.warn("Failed to fetch live machines for fixed assets:", err);
      setLiveAssets([]);
    } finally {
      setAssetsLoading(false);
      hideLoader();
    }
  }, [assetsCurrentPage, assetsItemsPerPage, assetFilter, assetsSearch, assetsFilterType, assetsFilterValue, showLoader, hideLoader]);

  const fetchLiveStock = useCallback(
    async () => {
      try {
        setStockLoading(true);
        let url = `/accounts/stock-summary?page=${stockCurrentPage}&limit=${stockItemsPerPage}`;
        if (stockFilterType !== 'all' && stockFilterValue) {
          url += `&filterType=${stockFilterType}&filterValue=${encodeURIComponent(stockFilterValue)}`;
        }
        if (stockSearch && stockSearch.trim()) {
          url += `&search=${encodeURIComponent(stockSearch.trim())}`;
        }
        const res = await axiosInstance.get(url);
        if (res.data?.success) {
          setLiveStock(res.data.stock || []);
          setStockMetrics(res.data.metrics || {});
          setStockTotalCount(res.data.totalCount || 0);
        }
      } catch (err) {
        console.warn("Failed to fetch live stock:", err);
        toast.error("Failed to load live stock summary");
      } finally {
        setStockLoading(false);
      }
    },
    [stockFilterType, stockFilterValue, stockSearch, stockCurrentPage, stockItemsPerPage]
  );

  useEffect(() => {
    fetchLiveMachines();
  }, [fetchLiveMachines]);

  useEffect(() => {
    if (sub === "stock") {
      fetchLiveStock();
    }
  }, [sub, fetchLiveStock]);


  // Only use live machines - no fallback to mock data
  const baseAssets = liveAssets || [];
  // Default to listing all active records
  const assets =
    assetFilter === "active"
      ? baseAssets.filter((a) => a.status === "active")
      : baseAssets;

  const godowns = ACC.godowns;
  const bom = ACC.bom;
  const lowStock = liveStock.filter((i) => i.cl <= i.min);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          ["assets", "🏭 Fixed Assets"],
          ["stock", "📦 Stock"],
          ["godowns", "🏪 Godowns"],
          ["bom", "📐 BOM Analysis"],
        ].map(([k, l]) => (
          <button
            key={k}
            className={"btn bs " + (sub === k ? "bn" : "")}
            style={
              sub === k
                ? {}
                : {
                  background: "#F8FAFC",
                  borderColor: "#E2E8F0",
                  color: "#64748B",
                }
            }
            onClick={() => setSub(k)}
          >
            {l}
          </button>
        ))}
      </div>
      {sub === "assets" && (
        <div>
          <div className="g4mb">
            <Met
              v={"Rs " + fmt(assetsMetrics.totalCost)}
              l="Gross Block"
              c="#0C1A2E"
              bg="#F8FAFC"
              bd="#E2E8F0"
            />
            <Met
              v={"Rs " + fmt(assetsMetrics.totalBook)}
              l="Net Block"
              c="#059669"
              bg="#ECFDF5"
              bd="#A7F3D0"
            />
            <Met
              v={"Rs " + fmt(assetsMetrics.totalDep)}
              l="Accumulated Dep"
              c="#EF4444"
              bg="#FEF2F2"
              bd="#FECACA"
            />
            <Met
              v={assetsTotalCount}
              l="Total Records"
              c="#0D9488"
              bg="#F0FDFA"
              bd="#99F6E4"
            />
          </div>

          {/* Sub-header controls: Active Filter & Refresh */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Showing:
              </span>
              <button
                type="button"
                onClick={() => { setAssetFilter("active"); setAssetsCurrentPage(1); }}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor:
                    assetFilter === "active" ? "#0D9488" : "#E2E8F0",
                  background:
                    assetFilter === "active" ? "#0D9488" : "#FFFFFF",
                  color: assetFilter === "active" ? "#FFFFFF" : "#64748B",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Active Only
              </button>
              <button
                type="button"
                onClick={() => { setAssetFilter("all"); setAssetsCurrentPage(1); }}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor:
                    assetFilter === "all" ? "#0D9488" : "#E2E8F0",
                  background:
                    assetFilter === "all" ? "#0D9488" : "#FFFFFF",
                  color: assetFilter === "all" ? "#FFFFFF" : "#64748B",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                All Records
              </button>

              <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  value={assetsFilterType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setAssetsFilterType(type);

                    const d = new Date();
                    if (type === 'today') {
                      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
                      const dd = d.getDate().toString().padStart(2, '0');
                      setAssetsFilterValue(`${d.getFullYear()}-${mm}-${dd}`);
                    } else if (type === 'fy') {
                      setAssetsFilterValue((d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString());
                    } else if (type === 'month') {
                      const m = (d.getMonth() + 1).toString().padStart(2, '0');
                      setAssetsFilterValue(`${d.getFullYear()}-${m}`);
                    } else if (type === 'week') {
                      const date = new Date(d.getTime());
                      date.setDate(date.getDate() + 4 - (date.getDay() || 7));
                      const yearStart = new Date(date.getFullYear(), 0, 1);
                      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
                      setAssetsFilterValue(`${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`);
                    }
                    setAssetsCurrentPage(1);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                    color: "#475569",
                    outline: "none",
                    cursor: "pointer",
                    background: "white",
                  }}
                >
                  <option value="today">Today</option>
                  <option value="week">By Week</option>
                  <option value="month">By Month</option>
                  <option value="fy">By Financial Year</option>
                </select>

                {assetsFilterType === "today" && (
                  <input
                    type="date"
                    value={assetsFilterValue}
                    readOnly
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "#F8FAFC", color: "#94A3B8" }}
                  />
                )}
                {assetsFilterType === "week" && (
                  <input
                    type="week"
                    value={assetsFilterValue}
                    onChange={(e) => {
                      setAssetsFilterValue(e.target.value);
                      setAssetsCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                  />
                )}
                {assetsFilterType === "month" && (
                  <input
                    type="month"
                    value={assetsFilterValue}
                    onChange={(e) => {
                      setAssetsFilterValue(e.target.value);
                      setAssetsCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                  />
                )}
                {assetsFilterType === "fy" && (
                  <select
                    value={assetsFilterValue}
                    onChange={(e) => {
                      setAssetsFilterValue(e.target.value);
                      setAssetsCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const now = new Date();
                      const yr = (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) - i;
                      return <option key={yr} value={yr}>{yr} - {yr + 1}</option>;
                    })}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Search machines..."
                  value={assetsSearch}
                  onChange={(e) => {
                    setAssetsSearch(e.target.value);
                    setAssetsCurrentPage(1); // Reset page on search
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    outline: "none",
                    minWidth: 200,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={fetchLiveMachines}
              disabled={assetsLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: "#0D9488",
                background: "#F0FDFA",
                border: "1px solid #99F6E4",
                borderRadius: 6,
                cursor: assetsLoading ? "not-allowed" : "pointer",
              }}
              title="Refresh live machine records"
            >
              <i
                className={
                  "fa-solid fa-rotate-right" +
                  (assetsLoading ? " fa-spin" : "")
                }
              ></i>
              {assetsLoading ? "Refreshing..." : "Sync Machines"}
            </button>
          </div>

          <div className="card">
            <div className="cb" style={{ padding: 0 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12.5,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "ID",
                      "Asset Name",
                      "Department",
                      "Year",
                      "Gross Cost",
                      "Book Value",
                      "Dep",
                      "Location",
                      "Status",
                      "Last Service",
                    ].map((h) => (
                      <Th key={h} ch={h} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assetsLoading ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          padding: 24,
                          color: "#94A3B8",
                          fontSize: 13,
                        }}
                      >
                        Loading machines...
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          padding: 24,
                          color: "#94A3B8",
                          fontSize: 13,
                        }}
                      >
                        {assetFilter === "active"
                          ? "No active fixed asset records found."
                          : "No fixed asset records found."}
                      </td>
                    </tr>
                  ) : (
                    assets.map((a) => (
                      <tr key={a.id} className="bbl">
                        <Td v={a.id} mono c="#0D9488" />
                        <Td v={a.n} bold c="#0C1A2E" />
                        <Td v={a.cat} c="#64748B" />
                        <Td v={a.yr} c="#64748B" />
                        <Td v={"Rs " + fmt(a.cost)} mono />
                        <Td v={"Rs " + fmt(a.book)} mono bold c="#059669" />
                        <Td v={"Rs " + fmt(a.dep)} mono c="#EF4444" />
                        <Td v={a.loc} c="#64748B" />
                        <td style={{ padding: "8px 10px" }}>
                          <Tag2
                            l={a.status}
                            c={a.status === "active" ? "#059669" : "#EF4444"}
                          />
                        </td>
                        <Td v={a.svc} c="#94A3B8" />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20 }}>
              <Pagination
                currentPage={assetsCurrentPage}
                totalPages={Math.ceil(assetsTotalCount / assetsItemsPerPage)}
                onPageChange={setAssetsCurrentPage}
                itemsPerPage={assetsItemsPerPage}
                onItemsPerPageChange={(val) => {
                  setAssetsItemsPerPage(val);
                  setAssetsCurrentPage(1);
                }}
                totalCount={assetsTotalCount}
                startIndex={(assetsCurrentPage - 1) * assetsItemsPerPage}
                visibleItemCount={assets.length}
                customOptions={[8, 16, 24, 32, 50]}
              />
            </div>
          </div>
        </div>
      )}
      {sub === 'stock' && (
        <div>
          <div className="g4mb">
            <Met
              v={'Rs ' + fmt(stockMetrics.totalStockValue || 0)}
              l="Total Stock Value"
              c="#059669"
              bg="#ECFDF5"
              bd="#A7F3D0"
            />
            <Met
              v={stockMetrics.totalItems || liveStock.length}
              l="Total Items"
              c="#0D9488"
              bg="#F0FDFA"
              bd="#99F6E4"
            />
            <Met
              v={stockMetrics.lowStockAlerts || 0}
              l="Low Stock Alerts"
              c="#EF4444"
              bg="#FEF2F2"
              bd="#FECACA"
            />
            <Met
              v={stockMetrics.zeroStock || 0}
              l="Zero Stock"
              c="#F59E0B"
              bg="#FFFBEB"
              bd="#FDE68A"
            />
          </div>

          {/* Sub-header controls: Period, Search, Inward/Adjustment, Refresh */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

              <select
                value={stockFilterType}
                onChange={(e) => {
                  const type = e.target.value;
                  setStockFilterType(type);

                  const d = new Date();
                  if (type === 'today') {
                    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
                    const dd = d.getDate().toString().padStart(2, '0');
                    setStockFilterValue(`${d.getFullYear()}-${mm}-${dd}`);
                  } else if (type === 'fy') {
                    setStockFilterValue((d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString());
                  } else if (type === 'month') {
                    const m = (d.getMonth() + 1).toString().padStart(2, '0');
                    setStockFilterValue(`${d.getFullYear()}-${m}`);
                  } else if (type === 'week') {
                    const date = new Date(d.getTime());
                    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
                    const yearStart = new Date(date.getFullYear(), 0, 1);
                    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
                    setStockFilterValue(`${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`);
                  } else {
                    setStockFilterValue("");
                  }
                  setStockCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                  color: "#475569",
                  outline: "none",
                  cursor: "pointer",
                  background: "white",
                }}
              >
                <option value="today">Today</option>
                <option value="week">Week-wise</option>
                <option value="month">Month-wise</option>
                <option value="fy">Financial Year</option>
              </select>

              {stockFilterType === "today" && (
                <input
                  type="date"
                  value={stockFilterValue}
                  readOnly
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "#F8FAFC", color: "#94A3B8" }}
                />
              )}
              {stockFilterType === "week" && (
                <input
                  type="week"
                  value={stockFilterValue}
                  onChange={(e) => {
                    setStockFilterValue(e.target.value);
                    setStockCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                />
              )}
              {stockFilterType === "month" && (
                <input
                  type="month"
                  value={stockFilterValue}
                  onChange={(e) => {
                    setStockFilterValue(e.target.value);
                    setStockCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                />
              )}
              {stockFilterType === "fy" && (
                <select
                  value={stockFilterValue}
                  onChange={(e) => {
                    setStockFilterValue(e.target.value);
                    setStockCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                >
                  {Array.from({ length: 5 }, (_, i) => {
  const now = new Date();
  const yr = (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) - i;
  return <option key={yr} value={yr}>{yr} - {yr + 1}</option>;
})}
                </select>
              )}

              <input
                type="text"
                placeholder="Search material..."
                value={stockSearch}
                onChange={(e) => {
                  setStockSearch(e.target.value);
                  setStockCurrentPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 12,
                  width: 220,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

              <button
                className="btn bs"
                onClick={() => fetchLiveStock()}
                disabled={stockLoading}
                style={{
                  background: "white",
                  border: "1px solid #E2E8F0",
                  color: "#64748B",
                  padding: "7px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: "pointer",
                }}
                title="Refresh Stock Records"
              >
                {stockLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {/* {lowStock.length > 0 && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 9,
                padding: "9px 14px",
                marginBottom: 10,
                fontSize: 12,
                fontWeight: 700,
                color: "#B91C1C",
              }}
            >
              Low Stock: {lowStock.map((i) => i.n).slice(0, 5).join(" · ")}
              {lowStock.length > 5 ? ` and ${lowStock.length - 5} more` : ""}
            </div>
          )} */}

          <div className="card">
            <div className="cb" style={{ padding: 0 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12.5,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "ID",
                      "Material",
                      "Unit",
                      "Opening",
                      "Received",
                      "Issued",
                      "Closing",
                      "Min",
                      "Value",
                      "Status",
                    ].map((h) => (
                      <Th key={h} ch={h} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockLoading ? (
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          textAlign: "center",
                          padding: 28,
                          color: "#94A3B8",
                          fontSize: 13,
                        }}
                      >
                        Loading live stock records...
                      </td>
                    </tr>
                  ) : liveStock.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          padding: 28,
                          color: "#94A3B8",
                          fontSize: 13,
                        }}
                      >
                        No material stock records found.
                      </td>
                    </tr>
                  ) : (
                    liveStock.map((i) => {
                      const low = i.cl <= i.min;
                      return (
                        <tr
                          key={i._id || i.id}
                          style={{
                            borderBottom: "1px solid #F1F5F9",
                            background: low ? "#FFF8F8" : "white",
                          }}
                        >
                          <Td v={i.id} mono c="#0D9488" />
                          <Td v={i.n} bold c="#0C1A2E" />
                          <Td v={i.u} c="#64748B" />
                          <Td v={Number(i.op).toLocaleString('en-IN')} mono />
                          <Td v={Number(i.rcv).toLocaleString('en-IN')} mono c="#059669" />
                          <Td v={Number(i.iss).toLocaleString('en-IN')} mono c="#EF4444" />
                          <Td
                            v={Number(i.cl).toLocaleString('en-IN')}
                            mono
                            bold
                            c={low ? "#EF4444" : "#0C1A2E"}
                          />
                          <Td v={Number(i.min).toLocaleString('en-IN')} mono c="#94A3B8" />
                          <Td v={"Rs " + fmt(i.val)} mono bold c="#6366F1" />
                          <td style={{ padding: "8px 10px" }}>
                            <Tag2
                              l={low ? "Low" : "OK"}
                              c={low ? "#EF4444" : "#059669"}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <Pagination
              currentPage={stockCurrentPage}
              totalPages={Math.ceil(stockTotalCount / stockItemsPerPage)}
              onPageChange={setStockCurrentPage}
              itemsPerPage={stockItemsPerPage}
              onItemsPerPageChange={(val) => {
                setStockItemsPerPage(val);
                setStockCurrentPage(1);
              }}
              totalCount={stockTotalCount}
              startIndex={(stockCurrentPage - 1) * stockItemsPerPage}
              visibleItemCount={liveStock.length}
              customOptions={[8, 16, 24, 32, 50]}
            />
          </div>
        </div>
      )}
      {sub === 'godowns' && (
        <div>
          <>
            <div className="g4mb">
              <Met v={godownTotalCount} l="Total Items" c="#0D9488" bg="#F0FDFA" bd="#99F6E4" />
              <Met v={godownMetrics.inStock} l="In Stock" c="#059669" bg="#ECFDF5" bd="#A7F3D0" />
              <Met v={godownMetrics.outOfStock} l="Out of Stock" c="#EF4444" bg="#FEF2F2" bd="#FECACA" />
              <Met v={"Rs " + fmt(Number(godownMetrics.totalValue || 0).toFixed(2))} l="Total Value" c="#F59E0B" bg="#FFFBEB" bd="#FDE68A" />
            </div>

            {/* Sub-header controls for Godowns */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                <select
                  value={godownFilterType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setGodownFilterType(type);

                    const d = new Date();
                    if (type === 'today') {
                      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
                      const dd = d.getDate().toString().padStart(2, '0');
                      setGodownFilterValue(`${d.getFullYear()}-${mm}-${dd}`);
                    } else if (type === 'fy') {
                      setGodownFilterValue((d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString());
                    } else if (type === 'month') {
                      const m = (d.getMonth() + 1).toString().padStart(2, '0');
                      setGodownFilterValue(`${d.getFullYear()}-${m}`);
                    } else if (type === 'week') {
                      const date = new Date(d.getTime());
                      date.setDate(date.getDate() + 4 - (date.getDay() || 7));
                      const yearStart = new Date(date.getFullYear(), 0, 1);
                      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
                      setGodownFilterValue(`${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`);
                    } else {
                      setGodownFilterValue("");
                    }
                    setGodownCurrentPage(1);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                    color: "#475569",
                    outline: "none",
                    cursor: "pointer",
                    background: "white",
                  }}
                >
                  <option value="today">Today</option>
                  <option value="week">Week-wise</option>
                  <option value="month">Month-wise</option>
                  <option value="fy">Financial Year</option>
                </select>

                {godownFilterType === "today" && (
                  <input
                    type="date"
                    value={godownFilterValue}
                    readOnly
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "#F8FAFC", color: "#94A3B8" }}
                  />
                )}
                {godownFilterType === "week" && (
                  <input
                    type="week"
                    value={godownFilterValue}
                    onChange={(e) => {
                      setGodownFilterValue(e.target.value);
                      setGodownCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                  />
                )}
                {godownFilterType === "month" && (
                  <input
                    type="month"
                    value={godownFilterValue}
                    onChange={(e) => {
                      setGodownFilterValue(e.target.value);
                      setGodownCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                  />
                )}
                {godownFilterType === "fy" && (
                  <select
                    value={godownFilterValue}
                    onChange={(e) => {
                      setGodownFilterValue(e.target.value);
                      setGodownCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "white" }}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const now = new Date();
                      const yr = (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) - i;
                      return <option key={yr} value={yr}>{yr} - {yr + 1}</option>;
                    })}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Search item..."
                  value={godownSearch}
                  onChange={(e) => {
                    setGodownSearch(e.target.value);
                    setGodownCurrentPage(1);
                  }}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    fontSize: 12,
                    width: 200,
                    outline: "none",
                  }}
                />
              </div>

              <button
                className="btn bs"
                onClick={() => fetchGodownStock()}
                disabled={godownStockLoading}
                style={{
                  background: "white",
                  border: "1px solid #E2E8F0",
                  color: "#64748B",
                  padding: "7px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: godownStockLoading ? "not-allowed" : "pointer",
                }}
                title="Refresh Godown Stock"
              >
                {godownStockLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            {godownStockLoading ? (
              <div style={{ textAlign: "center", padding: 28, color: "#94A3B8", fontSize: 13, background: "white", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                Loading godown stock records...
              </div>
            ) : liveGodownStock.length === 0 ? (
              <div style={{ textAlign: "center", padding: 28, color: "#94A3B8", fontSize: 13, background: "white", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                No godown stock records found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {liveGodownStock.map(g => {
                  const hasStock = g.stock > 0;
                  return (
                    <div key={g._id} className="card" style={{ borderColor: hasStock ? '#A7F3D0' : '#FECACA', margin: 0 }}>
                      <div style={{ background: hasStock ? '#ECFDF5' : '#FEF2F2', padding: '9px 14px', borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#0D9488', fontSize: 12 }}>{g.item_code}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#0C1A2E' }}>{g.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                          <Tag2 l={g.item_type || 'material'} c={g.item_type === 'sheet' ? '#7E22CE' : '#0369A1'} bg={g.item_type === 'sheet' ? '#F3E8FF' : '#E0F2FE'} />
                        </div>
                      </div>
                      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12, fontWeight: 700 }}>
                        {[{ l: 'On-Hand Stock', v: g.stock }, { l: 'Unit Cost', v: 'Rs ' + (g.cost || 0) }, { l: 'Location', v: g.shopfloor_name || 'Virtual Godown' }].map(s => <div key={s.l}><div style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>{s.l}</div><div style={{ color: hasStock ? '#0C1A2E' : '#EF4444' }}>{s.v}</div></div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <Pagination
                currentPage={godownCurrentPage}
                totalPages={Math.ceil(godownTotalCount / godownItemsPerPage)}
                onPageChange={setGodownCurrentPage}
                itemsPerPage={godownItemsPerPage}
                onItemsPerPageChange={(val) => {
                  setGodownItemsPerPage(val);
                  setGodownCurrentPage(1);
                }}
                totalCount={godownTotalCount}
                startIndex={(godownCurrentPage - 1) * godownItemsPerPage}
                visibleItemCount={liveGodownStock.length}
                customOptions={[8, 16, 24, 32]}
              />
            </div>
          </>
        </div>
      )}
      {sub === 'bom' && (
        <div>
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>BOM Analysis</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={bomFilterType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setBomFilterType(type);

                    const d = new Date();
                    if (type === 'today') {
                      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
                      const dd = d.getDate().toString().padStart(2, '0');
                      setBomFilterValue(`${d.getFullYear()}-${mm}-${dd}`);
                    } else if (type === 'fy') {
                      setBomFilterValue((d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString());
                    } else if (type === 'month') {
                      const m = (d.getMonth() + 1).toString().padStart(2, '0');
                      setBomFilterValue(`${d.getFullYear()}-${m}`);
                    } else if (type === 'week') {
                      const date = new Date(d.getTime());
                      date.setDate(date.getDate() + 4 - (date.getDay() || 7));
                      const yearStart = new Date(date.getFullYear(), 0, 1);
                      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
                      setBomFilterValue(`${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`);
                    } else {
                      setBomFilterValue("");
                    }
                    setBomCurrentPage(1);
                  }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, color: "#475569", outline: "none", cursor: "pointer", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                >
                  <option value="today">Today</option>
                  <option value="week">Week-wise</option>
                  <option value="month">Month-wise</option>
                  <option value="fy">Financial Year</option>
                </select>

                {bomFilterType === "today" && (
                  <input
                    type="date"
                    value={bomFilterValue}
                    readOnly
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", background: "#F8FAFC", color: "#94A3B8" }}
                  />
                )}
                {bomFilterType === "week" && (
                  <input
                    type="week"
                    value={bomFilterValue}
                    onChange={(e) => {
                      setBomFilterValue(e.target.value);
                      setBomCurrentPage(1);
                    }}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", color: "#475569", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  />
                )}
                {bomFilterType === "month" && (
                  <input
                    type="month"
                    value={bomFilterValue}
                    onChange={(e) => {
                      setBomFilterValue(e.target.value);
                      setBomCurrentPage(1);
                    }}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", color: "#475569", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  />
                )}
                {bomFilterType === "fy" && (
                  <select
                    value={bomFilterValue}
                    onChange={(e) => {
                      setBomFilterValue(e.target.value);
                      setBomCurrentPage(1);
                    }}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, color: "#475569", outline: "none", cursor: "pointer", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  >
                    <option value="" disabled>Select Year</option>
                    {[...Array(5)].map((_, i) => {
                      const yr = new Date().getFullYear() - i;
                      return <option key={yr} value={yr}>{yr} - {yr + 1}</option>;
                    })}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Search Job / Client..."
                  value={bomSearch}
                  onChange={(e) => {
                    setBomSearch(e.target.value);
                    setBomCurrentPage(1);
                  }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", color: "#475569", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginLeft: 6, width: 200 }}
                />
              </div>
            </div>
            <div className="g4mb">
              <Met v={bomMetrics.totalJobs} l="Jobs Analysed" c="#0D9488" bg="#F0FDFA" bd="#99F6E4" />
              <Met v={bomMetrics.overBom} l="Over BOM" c="#EF4444" bg="#FEF2F2" bd="#FECACA" />
              <Met v={bomMetrics.underBom} l="Under BOM" c="#059669" bg="#ECFDF5" bd="#A7F3D0" />
              <Met v={bomMetrics.exactBom} l="Exact BOM" c="#6366F1" bg="#EEF2FF" bd="#C7D2FE" />
            </div>
            <div className="card"><div className="cb" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead><tr>{['Job', 'Client', 'Product', 'Qty', 'Material', 'BOM', 'Actual', 'Variance', 'Var %', 'Status', 'Reason'].map(h => <Th key={h} ch={h} />)}</tr></thead>
                <tbody>{liveBomData.map((group, i) => {
                  const isExp = bomExpJob === group.id;
                  return (
                    <React.Fragment key={group.id}>
                      {/* Parent Row (Job Header) */}
                      <tr onClick={() => setBomExpJob(isExp ? null : group.id)} style={{ cursor: 'pointer', background: isExp ? '#F1F5F9' : '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', transition: 'all 0.2s' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, background: '#0D9488', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                              {(group.client || "C").slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#0C1A2E' }}>
                              {group.id}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#475569', verticalAlign: 'middle' }}>
                          {group.client}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#64748B', verticalAlign: 'middle' }}>
                          {group.product}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F766E', verticalAlign: 'middle' }}>
                          {group.qty}
                        </td>
                        <td colSpan={7} style={{ padding: '10px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <span style={{ background: '#E2E8F0', color: '#475569', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                            {(group.materials || []).length} Material{(group.materials || []).length !== 1 ? 's' : ''} {isExp ? '▲' : '▼'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Material Rows */}
                      {isExp && (group.materials || []).map((b, j) => {
                        const SC2 = { over: { c: '#EF4444', bg: '#FEF2F2' }, under: { c: '#059669', bg: '#ECFDF5' }, exact: { c: '#6366F1', bg: '#EEF2FF' }, '-': { c: '#64748B', bg: '#F1F5F9' } };
                        const s = SC2[b.st] || SC2['exact'];
                        return (
                          <tr key={`${group.id}-mat-${j}`} style={{ borderBottom: '1px solid #F1F5F9', background: b.st === 'over' ? '#FFF8F8' : b.st === 'under' ? '#F8FFF8' : 'white' }}>
                            <td colSpan={4} style={{ background: '#F8FAFC', borderRight: '2px solid #E2E8F0', padding: 0 }}></td>
                            <Td v={b.mat} c="#475569" bold />
                            <Td v={b.bom} mono />
                            <Td v={b.act} mono bold />
                            <Td v={(Number(b.diff) > 0 ? '+' : '') + b.diff} mono bold c={Number(b.diff) > 0 ? '#EF4444' : Number(b.diff) < 0 ? '#059669' : '#6366F1'} />
                            <Td v={(Number(b.pct) > 0 ? '+' : '') + b.pct + '%'} mono bold c={Number(b.pct) > 0 ? '#EF4444' : Number(b.pct) < 0 ? '#059669' : '#6366F1'} />
                            <td style={{ padding: '8px 10px' }}><Tag2 l={b.st === 'over' ? 'Over BOM' : b.st === 'under' ? 'Under BOM' : b.st === '-' ? 'Pending' : 'Exact'} c={s.c} bg={s.bg} /></td>
                            <td style={{ padding: '8px 10px', color: '#64748B', fontSize: 11.5, maxWidth: 220, whiteSpace: 'normal' }}>
                              {b.reason}
                              {b.emrBreakdowns && b.emrBreakdowns.length > 0 && (
                                <div style={{ marginTop: 4 }}>
                                  <span
                                    onClick={() => setEmrModalData({ mat: b.mat, subJobNo: group.id, breakdowns: b.emrBreakdowns })}
                                    style={{ color: '#0284C7', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                                  >
                                    View Breakdown
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                    <td colSpan={5} style={{ padding: '8px 10px', fontWeight: 900, fontSize: 12 }}>TOTALS</td>
                    <Td v={parseFloat(liveBomData.reduce((s, g) => s + (g.materials || []).reduce((ms, m) => ms + Number(m.bom), 0), 0).toFixed(2))} mono bold />
                    <Td v={parseFloat(liveBomData.reduce((s, g) => s + (g.materials || []).reduce((ms, m) => ms + Number(m.act), 0), 0).toFixed(2))} mono bold />
                    <Td v={(liveBomData.reduce((s, g) => s + (g.materials || []).reduce((ms, m) => ms + Number(m.diff), 0), 0) > 0 ? '+' : '') + parseFloat(liveBomData.reduce((s, g) => s + (g.materials || []).reduce((ms, m) => ms + Number(m.diff), 0), 0).toFixed(2))} mono bold c="#EF4444" />
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table></div></div>
            <div style={{ marginTop: 20 }}>
              <Pagination
                currentPage={bomCurrentPage}
                totalPages={Math.ceil(bomTotalCount / bomItemsPerPage)}
                onPageChange={setBomCurrentPage}
                itemsPerPage={bomItemsPerPage}
                onItemsPerPageChange={(val) => {
                  setBomItemsPerPage(val);
                  setBomCurrentPage(1);
                }}
                totalCount={bomTotalCount}
                startIndex={(bomCurrentPage - 1) * bomItemsPerPage}
                visibleItemCount={liveBomData.length}
                customOptions={[8, 16, 24, 32]}
              />
            </div>
          </>
        </div>
      )}

      {/* EMR Breakdown Modal */}
      {emrModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEmrModalData(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 600, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>EMR Breakdown - {emrModalData.subJobNo} ({emrModalData.mat})</h3>
              <button onClick={() => setEmrModalData(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}>&times;</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #E2E8F0', borderRadius: 8 }} className="scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '10px', color: '#475569', fontSize: 13, width: '20%' }}>Date</th>
                    <th style={{ padding: '10px', color: '#475569', fontSize: 13, width: '20%' }}>Quantity</th>
                    <th style={{ padding: '10px', color: '#475569', fontSize: 13 }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {emrModalData.breakdowns.map((bk, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', fontSize: 13 }}>
                      <td style={{ padding: '10px', color: '#64748B', whiteSpace: 'nowrap' }}>{bk.date}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#0F766E' }}>{bk.qty}</td>
                      <td style={{ padding: '10px', color: '#334155' }}>{bk.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 24, textAlign: 'right', flexShrink: 0 }}>
              <button onClick={() => setEmrModalData(null)} style={{ background: '#0F172A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

