/**
 * MaterialInward.jsx
 * Design: STORES_INWARD_OUTWARD_v22.1 — HEARTBEAT
 */

import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoordRFQs } from "../../reducer/rfqReducer";
import InwardPanel from "./components/InwardPanel";
import ImageLightbox from "../common/ImageLightbox";
import { axiosInstance } from "../../utils/url/config";

function flattenAwards(coordRFQs) {
    const result = [];
    coordRFQs.forEach(rfq => {
        (rfq.awards || []).forEach(award => {
            const stage = award.coordStage || "";
            const hasActivity = award.inwardReceived > 0 || award.inwardGood > 0 || award.inwardIssued > 0;
            if (stage !== "QC CHECK" && stage !== "STORES INWARD" && stage !== "EN ROUTE" && !hasActivity) return;

            const splitSchedule = award.deliverySchedule || [];
            let latestSplitDate = null;
            if (splitSchedule.length > 0) {
                const latest = splitSchedule.reduce((prev, s) => {
                    const d = s.date ? new Date(s.date) : null;
                    const prev_d = prev?.date ? new Date(prev.date) : null;
                    return d && (!prev_d || d > prev_d) ? s : prev;
                }, null);
                if (latest?.date) {
                    const base = new Date(latest.date);
                    if (latest.time) {
                        const [h, m] = latest.time.split(':').map(Number);
                        base.setHours(h || 0, m || 0, 0, 0);
                    }
                    latestSplitDate = base;
                }
            }

            const hasEtaUpdatedLog = award.coordLogs?.some(l => l.action === "ETA UPDATED");
            const isManuallyEdited = !!award.oldPoDeliveryDate || hasEtaUpdatedLog;
            const baseSplitEta = latestSplitDate || award.poDeliveryDate || rfq.deliveryDate || rfq.deadline;
            const poDeliveryDate = isManuallyEdited ? award.poDeliveryDate : baseSplitEta;

            const today = new Date();
            const dt = poDeliveryDate ? new Date(poDeliveryDate) : null;
            const isExpectedToday = dt && dt.getFullYear() === today.getFullYear() &&
                dt.getMonth() === today.getMonth() &&
                dt.getDate() === today.getDate();

            const isOverdue = dt && dt < today.setHours(0, 0, 0, 0);

            result.push({
                _id: `${rfq._id}_${award.poNumber}`,
                rfqId: rfq._id,
                rfqUid: rfq.uid || rfq._id?.slice(-6),
                jobId: rfq.subJobNo && rfq.subJobNo !== "MANUAL" ? `${rfq.subJobNo}` : rfq.jobNo || "—",
                vendor: award.vendorName || "—",
                material: rfq.name || "—",
                poNumber: award.poNumber,
                coordStage: award.coordStage,
                ordered: Number(award.qty) || 0,
                received: Number(award.inwardReceived) || 0,
                qcGood: Number(award.inwardGood) || 0,
                qcBad: Number(award.inwardRejected) || 0,
                issued: Number(award.inwardIssued) || 0,
                returned: Number(award.inwardReturned) || 0,
                totalReIn: Number(award.inwardReinward) || 0,
                isEscalated: award.inwardIsEscalated || false,
                isExpectedToday,
                isOverdue,
                is_on_hold: rfq.is_on_hold || false,
                history: award.inwardHistory || [],
                coordLogs: award.coordLogs || [],
                poDeliveryDate,
                reference_no: rfq.reference_no || "",
                org_image: rfq.org_image || null,
            });
        });
    });
    return result;
}

const COLUMN_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];

export default function MaterialInward() {
    const dispatch = useDispatch();
    const { coordRFQs, coordLoading } = useSelector(s => s.rfq);
    const { user } = useSelector(s => s.auth);

    const [selectedId, setSelectedId] = useState(null);
    const [selectedCreator, setSelectedCreator] = useState("");
    const [creators, setCreators] = useState([]);

    const [viewMode, setViewMode] = useState('JOB');
    const [showExpectedToday, setShowExpectedToday] = useState(false);
    const [showEnRoute, setShowEnRoute] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const showFilter = user?.role?.toLowerCase() === "admin executive" || (user?.role?.toLowerCase().includes("purchase") && user?.is_head);

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

    const allItems = useMemo(() => flattenAwards(coordRFQs), [coordRFQs]);
    const activeJob = allItems.find(j => j._id === selectedId) || null;

    const filteredData = useMemo(() => {
        let data = allItems;
        if (showExpectedToday) {
            const today = new Date();
            data = data.filter(d => {
                if (!d.poDeliveryDate) return false;
                const d2 = new Date(d.poDeliveryDate);
                return d2.getFullYear() === today.getFullYear() &&
                    d2.getMonth() === today.getMonth() &&
                    d2.getDate() === today.getDate();
            });
        }
        if (showEnRoute) {
            data = data.filter(d => d.coordStage === "EN ROUTE");
        }
        return data;
    }, [allItems, showExpectedToday, showEnRoute]);

    const groups = useMemo(() => {
        const key = viewMode === 'JOB' ? 'jobId' : 'vendor';
        return [...new Set(filteredData.map(d => d[key]))].sort();
    }, [filteredData, viewMode]);

    const sortedJobsInGroup = (groupName) => {
        const key = viewMode === 'JOB' ? 'jobId' : 'vendor';
        return filteredData
            .filter(d => d[key] === groupName)
            .sort((a, b) => {
                const aComplete = a.issued >= a.ordered && a.ordered > 0;
                const bComplete = b.issued >= b.ordered && b.ordered > 0;
                if (aComplete === bComplete) return 0;
                return aComplete ? 1 : -1;
            });
    };

    const getCardStyle = (item) => {
        if (item.isEscalated) return { background: '#fef2f2', border: '3px solid #ef4444', zIndex: 10 };
        if (item.issued >= item.ordered && item.ordered > 0) return { background: '#f5f3ff', border: '2px solid #ddd6fe', borderLeft: '6px solid #7c3aed' };
        if (item.issued > 0) return { background: '#f0fdf4', border: '1px solid #e2e8f0', borderLeft: '6px solid #22c55e' };
        return { background: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '6px solid #cbd5e1' };
    };

    const getTextColor = (item) => {
        if (item.issued >= item.ordered && item.ordered > 0) return '#5b21b6';
        return undefined;
    };

    return (
        <div style={{ display: 'flex', width: '100%', fontFamily: "'Inter', sans-serif", fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', background: '#f8fafc' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 h-[calc(100vh-90px)]">
                <header style={{ height: 96, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            <h1 style={{ fontWeight: 900, fontSize: 18, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1, color: '#0f172a', margin: 0 }}>
                                Material Inward
                            </h1>
                            <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                                {['JOB', 'VENDOR'].map(m => (
                                    <button key={m} onClick={() => setViewMode(m)}
                                        style={{ padding: '4px 24px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', fontStyle: 'italic', background: viewMode === m ? 'white' : 'transparent', color: viewMode === m ? '#2563eb' : '#64748b', boxShadow: viewMode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <button onClick={() => setShowExpectedToday(!showExpectedToday)}
                                    style={{ padding: '6px 16px', border: '2px solid #ea580c', borderRadius: 8, fontSize: 10, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', background: showExpectedToday ? '#ea580c' : 'transparent', color: showExpectedToday ? 'white' : '#ea580c' }}>
                                    ⏱ Expected Today
                                </button>

                                {/* Search Bar */}
                                <div className="relative group ml-2">
                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-xs"></i>
                                    <input
                                        type="text"
                                        placeholder="SEARCH BY JOB / PO / VENDOR / REF..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white border-2 border-slate-200 rounded py-2 pl-9 pr-10 w-56 sm:w-80 text-[10px] font-black italic uppercase tracking-wider focus:outline-none focus:border-blue-500 transition-all shadow-sm h-[32px]"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <i className="fa-solid fa-circle-xmark text-xs"></i>
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => setShowEnRoute(!showEnRoute)}
                                    style={{ padding: '6px 16px', border: '2px solid #2563eb', borderRadius: 8, fontSize: 10, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', background: showEnRoute ? '#2563eb' : 'transparent', color: showEnRoute ? 'white' : '#2563eb' }}>
                                    🚚 En-Route
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 3 }} /> ESCALATED</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 3 }} /> PARTIAL</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#f5f3ff', border: '2px solid #7c3aed', borderRadius: 3 }} /> COMPLETED</div>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, padding: 24, display: 'flex', gap: 24, overflowX: 'auto', overflowY: 'hidden', background: '#f8fafc', scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}>
                    {groups.length === 0 && !coordLoading && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                            <div>No items in Material Inward queue</div>
                        </div>
                    )}
                    {groups.map((group, idx) => {
                        const items = sortedJobsInGroup(group);
                        return (
                            <div key={group} style={{ minWidth: 380, maxWidth: 380, background: '#ffffff', borderRadius: 16, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                                <div style={{ height: 8, width: '100%', background: COLUMN_COLORS[idx % COLUMN_COLORS.length] }} />
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{group}</span>
                                    <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>{items.length} POS</span>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                                    {coordLoading ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: 32, opacity: 0.3 }}>
                                            <div style={{ width: 24, height: 24, border: '3px solid #0f172a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        </div>
                                    ) : items.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3, fontSize: 10 }}>No POs</div>
                                    ) : items.map(item => {
                                        const txtColor = getTextColor(item);
                                        return (
                                            <div key={item._id}
                                                onClick={() => setSelectedId(item._id)}
                                                style={{
                                                    ...getCardStyle(item),
                                                    borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ color: txtColor || '#2563eb', textDecoration: 'underline', textDecorationColor: '#bfdbfe' }}>{item.poNumber}</span>
                                                            {item.isExpectedToday && <span style={{ background: '#ea580c', color: 'white', padding: '1px 6px', borderRadius: 4, fontSize: 9 }}>DUE TODAY</span>}
                                                            {item.coordStage === "EN ROUTE" && <span style={{ background: '#2563eb', color: 'white', padding: '1px 6px', borderRadius: 4, fontSize: 9 }}>EN-ROUTE</span>}
                                                            {item.is_on_hold && item.coordStage === "EN ROUTE" && (
                                                                <span style={{ background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: 4, fontSize: 9 }} className="animate-pulse">ON HOLD</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                                                            <span style={{ fontStyle: 'italic', opacity: 0.5, color: '#3b4048ff', textDecoration: 'none' }}>
                                                                {item.jobId} <span>[{item.rfqUid}]</span>
                                                                {item.reference_no && <span style={{ marginLeft: 8, color: '#64748b' }}>({item.reference_no})</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {item.org_image && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const src = item.org_image.startsWith('http') ? item.org_image : `${import.meta.env.VITE_BACKEND_URL}/${item.org_image}`;
                                                                setPreviewImage(src);
                                                            }}
                                                            style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}
                                                        >
                                                            <img src={item.org_image.startsWith('http') ? item.org_image : `${import.meta.env.VITE_BACKEND_URL}/${item.org_image}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="cursor-zoom-in" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 style={{ fontWeight: 900, fontSize: 12, lineHeight: 1.3, marginBottom: 4, fontStyle: 'italic', textTransform: 'uppercase', color: txtColor || '#0f172a' }}>{item.material}</h3>
                                                <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 900, marginBottom: 12, fontStyle: 'italic', textTransform: 'uppercase', color: txtColor || '#0f172a' }}>{item.vendor}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 12, textAlign: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.4, marginBottom: 2 }}>PO</div>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: txtColor || '#0f172a' }}>{item.ordered}</div>
                                                    </div>
                                                    <div style={{ flex: 1, borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.4, color: '#1c63d6ff', marginBottom: 2 }}>RECD</div>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: '#3b82f6' }}>{item.received}</div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.4, color: '#0ec451ff', marginBottom: 2 }}>STK</div>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: '#16a34a' }}>{item.qcGood - item.issued}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <InwardPanel isOpen={!!selectedId} item={activeJob} onClose={() => setSelectedId(null)} />
            <ImageLightbox src={previewImage} fileName={previewImage?.split('/').pop().split('---').pop() || 'Preview'} onClose={() => setPreviewImage(null)} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                @keyframes pulse-red { 0% { box-shadow: 0 0 0px #ef4444; } 50% { box-shadow: 0 0 15px #ef4444; } 100% { box-shadow: 0 0 0px #ef4444; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { height: 8px; width: 8px; }
                ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #64748b; }
            `}</style>
        </div>
    );
}
