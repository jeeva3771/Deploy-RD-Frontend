import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { getUser } from "../../../../utils/permission/auth";
import { gNow, downloadFileDirectly, downloadInvoicePDFDirect, downloadAllInvoices, downloadChallanPDFDirect, downloadAllChallans } from "../utils/accountsFormatters";
import { axiosInstance } from "../../../../utils/url/config";
import { Met, Tag2 } from "../common/UIHelpers";
import InvoiceModal from "../modals/InvoiceModal";
import ChallanModal from "../modals/ChallanModal";
import EWayModal from "../modals/EWayModal";
import CreateInvoiceModal from "../modals/CreateInvoiceModal";
import CreateChallanModal from "../modals/CreateChallanModal";
import UploadEWayModal from "../modals/UploadEWayModal";

export default function BillingQ({ onPendingCountUpdate, onRefresh }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'complete'
  const [filterType, setFilterType] = useState("fy");
  const [filterValue, setFilterValue] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [challanModalData, setChallanModalData] = useState(null);
  const [ewayModalData, setEwayModalData] = useState(null);
  const [createInvoiceJob, setCreateInvoiceJob] = useState(null);
  const [createChallanJob, setCreateChallanJob] = useState(null);
  const [uploadEwayJob, setUploadEwayJob] = useState(null);
  const pageSize = 8;

  // Self-managed server-side data state
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summaryStats, setSummaryStats] = useState({ totalSubjobs: 0, pendingBillingCount: 0, completedCount: 0 });
  const [isFetching, setIsFetching] = useState(false);
  // Debounce ref for search
  const searchTimer = useRef(null);

  const currentUser = getUser();
  const loginUserName = currentUser?.name || currentUser?.username || 'Accounts';

  // ── Server-side fetch ──────────────────────────────────────────
  const fetchPage = useCallback(async (pageNum, searchVal, statusVal, fType, fVal) => {
    setIsFetching(true);
    try {
      // Map statusFilter to backend status param
      let backendStatus = "all";
      if (statusVal === "pending") backendStatus = "all"; // we filter client-side by bilDocs for pending
      // Note: backend status filter is payment status; billing-doc status is computed client-side per row.
      // We send all rows and let the billing-doc filter happen after receiving this page.
      // For large datasets, send the billing_status hint so backend can eventually support it too.
      const params = new URLSearchParams({
        page: pageNum,
        limit: pageSize,
        sortBy: "newest",
      });
      if (searchVal && searchVal.trim()) params.set("search", searchVal.trim());
      if (fType && fType !== "all") {
        params.set("filterType", fType);
        if (fVal) params.set("filterValue", fVal);
      }

      const res = await axiosInstance.get(`/accounts/sales-orders?${params.toString()}`);
      if (res.data?.success) {
        const rawData = res.data.data || [];
        const pagination = res.data.pagination || {};
        const summary = res.data.summary || {};

        // Map API items into BillingQ job shape
        const mapped = rawData.map((item) => {
          const subJobNo = item.sub_job_no || item.id;
          const bilAt = item.bilAt || item.deliveryDate || "\u2014";
          return {
            id: subJobNo,
            sub_job_no: subJobNo,
            job_no: item.job_no || "",
            client: item.client || "Client",
            product: item.product || "Custom Trophy",
            contact: item.contact || item.client || "Client",
            qty: item.qty || 1,
            unitPrice: Number(item.unitPrice || 0),
            gstRate: Number(item.gstRate || 0),
            amount: item.amount || 0,
            totalWithGst: item.totalWithGst || item.grandTotal || 0,
            stage: item.stage || item.job_stage?.key || "dtp",
            job_stage: item.job_stage || null,
            inv: item.bilDocs?.invoice?.n || "",
            bilAt,
            bilDocs: item.bilDocs || { invoice: null, challan: null, eway: null },
            invoices: Array.isArray(item.invoices) ? item.invoices : [],
            challans: Array.isArray(item.challans) ? item.challans : [],
            ewayBills: Array.isArray(item.ewayBills) ? item.ewayBills : [],
          };
        });

        setJobs(mapped);
        setTotalCount(pagination.total || rawData.length);
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || rawData.length) / pageSize) || 1);
        setSummaryStats({
          totalSubjobs: summary.totalSubjobs || 0,
          pendingBillingCount: summary.pendingBillingCount || 0,
          completedCount: summary.totalSubjobs
            ? (summary.totalSubjobs - (summary.pendingBillingCount || 0))
            : 0,
        });
        if (onPendingCountUpdate) onPendingCountUpdate(summary.pendingBillingCount || 0);
      }
    } catch (err) {
      console.warn("BillingQTab data fetch error:", err);
    } finally {
      setIsFetching(false);
    }
  }, [onPendingCountUpdate, pageSize]);

  // Single effect: fires once on mount, then again when page or statusFilter changes.
  // Search changes are handled via debounced handleSearchChange below.
  useEffect(() => {
    fetchPage(page, search, statusFilter, filterType, filterValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, filterType, filterValue, fetchPage]);

  // Debounced search re-fetch
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (page !== 1) {
        setPage(1); // page effect will trigger fetchPage
      } else {
        fetchPage(1, val, statusFilter, filterType, filterValue); // already page 1, fetch directly
      }
    }, 350);
  };

  // Optimistic local update (after creating invoice/challan/eway)
  const updJob = (id, p) => setJobs(prev => prev.map(j => (j.id === id || j.sub_job_no === id) ? { ...j, ...p } : j));

  // Refresh: refetch current page then notify parent
  const handleRefresh = useCallback(() => {
    fetchPage(page, search, statusFilter, filterType, filterValue);
    if (onRefresh) onRefresh();
  }, [fetchPage, page, search, statusFilter, filterType, filterValue, onRefresh]);

  const handleFilterSelect = (type) => {
    setFilterType(type);
    setPage(1);
    const todayStr = new Date().toISOString().split("T")[0];
    if (type === "today") setFilterValue(todayStr);
    else if (type === "week") setFilterValue(`${new Date().getFullYear()}-W${String(Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604800000)).padStart(2, "0")}`);
    else if (type === "month") setFilterValue(todayStr.slice(0, 7));
    else if (type === "fy") setFilterValue(new Date().getFullYear().toString());
    else setFilterValue("");
  };

  const DM = {
    invoice: { l: 'Tax Invoice', i: '🧾', d: 'GST invoice — mandatory for B2B' },
    challan: { l: 'Delivery Challan', i: '📄', d: 'Proof of dispatch' },
    eway: { l: 'E-Way Bill', i: '🚛', d: '' }
  };

  function simUp(jid, k) {
    const job = jobs.find(j => (j.sub_job_no || j.id) === jid || j.id === jid);
    if (!job) return;
    const nm = {
      invoice: `${jid}_Invoice.pdf`,
      challan: `${jid}_Challan.pdf`,
      eway: `${jid}_EwayBill.pdf`
    };
    const updatedDocs = {
      ...(job.bilDocs || {}),
      [k]: {
        n: nm[k],
        by: loginUserName,
        dt: gNow()
      }
    };
    const updatedInvoices = k === 'invoice'
      ? [
        ...(job.invoices || []),
        {
          id: `inv_${Date.now()}`,
          invoiceNo: `${jid}_INV`,
          sub_job_no: jid,
          job_no: job.job_no || jid,
          client: job.client,
          product: job.product,
          qty: job.qty || 1,
          totalAmt: job.totalWithGst || job.amount || 0,
          by: loginUserName,
          dt: gNow(),
          date: new Date().toLocaleDateString("en-IN"),
          n: nm[k],
          url: "",
        }
      ]
      : (job.invoices || []);

    updJob(jid, { bilDocs: updatedDocs, invoices: updatedInvoices });
    toast.success(`${DM[k].l} created and attached for ${jid}!`);
  }

  // Helper to determine invoice completion status for a sub-job
  const getJobInvoiceStatus = (job) => {
    const totalQty = Number(job.qty || 1);
    const invoicedQty = (job.invoices || []).reduce((s, inv) => s + (Number(inv.qty) || 0), 0);
    const hasInvoiceDoc = Boolean(job.bilDocs?.invoice);
    const remainingQty = Math.max(0, totalQty - invoicedQty);
    const isPartial = hasInvoiceDoc && remainingQty > 0;
    const isDone = hasInvoiceDoc && (job.invoices && job.invoices.length > 0 ? remainingQty === 0 : true);
    const isNeeded = !hasInvoiceDoc && invoicedQty === 0;
    return { totalQty, invoicedQty, remainingQty, isPartial, isDone, isNeeded };
  };

  // Helper to determine delivery challan completion status for a sub-job
  const getJobChallanStatus = (job) => {
    const totalQty = Number(job.qty || 1);
    const challanedQty = (job.challans || []).reduce((s, ch) => s + (Number(ch.qty) || 0), 0);
    const hasChallanDoc = Boolean(job.bilDocs?.challan);
    const remainingQty = Math.max(0, totalQty - challanedQty);
    const isPartial = hasChallanDoc && remainingQty > 0 && challanedQty > 0;
    const isDone = hasChallanDoc && (job.challans && job.challans.length > 0 ? remainingQty === 0 : true);
    const isNeeded = !hasChallanDoc && challanedQty === 0;
    return { totalQty, challanedQty, remainingQty, isPartial, isDone, isNeeded };
  };

  const isJobFullyComplete = (job) => {
    const docs = job.bilDocs || {};
    const { isDone: isInvoiceDone } = getJobInvoiceStatus(job);
    const { isDone: isChallanDone } = getJobChallanStatus(job);
    const hasEway = Boolean(docs.eway) || (Array.isArray(job.ewayBills) && job.ewayBills.length > 0);
    return isInvoiceDone && isChallanDone && hasEway;
  };

  // Calculate stats across current page jobs
  const rdy3 = jobs.filter(isJobFullyComplete).length;
  const pend = jobs.filter(j => !isJobFullyComplete(j)).length;
  const docsUploaded = jobs.reduce((s, j) => s + Object.values(j.bilDocs || {}).filter(Boolean).length, 0);

  // Filter the current page client-side by statusFilter (billing-doc completion status)
  const filtered = statusFilter === 'all'
    ? jobs
    : statusFilter === 'complete'
      ? jobs.filter(isJobFullyComplete)
      : jobs.filter(j => !isJobFullyComplete(j));

  // For server-side pagination the "paginated" list is just the filtered current page
  const paginated = filtered;

  return (
    <div style={{ position: 'relative', minHeight: 350 }}>
      {isFetching && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          minHeight: 280
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '4px solid #CBD5E1',
            borderTopColor: '#0D9488',
            animation: 'spin 0.75s linear infinite',
            flexShrink: 0,
            marginBottom: 10
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13, color: '#0F766E', fontWeight: 700 }}>Loading billing queue…</span>
        </div>
      )}

      <div className="g4mb">
        <Met v={summaryStats.totalSubjobs} l="All Sub-Jobs" c="#F59E0B" bg="#FFFBEB" bd="#FDE68A" />
        <Met v={summaryStats.pendingBillingCount} l="Docs Pending" c="#EF4444" bg="#FEF2F2" bd="#FECACA" />
        <Met v={summaryStats.completedCount} l="All Complete" c="#059669" bg="#ECFDF5" bd="#6EE7B7" />
        <Met v={docsUploaded} l="Docs Uploaded (Page)" c="#6366F1" bg="#EEF2FF" bd="#C7D2FE" />
      </div>

      {/* Filter and Search controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Sub-Jobs (${summaryStats.totalSubjobs})` },
            { id: 'pending', label: `Pending Docs (${summaryStats.pendingBillingCount})` },
            { id: 'complete', label: `Completed (${summaryStats.completedCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setStatusFilter(f.id); setPage(1); }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                border: statusFilter === f.id ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                background: statusFilter === f.id ? '#0D9488' : '#FFF',
                color: statusFilter === f.id ? '#FFF' : '#475569',
                transition: 'all 0.15s'
              }}
            >
              {f.label}
            </button>
          ))}

          <select
            onChange={(e) => handleFilterSelect(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", cursor: "pointer", background: "white", color: "#475569", marginLeft: 8 }}
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

        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search Sub-Job, Client, Product..."
            value={search}
            onChange={(e) => { handleSearchChange(e.target.value); }}
            style={{
              width: '100%',
              padding: '7px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {search && (
            <button
              onClick={() => { handleSearchChange(''); setPage(1); }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: 12,
                padding: 0
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!isFetching && filtered.length === 0 && (
        <div className="empty" style={{ padding: 40, textAlign: 'center', background: '#FFF', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
            {totalCount === 0 ? "No sub-jobs found" : "No sub-jobs match the current filter"}
          </div>
        </div>
      )}

      {paginated.map(job => {
        const docs = job.bilDocs || { invoice: null, challan: null, eway: null };
        const subJobIdentifier = job.sub_job_no || job.id;
        const invStatus = getJobInvoiceStatus(job);
        const chStatus = getJobChallanStatus(job);
        const { totalQty, invoicedQty, remainingQty: remainingInvQty, isPartial: isInvoicePartial, isDone: isInvoiceDone } = invStatus;
        const { challanedQty, remainingQty: remainingChallanQty, isPartial: isChallanPartial, isDone: isChallanDone } = chStatus;

        const completedDocsCount = (isInvoiceDone ? 1 : 0) + (isChallanDone ? 1 : 0) + (docs.eway ? 1 : 0);
        const anyDocStarted = Object.values(docs).filter(Boolean).length > 0;
        const isAllDone = isJobFullyComplete(job);

        return (
          <div
            key={subJobIdentifier}
            className="card"
            style={{
              borderColor: isAllDone ? '#A7F3D0' : (anyDocStarted || isInvoicePartial || isChallanPartial) ? '#FDE68A' : '#FECACA',
              marginBottom: 12
            }}
          >
            <div
              style={{
                background: isAllDone ? '#ECFDF5' : (anyDocStarted || isInvoicePartial || isChallanPartial) ? '#FFFBEB' : '#FEF2F2',
                padding: '9px 14px',
                borderBottom: '1px solid #F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 900, fontStyle: 'italic', fontFamily: 'monospace' }}>{subJobIdentifier}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0D9488' }}>{job.client}</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{job.product}</span>
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginLeft: 'auto' }}>
                {['invoice', 'challan', 'eway'].map(k => (
                  <span
                    key={k}
                    style={{
                      fontSize: 14,
                      opacity: k === 'invoice'
                        ? (isInvoiceDone ? 1 : isInvoicePartial ? 0.8 : 0.2)
                        : k === 'challan'
                          ? (isChallanDone ? 1 : isChallanPartial ? 0.8 : 0.2)
                          : (docs[k] ? 1 : 0.2)
                    }}
                  >
                    {DM[k].i}
                  </span>
                ))}
                <Tag2
                  l={isAllDone ? '3/3 Complete' : (isInvoicePartial || isChallanPartial) ? `${completedDocsCount}/3 (Partial)` : `${completedDocsCount}/3`}
                  c={isAllDone ? '#059669' : (completedDocsCount > 0 || isInvoicePartial || isChallanPartial) ? '#F59E0B' : '#EF4444'}
                />
              </div>
            </div>
            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {Object.entries(DM).map(([k, m]) => {
                const doc = docs[k];
                const isInvoice = k === 'invoice';
                const isChallan = k === 'challan';
                const isPartial = isInvoice ? isInvoicePartial : isChallan ? isChallanPartial : false;
                const isDone = isInvoice ? isInvoiceDone : isChallan ? isChallanDone : Boolean(doc);
                const remainingQty = isInvoice ? remainingInvQty : isChallan ? remainingChallanQty : 0;

                // Distinct styling for Partial vs Done vs Needed
                let boxBg = '#FAFBFC';
                let boxBorder = '1.5px solid #E2E8F0';
                let tagLabel = 'Needed';
                let tagColor = '#EF4444';

                if (isPartial) {
                  boxBg = '#FFFBEB'; // Warm amber background (NOT green)
                  boxBorder = '1.5px solid #FCD34D'; // Amber border
                  tagLabel = `Partial (${remainingQty} left)`;
                  tagColor = '#D97706'; // Amber badge
                } else if (isDone) {
                  boxBg = '#F0FDF4'; // Soft green background
                  boxBorder = '1.5px solid #A7F3D0'; // Green border
                  tagLabel = 'Done';
                  tagColor = '#059669'; // Green badge
                }

                return (
                  <div
                    key={k}
                    style={{
                      background: boxBg,
                      border: boxBorder,
                      borderRadius: 10,
                      padding: '10px 12px',
                      transition: 'all 0.2s ease',
                      boxShadow: isPartial ? '0 2px 8px rgba(217,119,6,0.08)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{m.i}</span>
                      <Tag2 l={tagLabel} c={tagColor} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0C1A2E', marginBottom: 2 }}>{m.l}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 7 }}>{m.d}</div>
                    {doc ? (
                      <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 6, wordBreak: 'break-all' }}>
                        {!isInvoice && !isChallan && (
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{doc.n}</span>
                        )}
                        {isInvoice && (
                          <div>
                            {isInvoicePartial ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '3px 8px', borderRadius: 6, border: '1px solid #FDE68A' }}>
                                ⚠️ Invoiced: {invoicedQty} / {totalQty} · {remainingInvQty} remaining
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '3px 8px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                                ✓ All {totalQty} Units Invoiced
                              </span>
                            )}
                          </div>
                        )}
                        {isChallan && (
                          <div>
                            {isChallanPartial ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '3px 8px', borderRadius: 6, border: '1px solid #FDE68A' }}>
                                ⚠️ Challaned: {challanedQty} / {totalQty} · {remainingChallanQty} remaining
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '3px 8px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                                ✓ All {totalQty} Units Challaned
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#EF4444', marginBottom: 6, fontWeight: 600 }}>Not yet created</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {doc ? (
                        k === 'invoice' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn bs bg"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                onClick={() => setInvoiceModalData({ subJob: job })}
                                title="View all invoice PDFs for this sub-job"
                              >
                                <span>🧾</span>
                                <span>{job.invoices && job.invoices.length > 1 ? `Invoices (${job.invoices.length})` : 'Invoice PDF'}</span>
                              </button>
                              <button
                                className="btn bs"
                                style={{ background: '#F8FAFC', color: '#0D9488', borderColor: '#CBD5E1', padding: '0 8px' }}
                                title="Direct Download Invoice"
                                onClick={() => {
                                  if (job.invoices && job.invoices.length > 0) {
                                    if (job.invoices.length === 1) {
                                      downloadInvoicePDFDirect(job.invoices[0]);
                                    } else {
                                      downloadAllInvoices(job.invoices);
                                    }
                                  } else if (doc) {
                                    downloadInvoicePDFDirect({
                                      sub_job_no: job.sub_job_no || job.id,
                                      job_no: job.job_no,
                                      client: job.client,
                                      product: job.product,
                                      qty: job.qty,
                                      totalAmt: job.totalWithGst || job.amount,
                                      by: doc.by,
                                      dt: doc.dt,
                                      url: doc.url,
                                      downloadUrl: doc.downloadUrl,
                                      n: doc.n
                                    });
                                  }
                                }}
                              >
                                📥
                              </button>
                            </div>
                            {isInvoicePartial && (
                              <button
                                className="btn bs"
                                style={{
                                  background: '#FFF7ED',
                                  color: '#C2410C',
                                  borderColor: '#FDBA74',
                                  fontSize: 11.5,
                                  padding: '5px 10px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  boxShadow: '0 1px 3px rgba(234,88,12,0.15)',
                                  transition: 'all 0.15s',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setCreateInvoiceJob(job)}
                                title={`Invoice remaining ${remainingInvQty} units`}
                              >
                                <span>⚡</span>
                                <span>+ Add Invoice ({remainingInvQty} left)</span>
                              </button>
                            )}
                          </div>
                        ) : k === 'challan' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn bs bg"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                onClick={() => setChallanModalData({ subJob: job })}
                                title="View all delivery challan PDFs for this sub-job"
                              >
                                <span>📄</span>
                                <span>{job.challans && job.challans.length > 1 ? `Challans (${job.challans.length})` : 'Challan PDF'}</span>
                              </button>
                              <button
                                className="btn bs"
                                style={{ background: '#F8FAFC', color: '#0D9488', borderColor: '#CBD5E1', padding: '0 8px' }}
                                title="Download Delivery Challan"
                                onClick={() => {
                                  if (job.challans && job.challans.length > 1) {
                                    downloadAllChallans(job.challans, job);
                                  } else if (job.challans && job.challans.length === 1) {
                                    downloadChallanPDFDirect(job.challans[0], job);
                                  } else if (doc) {
                                    if (doc.downloadUrl || doc.url) {
                                      downloadFileDirectly(doc.downloadUrl || doc.url, doc.n || `${subJobIdentifier}_challan.pdf`);
                                    } else {
                                      downloadChallanPDFDirect({
                                        sub_job_no: job.sub_job_no || job.id,
                                        job_no: job.job_no,
                                        client: job.client,
                                        product: job.product,
                                        qty: job.qty,
                                        challanNo: doc.n?.replace('_Challan.pdf', '') || 'DC',
                                        n: doc.n
                                      }, job);
                                    }
                                  }
                                }}
                              >
                                📥
                              </button>
                            </div>
                            {isChallanPartial && (
                              <button
                                className="btn bs"
                                style={{
                                  background: '#FFF7ED',
                                  color: '#C2410C',
                                  borderColor: '#FDBA74',
                                  fontSize: 11.5,
                                  padding: '5px 10px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  boxShadow: '0 1px 3px rgba(234,88,12,0.15)',
                                  transition: 'all 0.15s',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setCreateChallanJob(job)}
                                title={`Challan remaining ${remainingChallanQty} units`}
                              >
                                <span>⚡</span>
                                <span>+ Add / Upload Challan ({remainingChallanQty} left)</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn bs bg"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                onClick={() => setEwayModalData({ subJob: job })}
                                title="View all E-Way Bill PDFs for this sub-job"
                              >
                                <span>🚛</span>
                                <span>{job.ewayBills && job.ewayBills.length > 1 ? `E-Way Bills (${job.ewayBills.length})` : 'E-Way Bill PDF'}</span>
                              </button>
                              <button
                                className="btn bs"
                                style={{ background: '#F8FAFC', color: '#0D9488', borderColor: '#CBD5E1', padding: '0 8px' }}
                                title="Direct Download E-Way Bill"
                                onClick={() => {
                                  if (job.ewayBills && job.ewayBills.length > 0) {
                                    const latest = job.ewayBills[0];
                                    downloadFileDirectly(latest.downloadUrl || latest.url, latest.fileName || latest.n || `${subJobIdentifier}_EWayBill.pdf`);
                                  } else if (doc?.downloadUrl || doc?.url) {
                                    downloadFileDirectly(doc.downloadUrl || doc.url, doc.n || `${subJobIdentifier}_EWayBill.pdf`);
                                  } else {
                                    toast.info('No downloadable E-Way Bill file found');
                                  }
                                }}
                              >
                                📥
                              </button>
                            </div>
                            <button
                              className="btn bs"
                              style={{
                                background: '#F0FDFA',
                                color: '#0D9488',
                                borderColor: '#99F6E4',
                                fontSize: 11.5,
                                padding: '5px 10px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                cursor: 'pointer'
                              }}
                              onClick={() => setUploadEwayJob(job)}
                              title="Upload additional E-Way Bill files"
                            >
                              <span>➕</span>
                              <span> Add E-Way Bill</span>
                            </button>
                          </div>
                        )
                      ) : (
                        k === 'invoice' ? (
                          <button
                            className="btn bs"
                            style={{ background: '#0D9488', color: '#FFF', border: 'none', fontWeight: 800, padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 2px 6px rgba(13,148,136,0.25)', cursor: 'pointer' }}
                            onClick={() => setCreateInvoiceJob(job)}
                          >
                            <span>🧾</span>
                            <span>Create Invoice</span>
                          </button>
                        ) : k === 'challan' ? (
                          <button
                            className="btn bs"
                            style={{ background: '#0D9488', color: '#FFF', border: 'none', fontWeight: 800, padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 2px 6px rgba(13,148,136,0.25)', cursor: 'pointer' }}
                            onClick={() => setCreateChallanJob(job)}
                          >
                            <span>📄</span>
                            <span>Create / Upload Challan</span>
                          </button>
                        ) : (
                          <button
                            className="btn bs"
                            style={{
                              background: '#0D9488',
                              color: '#FFF',
                              border: 'none',
                              fontWeight: 800,
                              padding: '7px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              boxShadow: '0 2px 6px rgba(13,148,136,0.25)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setUploadEwayJob(job)}
                            title="Upload multi-file E-Way Bill documents"
                          >
                            <span>🚛</span>
                            <span>+ Upload E-Way Bill</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '8px 12px', background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Showing {totalCount === 0 ? 0 : ((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} sub-jobs
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 4,
                border: '1px solid #CBD5E1',
                background: page <= 1 ? '#F1F5F9' : '#FFF',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: page <= 1 ? '#94A3B8' : '#334155'
              }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 700, padding: '0 8px', color: '#0D9488' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 4,
                border: '1px solid #CBD5E1',
                background: page >= totalPages ? '#F1F5F9' : '#FFF',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                color: page >= totalPages ? '#94A3B8' : '#334155'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal for Specific Sub-Job or All Invoices */}
      {invoiceModalData && (
        <InvoiceModal
          data={invoiceModalData}
          allJobs={jobs}
          onClose={() => setInvoiceModalData(null)}
        />
      )}

      {/* Delivery Challan Modal for Specific Sub-Job or All Challans */}
      {challanModalData && (
        <ChallanModal
          data={challanModalData}
          allJobs={jobs}
          onClose={() => setChallanModalData(null)}
        />
      )}

      {/* E-Way Bill Modal for Specific Sub-Job or All E-Ways */}
      {ewayModalData && (
        <EWayModal
          data={ewayModalData}
          allJobs={jobs}
          onClose={() => setEwayModalData(null)}
          onUploadNew={(j) => setUploadEwayJob(j)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Upload E-Way Bill Modal (Multi-files) */}
      {uploadEwayJob && (
        <UploadEWayModal
          job={uploadEwayJob}
          onClose={() => setUploadEwayJob(null)}
          onSuccess={() => {
            handleRefresh();
          }}
        />
      )}

      {/* Create Tax Invoice Modal */}
      {createInvoiceJob && (
        <CreateInvoiceModal
          job={createInvoiceJob}
          onClose={() => setCreateInvoiceJob(null)}
          onSuccess={() => {
            handleRefresh();
          }}
        />
      )}

      {/* Create Delivery Challan Modal */}
      {createChallanJob && (
        <CreateChallanModal
          job={createChallanJob}
          onClose={() => setCreateChallanJob(null)}
          onSuccess={() => {
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
