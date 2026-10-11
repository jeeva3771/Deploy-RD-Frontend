import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { stageIndex } from './constants';

export function ChallanPanel({ job, onUpdate, onLog, advance }) {
  const isMulti = job.destinationType === "multiple" || (job.destinations && job.destinations.length > 1);
  const destinations = job.destinations?.length ? job.destinations : [];
  const qcTotal = Number(job.qcAcceptedQty || job.total_qty || job.qty || 0);
  const inwardedQty = qcTotal;

  const isDone = stageIndex(job.stage) > stageIndex("challan");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize challan rows from existing job.challanList or default 1 row
  const [challans, setChallans] = useState(() => {
    if (job.challanList && Array.isArray(job.challanList) && job.challanList.length > 0) {
      let cumulative = 0;
      const loaded = job.challanList.map((c, idx) => {
        let cQty = c.qty !== undefined ? Number(c.qty) : (idx === 0 ? inwardedQty : 0);
        const locked = cumulative < (job.deliveredQty || 0);
        cumulative += Number(c.qty || 0);

        // Find matching destination
        const matchedDest = destinations.find(d => String(d.id !== undefined ? d.id : destinations.indexOf(d)) === String(c.destId));

        // If this challan is unlocked and linked to a destination with a specific allocated qty:
        // Automatically sync cQty if cQty exceeded destination qty or was set to full remaining qty
        if (!locked && matchedDest && matchedDest.qty && Number(matchedDest.qty) > 0) {
          const destQtyNum = Number(matchedDest.qty);
          if (cQty > destQtyNum || cQty === inwardedQty || cQty === (inwardedQty - (job.deliveredQty || 0)) || !c.qty) {
            cQty = destQtyNum;
          }
        }

        return {
          id: c.id || `ch_${Date.now()}_${idx}`,
          challanNo: c.challanNo || "",
          qty: cQty,
          challanDate: c.challanDate || job.challanDate || todayStr,
          destId: c.destId !== undefined ? c.destId : (destinations[0]?.id !== undefined ? destinations[0]?.id : 0),
          destName: c.destName || (matchedDest?.name || matchedDest?.addr || matchedDest?.contact_person || destinations[0]?.addr || destinations[0]?.name || "Main Destination"),
          challanFile: c.challanFile || "",
          newFile: null,
          isLocked: locked
        };
      });

      // If all loaded challans are already dispatched/locked, and there are pending destinations not yet assigned
      const hasUnlocked = loaded.some(c => !c.isLocked);
      if (!hasUnlocked && destinations.length > 0 && (job.deliveredQty || 0) > 0) {
        const assignedIds = new Set(loaded.map(c => String(c.destId)));
        const pendingDests = destinations.filter((d, dIdx) => !assignedIds.has(String(d.id !== undefined ? d.id : dIdx)));
        if (pendingDests.length > 0) {
          pendingDests.forEach((pd, pIdx) => {
            const destIndex = destinations.indexOf(pd);
            loaded.push({
              id: `ch_pending_${Date.now()}_${pIdx}`,
              challanNo: "",
              qty: Number(pd.qty) || 0,
              challanDate: todayStr,
              destId: pd.id !== undefined ? pd.id : destIndex,
              destName: pd.name || pd.addr || pd.contact_person || `Destination #${destIndex + 1}`,
              challanFile: "",
              newFile: null,
              isLocked: false
            });
          });
        }
      }

      return loaded;
    }

    // Default: 1 Single DC for the full inwarded quantity (User can freely split or add more)
    return [
      {
        id: `ch_${Date.now()}_0`,
        challanNo: job.challanNo || "",
        qty: inwardedQty,
        challanDate: job.challanDate || todayStr,
        destId: isMulti ? "all" : (destinations[0]?.id !== undefined ? destinations[0]?.id : 0),
        destName: isMulti ? "All Destinations (Consolidated)" : (destinations[0]?.addr || destinations[0]?.name || "Main Destination"),
        challanFile: job.challanFile || "",
        newFile: null,
        isLocked: false
      }
    ];
  });

  const fileInputRefs = useRef({});

  // Calculations
  const totalAllocatedQty = challans.reduce((sum, c) => sum + (Number(c.qty) || 0), 0);
  const remainingQty = inwardedQty - totalAllocatedQty;

  // Preset 1: Single Consolidated DC for the full inwarded quantity
  const handleSetSingleDc = () => {
    setChallans([
      {
        id: `ch_${Date.now()}_0`,
        challanNo: challans[0]?.challanNo || job.challanNo || "",
        qty: inwardedQty,
        challanDate: challans[0]?.challanDate || job.challanDate || todayStr,
        destId: isMulti ? "all" : (destinations[0]?.id !== undefined ? destinations[0]?.id : 0),
        destName: isMulti ? "All Destinations (Consolidated)" : (destinations[0]?.addr || destinations[0]?.name || "Main Destination"),
        challanFile: challans[0]?.challanFile || job.challanFile || "",
        newFile: challans[0]?.newFile || null
      }
    ]);
    toast.info("Switched to 1 Delivery Challan for full order quantity.");
  };

  // Preset 2: Split 1 DC per Destination (if multi-delivery)
  const handleSplitPerDestination = () => {
    if (!destinations || destinations.length === 0) return;
    const newRows = destinations.map((d, idx) => ({
      id: `ch_dest_${Date.now()}_${idx}`,
      challanNo: challans[idx]?.challanNo || "",
      qty: d.qty || (idx === 0 ? inwardedQty : 0),
      challanDate: todayStr,
      destId: d.id !== undefined ? d.id : idx,
      destName: d.addr || d.name || `Destination #${idx + 1}`,
      challanFile: d.challanFile || "",
      newFile: null
    }));
    setChallans(newRows);
    toast.info(`Generated ${newRows.length} DC rows (1 per destination).`);
  };

  // Add a new manual challan row
  const handleAddChallanRow = () => {
    // Find first destination not yet assigned to any challan
    const assignedDestIds = new Set(challans.map(c => String(c.destId)));
    let targetDest = destinations.find((d, dIdx) => !assignedDestIds.has(String(d.id !== undefined ? d.id : dIdx)));
    let targetDestIdx = destinations.findIndex((d, dIdx) => !assignedDestIds.has(String(d.id !== undefined ? d.id : dIdx)));

    if (!targetDest) {
      targetDestIdx = challans.length % (destinations.length || 1);
      targetDest = destinations[targetDestIdx];
    }

    const targetDestQty = Number(targetDest?.qty);
    const defaultQty = (targetDestQty > 0) 
      ? targetDestQty 
      : (remainingQty > 0 ? remainingQty : 0);

    const newRow = {
      id: `ch_${Date.now()}_${challans.length}`,
      challanNo: "",
      qty: defaultQty,
      challanDate: todayStr,
      destId: isMulti 
        ? (targetDest?.id !== undefined ? targetDest.id : targetDestIdx) 
        : (destinations[0]?.id !== undefined ? destinations[0].id : 0),
      destName: targetDest?.addr || targetDest?.name || targetDest?.contact_person || `DC #${challans.length + 1}`,
      challanFile: "",
      newFile: null,
      isLocked: false
    };
    setChallans(prev => [...prev, newRow]);
  };

  // Remove a challan row
  const handleRemoveChallanRow = (index) => {
    if (challans.length <= 1) {
      toast.info("At least one Delivery Challan is required.");
      return;
    }
    setChallans(prev => prev.filter((_, i) => i !== index));
  };

  // Update field of a challan row
  const handleUpdateRow = (index, field, value) => {
    setChallans(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "destId") {
        if (value === "all") {
          next[index].destName = "All Destinations (Consolidated)";
          const otherChallansAllocated = next.reduce((sum, c, i) => i === index ? sum : sum + (Number(c.qty) || 0), 0);
          const rem = Math.max(0, inwardedQty - otherChallansAllocated);
          if (rem > 0 && (!next[index].qty || Number(next[index].qty) === 0)) {
            next[index].qty = rem;
          }
        } else if (value === "custom") {
          if (!next[index].destName || next[index].destName === "All Destinations (Consolidated)") {
            next[index].destName = "";
          }
        } else {
          const selectedDest = destinations.find(d => String(d.id !== undefined ? d.id : destinations.indexOf(d)) === String(value));
          if (selectedDest) {
            next[index].destId = selectedDest.id !== undefined ? selectedDest.id : value;
            next[index].destName = selectedDest.name || selectedDest.addr || selectedDest.contact_person || `Destination #${Number(value) + 1}`;
            // If the selected destination has a specific allocated quantity, automatically sync the challan quantity!
            if (selectedDest.qty !== undefined && Number(selectedDest.qty) > 0) {
              next[index].qty = Number(selectedDest.qty);
            }
          }
        }
      }
      return next;
    });
  };

  // File selection for row
  const handleFileChange = (index, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setChallans(prev => {
        const next = [...prev];
        next[index] = { ...next[index], newFile: file };
        return next;
      });
    }
  };

  const handleRemoveFile = (index) => {
    setChallans(prev => {
      const next = [...prev];
      next[index] = { ...next[index], newFile: null };
      return next;
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = "";
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  async function confirm() {
    if (isSubmitting) return;

    // Validation
    for (let i = 0; i < challans.length; i++) {
      const c = challans[i];
      if (!c.challanNo || !c.challanNo.trim()) {
        toast.error(`Please enter Challan No for Challan #${i + 1}.`);
        return;
      }
      const q = Number(c.qty);
      if (isNaN(q) || q <= 0) {
        toast.error(`Please enter a valid quantity (> 0) for Challan #${i + 1} (${c.challanNo}).`);
        return;
      }
    }

    if (totalAllocatedQty > inwardedQty && inwardedQty > 0) {
      toast.error(`Cannot save: Total challan quantity (${totalAllocatedQty} pcs) exceeds inwarded quantity (${inwardedQty} pcs). Please reduce the quantity.`);
      return;
    }

    setIsSubmitting(true);

    // Prepare cleaned challanList for DB
    const cleanChallanList = challans.map((c, i) => ({
      id: c.id || `ch_${Date.now()}_${i}`,
      challanNo: c.challanNo.trim(),
      qty: Number(c.qty) || 0,
      challanDate: c.challanDate || todayStr,
      destId: c.destId,
      destName: c.destName || "",
      challanFile: c.challanFile || ""
    }));

    // Primary or summary challan string
    const uniqueChallanNos = Array.from(new Set(cleanChallanList.map(c => c.challanNo)));
    const primaryChallanNo = cleanChallanList.length === 1 
      ? cleanChallanList[0].challanNo 
      : cleanChallanList.map(c => `${c.challanNo} (${c.qty} pcs)`).join(", ");

    // Update destinations with their assigned challan numbers
    let updatedDestinations = [...destinations];
    const hasAllDc = cleanChallanList.some(c => c.destId === "all");

    if (destinations.length > 0) {
      if (hasAllDc || cleanChallanList.length === 1) {
        // Single DC covering all destinations
        const allNos = uniqueChallanNos.join(", ");
        const firstFile = cleanChallanList.find(c => c.challanFile)?.challanFile || "";
        updatedDestinations = destinations.map(d => ({
          ...d,
          challanNo: allNos || d.challanNo || "",
          challanFile: firstFile || d.challanFile || ""
        }));
      } else {
        // Individual destinations or custom mappings
        updatedDestinations = destinations.map((d, dIdx) => {
          const matchingChallans = cleanChallanList.filter(c => String(c.destId) === String(d.id !== undefined ? d.id : dIdx));
          if (matchingChallans.length > 0) {
            const nos = matchingChallans.map(m => m.challanNo).join(", ");
            return {
              ...d,
              challanNo: nos,
              challanFile: matchingChallans[0].challanFile || d.challanFile || ""
            };
          }
          return {
            ...d,
            challanNo: "",
            challanFile: ""
          };
        });
      }
    }

    const patch = {
      challanNo: uniqueChallanNos.join(", "),
      challanDate: cleanChallanList[0]?.challanDate || todayStr,
      challanList: cleanChallanList,
      destinations: updatedDestinations
    };

    // Attach any newly selected files
    challans.forEach((c, idx) => {
      if (c.newFile instanceof File) {
        patch[`challan_item_${idx}`] = c.newFile;
        if (idx === 0 && !patch.challan_file) {
          patch.challan_file = c.newFile;
        }
      }
    });

    const logText = `${cleanChallanList.length} DC(s): ${primaryChallanNo} · Total: ${totalAllocatedQty} pcs`;

    try {
      if (isDone) {
        const success = await onUpdate(patch);
        if (success !== false) {
          toast.success("Delivery Challan(s) & Files updated successfully!");
          setIsEditing(false);
          if (onLog) onLog(`📑 Delivery Challan updated — ${logText}`);
        }
      } else {
        const success = await advance(
          "processing",
          `→ Delivery Challan entered (${logText}) — ready for File Processing & Label Generation`,
          patch
        );
        if (success) {
          if (onLog) onLog(`📑 Delivery Challan recorded — ${logText}`);
        }
      }
    } catch (err) {
      console.error("Error saving challans:", err);
      toast.error("Failed to save Delivery Challan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PCard title="Step 4 — Delivery Challan Entry & Upload" icon="📑" color="#2563EB" bg="#EFF6FF">
      {isDone && !isEditing ? (
        /* ============================================================ */
        /* COMPLETED SUMMARY VIEW                                      */
        /* ============================================================ */
        <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28 }}>✅</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#1E40AF" }}>Delivery Challans Recorded</div>
                <div style={{ fontSize: 12, color: "#3B82F6", fontWeight: 700 }}>
                  Total {challans.length} Challan(s) · {totalAllocatedQty} pcs
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              style={{ background: "#FFFFFF", color: "#2563EB", border: "1.5px solid #BFDBFE", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              ✏️ Edit / Add Challans &amp; Files
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {challans.map((c, idx) => (
              <div
                key={c.id || idx}
                style={{
                  background: "white",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #DBEAFE",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 4, padding: "2px 6px" }}>
                      DC #{idx + 1}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#0F172A", fontFamily: "monospace" }}>
                      {c.challanNo || "N/A"}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#0D9488", background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 4, padding: "1px 6px" }}>
                      {c.qty} pcs
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4 }}>
                    Date: <b>{c.challanDate || todayStr}</b>
                    {isMulti && c.destName && ` · Dest: ${c.destName}`}
                  </div>
                </div>

                <div>
                  {c.challanFile ? (
                    <a
                      href={c.challanFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#EFF6FF",
                        color: "#2563EB",
                        border: "1.5px solid #93C5FD",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      📄 View DC File
                    </a>
                  ) : (
                    <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>No file attached</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* EDIT / ENTRY VIEW                                           */
        /* ============================================================ */
        <>
          {/* Header Summary Banner */}
          <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#3730A3" }}>
                📑 Delivery Challan &amp; Quantity Split
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginTop: 2 }}>
                Enter Challan No, quantity for each challan, and upload scanned files (PDF/Image).
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "white", padding: "4px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, fontWeight: 700 }}>
                Inwarded: <b style={{ color: "#0D9488" }}>{inwardedQty} pcs</b>
              </div>
              <div style={{ background: "white", padding: "4px 10px", borderRadius: 6, border: `1px solid ${remainingQty === 0 ? "#86EFAC" : remainingQty < 0 ? "#FCA5A5" : "#FDE047"}`, fontSize: 12, fontWeight: 700 }}>
                Allocated: <b style={{ color: remainingQty === 0 ? "#15803D" : remainingQty < 0 ? "#DC2626" : "#B45309" }}>{totalAllocatedQty} pcs</b>
                {remainingQty !== 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: remainingQty < 0 ? "#DC2626" : "#D97706" }}>
                    ({remainingQty > 0 ? `${remainingQty} pcs remaining` : `${Math.abs(remainingQty)} pcs excess`})
                  </span>
                )}
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#475569" }}
                >
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>

          {/* Quick Setup / Presets Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
            {!challans.some(c => c.isLocked) ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Quick Setup:</span>
              <button
                type="button"
                onClick={handleSetSingleDc}
                style={{
                  background: challans.length === 1 && challans[0]?.destId === (isMulti ? "all" : (destinations[0]?.id !== undefined ? destinations[0]?.id : 0)) ? "#EFF6FF" : "white",
                  color: "#1D4ED8",
                  border: "1.5px solid #93C5FD",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                📄 1 Single DC {isMulti ? "(All Destinations)" : "(Full Order)"}
              </button>
              {isMulti && destinations.length > 1 && (
                <button
                  type="button"
                  onClick={handleSplitPerDestination}
                  style={{
                    background: challans.length === destinations.length ? "#F0FDF4" : "white",
                    color: "#15803D",
                    border: "1.5px solid #86EFAC",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5
                  }}
                >
                  📑 1 DC per Destination ({destinations.length} DCs)
                </button>
              )}
            </div>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8" }}>
                🔒 Presets disabled (some challans already dispatched)
              </div>
            )}

            <button
              type="button"
              onClick={handleAddChallanRow}
              style={{
                background: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              ➕ Add Delivery Challan
            </button>
          </div>

          {/* Challan Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {challans.map((c, idx) => (
              <div
                key={c.id || idx}
                style={{
                  background: "white",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 14,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
              >
                {/* Row Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#2563EB", color: "white", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 900 }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>
                      Delivery Challan #{idx + 1}
                    </span>
                    {c.destId === "all" && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 4, padding: "1px 6px" }}>
                        All Destinations Consolidated
                      </span>
                    )}
                    {c.isLocked && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 4, padding: "1px 6px" }}>
                        🔒 Dispatched (Locked)
                      </span>
                    )}
                  </div>

                  {challans.length > 1 && !c.isLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChallanRow(idx)}
                      style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Grid Inputs: Challan No, Qty, Date, Destination */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 10 }}>
                  {/* Challan No */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                      Challan No <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={c.challanNo}
                      onChange={(e) => handleUpdateRow(idx, "challanNo", e.target.value)}
                      placeholder="e.g. DC/2026/001"
                      disabled={c.isLocked}
                      style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 6, padding: "7px 10px", fontSize: 14, fontWeight: 800, outline: "none", color: "#0F172A", background: c.isLocked ? "#F1F5F9" : "#F8FAFC", cursor: c.isLocked ? "not-allowed" : "text" }}
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                        Qty (pcs) <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      {remainingQty > 0 && Number(c.qty) !== inwardedQty && !c.isLocked && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRow(idx, "qty", Number(c.qty || 0) + remainingQty)}
                          style={{ background: "none", border: "none", color: "#2563EB", fontSize: 10, fontWeight: 800, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                        >
                          + Add {remainingQty}
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={c.qty}
                      onChange={(e) => handleUpdateRow(idx, "qty", e.target.value)}
                      placeholder="Qty"
                      disabled={c.isLocked}
                      style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 6, padding: "7px 10px", fontSize: 14, fontWeight: 800, outline: "none", color: "#0F172A", background: c.isLocked ? "#F1F5F9" : "#F8FAFC", cursor: c.isLocked ? "not-allowed" : "text" }}
                    />
                  </div>

                  {/* Challan Date */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={c.challanDate || todayStr}
                      onChange={(e) => handleUpdateRow(idx, "challanDate", e.target.value)}
                      disabled={c.isLocked}
                      style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 6, padding: "6px 8px", fontSize: 13, fontWeight: 700, outline: "none", color: "#0F172A", background: c.isLocked ? "#F1F5F9" : "#F8FAFC", cursor: c.isLocked ? "not-allowed" : "text" }}
                    />
                  </div>

                  {/* Destination / Allocation Dropdown */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                      Destination / Allocation
                    </label>
                    <select
                      value={c.destId}
                      onChange={(e) => handleUpdateRow(idx, "destId", e.target.value)}
                      disabled={c.isLocked}
                      style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 6, padding: "7px 8px", fontSize: 12, fontWeight: 700, outline: "none", color: "#0F172A", background: c.isLocked ? "#F1F5F9" : "#F8FAFC", cursor: c.isLocked ? "not-allowed" : "pointer" }}
                    >
                      {isMulti && (
                        <option value="all">🌟 All Destinations (Consolidated)</option>
                      )}
                      {destinations.map((d, dIdx) => (
                        <option key={d.id !== undefined ? d.id : dIdx} value={d.id !== undefined ? d.id : dIdx}>
                          #{dIdx + 1} {d.name || d.addr || `Dest ${dIdx + 1}`} ({d.qty || 0} pcs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* File Upload for this specific challan */}
                <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <input
                    type="file"
                    ref={el => fileInputRefs.current[idx] = el}
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(idx, e)}
                    style={{ display: "none" }}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {!c.isLocked && (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        style={{
                          background: "#F0FDFA",
                          color: "#0F766E",
                          border: "1px dashed #5EEAD4",
                          borderRadius: 6,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}
                      >
                        📎 {c.newFile ? "Change DC File" : "Upload DC File (PDF/Image)"}
                      </button>
                    )}

                    {c.newFile ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                        <span style={{ fontWeight: 800, color: "#166534" }}>📄 {c.newFile.name}</span>
                        <span style={{ color: "#15803D" }}>({formatSize(c.newFile.size)})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 900, marginLeft: 2 }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ) : c.challanFile ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                        <span style={{ color: "#059669", fontWeight: 700 }}>✓ Existing:</span>
                        <a
                          href={c.challanFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563EB", fontWeight: 800, textDecoration: "underline" }}
                        >
                          View DC Document
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>Optional file upload</span>
                    )}
                  </div>

                  {c.qty > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                      Allocated: <b>{c.qty} pcs</b>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Challan Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={handleAddChallanRow}
              style={{
                background: "#FFFFFF",
                color: "#2563EB",
                border: "1.5px dashed #3B82F6",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              ➕ Add Another Delivery Challan
            </button>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>
              Total: <b style={{ color: "#1D4ED8" }}>{challans.length} Challan(s)</b> · <b style={{ color: "#0D9488" }}>{totalAllocatedQty} pcs</b>
            </div>
          </div>

          {/* Confirm & Save Button */}
          <PBtn onClick={confirm} disabled={isSubmitting} full color="#2563EB" bg="#EFF6FF" border="#BFDBFE">
            {isSubmitting
              ? "Saving Delivery Challan(s)..."
              : isEditing
                ? `✓ Save Changes (${challans.length} DC · ${totalAllocatedQty} pcs)`
                : `✓ Save Delivery Challan (${challans.length} DC · ${totalAllocatedQty} pcs) & Proceed →`}
          </PBtn>
        </>
      )}
    </PCard>
  );
}
