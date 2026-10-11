export const PACK_STAGES = [
  { id: "qc_pending", label: "Receive QC", icon: "📦", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { id: "pmat_pending", label: "Packing Material", icon: "🗃", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
  { id: "instructions", label: "Instructions & Files", icon: "📋", color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD" },
  { id: "challan", label: "Delivery Challan", icon: "📑", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  { id: "processing", label: "File Processed", icon: "⚙️", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  { id: "packing", label: "Packing In Progress", icon: "📫", color: "#EC4899", bg: "#FDF2F8", border: "#F9A8D4" },
  { id: "logistics", label: "Courier / Dispatch", icon: "🚚", color: "#0D9488", bg: "#F0FDFA", border: "#99F6E4" },
  { id: "complete", label: "Complete", icon: "🏆", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
];
export function stageInfo(id) { 
  const targetId = id === "pmat_received" ? "pmat_pending" : id;
  return PACK_STAGES.find((s) => s.id === targetId) || PACK_STAGES[0]; 
}
export function stageIndex(id) { 
  const targetId = id === "pmat_received" ? "pmat_pending" : id;
  return PACK_STAGES.findIndex((s) => s.id === targetId); 
}
export function nowStamp() {
  return new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function getTargetPackQty(job) {
  if (!job) return 0;
  const totalQty = job.total_qty || job.qty || 0;
  const qcGoodQty = job.qc_good_qty || 0;

  // Only allow net passed good stock target after QC lifecycle is complete
  if (job.qc_completed) {
    return qcGoodQty > 0 ? qcGoodQty : totalQty;
  }

  // While QC audit is still in progress, require full order quantity
  return totalQty;
}

// ─── SEED DATA ──
export const SEED_PACK_JOBS = [
  {
    id: "RD-2501", client: "Insurance Corp", product: "Shimmer Trophy", qty: 118, fgReceivedQty: 118,
    invoiceNo: "RD/INV/2026/2501", clientContact: "Priya Sharma",
    stage: "qc_pending", qcAcceptedQty: 0, qcAcceptedBy: "", qcAcceptedDt: "", qcPartial: false,
    pmatStatus: "pending",
    pmatItems: [
      { id: "pm1", name: 'Corrugated Box 12×10×8"', qty: 12, unit: "nos", received: false, receivedQty: 0 },
      { id: "pm2", name: "Bubble Wrap Roll", qty: 2, unit: "rolls", received: false, receivedQty: 0 },
      { id: "pm3", name: "Thermocol Sheets", qty: 24, unit: "pcs", received: false, receivedQty: 0 },
      { id: "pm4", name: "Printed Inserts / Cards", qty: 118, unit: "pcs", received: false, receivedQty: 0 },
    ],
    instructionType: "excel", instructionFile: "RD-2501_dispatch_list.xlsx",
    instructionNote: "118 trophies — 6 regional offices. Excel has address + qty per row.",
    destinationType: "multiple",
    destinations: [
      { id: "d1", name: "Mumbai HO", addr: "Insurance House BKC Mumbai", qty: 30, awb: "", courier: "", status: "pending" },
      { id: "d2", name: "Delhi Branch", addr: "Connaught Place, New Delhi", qty: 25, awb: "", courier: "", status: "pending" },
      { id: "d3", name: "Bengaluru", addr: "Whitefield, Bengaluru", qty: 20, awb: "", courier: "", status: "pending" },
      { id: "d4", name: "Chennai", addr: "Anna Nagar, Chennai", qty: 18, awb: "", courier: "", status: "pending" },
      { id: "d5", name: "Hyderabad", addr: "HITEC City, Hyderabad", qty: 15, awb: "", courier: "", status: "pending" },
      { id: "d6", name: "Pune", addr: "Baner, Pune", qty: 10, awb: "", courier: "", status: "pending" },
    ],
    dispatchType: "courier", courierName: "", awbNumbers: [], shipments: [], dispatchDt: "", expectedDelivery: "",
    handDelivery: [], clientPickup: [],
    labelsGenerated: false, labelsUploaded: false, labelFile: "", packingDt: "", packedBy: "", completedDt: "", logs: [],
  },
  {
    id: "RD-2503", client: "Bank Awards", product: "Medal + Lanyard", qty: 200, fgReceivedQty: 200,
    invoiceNo: "RD/INV/2026/2503", clientContact: "Rahul Mehta",
    stage: "qc_pending", qcAcceptedQty: 0, qcAcceptedBy: "", qcAcceptedDt: "", qcPartial: false,
    pmatStatus: "pending",
    pmatItems: [
      { id: "pm1", name: 'Gift Box 6×4×2"', qty: 200, unit: "nos", received: false, receivedQty: 0 },
      { id: "pm2", name: "Velvet Pouch (Medal)", qty: 200, unit: "nos", received: false, receivedQty: 0 },
      { id: "pm3", name: "Certificate Envelope", qty: 200, unit: "nos", received: false, receivedQty: 0 },
    ],
    instructionType: "single", instructionFile: "", instructionNote: "All 200 sets to a single venue.",
    destinationType: "single",
    destinations: [{ id: "d1", name: "Bank of Awards HQ", addr: "Nariman Point, Mumbai 400021", qty: 200, awb: "", courier: "", status: "pending" }],
    dispatchType: "hand_delivery", courierName: "", awbNumbers: [], shipments: [], dispatchDt: "", expectedDelivery: "",
    handDelivery: [], clientPickup: [],
    labelsGenerated: false, labelsUploaded: false, labelFile: "", packingDt: "", packedBy: "", completedDt: "", logs: [],
  },
];
