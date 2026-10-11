import React, { useState } from 'react';
import { Zap, Activity, Search, CheckCircle2, XCircle, ArrowLeft, Microscope, Layers, AlertCircle, ClipboardCheck, Play } from 'lucide-react';
import { toast } from 'react-toastify';

const MobileProcessScreen = ({
    type = 'laser',
    selectedJob,
    onBack,
    processUpsCount,
    setProcessUpsCount,
    inspectedGoodCount,
    setInspectedGoodCount,
    inspectedBadCount,
    setInspectedBadCount,
    handoverQty,
    setHandoverQty,
    processLogs,
    setProcessLogs,
    // Sample cycle status props
    sampleStatus = null,       // null | 'WAITING_APPROVAL' | 'APPROVED'
    sampleCycleStats = null,   // { cycles, good, bad }
    onApproveSample,
    onRejectSample,
    onBeginPrimary,
}) => {
    const materialGroups = selectedJob?.material_groups || [];
    const [selectedGroupId, setSelectedGroupId] = useState(materialGroups[0]?._id || materialGroups[0]?.group_id || null);
    const [selectedOperator, setSelectedOperator] = useState('Operator 1');
    const [selectedHead, setSelectedHead] = useState('1 HEAD');
    const [isSamplingActive, setIsSamplingActive] = useState(false);
    const [sampleCyclesCount, setSampleCyclesCount] = useState(1);
    const [sampleRejectCount, setSampleRejectCount] = useState(0);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);

    const mg = materialGroups.find(g => (g._id || g.group_id) === selectedGroupId) || materialGroups[0];
    const inwardedGood = (mg?.inward_history || []).reduce((acc, l) => acc + (l.good_qty || 0), 0);
    const requiredSheets = mg?.materials?.[0]?.quantity || mg?.sheets_required || 21;

    return (
        <div className="flex flex-col h-full bg-[#f0f2f8] select-none overflow-hidden">

            {/* ── Header: Back Button + Specs ── */}
            <div className="bg-slate-900 px-3 pt-2.5 pb-2 flex items-center gap-2 border-b border-slate-700 shrink-0 shadow-lg">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-lg transition-all shrink-0 flex items-center justify-center border border-slate-600"
                        title="Go back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}
                {/* 4-col specs grid — dropped one col to avoid overflow */}
                <div className="flex-1 grid grid-cols-4 text-center gap-x-1">
                    {[
                        { label: 'MATERIAL', value: mg?.group_name || 'MAIN', cls: 'text-white text-[9px] font-black truncate' },
                        { label: 'QTY', value: `${selectedJob?.total_qty || 100}`, cls: 'text-white text-[9px] font-black' },
                        { label: 'INWARDED', value: `${inwardedGood || 0} SH`, cls: 'text-teal-300 text-[9px] font-black' },
                        { label: 'REQ', value: `${requiredSheets} SH`, cls: 'text-amber-300 text-[9px] font-black' },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="flex flex-col items-center gap-0.5">
                            <span className="text-slate-400 text-[7.5px] font-extrabold uppercase tracking-wide leading-none">{label}</span>
                            <span className={cls}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Material Group Tabs (only if multiple) ── */}
            {materialGroups.length > 1 && (
                <div className="bg-slate-800 px-3 py-1.5 flex gap-1.5 overflow-x-auto border-b border-slate-700 shrink-0">
                    {materialGroups.map((g, idx) => {
                        const gId = g._id || g.group_id;
                        const isSelected = gId === selectedGroupId;
                        return (
                            <button
                                key={gId || idx}
                                onClick={() => setSelectedGroupId(gId)}
                                className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                                    isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                <Layers className="w-3 h-3" />
                                {g.group_name || `GROUP ${idx + 1}`}
                            </button>
                        );
                    })}
                </div>
            )}



            {/* ── Sample Cycle Status Header ── */}
            {sampleStatus && (
                <div className="bg-slate-800 px-3 py-2 flex items-center justify-between border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <Microscope className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">
                            SAMPLE CYCLE — <span className="text-indigo-300">{mg?.group_name || 'MAIN'}</span>
                        </span>
                    </div>
                    {sampleCycleStats && (
                        <span className="text-[8.5px] font-bold text-slate-400">
                            {sampleCycleStats.cycles} CYC · <span className="text-emerald-400">{sampleCycleStats.good} APPROVED</span> / <span className="text-rose-400">{sampleCycleStats.bad} REJECTED</span>
                        </span>
                    )}
                </div>
            )}

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">

                {/* ── Main Cycle Card ── */}
                <div
                    className="rounded-3xl p-4 space-y-3 shadow-2xl relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #5b4fcf 0%, #6d3fc0 40%, #4a2fa8 100%)' }}
                >
                    {/* Decorative glow */}
                    <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                    {/* Shift pill + Job no */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-white/20 border border-white/25 text-white rounded-full text-[8.5px] font-black uppercase tracking-wider leading-none shrink-0">
                            SH2 — {selectedHead} — {selectedOperator}
                        </span>
                        <span className="text-[10px] font-black tracking-widest text-white/60 uppercase shrink-0">
                            {selectedJob?.job_no || 'RD21059B'}
                        </span>
                    </div>

                    {/* Timer */}
                    <div className="text-center py-1">
                        <h1 className="text-[58px] font-black tracking-tighter text-white leading-none font-mono drop-shadow-lg">
                            42:00
                        </h1>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mt-1.5 text-white/90">
                            TOTAL TIME REMAINING
                        </p>
                        <p className="text-[9px] font-semibold mt-0.5 text-white/70 italic">
                            Confirm Pcs/Cycle First
                        </p>
                    </div>

                    {/* ── WAITING FOR APPROVAL BANNER ── */}
                    {sampleStatus === 'WAITING_APPROVAL' && (
                        <div className="space-y-2">
                            <div className={`rounded-xl p-3 flex items-center justify-between gap-2 ${
                                (sampleCycleStats?.good || 0) === 0
                                    ? 'bg-orange-500/90'
                                    : 'bg-purple-600/90'
                            }`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        {(sampleCycleStats?.good || 0) === 0
                                            ? <AlertCircle className="w-4 h-4 text-white" />
                                            : <ClipboardCheck className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-white uppercase tracking-wider">
                                            {(sampleCycleStats?.good || 0) === 0 ? '✗ SAMPLE REJECTED' : '✓ SENT FOR APPROVAL'}
                                        </div>
                                        <div className="text-[8.5px] font-bold text-white/70 uppercase">
                                            {(sampleCycleStats?.good || 0) === 0 ? 'Quality Failed — Review Required' : 'Waiting for QC Review'}
                                        </div>
                                    </div>
                                </div>
                                {(sampleCycleStats?.good || 0) > 0 ? (
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            onClick={onRejectSample}
                                            className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 active:scale-95 transition-all"
                                        >REJECT</button>
                                        <button
                                            onClick={onApproveSample}
                                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all"
                                        >APPROVE</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={onRejectSample}
                                        className="px-3 py-1.5 bg-white text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 active:scale-95 transition-all shrink-0"
                                    >RETRY</button>
                                )}
                            </div>
                            {sampleCycleStats && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-black/20 rounded-xl p-2.5 border border-white/10 text-center">
                                        <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Good Pcs</span>
                                        <span className="text-lg font-black text-emerald-300">{sampleCycleStats.good}</span>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-2.5 border border-white/10 text-center">
                                        <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Bad / Reject</span>
                                        <span className="text-lg font-black text-rose-400">{sampleCycleStats.bad}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── APPROVED → BEGIN PRIMARY CTA ── */}
                    {sampleStatus === 'APPROVED' && (
                        <div className="space-y-2">
                            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-3 flex flex-col items-center text-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Sales / Admin Approved</span>
                                </div>
                                {sampleCycleStats && (
                                    <div className="text-[8.5px] font-bold text-emerald-400/70 uppercase italic">
                                        {sampleCycleStats.cycles} Cycles · {sampleCycleStats.good} Approved · {sampleCycleStats.bad} Rejected · Quality Confirmed
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={onBeginPrimary}
                                className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all"
                            >
                                <span className="text-base">🚀</span>
                                APPROVED — BEGIN PRIMARY CYCLE
                            </button>
                        </div>
                    )}

                    {/* Mode Toggle: PRIMARY vs SAMPLING */}
                    {!sampleStatus && (
                    <div className="bg-black/20 p-1 rounded-xl flex border border-white/10">
                        <button
                            onClick={() => setIsSamplingActive(false)}
                            className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 leading-none ${
                                !isSamplingActive
                                    ? 'bg-amber-400 text-slate-900 shadow-md'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Zap className="w-3 h-3 shrink-0" />
                            <span>PRIMARY</span>

                        </button>
                        <button
                            onClick={() => setIsSamplingActive(true)}
                            className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 leading-none ${
                                isSamplingActive
                                    ? 'bg-indigo-400 text-slate-900 shadow-md'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Microscope className="w-3 h-3 shrink-0" />
                            <span>SAMPLING / QC</span>
                        </button>
                    </div>
                    )}

                    {/* PRIMARY CYCLE BOX */}
                    {!isSamplingActive ? (
                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider">
                                    <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                                    PRIMARY CYCLE
                                </span>
                                <span className="text-[10px] font-bold text-white/40 bg-white/10 px-2 py-0.5 rounded-full">0 / 20</span>
                            </div>

                            {/* UPS Counter */}
                            <div className="bg-white rounded-2xl px-4 py-3 text-center shadow-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">UPS / CYCLE</p>
                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setProcessUpsCount(p => Math.max(1, p - 1))}
                                        className="w-10 h-10 rounded-full bg-slate-100 active:bg-slate-200 text-slate-700 text-2xl flex items-center justify-center transition-all active:scale-90 select-none"
                                    >
                                        −
                                    </button>
                                    <span className="text-5xl font-black text-slate-900 min-w-[48px] text-center tabular-nums leading-none">
                                        {processUpsCount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setProcessUpsCount(p => p + 1)}
                                        className="w-10 h-10 rounded-full bg-slate-100 active:bg-slate-200 text-slate-700 text-2xl flex items-center justify-center transition-all active:scale-90 select-none"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={() => {
                                    const now = new Date();
                                    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    setProcessLogs(prev => [
                                        { time: t, text: `✓ PRIMARY CONFIRMED: ${processUpsCount} UPS/CYCLE (BY ${selectedOperator})` },
                                        ...prev
                                    ]);
                                    toast.success(`Confirmed & Started 20 Cycles (${processUpsCount} UPS/Cycle)`);
                                }}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg transition-all"
                            >
                                CONFIRM &amp; RUN 20 CYCLES
                            </button>
                        </div>
                    ) : (
                        /* SAMPLING / QC BOX */
                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-200 uppercase tracking-wider">
                                    <Microscope className="w-3.5 h-3.5 shrink-0" />
                                    SAMPLE TESTING
                                </span>
                                <span className="text-[9px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                    QC READY
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-900/70 p-3 rounded-xl text-center border border-white/10">
                                    <span className="text-[8px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1.5">SAMPLE CYCLES</span>
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => setSampleCyclesCount(p => Math.max(1, p - 1))}
                                            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center"
                                        >−</button>
                                        <span className="text-2xl font-black text-white tabular-nums w-6 text-center">{sampleCyclesCount}</span>
                                        <button
                                            onClick={() => setSampleCyclesCount(p => p + 1)}
                                            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="bg-slate-900/70 p-3 rounded-xl text-center border border-white/10">
                                    <span className="text-[8px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1.5">SAMPLE REJECTS</span>
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => setSampleRejectCount(p => Math.max(0, p - 1))}
                                            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center"
                                        >−</button>
                                        <span className="text-2xl font-black text-rose-400 tabular-nums w-6 text-center">{sampleRejectCount}</span>
                                        <button
                                            onClick={() => setSampleRejectCount(p => p + 1)}
                                            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center"
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const now = new Date();
                                    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    setProcessLogs(prev => [
                                        { time: t, text: `✓ SAMPLE TEST: ${sampleCyclesCount} CYCLES | ${sampleRejectCount} REJECTS BY ${selectedOperator}` },
                                        ...prev
                                    ]);
                                    toast.success('Sample test completed & recorded!');
                                }}
                                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md transition-all"
                            >
                                SUBMIT SAMPLE INSPECTION
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Step 1: Inspect ── */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            1
                        </span>
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-wide leading-tight">
                            INSPECT — COUNT GOOD &amp; BAD PIECES
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {/* Good PCS input */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center space-y-1.5">
                            <div className="flex items-center justify-center gap-1 text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span className="text-[9px] font-black uppercase tracking-wider">GOOD PCS</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={inspectedGoodCount}
                                onChange={e => setInspectedGoodCount(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-white border border-emerald-200 rounded-lg text-xl font-black text-emerald-500 text-center py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 tabular-nums"
                            />
                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest block">READY TO PASS ON</span>
                        </div>

                        {/* Bad / Reject input */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-center space-y-1.5">
                            <div className="flex items-center justify-center gap-1 text-orange-600">
                                <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span className="text-[9px] font-black uppercase tracking-wider">BAD / REJECT</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={inspectedBadCount}
                                onChange={e => setInspectedBadCount(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-white border border-orange-200 rounded-lg text-xl font-black text-orange-500 text-center py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 tabular-nums"
                            />
                            <span className="text-[7px] font-black text-orange-600 uppercase tracking-widest block">GOES TO RECUT</span>
                        </div>
                    </div>
                </div>

                {/* ── Step 2: Hand Over ── */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            2
                        </span>
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-wide leading-tight">
                            ISSUE / HAND OVER TO NEXT STAGE
                        </h3>
                    </div>

                    <div className="flex gap-2 items-stretch">
                        <input
                            type="number"
                            min="0"
                            value={handoverQty}
                            onChange={e => setHandoverQty(e.target.value)}
                            placeholder={`Enter qty (${selectedJob?.total_qty || 100} pending)`}
                            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs focus:outline-none focus:border-indigo-400 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (!handoverQty) return;
                                const now = new Date();
                                const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                setProcessLogs(prev => [
                                    { time: t, text: `✓ HANDOVER: ${handoverQty} PCS TO NEXT STAGE` },
                                    ...prev
                                ]);
                                toast.success(`Issued ${handoverQty} Pcs to next stage`);
                                setHandoverQty('');
                            }}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
                        >
                            HANDOVER
                        </button>
                    </div>
                </div>

                {/* ── Activity Log ── */}
                {processLogs.length > 0 && (
                    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-slate-500" />
                                <h3 className="text-[9.5px] font-extrabold text-slate-700 uppercase tracking-wider">ACTIVITY LOG</h3>
                            </div>
                            <button onClick={() => setShowActivityModal(true)}>
                                <Search className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {processLogs.slice(0, 5).map((log, i) => (
                                <div key={i} className="flex items-start gap-2 pb-1.5 border-b border-slate-50 last:border-0">
                                    <span className="font-mono text-[8.5px] font-semibold text-slate-400 shrink-0 pt-0.5 w-8">{log.time}</span>
                                    <span className="text-[9px] font-bold text-slate-700 uppercase leading-snug">{log.text}</span>
                                </div>
                            ))}
                        </div>
                        {processLogs.length > 5 && (
                            <button
                                onClick={() => setShowActivityModal(true)}
                                className="w-full text-center text-[8.5px] font-black text-indigo-500 uppercase tracking-wider py-1"
                            >
                                VIEW ALL {processLogs.length} LOGS →
                            </button>
                        )}
                    </div>
                )}

                {/* Bottom spacer */}
                <div className="h-4 shrink-0" />
            </div>

            {/* ── Fixed Bottom Stats Footer ── */}
            <footer className="bg-[#0f172a] text-white px-3 py-2.5 grid grid-cols-5 text-center shrink-0 border-t border-slate-800 shadow-2xl">
                <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">TARGET</span>
                    <span className="text-xs font-black text-white">{selectedJob?.total_qty || 100}</span>
                </div>
                <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">GOOD</span>
                    <span className="text-xs font-black text-emerald-400">{inspectedGoodCount}</span>
                </div>
                <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">RECUTS</span>
                    <span className="text-xs font-black text-amber-400">{inspectedBadCount}</span>
                </div>
                <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">TOTAL</span>
                    <span className="text-xs font-black text-sky-400">{inspectedGoodCount + inspectedBadCount}</span>
                </div>
                <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">PENDING</span>
                    <span className="text-xs font-black text-rose-400">{Math.max(0, (selectedJob?.total_qty || 100) - inspectedGoodCount)}</span>
                </div>
            </footer>

            {/* ── SETUP MODAL ── */}
            {showSetupModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                MACHINE SETUP &amp; PARAMETERS
                            </h3>
                            <button onClick={() => setShowSetupModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-bold transition-all">✕</button>
                        </div>
                        <div className="h-px bg-slate-800" />
                        <div className="space-y-3 text-[10px]">
                            <div>
                                <label className="text-slate-400 font-extrabold uppercase block mb-1">OPERATOR</label>
                                <div className="bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-bold">{selectedOperator}</div>
                            </div>
                            <div>
                                <label className="text-slate-400 font-extrabold uppercase block mb-1">HEAD CONFIGURATION</label>
                                <div className="bg-slate-800 border border-slate-700 text-sky-300 p-2.5 rounded-lg font-bold">{selectedHead}</div>
                            </div>
                            <div>
                                <label className="text-slate-400 font-extrabold uppercase block mb-1">ACTIVE MATERIAL GROUP</label>
                                <div className="bg-slate-800 border border-slate-700 text-indigo-300 p-2.5 rounded-lg font-bold">{mg?.group_name || 'MAIN STRUCTURE'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSetupModal(false)}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded-xl transition-all"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}

            {/* ── ACTIVITY LOGS MODAL ── */}
            {showActivityModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between shrink-0">
                            <h3 className="text-xs font-black uppercase text-teal-400 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                PROCESS LOG
                            </h3>
                            <button onClick={() => setShowActivityModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-bold transition-all">✕</button>
                        </div>
                        <div className="h-px bg-slate-800 shrink-0" />
                        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                            {processLogs.map((log, i) => (
                                <div key={i} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/60 flex items-start gap-2">
                                    <span className="font-mono text-[8.5px] text-slate-400 shrink-0 pt-0.5">{log.time}</span>
                                    <span className="text-[9px] font-bold text-slate-200 uppercase leading-snug">{log.text}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowActivityModal(false)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase rounded-xl shrink-0 transition-all"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileProcessScreen;
