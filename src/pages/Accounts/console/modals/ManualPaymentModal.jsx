import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";
import { generateCashVoucherPDF } from "../utils/generateCashVoucherPDF";

export default function ManualPaymentModal({ target, onClose, onSave, isSaving }) {
  const initialMaxDue = Number(target.outstanding !== undefined ? target.outstanding : (target.due !== undefined ? target.due : target.amount || 0));
  const [maxDue, setMaxDue] = useState(initialMaxDue);
  const [payAmount, setPayAmount] = useState(initialMaxDue);
  const [payMode, setPayMode] = useState("Bank Transfer (NEFT/RTGS)");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNo, setRefNo] = useState("");
  const [cashVoucherNo, setCashVoucherNo] = useState("");
  const [cashCollectedBy, setCashCollectedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [tdsAmount, setTdsAmount] = useState(0);
  const [tdsRate, setTdsRate] = useState(0);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [checkingLive, setCheckingLive] = useState(false);
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");

  const handleAmountChange = (newAmt) => {
    setPayAmount(newAmt);
    const num = parseFloat(newAmt);
    if (tdsRate > 0 && !isNaN(num) && num > 0) {
      setTdsAmount(Math.round((num * tdsRate / 100) * 100) / 100);
    }
  };

  const subJobNo = target.sub_job_no;
  const targetAmount = target.amount;
  const targetAmt = target.amt;
  const targetGrandTotal = target.grandTotal;
  const targetQuotationTotal = target.quotationTotal;

  // Proactive check on modal mount: verify if another user has already paid this sub-job
  useEffect(() => {
    let isMounted = true;
    const verifyLiveBalance = async () => {
      if (!subJobNo || subJobNo.includes("Sub-Jobs")) return;
      setCheckingLive(true);
      try {
        const res = await axiosInstance.get(`/accounts/payments/${encodeURIComponent(subJobNo)}`);
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          const livePaid = res.data.data.reduce((s, p) => s + Number(p.amount || 0), 0);
          const totalAmt = Number(targetAmount || targetAmt || targetGrandTotal || targetQuotationTotal || 0);
          if (totalAmt > 0) {
            const liveDue = Math.max(0, Math.round((totalAmt - livePaid) * 100) / 100);
            setMaxDue(liveDue);
            if (liveDue <= 0) {
              setIsAlreadyPaid(true);
              setPayAmount(0);
              toast.warning(`Notice: Sub-job ${subJobNo} was already fully paid by another user!`);
            } else if (liveDue < initialMaxDue) {
              setPayAmount(liveDue);
              toast.info(`Notice: Live outstanding balance updated to Rs ${liveDue.toLocaleString("en-IN")}`);
            }
          }
        }
      } catch (err) {
        console.warn("Could not check live payment balance:", err);
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
    verifyLiveBalance();
    loadBanks();
    return () => {
      isMounted = false;
    };
  }, [subJobNo, targetAmount, targetAmt, targetGrandTotal, targetQuotationTotal, initialMaxDue]);

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
            newItems.push({ file, id, name: file.name, size: file.size, preview: "", isImage: false });
          }
        }
      });

      return [...prev, ...newItems];
    });
  };

  const handleRemoveFile = (indexToRemove) => {
    setAttachmentFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllFiles = () => {
    setAttachmentFiles([]);
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
        `Entered payment amount (Rs ${val.toLocaleString("en-IN")}) cannot exceed the remaining outstanding balance of Rs ${maxDue.toLocaleString("en-IN")}. Only exact or lower amount is allowed.`
      );
      return;
    }
    onSave({
      clientId: target.clientId || target.id,
      clientName: target.clientName || target.client,
      subJobNo: target.sub_job_no,
      amount: val,
      tdsAmount: Number(tdsAmount || 0),
      tdsRate: Number(tdsRate || 0),
      grossAmount: val + Number(tdsAmount || 0),
      mode: payMode,
      bank_account_id: payMode !== "Cash" ? selectedBankId : (banks.find(b => b.account_type === "Cash in Hand")?._id || null),
      bank_account_label: payMode !== "Cash" ? banks.find(b => b._id === selectedBankId)?.bank_name : "Cash in Hand",
      date: payDate,
      ref: refNo,
      cashVoucherNo: cashVoucherNo || refNo,
      cashCollectedBy: cashCollectedBy,
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
          border: "1.5px solid #059669",
        }}
      >
        <div
          style={{
            background: "#ECFDF5",
            borderBottom: "1.5px solid #A7F3D0",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>💳</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Record Payment (Manual Entry)
              </div>
              <div style={{ fontSize: 11.5, color: "#047857", fontWeight: 700, marginTop: 2 }}>
                {target.clientName || target.client} · Sub-Job: {target.sub_job_no}
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
                  This sub-job has already been fully paid by another user!
                </div>
                <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 2 }}>
                  Outstanding balance is Rs 0. Please close this modal and refresh the console.
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
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Total Amount</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2 }}>
                Rs {Number(target.amount || target.amt || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Paid So Far</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#059669", fontFamily: "monospace", marginTop: 2 }}>
                Rs {Number(target.paid || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#EF4444", textTransform: "uppercase" }}>Remaining Due</div>
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
                          background: isFull ? "#15803D" : "#F0FDF4",
                          border: isFull ? "1.5px solid #15803D" : "1px solid #86EFAC",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 10.5,
                          fontWeight: 900,
                          color: isFull ? "#FFFFFF" : "#15803D",
                          cursor: "pointer",
                          boxShadow: isFull ? "0 2px 4px rgba(21,128,61,0.25)" : "none",
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
              style={{ fontSize: 15, fontWeight: 900, fontFamily: "monospace", color: "#059669", padding: "8px 12px" }}
              autoFocus
            />
            {Number(payAmount) > maxDue && maxDue > 0 && (
              <div style={{ color: "#EF4444", fontSize: 11, fontWeight: 800, marginTop: 4 }}>
                ⚠️ Payment cannot exceed exact balance of Rs {Number(maxDue).toLocaleString("en-IN")}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                TDS Deducted by Client (Rs)
              </label>
              <input
                type="number"
                className="inp"
                min="0"
                step="any"
                value={tdsAmount}
                onChange={(e) => setTdsAmount(e.target.value)}
                placeholder="e.g. 500"
                style={{ padding: "7px 10px", fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
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
                style={{ padding: "8px 10px" }}
              >
                <option value="0">None (0%)</option>
                <option value="2">2% (Section 194C)</option>
                <option value="10">10% (Section 194J)</option>
              </select>
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
                Credit To Bank Account *
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
                  Cash Receipt / Voucher No *
                </label>
                <input
                  type="text"
                  className="inp"
                  value={cashVoucherNo || refNo}
                  onChange={(e) => {
                    setCashVoucherNo(e.target.value);
                    setRefNo(e.target.value);
                  }}
                  placeholder="e.g. CR-2026-0042"
                  style={{ padding: "7px 10px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Collected By (Staff Name)
                </label>
                <input
                  type="text"
                  className="inp"
                  value={cashCollectedBy}
                  onChange={(e) => setCashCollectedBy(e.target.value)}
                  placeholder="e.g. Ramesh (Accounts)"
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
                placeholder="e.g. UTR20260904019 / Cheque #884120"
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
              placeholder="Optional payment notes"
              style={{ padding: "7px 10px" }}
            />
          </div>

          {/* Optional Multi-File Attachment Upload */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <span>Receipt / Payment Proofs</span>
                <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>(Optional · Multi-File)</span>
                {attachmentFiles.length > 0 && (
                  <span style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", padding: "1px 6px", borderRadius: 10, fontSize: 10, fontWeight: 900 }}>
                    {attachmentFiles.length} {attachmentFiles.length === 1 ? "file" : "files"}
                  </span>
                )}
              </label>
              {attachmentFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFiles}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#EF4444",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: "0 4px",
                  }}
                >
                  ✕ Clear All
                </button>
              )}
            </div>

            {/* List of uploaded files */}
            {attachmentFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, maxHeight: 180, overflowY: "auto", paddingRight: 2 }}>
                {attachmentFiles.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 10px",
                      border: "1px solid #A7F3D0",
                      borderRadius: 8,
                      background: "#ECFDF5",
                    }}
                  >
                    {item.isImage && item.preview ? (
                      <img
                        src={item.preview}
                        alt="Receipt preview"
                        style={{
                          width: 36,
                          height: 36,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #6EE7B7",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          background: "#CCFBF1",
                          border: "1px solid #99F6E4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        📄
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#065F46",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#047857", marginTop: 1 }}>
                        {(item.size / 1024).toFixed(1)} KB · Ready to upload
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94A3B8",
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: "pointer",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone / Upload button */}
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: attachmentFiles.length > 0 ? "8px 12px" : "12px 14px",
                border: "1.5px dashed #CBD5E1",
                borderRadius: 8,
                background: "#F8FAFC",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0D9488", fontWeight: 800, fontSize: 12 }}>
                <span style={{ fontSize: 16 }}>{attachmentFiles.length > 0 ? "➕" : "📎"}</span>
                {attachmentFiles.length > 0 ? "Add More Proofs / Receipts" : "Upload Receipts / Screenshots / Slips"}
              </div>
              <span style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>
                Select one or multiple files · PNG, JPG, JPEG, WEBP or PDF (Max 10MB each)
              </span>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
            {payMode === "Cash" && (
              <button
                type="button"
                className="btn bs"
                style={{ background: "#F0FDFA", borderColor: "#99F6E4", color: "#0D9488", fontWeight: 800 }}
                onClick={() =>
                  generateCashVoucherPDF({
                    subJobNo: target.sub_job_no,
                    clientName: target.clientName || target.client,
                    amount: payAmount,
                    tdsAmount: tdsAmount,
                    grossAmount: Number(payAmount || 0) + Number(tdsAmount || 0),
                    personName: cashCollectedBy,
                    voucherNo: cashVoucherNo || refNo,
                    date: payDate,
                    notes: notes,
                  })
                }
              >
                📄 Print Cash Receipt PDF
              </button>
            )}
            <button
              type="button"
              className="btn bs"
              style={{ background: "white", borderColor: "#CBD5E1", color: "#64748B" }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bs bg"
              disabled={isSaving || isAlreadyPaid || maxDue <= 0}
              style={{
                padding: "8px 20px",
                fontSize: 12.5,
                fontWeight: 900,
                opacity: (isSaving || isAlreadyPaid || maxDue <= 0) ? 0.6 : 1,
                cursor: (isSaving || isAlreadyPaid || maxDue <= 0) ? "not-allowed" : "pointer",
                background: isAlreadyPaid ? "#94A3B8" : undefined,
                borderColor: isAlreadyPaid ? "#94A3B8" : undefined,
              }}
            >
              {isSaving ? "⏳ Saving..." : isAlreadyPaid ? "✓ Already Fully Paid" : "✅ Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Payment Receipt & Overview Modal
