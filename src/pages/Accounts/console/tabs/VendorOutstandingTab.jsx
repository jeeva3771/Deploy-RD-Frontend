import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useLoader } from "../../../../context/LoaderContext";
import { axiosInstance } from "../../../../utils/url/config";
import { getUser } from "../../../../utils/permission/auth";
import { fmt } from "../utils/accountsFormatters";
import { downloadVendorLedgerCSV, downloadVendorLedgerPDF } from "../utils/accountsExport";
import { Met, Th, Td, Tag2 } from "../common/UIHelpers";
import Pagination from "../../../components/Pagination";
import ManualVendorPaymentModal from "../modals/ManualVendorPaymentModal";
import VendorPaymentOverviewModal from "../modals/VendorPaymentOverviewModal";

export default function VendorOS({ onRefresh }) {
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
  const [isSaving, setIsSaving] = useState(false);
  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    clearedVendors: 0
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterValue]);

  const fetchPaginatedVendors = useCallback(async () => {
    try {
      setLoading(true);
      showLoader();
      const res = await axiosInstance.get("/accounts/vendor-outstanding", {
        params: { page, limit, search: debouncedSearch, filterType, filterValue }
      });
      if (res.data?.success) {
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.count || 0);
        setGlobalStats({
          totalAmount: res.data.totalAmount || 0,
          totalPaid: res.data.totalPaid || 0,
          totalOutstanding: res.data.totalPayable || 0,
          clearedVendors: res.data.clearedVendors || 0
        });
        const data = res.data.data || [];
        setVendors(
          data.map((v) => {
            const bills = (v.bills || []).map((b) => {
              const amt = Number(b.amount || 0);
              const paid = Number(b.paid || 0);
              const due = Number(b.due !== undefined ? b.due : (amt - paid));
              let status = b.status;
              if (due === 0 && amt > 0) status = "paid";
              else if (paid > 0 && due > 0) status = "partial_paid";
              else if (paid === 0) status = "pending";
              return {
                ...b,
                amount: amt,
                paid: paid,
                due: due,
                outstanding: due,
                status: status,
              };
            });
            const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
            const totalPaid = bills.reduce((s, b) => s + b.paid, 0);
            const totalOutstanding = bills.reduce((s, b) => s + b.due, 0);
            return {
              ...v,
              totalAmount: totalAmount,
              totalPaid: totalPaid,
              totalOutstanding: totalOutstanding,
              bills: bills,
            };
          })
        );
        if (data.length > 0 && !exp) {
          setExp(data[0].id || data[0].vendor_id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch paginated vendors", err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [page, limit, debouncedSearch, filterType, filterValue, showLoader, hideLoader]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPaginatedVendors();
  }, [fetchPaginatedVendors]);

  // Handle saving vendor payment
  const handleSavePayment = async ({ vendorId, vendorName, billNo, assignmentId, jobNo, subJobNo, amount, gstRate, gstAmount, tdsSection, tdsRate, tdsAmount, grossAmount, mode, bank_account_id, bank_account_label, date, ref, cashVoucherNo, cashPaidTo, notes, attachment, attachments }) => {
    setIsSaving(true);
    showLoader();
    try {
      const formData = new FormData();
      formData.append("vendor_id", vendorId || "");
      formData.append("vendor_name", vendorName || "");
      formData.append("bill_no", billNo || "");
      formData.append("assignment_id", assignmentId || "");
      formData.append("job_no", jobNo || "");
      formData.append("sub_job_no", subJobNo || "");
      formData.append("amount", amount);
      if (gstRate) formData.append("gst_rate", gstRate);
      if (gstAmount) formData.append("gst_amount", gstAmount);
      if (tdsSection) formData.append("tds_section", tdsSection);
      if (tdsRate) formData.append("tds_rate", tdsRate);
      if (tdsAmount) formData.append("tds_amount", tdsAmount);
      if (grossAmount) formData.append("gross_amount", grossAmount);
      formData.append("payment_mode", mode);
      if (bank_account_id) formData.append("bank_account_id", bank_account_id);
      if (bank_account_label) formData.append("bank_account_label", bank_account_label);
      formData.append("payment_date", date);
      formData.append("reference_no", ref || "");
      if (cashVoucherNo) formData.append("cash_voucher_no", cashVoucherNo);
      if (cashPaidTo) formData.append("cash_paid_to", cashPaidTo);
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

      const res = await axiosInstance.post("/accounts/record-vendor-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setVendors((prev) =>
          prev.map((v) => {
            if (v.id !== vendorId && v.vendor_id !== vendorId) return v;
            const updatedBills = (v.bills || []).map((b) => {
              const match = (billNo && b.bill_no === billNo) || (assignmentId && b.assignment_id === assignmentId);
              if (!match) return b;
              const currentPaid = Number(b.paid || 0);
              const totalAmt = Number(b.amount || 0);
              const newPaid = Math.min(totalAmt, currentPaid + amount);
              const newDue = Math.max(0, totalAmt - newPaid);
              const newStatus = newDue === 0 ? "paid" : (newPaid > 0 ? "partial_paid" : "pending");
              return {
                ...b,
                paid: newPaid,
                due: newDue,
                outstanding: newDue,
                status: newStatus,
              };
            });
            const newTotalAmount = updatedBills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
            const newTotalPaid = updatedBills.reduce((s, b) => s + (Number(b.paid) || 0), 0);
            const newTotalOutstanding = updatedBills.reduce((s, b) => s + (Number(b.due) || 0), 0);
            return {
              ...v,
              totalAmount: newTotalAmount,
              totalPaid: newTotalPaid,
              totalOutstanding: newTotalOutstanding,
              bills: updatedBills,
            };
          })
        );

        if (typeof onRefresh === "function") {
          await onRefresh();
        }
        await fetchPaginatedVendors();

        toast.success(`Payment of Rs ${amount.toLocaleString("en-IN")} recorded successfully for ${vendorName}!`);
        setPayTarget(null);
      } else {
        toast.error("Failed to record payment: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving vendor payment:", err);
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      // Auto close modal and refresh live balances on conflict or overpayment
      if (err.response?.status === 400) {
        setPayTarget(null);
        if (typeof onRefresh === "function") {
          await onRefresh();
        }
        await fetchPaginatedVendors();
      }
    } finally {
      setIsSaving(false);
      hideLoader();
    }
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
      const year = d.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      setFilterValue(`${year}-W${weekNum.toString().padStart(2, '0')}`);
    } else {
      setFilterValue('');
    }
  };

  const STATUS_TAGS = {
    paid: { l: "Fully Paid", c: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
    partial_paid: { l: "Partial Paid", c: "#8B5CF6", bg: "#F5F3FF", bd: "#DDD6FE" },
    pending: { l: "Pending", c: "#F59E0B", bg: "#FFFBEB", bd: "#FDE68A" },
    overdue: { l: "Overdue", c: "#EF4444", bg: "#FEF2F2", bd: "#FECACA" },
    assigned: { l: "Assigned", c: "#0D9488", bg: "#F0FDFA", bd: "#99F6E4" },
    completed: { l: "Delivered", c: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
  };

  return (
    <div>
      {/* Top Metric Cards */}
      <div className="g4mb">
        <Met
          v={"Rs " + fmt(globalStats.totalAmount)}
          l="Total Outsource Bills"
          c="#0C1A2E"
          bg="#F8FAFC"
          bd="#E2E8F0"
        />
        <Met
          v={"Rs " + fmt(globalStats.totalPaid)}
          l="Total Paid So Far"
          c="#059669"
          bg="#ECFDF5"
          bd="#A7F3D0"
        />
        <Met
          v={"Rs " + fmt(globalStats.totalOutstanding)}
          l="Total Outstanding Payable"
          c="#EF4444"
          bg="#FEF2F2"
          bd="#FECACA"
        />
        <Met
          v={globalStats.clearedVendors + " / " + totalCount}
          l="Fully Cleared Vendors"
          c="#0D9488"
          bg="#F0FDFA"
          bd="#99F6E4"
        />
      </div>

      {/* Info & Search Banner */}
      <div
        style={{
          background: "#F0FDFA",
          border: "1.5px solid #99F6E4",
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
          <div style={{ fontSize: 13, fontWeight: 900, color: "#0F766E", display: "flex", alignItems: "center", gap: 6 }}>
            <span>🏭 Outsource Vendors & Payables Ledger</span>
            <Tag2 l="Live Outsource Bills Enabled" c="#0F766E" bg="#CCFBF1" bd="#5EEAD4" />
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
            Track outsource process bills, payments, and dues for each vendor. Click <b>💳 Pay</b> to record payment vouchers with receipt proofs.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch", flex: 1, justifyContent: "flex-end" }}>
          <select
            onChange={(e) => handleFilterSelect(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", cursor: "pointer", background: "white", color: "#475569" }}
            value={filterType}
          >
            <option value="today">Due Today</option>
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
              placeholder="🔍 Search vendor, process, job no, bill no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: "white", padding: "6px 12px", fontSize: 13, flex: 1, border: "1px solid #CBD5E1", borderRadius: 6 }}
            />
          </div>
        </div>
      </div>

      {!loading && vendors.length === 0 && (
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
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>
            No Outsource Vendor Records Found
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
            There are currently no active outsource vendor bills matching your criteria.
          </div>
        </div>
      )}

      {/* Vendors Listing */}
      {vendors.map((v) => {
        const isExp = exp === v.id;
        const bills = v.bills || [];
        const vendorAmount = Number(v.totalAmount || 0);
        const vendorPaid = Number(v.totalPaid || 0);
        const vendorDue = Number(v.totalOutstanding || 0);

        return (
          <div
            key={v.id}
            className="card"
            style={{
              borderColor: vendorDue > 0 ? (vendorDue > 500000 ? "#FECACA" : "#E2E8F0") : "#A7F3D0",
              boxShadow: isExp ? "0 4px 14px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {/* Parent Row (Vendor Header) */}
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
              onClick={() => setExp(isExp ? null : v.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: vendorDue === 0 ? "#059669" : "#0D9488",
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
                  {vendorDue === 0 ? "✓" : (v.vendor || "V").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#0C1A2E" }}>
                      {v.vendor}
                    </span>
                    {v.gst && v.gst !== "—" && (
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 800, color: "#475569", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 4, padding: "1px 6px" }}>
                        GST: {v.gst}
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
                      {bills.length} Bill{bills.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748B", marginTop: 3 }}>
                    {v.contact && <span>{v.contact} · </span>}
                    {v.phone && <span>📞 {v.phone}</span>}
                    {/* <span style={{ color: "#0D9488", fontWeight: 700 }}>{v.type || "Outsource Services"}</span> */}
                  </div>
                </div>
              </div>

              {/* 3-Part Financial Summary */}
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
                {/* Total Bill Amount */}
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
                    Total Bill
                  </div>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 800, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2, whiteSpace: "nowrap" }}
                  >
                    Rs {Number(vendorAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
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
                  >
                    Rs {Number(vendorPaid || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Outstanding Payable */}
                <div
                  style={{
                    background: vendorDue > 0 ? "#FEF2F2" : "#F0FDF4",
                    border: `1px solid ${vendorDue > 0 ? "#FECACA" : "#BBF7D0"}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: vendorDue > 0 ? "#DC2626" : "#166534",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {vendorDue > 0 ? "Payable Due" : "Cleared"}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: vendorDue > 0 ? "#DC2626" : "#16A34A",
                      fontFamily: "monospace",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Rs {Number(vendorDue || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {vendorDue > 0 && (
                  <button
                    className="btn bs bg"
                    style={{ fontSize: 11, padding: "6px 12px", background: "#0D9488", borderColor: "#0D9488", color: "white" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const firstPending = bills.find((b) => Number(b.due) > 0) || bills[0];
                      setPayTarget({
                        vendorId: v.id,
                        vendorName: v.vendor,
                        bill_no: firstPending?.bill_no || "",
                        assignment_id: firstPending?.assignment_id || "",
                        job_no: firstPending?.job_no || "",
                        sub_job_no: firstPending?.sub_job_no || "",
                        amount: Number(firstPending?.amount || vendorDue),
                        paid: Number(firstPending?.paid || 0),
                        outstanding: Number(firstPending?.due || vendorDue),
                      });
                    }}
                  >
                    💳 Pay
                  </button>
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

            {/* Under Display: Outsource Bills Table */}
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
                  <span>📋 Outsource Process Bills & Payment Status ({bills.length})</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "none" }}>
                    Manual payments reflect immediately
                  </span>
                </div>

                {bills.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "#64748B", background: "white", borderRadius: 8, border: "1px dashed #CBD5E1" }}>
                    No shopfloor outsource assignments currently attached to this vendor.
                  </div>
                ) : (
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden", background: "white" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          <Th ch="Sub-Job" />
                          <Th ch="Process & Part" />
                          <Th ch="Qty / Sheets" />
                          <Th ch="Rate (Rs)" />
                          <Th ch="Amount (Rs)" />
                          <Th ch="Paid (Rs)" />
                          <Th ch="Payable (Rs)" />
                          <Th ch="Status" />
                          <Th ch="Action" />
                        </tr>
                      </thead>
                      <tbody>
                        {bills.map((b, idx) => {
                          const amt = Number(b.amount || 0);
                          const paid = Number(b.paid || 0);
                          const due = Number(b.due !== undefined ? b.due : (amt - paid));
                          const tag = STATUS_TAGS[b.status] || (due === 0 ? STATUS_TAGS.paid : (paid > 0 ? STATUS_TAGS.partial_paid : STATUS_TAGS.pending));

                          return (
                            <tr key={idx} className="bbf" style={{ transition: "background 0.15s" }}>
                              <td style={{ padding: "9px 10px", fontFamily: "monospace", color: "#475569", fontWeight: 700 }}>
                                {b.sub_job_no || "—"}
                              </td>
                              <td style={{ padding: "9px 10px" }}>
                                <div style={{ fontWeight: 800, color: "#0C1A2E" }}>{b.process}</div>
                                {b.part_name && <div style={{ fontSize: 10.5, color: "#64748B" }}>{b.part_name}</div>}
                              </td>
                              <Td v={b.qty || b.sheets || 1} mono bold />
                              <td style={{ padding: "9px 10px", fontFamily: "monospace", color: "#475569" }}>
                                Rs {Number(b.rate || 0).toFixed(2)}
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
                                      }}
                                      onClick={() =>
                                        setPreviewTarget({
                                          vendorId: v.id,
                                          vendorName: v.vendor,
                                          bill_no: b.bill_no,
                                          assignment_id: b.assignment_id,
                                          job_no: b.job_no,
                                          sub_job_no: b.sub_job_no,
                                          amount: amt,
                                          paid: paid,
                                          outstanding: due,
                                          payments: (v.payments || []).filter(
                                            (p) =>
                                              (b.bill_no && p.bill_no && String(p.bill_no).trim().toLowerCase() === String(b.bill_no).trim().toLowerCase()) ||
                                              (b.assignment_id && p.assignment_id && String(p.assignment_id).trim() === String(b.assignment_id).trim()) ||
                                              (b.sub_job_no && p.sub_job_no && String(p.sub_job_no).trim().toLowerCase() === String(b.sub_job_no).trim().toLowerCase())
                                          ),
                                          allPayments: v.payments || [],
                                        })
                                      }
                                      title="View payment receipt vouchers"
                                    >
                                      👁️ Overview
                                    </button>
                                  )}
                                  {due > 0 ? (
                                    <button
                                      className="btn bs bg"
                                      style={{ fontSize: 11, padding: "4px 10px", whiteSpace: "nowrap", background: "#0D9488", borderColor: "#0D9488", color: "white" }}
                                      onClick={() =>
                                        setPayTarget({
                                          vendorId: v.id,
                                          vendorName: v.vendor,
                                          bill_no: b.bill_no,
                                          assignment_id: b.assignment_id,
                                          job_no: b.job_no,
                                          sub_job_no: b.sub_job_no,
                                          amount: amt,
                                          paid: paid,
                                          outstanding: due,
                                        })
                                      }
                                    >
                                      💳 Pay
                                    </button>
                                  ) : (
                                    paid === 0 && (
                                      <span style={{ color: "#059669", fontWeight: 800, fontSize: 11 }}>
                                        ✓ Cleared
                                      </span>
                                    )
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
                            TOTAL FOR {v.vendor.toUpperCase()}
                          </td>
                          <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900 }}>
                            {bills.reduce((s, b) => s + (Number(b.qty || b.sheets) || 0), 0)}
                          </td>
                          <td />
                          <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: "#0C1A2E", fontSize: 12.5 }}>
                            Rs {vendorAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: "#059669", fontSize: 12.5 }}>
                            Rs {vendorPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 900, color: vendorDue > 0 ? "#EF4444" : "#059669", fontSize: 13 }}>
                            Rs {vendorDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  {vendorPaid > 0 && (
                    <button
                      className="btn bs"
                      style={{ background: "#F0FDFA", borderColor: "#99F6E4", color: "#0D9488", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                      onClick={() =>
                        setPreviewTarget({
                          vendorId: v.id,
                          vendorName: v.vendor,
                          bill_no: `${bills.length} Bills`,
                          amount: vendorAmount,
                          paid: vendorPaid,
                          outstanding: vendorDue,
                          payments: v.payments || [],
                        })
                      }
                    >
                      👁️ Vendor Payments Overview
                    </button>
                  )}
                  <button
                    className="btn bs"
                    style={{ background: "white", borderColor: "#CBD5E1", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                    onClick={() => downloadVendorLedgerCSV(v)}
                    title="Export full vendor statement as Excel / CSV"
                  >
                    📊 Export Excel
                  </button>
                  <button
                    className="btn bs"
                    style={{ background: "white", borderColor: "#CBD5E1", color: "#DC2626", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
                    onClick={() => downloadVendorLedgerPDF(v)}
                    title="Export professional vendor statement as PDF"
                  >
                    📄 Export PDF
                  </button>
                  {vendorDue > 0 && (
                    <button
                      className="btn bs bg"
                      style={{ background: "#0D9488", borderColor: "#0D9488", color: "white" }}
                      onClick={() => {
                        const firstPending = bills.find((b) => Number(b.due) > 0) || bills[0];
                        setPayTarget({
                          vendorId: v.id,
                          vendorName: v.vendor,
                          bill_no: firstPending?.bill_no || "",
                          assignment_id: firstPending?.assignment_id || "",
                          job_no: firstPending?.job_no || "",
                          sub_job_no: firstPending?.sub_job_no || "",
                          amount: Number(firstPending?.amount || vendorDue),
                          paid: Number(firstPending?.paid || 0),
                          outstanding: Number(firstPending?.due || vendorDue),
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
          visibleItemCount={vendors.length}
          listType={true}
        />
      )}

      {/* Manual Vendor Payment Entry Modal */}
      {payTarget && (
        <ManualVendorPaymentModal
          target={payTarget}
          onClose={() => setPayTarget(null)}
          onSave={handleSavePayment}
          isSaving={isSaving}
        />
      )}

      {/* Vendor Payment Receipt & Overview Modal */}
      {previewTarget && (
        <VendorPaymentOverviewModal
          target={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onPayAgain={(t) => {
            setPreviewTarget(null);
            setPayTarget(t);
          }}
        />
      )}
    </div>
  );
}
