import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { nowStamp } from './constants';

export function LogisticsPanel({ job, onUpdate, onLog, advance }) {
  const [dtype, setDtype] = useState(job.dispatchType || "courier");
  const [deliveryScope, setDeliveryScope] = useState("full");
  const [partialQty, setPartialQty] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];
  const [dispatchDt, setDispatchDt] = useState(job.dispatchDt || todayStr);
  const [expDel, setExpDel] = useState(job.expectedDelivery || "");

  const targetQty = job.total_qty || job.qty || job.qcAcceptedQty || 0;
  const deliveredSoFar = job.deliveredQty || 0;
  const remainingQty = Math.max(0, targetQty - deliveredSoFar);

  const createInitialShipments = React.useCallback(() => {
    const curRemaining = Math.max(0, (job.total_qty || job.qty || job.qcAcceptedQty || 0) - (job.deliveredQty || 0));

    if (job.challanList && Array.isArray(job.challanList) && job.challanList.length > 0) {
      let cumulative = 0;
      const loaded = job.challanList.map((c, i) => {
        const d = (job.destinations || []).find(x => String(x.id !== undefined ? x.id : (job.destinations || []).indexOf(x)) === String(c.destId)) || (job.destinations || [])[0] || {};
        const cQty = c.qty !== undefined ? Number(c.qty) : (d.qty || "");
        const isDispatched = cumulative < (job.deliveredQty || 0);
        cumulative += Number(c.qty || 0);

        const matchedJobShipment = (job.shipments || []).find(s =>
          (s.challanNo && c.challanNo && s.challanNo === c.challanNo) ||
          (s.destName && c.challanNo && s.destName.includes(c.challanNo))
        ) || (job.shipments || [])[i];

        return {
          id: (c.id || `c_${i}`) + "_s_" + Date.now() + "_" + i,
          destId: c.destId !== undefined ? c.destId : (d.id !== undefined ? d.id : `dest_${i}`),
          destName: (c.challanNo ? `[DC: ${c.challanNo}] ` : "") + (d.name || d.contact_person || c.destName || `Destination #${i + 1}`),
          destAddr: d.addr || d.deliveryLocation || d.delivery_address || d.location || c.destName || "",
          courier: (isDispatched && matchedJobShipment?.courier) ? matchedJobShipment.courier : (d.delivery_mode || job.courierName || ""),
          awb: (isDispatched && matchedJobShipment?.awb) ? matchedJobShipment.awb : (c.awb || d.awb || (job.awbNumbers && job.awbNumbers[i]) || ""),
          qty: cQty,
          dispatchDt: (isDispatched && matchedJobShipment?.dispatchDt) ? matchedJobShipment.dispatchDt : (job.dispatchDt || todayStr),
          expDel: (isDispatched && matchedJobShipment?.expDel) ? matchedJobShipment.expDel : (job.expectedDelivery || ""),
          isDispatched: isDispatched,
          challanNo: c.challanNo || ""
        };
      });

      // If all loaded challans are already dispatched, but there is still remaining balance to deliver:
      const hasPending = loaded.some(s => !s.isDispatched);
      if (!hasPending && curRemaining > 0) {
        const d = job.destinations?.[0];
        loaded.push({
          id: "ship_pending_" + Date.now(),
          destId: d?.id !== undefined ? d.id : 0,
          destName: d?.name || d?.contact_person || "Remaining Destination",
          destAddr: d?.addr || d?.deliveryLocation || d?.delivery_address || "",
          courier: d?.delivery_mode || job.courierName || "",
          awb: "",
          qty: curRemaining,
          dispatchDt: todayStr,
          expDel: "",
          isDispatched: false
        });
      }

      return loaded;
    }

    if (job.destinations && job.destinations.length) {
      let cumulative = 0;
      const loaded = job.destinations.map((d, i) => {
        const dQty = Number(d.qty) || 0;
        const isDispatched = cumulative < (job.deliveredQty || 0);
        cumulative += dQty;
        const matchedJobShipment = (job.shipments || [])[i];

        return {
          id: (d.id || `d_${i}`) + "_s_" + Date.now() + "_" + i,
          destId: d.id !== undefined ? d.id : `dest_${i}`,
          destName: d.name || d.contact_person || `Destination #${i + 1}`,
          destAddr: d.addr || d.deliveryLocation || d.delivery_address || d.location || "",
          courier: (isDispatched && matchedJobShipment?.courier) ? matchedJobShipment.courier : (d.delivery_mode || job.courierName || ""),
          awb: (isDispatched && matchedJobShipment?.awb) ? matchedJobShipment.awb : (d.awb || (job.awbNumbers && job.awbNumbers[i]) || ""),
          qty: d.qty || "",
          dispatchDt: (isDispatched && matchedJobShipment?.dispatchDt) ? matchedJobShipment.dispatchDt : (job.dispatchDt || todayStr),
          expDel: (isDispatched && matchedJobShipment?.expDel) ? matchedJobShipment.expDel : (job.expectedDelivery || ""),
          isDispatched: isDispatched
        };
      });

      const hasPending = loaded.some(s => !s.isDispatched);
      if (!hasPending && curRemaining > 0) {
        const d = job.destinations?.[0];
        loaded.push({
          id: "ship_pending_" + Date.now(),
          destId: d?.id !== undefined ? d.id : 0,
          destName: d?.name || d?.contact_person || "Remaining Destination",
          destAddr: d?.addr || d?.deliveryLocation || d?.delivery_address || "",
          courier: d?.delivery_mode || job.courierName || "",
          awb: "",
          qty: curRemaining,
          dispatchDt: todayStr,
          expDel: "",
          isDispatched: false
        });
      }

      return loaded;
    }

    return [{
      id: "ship_" + Date.now(),
      destId: "",
      destName: "",
      destAddr: "",
      courier: job.courierName || "",
      awb: job.awbNumbers?.[0] || "",
      qty: curRemaining > 0 ? curRemaining : "",
      dispatchDt: job.dispatchDt || todayStr,
      expDel: job.expectedDelivery || "",
      isDispatched: false
    }];
  }, [job.total_qty, job.challanList, job.destinations, job.courierName, job.awbNumbers, job.dispatchDt, job.expectedDelivery, job.deliveredQty, job.qcAcceptedQty, job.qty, job.shipments, todayStr]);

  const [shipments, setShipments] = useState(createInitialShipments);

  React.useEffect(() => {
    setShipments(createInitialShipments());
  }, [createInitialShipments]);

  const lastHd = job.handDelivery?.[job.handDelivery.length - 1] || {};
  const lastPu = job.clientPickup?.[job.clientPickup.length - 1] || {};

  const [hdBy, setHdBy] = useState("");
  const [hdCharge, setHdCharge] = useState("");
  const hdModeOptions = ["Tempo", "Taxi / Cab", "Auto-rickshaw", "Two-wheeler", "Porter", "Wefast / Dunzo", "Own Van", "Other"];
  const initHdMode = lastHd.handDeliveryMode ? (hdModeOptions.includes(lastHd.handDeliveryMode) ? lastHd.handDeliveryMode : "Other") : "";
  const [hdMode, setHdMode] = useState("");
  const [hdModeOther, setHdModeOther] = useState("");

  const [puName, setPuName] = useState("");
  const puModeOptions = ["Client Own Vehicle", "Porter / Loader", "Wefast", "Dunzo", "Rapido", "Other"];
  const initPuMode = lastPu.pickupMode ? (puModeOptions.includes(lastPu.pickupMode) ? lastPu.pickupMode : "Other") : "";
  const [puMode, setPuMode] = useState("");
  const [puModeOther, setPuModeOther] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDone = job.stage === "complete";

  function updateShipment(id, patch) {
    setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleSelectDestination(shipmentId, destId) {
    const destIdx = job.destinations.findIndex(x => (x.id === destId || String(x.id) === String(destId)));
    const d = destIdx !== -1 ? job.destinations[destIdx] : job.destinations.find(x => x.id === destId);

    const fetchedAwb = d?.awb || (destIdx !== -1 ? job.awbNumbers?.[destIdx] : "") || "";
    const fetchedCourier = d?.delivery_mode || job.courierName || "";
    const fetchedQty = d?.qty || "";

    updateShipment(shipmentId, {
      destId: destId,
      destName: d ? (d.name || d.contact_person || `Destination #${destIdx + 1}`) : "",
      destAddr: d ? (d.addr || d.deliveryLocation || d.delivery_address || d.location || "") : "",
      awb: fetchedAwb,
      courier: fetchedCourier,
      qty: fetchedQty
    });
  }

  function addShipment() {
    const d = job.destinations?.[0];
    setShipments((prev) => [
      ...prev,
      {
        id: "ship_" + Date.now(),
        destId: d?.id || "",
        destName: d?.name || d?.contact_person || "",
        destAddr: d?.addr || d?.deliveryLocation || d?.delivery_address || "",
        courier: d?.delivery_mode || job.courierName || "",
        awb: d?.awb || job.awbNumbers?.[0] || "",
        qty: d?.qty || "",
        dispatchDt: dispatchDt || todayStr,
        expDel: expDel || ""
      }
    ]);
  }

  function removeShipment(id) {
    setShipments((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target?.isDispatched) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }

  async function confirm() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const now = nowStamp();
    const finalHdMode = hdMode === "Other" ? hdModeOther : hdMode;
    const finalPuMode = puMode === "Other" ? puModeOther : puMode;

    const qtyToDeliver = deliveryScope === "full" ? remainingQty : parseInt(partialQty);
    const newDeliveredQty = deliveredSoFar + qtyToDeliver;
    const isNowComplete = newDeliveredQty >= (job.total_qty || job.qty || targetQty);

    let updatedHandDelivery = job.handDelivery || [];
    let updatedClientPickup = job.clientPickup || [];

    if (dtype === "hand_delivery") {
      const newHdEntry = {
        id: "hd_" + Date.now(),
        handDeliveryBy: hdBy,
        handDeliveryCharge: parseFloat(hdCharge) || 0,
        handDeliveryMode: finalHdMode,
        dispatchDt: dispatchDt || now,
        qty: qtyToDeliver,
      };
      updatedHandDelivery = [...updatedHandDelivery, newHdEntry];
    } else if (dtype === "client_pickup") {
      const newPuEntry = {
        id: "pu_" + Date.now(),
        pickupPersonName: puName,
        pickupMode: finalPuMode,
        dispatchDt: dispatchDt || now,
        qty: qtyToDeliver,
      };
      updatedClientPickup = [...updatedClientPickup, newPuEntry];
    }

    const activeShipments = shipments.filter(s => !s.isDispatched);
    const primaryDispatchDt = dtype === "courier" ? (activeShipments[0]?.dispatchDt || dispatchDt || now) : (dispatchDt || now);
    const primaryExpDel = dtype === "courier" ? (activeShipments[0]?.expDel || expDel || "") : (expDel || "");

    let updatedShipments = job.shipments || [];
    let updatedAwbNumbers = job.awbNumbers || [];

    if (dtype === "courier") {
      updatedShipments = [...updatedShipments, ...activeShipments];
      const newAwbs = activeShipments.map((s) => s.awb).filter(Boolean);
      updatedAwbNumbers = Array.from(new Set([...(job.awbNumbers || []), ...newAwbs]));
    }

    const patch = {
      dispatchType: dtype,
      shipments: updatedShipments,
      courierName: dtype === "courier" ? (activeShipments[0]?.courier || job.courierName || "") : (job.courierName || ""),
      awbNumbers: updatedAwbNumbers,
      expectedDelivery: primaryExpDel,
      dispatchDt: primaryDispatchDt,
      handDelivery: updatedHandDelivery,
      clientPickup: updatedClientPickup,
      deliveredQty: newDeliveredQty,
    };

    if (isNowComplete) {
      patch.completedDt = now;
    }

    const summary = dtype === "courier"
      ? activeShipments.map((s) => `${s.destName || "—"}: ${s.courier} (AWB: ${s.awb})`).join(" · ")
      : dtype === "hand_delivery" ? `Hand Delivery by ${hdBy} (${finalHdMode})` : `Picked up by ${puName} ${finalPuMode ? "(" + finalPuMode + ")" : ""}`;

    const qtyText = deliveryScope === "full" ? `Full (${qtyToDeliver} pcs)` : `Partial (${qtyToDeliver} pcs)`;

    const logMsg = `🚚 ${qtyText} dispatched via ${dtype} · ${summary}${!isNowComplete ? `. Remaining: ${targetQty - newDeliveredQty} pcs` : ''}`;
    patch.newLog = { msg: logMsg, dt: now };

    if (isNowComplete) {
      const success = await advance("complete", "✅ Job complete — fully dispatched", patch);
      if (success) {
        toast.success("Job completed successfully! 🎉");
      }
    } else {
      const success = await onUpdate(patch);
      if (success !== false) {
        toast.success(`Partial delivery recorded (${qtyToDeliver} pcs)`);
        // Stay on Logistics step, reset fields for next partial delivery
        setDeliveryScope("full");
        setPartialQty("");
        setHdBy(""); setHdCharge(""); setPuName("");
        const d = job.destinations?.[0];
        setShipments([{
          id: "ship_" + Date.now(),
          destId: d?.id || "",
          destName: d?.name || d?.contact_person || "",
          destAddr: d?.addr || d?.deliveryLocation || d?.delivery_address || "",
          courier: d?.delivery_mode || job.courierName || "",
          awb: "",
          qty: "",
          dispatchDt: todayStr,
          expDel: "",
          isDispatched: false
        }]);
      }
    }

    setTimeout(() => setIsSubmitting(false), 400);
  }

  const activeShipments = shipments.filter(s => !s.isDispatched);
  const expectedDeliveryQty = deliveryScope === "full" ? remainingQty : (parseInt(partialQty) || 0);
  const totalShipmentQtySum = activeShipments.reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0);
  const isQtySplitMatching = totalShipmentQtySum === expectedDeliveryQty;

  const areAllShipmentDatesValid = activeShipments.every(s => {
    const sDisp = s.dispatchDt || dispatchDt;
    const sExp = s.expDel || expDel;
    const isDispValid = Boolean(sDisp && sDisp >= todayStr);
    const isExpValid = !sExp || sExp >= (sDisp || todayStr);
    return isDispValid && isExpValid;
  });

  const isGlobalDispatchValid = Boolean(dispatchDt && dispatchDt >= todayStr);

  const basicCourierValid = activeShipments.length > 0 && activeShipments.every((s) => s.courier && s.awb && Number(s.qty) > 0);
  const partialValid = deliveryScope === "full" || (parseInt(partialQty) > 0 && parseInt(partialQty) <= remainingQty);

  const courierValid = Boolean(partialValid && basicCourierValid && isQtySplitMatching && areAllShipmentDatesValid);
  const hdValid = Boolean(partialValid && hdBy.trim() && hdMode && (hdMode !== "Other" || hdModeOther.trim()) && hdCharge !== "" && isGlobalDispatchValid);
  const puValid = Boolean(partialValid && puName.trim() && puMode && (puMode !== "Other" || puModeOther.trim()) && isGlobalDispatchValid);

  return (
    <PCard title="Step 7 — Courier Connect & Dispatch" icon="🚚" color="#0D9488" bg="#F0FDFA">
      {job.challanNo && (
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF" }}>
              📑 Delivery Challan: <span style={{ color: "#0F172A", fontWeight: 900 }}>{job.challanNo}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {job.challanDate && (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>
                  Date: {job.challanDate}
                </div>
              )}
              {job.challanFile && (!job.challanList || job.challanList.length <= 1) && (
                <a
                  href={job.challanFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: "#FFFFFF", color: "#2563EB", border: "1px solid #93C5FD", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  📄 View DC File
                </a>
              )}
            </div>
          </div>

          {job.challanList && job.challanList.length > 1 && (
            <div style={{ marginTop: 8, borderTop: "1px dashed #BFDBFE", paddingTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {job.challanList.map((ch, cIdx) => (
                <div key={ch.id || cIdx} style={{ background: "white", border: "1px solid #DBEAFE", borderRadius: 6, padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 800, color: "#1E40AF" }}>#{cIdx + 1} {ch.challanNo}</span>
                  <span style={{ color: "#0D9488", fontWeight: 700 }}>({ch.qty} pcs)</span>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isDone ? (
        <div style={{ background: "#ECFDF5", border: "1.5px solid #6EE7B7", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 45, marginBottom: 6 }}>🏆</div>
          <div style={{ fontSize: 21, fontWeight: 900, color: "#059669" }}>Job Dispatched — Complete</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#047857", marginTop: 6, textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}>
            {((job.shipments && job.shipments.length > 0) || job.courierName || job.dispatchType === "courier") && (
              <div>
                <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "#065F46" }}>📦 Courier Shipments:</div>
                {(job.shipments && job.shipments.length > 0) ? (
                  job.shipments.map((s, idx) => (
                    <div key={s.id || idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #A7F3D0", flexWrap: "wrap", gap: 6 }}>
                      <div>
                        <span style={{ fontWeight: 800, color: "#064E3B" }}>{s.destName || "—"}</span>
                        {s.destAddr && <span style={{ fontSize: 11, color: "#047857", marginLeft: 4 }}>({s.destAddr})</span>}
                      </div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {s.courier} · AWB: <b>{s.awb}</b> {s.dispatchDt && `(Dispatch: ${s.dispatchDt})`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>{job.courierName || ''} · AWB: {job.awbNumbers?.join(", ") || 'N/A'}</div>
                )}
              </div>
            )}
            {((job.handDelivery && job.handDelivery.length > 0) || job.handDeliveryBy || job.dispatchType === "hand_delivery") && (
              <div>
                <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "#065F46" }}>🚚 Hand Delivery:</div>
                {(job.handDelivery && job.handDelivery.length > 0) ? (
                  job.handDelivery.map((hd, i) => (
                    <div key={hd.id || i} style={{ padding: "2px 0" }}>
                      {hd.handDeliveryBy || 'Delivery Person'} ({hd.handDeliveryMode || 'N/A'}) {hd.qty ? `- ${hd.qty} pcs` : ''}
                    </div>
                  ))
                ) : (
                  <div>{job.handDeliveryBy || 'Delivery Person'} ({job.handDeliveryMode || 'N/A'})</div>
                )}
              </div>
            )}
            {((job.clientPickup && job.clientPickup.length > 0) || job.pickupPersonName || job.dispatchType === "client_pickup") && (
              <div>
                <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "#065F46" }}>🏪 Client Pickup:</div>
                {(job.clientPickup && job.clientPickup.length > 0) ? (
                  job.clientPickup.map((pu, i) => (
                    <div key={pu.id || i} style={{ padding: "2px 0" }}>
                      {pu.pickupPersonName || 'Customer'} ({pu.pickupMode || 'N/A'}) {pu.qty ? `- ${pu.qty} pcs` : ''}
                    </div>
                  ))
                ) : (
                  <div>{job.pickupPersonName || 'Customer'} ({job.pickupMode || 'N/A'})</div>
                )}
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#047857", marginTop: 6, fontWeight: 700 }}>Dispatched: {job.completedDt || job.dispatchDt}</div>
        </div>
      ) : (
        <>
          {/* Dispatch History Banner for Partial Dispatches */}
          {deliveredSoFar > 0 && (
            <div style={{ marginBottom: 16, borderBottom: "1.5px dashed #99F6E4", paddingBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#0F766E", marginBottom: 10, textTransform: "uppercase" }}>
                🕒 Previous Dispatch History
              </div>
              <div style={{ background: "#F0FDFA", border: "1px solid #CCFBF1", borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0D9488", marginBottom: 4 }}>
                  Already Dispatched: {deliveredSoFar} of {targetQty} pcs
                </div>
                {((job.shipments && job.shipments.length > 0) || job.courierName || job.dispatchType === "courier") && (
                  <div>
                    <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "#065F46" }}>📦 Courier Shipments:</div>
                    {(job.shipments && job.shipments.length > 0) ? (
                      job.shipments.map((s, idx) => (
                        <div key={s.id || idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #A7F3D0", flexWrap: "wrap", gap: 6, fontSize: 12 }}>
                          <div>
                            <span style={{ fontWeight: 800, color: "#064E3B" }}>{s.destName || "—"}</span>
                            {s.destAddr && <span style={{ fontSize: 11, color: "#047857", marginLeft: 4 }}>({s.destAddr})</span>}
                            {s.qty && <span style={{ fontSize: 11, fontWeight: 900, color: "#0D9488", marginLeft: 6, background: "#CCFBF1", padding: "1px 5px", borderRadius: 4 }}>{s.qty} pcs</span>}
                          </div>
                          <div style={{ fontFamily: "monospace", fontWeight: 700 }}>
                            {s.courier} · AWB: <b>{s.awb}</b> {s.dispatchDt && `(Dispatch: ${s.dispatchDt})`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12 }}>{job.courierName || ''} · AWB: {job.awbNumbers?.join(", ") || 'N/A'}</div>
                    )}
                  </div>
                )}
                {((job.handDelivery && job.handDelivery.length > 0) || job.handDeliveryBy || job.dispatchType === "hand_delivery") && (
                  <div>
                    <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "#065F46" }}>🚚 Hand Delivery:</div>
                    {(job.handDelivery && job.handDelivery.length > 0) ? (
                      job.handDelivery.map((hd, i) => (
                        <div key={hd.id || i} style={{ padding: "2px 0", fontSize: 12 }}>
                          {hd.handDeliveryBy || 'Delivery Person'} ({hd.handDeliveryMode || 'N/A'}) {hd.qty ? `- ${hd.qty} pcs` : ''}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12 }}>{job.handDeliveryBy || 'Delivery Person'} ({job.handDeliveryMode || 'N/A'})</div>
                    )}
                  </div>
                )}
                {((job.clientPickup && job.clientPickup.length > 0) || job.pickupPersonName || job.dispatchType === "client_pickup") && (
                  <div>
                    <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "#065F46" }}>🏪 Client Pickup:</div>
                    {(job.clientPickup && job.clientPickup.length > 0) ? (
                      job.clientPickup.map((pu, i) => (
                        <div key={pu.id || i} style={{ padding: "2px 0", fontSize: 12 }}>
                          {pu.pickupPersonName || 'Customer'} ({pu.pickupMode || 'N/A'}) {pu.qty ? `- ${pu.qty} pcs` : ''}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12 }}>{job.pickupPersonName || 'Customer'} ({job.pickupMode || 'N/A'})</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Scope for ALL Dispatch Types (Courier, Hand Delivery, Client Pickup) */}
          <div style={{ marginBottom: 14, background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#0F766E", textTransform: "uppercase", marginBottom: 6 }}>
              Delivery Scope (Quantity Handler)
            </div>
            <div className="rdpk-flex-wrap" style={{ marginBottom: 10, gap: 10 }}>
              {[["full", `Full Delivery (${remainingQty} pcs remaining)`], ["partial", "Partial Delivery"]].map(([k, l]) => (
                <div
                  key={k}
                  onClick={() => setDeliveryScope(k)}
                  style={{
                    background: deliveryScope === k ? "#0D9488" : "white",
                    color: deliveryScope === k ? "white" : "#475569",
                    border: `1.5px solid ${deliveryScope === k ? "#0D9488" : "#CBD5E1"}`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    textAlign: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 800
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            {deliveryScope === "partial" && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 3 }}>Quantity Delivered (pcs)</div>
                <input
                  type="number"
                  value={partialQty}
                  onChange={(e) => setPartialQty(e.target.value)}
                  placeholder={`Max: ${remainingQty}`}
                  max={remainingQty}
                  style={{
                    width: 200,
                    border: `1.5px solid ${parseInt(partialQty) > remainingQty ? '#EF4444' : '#0D9488'}`,
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 18,
                    fontWeight: 800,
                    outline: "none",
                    color: "#0C1A2E",
                    background: "white"
                  }}
                />
                {parseInt(partialQty) > remainingQty && (
                  <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 700 }}>Cannot exceed {remainingQty} pcs</div>
                )}
              </div>
            )}
          </div>

          {/* Dispatch Method Options */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#0F766E", textTransform: "uppercase", marginBottom: 6 }}>Dispatch Method</div>
            <div className="rdpk-grid-3">
              {[
                { k: "courier", icon: "📮", label: "Courier" },
                { k: "hand_delivery", icon: "🚗", label: "Hand Delivery" },
                { k: "client_pickup", icon: "🤝", label: "Client Pickup" },
              ].map((o) => (
                <div
                  key={o.k}
                  onClick={() => setDtype(o.k)}
                  style={{
                    background: dtype === o.k ? "#0D9488" : "white",
                    color: dtype === o.k ? "white" : "#64748B",
                    border: `1.5px solid ${dtype === o.k ? "#0D9488" : "#E2E8F0"}`,
                    borderRadius: 10,
                    padding: 10,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 2 }}>{o.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>{o.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Courier Section */}
          {dtype === "courier" && (
            <div style={{ background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F766E", textTransform: "uppercase" }}>
                  📦 Courier & AWB Details per Shipment
                </div>
                <PBtn sm color="#0D9488" bg="#F0FDFA" border="#99F6E4" onClick={addShipment}>
                  + Add Shipment
                </PBtn>
              </div>

              {/* Quantity Split Live Matching Status Banner */}
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: isQtySplitMatching ? "#ECFDF5" : "#FEF2F2",
                  border: `1.5px solid ${isQtySplitMatching ? "#A7F3D0" : "#FCA5A5"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: isQtySplitMatching ? "#065F46" : "#991B1B", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{isQtySplitMatching ? "✅ Quantity Split Matches Total Delivery Qty!" : "⚠️ Quantity Split Mismatch!"}</span>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: isQtySplitMatching ? "#047857" : "#B91C1C" }}>
                  Target Delivery Qty: <b>{expectedDeliveryQty} pcs</b> &nbsp;|&nbsp; Sum of Split Shipments: <b>{totalShipmentQtySum} pcs</b>
                  {!isQtySplitMatching && (
                    <span style={{ marginLeft: 8, background: "#EF4444", color: "white", padding: "2px 8px", borderRadius: 4, fontWeight: 900, fontSize: 11 }}>
                      {expectedDeliveryQty > totalShipmentQtySum ? `Need +${expectedDeliveryQty - totalShipmentQtySum} pcs more` : `Exceeds by ${totalShipmentQtySum - expectedDeliveryQty} pcs`}
                    </span>
                  )}
                </div>
              </div>

              {shipments.map((s, idx) => {
                const isDispatched = Boolean(s.isDispatched);
                return (
                  <div
                    key={s.id}
                    style={{
                      background: isDispatched ? "#F8FAFC" : "white",
                      border: `1.5px solid ${isDispatched ? "#CBD5E1" : "#CCFBF1"}`,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      opacity: isDispatched ? 0.9 : 1
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: isDispatched ? "#475569" : "#0F766E", textTransform: "uppercase" }}>
                          Shipment #{idx + 1}
                        </div>
                        {isDispatched && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#065F46", background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 4, padding: "2px 8px" }}>
                            🔒 Already Dispatched
                          </span>
                        )}
                      </div>
                      {activeShipments.length > 1 && !isDispatched && (
                        <button
                          type="button"
                          onClick={() => removeShipment(s.id)}
                          style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FCA5A5", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", gap: 10, marginBottom: 10 }}>
                      {/* Destination Select with Address / Location */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                          Destination / Location <span style={{ color: "#EF4444" }}>*</span>
                        </div>
                        <select
                          value={s.destId}
                          disabled={isDispatched}
                          onChange={(e) => handleSelectDestination(s.id, e.target.value)}
                          style={{
                            width: "100%",
                            border: `1.5px solid ${isDispatched ? "#CBD5E1" : "#99F6E4"}`,
                            borderRadius: 7,
                            padding: 7,
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            color: isDispatched ? "#64748B" : "#0C1A2E",
                            background: isDispatched ? "#F1F5F9" : "white",
                            cursor: isDispatched ? "not-allowed" : "pointer"
                          }}
                        >
                          <option value="">Select Destination…</option>
                          {job.destinations.map((d, dIdx) => {
                            const loc = d.addr || d.deliveryLocation || d.delivery_address || d.location || "No Address";
                            return (
                              <option key={d.id || dIdx} value={d.id || dIdx}>
                                {d.name || d.contact_person || 'Client'} — ({loc})
                              </option>
                            );
                          })}
                        </select>
                        {s.destAddr && (
                          <div style={{ fontSize: 11, color: isDispatched ? "#64748B" : "#0D9488", fontWeight: 700, marginTop: 3 }}>
                            📍 Location: {s.destAddr}
                          </div>
                        )}
                      </div>

                      {/* Courier Name Input */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                          Courier Name <span style={{ color: "#EF4444" }}>*</span>
                        </div>
                        <input
                          value={s.courier}
                          disabled={isDispatched}
                          onChange={(e) => updateShipment(s.id, { courier: e.target.value })}
                          placeholder="e.g. BlueDart / DTDC"
                          style={{
                            width: "100%",
                            border: `1.5px solid ${isDispatched ? "#CBD5E1" : "#99F6E4"}`,
                            borderRadius: 7,
                            padding: 7,
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            color: isDispatched ? "#64748B" : "#0C1A2E",
                            background: isDispatched ? "#F1F5F9" : "white",
                            cursor: isDispatched ? "not-allowed" : "text"
                          }}
                        />
                      </div>

                      {/* AWB Number Input (Auto fetched if exists) */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                          AWB Number <span style={{ color: "#EF4444" }}>*</span>
                        </div>
                        <input
                          value={s.awb}
                          disabled={isDispatched}
                          onChange={(e) => updateShipment(s.id, { awb: e.target.value })}
                          placeholder="Auto-fetched AWB"
                          style={{
                            width: "100%",
                            border: `1.5px solid ${isDispatched ? "#CBD5E1" : "#99F6E4"}`,
                            borderRadius: 7,
                            padding: 7,
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            color: isDispatched ? "#64748B" : "#0C1A2E",
                            fontFamily: "monospace",
                            background: isDispatched ? "#F1F5F9" : "white",
                            cursor: isDispatched ? "not-allowed" : "text"
                          }}
                        />
                      </div>

                      {/* Qty Split Input */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                          Qty (pcs)
                        </div>
                        <input
                          type="number"
                          value={s.qty}
                          disabled={isDispatched}
                          onChange={(e) => updateShipment(s.id, { qty: e.target.value })}
                          placeholder="pcs"
                          style={{
                            width: "100%",
                            border: `1.5px solid ${isDispatched ? "#CBD5E1" : "#99F6E4"}`,
                            borderRadius: 7,
                            padding: 7,
                            fontSize: 13,
                            fontWeight: 800,
                            outline: "none",
                            color: isDispatched ? "#64748B" : "#0C1A2E",
                            background: isDispatched ? "#F1F5F9" : "white",
                            cursor: isDispatched ? "not-allowed" : "text"
                          }}
                        />
                      </div>
                    </div>

                    {/* Separate Dispatch Date and Expected Delivery Date per Shipment */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 6, borderTop: "1px dashed #E2E8F0" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                          Dispatch Date <span style={{ color: "#EF4444" }}>*</span>
                        </div>
                        <input
                          type="date"
                          min={todayStr}
                          disabled={isDispatched}
                          value={s.dispatchDt || dispatchDt}
                          onChange={(e) => {
                            const newDisp = e.target.value;
                            const currentExp = s.expDel || expDel;
                            let patch = { dispatchDt: newDisp };
                            if (currentExp && currentExp < newDisp) {
                              patch.expDel = newDisp;
                            }
                            updateShipment(s.id, patch);
                          }}
                          style={{
                            width: "100%",
                            border: `1.5px solid ${isDispatched ? "#CBD5E1" : ((s.dispatchDt || dispatchDt) < todayStr ? '#EF4444' : '#99F6E4')}`,
                            borderRadius: 7,
                            padding: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            color: isDispatched ? "#64748B" : "#0C1A2E",
                            background: isDispatched ? "#F1F5F9" : "white",
                            cursor: isDispatched ? "not-allowed" : "pointer"
                          }}
                        />
                        {!isDispatched && (s.dispatchDt || dispatchDt) < todayStr && (
                          <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 3 }}>
                            ⚠️ Past dates not allowed
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                          Expected Delivery Date
                        </div>
                        <input
                          type="date"
                          min={s.dispatchDt || dispatchDt || todayStr}
                          disabled={isDispatched}
                          value={s.expDel || expDel}
                          onChange={(e) => updateShipment(s.id, { expDel: e.target.value })}
                          style={{
                            width: "100%",
                            border: `1.5px solid ${isDispatched ? "#CBD5E1" : ((s.expDel && s.expDel < (s.dispatchDt || dispatchDt || todayStr)) ? '#EF4444' : '#99F6E4')}`,
                            borderRadius: 7,
                            padding: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            color: isDispatched ? "#64748B" : "#0C1A2E",
                            background: isDispatched ? "#F1F5F9" : "white",
                            cursor: isDispatched ? "not-allowed" : "pointer"
                          }}
                        />
                        {!isDispatched && s.expDel && s.expDel < (s.dispatchDt || dispatchDt || todayStr) && (
                          <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 3 }}>
                            ⚠️ Expected date must be on/after dispatch ({s.dispatchDt || dispatchDt || todayStr})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hand Delivery Section */}
          {dtype === "hand_delivery" && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div className="rdpk-grid-2" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Delivered By</div>
                  <input
                    value={hdBy}
                    onChange={(e) => setHdBy(e.target.value)}
                    placeholder="Delivery person / company name"
                    style={{ width: "100%", border: "1.5px solid #FED7AA", borderRadius: 7, padding: 8, fontSize: 16, outline: "none", color: "#0C1A2E" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Delivery Mode</div>
                  <select
                    value={hdMode}
                    onChange={(e) => setHdMode(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #FED7AA", borderRadius: 7, padding: 8, fontSize: 15, outline: "none", color: "#0C1A2E", background: "white", marginBottom: hdMode === "Other" ? 8 : 0 }}
                  >
                    <option value="">Select…</option>
                    {hdModeOptions.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  {hdMode === "Other" && (
                    <input
                      value={hdModeOther}
                      onChange={(e) => setHdModeOther(e.target.value)}
                      placeholder="Specify other delivery mode"
                      style={{ width: "100%", border: "1.5px solid #FED7AA", borderRadius: 7, padding: 8, fontSize: 15, outline: "none", color: "#0C1A2E" }}
                    />
                  )}
                </div>
              </div>

              <div className="rdpk-grid-2">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Dispatch Date</div>
                  <input
                    type="date"
                    min={todayStr}
                    value={dispatchDt}
                    onChange={(e) => setDispatchDt(e.target.value)}
                    style={{ width: "100%", border: `1.5px solid ${dispatchDt < todayStr ? '#EF4444' : '#FED7AA'}`, borderRadius: 7, padding: 7, fontSize: 15, outline: "none", color: "#0C1A2E", background: "white" }}
                  />
                  {dispatchDt < todayStr && <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 3 }}>⚠️ Past dates not allowed</div>}
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Delivery Charge (₹)</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={hdCharge}
                    onChange={(e) => {
                      let rawVal = e.target.value;
                      let val = rawVal.replace(/[^0-9.]/g, '');
                      val = val.replace(/^0+/, '');
                      if (val === '' && rawVal.includes('0')) {
                        val = '0';
                      } else if (val.startsWith('.')) {
                        val = '0' + val;
                      }
                      const parts = val.split('.');
                      if (parts.length > 2) {
                        val = parts[0] + '.' + parts.slice(1).join('');
                      }
                      setHdCharge(val);
                    }}
                    placeholder="0"
                    style={{ width: "100%", border: "1.5px solid #FED7AA", borderRadius: 7, padding: 7, fontSize: 20, fontWeight: 900, textAlign: "center", outline: "none", fontFamily: "monospace", color: "#0C1A2E" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Client Pickup Section */}
          {dtype === "client_pickup" && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div className="rdpk-grid-2" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Pickup Person Name</div>
                  <input
                    value={puName}
                    onChange={(e) => setPuName(e.target.value)}
                    placeholder="Name of person picking up"
                    style={{ width: "100%", border: "1.5px solid #BFDBFE", borderRadius: 7, padding: 8, fontSize: 16, outline: "none", color: "#0C1A2E" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Pickup Mode</div>
                  <select
                    value={puMode}
                    onChange={(e) => setPuMode(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #BFDBFE", borderRadius: 7, padding: 8, fontSize: 15, outline: "none", color: "#0C1A2E", background: "white", marginBottom: puMode === "Other" ? 8 : 0 }}
                  >
                    <option value="">Select…</option>
                    {puModeOptions.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  {puMode === "Other" && (
                    <input
                      value={puModeOther}
                      onChange={(e) => setPuModeOther(e.target.value)}
                      placeholder="Specify other pickup mode"
                      style={{ width: "100%", border: "1.5px solid #BFDBFE", borderRadius: 7, padding: 8, fontSize: 15, outline: "none", color: "#0C1A2E" }}
                    />
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 3 }}>Dispatch / Pickup Date</div>
                <input
                  type="date"
                  min={todayStr}
                  value={dispatchDt}
                  onChange={(e) => setDispatchDt(e.target.value)}
                  style={{ width: "100%", border: `1.5px solid ${dispatchDt < todayStr ? '#EF4444' : '#BFDBFE'}`, borderRadius: 7, padding: 7, fontSize: 15, outline: "none", color: "#0C1A2E", background: "white" }}
                />
                {dispatchDt < todayStr && <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 3 }}>⚠️ Past dates not allowed</div>}
              </div>
            </div>
          )}

          <PBtn
            onClick={confirm}
            disabled={isSubmitting || (dtype === "courier" ? !courierValid : dtype === "hand_delivery" ? !hdValid : !puValid)}
            full
            color="#0D9488"
            bg="#F0FDFA"
            border="#99F6E4"
          >
            {isSubmitting ? "Processing..." : "🚚 Confirm Dispatch — Complete Job"}
          </PBtn>
        </>
      )}
    </PCard>
  );
}
