import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserPermissions } from "../../utils/permission/auth";
import { axiosInstance } from "../../utils/url/config";
import { useLoader } from "../../context/LoaderContext";
import "./accountsConsole.css";

// Utilities & Constants
import { fmt } from "./console/utils/accountsFormatters";

// Dynamic Tab Subcomponents
import Dashboard from "./console/tabs/DashboardTab";
import BillingQ from "./console/tabs/BillingQTab";
import SalesOrd from "./console/tabs/SalesOrdersTab";
import ClientOS from "./console/tabs/ClientOutstandingTab";
import VendorOS from "./console/tabs/VendorOutstandingTab";
import AssetsView from "./console/tabs/AssetsStockTab";
import PLView from "./console/tabs/PLTab";
import GSTView from "./console/tabs/GSTTab";
import AuditView from "./console/tabs/AuditTab";

// Quick Action Modal
import QAModal from "./console/modals/QAModal";
import CreateInvoiceModal from "./console/modals/CreateInvoiceModal";
import CreateChallanModal from "./console/modals/CreateChallanModal";
import UploadEWayModal from "./console/modals/UploadEWayModal";
import ManualPaymentModal from "./console/modals/ManualPaymentModal";
import ManualVendorPaymentModal from "./console/modals/ManualVendorPaymentModal";

export default function AccountsConsole() {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const [loading, setLoading] = useState(true);

  // Layout & tab states
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState("dash");
  const [qa, setQA] = useState(null);
  const [clientData, setClientData] = useState([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientFetched, setClientFetched] = useState(false);
  const [totalRcv, setTotalRcv] = useState(0);
  const [overdueClients, setOverdueClients] = useState(0);
  const [totalPay, setTotalPay] = useState(0);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorFetched, setVendorFetched] = useState(false);
  const [soSummary, setSoSummary] = useState(null);
  const [soLoading, setSoLoading] = useState(false);
  // Billing-tab pending count (received via callback from BillingQTab or summary fetch)
  const [billingPendingCount, setBillingPendingCount] = useState(0);

  // States for robust Modals
  const [createInvoiceJob, setCreateInvoiceJob] = useState(null);
  const [createChallanJob, setCreateChallanJob] = useState(null);
  const [uploadEwayJob, setUploadEwayJob] = useState(null);
  const [manualPaymentTarget, setManualPaymentTarget] = useState(null);
  const [manualVendorPaymentTarget, setManualVendorPaymentTarget] = useState(null);

  // Fetch client quotation outstanding data
  const fetchClients = useCallback(async (silent = false) => {
    const isSilent = silent === true;
    try {
      setClientLoading(true);
      if (!isSilent) showLoader();
      const res = await axiosInstance.get("/accounts/client-outstanding?summary_only=true");
      if (res.data?.success) {
        setTotalRcv(res.data.totalOutstanding || 0);
        setOverdueClients(res.data.overdueClients || 0);
        setClientFetched(true);
      }
    } catch (err) {
      console.warn("Client quotation data fetch error, using default:", err);
    } finally {
      setClientLoading(false);
      if (!isSilent) hideLoader();
    }
  }, [showLoader, hideLoader]);

  // Fetch outsource vendor outstanding data
  const fetchVendors = useCallback(async (silent = false) => {
    const isSilent = silent === true;
    try {
      setVendorLoading(true);
      if (!isSilent) showLoader();
      const res = await axiosInstance.get("/accounts/vendor-outstanding?summary_only=true");
      if (res.data?.success) {
        setTotalPay(res.data.totalOutstanding || 0);
        setVendorFetched(true);
      }
    } catch (err) {
      console.warn("Outsource vendor data fetch error:", err);
    } finally {
      setVendorLoading(false);
      if (!isSilent) hideLoader();
    }
  }, [showLoader, hideLoader]);

  // Tab change — defined after fetchClients/fetchVendors to avoid use-before-define
  const handleTabChange = (newTab) => {
    if (newTab === tab) return;
    setTab(newTab);
    if (newTab === "client" && !clientFetched) {
      fetchClients(false);
    } else if (newTab === "vendor" && !vendorFetched) {
      fetchVendors(false);
    }
  };

  // Lightweight summary fetch — just KPI counts, no data payload (fast initial load)
  const fetchSalesOrdersSummary = useCallback(async () => {
    try {
      setSoLoading(true);
      const res = await axiosInstance.get("/accounts/sales-orders?summary_only=true");
      if (res.data?.success) {
        const summary = res.data.summary || {};
        setSoSummary(summary);
        setBillingPendingCount(summary.pendingBillingCount || 0);
      }
    } catch (err) {
      console.warn("Sales order summary fetch error:", err);
    } finally {
      setSoLoading(false);
    }
  }, []);

  // Initial load: Fetch summary counts and live client / vendor outstanding in background
  useEffect(() => {
    fetchSalesOrdersSummary();
    fetchClients(true);
    fetchVendors(true);
  }, [fetchSalesOrdersSummary, fetchClients, fetchVendors]);

  // Authenticate permission 46 (Job Ledger) or 47 (Accounts Console)
  useEffect(() => {
    setLoading(false);
  }, [navigate]);

  const updJob = (id, p) => setJobs(prev => prev.map(j => (j.id === id || j.sub_job_no === id) ? { ...j, ...p } : j));

  const handleQAProceed = (action, payload) => {
    setQA(null);
    if (action === "Create Invoice") setCreateInvoiceJob(payload.job);
    else if (action === "Create Challan") setCreateChallanJob(payload.job);
    else if (action === "E-Way Bill") setUploadEwayJob(payload.job);
    else if (action === "Record Payment") {
      if (payload.type === "Vendor") setManualVendorPaymentTarget(payload.vendor);
      else setManualPaymentTarget(payload.client);
    }
  };

  // Vendor Payables fetched via summary
  // Pending billing count from summary (fast) or fallback to live jobs scan
  const pendingPings = billingPendingCount > 0
    ? billingPendingCount
    : jobs.filter(j => Object.values(j.bilDocs || {}).filter(Boolean).length < 3).length;

  const TABS = [
    ["dash", "📊 Dashboard", "dash"],
    ["billing_q", "🔔 Billing ", "billing"],
    ["so", "📋 Sales Orders", "so"],
    ["client", "👥 Clients", "clients"],
    ["vendor", "🏭 Vendors", "vendors"],
    ["assets", "📦 Assets & Stock", "assets"],
    ["pl", "💰 P&L", "pl"],
    ["gst", "🧾 GST/TDS", "gst"],
    ["audit", "🔍 Audit", "audit"]
  ];

  const handleQA = (action) => {
    if (action === "New Sales Order") {
      navigate("/enquiries");
    } else {
      setQA(action);
    }
  };

  return (
    <div className="accounts-console-wrapper">
      {/* Scoped Horizontal Header Navigation Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0C1A2E", padding: "8px 14px", border: "1.5px solid #E2E8F0", borderBottom: "1px solid #1E293B", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        {/* Scoped Nav Links (Horizontal) */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {TABS.map(([id, label]) => {
            const active = tab === id;
            const cleanLabel = label.replace(/^[^\w\s()]+/g, "").trim();
            const icon = label.match(/^[^\w\s]+/g)?.[0] || "📁";
            return (
              <button
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  background: active ? "#0D9488" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  color: active ? "white" : "#94A3B8",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => handleTabChange(id)}
              >
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span>{cleanLabel}</span>
                {id === "billing_q" && pendingPings > 0 && (
                  <span style={{ background: "#EF4444", color: "white", fontSize: 10, padding: "1px 5px", borderRadius: 4, marginLeft: 4 }}>{pendingPings}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mini-KPI Summary Widget on the Far Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 6, padding: "5px 10px", textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Receivables</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#F59E0B", fontFamily: "monospace", marginTop: 1 }}>Rs {fmt(totalRcv)}</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 6, padding: "5px 10px", textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payables</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#EF4444", fontFamily: "monospace", marginTop: 1 }}>Rs {fmt(totalPay)}</div>
          </div>
        </div>
      </div>

      {/* Main Layout containing Sub-Content */}
      <div className="app-layout" style={{ border: "1.5px solid #E2E8F0", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: "hidden" }}>
        {/* Dynamic Inner Tab Body */}
        <div className="inner-content">
          {tab === "dash" && <Dashboard jobs={jobs} total={totalRcv} payable={totalPay} pings={pendingPings} onQA={setQA} clientData={clientData} />}
          {tab === "billing_q" && <BillingQ onPendingCountUpdate={setBillingPendingCount} onRefresh={fetchSalesOrdersSummary} />}
          {tab === "so" && <SalesOrd soSummary={soSummary} onRefreshDashboard={fetchSalesOrdersSummary} />}
          {tab === "client" && <ClientOS onRefresh={fetchClients} />}
          {tab === "vendor" && <VendorOS onRefresh={fetchVendors} />}
          {tab === "assets" && <AssetsView />}
          {tab === "pl" && <PLView />}
          {tab === "gst" && <GSTView />}
          {tab === "audit" && <AuditView />}
        </div>
      </div>

      {/* Quick Action Modal Component (Job Selector) */}
      {qa && <QAModal action={qa} onClose={() => setQA(null)} onProceed={handleQAProceed} />}

      {/* Robust Action Modals */}
      {createInvoiceJob && (
        <CreateInvoiceModal
          job={createInvoiceJob}
          onClose={() => setCreateInvoiceJob(null)}
        />
      )}
      {createChallanJob && (
        <CreateChallanModal
          job={createChallanJob}
          onClose={() => setCreateChallanJob(null)}
        />
      )}
      {uploadEwayJob && (
        <UploadEWayModal
          job={uploadEwayJob}
          onClose={() => setUploadEwayJob(null)}
        />
      )}
      {manualPaymentTarget && (
        <ManualPaymentModal
          target={manualPaymentTarget}
          onClose={() => setManualPaymentTarget(null)}
        />
      )}
      {manualVendorPaymentTarget && (
        <ManualVendorPaymentModal
          target={manualVendorPaymentTarget}
          onClose={() => setManualVendorPaymentTarget(null)}
        />
      )}
    </div>
  );
}
