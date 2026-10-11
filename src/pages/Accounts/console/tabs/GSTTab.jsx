import React, { useState, useEffect, useCallback } from "react";
import { fmt } from "../utils/accountsFormatters";
import { Met, Th, Td, Tag2 } from "../common/UIHelpers";
import { PeriodFilter, getCurrentMonthValue } from "../common/PeriodFilter";
import { axiosInstance } from "../../../../utils/url/config";
import { downloadGSTR1CSV } from "../utils/accountsExport";
import { toast } from "react-toastify";

export default function GSTView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [gstP, setGstP] = useState(false);
  const [tdsP, setTdsP] = useState(false);
  const [showInvoicesTable, setShowInvoicesTable] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const fetchSummary = useCallback(async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await axiosInstance.get("/accounts/gst-tds-summary", { params });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching GST/TDS summary:", err);
      toast.error("Failed to load GST & TDS data from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [fetchSummary, selectedMonth]);

  const period = data?.period || "Current Month";
  const gst = data?.gst || { gstCollected: 0, totalTaxable: 0, totalInvoiceVal: 0, invoicesCount: 0, inputTaxCredit: 0, netPayable: 0, gstr1DueDate: "11th", gstr3bDueDate: "20th" };
  const tds = data?.tds || { tdsDeductedByClients: 0, tdsPayableTotal: 0, sections: [] };
  const availableFinancialYears = data?.availableFinancialYears || [];
  const availableMonths = data?.availableMonths || [];
  const invoices = data?.invoices || [];

  // Filtered invoices for search
  const filteredInvoices = invoices.filter((inv) => {
    if (!invoiceSearch) return true;
    const q = invoiceSearch.toLowerCase();
    return (
      (inv.invoiceNo || "").toLowerCase().includes(q) ||
      (inv.sub_job_no || "").toLowerCase().includes(q) ||
      (inv.client_name || "").toLowerCase().includes(q) ||
      (inv.job_no || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ position: "relative", minHeight: 350 }}>
      <PeriodFilter
        value={selectedMonth}
        onChange={setSelectedMonth}
        availableFinancialYears={availableFinancialYears}
        availableMonths={availableMonths}
        label="Tax Period:"
        loading={loading}
        onRefresh={() => fetchSummary(selectedMonth)}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(2px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "3px solid #E2E8F0",
              borderTopColor: "#0D9488",
              animation: "spin 0.75s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {/* GST Summary Card */}
        <div className="card">
          <div className="ch" style={{ background: "#F0F9FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="cht" style={{ color: "#0EA5E9" }}>
              GST Summary — {period}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0369A1" }}>
              {gst.invoicesCount || invoices.length} Sales Invoices
            </div>
          </div>
          <div className="cb">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <Met v={"Rs " + fmt(gst.gstCollected)} l="GST Collected" c="#059669" bg="#ECFDF5" bd="#A7F3D0" />
              <Met v={"Rs " + fmt(gst.inputTaxCredit)} l="Input Tax Credit" c="#0EA5E9" bg="#E0F2FE" bd="#BAE6FD" />
              <Met v={"Rs " + fmt(gst.netPayable)} l="Net Payable" c="#F59E0B" bg="#FFFBEB" bd="#FDE68A" />
            </div>

            <div style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A", borderRadius: 9, padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#92400E", marginBottom: 3 }}>
                GSTR-1 Filing Due — {gst.gstr1DueDate}
              </div>
              <div style={{ fontSize: 11.5, color: "#92400E", opacity: 0.9 }}>
                File outward supplies. {invoices.length} invoices generated in this period.
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                <button
                  className="btn bs ba"
                  onClick={() => {
                    toast.info(`Redirecting to GST portal or preparing GSTR-1 payload for ${period}...`);
                    window.open("https://services.gst.gov.in/services/login", "_blank");
                  }}
                >
                  File GSTR-1 Portal ↗
                </button>
                <button
                  className="btn bs bb"
                  onClick={() => downloadGSTR1CSV(invoices, period)}
                  disabled={invoices.length === 0}
                >
                  Download Data (CSV)
                </button>
              </div>
            </div>

            <div
              style={{
                background: gstP ? "#ECFDF5" : "#F8FAFC",
                border: "1.5px solid " + (gstP ? "#A7F3D0" : "#E2E8F0"),
                borderRadius: 9,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: gstP ? "#059669" : "#0C1A2E" }}>
                  GSTR-3B Payment — Rs {fmt(gst.netPayable)}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Due {gst.gstr3bDueDate}</div>
              </div>
              {gstP ? (
                <Tag2 l="Paid" c="#059669" />
              ) : (
                <button className="btn bs bg" style={{ marginLeft: "auto" }} onClick={() => setGstP(true)}>
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TDS Summary Card */}
        <div className="card">
          <div className="ch" style={{ background: "#F5F3FF" }}>
            <div className="cht" style={{ color: "#7C3AED" }}>
              TDS Summary — {period}
            </div>
          </div>
          <div className="cb">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <Met v={"Rs " + fmt(tds.tdsDeductedByClients)} l="TDS Deducted (Clients)" c="#7C3AED" bg="#F5F3FF" bd="#DDD6FE" />
              <Met v={"Rs " + fmt(tds.tdsPayableTotal)} l="TDS Payable" c="#EF4444" bg="#FEF2F2" bd="#FECACA" />
            </div>
            <div className="card" style={{ marginBottom: 10 }}>
              <div className="cb" style={{ padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <Th ch="Section" />
                      <Th ch="Nature" />
                      <Th ch="Amount" />
                      <Th ch="Rate" />
                    </tr>
                  </thead>
                  <tbody>
                    {tds.sections && tds.sections.length > 0 ? (
                      tds.sections.map((r, i) => (
                        <tr key={i} className="bbf">
                          <Td v={r.section} mono c="#7C3AED" />
                          <Td v={r.nature} c="#475569" />
                          <Td v={"Rs " + fmt(r.amount || 0)} mono bold />
                          <Td v={r.rate} c="#94A3B8" />
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: 14, color: "#94A3B8" }}>
                          No vendor TDS deductions in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              style={{
                background: tdsP ? "#ECFDF5" : "#F8FAFC",
                border: "1.5px solid " + (tdsP ? "#A7F3D0" : "#E2E8F0"),
                borderRadius: 9,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: tdsP ? "#059669" : "#0C1A2E" }}>
                  TDS Challan — Rs {fmt(tds.tdsPayableTotal)}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Due 7th via NSDL/TIN</div>
              </div>
              {tdsP ? (
                <Tag2 l="Paid" c="#059669" />
              ) : (
                <button className="btn bs bg" style={{ marginLeft: "auto" }} onClick={() => setTdsP(true)}>
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Outward Supplies (GSTR-1 Invoices) Table Card */}
      <div className="card" style={{ marginBottom: 14, border: "1.5px solid #E2E8F0" }}>
        <div
          className="ch"
          style={{
            background: "#F8FAFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>📋</span>
            <div className="cht" style={{ color: "#0C1A2E", fontSize: 13.5, fontWeight: 900 }}>
              GSTR-1 Outward Supplies (Sales Invoices) — {period} ({invoices.length})
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              placeholder="🔍 Search Invoice, Sub-Job, Client..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="inp"
              style={{ padding: "5px 9px", fontSize: 11.5, width: 220 }}
            />
            <button
              className="btn bs"
              style={{ fontSize: 11, fontWeight: 800, padding: "5px 9px" }}
              onClick={() => setShowInvoicesTable(!showInvoicesTable)}
            >
              {showInvoicesTable ? "Hide Table ▲" : "Show Table ▼"}
            </button>
          </div>
        </div>

        {showInvoicesTable && (
          <div className="cb" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#0C1A2E", color: "#FFFFFF" }}>
                    <th style={{ padding: "8px 6px", textAlign: "center", width: 35, fontSize: 11 }}>#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>Invoice No</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>Date</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>Sub-Job No</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>Client Name</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontSize: 11 }}>Qty</th>
                    <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 11 }}>Unit Rate</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, background: "#1E293B" }}>
                      Taxable Subtotal
                    </th>
                    <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 11 }}>GST %</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11 }}>GST Amount</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, background: "#047857" }}>
                      Invoice Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: 28, color: "#64748B", fontStyle: "italic" }}>
                        {invoices.length === 0
                          ? `No sales invoices generated in ${period}.`
                          : "No invoices match the search filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, idx) => {
                      const invDate = inv.date || inv.createdAt ? new Date(inv.date || inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                      return (
                        <tr
                          key={inv.id || inv.invoiceNo || idx}
                          className="bbl"
                          style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}
                        >
                          <td style={{ padding: "7px 6px", textAlign: "center", color: "#94A3B8", fontWeight: 700 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "7px 10px", fontWeight: 900, color: "#0D9488", fontFamily: "monospace" }}>
                            {inv.invoiceNo}
                          </td>
                          <td style={{ padding: "7px 10px", color: "#475569", whiteSpace: "nowrap" }}>
                            {invDate}
                          </td>
                          <td style={{ padding: "7px 10px", fontWeight: 800, color: "#1E293B", fontFamily: "monospace" }}>
                            {inv.sub_job_no}
                          </td>
                          <td style={{ padding: "7px 10px", fontWeight: 700, color: "#0C1A2E" }}>
                            {inv.client_name}
                          </td>
                          <td style={{ padding: "7px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: 800 }}>
                            {inv.qty || 1}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: "monospace" }}>
                            Rs {Number(inv.pricePerQty || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#0F172A", background: "rgba(15, 23, 42, 0.02)" }}>
                            Rs {Number(inv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "center", fontWeight: 800, color: "#6366F1" }}>
                            {inv.gstPct || 18}%
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", color: "#7C3AED", fontWeight: 800 }}>
                            Rs {Number(inv.gstAmt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#059669", background: "rgba(5, 150, 105, 0.04)" }}>
                            Rs {Number(inv.totalAmt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredInvoices.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#F1F5F9", fontWeight: 900, borderTop: "2px solid #CBD5E1" }}>
                      <td colSpan={7} style={{ padding: "9px 10px", textAlign: "right", color: "#0F172A", fontSize: 12 }}>
                        Total ({filteredInvoices.length} Invoices):
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "#0F172A", fontSize: 13 }}>
                        Rs {filteredInvoices.reduce((s, i) => s + Number(i.subtotal || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td />
                      <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "#7C3AED", fontSize: 13 }}>
                        Rs {filteredInvoices.reduce((s, i) => s + Number(i.gstAmt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "#059669", fontSize: 14 }}>
                        Rs {filteredInvoices.reduce((s, i) => s + Number(i.totalAmt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Calendar Card */}
      <div className="card">
        <div className="ch">
          <div className="cht">Compliance Calendar — {period}</div>
        </div>
        <div className="cb">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { dt: gst.gstr1DueDate, t: "GSTR-1 Filing", s: "due" },
              { dt: "15th", t: "PF Contribution", s: "due" },
              { dt: gst.gstr3bDueDate, t: "GSTR-3B + Payment", s: "upcoming" },
              { dt: "31st", t: "TDS Certificate 16A", s: "upcoming" },
              { dt: "7th Next", t: "TDS Payment", s: "future" },
              { dt: "11th Next", t: "GSTR-1 (Next)", s: "future" },
              { dt: "20th Next", t: "GSTR-3B (Next)", s: "future" },
              { dt: "30th Next", t: "MSME Payment Limit", s: "future" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: item.s === "due" ? "#FEF2F2" : item.s === "upcoming" ? "#FFFBEB" : "#F8FAFC",
                  border: "1.5px solid " + (item.s === "due" ? "#FECACA" : item.s === "upcoming" ? "#FDE68A" : "#E2E8F0"),
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: item.s === "due" ? "#EF4444" : item.s === "upcoming" ? "#F59E0B" : "#64748B", fontFamily: "monospace", marginBottom: 3 }}>
                  {item.dt}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0C1A2E", lineHeight: 1.4 }}>{item.t}</div>
                <div style={{ marginTop: 6 }}>
                  <Tag2 l={item.s === "due" ? "DUE NOW" : item.s === "upcoming" ? "UPCOMING" : "FUTURE"} c={item.s === "due" ? "#EF4444" : item.s === "upcoming" ? "#F59E0B" : "#6366F1"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
