import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";
import { generateCashVoucherPDF } from "../utils/generateCashVoucherPDF";

export default function ManualVendorPaymentModal({ target, onClose, onSave, isSaving }) {
  const initialMaxDue = Number(target.outstanding !== undefined ? target.outstanding : (target.due !== undefined ? target.due : target.amount || 0));
  const [maxDue, setMaxDue] = useState(initialMaxDue);
  const [payAmount, setPayAmount] = useState(initialMaxDue);
  const [payMode, setPayMode] = useState("Bank Transfer (NEFT/RTGS)");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNo, setRefNo] = useState("");
  const [cashVoucherNo, setCashVoucherNo] = useState("");
  const [cashPaidTo, setCashPaidTo] = useState("");
  const [notes, setNotes] = useState("");
  const [tdsSection, setTdsSection] = useState("194C");
  const [tdsRate, setTdsRate] = useState(0);
  const [tdsAmount, setTdsAmount] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [checkingLive, setCheckingLive] = useState(false);
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");

  const handleAmountChange = (newAmt) => {
    setPayAmount(newAmt);
    const num = parseFloat(newAmt);
    if (!isNaN(num) && num > 0) {
      if (tdsRate > 0) {
        setTdsAmount(Math.round((num * tdsRate / 100) * 100) / 100);
      }
      if (gstRate > 0) {
        setGstAmount(Math.round((num * gstRate / 100) * 100) / 100);
      }
    } else {
      setTdsAmount(0);
      setGstAmount(0);
    }
  };

  const vId = target.vendorId || target.vendor_id || target.id;
  const assignId = target.assignment_id || target.assignmentId;
  const billNo = target.bill_no || target.billNo;
  const targetAmount = target.amount;

  // Proactive check on modal mount: verify if another user has already paid this vendor assignment
  useEffect(() => {
    let isMounted = true;
    const verifyLiveVendorBalance = async () => {
      if (!vId) return;
      setCheckingLive(true);
      try {
        const res = await axiosInstance.get(`/accounts/vendor-payments/${encodeURIComponent(vId)}`);
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          const matched = res.data.data.filter((p) => {
            if (assignId && p.assignment_id === assignId) return true;
            if (billNo && p.bill_no === billNo) return true;
            return false;
          });
          const livePaid = matched.reduce((s, p) => s + Number(p.amount || 0), 0);
          const billAmt = Number(targetAmount || 0);
          if (billAmt > 0) {
            const liveDue = Math.max(0, Math.round((billAmt - livePaid) * 100) / 100);
            setMaxDue(liveDue);
            if (liveDue <= 0) {
              setIsAlreadyPaid(true);
              setPayAmount(0);
              toast.warning(`Notice: This outsource assignment was already fully paid by another user!`);
            } else if (liveDue < initialMaxDue) {
              setPayAmount(liveDue);
              toast.info(`Notice: Live outstanding balance updated to Rs ${liveDue.toLocaleString("en-IN")}`);
            }
          }
        }
      } catch (err) {
        console.warn("Could not check live vendor payment balance:", err);
      } finally {
        if (isMounted) setCheckingLive(false);
      }
    };
    const loadBanks = async () => {
      try {
        const res = await axiosInstance.get("/accounts/bank-master");
        if (res.data?.success) {
          setBanks(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedBankId(res.data.data[0]._id);
          }
        }
      } catch (e) {
        console.warn("Failed to load banks", e);
      }
    };
    verifyLiveVendorBalance();
    loadBanks();
    return () => {
      isMounted = false;
    };
  }, [vId, assignId, billNo, targetAmount, initialMaxDue]);

  const handleFileChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    e.target.value = "";
    if (!rawFiles.length) return;

    // Deduplicate within the newly selected batch
    const uniqueFiles = [];
    const seenBatch = new Set();
    rawFiles.forEach((f) => {
      const key = `${f.name}_${f.size}`;
      if (!seenBatch.has(key)) {
        seenBatch.add(key);
        uniqueFiles.push(f);
      }
    });

    setAttachmentFiles((prev) => {
      const existingKeys = new Set(prev.map((item) => `${item.name}_${item.size}`));
      const newItems = [];

      uniqueFiles.forEach((file) => {
        const key = `${file.name}_${file.size}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          const id = `${file.name}_${file.size}_${Date.now()}_${Math.random()}`;
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
              setAttachmentFiles((current) =>
                current.map((it) => (it.id === id ? { ...it, preview: reader.result } : it))
              );
            };
            reader.readAsDataURL(file);
            newItems.push({ file, id, name: file.name, size: file.size, preview: "", isImage: true });
          } else {
            const objectUrl = URL.createObjectURL(file);
            newItems.push({ file, id, name: file.name, size: file.size, preview: objectUrl, isImage: false });
          }
        }
      });

      return [...prev, ...newItems];
    });
  };

  const handleRemoveFile = (indexToRemove) => {
    setAttachmentFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving || isAlreadyPaid || maxDue <= 0) return;
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      toast.warning("Please enter a valid payment amount greater than 0");
      return;
    }
    if (val > maxDue && maxDue > 0) {
      toast.error(
        `Entered payment amount (Rs ${val.toLocaleString("en-IN")}) cannot exceed the remaining outstanding balance of Rs ${maxDue.toLocaleString("en-IN")}.`
      );
      return;
    }
    onSave({
      vendorId: target.vendorId || target.vendor_id || target.id,
      vendorName: target.vendorName || target.vendor,
      billNo: target.bill_no || target.billNo || "",
      assignmentId: target.assignment_id || target.assignmentId || "",
      jobNo: target.job_no || target.jobNo || "",
      subJobNo: target.sub_job_no || target.subJobNo || "",
      amount: val,
      tdsSection: tdsSection || "194C",
      tdsRate: Number(tdsRate || 0),
      tdsAmount: Number(tdsAmount || 0),
      grossAmount: val + Number(tdsAmount || 0),
      gstRate: Number(gstRate || 0),
      gstAmount: Number(gstAmount || 0),
      mode: payMode,
      bank_account_id: payMode !== "Cash" ? selectedBankId : (banks.find(b => b.account_type === "Cash in Hand")?._id || null),
      bank_account_label: payMode !== "Cash" ? banks.find(b => b._id === selectedBankId)?.bank_name : "Cash in Hand",
      date: payDate,
      ref: refNo,
      cashVoucherNo: cashVoucherNo || refNo,
      cashPaidTo: cashPaidTo,
      notes: notes,
      attachments: attachmentFiles.map((f) => f.file),
      attachment: attachmentFiles[0]?.file || null,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 26, 46, 0.65)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          width: 530,
          maxWidth: "95vw",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1.5px solid #0D9488",
        }}
      >
        <div
          style={{
            background: "#F0FDFA",
            borderBottom: "1.5px solid #99F6E4",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>💸</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Record Vendor Payment (Outsource)
              </div>
              <div style={{ fontSize: 11.5, color: "#115E59", fontWeight: 700, marginTop: 2 }}>
                {target.vendorName || target.vendor} {target.sub_job_no ? `· Sub-Job: ${target.sub_job_no}` : (target.job_no ? `· Job: ${target.job_no}` : "")}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#64748B",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "18px 20px" }}>
          {/* Live Alert when already paid */}
          {isAlreadyPaid && (
            <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#991B1B" }}>
                  This outsource assignment has already been fully paid by another user!
                </div>
                <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 2 }}>
                  Payable due is Rs 0. Please close this modal and refresh the page.
                </div>
              </div>
            </div>
          )}

          {/* Summary Balance Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              marginBottom: 16,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "10px",
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Bill Amount</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2 }}>
                Rs {Number(target.amount || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Paid So Far</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#059669", fontFamily: "monospace", marginTop: 2 }}>
                Rs {Number(target.paid || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#EF4444", textTransform: "uppercase" }}>Payable Due</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#EF4444", fontFamily: "monospace", marginTop: 2 }}>
                Rs {Number(maxDue).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Amount to Pay */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase" }}>
                Payment Amount (Rs) *
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {(() => {
                  const isFull = Number(payAmount) === Number(maxDue) && maxDue > 0;
                  const isHalf = Number(payAmount) === Math.round(maxDue / 2) && maxDue > 0 && !isFull;
                  return (
                    <>
                      <button
                        type="button"
                        style={{
                          background: isFull ? "#0D9488" : "#F0FDFA",
                          border: isFull ? "1.5px solid #0D9488" : "1px solid #99F6E4",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 10.5,
                          fontWeight: 900,
                          color: isFull ? "#FFFFFF" : "#0D9488",
                          cursor: "pointer",
                          boxShadow: isFull ? "0 2px 4px rgba(13,148,136,0.25)" : "none",
                          transition: "all 0.15s ease",
                        }}
                        onClick={() => handleAmountChange(maxDue)}
                      >
                        {isFull ? "✓ " : ""}Clear Full (Rs {Math.round(maxDue).toLocaleString("en-IN")})
                      </button>
                      {maxDue > 1000 && (
                        <button
                          type="button"
                          style={{
                            background: isHalf ? "#2563EB" : "#F8FAFC",
                            border: isHalf ? "1.5px solid #2563EB" : "1px solid #CBD5E1",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: 10.5,
                            fontWeight: 900,
                            color: isHalf ? "#FFFFFF" : "#475569",
                            cursor: "pointer",
                            boxShadow: isHalf ? "0 2px 4px rgba(37,99,235,0.25)" : "none",
                            transition: "all 0.15s ease",
                          }}
                          onClick={() => handleAmountChange(Math.round(maxDue / 2))}
                        >
                          {isHalf ? "✓ 50%" : "50%"}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <input
              type="number"
              className="inp"
              required
              min="0.01"
              max={maxDue > 0 ? maxDue : undefined}
              step="any"
              value={payAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  handleAmountChange("");
                  return;
                }
                const num = parseFloat(v);
                if (!isNaN(num) && maxDue > 0 && num > maxDue) {
                  handleAmountChange(maxDue);
                } else {
                  handleAmountChange(v);
                }
              }}
              placeholder={`Exact max: Rs ${Number(maxDue).toLocaleString("en-IN")}`}
              style={{ fontSize: 15, fontWeight: 900, fontFamily: "monospace", color: "#0D9488", padding: "8px 12px" }}
              autoFocus
            />
            {Number(payAmount) > maxDue && maxDue > 0 && (
              <div style={{ color: "#EF4444", fontSize: 11, fontWeight: 800, marginTop: 4 }}>
                ⚠️ Payment cannot exceed remaining balance of Rs {Number(maxDue).toLocaleString("en-IN")}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                TDS Section
              </label>
              <select
                className="sel"
                value={tdsSection}
                onChange={(e) => setTdsSection(e.target.value)}
                style={{ padding: "8px 6px", fontSize: 11.5 }}
              >
                <option value="194C">194C (Print/Logistics)</option>
                <option value="194J">194J (Professional)</option>
                <option value="194Q">194Q (Goods &gt; 50L)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                TDS Rate (%)
              </label>
              <select
                className="sel"
                value={tdsRate}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setTdsRate(r);
                  if (r > 0 && payAmount > 0) {
                    setTdsAmount(Math.round((Number(payAmount) * r / 100) * 100) / 100);
                  } else {
                    setTdsAmount(0);
                  }
                }}
                style={{ padding: "8px 6px", fontSize: 11.5 }}
              >
                <option value="0">0% (No TDS)</option>
                <option value="1">1% (Individual 194C)</option>
                <option value="2">2% (Company 194C)</option>
                <option value="10">10% (Technical 194J)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                TDS Amount (Rs)
              </label>
              <input
                type="number"
                className="inp"
                min="0"
                step="any"
                value={tdsAmount}
                onChange={(e) => setTdsAmount(e.target.value)}
                placeholder="0"
                style={{ padding: "7px 8px", fontSize: 12 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                GST Rate Paid to Vendor (%)
              </label>
              <select
                className="sel"
                value={gstRate}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setGstRate(r);
                  if (r > 0 && payAmount > 0) {
                    setGstAmount(Math.round((Number(payAmount) * r / 100) * 100) / 100);
                  } else {
                    setGstAmount(0);
                  }
                }}
                style={{ padding: "8px 6px", fontSize: 11.5 }}
              >
                <option value="0">0% (Exempt / No GST)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                GST Amount Paid (Rs)
              </label>
              <input
                type="number"
                className="inp"
                min="0"
                step="any"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                placeholder="0"
                style={{ padding: "7px 8px", fontSize: 12 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                Payment Mode
              </label>
              <select
                className="sel"
                value={payMode}
                onChange={(e) => setPayMode(e.target.value)}
                style={{ padding: "8px 10px" }}
              >
                <option>Bank Transfer (NEFT/RTGS)</option>
                <option>UPI / GPay / PhonePe</option>
                <option>Cheque</option>
                <option>Cash</option>
                <option>Credit / Debit Card</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                Payment Date
              </label>
              <input
                type="date"
                className="inp"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                style={{ padding: "7px 10px" }}
              />
            </div>
          </div>

          {payMode !== "Cash" && banks.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                Debit From Bank Account *
              </label>
              <select
                className="sel"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                style={{ padding: "8px 10px", width: "100%" }}
                required
              >
                <option value="">Select Bank Account</option>
                {banks.filter(b => b.account_type !== "Cash in Hand").map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bank_name} {b.account_number ? `(${b.account_number})` : ""} (Bal: Rs {Number(b.balance||0).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {payMode === "Cash" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Cash Disbursement Voucher No *
                </label>
                <input
                  type="text"
                  className="inp"
                  value={cashVoucherNo || refNo}
                  onChange={(e) => {
                    setCashVoucherNo(e.target.value);
                    setRefNo(e.target.value);
                  }}
                  placeholder="e.g. CV-2026-0018"
                  style={{ padding: "7px 10px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Handed Over To (Receiver Name)
                </label>
                <input
                  type="text"
                  className="inp"
                  value={cashPaidTo}
                  onChange={(e) => setCashPaidTo(e.target.value)}
                  placeholder="e.g. Vendor Representative Name"
                  style={{ padding: "7px 10px" }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                Reference / UTR / Cheque No
              </label>
              <input
                type="text"
                className="inp"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. UTR20260908001 / Cheque #918234"
                style={{ padding: "7px 10px" }}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              className="inp"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional vendor payment remarks"
              style={{ padding: "7px 10px" }}
            />
          </div>

          {/* Optional Multi-File Attachment Upload */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <span>Payment Voucher / Receipt Proof</span>
                <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>(Optional · Multi-File)</span>
              </label>
            </div>

            <div
              style={{
                border: "1.5px dashed #CBD5E1",
                borderRadius: 8,
                padding: "10px 14px",
                background: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <label
                style={{
                  background: "#0D9488",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                📎 Attach Proofs
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                {attachmentFiles.length > 0 ? `${attachmentFiles.length} file(s) chosen` : "Upload vendor remittance or bank receipt (JPG, PNG, PDF)"}
              </div>
            </div>

            {/* Selected files preview */}
            {attachmentFiles.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {attachmentFiles.map((fileObj, idx) => (
                  <div
                    key={fileObj.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#F0FDFA",
                      border: "1px solid #99F6E4",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontSize: 11,
                      color: "#0F766E",
                    }}
                  >
                    <span>{fileObj.isImage ? "🖼️" : "📄"}</span>
                    <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fileObj.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#DC2626",
                        fontWeight: 900,
                        padding: 0,
                        marginLeft: 4,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
            {payMode === "Cash" && (
              <button
                type="button"
                className="btn bs"
                style={{ background: "#F0FDFA", borderColor: "#99F6E4", color: "#0D9488", fontWeight: 800 }}
                onClick={() =>
                  generateCashVoucherPDF({
                    subJobNo: target.sub_job_no || target.subJobNo || target.job_no,
                    vendorName: target.vendorName || target.vendor_name,
                    amount: payAmount,
                    tdsAmount: tdsAmount,
                    grossAmount: Number(payAmount || 0) + Number(tdsAmount || 0),
                    personName: cashPaidTo,
                    voucherNo: cashVoucherNo || refNo,
                    date: payDate,
                    notes: notes,
                  })
                }
              >
                📄 Print Cash Voucher PDF
              </button>
            )}
            <button
              type="button"
              className="btn bs"
              onClick={onClose}
              style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700 }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bs bg"
              style={{
                padding: "8px 20px",
                fontSize: 12,
                fontWeight: 900,
                background: isAlreadyPaid ? "#94A3B8" : "#0D9488",
                borderColor: isAlreadyPaid ? "#94A3B8" : "#0D9488",
                color: "white",
                opacity: (isSaving || isAlreadyPaid || maxDue <= 0) ? 0.6 : 1,
                cursor: (isSaving || isAlreadyPaid || maxDue <= 0) ? "not-allowed" : "pointer",
              }}
              disabled={isSaving || isAlreadyPaid || maxDue <= 0}
            >
              {isSaving ? "Recording Payment..." : isAlreadyPaid ? "✓ Already Fully Paid" : "✓ Confirm & Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
