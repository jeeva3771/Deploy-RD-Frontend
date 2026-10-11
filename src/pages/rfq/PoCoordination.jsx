/**
 * PoCoordination.jsx — Main orchestrator for Procurement Coordination.
 *
 * Components are split into:
 *   coord/coordUtils.js       — constants, helpers, CSS
 *   coord/CoordShared.jsx     — ConfirmModal, EtaUpdateModal, LogEntry
 *   coord/CoordKanban.jsx     — JobCard, KanbanColumn, CoordHeader
 *   coord/VendorBatchDesk.jsx — Vendor Desk side panel
 *   coord/StarLedger.jsx      — QC/Stores audit ledger
 */

import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoordRFQs, updateAwardCoordStage, updateAwardCoordETA, restoreAwardCoordETA, acceptAwardQtyChange, acceptAwardDateChange, awardInwardAction } from "../../reducer/rfqReducer";
import { toast } from "react-toastify";
import { axiosInstance } from "../../utils/url/config";

import {
    COORD_STAGES,
    COORD_CSS,
    getCountdown,
    mapRfqToCoordStage,
    isPostponedPO,
} from "./coord/coordUtils";

import { EtaUpdateModal, QtyModal, DateModal, EscalationModal } from "./coord/CoordShared";
import { JobCard, KanbanColumn, CoordHeader } from "./coord/CoordKanban";
import { VendorBatchDesk } from "./coord/VendorBatchDesk";
import { StarLedger } from "./coord/StarLedger";
import ImageLightbox from "../common/ImageLightbox";

// Main Component
export default function PoCoordination() {
    const dispatch = useDispatch();
    const { coordRFQs, coordLoading } = useSelector(state => state.rfq);
    const { user } = useSelector(state => state.auth);

    const [tab, setTab] = useState("JOB");
    const [selectedCreator, setSelectedCreator] = useState("");
    const [creators, setCreators] = useState([]);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [ledgerRfqId, setLedgerRfqId] = useState(null);
    const [etaEditRfq, setEtaEditRfq] = useState(null);
    const [escEditRfq, setEscEditRfq] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Visible only for Admin or Purchase Head
    const showFilter = user?.role?.toLowerCase() === "admin executive" || (user?.role?.toLowerCase().includes("purchase") && user?.is_head);

    // Load on mount / creator change
    // Alerts & Filtering
    const [filterToday, setFilterToday] = useState(false);
    const [alertModal, setAlertModal] = useState(null); // null | 'QTY' | 'DATE'

    // Load on mount
    useEffect(() => {
        dispatch(fetchCoordRFQs({ creatorId: selectedCreator, search: debouncedSearch }));
    }, [dispatch, selectedCreator, debouncedSearch]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (showFilter) {
            const getCreators = async () => {
                try {
                    const { data } = await axiosInstance.get("/user?roleName=Purchase Manager,Purchase Coordinator,admin executive&is_active=true");
                    if (data.success) setCreators(data.data || []);
                } catch (err) {
                    console.error("Error fetching creators:", err);
                }
            };
            getCreators();
        }
    }, [showFilter]);

    // Flatten awards → individual PO cards 
    const cards = useMemo(() => {
        const flatCards = [];
        coordRFQs.forEach(rfq => {
            (rfq.awards || []).forEach(award => {
                // If PO has split deliveries, use the latest split's date+time as the effective ETA
                const splitSchedule = award.deliverySchedule || [];
                let latestSplitDate = null;
                if (splitSchedule.length > 0) {
                    const latest = splitSchedule.reduce((prev, s) => {
                        const d = s.date ? new Date(s.date) : null;
                        const prev_d = prev?.date ? new Date(prev.date) : null;
                        return d && (!prev_d || d > prev_d) ? s : prev;
                    }, null);
                    if (latest?.date) {
                        // Combine date + time string (e.g. "13:41") into a full datetime
                        const base = new Date(latest.date);
                        if (latest.time) {
                            const [h, m] = latest.time.split(':').map(Number);
                            base.setHours(h || 0, m || 0, 0, 0);
                        }
                        latestSplitDate = base;
                    }
                }
                // If the ETA was explicitly edited (oldPoDeliveryDate exists, or we have an ETA UPDATED log), 
                // use the newly edited poDeliveryDate. Otherwise fallback to latest split date, then original PO date.
                const hasEtaUpdatedLog = award.coordLogs?.some(l => l.action === "ETA UPDATED");
                const isManuallyEdited = !!award.oldPoDeliveryDate || hasEtaUpdatedLog;
                const baseSplitEta = latestSplitDate || award.poDeliveryDate || rfq.deliveryDate || rfq.deadline;
                const poDeliveryDate = isManuallyEdited ? award.poDeliveryDate : baseSplitEta;
                const countdown = getCountdown(poDeliveryDate);
                const baseStage = mapRfqToCoordStage(award);

                flatCards.push({
                    ...rfq,
                    _id: `${rfq._id}_${award.poNumber}`,
                    rfqId: rfq._id,
                    poNumber: award.poNumber,
                    vendorName: award.vendorName,
                    qty: award.qty,
                    poDeliveryDate,
                    oldPoDeliveryDate: award.oldPoDeliveryDate,
                    coordStage: award.coordStage,
                    coordLogs: award.coordLogs || [],
                    inwardAccounting: {
                        ordered: award.inwardOrdered ?? award.qty ?? 0,
                        inwardGood: award.inwardGood || 0,
                        rejected: award.inwardRejected || 0,
                        reInward: award.inwardReinward || 0,
                        lastUpdated: award.inwardUpdatedAt,
                        // Transaction Audit Protocol fields
                        received: Number(award.inwardReceived) || 0,
                        issued: Number(award.inwardIssued) || 0,
                        returned: Number(award.inwardReturned) || 0,
                        history: award.inwardHistory || [],
                        isEscalated: award.inwardIsEscalated || false,
                    },
                    // _isPostponed: ETA was moved backward vs previous, OR date is past today
                    deliverySchedule: award.deliverySchedule || [],
                    isSplit: (award.deliverySchedule?.length > 1) || rfq.isSplit,
                    _coordStage: baseStage,
                    _isPostponed: isPostponedPO(award, poDeliveryDate),
                    _selected: selectedIds.has(`${rfq._id}_${award.poNumber}`),
                    org_image: rfq.org_image || null,
                    // Proposed Changes Alerts
                    pendingQtyChange: award.pendingQtyChange || false,
                    newQtyRequest: award.newQtyRequest || null,
                    currentJobQty: award.currentJobQty || 0,
                    pendingDateChange: award.pendingDateChange || false,
                    newDateRequest: award.newDateRequest || null,
                    current_delivery_date: award.current_delivery_date || null,
                    pendingJobCompletionChange: award.pendingJobCompletionChange || false,
                    newJobCompletionRequest: award.newJobCompletionRequest || null,
                    current_job_completion_date: award.current_job_completion_date || null,
                });
            });
        });
        return flatCards;
    }, [coordRFQs, selectedIds]);

    // Columns 
    const columns = useMemo(() => {
        if (tab === "VENDOR") return [...new Set(cards.map(c => c.vendorName).filter(Boolean))];
        if (tab === "MATERIAL") return [...new Set(cards.map(c => c.name || "OTHER"))];
        return COORD_STAGES;
    }, [tab, cards]);

    const cardsByColumn = useMemo(() => {
        // Filter by Today if toggled
        const filteredCards = filterToday
            ? cards.filter(c => {
                if (!c.poDeliveryDate) return false;
                const d = new Date(c.poDeliveryDate);
                const today = new Date();
                return d.getFullYear() === today.getFullYear() &&
                    d.getMonth() === today.getMonth() &&
                    d.getDate() === today.getDate();
            })
            : cards;

        if (tab === "VENDOR") {
            const map = {};
            columns.forEach(v => { map[v] = filteredCards.filter(c => c.vendorName === v); });
            return map;
        }
        if (tab === "MATERIAL") {
            const map = {};
            columns.forEach(m => { map[m] = filteredCards.filter(c => (c.name || "OTHER") === m); });
            return map;
        }

        const map = {};
        COORD_STAGES.forEach(s => {
            if (s === "ESCALATED") {
                map[s] = filteredCards.filter(c => c._isPostponed || c.coordStage === "ESCALATED");
            } else {
                map[s] = filteredCards.filter(c => c._coordStage === s);
            }
        });
        return map;
    }, [tab, cards, columns, filterToday]);

    const selectedCards = useMemo(() => cards.filter(c => c._selected), [cards]);
    const overdueCount = useMemo(() => cards.filter(c => getCountdown(c.poDeliveryDate) === "OVERDUE").length, [cards]);

    // Alert counts
    const qtyAlerts = useMemo(() => cards.filter(c => c.pendingQtyChange), [cards]);
    const dateAlerts = useMemo(() => cards.filter(c => c.pendingDateChange || c.pendingJobCompletionChange), [cards]);

    // Clear selections when switching tabs to prevent mixing
    useEffect(() => {
        setSelectedIds(new Set());
    }, [tab]);

    // Selection helpers
    function toggleSelect(id) {
        // Toggle single card: if it's already the only one selected, clear it.
        // Otherwise, make it the ONLY selected card.
        setSelectedIds(prev => prev.has(id) && prev.size === 1 ? new Set() : new Set([id]));
    }

    function batchAll(col) {
        // Batch overwrites everything, no mixing
        const colCards = (cardsByColumn[col] || []);
        // Important: c._id is ALREADY flattened to `${rfqId}_${poNumber}` in useMemo
        setSelectedIds(new Set(colCards.map(c => c._id)));
    }

    function clearSelection() { setSelectedIds(new Set()); }

    // Stage handlers
    function handleMoveStage(cardId, newStage) {
        const card = cards.find(c => c._id === cardId);
        if (!card) return;
        dispatch(updateAwardCoordStage({ rfqId: card.rfqId, poNumber: card.poNumber, coordStage: newStage }))
            .unwrap()
            .then(() => toast.success(`Moved PO to ${newStage}`))
            .catch(e => toast.error(e || "Failed to move stage"));
    }

    async function handlePushToEnRoute(cardId, remark) {
        const card = cards.find(c => c._id === cardId);
        if (!card) return;
        try {
            await dispatch(updateAwardCoordStage({
                rfqId: card.rfqId,
                poNumber: card.poNumber,
                coordStage: "EN ROUTE",
                note: remark || "Pushed to EN ROUTE from Vendor Desk",
            })).unwrap();
            toast.success("PO Moved to EN ROUTE → Awaiting delivery");
            setSelectedIds(prev => { const n = new Set(prev); n.delete(cardId); return n; });
        } catch (e) {
            toast.error(e || "Failed to push to EN ROUTE");
        }
    }

    async function handlePushToQCCheck(cardId, remark) {
        const card = cards.find(c => c._id === cardId);
        if (!card) return;
        try {
            await dispatch(updateAwardCoordStage({
                rfqId: card.rfqId,
                poNumber: card.poNumber,
                coordStage: "QC CHECK",
                note: remark || "Pushed to QC CHECK from Vendor Desk",
            })).unwrap();
            toast.success("PO Moved to QC CHECK → Item now visible in Material Inward");
            setSelectedIds(prev => { const n = new Set(prev); n.delete(cardId); return n; });
        } catch (e) {
            toast.error(e || "Failed to push to QC CHECK");
        }
    }

    async function handlePushToStoresInward(cardId, remark) {
        const card = cards.find(c => c._id === cardId);
        if (!card) return;
        try {
            await dispatch(updateAwardCoordStage({
                rfqId: card.rfqId,
                poNumber: card.poNumber,
                coordStage: "STORES INWARD",
                note: remark || "Pushed to STORES INWARD from Vendor Desk",
            })).unwrap();
            toast.success("PO Moved to STORES INWARD → Store team can now record inward quantities");
            setSelectedIds(prev => { const n = new Set(prev); n.delete(cardId); return n; });
        } catch (e) {
            toast.error(e || "Failed to push to STORES INWARD");
        }
    }

    function handleToggleEscalation(cardId) {
        const card = cards.find(c => c._id === cardId);
        if (!card) return;
        setEscEditRfq(card);
    }

    async function handleEscalationConfirm(remark) {
        if (!escEditRfq) return;
        try {
            await dispatch(awardInwardAction({
                rfqId: escEditRfq.rfqId,
                poNumber: escEditRfq.poNumber,
                action: "TOGGLE_ESCALATE",
                note: remark.trim()
            })).unwrap();
            const newVal = !escEditRfq.inwardAccounting?.isEscalated;
            toast.success(newVal ? "⚠️ PO Escalated Successfully" : "✅ Escalation Cleared");
            // Refresh to sync both modules
            dispatch(fetchCoordRFQs(selectedCreator));
        } catch (e) {
            toast.error(e || "Failed to toggle escalation");
        } finally {
            setEscEditRfq(null);
        }
    }

    async function handleEtaConfirm(card, newEta, remark) {
        try {
            await dispatch(updateAwardCoordETA({ rfqId: card.rfqId, poNumber: card.poNumber, deliveryDate: newEta, note: remark })).unwrap();
            toast.success(`PO ETA updated → ${newEta}`);
        } catch (e) {
            toast.error(e || "Failed to update ETA");
        }
        setEtaEditRfq(null);
    }

    async function handleRestoreEta(card) {
        try {
            const res = await dispatch(restoreAwardCoordETA({ rfqId: card.rfqId, poNumber: card.poNumber })).unwrap();
            toast.success(res.message || "ETA Restored");
        } catch (error) {
            toast.error(error || "Failed to restore ETA");
        }
    }

    async function handleAcceptQty(card) {
        try {
            await dispatch(acceptAwardQtyChange({ rfqId: card.rfqId, poNumber: card.poNumber })).unwrap();
            toast.success("Acknowledge Quantity successfully");
            if (qtyAlerts.length <= 1) setAlertModal(null);
        } catch (error) {
            toast.error(error || "Failed to accept qty change");
        }
    }

    async function handleAcceptDate(card) {
        try {
            await dispatch(acceptAwardDateChange({ rfqId: card.rfqId, poNumber: card.poNumber })).unwrap();
            toast.success("Acknowledge Dates successfully");
            if (dateAlerts.length <= 1) setAlertModal(null);
        } catch (error) {
            toast.error(error || "Failed to accept date change");
        }
    }

    // Render
    const ledgerRfq = cards.find(c => c._id === ledgerRfqId);

    return (
        <>
            <ImageLightbox
                src={previewImage}
                fileName={previewImage?.split('/').pop().split('---').pop() || 'Preview'}
                onClose={() => setPreviewImage(null)}
            />
            <style>{COORD_CSS}</style>
            <div
                className=" 
                po-root flex-1 flex flex-col relative overflow-hidden bg-slate-50 h-[calc(100vh-90px)] "
            >
                <CoordHeader
                    tab={tab}
                    setTab={setTab}
                    totalCards={cards.length}
                    overdueCount={overdueCount}
                    onRefresh={() => dispatch(fetchCoordRFQs(selectedCreator))}
                    qtyCount={qtyAlerts.length}
                    dateCount={dateAlerts.length}
                    filterToday={filterToday}
                    setFilterToday={setFilterToday}
                    onOpenQty={() => setAlertModal("QTY")}
                    onOpenDate={() => setAlertModal("DATE")}
                    // onRefresh={() => dispatch(fetchCoordRFQs())}
                    loading={coordLoading}
                    showFilter={showFilter}
                    selectedCreator={selectedCreator}
                    setSelectedCreator={setSelectedCreator}
                    creators={creators}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-stretch relative h-full custom-scroll">
                    {columns.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-slate-300 text-[10px] tracking-widest">
                            {/* No Active POs Found */}
                        </div>
                    ) : columns.map(col => {
                        const colCards = cardsByColumn[col] || [];
                        const isEsc = col === "ESCALATED";

                        // VENDOR / MATERIAL tabs — simple column layout
                        if (tab !== "JOB") {
                            return (
                                <div key={col} className="kanban-col shadow-sm">
                                    <div className="p-4 bg-slate-900 text-white rounded-t-[10px] flex justify-between items-center flex-shrink-0">
                                        <div>
                                            <div className="text-[11px] tracking-widest truncate max-w-[180px]">{col}</div>
                                            <div className="text-[11px] opacity-50 mt-0.5">{colCards.length} JOBS</div>
                                        </div>
                                        <button onClick={() => batchAll(col)} className="text-[9px] bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg font-black italic">BATCH ALL</button>
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                                        {colCards.length === 0
                                            ? <div className="text-center py-10 text-[9px] text-slate-300 tracking-widest">NO JOBS</div>
                                            : colCards.map(rfq => (
                                                <JobCard
                                                    key={rfq._id}
                                                    rfq={rfq}
                                                    coordStage={rfq._coordStage}
                                                    onToggleSelect={toggleSelect}
                                                    onOpenLedger={setLedgerRfqId}
                                                    onPreviewImage={setPreviewImage}
                                                    onToggleEscalate={handleToggleEscalation}
                                                />
                                            ))
                                        }
                                    </div>
                                </div>
                            );
                        }

                        // JOB tab — stage-based columns
                        return (
                            <div key={col} className="kanban-col shadow-sm">
                                <div className={`p-4 ${isEsc ? "bg-red-600" : "bg-slate-900"} text-white rounded-t-[10px] flex justify-between items-center flex-shrink-0`}>
                                    <div>
                                        <div className="text-[11px] tracking-widest">{isEsc ? "ESCALATIONS" : col}</div>
                                        <div className="text-[11px] opacity-50 mt-0.5">{colCards.length} JOBS</div>
                                    </div>
                                    <button onClick={() => batchAll(col)} className="text-[9px] bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg font-black italic">BATCH ALL</button>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                                    {colCards.length === 0
                                        ? <div className="text-center py-10 text-[9px] text-slate-300 tracking-widest">NO JOBS</div>
                                        : colCards.map(rfq => (
                                            <JobCard
                                                key={rfq._id}
                                                rfq={rfq}
                                                coordStage={rfq._coordStage}
                                                onToggleSelect={toggleSelect}
                                                onOpenLedger={setLedgerRfqId}
                                                onPreviewImage={setPreviewImage}
                                                onToggleEscalate={handleToggleEscalation}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {!coordLoading && cards.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-4 pointer-events-none">
                        <div className="text-5xl">📦</div>
                        <div className="text-[12px] tracking-[0.4em] font-black italic uppercase">No Active POs Found</div>
                        <div className="text-[9px] tracking-widest opacity-60">Award vendors in the RFQ module first</div>
                    </div>
                )}
            </div>

            {/* Vendor Batch Desk */}
            {selectedCards.length > 0 && (
                <VendorBatchDesk
                    selectedCards={selectedCards}
                    onClose={clearSelection}
                    onEtaEdit={rfq => setEtaEditRfq(rfq)}
                    onRestoreEta={handleRestoreEta}
                    onPushToEnRoute={handlePushToEnRoute}
                    onPushToQCCheck={handlePushToQCCheck}
                    onPushToStoresInward={handlePushToStoresInward}
                    onToggleEscalate={handleToggleEscalation}
                />
            )}

            {/* ETA Edit Modal */}
            {etaEditRfq && (
                <EtaUpdateModal
                    job={etaEditRfq}
                    onConfirm={(newEta, remark) => handleEtaConfirm(etaEditRfq, newEta, remark)}
                    onCancel={() => setEtaEditRfq(null)}
                />
            )}

            {/* Escalation Modal */}
            {escEditRfq && (
                <EscalationModal
                    job={escEditRfq}
                    isEscalated={escEditRfq.inwardAccounting?.isEscalated}
                    onConfirm={handleEscalationConfirm}
                    onCancel={() => setEscEditRfq(null)}
                />
            )}

            {/* Star Ledger */}
            {ledgerRfq && (
                <StarLedger
                    rfq={ledgerRfq}
                    onClose={() => setLedgerRfqId(null)}
                />
            )}

            {/* Proposed Alerts Modals */}
            {alertModal === "QTY" && (
                <QtyModal
                    requests={qtyAlerts}
                    onAccept={handleAcceptQty}
                    onClose={() => setAlertModal(null)}
                />
            )}
            {alertModal === "DATE" && (
                <DateModal
                    requests={dateAlerts}
                    onAccept={handleAcceptDate}
                    onClose={() => setAlertModal(null)}
                />
            )}
        </>
    );
}