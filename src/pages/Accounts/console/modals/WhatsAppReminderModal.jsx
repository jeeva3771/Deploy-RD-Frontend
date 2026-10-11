import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../utils/url/config";
import { useLoader } from "../../../../context/LoaderContext";

export default function WhatsAppReminderModal({ target, onClose }) {
  const { showLoader, hideLoader } = useLoader();
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [customNumber, setCustomNumber] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const clientName = target.clientName || target.client || "Client";
  const jobNo = target.sub_job_no || target.job_no || "";
  const totalAmount = Number(target.amount || target.quotationTotal || target.grandTotal || 0);
  const pendingBalance = Number(target.outstanding !== undefined ? target.outstanding : (target.due !== undefined ? target.due : 0));

  const formattedTotal = totalAmount > 0
    ? totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "0";
  const formattedPending = pendingBalance > 0
    ? pendingBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "0";

  // Initialize available numbers STRICTLY from sales order form wp_numbers only
  const [availableNumbers, setAvailableNumbers] = useState([]);

  useEffect(() => {
    const numSet = new Set();
    if (Array.isArray(target.wp_numbers)) {
      target.wp_numbers.forEach((n) => {
        const clean = String(n || "").trim().replace(/\D/g, "");
        if (clean.length >= 10) numSet.add(clean.length === 10 ? "91" + clean : clean);
      });
    }
    const list = Array.from(numSet);
    setAvailableNumbers(list);
    setSelectedNumbers(list);
  }, [target]);

  const handleToggleNumber = (num) => {
    setSelectedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const handleAddCustomNumber = () => {
    let clean = String(customNumber).trim().replace(/\D/g, "");
    if (clean.length === 10) clean = "91" + clean;
    if (clean.length >= 10) {
      if (!availableNumbers.includes(clean)) {
        setAvailableNumbers((prev) => [...prev, clean]);
        setSelectedNumbers((prev) => [...prev, clean]);
      }
      setCustomNumber("");
    } else {
      toast.warning("Please enter a valid 10-digit mobile number");
    }
  };

  const handleSendReminder = async () => {
    if (selectedNumbers.length === 0) {
      toast.warning("Please select at least one WhatsApp number to send the reminder.");
      return;
    }

    setIsSending(true);
    showLoader();
    setStatusMessage(null);

    try {
      const res = await axiosInstance.post("/accounts/send-whatsapp-reminder", {
        job_no: target.job_no || jobNo,
        sub_job_no: target.sub_job_no || jobNo,
        client_name: clientName,
        amount: totalAmount,
        outstanding: pendingBalance,
        numbers: selectedNumbers,
      });

      if (res.data?.success) {
        toast.success(`Payment reminder sent successfully to ${selectedNumbers.length} recipient(s) via 2Factor!`);
        setStatusMessage({
          type: "success",
          text: `✅ Payment reminder successfully sent to ${selectedNumbers.length} recipient(s) via 2Factor WhatsApp!`,
        });
      } else {
        toast.error(res.data?.message || "Could not send WhatsApp reminder");
        setStatusMessage({
          type: "error",
          text: "⚠️ Failed: " + (res.data?.message || "Could not send WhatsApp reminder"),
        });
      }
    } catch (err) {
      console.error("Error sending reminder:", err);
      toast.error(err.response?.data?.message || err.message);
      setStatusMessage({
        type: "error",
        text: "⚠️ Error: " + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsSending(false);
      hideLoader();
    }
  };

  // Construct direct WhatsApp message text for preview and wa.me fallback
  const messagePreview = `Hello ${clientName},
Reminder from *RD Custom Awards*:
A pending balance of *₹${formattedPending}* is due for your Order *#${jobNo}* (Total: ₹${formattedTotal}).
Kindly clear the balance for prompt delivery.
Thank you!
Accounts Team, RD Custom Awards`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 26, 46, 0.7)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          width: 580,
          maxWidth: "95vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          border: "1.5px solid #25D366",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #075E54 0%, #128C7E 100%)",
            color: "white",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>📲</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.5px" }}>
                Send WhatsApp Payment Reminder
              </div>
              {/* <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                Template: <b style={{ textDecoration: "underline" }}>payment reminder</b> · Powered by 2Factor
              </div> */}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {/* Order & Balance Summary */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 16,
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                Client & Job
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#0C1A2E", marginTop: 2 }}>
                {clientName}
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#0D9488", fontWeight: 800 }}>
                {jobNo}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                Total Order Value
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0C1A2E", fontFamily: "monospace", marginTop: 2 }}>
                Rs {formattedTotal}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#EF4444", textTransform: "uppercase" }}>
                Pending Balance Due
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#EF4444", fontFamily: "monospace", marginTop: 2 }}>
                Rs {formattedPending}
              </div>
            </div>
          </div>

          {/* WhatsApp Numbers from Sales Order Form */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase" }}>
                📱 Recipients (Sales Order Form wp_number)
              </label>
              <span style={{ fontSize: 10.5, color: "#059669", fontWeight: 700 }}>
                {selectedNumbers.length} selected
              </span>
            </div>

            {availableNumbers.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 8, padding: 8, background: "#FAFBFC" }}>
                {availableNumbers.map((num) => {
                  const isChecked = selectedNumbers.includes(num);
                  return (
                    <label
                      key={num}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "5px 8px",
                        background: isChecked ? "#ECFDF5" : "white",
                        border: "1px solid " + (isChecked ? "#A7F3D0" : "#E2E8F0"),
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleNumber(num)}
                        style={{ accentColor: "#059669", width: 15, height: 15 }}
                      />
                      <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0C1A2E" }}>
                        +{num}
                      </span>

                    </label>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 11.5, color: "#92400E" }}>
                ⚠️ No WhatsApp numbers found automatically in Sales Order Form for this job. Add a number below:
              </div>
            )}

            {/* Add Custom Number Input */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input
                type="text"
                className="inp"
                placeholder="Add another mobile number (e.g. 9840012345)"
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
                style={{ fontSize: 11.5, padding: "5px 10px" }}
              />
              <button
                type="button"
                className="btn bs"
                onClick={handleAddCustomNumber}
                style={{ background: "#F1F5F9", borderColor: "#CBD5E1", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}
              >
                ➕ Add Number
              </button>
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: "#0C1A2E", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              💬 WhatsApp Template Preview (Live):
            </label>
            <div
              style={{
                background: "#E5DDD5",
                borderRadius: 12,
                padding: "14px 16px",
                backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <div
                style={{
                  background: "#DCF8C6",
                  padding: "10px 14px",
                  borderRadius: "8px 8px 0 8px",
                  maxWidth: "92%",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  color: "#111827",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                  position: "relative",
                }}
              >
                <div>Hello <b style={{ color: "#065F46" }}>{clientName}</b>,</div>
                <div>Reminder from <b>*RD Custom Awards*</b>:</div>
                <div style={{ margin: "4px 0" }}>
                  A pending balance of <b style={{ color: "#DC2626" }}>*₹{formattedPending}*</b> is due for your Order <b style={{ color: "#0D9488" }}>*#{jobNo}*</b> (Total: ₹{formattedTotal}).
                </div>
                <div>Kindly clear the balance for prompt delivery.</div>
                <div style={{ marginTop: 4 }}>Thank you!</div>
                <div>Accounts Team, RD Custom Awards</div>
                <div style={{ textAlign: "right", fontSize: 10, color: "#64748B", marginTop: 4 }}>
                  Just now · ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 14,
                background: statusMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                border: "1.5px solid " + (statusMessage.type === "success" ? "#A7F3D0" : "#FECACA"),
                color: statusMessage.type === "success" ? "#065F46" : "#B91C1C",
              }}
            >
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "12px 20px",
            background: "#F8FAFC",
            borderTop: "1.5px solid #E2E8F0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn bs"
              onClick={onClose}
              style={{ background: "white", borderColor: "#CBD5E1", color: "#64748B" }}
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSending || selectedNumbers.length === 0}
              onClick={handleSendReminder}
              className="btn bs bg"
              style={{
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                border: "none",
                color: "white",
                fontWeight: 900,
                fontSize: 12,
                padding: "8px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.35)",
              }}
            >
              {isSending ? "⏳ Sending WhatsApp..." : `📲 Send Reminder (${selectedNumbers.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manual Payment Recording Modal
