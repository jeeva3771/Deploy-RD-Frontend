import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useLoader } from "../../../../context/LoaderContext";
import { axiosInstance } from "../../../../utils/url/config";
import { getUser } from "../../../../utils/permission/auth";
import { fmt } from "../utils/accountsFormatters";
import { downloadClientLedgerCSV, downloadClientLedgerPDF } from "../utils/accountsExport";
import { Met, Th, Td, Tag2 } from "../common/UIHelpers";
import Pagination from "../../../components/Pagination";
import ManualPaymentModal from "../modals/ManualPaymentModal";
import PaymentOverviewModal from "../modals/PaymentOverviewModal";
import WhatsAppReminderModal from "../modals/WhatsAppReminderModal";

const InvoiceOverviewModal = ({ target, onClose }) => {
  if (!target) return null;
  const invs = target.invoices || [];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 700, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>🧾 Invoice Overview</h3>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
              {target.sub_job_no} • {target.product}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, color: "#94A3B8", cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Invoice No</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Subtotal</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569", fontWeight: 700 }}>GST %</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569", fontWeight: 700 }}>GST Amt</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invs.map((inv, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#0D9488", fontFamily: "monospace" }}>{inv.invoiceNo}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 700 }}>{inv.qty}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontFamily: "monospace", color: "#475569" }}>{Number(inv.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#64748B" }}>{inv.gstPct}%</td>
                  <td style={{ padding: "12px", textAlign: "right", fontFamily: "monospace", color: "#475569" }}>{Number(inv.gstAmt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0F172A" }}>{Number(inv.totalAmt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0" }}>
                <td style={{ padding: "12px", fontWeight: 800, color: "#0F172A" }}>TOTAL</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 800 }}>{invs.reduce((s, i) => s + Number(i.qty || 0), 0)}</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontFamily: "monospace" }}>{invs.reduce((s, i) => s + Number(i.subtotal || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td colSpan={2} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontFamily: "monospace" }}>{invs.reduce((s, i) => s + Number(i.gstAmt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 900, fontFamily: "monospace", color: "#0F172A" }}>{invs.reduce((s, i) => s + Number(i.totalAmt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function ClientOS({ onRefresh }) {
  const { showLoader, hideLoader } = useLoader();
  const [exp, setExp] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState('fy');
  const [filterValue, setFilterValue] = useState(() => {
    const d = new Date();
    return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1).toString();
  });
  const [payTarget, setPayTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmountAll, setTotalAmountAll] = useState(0);
  const [totalPaidAll, setTotalPaidAll] = useState(0);
  const [totalOutstandingAll, setTotalOutstandingAll] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType, filterValue]);

  const fetchPaginatedClients = useCallback(async () => {
    try {
      setLoading(true);
      showLoader();
      const res = await axiosInstance.get("/accounts/client-outstanding", {
        params: { page, limit, search: debouncedSearch, filterType, filterValue }
      });
      if (res.data?.success) {
        setTotalAmountAll(res.data.totalAmount || 0);
        setTotalPaidAll(res.data.totalPaid || 0);
        setTotalOutstandingAll(res.data.totalOutstanding || 0);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);

        const loadedClients = res.data.data || [];
        setClients(
          loadedClients.map((c) => {
            const subjobs = (c.subjobs || []).map((sj) => {
              const amt = Number(sj.amount || 0);
              const paid = Number(sj.paid || 0);
              const due = Number(sj.outstanding !== undefined ? sj.outstanding : (amt - paid));
              let status = sj.status;
              if (!status) {
                if (due === 0 && amt > 0) status = "paid";
                else if (paid > 0 && due > 0) status = "partial_paid";
                else if (amt > 0 && paid === 0) status = "pending";
                else status = paid > 0 ? "advance_paid" : "unbilled";
              }
              return {
                ...sj,
                amount: amt,
                grandTotal: sj.grandTotal || amt,
                quotationTotal: sj.quotationTotal || amt,
                paid: paid,
                outstanding: due,
                due: due,
                status: status,
              };
            });
            const totalAmount = subjobs.reduce((s, j) => s + j.amount, 0);
            const totalPaid = subjobs.reduce((s, j) => s + j.paid, 0);
            const totalOutstanding = subjobs.reduce((s, j) => s + j.outstanding, 0);
            return {
              ...c,
              totalAmount: totalAmount,
              totalPaid: totalPaid,
              totalOutstanding: totalOutstanding,
              subjobs: subjobs,
            };
          })
        );
      }
    } catch (err) {
      console.warn("Client quotation data fetch error:", err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [page, limit, debouncedSearch, filterType, filterValue, showLoader, hideLoader]);

  useEffect(() => {
    fetchPaginatedClients();
  }, [fetchPaginatedClients]);

  // Handle manual payment saving to backend
  const handleSavePayment = async ({ clientId, clientName, subJobNo, amount, tdsAmount, tdsRate, grossAmount, mode, bank_account_id, bank_account_label, date, ref, cashVoucherNo, cashCollectedBy, notes, attachment, attachments }) => {
    setIsSaving(true);
    showLoader();
    try {
      // 1. Post payment record to backend using FormData
      const formData = new FormData();
      formData.append("sub_job_no", subJobNo);
      formData.append("job_no", clientId ? String(clientId).replace(/^job_/, "") : "");
      formData.append("client_name", clientName || "");
      formData.append("amount", amount);
      if (tdsAmount) formData.append("tds_amount", tdsAmount);
      if (tdsRate) formData.append("tds_rate", tdsRate);
      if (grossAmount) formData.append("gross_amount", grossAmount);
      formData.append("payment_mode", mode);
      if (bank_account_id) formData.append("bank_account_id", bank_account_id);
      if (bank_account_label) formData.append("bank_account_label", bank_account_label);
      formData.append("payment_date", date);
      formData.append("reference_no", ref || "");
      if (cashVoucherNo) formData.append("cash_voucher_no", cashVoucherNo);
      if (cashCollectedBy) formData.append("cash_collected_by", cashCollectedBy);
      formData.append("notes", notes || "");
      const currentUser = getUser();
      if (currentUser?.id || currentUser?._id) {
        formData.append("created_by", currentUser.id || currentUser._id);
      }
      if (currentUser?.name || currentUser?.username) {
        formData.append("created_by_name", currentUser.name || currentUser.username);
      }

      const filesList = Array.isArray(attachments) && attachments.length > 0
        ? attachments
        : (attachment instanceof File ? [attachment] : []);

      // Append each unique file only once under 'attachments'
      filesList.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await axiosInstance.post("/accounts/record-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        // 2. Optimistic local update so UI updates immediately
        setClients((prev) =>
          prev.map((c) => {
            if (c.id !== clientId && c.job_no !== clientId) return c;
            const updatedSubjobs = (c.subjobs || []).map((sj) => {
              if (sj.sub_job_no !== subJobNo) return sj;
              const currentPaid = Number(sj.paid || 0);
              const totalAmt = Number(sj.grandTotal || sj.quotationTotal || sj.amount || sj.finalJobPrice || 0);
              const newPaid = Math.min(totalAmt, currentPaid + amount);
              const newDue = Math.max(0, totalAmt - newPaid);
              const newStatus = newDue === 0 ? "paid" : (newPaid > 0 ? "partial_paid" : "pending");
              return {
                ...sj,
                amount: totalAmt,
                grandTotal: sj.grandTotal || totalAmt,
                quotationTotal: sj.quotationTotal || totalAmt,
                paid: newPaid,
                outstanding: newDue,
                due: newDue,
                status: newStatus,
              };
            });
            const newTotalAmount = updatedSubjobs.reduce((s, j) => s + (Number(j.grandTotal || j.quotationTotal || j.amount || j.finalJobPrice) || 0), 0);
            const newTotalPaid = updatedSubjobs.reduce((s, j) => s + (Number(j.paid) || 0), 0);
            const newTotalOutstanding = updatedSubjobs.reduce((s, j) => s + (Number(j.outstanding) || 0), 0);
            return {
              ...c,
              totalAmount: newTotalAmount,
              totalPaid: newTotalPaid,
              totalOutstanding: newTotalOutstanding,
              subjobs: updatedSubjobs,
            };
          })
        );

        // 3. Re-fetch from backend to update global balances
        await fetchPaginatedClients();
        if (typeof onRefresh === "function") {
          await onRefresh();
        }

        toast.success(`Payment of Rs ${amount.toLocaleString("en-IN")} recorded successfully for ${subJobNo}!`);
        setPayTarget(null);
      } else {
        toast.error("Failed to record payment: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving payment to backend:", err);
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      // Auto close modal and refresh live balances on conflict or overpayment
      if (err.response?.status === 400) {
        setPayTarget(null);
        await fetchPaginatedClients();
        if (typeof onRefresh === "function") {
          await onRefresh();
        }
      }
    } finally {
      setIsSaving(false);
      hideLoader();
    }
  };

  const STATUS_TAGS = {
    paid: { l: "Fully Paid", c: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
    partial_paid: { l: "Partial Paid", c: "#8B5CF6", bg: "#F5F3FF", bd: "#DDD6FE" },
    pending: { l: "Pending", c: "#F59E0B", bg: "#FFFBEB", bd: "#FDE68A" },
    quoted: { l: "Quoted", c: "#0D9488", bg: "#F0FDFA", bd: "#99F6E4" },
    active: { l: "Active", c: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
    invoiced: { l: "Invoiced", c: "#F59E0B", bg: "#FFFBEB", bd: "#FDE68A" },
    partial_invoiced: { l: "Partially Invoiced", c: "#EA580C", bg: "#FFF7ED", bd: "#FFEDD5" },
    unbilled: { l: "Unbilled", c: "#64748B", bg: "#F1F5F9", bd: "#CBD5E1" },
    advance_paid: { l: "Advance Paid", c: "#0284C7", bg: "#F0F9FF", bd: "#BAE6FD" },
  };

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
  };

  return (
    <div>
      {/* Top Metric Cards */}
      <div className="g4mb">
        <Met
          v={"Rs " + fmt(totalAmountAll)}
          l="Total Invoice Amount"
          c="#0C1A2E"
          bg="#F8FAFC"
          bd="#E2E8F0"
        />
        <Met
          v={"Rs " + fmt(totalPaidAll)}
          l="Total Paid So Far"
          c="#059669"
          bg="#ECFDF5"
          bd="#A7F3D0"
        />
        <Met
          v={"Rs " + fmt(totalOutstandingAll)}
          l="Total Outstanding Due"
          c="#EF4444"
          bg="#FEF2F2"
          bd="#FECACA"
        />
        <Met
          v={totalCount + " Clients"}
          l="Total Active Clients"
          c="#0D9488"
          bg="#F0FDFA"
          bd="#99F6E4"
        />
      </div>

      {/* Info & Search Banner */}
      <div
        style={{
          background: "#F0FDF4",
          border: "1.5px solid #BBF7D0",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#15803D", display: "flex", alignItems: "center", gap: 6 }}>
            <span>👥 Client Quotation & Outstanding Tracker</span>
            <Tag2 l="Manual Payment Entry Enabled" c="#15803D" bg="#DCFCE7" bd="#86EFAC" />
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
            Manage Amount, Paid, and Outstanding balances for each sub-job. Click <b>💳 Pay</b> on any row to manually record payments right here.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
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
                onChange={(e) => setFilterValue(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", background: "white", color: "#0F172A" }}
              />
            )}
            {filterType === "month" && (
              <input
                type="month"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", background: "white", color: "#0F172A" }}
              />
            )}
            {filterType === "fy" && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", cursor: "pointer", background: "white", color: "#0F172A" }}
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const yr = new Date().getFullYear() - 5 + i;
                  return <option key={yr} value={yr}>{yr} - {yr + 1}</option>;
                })}
              </select>
            )}
          </div>
          <div style={{ minWidth: 260, display: "flex" }}>
            <input
              className="inp"
              placeholder="🔍 Search client, subjob, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: "white", padding: "6px 12px", fontSize: 13, flex: 1, border: "1px solid #CBD5E1", borderRadius: 6 }}
            />
          </div>
        </div>
      </div>



      {!loading && clients.length === 0 && (
        <div
          className="card"
          style={{
            padding: "36px 20px",
            textAlign: "center",
            color: "#64748B",
            background: "#FAFAFA",
            border: "1.5px dashed #CBD5E1",
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>
            No Client Quotation Records Found
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
            There are currently no client quotation or sales order records in the database.
          </div>
        </div>
      )}

      {/* Clients Listing */}
      {clients.map((c) => {
        const isExp = exp === c.id;
        const subjobs = c.subjobs || [];
        const clientAmount = Number(c.totalAmount || 0);
        const clientPaid = Number(c.totalPaid || 0);
        const clientDue = Number(c.totalOutstanding || 0);

        return (
          <div
            key={c.id}
            className="card"
            style={{
              borderColor: clientDue > 0 ? (clientDue > 1000000 ? "#FDE68A" : "#E2E8F0") : "#A7F3D0",
              boxShadow: isExp ? "0 4px 14px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {/* Parent Row (Client Header) */}
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                background: isExp ? "#F8FAFC" : "white",
                borderBottom: isExp ? "1.5px solid #E2E8F0" : "none",
              }}
              onClick={() => setExp(isExp ? null : c.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: clientDue === 0 ? "#059669" : "#0C1A2E",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    flexShrink: 0,
                  }}
                >
                  {clientDue === 0 ? "✓" : (c.client || "C").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#0C1A2E" }}>
                      {c.client}
                    </span>
                    {c.job_no && (
                      <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 900, color: "#0D9488", background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 5, padding: "1px 6px" }}>
                        {c.job_no}
                      </span>
                    )}
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: "#475569",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {subjobs.length} Sub-Job{subjobs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748B", marginTop: 3 }}>
                    {c.contact && <span>{c.contact} · </span>}
                    {c.phone && <span>📞 {c.phone}</span>}
                  </div>
                </div>
              </div>

              {/* 3-Part Financial Summary: Amount, Paid, Outstanding */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(130px, 1fr))",
                  gap: 12,
                  flex: 1,
                  maxWidth: 580,
                  margin: "0 20px",
                }}
              >
                {/* Total Amount */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    padding: "6px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Amount
                  </div>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 800, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2, whiteSpace: "nowrap" }}
                    title={`Rs ${Number(clientAmount || 0).toLocaleString("en-IN")}`}
                  >
                    Rs {Number(clientAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: clientAmount % 1 !== 0 ? 2 : 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Paid */}
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 8,
                    padding: "6px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Paid
                  </div>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 900, color: "#16A34A", fontFamily: "monospace", marginTop: 2, whiteSpace: "nowrap" }}
                    title={`Rs ${Number(clientPaid || 0).toLocaleString("en-IN")}`}
                  >
                    Rs {Number(clientPaid || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: clientPaid % 1 !== 0 ? 2 : 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Outstanding */}
                <div
                  style={{
                    background: clientDue > 0 ? "#FEF2F2" : "#F0FDF4",
                    border: `1px solid ${clientDue > 0 ? "#FECACA" : "#BBF7D0"}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: clientDue > 0 ? "#DC2626" : "#166534",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {clientDue > 0 ? "Outstanding" : "Cleared"}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: clientDue > 0 ? "#DC2626" : "#16A34A",
                      fontFamily: "monospace",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                    }}
                    title={`Rs ${Number(clientDue || 0).toLocaleString("en-IN")}`}
                  >
                    Rs {Number(clientDue || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: clientDue % 1 !== 0 ? 2 : 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {clientDue > 0 && (
                  <>
                    <button
                      className="btn bs"
                      style={{
                        fontSize: 11,
                        padding: "6px 12px",
                        background: "#F0FDF4",
                        borderColor: "#86EFAC",
                        color: "#15803D",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReminderTarget({
                          clientId: c.id,
                          job_no: c.job_no,
                          clientName: c.client,
                          contact: c.contact,
                          phone: c.phone,
                          amount: clientAmount,
                          paid: clientPaid,
                          outstanding: clientDue,
                          wp_numbers: c.wp_numbers || [],
                        });
                      }}
                      title="Send WhatsApp payment reminder to all sales order numbers"
                    >
                      📲 Send Reminder
                    </button>

                    <button
                      className="btn bs bg"
                      style={{ fontSize: 11, padding: "6px 12px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const firstPending = subjobs.find((s) => Number(s.outstanding) > 0) || subjobs[0];
                        setPayTarget({
                          clientId: c.id,
                          clientName: c.client,
                          sub_job_no: firstPending?.sub_job_no || c.job_no,
                          product: firstPending?.product || "Multiple Sub-Jobs",
                          amount: Number(firstPending?.amount || clientDue),
                          paid: Number(firstPending?.paid || 0),
                          outstanding: Number(firstPending?.outstanding || clientDue),
                        });
                      }}
                    >
                      💳 Pay
                    </button>
                  </>
                )}

                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: isExp ? "#0D9488" : "#F1F5F9",
                    color: isExp ? "white" : "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 900,
                    marginLeft: 4,
                  }}
                >
                  {isExp ? "▲" : "▼"}
                </div>
              </div>
            </div>

            {/* Under Display: Sub-Job Details Table */}
            {isExp && (
              <div style={{ padding: "14px 16px", background: "#FAFBFC" }}>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 900,
                    color: "#0C1A2E",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>📋 Specific Sub-Job Quotations & Payment Balances ({subjobs.length})</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "none" }}>
                    Manual payment updates reflect instantly
                  </span>
                </div>

                <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden", background: "white" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <Th ch="Sub-Job No" />
                        <Th ch="Product " />
                        <Th ch="Qty" />
                        <Th ch="Amount (Rs)" />
                        <Th ch="Paid (Rs)" />
                        <Th ch="Outstanding (Rs)" />
                        <Th ch="Status" />
                        <Th ch="Action" />
                      </tr>
                    </thead>
                    <tbody>
                      {subjobs.map((sj, idx) => {
                        const amt = Number(sj.amount || 0);
                        const paid = Number(sj.paid || 0);
                        const due = Number(sj.outstanding !== undefined ? sj.outstanding : (amt - paid));
                        const tag = STATUS_TAGS[sj.status] || (due === 0 ? STATUS_TAGS.paid : (paid > 0 ? STATUS_TAGS.partial_paid : STATUS_TAGS.pending));

                        return (
                          <tr key={idx} className="bbf" style={{ transition: "background 0.15s" }}>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: "#0D9488" }}>
                              {sj.sub_job_no}
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <div style={{ fontWeight: 800, color: "#0C1A2E" }}>{sj.product}</div>
                            </td>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", textAlign: "center" }}>
                              <div style={{ fontWeight: 900, color: "#0F172A", fontSize: 13 }}>{sj.qty}</div>
                              {sj.invoicedQty > 0 && sj.invoicedQty < sj.qty && (
                                <div style={{ fontSize: 10, color: "#EAB308", fontWeight: 800, marginTop: 2 }}>Inv: {sj.invoicedQty}</div>
                              )}
                              {sj.invoicedQty >= sj.qty && (
                                <div style={{ fontSize: 10, color: "#10B981", fontWeight: 800, marginTop: 2 }}>Inv: {sj.invoicedQty}</div>
                              )}
                            </td>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 800, color: "#0C1A2E", fontSize: 12 }}>
                              Rs {amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: "#059669", fontSize: 12 }}>
                              Rs {paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: due > 0 ? "#EF4444" : "#059669", fontSize: 12.5 }}>
                              Rs {due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <Tag2 l={tag.l} c={tag.c} bg={tag.bg} bd={tag.bd} />
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {sj.invoices && sj.invoices.length > 0 && (
                                  <button
                                    className="btn bs"
                                    style={{
                                      fontSize: 11,
                                      padding: "4px 8px",
                                      background: "#F8FAFC",
                                      borderColor: "#CBD5E1",
                                      color: "#334155",
                                      fontWeight: 800,
                                      whiteSpace: "nowrap",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                    onClick={() => setInvoiceTarget({
                                      sub_job_no: sj.sub_job_no,
                                      product: sj.product,
                                      invoices: sj.invoices
                                    })}
                                    title="View multiple invoices for this sub-job"
                                  >
                                    🧾 Invoices
                                  </button>
                                )}
                                {paid > 0 && (
                                  <button
                                    className="btn bs"
                                    style={{
                                      fontSize: 11,
                                      padding: "4px 8px",
                                      background: "#F0FDFA",
                                      borderColor: "#99F6E4",
                                      color: "#0D9488",
                                      fontWeight: 800,
                                      whiteSpace: "nowrap",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                    onClick={() =>
                                      setPreviewTarget({
                                        clientId: c.id,
                                        clientName: c.client,
                                        sub_job_no: sj.sub_job_no,
                                        product: sj.product,
                                        amount: amt,
                                        paid: paid,
                                        outstanding: due,
                                        payments: sj.payments || [],
                                      })
                                    }
                                    title="Click to view payment receipt & transaction overview"
                                  >
                                    👁️ Overview
                                  </button>
                                )}
                                {due > 0 ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <button
                                      className="btn bs"
                                      style={{
                                        fontSize: 13,
                                        padding: "4px 8px",
                                        background: "#F0FDF4",
                                        borderColor: "#86EFAC",
                                        color: "#15803D",
                                        fontWeight: 800,
                                        whiteSpace: "nowrap",
                                      }}
                                      title="Send WhatsApp payment reminder for this sub-job"
                                      onClick={() =>
                                        setReminderTarget({
                                          clientId: c.id,
                                          job_no: c.job_no,
                                          sub_job_no: sj.sub_job_no,
                                          clientName: c.client,
                                          contact: c.contact,
                                          phone: c.phone,
                                          amount: amt,
                                          paid: paid,
                                          outstanding: due,
                                          wp_numbers: sj.wp_numbers && sj.wp_numbers.length > 0 ? sj.wp_numbers : (c.wp_numbers || []),
                                        })
                                      }
                                    >
                                      📲
                                    </button>
                                    <button
                                      className="btn bs bg"
                                      style={{ fontSize: 11, padding: "4px 10px", whiteSpace: "nowrap" }}
                                      onClick={() =>
                                        setPayTarget({
                                          clientId: c.id,
                                          clientName: c.client,
                                          sub_job_no: sj.sub_job_no,
                                          product: sj.product,
                                          amount: amt,
                                          paid: paid,
                                          outstanding: due,
                                        })
                                      }
                                    >
                                      💳 Pay
                                    </button>
                                  </div>
                                ) : sj.status === "unbilled" || (due === 0 && paid === 0) ? (
                                  <span style={{ color: "#64748B", fontWeight: 900, fontSize: 16 }}>-</span>
                                ) : sj.status === "partial_invoiced" ? (
                                  <span style={{ color: "#EA580C", fontWeight: 800, fontSize: 11 }}>
                                    ⏳ Partially Invoiced
                                  </span>
                                ) : (
                                  <span style={{ color: "#059669", fontWeight: 800, fontSize: 11 }}>
                                    ✓ Cleared
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0" }}>
                        <td colSpan={2} style={{ padding: "9px 10px", fontWeight: 900, fontSize: 12 }}>
                          TOTAL FOR {c.client.toUpperCase()}
                        </td>
                        <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900 }}>
                          {subjobs.reduce((s, j) => s + (Number(j.qty) || 0), 0)}
                        </td>
                        <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: "#0C1A2E", fontSize: 12.5 }}>
                          Rs {clientAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: "#059669", fontSize: 12.5 }}>
                          Rs {clientPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: clientDue > 0 ? "#EF4444" : "#059669", fontSize: 13 }}>
                          Rs {clientDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  {clientPaid > 0 && (
                    <button
                      className="btn bs"
                      style={{ background: "#F0FDFA", borderColor: "#99F6E4", color: "#0D9488", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                      onClick={() =>
                        setPreviewTarget({
                          clientId: c.id,
                          clientName: c.client,
                          sub_job_no: `${subjobs.length} Sub-Jobs`,
                          product: "Consolidated Client Payments",
                          amount: clientAmount,
                          paid: clientPaid,
                          outstanding: clientDue,
                          payments: (c.subjobs || []).flatMap((s) => s.payments || []),
                        })
                      }
                    >
                      👁️ Client Payments Overview
                    </button>
                  )}
                  {clientDue > 0 && (
                    <button
                      className="btn bs"
                      style={{ background: "#F0FDF4", borderColor: "#86EFAC", color: "#15803D", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                      onClick={() =>
                        setReminderTarget({
                          clientId: c.id,
                          job_no: c.job_no,
                          clientName: c.client,
                          contact: c.contact,
                          phone: c.phone,
                          amount: clientAmount,
                          paid: clientPaid,
                          outstanding: clientDue,
                          wp_numbers: c.wp_numbers || [],
                        })
                      }
                    >
                      📲 Send WhatsApp Reminder
                    </button>
                  )}
                  <button
                    className="btn bs"
                    style={{ background: "white", borderColor: "#CBD5E1", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                    onClick={() => downloadClientLedgerCSV(c)}
                    title="Export full client statement as Excel / CSV"
                  >
                    📊 Export Excel
                  </button>
                  <button
                    className="btn bs"
                    style={{ background: "white", borderColor: "#CBD5E1", color: "#DC2626", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                    onClick={() => downloadClientLedgerPDF(c)}
                    title="Export professional client statement as PDF"
                  >
                    📄 Export PDF
                  </button>
                  {clientDue > 0 && (
                    <button
                      className="btn bs bg"
                      style={{ background: "#ECFDF5", borderColor: "#A7F3D0", color: "#059669" }}
                      onClick={() => {
                        const firstPending = subjobs.find((s) => Number(s.outstanding) > 0) || subjobs[0];
                        setPayTarget({
                          clientId: c.id,
                          clientName: c.client,
                          sub_job_no: firstPending?.sub_job_no || c.job_no,
                          product: firstPending?.product || "All Sub-Jobs",
                          amount: Number(firstPending?.amount || clientDue),
                          paid: Number(firstPending?.paid || 0),
                          outstanding: Number(firstPending?.outstanding || clientDue),
                        });
                      }}
                    >
                      📥 Record Payment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={limit}
          onItemsPerPageChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          totalCount={totalCount}
          startIndex={(page - 1) * limit}
          visibleItemCount={clients.length}
          listType={true}
        />
      )}

      {/* Manual Payment Entry Modal */}
      {payTarget && (
        <ManualPaymentModal
          target={payTarget}
          onClose={() => setPayTarget(null)}
          onSave={handleSavePayment}
          isSaving={isSaving}
        />
      )}

      {/* Payment Receipt & Overview Modal */}
      {previewTarget && (
        <PaymentOverviewModal
          target={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onPayAgain={(t) => {
            setPreviewTarget(null);
            setPayTarget(t);
          }}
        />
      )}

      {/* WhatsApp Payment Reminder Modal (2Factor Template: payment alert) */}
      {reminderTarget && (
        <WhatsAppReminderModal
          target={reminderTarget}
          onClose={() => setReminderTarget(null)}
        />
      )}

      {/* Invoice Overview Modal */}
      {invoiceTarget && (
        <InvoiceOverviewModal
          target={invoiceTarget}
          onClose={() => setInvoiceTarget(null)}
        />
      )}
    </div>
  );
}
