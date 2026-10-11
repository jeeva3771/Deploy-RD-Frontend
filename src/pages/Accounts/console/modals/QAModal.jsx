import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchClientOutstanding,
  fetchSalesOrders,
  fetchVendorOutstanding,
  submitQuickAction,
} from "../../../../reducer/accountsReducer";

export default function QAModal({ action, onClose, onProceed }) {
  const [form, setForm] = useState({});
  const dispatch = useDispatch();

  // Get data from Redux Store
  const { clientData, vendorData, jobsData, loading } = useSelector(
    (state) => state.accounts,
  );

  // Derive unique lists for dropdowns
  const liveClients = Array.from(
    new Set(
      (clientData || []).map((c) => c.client || c.clientName).filter(Boolean),
    ),
  );

  const outstandingClients = Array.from(
    new Set(
      (clientData || [])
        .filter((c) => {
          const directOS = Number(c.totalOutstanding);
          if (directOS > 0) return true;
          const subJobsOS = (c.subjobs || []).reduce((s, j) => s + Math.max(0, Number(j.grandTotal || j.amount || 0) - Number(j.paid || 0)), 0);
          return subJobsOS > 0;
        })
        .map((c) => c.client || c.clientName)
        .filter(Boolean),
    ),
  );

  const outstandingVendors = Array.from(
    new Set(
      (vendorData || [])
        .filter((v) => {
          const directOS = Number(v.totalOutstanding);
          if (directOS > 0) return true;
          const billsOS = (v.bills || []).reduce((s, b) => s + Math.max(0, Number(b.amount || 0) - Number(b.paid || 0)), 0);
          return billsOS > 0;
        })
        .map((v) => v.vendorName)
        .filter(Boolean),
    ),
  );

  // Filter jobs for Create Invoice: exclude fully invoiced jobs based on exact quantities
  const validJobs = (jobsData || []).filter((j) => {
    if (action !== "Create Invoice") return true;

    const totalQty = Number(j.qty) || 0;

    // Calculate exact invoiced quantity from the invoices array
    let invoicedQty = 0;
    if (Array.isArray(j.invoices)) {
      invoicedQty = j.invoices.reduce(
        (sum, inv) => sum + (Number(inv.qty) || 0),
        0,
      );
    }

    // Only show jobs where we still have an uninvoiced balance
    return totalQty - invoicedQty > 0;
  });

  const liveJobs = Array.from(
    new Set(
      validJobs.map((j) => j.sub_job_no || j.id || j.job_no).filter(Boolean),
    ),
  );

  useEffect(() => {
    // Dispatch to fetch data if not already present in store
    if (!clientData || clientData.length === 0) {
      dispatch(fetchClientOutstanding());
    }
    if (!jobsData || jobsData.length === 0) {
      dispatch(fetchSalesOrders());
    }
    if (!vendorData || vendorData.length === 0) {
      dispatch(fetchVendorOutstanding());
    }
  }, [dispatch, clientData, jobsData, vendorData]);

  useEffect(() => {
    if (action === "Record Payment" && !form.paymentType) {
      setForm((p) => ({ ...p, paymentType: "Client" }));
    }
  }, [action, form.paymentType]);

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const selectedClientData = clientData?.find((c) => (c.client || c.clientName) === form.client);
  const selectedVendorData = vendorData?.find((v) => v.vendorName === form.vendor);

  const pendingClientJobs = (selectedClientData?.subjobs || [])
    .filter((sj) => {
      const amt = Number(sj.grandTotal || sj.quotationTotal || sj.amount || sj.finalJobPrice || sj.amt || 0);
      const paid = Number(sj.paid || 0);
      const due = sj.outstanding !== undefined ? Number(sj.outstanding) : amt - paid;
      return due > 0;
    })
    .map((sj) => sj.sub_job_no || sj.job_no);

  const pendingVendorBills = (selectedVendorData?.bills || [])
    .filter((b) => {
      const amt = Number(b.amount || 0);
      const paid = Number(b.paid || 0);
      const due = b.due !== undefined ? Number(b.due) : amt - paid;
      return due > 0;
    })
    .map((b) => b.assignment_id || b.bill_no);

  const handleJobSelect = (e) => {
    const jobRef = e.target.value;
    f("job", jobRef);

    if (action === "Create Invoice" && jobRef) {
      const selectedJob = (jobsData || []).find(
        (j) => (j.sub_job_no || j.id || j.job_no) === jobRef,
      );
      if (selectedJob) {
        const totalQty = Number(selectedJob.qty) || 0;

        let invoicedQty = 0;
        if (Array.isArray(selectedJob.invoices)) {
          invoicedQty = selectedJob.invoices.reduce(
            (sum, inv) => sum + (Number(inv.qty) || 0),
            0,
          );
        }
        const balanceQty = totalQty - invoicedQty;

        f("job", jobRef);
        f("jobObj", selectedJob); // Store the actual object
        f("qty", balanceQty > 0 ? balanceQty : totalQty);
        f("rate", selectedJob.unitPrice || selectedJob.rate || "");
        if (selectedJob.client || selectedJob.clientName) {
          f("client", selectedJob.client || selectedJob.clientName);
        }
      }
    }
  };
  const ICONS = {
    "Create Invoice": "🧾",
    "Create Challan": "📄",
    "E-Way Bill": "🚛",
    "New Sales Order": "📋",
    "Record Payment": "📥",
    "Export Report": "📊",
  };
  const COLORS = {
    "Create Invoice": { c: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
    "Create Challan": { c: "#0EA5E9", bg: "#E0F2FE", bd: "#BAE6FD" },
    "E-Way Bill": { c: "#F59E0B", bg: "#FFFBEB", bd: "#FDE68A" },
    "New Sales Order": { c: "#6366F1", bg: "#EEF2FF", bd: "#C7D2FE" },
    "Record Payment": { c: "#0D9488", bg: "#F0FDFA", bd: "#99F6E4" },
    "Export Report": { c: "#8B5CF6", bg: "#F5F3FF", bd: "#DDD6FE" },
  };
  const col = COLORS[action] || { c: "#0C1A2E", bg: "#F8FAFC", bd: "#E2E8F0" };
  const FIELDS = {
    "Create Invoice": [
      { k: "client", l: "Client", s: liveClients },
      { k: "job", l: "Job Ref", s: liveJobs },
    ],
    "Create Challan": [
      { k: "client", l: "Client", s: liveClients },
      { k: "job", l: "Job Ref", s: liveJobs },
    ],
    "E-Way Bill": [
      { k: "client", l: "Client", s: liveClients },
      { k: "job", l: "Invoice Ref", s: liveJobs },
    ],
    "Record Payment": [
      { k: "client", l: "Client", s: outstandingClients },
      { k: "targetJob", l: "Sub-Job No", s: pendingClientJobs },
    ],
  };
  const fields = FIELDS[action] || [];
  
  const submit = () => {
    if (action === "Record Payment") {
      if (!form.client || !form.targetJob) {
        toast.error("Please select a client and job.");
        return;
      }
      const selectedClient = clientData.find((c) => (c.client || c.clientName) === form.client);
      const selectedSubjob = selectedClient?.subjobs?.find((sj) => (sj.sub_job_no || sj.job_no) === form.targetJob);
      
      const amt = Number(selectedSubjob?.grandTotal || selectedSubjob?.quotationTotal || selectedSubjob?.amount || selectedSubjob?.finalJobPrice || selectedSubjob?.amt || 0);
      const paid = Number(selectedSubjob?.paid || 0);
      const due = selectedSubjob?.outstanding !== undefined ? Number(selectedSubjob.outstanding) : amt - paid;

      if (onProceed) {
        onProceed(action, {
          type: "Client",
          client: {
            ...selectedClient,
            ...selectedSubjob,
            amount: amt,
            paid: paid,
            due: due,
            outstanding: due,
            clientId: selectedClient?.id || selectedClient?.job_no,
          },
        });
      }
    } else {
      if (!form.job) {
        toast.error("Please select a job.");
        return;
      }
      const selectedJob = form.jobObj || (jobsData || []).find((j) => (j.sub_job_no || j.id || j.job_no) === form.job);
      if (onProceed) onProceed(action, { job: selectedJob });
    }
  };

  const tax = 0;
  const total = 0;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          width: 540,
          maxHeight: "88vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            background: col.bg,
            borderBottom: "1.5px solid " + col.bd,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div className="flx10">
            <span style={{ fontSize: 24 }}>{ICONS[action]}</span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: col.c,
                  textTransform: "uppercase",
                }}
              >
                {action}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: col.c,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                Complete the form and submit
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
              color: "#94A3B8",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 18 }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: col.c }}>
                Fetching Live Data...
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 6 }}>
                Please wait while we sync clients & jobs.
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {fields.map((fd) => (
                  <div
                    key={fd.k}
                    style={{ gridColumn: fd.full ? "1/-1" : "auto" }}
                  >
                    <div className="lbl">{fd.l}</div>
                    {fd.s ? (
                      <select
                        className="sel"
                        value={form[fd.k] || ""}
                        onChange={(e) =>
                          fd.k === "job"
                            ? handleJobSelect(e)
                            : f(fd.k, e.target.value)
                        }
                      >
                        <option value="">Select...</option>
                        {fd.s.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="inp"
                        type={fd.t || "text"}
                        value={form[fd.k] || ""}
                        onChange={(e) => f(fd.k, e.target.value)}
                        placeholder={fd.ph || ""}
                      />
                    )}
                  </div>
                ))}
              </div>
              {total > 0 && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#065F46" }}>
                    Taxable:{" "}
                    <b style={{ fontFamily: "monospace" }}>
                      Rs{" "}
                      {(
                        parseInt(form.qty) * parseInt(form.rate)
                      ).toLocaleString("en-IN")}
                    </b>
                  </span>
                  <span style={{ color: "#065F46" }}>
                    GST {form.gst || 18}%:{" "}
                    <b style={{ fontFamily: "monospace" }}>
                      Rs {tax.toLocaleString("en-IN")}
                    </b>
                  </span>
                  <span style={{ color: "#059669", fontSize: 14 }}>
                    Total:{" "}
                    <b style={{ fontFamily: "monospace" }}>
                      Rs {total.toLocaleString("en-IN")}
                    </b>
                  </span>
                </div>
              )}
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  className="btn bs"
                  style={{
                    background: "#F8FAFC",
                    borderColor: "#E2E8F0",
                    color: "#64748B",
                  }}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="btn bl"
                  style={{
                    background: col.bg,
                    color: col.c,
                    borderColor: col.bd,
                  }}
                  onClick={submit}
                >
                  Proceed to {action}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Scoped Stylesheet String
