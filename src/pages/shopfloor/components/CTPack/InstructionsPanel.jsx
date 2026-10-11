import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchDeliveryModes, fetchWhoWillPay } from "../../../../reducer/commonReducer";
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { getTargetPackQty } from './constants';

export function InstructionsPanel({ job, onUpdate, onLog, advance }) {
  const defaultNote = job.instructionNote && job.instructionNote !== "Instructions for packing"
    ? job.instructionNote
    : (job.sales_order?.packing_instruction || job.sales_order?.remarks || job.instructionNote || "");
  const [note, setNote] = useState(defaultNote);
  const qcTotal = (job.qcAcceptedQty && job.qcAcceptedQty > 0) ? job.qcAcceptedQty : (job.total_qty || job.qty || 0);
  const pendingQty = Math.max(0, qcTotal - (job.deliveredQty || 0));

  // Separate already delivered destinations from pending destinations
  let cumDel = 0;
  const alreadyDeliveredDests = [];
  const pendingDests = [];
  (job.destinations || []).forEach(d => {
    const dQty = parseInt(d.qty) || 0;
    if (cumDel < (job.deliveredQty || 0)) {
      alreadyDeliveredDests.push(d);
    } else {
      pendingDests.push(d);
    }
    cumDel += dQty;
  });

  const initialDestType = job.destinationType || (
    (pendingDests.length > 1) ||
    String(job.sales_order?.delivery_type || "").toLowerCase().includes("multi")
      ? "multiple"
      : "single"
  );
  const [destType, setDestType] = useState(initialDestType);
  const [singleAddr, setSingleAddr] = useState(job.sales_order?.delivery_address || "");
  const [singleName, setSingleName] = useState(job.sales_order?.contact_person || job.sales_order?.client_name || "");
  const [destList, setDestList] = useState(() => {
    if (pendingDests.length > 0) {
      return pendingDests;
    }
    if ((job.deliveredQty || 0) === 0 && Array.isArray(job.destinations) && job.destinations.length > 0) {
      return job.destinations;
    }
    if (job.sales_order?.multi_deliveries?.length > 0) {
      return job.sales_order.multi_deliveries.map((md, idx) => ({
        id: "d_" + idx,
        name: md.companyName || md.company_name || md.contactName || md.contact_person || "",
        addr: md.deliveryLocation || md.delivery_address || "",
        qty: Number(md.quantity) || 0,
        contact_person: md.contactName || md.contact_person || "",
        contact_number: md.contactNumber || md.contact_number || md.mobile_no || "",
        delivery_mode: md.deliveryMode || md.delivery_mode || "",
        custom_delivery_mode: md.customDeliveryMode || md.custom_delivery_mode || "",
        who_will_pay: md.whoWillPay || md.who_will_pay || "",
        courier_amount: md.courierAmount || md.courier_amount || "",
        add_in_invoice: md.addInInvoice || md.add_in_invoice || false,
        awb: "", courier: "", status: "pending"
      }));
    }
    return [];
  });
  const [newDest, setNewDest] = useState({ name: "", contact_person: "", contact_number: "", addr: "", qty: "", delivery_mode: "", custom_delivery_mode: "", who_will_pay: "", courier_amount: "", add_in_invoice: false });
  const [editId, setEditId] = useState(null);
  const [editRemarks, setEditRemarks] = useState("");
  const [singleEditRemarks, setSingleEditRemarks] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [destToDelete, setDestToDelete] = useState(null);
  const [deleteRemarks, setDeleteRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectDestType = (type) => {
    setDestType(type);
    if (type === "multiple" && destList.length === 0) {
      if (pendingDests.length > 0) {
        setDestList(pendingDests);
      }
    }
  };

  const dispatch = useDispatch();
  const { deliveryModes, whoWillPayOptions } = useSelector((state) => state.commondropdowns || {});

  useEffect(() => {
    dispatch(fetchDeliveryModes());
    dispatch(fetchWhoWillPay());
  }, [dispatch]);

  const [isEditingSingle, setIsEditingSingle] = useState(false);
  const existingSingle = job.destinations?.length && job.destinationType === "single" ? job.destinations[0] : {};
  const isNewSingle = !existingSingle.delivery_mode;
  const showInputs = isEditingSingle || isNewSingle;
  const isSoMulti = String(job.sales_order?.delivery_type || "").toLowerCase().includes("multi");

  const [singleData, setSingleData] = useState({
    delivery_type: job.sales_order?.delivery_type || "",
    delivery_mode: existingSingle.delivery_mode || (isSoMulti ? "" : job.sales_order?.delivery_mode) || "",
    custom_delivery_mode: existingSingle.custom_delivery_mode || (isSoMulti ? "" : job.sales_order?.custom_delivery_mode) || "",
    who_will_pay: existingSingle.who_will_pay || (isSoMulti ? "" : job.sales_order?.who_will_pay) || "",
    courier_amount: existingSingle.courier_amount || (isSoMulti ? "" : job.sales_order?.courier_amount) || "",
    add_in_invoice: existingSingle.add_in_invoice !== undefined ? existingSingle.add_in_invoice : (isSoMulti ? false : job.sales_order?.add_in_invoice) || false,
    delivery_address: existingSingle.addr || (isSoMulti ? "" : job.sales_order?.delivery_address) || "",
    contact_person: existingSingle.contact_person || (isSoMulti ? "" : job.sales_order?.contact_person) || job.sales_order?.client_name || job.client || "",
    contact_number: existingSingle.contact_number || (isSoMulti ? "" : job.sales_order?.contact_number) || job.sales_order?.mobile_no || job.sales_order?.phone || ""
  });

  function addDestination() {
    if (!newDest.contact_person || !newDest.contact_number || !newDest.qty || !newDest.addr || !newDest.delivery_mode) {
      toast.error("Please fill all mandatory fields (Contact Person, Number, Quantity, Address, Delivery Mode).");
      return;
    }
    if (newDest.contact_number.length !== 10) {
      toast.error("Contact Number must be exactly 10 digits.");
      return;
    }
    if ((newDest.delivery_mode === "Break" || newDest.delivery_mode === "Hand Delivery + Courier" || newDest?.delivery_mode === "Hand Delivery & Courier" || singleData?.delivery_mode === "Hand Delivery & Courier") && !newDest.custom_delivery_mode) {
      toast.error(`Please enter details for ${newDest.delivery_mode}.`);
      return;
    }
    if (newDest.delivery_mode !== "Client Pickup") {
      if (!newDest.who_will_pay) {
        toast.error("Please select Who Will Pay.");
        return;
      }
      if (newDest.who_will_pay === "RD Courier" && !newDest.courier_amount) {
        toast.error("Please select Courier Amount.");
        return;
      }
    }

    const enteredQty = parseInt(newDest.qty) || 0;
    const qcTotal = (job.qcAcceptedQty && job.qcAcceptedQty > 0) ? job.qcAcceptedQty : (job.total_qty || job.qty || 0);
    const inwardedQty = qcTotal - (job.deliveredQty || 0);

    if (destList.length === 0 && (job.deliveredQty || 0) === 0 && enteredQty >= pendingQty && pendingQty > 1) {
      toast.error(`You cannot assign the full quantity (${pendingQty} pcs) to a single split. Use Single Destination instead.`);
      return;
    }

    let currentSum = destList.reduce((acc, d) => acc + (parseInt(d.qty) || 0), 0);
    if (editId) {
      const oldD = destList.find(d => d.id === editId);
      if (oldD) currentSum -= (parseInt(oldD.qty) || 0);
    }

    if (currentSum + enteredQty > pendingQty) {
      toast.error(`Total quantity cannot exceed pending quantity to dispatch (${pendingQty} pcs). You have ${Math.max(0, pendingQty - currentSum)} pcs left.`);
      return;
    }

    if (editId) {
      if (!editRemarks.trim()) {
        toast.error("Remarks are mandatory when editing a destination.");
        return;
      }
      const oldD = destList.find(d => d.id === editId);
      let diffs = [];
      if (oldD.name !== newDest.name) diffs.push(`Name: ${oldD.name || '-'} ➔ ${newDest.name}`);
      if (oldD.contact_person !== newDest.contact_person) diffs.push(`Contact: ${oldD.contact_person || '-'} ➔ ${newDest.contact_person}`);
      if (oldD.contact_number !== newDest.contact_number) diffs.push(`Phone: ${oldD.contact_number || '-'} ➔ ${newDest.contact_number}`);
      if (oldD.addr !== newDest.addr) diffs.push(`Address: ${oldD.addr || '-'} ➔ ${newDest.addr}`);
      if (String(oldD.qty) !== String(newDest.qty)) diffs.push(`Qty: ${oldD.qty || 0} ➔ ${newDest.qty}`);
      if (oldD.delivery_mode !== newDest.delivery_mode) diffs.push(`Mode: ${oldD.delivery_mode || '-'} ➔ ${newDest.delivery_mode}`);
      if (oldD.custom_delivery_mode !== newDest.custom_delivery_mode) diffs.push(`Custom Mode: ${oldD.custom_delivery_mode || '-'} ➔ ${newDest.custom_delivery_mode}`);
      if (oldD.who_will_pay !== newDest.who_will_pay) diffs.push(`Payer: ${oldD.who_will_pay || '-'} ➔ ${newDest.who_will_pay}`);
      if (oldD.courier_amount !== newDest.courier_amount) diffs.push(`Courier Amt: ${oldD.courier_amount || '-'} ➔ ${newDest.courier_amount}`);
      if (oldD.add_in_invoice !== newDest.add_in_invoice) diffs.push(`Add to Inv: ${oldD.add_in_invoice ? 'Yes' : 'No'} ➔ ${newDest.add_in_invoice ? 'Yes' : 'No'}`);

      if (diffs.length > 0) {
        onLog(`📝 Destination Edited (${newDest.name || newDest.contact_person || 'Unnamed'}) — Reason: ${editRemarks} | Changes: ${diffs.join(', ')}`);
      }

      setDestList((prev) => prev.map(d => d.id === editId ? {
        ...d,
        name: newDest.name,
        contact_person: newDest.contact_person,
        contact_number: newDest.contact_number,
        addr: newDest.addr,
        qty: parseInt(newDest.qty) || 0,
        delivery_mode: newDest.delivery_mode,
        custom_delivery_mode: newDest.custom_delivery_mode,
        who_will_pay: newDest.who_will_pay,
        courier_amount: newDest.courier_amount,
        add_in_invoice: newDest.add_in_invoice,
        edit_remarks: editRemarks,
      } : d));
      setEditId(null);
      setEditRemarks("");
    } else {
      setDestList((prev) => [...prev, {
        id: "d_" + Date.now(),
        name: newDest.name,
        contact_person: newDest.contact_person,
        contact_number: newDest.contact_number,
        addr: newDest.addr,
        qty: parseInt(newDest.qty) || 0,
        delivery_mode: newDest.delivery_mode,
        custom_delivery_mode: newDest.custom_delivery_mode,
        who_will_pay: newDest.who_will_pay,
        courier_amount: newDest.courier_amount,
        add_in_invoice: newDest.add_in_invoice,
        awb: "", courier: "", status: "pending",
      }]);
    }
    setNewDest({ name: "", contact_person: "", contact_number: "", addr: "", qty: "", delivery_mode: "", custom_delivery_mode: "", who_will_pay: "", courier_amount: "", add_in_invoice: false });
  }
  function confirmDelete() {
    if (!deleteRemarks.trim()) {
      toast.error("Please enter a reason for removing this destination.");
      return;
    }
    setDestList((prev) => prev.filter((d) => d.id !== destToDelete));
    onLog(`🗑️ Destination removed — Reason: ${deleteRemarks}`);
    setDeleteModalOpen(false);
    setDestToDelete(null);
    setDeleteRemarks("");
  }

  async function save() {
    if (isSubmitting) return;
    const qcAccepted = job.qcAcceptedQty || 0;
    if (qcAccepted <= 0) {
      toast.error("Please inward at least 1 qty from QC in Step 1 (Receive QC) before proceeding.");
      return;
    }

    if (destType === "single") {
      if (!singleData.contact_person || !singleData.contact_person.trim()) {
        toast.error("Please enter Contact Person for Single Destination.");
        return;
      }
      if (!singleData.contact_number || String(singleData.contact_number).trim().length !== 10) {
        toast.error("Contact Number must be exactly 10 digits.");
        return;
      }
      if (!singleData.delivery_mode || !singleData.delivery_address) {
        toast.error("Please fill all mandatory fields for Single Destination.");
        return;
      }
      if ((singleData.delivery_mode === "Break" || singleData.delivery_mode === "Hand Delivery + Courier" || newDest?.delivery_mode === "Hand Delivery & Courier" || singleData?.delivery_mode === "Hand Delivery & Courier") && !singleData.custom_delivery_mode) {
        toast.error(`Please enter details for ${singleData.delivery_mode}.`);
        return;
      }
      if (singleData.delivery_mode !== "Client Pickup") {
        if (!singleData.who_will_pay) {
          toast.error("Please select Who Will Pay.");
          return;
        }
        if (singleData.who_will_pay === "RD Courier" && !singleData.courier_amount) {
          toast.error("Please select Courier Amount.");
          return;
        }
      }
    } else if (destType === "multiple") {
      if (destList.length === 0) {
        toast.error("Please add at least one destination.");
        return;
      }
      for (let i = 0; i < destList.length; i++) {
        const d = destList[i];
        if (!d.contact_person || !String(d.contact_person).trim()) {
          toast.error(`Please enter Contact Person for destination #${i + 1} (${d.addr || 'Destination'}).`);
          return;
        }
        if (!d.contact_number || String(d.contact_number).trim().length !== 10) {
          toast.error(`Please enter valid 10-digit Contact Number for destination #${i + 1} (${d.contact_person || d.addr || 'Destination'}).`);
          return;
        }
      }
      const currentSum = destList.reduce((acc, d) => acc + (parseInt(d.qty) || 0), 0);
      if (currentSum <= 0) {
        toast.error("Please allocate at least 1 qty for destinations.");
        return;
      }
      if (currentSum > pendingQty) {
        toast.error(`Total split quantity (${currentSum} pcs) cannot exceed the pending quantity (${pendingQty} pcs).`);
        return;
      }
    }

    let dests;
    if (destType === "single") {
      const activeSingleDest = {
        id: (alreadyDeliveredDests.length > 0 ? ("d_" + Date.now()) : (existingSingle?.id || "d1")),
        name: singleData.contact_person || singleName || "Delivery Destination",
        contact_person: singleData.contact_person || singleName,
        contact_number: singleData.contact_number || "",
        addr: singleData.delivery_address,
        qty: pendingQty,
        delivery_mode: singleData.delivery_mode,
        custom_delivery_mode: singleData.custom_delivery_mode,
        who_will_pay: singleData.who_will_pay,
        courier_amount: singleData.courier_amount,
        add_in_invoice: singleData.add_in_invoice,
        edit_remarks: singleData.edit_remarks,
        awb: existingSingle?.awb || "", 
        courier: existingSingle?.courier || "", 
        status: existingSingle?.status || "pending",
        challanFile: existingSingle?.challanFile || "",
        awbFile: existingSingle?.awbFile || "",
        misLabelFile: existingSingle?.misLabelFile || ""
      };
      dests = alreadyDeliveredDests.length > 0 ? [...alreadyDeliveredDests, activeSingleDest] : [activeSingleDest];
    } else {
      dests = alreadyDeliveredDests.length > 0 ? [...alreadyDeliveredDests, ...destList] : destList;
    }

    setIsSubmitting(true);
    const finalDestType = (dests.length > 1 || destType === "multiple") ? "multiple" : "single";
    const patch = { instructionNote: note, destinationType: finalDestType, instructionType: "single", destinations: dests };

    const success = await advance("challan", "→ Instructions confirmed, moved to Delivery Challan Entry", patch);
    if (success) {
      onLog(`📋 Instructions saved — ${finalDestType} destination · Manual entry · ${dests.length} destination(s)`);
    }

    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  }

  return (
    <PCard title="Step 3 — Processing Instructions & Dispatch File" icon="📋" color="#0EA5E9" bg="#F0F9FF">
      {job.qc_bad_qty > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
            QC Audit Note: <b>{job.qc_bad_qty} pcs</b> were rejected during QC audit. Target packing quantity for dispatch is <b>{(job.qty || job.total_qty) - job.qc_bad_qty} pcs</b>.
          </span>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#0369A1", textTransform: "uppercase", marginBottom: 6 }}>Destination Type</div>
        <div className="rdpk-flex-wrap">
          {[["single", "📍 Single Destination"], ["multiple", "📍 Multiple Destinations"]].map(([k, l]) => (
            <div key={k} onClick={() => handleSelectDestType(k)}
              style={{ background: destType === k ? "#0EA5E9" : "white", color: destType === k ? "white" : "#64748B", border: `1.5px solid ${destType === k ? "#0EA5E9" : "#E2E8F0"}`, borderRadius: 10, padding: 10, textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 800, transition: "all 0.15s" }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {destType === "single" && (
        <div style={{ marginBottom: 10 }}>
          {job.sales_order && (
            <div style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 8, background: "#F8FAFC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>Single Destination Details</span>
                  <span style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                    Qty: {((job.qcAcceptedQty && job.qcAcceptedQty > 0) ? job.qcAcceptedQty : (job.total_qty || job.qty || 0)) - (job.deliveredQty || 0)} pcs (Pending Dispatch)
                  </span>
                  {(job.deliveredQty || 0) > 0 && (
                    <span style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      Already Dispatched: {job.deliveredQty} pcs
                    </span>
                  )}
                </div>
                {!isNewSingle && (
                  isEditingSingle ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <div onClick={() => { setIsEditingSingle(false); setSingleEditRemarks(""); }} style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", cursor: "pointer" }}>Cancel</div>
                      <div onClick={() => {
                        if (!singleData.delivery_mode || !singleData.delivery_address || !singleData.contact_person || !singleData.contact_number) {
                          toast.error("Please fill all mandatory fields (Contact Person, Contact Number, Delivery Mode, Address).");
                          return;
                        }
                        if (singleData.contact_number.length !== 10) {
                          toast.error("Contact Number must be exactly 10 digits.");
                          return;
                        }
                        if ((singleData.delivery_mode === "Break" || singleData.delivery_mode === "Hand Delivery + Courier" || newDest?.delivery_mode === "Hand Delivery & Courier" || singleData?.delivery_mode === "Hand Delivery & Courier") && !singleData.custom_delivery_mode) {
                          toast.error(`Please enter details for ${singleData.delivery_mode}.`);
                          return;
                        }
                        if (singleData.delivery_mode !== "Client Pickup") {
                          if (!singleData.who_will_pay) {
                            toast.error("Please select Who Will Pay.");
                            return;
                          }
                          if (singleData.who_will_pay === "RD Courier" && !singleData.courier_amount) {
                            toast.error("Please select Courier Amount.");
                            return;
                          }
                        }
                        if (!singleEditRemarks.trim()) { toast.error("Remarks are mandatory when editing."); return; }

                        let diffs = [];
                        if (existingSingle.contact_person !== singleData.contact_person) diffs.push(`Contact Person: ${existingSingle.contact_person || '-'} ➔ ${singleData.contact_person}`);
                        if (existingSingle.contact_number !== singleData.contact_number) diffs.push(`Contact Number: ${existingSingle.contact_number || '-'} ➔ ${singleData.contact_number}`);
                        if (existingSingle.delivery_mode !== singleData.delivery_mode) diffs.push(`Mode: ${existingSingle.delivery_mode || '-'} ➔ ${singleData.delivery_mode}`);
                        if (existingSingle.custom_delivery_mode !== singleData.custom_delivery_mode) diffs.push(`Custom Mode: ${existingSingle.custom_delivery_mode || '-'} ➔ ${singleData.custom_delivery_mode}`);
                        if (existingSingle.who_will_pay !== singleData.who_will_pay) diffs.push(`Payer: ${existingSingle.who_will_pay || '-'} ➔ ${singleData.who_will_pay}`);
                        if (existingSingle.courier_amount !== singleData.courier_amount) diffs.push(`Courier Amt: ${existingSingle.courier_amount || '-'} ➔ ${singleData.courier_amount}`);
                        if (existingSingle.add_in_invoice !== singleData.add_in_invoice) diffs.push(`Add to Inv: ${existingSingle.add_in_invoice ? 'Yes' : 'No'} ➔ ${singleData.add_in_invoice ? 'Yes' : 'No'}`);
                        if (existingSingle.addr !== singleData.delivery_address) diffs.push(`Address: ${existingSingle.addr || '-'} ➔ ${singleData.delivery_address}`);

                        if (diffs.length > 0) {
                          onLog(`📝 Single Destination Edited — Reason: ${singleEditRemarks} | Changes: ${diffs.join(', ')}`);
                        }

                        setSingleData({ ...singleData, edit_remarks: singleEditRemarks });
                        setIsEditingSingle(false);
                        setSingleEditRemarks("");
                      }} style={{ fontSize: 13, fontWeight: 700, color: "#059669", cursor: "pointer" }}>Save Edits</div>
                    </div>
                  ) : (
                    <div onClick={() => setIsEditingSingle(true)} style={{ fontSize: 13, fontWeight: 700, color: "#0EA5E9", cursor: "pointer" }}>Edit</div>
                  )
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: singleData.delivery_mode === "Client Pickup" ? "1fr" : "1fr 1fr", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Delivery Mode <span style={{ color: "#EF4444" }}>*</span></div>
                    {showInputs ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <select value={singleData.delivery_mode || ""} onChange={e => {
                          const val = e.target.value;
                          setSingleData({ ...singleData, delivery_mode: val, who_will_pay: val === "Client Pickup" ? "" : singleData.who_will_pay });
                        }}
                          style={{ width: "100%", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#FFF", outline: "none" }}>
                          <option value="">Select Mode</option>
                          {deliveryModes?.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
                        </select>
                        {(singleData.delivery_mode === "Break" || singleData.delivery_mode === "Hand Delivery + Courier" || newDest?.delivery_mode === "Hand Delivery & Courier" || singleData?.delivery_mode === "Hand Delivery & Courier") && (
                          <input type="text" value={singleData.custom_delivery_mode || ""} onChange={e => setSingleData({ ...singleData, custom_delivery_mode: e.target.value })} placeholder={`Enter details for ${singleData.delivery_mode}`} style={{ width: "100%", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#FFF", outline: "none" }} />
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <input value={singleData.delivery_mode || "-"} readOnly style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#F8FAFC" }} />
                        {(singleData.delivery_mode === "Break" || singleData.delivery_mode === "Hand Delivery + Courier" || newDest?.delivery_mode === "Hand Delivery & Courier" || singleData?.delivery_mode === "Hand Delivery & Courier") && (
                          <input value={singleData.custom_delivery_mode || "-"} readOnly style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#F8FAFC" }} />
                        )}
                      </div>
                    )}
                  </div>
                  {singleData.delivery_mode !== "Client Pickup" && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Who Will Pay <span style={{ color: "#EF4444" }}>*</span></div>
                      {showInputs ? (
                        <select value={singleData.who_will_pay || ""} onChange={e => setSingleData({ ...singleData, who_will_pay: e.target.value })}
                          style={{ width: "100%", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#FFF", outline: "none" }}>
                          <option value="">Select Payer</option>
                          {whoWillPayOptions?.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
                        </select>
                      ) : (
                        <input value={singleData.who_will_pay || "-"} readOnly style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#F8FAFC" }} />
                      )}
                    </div>
                  )}
                </div>

                {singleData.who_will_pay === "RD Courier" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Courier Amount <span style={{ color: "#EF4444" }}>*</span></div>
                      {showInputs ? (
                        <select value={singleData.courier_amount || ""} onChange={e => setSingleData({ ...singleData, courier_amount: e.target.value })}
                          style={{ width: "100%", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#FFF", outline: "none" }}>
                          <option value="">Select Amount</option>
                          <option value="50% RD">50% RD</option>
                          <option value="100% RD">100% RD</option>
                        </select>
                      ) : (
                        <input value={singleData.courier_amount || "-"} readOnly style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#F8FAFC" }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Add to Invoice</div>
                      {showInputs ? (
                        <label style={{ display: "flex", alignItems: "center", gap: 6, height: "34px", paddingLeft: 4 }}>
                          <input type="checkbox" checked={singleData.add_in_invoice} onChange={e => setSingleData({ ...singleData, add_in_invoice: e.target.checked })} />
                          Yes
                        </label>
                      ) : (
                        <input value={singleData.add_in_invoice ? "Yes" : "No"} readOnly style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#F8FAFC" }} />
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Contact Person <span style={{ color: "#EF4444" }}>*</span></div>
                    <input
                      value={showInputs ? (singleData.contact_person || "") : (singleData.contact_person || "-")}
                      readOnly={!showInputs}
                      onChange={e => setSingleData({ ...singleData, contact_person: e.target.value })}
                      placeholder="Contact Person Name"
                      style={{ width: "100%", border: showInputs ? "1px solid #CBD5E1" : "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: showInputs ? "#FFF" : "#F8FAFC" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Contact Number <span style={{ color: "#EF4444" }}>*</span></div>
                    <input
                      value={showInputs ? (singleData.contact_number || "") : (singleData.contact_number || "")}
                      readOnly={!showInputs}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setSingleData({ ...singleData, contact_number: val });
                      }}
                      placeholder="10-digit mobile number"
                      style={{ width: "100%", border: showInputs ? "1px solid #CBD5E1" : "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: showInputs ? "#FFF" : "#F8FAFC" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>Delivery Location <span style={{ color: "#EF4444" }}>*</span></div>
                    <input value={showInputs ? (singleData.delivery_address || "") : (singleData.delivery_address || "-")} readOnly={!showInputs} onChange={e => setSingleData({ ...singleData, delivery_address: e.target.value })} style={{ width: "100%", border: showInputs ? "1px solid #CBD5E1" : "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: showInputs ? "#FFF" : "#F8FAFC" }} />
                  </div>
                </div>

                {isEditingSingle && !isNewSingle && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 2 }}>Reason for Edit <span style={{ color: "#EF4444" }}>*</span></div>
                      <input value={singleEditRemarks} onChange={e => setSingleEditRemarks(e.target.value)} placeholder="Reason for change..." style={{ width: "100%", border: "1.5px solid #F59E0B", borderRadius: 6, padding: "6px 8px", fontSize: 14, color: "#475569", background: "#FFFBEB" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {destType === "multiple" && (
        <div style={{ marginBottom: 10 }}>
          {alreadyDeliveredDests.length > 0 && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔒 Previously Dispatched: <b>{job.deliveredQty} pcs</b></span>
                <span style={{ fontSize: 11, background: "#DCFCE7", padding: "1px 6px", borderRadius: 4 }}>Completed</span>
              </div>
              {alreadyDeliveredDests.map((d, i) => (
                <div key={d.id || i} style={{ fontSize: 12, color: "#374151", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderTop: i > 0 ? "1px dashed #DCFCE7" : "none" }}>
                  <span><b>#{i + 1}</b> {d.contact_person || d.name} · {d.delivery_mode} · {d.addr || '-'}</span>
                  <span style={{ fontWeight: 800, color: "#15803D" }}>{d.qty} pcs ✓</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 10, padding: 10, marginBottom: 8 }}>
            {(() => {
              const splitSum = destList.reduce((acc, d) => acc + (parseInt(d.qty) || 0), 0);
              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0369A1", textTransform: "uppercase" }}>
                    Destinations for Current Dispatch ({destList.length})
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 12, fontWeight: 800, flexWrap: "wrap" }}>
                    <span style={{ background: "#E0F2FE", color: "#0369A1", padding: "3px 8px", borderRadius: 6, border: "1px solid #BAE6FD" }}>
                      Total QC: {qcTotal} pcs
                    </span>
                    {(job.deliveredQty || 0) > 0 && (
                      <span style={{ background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
                        Already Dispatched: {job.deliveredQty} pcs
                      </span>
                    )}
                    <span style={{ background: splitSum > 0 && splitSum <= pendingQty ? "#DCFCE7" : "#FEF3C7", color: splitSum > 0 && splitSum <= pendingQty ? "#166534" : "#B45309", padding: "3px 8px", borderRadius: 6, border: `1px solid ${splitSum > 0 && splitSum <= pendingQty ? "#86EFAC" : "#FDE68A"}` }}>
                      Allocated: {splitSum} / {pendingQty} pcs (Pending)
                    </span>
                  </div>
                </div>
              );
            })()}
            {destList.map((d) => (
              <div key={d.id} style={{ padding: "10px", marginBottom: "8px", background: editId === d.id ? "#FEF3C7" : "#ffffff", border: editId === d.id ? "1.5px solid #F59E0B" : "1px solid #E0F2FE", borderRadius: 8, position: "relative" }}>
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 10, alignItems: "center" }}>
                  <span onClick={() => { setNewDest({ ...d }); setEditId(d.id); }} style={{ color: "#0EA5E9", fontWeight: 700, cursor: "pointer", fontSize: 12, padding: 4 }}>✎ Edit</span>
                  <span onClick={() => { setDestToDelete(d.id); setDeleteRemarks(""); setDeleteModalOpen(true); }} style={{ color: "#EF4444", fontWeight: 900, cursor: "pointer", padding: 4 }}>✕</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", paddingRight: "70px", marginTop: "4px" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Contact Person</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{d.contact_person || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Contact Number</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{d.contact_number || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Quantity</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0EA5E9" }}>{d.qty} pcs</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Delivery Mode</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
                      {d.delivery_mode || "-"}
                      {d.custom_delivery_mode ? ` (${d.custom_delivery_mode})` : ""}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Who Will Pay</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{d.who_will_pay || "-"}</div>
                  </div>
                  {d.who_will_pay === "RD Courier" && (
                    <>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Courier Amount</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{d.courier_amount || "-"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Add to Invoice</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{d.add_in_invoice ? "Yes" : "No"}</div>
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>Delivery Location</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{d.addr || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
            {destList.length === 0 && <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 700, marginTop: 8 }}>No destinations added yet for this dispatch</div>}
          </div>

          <div style={{ marginBottom: 12, padding: "10px", background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>Add New Destination</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Contact Person <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={newDest.contact_person} onChange={(e) => setNewDest({ ...newDest, contact_person: e.target.value })} placeholder="Contact Person"
                  style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Contact Number <span style={{ color: "#EF4444" }}>*</span></label>
                <input maxLength={10} value={newDest.contact_number} onChange={(e) => setNewDest({ ...newDest, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Contact Number"
                  style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Quantity <span style={{ color: "#EF4444" }}>*</span></label>
                <input type="text" value={newDest.qty} onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  val = val.replace(/^0+/, '');
                  setNewDest({ ...newDest, qty: val });
                }} placeholder="Quantity"
                  style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: newDest.delivery_mode === "Client Pickup" ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Delivery Mode <span style={{ color: "#EF4444" }}>*</span></label>
                  <select value={newDest.delivery_mode} onChange={(e) => {
                    const val = e.target.value;
                    setNewDest({ ...newDest, delivery_mode: val, who_will_pay: val === "Client Pickup" ? "" : newDest.who_will_pay });
                  }}
                    style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }}>
                    <option value="">Select Delivery Mode</option>
                    {deliveryModes?.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                {(newDest.delivery_mode === "Break" || newDest.delivery_mode === "Hand Delivery + Courier" || newDest?.delivery_mode === "Hand Delivery & Courier" || singleData?.delivery_mode === "Hand Delivery & Courier") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <input type="text" value={newDest.custom_delivery_mode} onChange={e => setNewDest({ ...newDest, custom_delivery_mode: e.target.value })} placeholder={`Enter details for ${newDest.delivery_mode}`} style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }} />
                  </div>
                )}
              </div>
              {newDest.delivery_mode !== "Client Pickup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Who Will Pay <span style={{ color: "#EF4444" }}>*</span></label>
                    <select value={newDest.who_will_pay} onChange={(e) => setNewDest({ ...newDest, who_will_pay: e.target.value })}
                      style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }}>
                      <option value="">Select Who Will Pay</option>
                      {whoWillPayOptions?.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
                    </select>
                  </div>
                  {newDest.who_will_pay === "RD Courier" && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Courier Amount <span style={{ color: "#EF4444" }}>*</span></label>
                        <select value={newDest.courier_amount} onChange={(e) => setNewDest({ ...newDest, courier_amount: e.target.value })}
                          style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }}>
                          <option value="">Select Amount</option>
                          <option value="50% RD">50% RD</option>
                          <option value="100% RD">100% RD</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, height: "42px" }}>
                        <input type="checkbox" checked={newDest.add_in_invoice} onChange={(e) => setNewDest({ ...newDest, add_in_invoice: e.target.checked })} style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>Add to Invoice</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Delivery Location (Full Address) <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={newDest.addr} onChange={(e) => setNewDest({ ...newDest, addr: e.target.value })} placeholder="Delivery Location (Full Address)"
                  style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFF" }} />
              </div>
            </div>
            {editId && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>Reason for Edit <span style={{ color: "#EF4444" }}>*</span></label>
                  <input value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} placeholder="Reason for Edit (Mandatory) *"
                    style={{ border: "1.5px solid #F59E0B", borderRadius: 6, padding: "10px 12px", fontSize: 14, outline: "none", color: "#0C1A2E", width: "100%", background: "#FFFBEB" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <PBtn sm color={editId ? "#059669" : "#0EA5E9"} bg={editId ? "#D1FAE5" : "#E0F2FE"} border={editId ? "#A7F3D0" : "#BAE6FD"} onClick={addDestination}>
                {editId ? "✓ Update Destination" : "+ Add Destination"}
              </PBtn>
              {editId && (
                <PBtn sm color="#64748B" bg="#F1F5F9" border="#E2E8F0" onClick={() => { setEditId(null); setEditRemarks(""); setNewDest({ name: "", contact_person: "", contact_number: "", addr: "", qty: "", delivery_mode: "", who_will_pay: "", courier_amount: "", add_in_invoice: false }); }}>
                  Cancel Edit
                </PBtn>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Special Instructions / Notes</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Packing instructions, fragile items, special handling…"
          style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: 8, fontSize: 14, outline: "none", color: "#0C1A2E", resize: "vertical" }} />
      </div>
      <PBtn onClick={save} disabled={isSubmitting} full color="#0EA5E9" bg="#E0F2FE" border="#BAE6FD">
        {isSubmitting ? "Processing..." : "✓ Confirm Instructions → Start Processing"}
      </PBtn>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#FFF", borderRadius: 12, width: 400, maxWidth: "90%", padding: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 18, color: "#0F172A" }}>Remove Destination</h3>
            <p style={{ margin: "0 0 15px 0", fontSize: 13, color: "#64748B" }}>Are you sure you want to remove this destination? Please provide a reason below.</p>
            <input
              value={deleteRemarks}
              onChange={e => setDeleteRemarks(e.target.value)}
              placeholder="Reason for removal (Mandatory) *"
              style={{ width: "100%", border: "1.5px solid #EF4444", borderRadius: 6, padding: "8px 10px", fontSize: 14, outline: "none", background: "#FEF2F2", color: "#0F172A", marginBottom: 15 }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => { setDeleteModalOpen(false); setDestToDelete(null); }} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F1F5F9", color: "#64748B", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#EF4444", color: "#FFF", fontWeight: 600, cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </PCard>
  );
}
