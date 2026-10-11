import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { PiCheckCircleFill, PiEnvelopeSimpleFill, PiCopyBold, PiCamera } from 'react-icons/pi';
import { axiosInstance } from '../../../utils/url/config';
import { broadcastRFQ, fetchItems, updateRFQ, patchRFQImage } from '../../../reducer/rfqReducer';
import { toast } from 'react-toastify';
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";

const STAGES = [
    { name: "1. Draft RFQ", color: "bg-slate-500" },
    { name: "2. Assign Vendors", color: "bg-indigo-600" },
    { name: "3. Review (Negotiate)", color: "bg-amber-500" },
    { name: "4. PO Awarded", color: "bg-green-600" },
    { name: "5. In Process", color: "bg-orange-500" },
    { name: "6. Delivery", color: "bg-blue-500" }
];

const WorkflowModal = ({ item, onClose, onUpdate }) => {
    const dispatch = useDispatch();
    /* ── Local state ── */
    const [stage, setStage] = useState(item.stage || STAGES[0].name);
    const [delDate, setDelDate] = useState(item.deliveryDate ? (typeof item.deliveryDate === 'string' ? item.deliveryDate.split('T')[0] : new Date(item.deliveryDate).toISOString().split('T')[0]) : item.deadline ? (typeof item.deadline === 'string' ? item.deadline.split('T')[0] : new Date(item.deadline).toISOString().split('T')[0]) : '');
    const [delTime, setDelTime] = useState(item.deliveryTime || '');
    const [delType, setDelType] = useState(item.isSplit ? 'SPLIT' : 'SINGLE');
    const [linksDuration, setLinksDuration] = useState(item.linksDuration || 48);
    const [remarks, setRemarks] = useState(item.remarks || '');
    const [shareTypeModal, setShareTypeModal] = useState({ isOpen: false, action: null });

    /* Vendor section */
    const [vendors, setVendors] = useState([]);
    const [vendorsLoading, setVendorsLoading] = useState(false);
    const [selectedVendors, setSelectedVendors] = useState([]);  // array of vendor _id strings
    const [broadcasting, setBroadcasting] = useState(false);
    const [schedule, setSchedule] = useState(item.deliverySchedule?.length ? item.deliverySchedule.map(s => ({
        date: s.date ? new Date(s.date).toISOString().slice(0, 16) : '',
        qty: s.qty
    })) : [{ date: '', qty: item.qty }]);
    const [searchTerm, setSearchTerm] = useState('');

    /* Quotes & Awards */
    const [quoteLink, setQuoteLink] = useState('');
    const [copied, setCopied] = useState(false);

    /* Quotes & Awards */
    const [quotes, setQuotes] = useState(item.quotes || []);
    const [awards, setAwards] = useState(item.awards || []);

    /* Image upload */
    const [sendingPO, setSendingPO] = useState(false);
    const imgFileRef = useRef(null);
    const [localImage, setLocalImage] = useState(item.image || null);
    const [dbMaxPo, setDbMaxPo] = useState(null);

    /* Stale action conflict — shown as in-modal overlay instead of toast */
    const [staleError, setStaleError] = useState(null);

    /* ── Load latest DB PO Number ── */
    useEffect(() => {
        axiosInstance.get('/rfq/next-po/fetch').then(res => {
            if (res.data?.success) setDbMaxPo(res.data.maxPo);
        }).catch(err => console.error("Error fetching max PO", err));
    }, []);

    /* ── Load vendors by material category when modal opens ── */
    useEffect(() => {
        setVendorsLoading(true);
        const params = {};

        // Resolve all possible identifiers
        const m_cat_id = typeof item.material_category_id === 'object' ? item.material_category_id?._id : (item.material_category_id || '');
        const m_type_id = typeof item.material_type_id === 'object' ? item.material_type_id?._id : (item.material_type_id || '');
        const c_id = typeof item.category_id === 'object' ? item.category_id?._id : (item.category_id || '');
        const c_name = item.category || '';

        if (m_cat_id) params.material_category_id = m_cat_id;
        if (m_type_id) params.material_type_id = m_type_id;
        if (c_id) params.category_id = c_id;
        if (c_name) params.category_name = c_name;
        if (item.vendorName) params.recommended_vendor = item.vendorName;

        axiosInstance.get('/rfq/vendors-by-material', { params })
            .then(res => {
                if (res.data.success) setVendors(res.data.data);
            })
            .catch(err => console.error('Error fetching vendors:', err))
            .finally(() => setVendorsLoading(false));
    }, [item.material_category_id, item.material_type_id, item.category, item.category_id, item.vendorName]);

    // Pre-select vendors that were already assigned
    useEffect(() => {
        if (item.selectedVendors?.length) {
            setSelectedVendors(item.selectedVendors.map(v => v?._id || v));
        }
    }, [item.selectedVendors]);

    /* ── Derived ── */
    const stageColor = STAGES.find(s => s.name === stage)?.color || 'bg-slate-500';
    const bestRate = quotes.length ? Math.min(...quotes.map(q => q.rate)) : null;
    const bestDays = quotes.length ? Math.min(...quotes.map(q => q.delDays)) : null;

    // Map vendorId → vendorName from the loaded vendors list.
    // Ensures Stage 2 shows real names even when selectedVendors are raw ObjectId strings.
    const vendorIdToName = {};
    vendors.forEach(v => { vendorIdToName[String(v._id)] = v.name; });

    const filteredVendors = vendors
        .filter(v =>
            v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // v.service_category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.material_categories?.some(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            v.material_types?.some(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            v.mobile_no?.toString().includes(searchTerm)
        )
        .sort((a, b) => {
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            if (a.isMatched && !b.isMatched) return -1;
            if (!a.isMatched && b.isMatched) return 1;
            return 0;
        });

    const toggleVendor = (id) => {
        if (item.is_on_hold) return;
        setSelectedVendors(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    /* ── Award Vendor ── */
    const toggleAward = (vendorName) => {
        if (item.is_on_hold) return;
        const q = quotes.find(x => x.vendorName === vendorName);
        if (!q) return;

        if (awards.find(a => a.vendorName === vendorName)) {
            setAwards(prev => prev.filter(a => a.vendorName !== vendorName));
        } else {
            let maxStr = dbMaxPo || 0;
            awards.forEach(a => {
                if (a.poNumber && a.poNumber.startsWith('PO-')) {
                    const n = parseInt(a.poNumber.replace('PO-', ''), 10);
                    if (n > maxStr) maxStr = n;
                }
            });
            const nextPo = `PO-${String(maxStr + 1).padStart(5, '0')}`;
            const defDate = item.deliveryDate ? item.deliveryDate.split('T')[0] : '';
            const defTime = item.deliveryTime || '';
            setAwards(prev => [...prev, {
                vendorName,
                qty: item.qty,
                rate: q.rate,
                trans: 0,
                tax: '18% GST',
                poNumber: nextPo,
                deliverySchedule: [{ date: defDate, time: defTime, qty: item.qty }]
            }]);
        }
    };
    const updateAward = (idx, field, val) => setAwards(prev => {
        const n = [...prev];
        n[idx] = { ...n[idx], [field]: val };
        return n;
    });

    /* ── Image upload from within modal ── */
    const handleModalImageClick = () => imgFileRef.current?.click();
    const handleModalFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const result = await dispatch(patchRFQImage({ id: item._id, img: file })).unwrap();
            setLocalImage(result.image || localImage);
            toast.success('Image updated!');
        } catch (err) {
            toast.error('Image upload failed');
        }
        e.target.value = '';
    };

    /* ── Broadcast: use Redux thunk ── */
    const handleBroadcast = async (method) => {
        if (selectedVendors.length === 0) return;
        setBroadcasting(true);
        try {
            const result = await dispatch(broadcastRFQ({
                id: item._id,
                vendorIds: selectedVendors,
                deliveryDate: delDate,
                deliveryTime: delTime,
                isSplit: delType === 'SPLIT',
                schedule: delType === 'SPLIT' ? schedule : [],
                linksDuration: Number(linksDuration),
                remarks: remarks,
                sendEmail: method === 'email' || method === 'both',
                sendWhatsapp: method === 'whatsapp' || method === 'both'
            })).unwrap();

            const link = result.quoteLink;
            setQuoteLink(link);
            setStage('2. Assign Vendors');

            toast.success(`Broadcasting successful! Notifications sent to ${selectedVendors.length} vendors.`);

            dispatch(fetchItems()); // Refresh parent list
        } catch (err) {
            console.error(err);
            const errMsg = typeof err === 'string' ? err : (err?.message || 'Broadcasting failed.');
            // Stale action — show in-modal overlay, let user manually refresh
            if (errMsg.includes('already been broadcast') || errMsg.includes('Please refresh')) {
                setStaleError(errMsg);
            } else {
                toast.error(errMsg);
            }
        } finally {
            setBroadcasting(false);
        }
    };


    /* ── Copy link ── */
    const copyLink = () => {
        navigator.clipboard.writeText(quoteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* ── Fetch latest quotes from backend via Redux ── */
    const refreshQuotes = async () => {
        try {
            const result = await dispatch(fetchItems()).unwrap();
            const fresh = result?.find(r => r._id === item._id);
            if (fresh?.quotes) setQuotes(fresh.quotes);
            else toast.info('No new quotes yet.');
        } catch (err) { console.error(err); }
    };

    /* ── Issue PO and send emails ── */
    const handleIssuePO = async () => {
        // Enforce split quantity matches allocated quantity
        for (const a of awards) {
            const schedQty = a.deliverySchedule?.reduce((sum, s) => sum + (Number(s.qty) || 0), 0) || 0;
            if (schedQty !== (Number(a.qty) || 0)) {
                toast.warning(`Total Split Qty (${schedQty}) does not match Qty Allocated (${a.qty}) for vendor ${a.vendorName}`);
                return; // Stop submission
            }
        }

        setSendingPO(true);
        try {
            await onUpdate({
                ...item,
                stage: STAGES[3].name,
                selectedVendors,
                quotes,
                awards,
                deliveryDate: delDate,
                deliveryTime: delTime,
                linksDuration,
                isSplit: delType === 'SPLIT',
                deliverySchedule: delType === 'SPLIT' ? schedule : []
            }, false);
            setStage(STAGES[3].name);

            // Only save the PO and move stage, emails are sent later in Allow Production
            toast.success(`POs issued! Vendors will be notified upon proceeding to production.`);
        } catch (err) {
            console.error('PO issue error:', err);
            const errMsg = typeof err === 'string' ? err : (err?.message || 'PO save failed.');
            if (errMsg.includes('already progressed') || errMsg.includes('Please refresh')) {
                setStaleError(errMsg);
            } else {
                toast.error(errMsg);
            }
        } finally {
            setSendingPO(false);
        }
    };

    /* ── Allow Production and send PO emails ── */
    const handleAllowProduction = async (method) => {
        setSendingPO(true); // Reuse spinner state
        try {
            await axiosInstance.post(`/rfq/send-po/${item._id}`, {
                awards: awards.map(a => ({
                    vendorName: a.vendorName,
                    qty: a.qty,
                    rate: a.rate,
                    tax: a.tax,
                    poNumber: a.poNumber,
                    scheduleResponse: quotes.find(q => q.vendorName === a.vendorName)?.scheduleResponses || [],
                    isScheduleConfirmed: quotes.find(q => q.vendorName === a.vendorName)?.isScheduleConfirmed || false,
                    deliverySchedule: a.deliverySchedule || [],
                })),
                rfqName: item.name,
                rfqUid: item.uid,
                jobNo: item.jobNo,
                subJobNo: item.subJobNo,
                sendEmail: method === 'email' || method === 'both',
                sendWhatsapp: method === 'whatsapp' || method === 'both'
            });
            toast.success(`Vendors notified and production allowed!`);
            setStage(STAGES[4].name);
            onUpdate({ ...item, stage: STAGES[4].name }, false).catch(err => {
                if (typeof err === 'string' && (err.includes('already progressed') || err.includes('Please refresh'))) {
                    setStaleError(err);
                }
            }); // Save state
        } catch (err) {
            console.error('Allow production error:', err);
            const errMsg = err?.response?.data?.message || err?.message || 'Failed to send PO emails.';
            if (errMsg.includes('already progressed') || errMsg.includes('Please refresh')) {
                setStaleError(errMsg);
            } else {
                toast.error(errMsg);
            }
        } finally {
            setSendingPO(false);
        }
    };

    /* ── Save & proceed ── */
    const save = async (msg) => {
        if (item.is_on_hold) return;
        try {
            await onUpdate({
                ...item,
                stage,
                selectedVendors,
                quotes,
                awards,
                deliveryDate: delDate,
                deliveryTime: delTime,
                linksDuration,
                remarks,
                isSplit: delType === 'SPLIT',
                deliverySchedule: delType === 'SPLIT' ? schedule : []
            }, msg);
        } catch (err) {
            const errMsg = typeof err === 'string' ? err : (err?.message || 'Save failed.');
            if (errMsg.includes('already progressed') || errMsg.includes('Please refresh')) {
                setStaleError(errMsg);
            }
        }
    };

    const fieldCls = "w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-[11px] font-black uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 shadow-sm";
    const labelCls = "block text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 font-black italic"
            style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
            <style>{`.wf-scroll::-webkit-scrollbar{width:5px;height:5px}.wf-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}.wf-scroll::-webkit-scrollbar-track{background:transparent}`}</style>

            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
                style={{ maxHeight: '92vh', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>

                {/* hidden image input for modal */}
                <input type="file" ref={imgFileRef} className="hidden" accept="image/*" onChange={handleModalFileChange} />

                {/* ── HEADER ── */}
                <div className={`px-5 sm:px-8 py-4 sm:py-5 ${item.is_on_hold ? 'bg-slate-700' : stageColor} text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 relative overflow-hidden`}>
                    {item.is_on_hold && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-red-500 animate-pulse z-10" />
                    )}
                    <div className="flex flex-wrap gap-6 sm:gap-10">
                        {/* Clickable image thumbnail */}
                        <div
                            onClick={handleModalImageClick}
                            className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 border-white/30 cursor-pointer relative group"
                            title="Click to change image"
                        >
                            {localImage
                                ? <img src={localImage} alt="ref" className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-white/10 flex items-center justify-center"><PiCamera className="text-white/60 text-2xl" /></div>
                            }
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-xl">
                                <PiCamera className="text-white text-lg" />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="text-[10px] mb-0.5 font-black uppercase tracking-widest">Reference</div>
                            <h2 className="text-lg sm:text-2xl leading-none font-black uppercase italic tracking-tight flex items-center gap-2">
                                {item.name}
                                {item.is_on_hold && (
                                    <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-lg animate-bounce font-black shadow-lg shadow-red-500/20">ON HOLD</span>
                                )}
                            </h2>
                            <div className="text-[10px] mt-0.5">{item.uid} · {item.jobNo}{item.subJobNo && item.subJobNo !== 'MANUAL' ? ` / ${item.subJobNo}` : ''} {item.reference_no && <span className="ml-2 font-bold italic opacity-70">(Ref No: {item.reference_no})</span>}</div>
                        </div>
                        <div>
                            <div className="text-[10px] mb-0.5 font-black uppercase tracking-widest">AI Base Rate</div>
                            <div className="text-2xl leading-none text-green-300 font-black">₹{item.aiBaseRate || 'TBD'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] mb-0.5 font-black uppercase tracking-widest">Qty</div>
                            <div className="text-2xl leading-none font-black">{item.qty} <span className="text-[10px] opacity-50 uppercase">nos</span></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto relative z-10">
                        {[STAGES[1].name, STAGES[2].name, STAGES[3].name].includes(stage) && (
                            <button onClick={() => !item.is_on_hold && onUpdate({ ...item, stage: STAGES[0].name, quotes: [], awards: [] }, "Rolled back to Draft successfully")}
                                disabled={item.is_on_hold || staleError}
                                className={`px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-[10px] font-black uppercase transition-colors ${(item.is_on_hold || staleError) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                Rollback
                            </button>
                        )}
                        <button onClick={() => !item.is_on_hold && save("RFQ Details Saved")}
                            disabled={item.is_on_hold || staleError}
                            className={`px-4 py-2 bg-black/20 hover:bg-black/30 rounded-xl text-[10px] font-black uppercase transition-colors flex-1 sm:flex-none text-center ${(item.is_on_hold || staleError) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {item.is_on_hold ? 'Save & Close' : 'Save & Close'}
                        </button>
                        <button onClick={onClose}
                            className="w-9 h-9 rounded-full bg-black/15 hover:bg-red-500 flex items-center justify-center text-xl font-black transition-colors">×</button>
                    </div>
                </div>

                {/* ── Stale Action Inline Banner ── */}
                {staleError && (
                    <div className="bg-red-50 border-b border-red-200 px-5 sm:px-8 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 shadow-inner z-10">
                        <div className="flex items-center gap-2 text-red-700 text-xs font-black uppercase tracking-wider italic">
                            <span className="text-lg animate-pulse">⚠️</span> {staleError}
                        </div>
                        <button onClick={() => window.location.reload()} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap shadow-sm active:translate-y-px">
                            ↻ Refresh Data
                        </button>
                    </div>
                )}

                {/* ── BODY ── */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

                    {/* ══════ LEFT WORKFLOW PANEL ══════ */}
                    <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto wf-scroll border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">

                        {/* ══ STAGE 1 — Draft ══ */}
                        {stage === STAGES[0].name && (
                            <div className="space-y-4">

                                {/* ── Delivery Requirements ── */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-blue-600 border-b border-slate-100 pb-2 tracking-widest">
                                        Material Delivery Requirements
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className={labelCls}>Delivery Deadline (Date & Time)</label>
                                            <input type="datetime-local" className={`${fieldCls} ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                disabled={item.is_on_hold}
                                                value={delDate && delTime ? `${delDate}T${delTime}` : ''}
                                                onChange={e => {
                                                    const [d, t] = e.target.value.split('T');
                                                    setDelDate(d || '');
                                                    setDelTime(t || '');
                                                }}
                                                min={new Date().toISOString().slice(0, 16)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Links Duration (Hours)</label>
                                        <input type="number" className={`${fieldCls} ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`} disabled={item.is_on_hold} value={linksDuration} onChange={e => setLinksDuration(e.target.value)} placeholder="48" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Remarks (Optional)</label>
                                        <textarea className={`${fieldCls} ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''} resize-none`} disabled={item.is_on_hold} rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks.." />
                                    </div>
                                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
                                        <button onClick={() => setDelType('SINGLE')}
                                            disabled={item.is_on_hold}
                                            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${item.is_on_hold ? 'cursor-not-allowed opacity-60' : ''} ${delType === 'SINGLE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                                            Single Delivery
                                        </button>
                                        <button onClick={() => setDelType('SPLIT')}
                                            disabled={item.is_on_hold}
                                            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${item.is_on_hold ? 'cursor-not-allowed opacity-60' : ''} ${delType === 'SPLIT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                                            Split Delivery
                                        </button>
                                    </div>
                                    {delType === 'SPLIT' && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg mb-2">
                                                <p className={labelCls + ' mb-0'}>Split Schedule</p>
                                                <div className={`text-[9px] font-black px-2 py-0.5 rounded-full ${schedule.reduce((sum, s) => sum + Number(s.qty || 0), 0) === item.qty ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                    {schedule.reduce((sum, s) => sum + Number(s.qty || 0), 0)} / {item.qty} Qty
                                                </div>
                                            </div>
                                            {schedule.map((s, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input type="datetime-local" className={`flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-black outline-none text-slate-800 focus:border-blue-500 shadow-sm ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                        disabled={item.is_on_hold}
                                                        min={new Date().toISOString().slice(0, 16)}
                                                        value={s.date} onChange={e => { const n = [...schedule]; n[i].date = e.target.value; setSchedule(n); }} />
                                                    <input type="number" placeholder="Qty" className={`w-34 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-black outline-none text-slate-800 focus:border-blue-500 shadow-sm ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                        disabled={item.is_on_hold}
                                                        value={s.qty} onChange={e => { const n = [...schedule]; n[i].qty = e.target.value; setSchedule(n); }} />
                                                    {schedule.length > 1 && (
                                                        <button onClick={() => setSchedule(prev => prev.filter((_, idx) => idx !== i))}
                                                            disabled={item.is_on_hold}
                                                            className={`text-red-500 font-black text-lg px-1 ${item.is_on_hold ? 'opacity-30 cursor-not-allowed' : 'hover:text-red-400'}`}>×</button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => setSchedule(prev => [...prev, { date: '', qty: 0 }])}
                                                disabled={item.is_on_hold}
                                                className={`text-[9px] text-blue-400 font-black uppercase tracking-widest hover:underline ${item.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                + Add Row
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Vendor Selection ── */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                                            Assign Vendors
                                        </h4>
                                        <div className="relative w-full mt-2">
                                            <input
                                                type="text"
                                                disabled={item.is_on_hold}
                                                placeholder="Search Name / Category / Mobile..."
                                                className={`w-full px-4 py-2.5 border-2 border-slate-300 rounded-2xl bg-slate-50 text-xs font-black uppercase outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 shadow-md placeholder:text-slate-400 ${item.is_on_hold ? 'cursor-not-allowed opacity-50' : ''}`}
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && !item.is_on_hold && (
                                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-xl font-black">×</button>
                                            )}
                                        </div>
                                    </div>

                                    {vendorsLoading ? (
                                        <div className="flex items-center justify-center py-6 gap-2">
                                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500 text-xs font-semibold">Finding vendors...</span>
                                        </div>
                                    ) : filteredVendors.length === 0 ? (
                                        <p className="text-slate-500 text-xs font-semibold text-center py-4">{searchTerm ? 'No vendors match your search.' : 'No vendors found for this material category. Assign material categories to vendors first.'}</p>
                                    ) : (
                                        <div className="space-y-2 overflow-y-auto pr-1">
                                            {filteredVendors.map(v => {
                                                const sel = selectedVendors.includes(v._id);
                                                const isRec = v.isRecommended;

                                                return (
                                                    <div key={v._id}
                                                        onClick={() => !item.is_on_hold && toggleVendor(v._id)}
                                                        className={`px-4 py-3.5 border-2 rounded-2xl flex justify-between items-center transition-all select-none ${item.is_on_hold ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${sel ? 'border-emerald-500 bg-emerald-50' : isRec ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-white hover:border-emerald-300 shadow-sm'}`}>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-black text-slate-800 italic uppercase">{v.name}</p>
                                                                {isRec && (
                                                                    <span className="text-[11px] bg-amber-300 text-black px-1.5 py-0.5 rounded-md font-black shadow-sm mb-1">Recommended Vendor (BOM)</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                                {/* {v.service_category?.name && (
                                                                    <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded font-black uppercase tracking-tighter italic border border-blue-100">
                                                                        {v.service_category.name}
                                                                    </span>
                                                                )} */}
                                                                {v.material_categories?.map((mc, idx) => (
                                                                    <span key={idx} className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 rounded font-black uppercase tracking-tighter italic border border-emerald-100">
                                                                        {mc.name}
                                                                    </span>
                                                                ))}
                                                                {v.material_types?.map((mt, idx) => (
                                                                    <span key={idx} className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 rounded font-black uppercase tracking-tighter italic border border-indigo-100">
                                                                        {mt.name}
                                                                    </span>
                                                                ))}
                                                                <span className="text-[9px] text-slate-400 font-semibold uppercase ml-1">📱 {v.mobile_no}</span>
                                                            </div>
                                                        </div>
                                                        {sel && <PiCheckCircleFill className="text-emerald-500 text-xl shrink-0 ml-3" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Broadcast Button */}
                                    <button
                                        onClick={() => setShareTypeModal({ isOpen: true, action: 'broadcast' })}
                                        disabled={item.is_on_hold || staleError || selectedVendors.length === 0 || !delDate || broadcasting || (delType === 'SPLIT' && schedule.reduce((sum, s) => sum + Number(s.qty || 0), 0) !== item.qty)}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg border-b-4 border-indigo-700 active:translate-y-px transition-all flex items-center justify-center gap-2"
                                    >
                                        {broadcasting
                                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Broadcasting...</>
                                            : <><PiEnvelopeSimpleFill className="text-lg" />Broadcast RFQ ({selectedVendors.length} vendor(s))</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ══ STAGE 2 — View & Collect Quotes ══ */}
                        {stage === STAGES[1].name && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendor Bids</h4>
                                    <button onClick={refreshQuotes}
                                        disabled={item.is_on_hold}
                                        className={`text-[10px] font-black uppercase text-blue-600 hover:underline border border-blue-200 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all shadow-sm ${item.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        ↻ Refresh Bids
                                    </button>
                                </div>
                                {item.isSplit && quotes.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 items-center text-[10px] font-black uppercase text-amber-700 italic">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                        Fastest split completions are automatically highlighted in the breakdown below.
                                    </div>
                                )}

                                {item.selectedVendors?.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                                        <div className="text-4xl mb-3">⚠️</div>
                                        <p className="text-slate-500 text-sm font-semibold">No vendors selected for this RFQ.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {item.selectedVendors?.map((v) => {
                                            const isObj = v && typeof v === 'object' && !Array.isArray(v);
                                            const vId = String(isObj ? (v._id || '') : (v || ''));
                                            const vName = (isObj && v.name) ? v.name : (vendorIdToName[vId] || vId);
                                            const q = quotes.find(quote => quote.vendorName === vName);

                                            return (
                                                <div key={vId || vName} className={`bg-white shadow-sm rounded-2xl border p-4 space-y-3 transition-opacity ${!q ? 'opacity-60' : ''}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="text-sm font-black uppercase italic text-slate-800">{vName}</div>
                                                            {q ? (
                                                                <p className="text-[11px] text-green-600 font-black uppercase mt-0.5 animate-pulse">
                                                                    Response Received: {new Date(q.receivedAt).toLocaleString('en-IN', { hour12: false })}
                                                                </p>
                                                            ) : (
                                                                <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5 italic">
                                                                    Waiting for quote...
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1.5 flex-wrap justify-end">
                                                            {q && q.rate === bestRate && <span className="bg-green-700 text-white text-[10px] px-2 py-1 rounded-full font-black uppercase">Lowest Rate</span>}
                                                            {q && q.delDays === bestDays && <span className="bg-blue-700 text-white text-[10px] px-2 py-1 rounded-full font-black uppercase">Fastest</span>}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className={`rounded-xl border p-3 flex flex-col items-center justify-center text-center ${q && q.rate === bestRate ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                            <div className="text-[10px] font-black uppercase opacity-50 mb-1">Bid Rate</div>
                                                            <div className="text-xl font-black">{q ? `₹${q.rate?.toLocaleString()}` : '—'}</div>
                                                        </div>
                                                        <div className={`rounded-xl border p-3 flex flex-col items-center justify-center text-center ${q && q.delDays === bestDays ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                            <div className="text-[10px] font-black uppercase opacity-50 mb-1">Total Logic</div>
                                                            <div className="text-xl font-black italic">{q ? q.delDays : '—'}<span className="text-xs opacity-50 ml-1">{q ? 'days' : ''}</span></div>
                                                            {q && q.delDate && (
                                                                <div className="text-[10px] font-black text-black-500 mt-1 uppercase text-center leading-tight">
                                                                    Est. Arrival:<br />
                                                                    {(() => {
                                                                        const dt = new Date(q.delDate);
                                                                        if (isNaN(dt.getTime())) return '—';
                                                                        const dd = String(dt.getDate()).padStart(2, '0');
                                                                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                                                        const mm = months[dt.getMonth()];
                                                                        const yyyy = dt.getFullYear();
                                                                        const hh = String(dt.getHours()).padStart(2, '0');
                                                                        const min = String(dt.getMinutes()).padStart(2, '0');
                                                                        return `${dd} ${mm} ${yyyy}, ${hh}:${min}`;
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {q && q.scheduleResponses?.length > 0 && (
                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                                                            <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Split Breakdown</div>
                                                            <div className="grid grid-cols-1 gap-y-2">
                                                                {q.scheduleResponses.map((sr, idx) => {
                                                                    const allResponsesForThisSplit = quotes.map((qu) => {
                                                                        const resp = qu.scheduleResponses?.find(ssr => ssr.splitIdx === idx);
                                                                        if (!resp) return null;
                                                                        if (resp.delDate) return new Date(resp.delDate).getTime();
                                                                        if (resp.isConfirmed) {
                                                                            const origDate = item.deliverySchedule?.[idx]?.date;
                                                                            return origDate ? new Date(origDate).getTime() : Infinity;
                                                                        }
                                                                        return Infinity;
                                                                    }).filter(t => t !== null && t !== Infinity);

                                                                    const minTsForThisSplit = allResponsesForThisSplit.length > 0 ? Math.min(...allResponsesForThisSplit) : Infinity;

                                                                    let currentTs = Infinity;
                                                                    if (sr.delDate) currentTs = new Date(sr.delDate).getTime();
                                                                    else if (sr.isConfirmed) {
                                                                        const orig = item.deliverySchedule?.[idx]?.date;
                                                                        if (orig) currentTs = new Date(orig).getTime();
                                                                    }

                                                                    const isFastestSplit = quotes.length > 1 && currentTs !== Infinity && currentTs <= minTsForThisSplit;

                                                                    const displayDate = (() => {
                                                                        const target = sr.delDate || (sr.isConfirmed ? item.deliverySchedule?.[idx]?.date : null);
                                                                        if (!target) return sr.isConfirmed ? 'Confirmed' : '—';
                                                                        const dt = new Date(target);
                                                                        if (isNaN(dt.getTime())) return '—';
                                                                        const d = String(dt.getDate()).padStart(2, '0');
                                                                        const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getMonth()];
                                                                        const y = dt.getFullYear();
                                                                        const hh = String(dt.getHours()).padStart(2, '0');
                                                                        const min = String(dt.getMinutes()).padStart(2, '0');
                                                                        return `${d} ${m} ${y}, ${hh}:${min}`;
                                                                    })();

                                                                    const splitQty = sr.qty ?? sr.quantity ?? item.deliverySchedule?.[idx]?.qty ?? '—';

                                                                    return (
                                                                        <div key={idx} className={`flex justify-between items-center text-[11px] border-b border-slate-100 last:border-0 pb-1 ${isFastestSplit ? 'bg-emerald-50/50 -mx-1 px-1 rounded' : ''}`}>
                                                                            <span className="text-slate-500 font-bold uppercase flex items-center gap-2">
                                                                                <span className="opacity-50">Split #{sr.splitIdx + 1}:</span>
                                                                                <span className="font-black text-slate-800">{splitQty} nos</span>
                                                                                {isFastestSplit && <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>}
                                                                            </span>
                                                                            <span className={`${sr.isConfirmed || sr.delDate ? 'text-emerald-600 font-black' : 'text-blue-600 font-black'} flex items-center gap-1 text-[12px] whitespace-nowrap`}>
                                                                                {displayDate}
                                                                                {isFastestSplit && sr.delDate && <span className="text-[9px] bg-emerald-500 text-white px-1 rounded ring-1 ring-emerald-600 ring-inset">Fast</span>}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <button
                                            onClick={() => setStage(STAGES[2].name)}
                                            disabled={item.is_on_hold || staleError || quotes.length === 0}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg border-b-4 border-amber-700 active:translate-y-px transition-all"
                                        >
                                            Start Selection →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ STAGE 3 — Multi-Award ══ */}
                        {stage === STAGES[2].name && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Winning Vendors</h4>
                                {quotes.map((q, i) => (
                                    <div key={i} className={`rounded-2xl border-2 p-4 transition-all ${awards.find(a => a.vendorName === q.vendorName) ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white shadow-sm'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="flex items-center gap-2.5 cursor-pointer">
                                                <input type="checkbox" checked={!!awards.find(a => a.vendorName === q.vendorName)}
                                                    disabled={item.is_on_hold}
                                                    onChange={() => toggleAward(q.vendorName)}
                                                    className="w-5 h-5 accent-indigo-600 rounded" />
                                                <span className="text-sm font-black uppercase italic text-slate-800">{q.vendorName}</span>
                                            </label>
                                            <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase border border-slate-200">
                                                Bid: ₹{q.rate?.toLocaleString()} · {q.delDays}d
                                            </span>
                                        </div>
                                        {awards.find(a => a.vendorName === q.vendorName) && (
                                            <>
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    <div>
                                                        <label className={labelCls}>Agreed Rate</label>
                                                        <input type="number" className={fieldCls + ' text-blue-400'}
                                                            disabled={item.is_on_hold}
                                                            value={awards.find(a => a.vendorName === q.vendorName).rate || ''}
                                                            placeholder="0"
                                                            onChange={e => updateAward(awards.findIndex(a => a.vendorName === q.vendorName), 'rate', e.target.value === '' ? '' : Number(e.target.value))} />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Qty Allocated</label>
                                                        <input type="number" className={fieldCls}
                                                            disabled={item.is_on_hold}
                                                            value={awards.find(a => a.vendorName === q.vendorName).qty || ''}
                                                            placeholder="0"
                                                            onChange={e => updateAward(awards.findIndex(a => a.vendorName === q.vendorName), 'qty', e.target.value === '' ? '' : Number(e.target.value))} />
                                                    </div>
                                                </div>

                                                {/* Vendor Response Info */}
                                                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                                    <div className={`flex-shrink-0 w-full sm:w-1/3 rounded-xl border p-3 flex flex-col items-center justify-center text-center ${q && q.delDays === bestDays ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                        <div className="text-[10px] font-black uppercase opacity-50 mb-1">Total Logic</div>
                                                        <div className="text-xl font-black italic">{q ? q.delDays : '—'}<span className="text-xs opacity-50 ml-1">{q ? 'days' : ''}</span></div>
                                                        {q && q.delDate && (
                                                            <div className="text-[10px] font-black text-black-500 mt-1 uppercase text-center leading-tight">
                                                                Est. Arrival:<br />
                                                                {new Date(q.delDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {q && q.scheduleResponses?.length > 0 && (
                                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Split Breakdown</p>
                                                            <div className="grid grid-cols-1 gap-y-2">
                                                                {q.scheduleResponses.map((sr, idx) => {
                                                                    const allResponsesForThisSplit = quotes.map((qu) => {
                                                                        const resp = qu.scheduleResponses?.find(ssr => ssr.splitIdx === idx);
                                                                        if (!resp) return null;
                                                                        if (resp.delDate) return new Date(resp.delDate).getTime();
                                                                        if (resp.isConfirmed) {
                                                                            const origDate = item.deliverySchedule?.[idx]?.date;
                                                                            return origDate ? new Date(origDate).getTime() : Infinity;
                                                                        }
                                                                        return Infinity;
                                                                    }).filter(t => t !== null && t !== Infinity);

                                                                    const minTsForThisSplit = allResponsesForThisSplit.length > 0 ? Math.min(...allResponsesForThisSplit) : Infinity;

                                                                    let currentTs = Infinity;
                                                                    if (sr.delDate) currentTs = new Date(sr.delDate).getTime();
                                                                    else if (sr.isConfirmed) {
                                                                        const orig = item.deliverySchedule?.[idx]?.date;
                                                                        if (orig) currentTs = new Date(orig).getTime();
                                                                    }

                                                                    const isFastestSplit = quotes.length > 1 && currentTs !== Infinity && currentTs <= minTsForThisSplit;

                                                                    const displayDate = (() => {
                                                                        const target = sr.delDate || (sr.isConfirmed ? item.deliverySchedule?.[idx]?.date : null);
                                                                        if (!target) return sr.isConfirmed ? 'Confirmed' : '—';
                                                                        const dt = new Date(target);
                                                                        if (isNaN(dt.getTime())) return '—';
                                                                        const d = String(dt.getDate()).padStart(2, '0');
                                                                        const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getMonth()];
                                                                        const y = dt.getFullYear();
                                                                        const hh = String(dt.getHours()).padStart(2, '0');
                                                                        const min = String(dt.getMinutes()).padStart(2, '0');
                                                                        return `${d} ${m} ${y}, ${hh}:${min}`;
                                                                    })();

                                                                    return (
                                                                        <div key={idx} className={`flex justify-between items-center text-[11px] border-b border-slate-100 last:border-0 pb-1 ${isFastestSplit ? 'bg-emerald-50/50 -mx-1 px-1 rounded' : ''}`}>
                                                                            <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
                                                                                Split #{sr.splitIdx + 1}:
                                                                                {isFastestSplit && <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>}
                                                                            </span>
                                                                            <span className={`${sr.isConfirmed || sr.delDate ? 'text-emerald-600 font-black' : 'text-blue-600 font-black'} flex items-center gap-1 text-[11px] whitespace-nowrap`}>
                                                                                {displayDate}
                                                                                {isFastestSplit && sr.delDate && <span className="text-[9px] bg-emerald-500 text-white px-1 rounded ring-1 ring-emerald-600 ring-inset">Fast</span>}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delivery Split UI */}
                                                {(() => {
                                                    const awardObj = awards.find(a => a.vendorName === q.vendorName);
                                                    const aIdx = awards.findIndex(a => a.vendorName === q.vendorName);
                                                    const sched = awardObj.deliverySchedule || [{ date: '', time: '', qty: awardObj.qty || 0 }];

                                                    return (
                                                        <div className="mt-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="text-[10px] font-black uppercase text-indigo-800 tracking-widest">Delivery Schedule</label>
                                                                <button
                                                                    disabled={item.is_on_hold}
                                                                    onClick={() => {
                                                                        const n = [...sched, { date: sched[0]?.date || '', time: sched[0]?.time || '', qty: 0 }];
                                                                        updateAward(aIdx, 'deliverySchedule', n);
                                                                    }}
                                                                    className={`text-[9px] bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 px-2.5 py-1 rounded shadow-sm font-black transition-colors ${item.is_on_hold ? 'cursor-not-allowed opacity-50' : ''}`}
                                                                >
                                                                    + ADD SPLIT
                                                                </button>
                                                            </div>
                                                            {sched.map((s, sIdx) => (
                                                                <div key={sIdx} className="flex gap-2 items-center">
                                                                    <input type="date"
                                                                        disabled={item.is_on_hold}
                                                                        className={`w-[120px] p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                        min={new Date().toISOString().split('T')[0]}
                                                                        value={s.date || ''}
                                                                        onChange={e => {
                                                                            const n = [...sched]; n[sIdx].date = e.target.value; updateAward(aIdx, 'deliverySchedule', n);
                                                                        }}
                                                                    />
                                                                    <input type="time"
                                                                        disabled={item.is_on_hold}
                                                                        className={`w-[125px] p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                        value={s.time || ''}
                                                                        onChange={e => {
                                                                            const n = [...sched]; n[sIdx].time = e.target.value; updateAward(aIdx, 'deliverySchedule', n);
                                                                        }}
                                                                    />
                                                                    <input type="number"
                                                                        disabled={item.is_on_hold}
                                                                        className={`flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 ${item.is_on_hold ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                        placeholder="Qty" value={s.qty === 0 && sIdx !== 0 ? '' : s.qty || ''}
                                                                        onChange={e => {
                                                                            const n = [...sched]; n[sIdx].qty = e.target.value === '' ? '' : Number(e.target.value); updateAward(aIdx, 'deliverySchedule', n);
                                                                        }}
                                                                    />
                                                                    {sched.length > 1 && (
                                                                        <button
                                                                            disabled={item.is_on_hold}
                                                                            onClick={() => {
                                                                                const n = sched.filter((_, i) => i !== sIdx); updateAward(aIdx, 'deliverySchedule', n);
                                                                            }}
                                                                            className={`text-red-400 hover:text-red-600 text-lg px-1 font-black transition-colors ${item.is_on_hold ? 'cursor-not-allowed opacity-30' : ''}`}
                                                                        >
                                                                            &times;
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={handleIssuePO}
                                    disabled={item.is_on_hold || staleError || awards.length === 0 || sendingPO}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg border-b-4 border-green-800 active:translate-y-px transition-all flex items-center justify-center gap-2"
                                >
                                    {sendingPO
                                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving POs...</>
                                        : <>Issue PO Stack ({awards.length} vendor{awards.length !== 1 ? 's' : ''})</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* ══ STAGE 4 ══ */}
                        {stage === STAGES[3].name && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-8">
                                <PiCheckCircleFill className="text-[100px] text-green-500" />
                                <div className="text-center">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">PO Awarded</p>
                                    <p className="text-white font-black text-xl mt-1">Ready for Production</p>
                                </div>
                                <button onClick={() => setShareTypeModal({ isOpen: true, action: 'production' })} disabled={item.is_on_hold || staleError || sendingPO}
                                    className="px-10 py-5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-lg tracking-widest shadow-xl border-b-4 border-orange-700 active:translate-y-px transition-all flex items-center justify-center gap-3">
                                    {sendingPO
                                        ? <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />Sending Notifications...</>
                                        : <>Allow Production →</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* ══ STAGE 5 & 6 ══ */}
                        {(stage === STAGES[4].name || stage === STAGES[5].name) && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <div className="text-6xl">{stage === STAGES[4].name ? '🏭' : '🚚'}</div>
                                <p className="text-white font-black text-xl uppercase italic tracking-tight">{stage}</p>
                                {/* {stage === STAGES[4].name && (
                                    <button onClick={() => { setStage(STAGES[5].name); save("Marked as Delivered"); }}
                                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest border-b-4 border-blue-800 transition-all">
                                        Mark as Delivered
                                    </button>
                                )} */}
                            </div>
                        )}
                    </div>

                    {/* ══════ RIGHT DOCUMENT PANEL ══════ */}
                    <div className="w-full lg:w-1/2 p-4 sm:p-6 bg-slate-100 overflow-y-auto wf-scroll flex flex-col items-center gap-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">

                        {/* RFQ Document */}
                        <div className="bg-white w-full max-w-md rounded-2xl border-t-4 border-blue-600 shadow-xl p-5 sm:p-7 text-[11px] font-black italic border border-slate-200 text-slate-700">
                            <div className="flex justify-between border-b-2 border-slate-200 pb-3 mb-5">
                                <h5 className="text-lg italic font-black uppercase text-slate-900">RFQ Document</h5>
                                <p className="text-xs font-black italic uppercase text-slate-400">REF: {item.uid} {item.reference_no && `(${item.reference_no})`}</p>
                            </div>
                            {item.image && (
                                <div className="h-36 w-full rounded-xl overflow-hidden mb-4 border border-slate-200">
                                    <img src={item.image} className="w-full h-full object-cover" alt="ref" />
                                </div>
                            )}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <p className="opacity-50 uppercase">Project Ref:</p>
                                    <p className="underline decoration-blue-500 decoration-2">{item.jobNo}{item.subJobNo && item.subJobNo !== 'MANUAL' ? ` / ${item.subJobNo}` : ''}</p>
                                </div>
                                <div className="flex justify-between uppercase">
                                    <p className="opacity-50">Client:</p>
                                    <p>{item.client || '-'}</p>
                                </div>
                                <div className="flex justify-between uppercase">
                                    <p className="opacity-50">Required By:</p>
                                    <p className="text-amber-500 font-black">
                                        {delDate && delTime ? new Date(`${delDate}T${delTime}`).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'}
                                    </p>
                                </div>
                                <div className="flex justify-between uppercase">
                                    <p className="opacity-50">Delivery:</p>
                                    <p className={delType === 'SPLIT' ? 'text-amber-400' : ''}>{delType}</p>
                                </div>
                                {(item.packingBufferVal !== undefined && item.packingBufferVal !== null) && (
                                    <>
                                        <div className="flex justify-between uppercase">
                                            <p className="opacity-50">Wastage / Buffer:</p>
                                            <p className="text-red-500 font-black">{item.packingBufferVal} units ({item.packingBufferPrc}%)</p>
                                        </div>
                                        <div className="flex justify-between uppercase">
                                            <p className="opacity-50">Target Prod Qty:</p>
                                            <p className="font-black text-indigo-600">{item.packingFinalQty} units</p>
                                        </div>
                                    </>
                                )}
                                {delType === 'SPLIT' && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 uppercase">
                                        <p className="text-[9px] mb-2 text-slate-500">Split Schedule:</p>
                                        {schedule.map((s, i) => (
                                            <div key={i} className="flex justify-between text-[11px] py-1 border-b border-slate-200 last:border-0">
                                                <span>{s.date ? new Date(s.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'}</span>
                                                <span>{s.qty} Nos</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="pt-4 border-t-2 border-slate-200 mt-2 uppercase">
                                    <table className="w-full text-left">
                                        <thead><tr className="border-b border-slate-200"><th className="py-2 text-slate-400">Description</th><th className="py-2 text-right text-slate-400">Qty</th></tr></thead>
                                        <tbody>
                                            <tr>
                                                <td className="py-3 text-slate-900">{item.name}<br /><span className="text-[10px] text-slate-500 normal-case not-italic font-semibold">{item.specs}</span></td>
                                                <td className="text-right text-slate-900">{item.qty} Nos</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* PO Documents */}
                        {awards.map((aw, idx) => {
                            const schedule = aw.deliverySchedule || [];
                            const hasSplit = schedule.length > 1;
                            const singleDelivery = schedule.length === 1 ? schedule[0] : null;
                            const singleDateStr = singleDelivery?.date ? (typeof singleDelivery.date === 'string' ? singleDelivery.date.split('T')[0] : new Date(singleDelivery.date).toISOString().split('T')[0]) : 'TBD';
                            const singleTimeStr = singleDelivery?.time ? ` @ ${singleDelivery.time}` : '';

                            return (
                                <div key={idx} className="bg-white w-full max-w-md rounded-2xl border-t-4 border-green-600 shadow-xl p-5 sm:p-7 text-[11px] font-black uppercase italic border border-slate-200 text-slate-700">
                                    <div className="flex justify-between border-b-2 border-slate-200 pb-3 mb-4">
                                        <h5 className="text-lg italic font-black uppercase text-slate-900">Purchase Order</h5>
                                        <p className="font-black italic uppercase text-slate-400">{aw.poNumber || `PO-${idx + 1}`} {item.reference_no && `(${item.reference_no})`}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-slate-100 pb-2"><p className="text-slate-500">Vendor:</p><p className="text-indigo-600">{aw.vendorName}</p></div>
                                        <div className="flex justify-between border-b border-slate-100 pb-2"><p className="text-slate-500">Rate:</p><p>₹{Number(aw.rate).toLocaleString()}</p></div>
                                        <div className="flex justify-between border-b border-slate-100 pb-2"><p className="text-slate-500">Qty:</p><p>{aw.qty} Nos</p></div>

                                        {!hasSplit && singleDelivery && (
                                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                                <p className="text-slate-500">Deliver By:</p>
                                                <p className="text-amber-600 text-[11px]">{singleDateStr}{singleTimeStr}</p>
                                            </div>
                                        )}
                                        {!hasSplit && !singleDelivery && delDate && (
                                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                                <p className="text-slate-500">Deliver By:</p>
                                                <p className="text-amber-600 text-[11px]">{delDate}{delTime ? ` @ ${delTime}` : ''}</p>
                                            </div>
                                        )}

                                        {hasSplit && (
                                            <div className="pt-1">
                                                <p className="text-[9px] text-slate-500 uppercase mb-1.5 tracking-widest">Delivery Schedule</p>
                                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                                    <div className="grid grid-cols-2 bg-slate-100 px-3 py-1.5 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                        <span>Split</span><span className="text-right">Date / Qty</span>
                                                    </div>
                                                    {schedule.map((s, si) => {
                                                        const dateStr = s.date ? (typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0]) : 'TBD';
                                                        const timeStr = s.time ? ` @ ${s.time}` : '';
                                                        return (
                                                            <div key={si} className="grid grid-cols-2 px-3 py-2 border-t border-slate-100 items-center">
                                                                <span className="text-[11px] font-black text-slate-500">#{si + 1}</span>
                                                                <span className="text-right">
                                                                    <span className="text-[11px] font-black text-slate-800 block">{dateStr}{timeStr}</span>
                                                                    <span className="text-[11px] text-slate-400">{s.qty} nos</span>
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-200 shadow-inner mt-2">
                                            <p className="text-[11px] text-slate-500 uppercase">Total Value:</p>
                                            <p className="text-2xl font-black text-green-600">₹{(Number(aw.rate) * Number(aw.qty)).toLocaleString("en-IN")}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {shareTypeModal.isOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300]"
                        onClick={(e) => { e.stopPropagation(); setShareTypeModal({ isOpen: false, action: null }); }}
                    >
                        <div
                            className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col gap-4 text-slate-800 not-italic normal-case font-normal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-lg font-semibold mb-2">Select Share Method</h2>

                            <button
                                className="flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={broadcasting || sendingPO}
                                onClick={(e) => {
                                    e.currentTarget.disabled = true;
                                    const action = shareTypeModal.action;
                                    setShareTypeModal({ isOpen: false, action: null });
                                    if (action === 'broadcast') handleBroadcast('whatsapp');
                                    else handleAllowProduction('whatsapp');
                                }}
                            >
                                <WhatsAppIcon />
                                WhatsApp Only
                            </button>
                            <button
                                className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={broadcasting || sendingPO}
                                onClick={(e) => {
                                    e.currentTarget.disabled = true;
                                    const action = shareTypeModal.action;
                                    setShareTypeModal({ isOpen: false, action: null });
                                    if (action === 'broadcast') handleBroadcast('email');
                                    else handleAllowProduction('email');
                                }}
                            >
                                <EmailIcon />
                                Email Only
                            </button>
                            <button
                                className="flex items-center justify-center gap-2 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={broadcasting || sendingPO}
                                onClick={(e) => {
                                    e.currentTarget.disabled = true;
                                    const action = shareTypeModal.action;
                                    setShareTypeModal({ isOpen: false, action: null });
                                    if (action === 'broadcast') handleBroadcast('both');
                                    else handleAllowProduction('both');
                                }}
                            >
                                WhatsApp + Email
                            </button>
                            <button
                                className="mt-2 text-sm text-gray-500 hover:underline"
                                onClick={() => setShareTypeModal({ isOpen: false, action: null })}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowModal;