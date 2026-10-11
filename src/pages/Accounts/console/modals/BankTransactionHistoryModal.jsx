import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../../utils/url/config";
import { toast } from "react-toastify";

export default function BankTransactionHistoryModal({ bank, onClose }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  
  // Default to current month start and today
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const fetchTransactions = async (bankId) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/accounts/bank-master/${bankId}/transactions`);
      if (res.data?.success) {
        const txns = res.data.data || [];
        
        // Sort chronologically to calculate running balance correctly
        const sortedTxns = [...txns].sort((a, b) => new Date(a.txn_date) - new Date(b.txn_date));
        
        let currentBalance = 0;
        const historyWithBalance = sortedTxns.map((t) => {
          if (t.type === "credit") {
            currentBalance += t.amount;
          } else if (t.type === "debit") {
            currentBalance -= t.amount;
          }
          return {
            ...t,
            running_balance: currentBalance,
          };
        });

        // Reverse back to show latest on top
        setHistory(historyWithBalance.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch bank transactions", err);
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bank && bank._id) {
      fetchTransactions(bank._id);
    }
  }, [bank]);

  if (!bank) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-file-invoice-dollar text-blue-600"></i>
              Transaction History - {bank.bank_name}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
              A/c No: {bank.account_number_masked || bank.last4 || "N/A"} &nbsp;|&nbsp; 
              Type: {bank.account_type} &nbsp;|&nbsp; 
              Current Balance: <b className={bank.balance < 0 ? "text-red-500" : "text-emerald-600"}>Rs {Number(bank.balance || 0).toLocaleString("en-IN")}</b>
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "white", padding: "4px 8px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: 13, color: "#1E293B", background: "transparent" }}
              />
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginLeft: 8 }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: 13, color: "#1E293B", background: "transparent" }}
              />
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "#F1F5F9", border: "none", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Close Modal"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, backgroundColor: "#F8FAFC" }}>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Particulars</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase text-right">Debit (-)</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase text-right">Credit (+)</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <i className="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500 mb-2"></i>
                        Loading transactions...
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const filteredHistory = history.filter((t) => {
                    const txnDate = new Date(t.txn_date).toISOString().split("T")[0];
                    if (startDate && txnDate < startDate) return false;
                    if (endDate && txnDate > endDate) return false;
                    return true;
                  });

                  if (filteredHistory.length === 0) {
                    return (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <i className="fa-solid fa-receipt text-3xl text-gray-300 mb-2"></i>
                            No transactions found for the selected date range.
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return filteredHistory.map((t, idx) => {
                    const isCredit = t.type === "credit";
                    const isDebit = t.type === "debit";
                    
                    return (
                      <tr key={t._id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(t.txn_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800" style={{ maxWidth: 300 }}>
                          <div className="font-medium text-gray-900">{t.description || (isCredit ? "Deposit" : "Withdrawal")}</div>
                          {(t.sub_job_no || t.party_name) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {t.party_name && <span>{t.party_name} </span>}
                              {t.sub_job_no && <span>(Ref: {t.sub_job_no})</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-500">
                          {isDebit ? `₹ ${Number(t.amount).toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-emerald-600">
                          {isCredit ? `₹ ${Number(t.amount).toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          ₹ {Number(t.running_balance).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
