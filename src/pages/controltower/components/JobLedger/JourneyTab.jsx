import React, { useState } from 'react';
import { fmtR } from './data.js';

function JourneyTab({ job }) {
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'inhouse', 'outsource'

    if (!job) return null;

    const compareProcessIndex = (a, b) => {
        const rawA = String(a.process_index || '').trim();
        const rawB = String(b.process_index || '').trim();

        if (!rawA && !rawB) return 0;
        if (!rawA || rawA === '-') return 1;
        if (!rawB || rawB === '-') return -1;

        const partsA = rawA.split('.').map(p => {
            const num = parseInt(p, 10);
            return isNaN(num) ? p : num;
        });
        const partsB = rawB.split('.').map(p => {
            const num = parseInt(p, 10);
            return isNaN(num) ? p : num;
        });

        const maxLen = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < maxLen; i++) {
            const pA = partsA[i];
            const pB = partsB[i];
            if (pA === undefined) return -1;
            if (pB === undefined) return 1;
            if (typeof pA === 'number' && typeof pB === 'number') {
                if (pA !== pB) return pA - pB;
            } else {
                const cmp = String(pA).localeCompare(String(pB), undefined, { numeric: true });
                if (cmp !== 0) return cmp;
            }
        }
        return 0;
    };

    const journey = Array.isArray(job.journey) ? job.journey : [];
    const inhouseList = (Array.isArray(job.shopfloor_inhouse) ? [...job.shopfloor_inhouse] : []).sort(compareProcessIndex);
    const outsourceList = (Array.isArray(job.shopfloor_outsource) ? [...job.shopfloor_outsource] : []).sort(compareProcessIndex);

    const DEPT_COLORS = {
        'DTP Pre-Press': '#8B5CF6',
        'LC Studio': '#0EA5E9',
        'Laser Cutting Studio': '#0EA5E9',
        'Laser Cutting Co2': '#0EA5E9',
        'UV Printing Studio': '#0D9488',
        'UV Print Studio': '#0D9488',
        'UV Printing Handtop': '#0D9488',
        'Laser Engraving': '#F59E0B',
        'Assembly': '#EC4899',
        'Assembly Bay': '#EC4899',
        'Assembly Labour': '#EC4899',
        'QC Gate 2': '#10B981',
        'Quality Control': '#10B981',
        'Finished Goods Store': '#059669',
        'Packing + Dispatch': '#EF4444',
        'FG & Packing': '#EF4444',
        'Outsource': '#6366F1',
        'Dispatch & Logistics': '#3B82F6'
    };

    function dc(dept = '') {
        return Object.entries(DEPT_COLORS).find(([k]) => dept.toLowerCase().includes(k.toLowerCase().split(' ')[0]))?.[1] || '#64748B';
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        const str = String(dateStr).trim();
        if (!str || str === 'undefined' || str === 'null' || str === '—' || str === '-') return '—';

        // Check if dateStr contains a 4-digit year (e.g. 2026 or 1999) or standard ISO date format
        const has4DigitYear = /\b(19|20)\d{2}\b/.test(str);
        const isIsoFormat = /^\d{4}-\d{2}-\d{2}/.test(str);

        // If string does not have a 4-digit year and is not ISO formatted (e.g. "26 Aug 10:08", "10:08 am"),
        // display the same value without modifying to avoid browser year mangling (e.g. turning 10:08 into year 2001)
        if (!has4DigitYear && !isIsoFormat) {
            return str;
        }

        try {
            const d = new Date(str);
            if (isNaN(d.getTime())) return str;
            if (d.getFullYear() < 2020) return str;
            return d.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return str;
        }
    };

    const OUTSOURCE_STAGES = [
        { idx: 0, label: 'Assigned', icon: '📝' },
        { idx: 1, label: 'Accepted / Proof', icon: '👍' },
        { idx: 2, label: 'In Production', icon: '⚙️' },
        { idx: 3, label: 'Batch Delivered', icon: '🚚' },
        { idx: 4, label: 'Completed', icon: '✅' }
    ];

    const inhouseCompletedCount = inhouseList.filter(i => String(i.status).toLowerCase() === 'completed').length;
    const outsourceCompletedCount = outsourceList.filter(o => String(o.status).toLowerCase() === 'completed' || o.current_stage_idx >= 4).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* OVERALL MANUFACTURING MILESTONE TRAIL */}
            {/* <div className="lcard">
                <div className="lch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="lcht">Manufacturing Journey — High-Level Trail</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                        {journey.length} Milestone Steps
                    </span>
                </div>
                <div className="lcb">
                    {journey.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                            No shopfloor journey milestones recorded yet
                        </div>
                    ) : (
                        <div className="journey" style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, journey.length))}, 1fr)` }}>
                            {journey.map((s, i) => {
                                const c = dc(s.dept);
                                const isDone = s.status === 'complete' || s.status === 'Completed';
                                const isActive = s.status === 'active' || s.status === 'In Progress';
                                return (
                                    <div
                                        key={i}
                                        className={'jstep' + (isDone ? ' done' : isActive ? ' active' : ' skip')}
                                        style={{
                                            '--sc': c,
                                            '--sb': c + '12',
                                            borderTopColor: c,
                                            borderColor: s.status !== 'pending' ? c + '44' : '#E2E8F0'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 21 }}>{s.icon || '🏭'}</span>
                                            <span className={'tag ' + (isDone ? 'tg' : isActive ? 'tb' : 'ts')}>
                                                {s.status || 'pending'}
                                            </span>
                                        </div>
                                        <div className="js-dept" style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                                            {s.dept}
                                        </div>
                                        <div className="js-meta">
                                            In: <b style={{ color: c }}>{s.in ?? '—'} pcs</b><br />
                                            Out: <b style={{ color: c }}>{s.out ?? '—'} pcs</b><br />
                                            Time: <b>{s.time || '—'}</b><br />
                                            Cost: <b>{s.cost ? fmtR(s.cost) : 'Pending'}</b><br />
                                            QC: <b style={{ color: s.qc === 'pass' ? '#059669' : s.qc === 'pending' ? '#F59E0B' : '#EF4444' }}>{s.qc || 'pending'}</b>
                                        </div>
                                        {s.dt && (
                                            <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                                                {s.dt}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div> */}



            {/* SECTION 0: DTP STUDIO TRAIL */}
            {job.dtp_overview && job.dtp_overview.length > 0 && (
                (() => {
                    const filteredDtp = job.dtp_overview.filter(dtp => {
                        const jobId = String(job.id || '').toLowerCase().trim();
                        const dtpSub = String(dtp.sub_job_no || '').toLowerCase().trim();
                        const dtpJob = String(dtp.job_no || '').toLowerCase().trim();
                        return dtpSub === jobId || (!dtpSub && dtpJob === jobId);
                    });

                    if (filteredDtp.length === 0) return null;

                    return (
                        <div className="lcard">
                            <div className="lch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="lcht" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>🎨</span>
                                    <span>DTP Studio Pre-Press Trail</span>
                                    {filteredDtp.length > 1 && (
                                        <span style={{ fontSize: 11, background: '#F3E8FF', color: '#7E22CE', padding: '2px 8px', borderRadius: 9999, fontWeight: 800 }}>
                                            {filteredDtp.length} DTP Jobs
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="lcb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {filteredDtp.map((dtp, idx) => {
                                    const isDone = String(dtp.status).toLowerCase() === 'completed';
                                    const isHold = dtp.is_on_hold;
                                    const statusColor = isHold ? '#EF4444' : (isDone ? '#059669' : '#0284C7');
                                    const statusBg = isHold ? '#FEF2F2' : (isDone ? '#ECFDF5' : '#F0F9FF');
                                    const statusBorder = isHold ? '#FECACA' : (isDone ? '#A7F3D0' : '#BAE6FD');

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                border: '1px solid #E2E8F0',
                                                borderRadius: 12,
                                                background: '#FFFFFF',
                                                padding: 14,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                                                            {dtp.sub_job_no || dtp.job_no}
                                                        </span>
                                                        {dtp.urgency_sent && (
                                                            <span style={{ fontSize: 11, background: '#FEF2F2', color: '#EF4444', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                                URGENT
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: 11, background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, padding: '1px 8px', borderRadius: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                                                            {dtp.is_on_hold ? 'ON HOLD' : dtp.status}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 4 }}>
                                                        Assigned Artist: <b style={{ color: '#334155' }}>{dtp.assigned_to_name || 'Unassigned'}</b>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date overview removed per request */}

                                            {/* DTP VISUAL STEPPER */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '20px 10px 10px 10px', position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: 14, left: '10%', right: '10%', height: 2, background: '#E2E8F0', zIndex: 0 }}></div>
                                                {[
                                                    { label: 'Ingest Files', idx: 1, icon: '📥' },
                                                    { label: 'Master Template', idx: 2, icon: '📐' },
                                                    { label: 'Content Proofing', idx: 3, icon: '📝' },
                                                    { label: 'Final Prep', idx: 4, icon: '⚙️' },
                                                    { label: 'Push to Floor', idx: 5, icon: '🏭' },
                                                    { label: 'Accounting Qty', idx: 6, icon: '🔢' },
                                                ].map((step, sIdx) => {
                                                    const STAGES = ['Pending', 'Assigned', 'Master Template', 'Content Proofing', 'Final Prep', 'Push to Floor', 'Accounting Quantity', 'Shop Floor', 'Completed'];
                                                    const currentIdx = STAGES.indexOf(dtp.status) === -1 ? 0 : STAGES.indexOf(dtp.status);

                                                    // Anything >= 7 (Shop Floor or Completed) means all 6 DTP steps are done
                                                    const isDone = currentIdx > step.idx || currentIdx >= 7;
                                                    const isCurrent = currentIdx === step.idx;

                                                    const bgColor = isDone ? '#10B981' : (isCurrent ? '#3B82F6' : '#F8FAFC');
                                                    const color = isDone || isCurrent ? '#FFFFFF' : '#94A3B8';
                                                    const borderColor = isDone ? '#10B981' : (isCurrent ? '#3B82F6' : '#CBD5E1');

                                                    return (
                                                        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1, flex: 1 }}>
                                                            <div style={{
                                                                width: 30, height: 30, borderRadius: '50%', background: bgColor, color,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, border: `2px solid ${borderColor}`,
                                                                boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none',
                                                                transition: 'all 0.2s'
                                                            }}>
                                                                {isDone ? '✓' : step.icon}
                                                            </div>
                                                            <div style={{ fontSize: 9, fontWeight: 800, color: isDone || isCurrent ? '#334155' : '#94A3B8', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                                                                {step.label}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {dtp.stage_updates && dtp.stage_updates.length > 0 && (
                                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>Stage Updates Log</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {dtp.stage_updates.map((su, sIdx) => (
                                                            <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, background: '#F1F5F9', padding: '6px 10px', borderRadius: 6 }}>
                                                                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, minWidth: 100 }}>{su.updated_at || ''}</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <span style={{ fontWeight: 800, color: '#334155', marginRight: 6 }}>{su.stage_name}</span>
                                                                    <span style={{ color: '#64748B' }}>{su.remarks || ''}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()
            )}

            {/* JOURNEY SUMMARY COUNTERS & FILTER TABS */}
            <div className="lcard">
                <div className="lch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="lcht">Shop Floor Execution Breakdown</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => setActiveFilter('all')}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid ' + (activeFilter === 'all' ? '#0D9488' : '#CBD5E1'),
                                background: activeFilter === 'all' ? '#0D9488' : '#F8FAFC',
                                color: activeFilter === 'all' ? '#FFFFFF' : '#475569',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            All ({inhouseList.length + outsourceList.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('inhouse')}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid ' + (activeFilter === 'inhouse' ? '#0EA5E9' : '#CBD5E1'),
                                background: activeFilter === 'inhouse' ? '#0EA5E9' : '#F8FAFC',
                                color: activeFilter === 'inhouse' ? '#FFFFFF' : '#475569',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            🏭 In-House ({inhouseList.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('outsource')}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid ' + (activeFilter === 'outsource' ? '#6366F1' : '#CBD5E1'),
                                background: activeFilter === 'outsource' ? '#6366F1' : '#F8FAFC',
                                color: activeFilter === 'outsource' ? '#FFFFFF' : '#475569',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            🤝 Outsource ({outsourceList.length})
                        </button>
                    </div>
                </div>
                <div className="lcb">
                    <div className="rg4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {[
                            { l: 'In-House Processes', v: `${inhouseCompletedCount} / ${inhouseList.length}`, c: '#0EA5E9' },
                            { l: 'Outsource Vendors', v: `${outsourceCompletedCount} / ${outsourceList.length}`, c: '#6366F1' },
                            { l: 'Total Units Planned', v: `${job.qty || 0} pcs`, c: '#0D9488' },
                            // { l: 'Overall Job Status', v: job.status || 'Pending', c: '#059669' }
                        ].map(m => (
                            <div key={m.l} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: m.c, fontFamily: 'monospace' }}>{m.v}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>{m.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION 1: IN-HOUSE MANUFACTURING TRAIL (From Material Groups) */}
            {(activeFilter === 'all' || activeFilter === 'inhouse') && (
                <div className="lcard">
                    <div className="lch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="lcht" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🏭</span>
                            <span>Shopfloor In-House Manufacturing Trail</span>
                            <span style={{ fontSize: 11, background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 9999, fontWeight: 800 }}>
                                {inhouseList.length} Sections / Line Items
                            </span>
                        </div>
                    </div>
                    <div className="lcb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {inhouseList.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                                No in-house shopfloor material groups recorded for this job.
                            </div>
                        ) : (
                            inhouseList.map((inh, idx) => {
                                const isDone = String(inh.status).toLowerCase() === 'completed';
                                const isProg = String(inh.status).toLowerCase() === 'in progress';
                                const statusColor = isDone ? '#059669' : isProg ? '#0284C7' : '#EAB308';
                                const statusBg = isDone ? '#ECFDF5' : isProg ? '#F0F9FF' : '#FEFCE8';
                                const statusBorder = isDone ? '#A7F3D0' : isProg ? '#BAE6FD' : '#FEF08A';

                                const totalGoodIssued = (inh.process_history || []).reduce((sum, ph) => sum + (Number(ph.good_qty) || 0), 0);
                                const totalRejects = (inh.process_history || []).reduce((sum, ph) => sum + (Number(ph.bad_qty) || 0), 0);

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            border: '1px solid #E2E8F0',
                                            borderRadius: 12,
                                            background: '#FFFFFF',
                                            padding: 14,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>
                                                        {inh.process_name || 'In-House Process'}
                                                    </span>
                                                    {inh.process_index && inh.process_index !== '-' && (
                                                        <span style={{ fontSize: 11.5, background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontFamily: 'monospace' }}>
                                                            Prog.Sr.No.: {inh.process_index}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                                                    Material Group: <b style={{ color: '#334155' }}>{inh.group_name || 'Section'}</b>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: 9999,
                                                        background: statusBg,
                                                        color: statusColor,
                                                        border: `1px solid ${statusBorder}`,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {inh.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                                                <span>Process Progress</span>
                                                <span style={{ color: statusColor }}>{inh.progress || (isDone ? 100 : 0)}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        width: `${inh.progress || (isDone ? 100 : 0)}%`,
                                                        height: '100%',
                                                        background: statusColor,
                                                        borderRadius: 9999,
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* In-House Metrics Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>In-House Target</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {inh.inhouse_sheets ?? 1} sh {inh.inhouse_qty ? `(${inh.inhouse_qty} pcs)` : ''}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Good Issued</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#059669', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {totalGoodIssued} pcs
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Rejects / Recuts</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#EF4444', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {totalRejects} pcs
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Process Total Sheets</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {inh.process_qty ?? '—'} sh
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Assigned Shift / Team</div>
                                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0369A1', marginTop: 1 }}>
                                                    {inh.assigned_shifts && inh.assigned_shifts.length > 0
                                                        ? inh.assigned_shifts.map(s => (typeof s === 'object' ? s.name || s.id : `Shift ${s}`)).join(', ')
                                                        : (inh.team_allocations && inh.team_allocations.length > 0 ? inh.team_allocations.map(t => t.team_name).join(', ') : 'Unassigned')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Material Items Table with Full Dimensions & UPS */}
                                        {inh.materials && inh.materials.length > 0 && (
                                            <div style={{ marginBottom: 12 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                                                    📦 Material Specifications & Nesting
                                                </div>
                                                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                        <thead>
                                                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase' }}>
                                                                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Material Name</th>
                                                                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Type / Category</th>
                                                                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Sheet Size</th>
                                                                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>UPS (Nesting)</th>
                                                                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>One-Up Dim</th>
                                                                <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>Quantity</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {inh.materials.map((m, mIdx) => (
                                                                <tr key={mIdx} style={{ borderBottom: mIdx < inh.materials.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                                                                    <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1E293B' }}>{m.material_name || 'Material Item'}</td>
                                                                    <td style={{ padding: '6px 10px', color: '#64748B' }}>{m.category_type || m.material_type || '—'}</td>
                                                                    <td style={{ padding: '6px 10px', color: '#0F172A', fontWeight: 600, fontFamily: 'monospace' }}>{m.size || '—'}</td>
                                                                    <td style={{ padding: '6px 10px', color: '#0284C7', fontWeight: 700, fontFamily: 'monospace' }}>{m.ups ? `${m.ups} UPS` : '—'}</td>
                                                                    <td style={{ padding: '6px 10px', color: '#475569', fontFamily: 'monospace' }}>
                                                                        {m.one_up_length && m.one_up_width ? `${m.one_up_length}" × ${m.one_up_width}"` : '—'}
                                                                    </td>
                                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                                                                        {m.quantity} {m.unit || 'sheets'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Assign History & Notes */}
                                        {/* {inh.assign_history && inh.assign_history.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                                                    📝 Shift & Assignment Notes
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {inh.assign_history.map((ah, ahIdx) => (
                                                        <div key={ahIdx} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '5px 8px', borderRadius: 4, color: '#475569', border: '1px solid #E2E8F0' }}>
                                                            <span>
                                                                <b style={{ color: '#0F172A' }}>
                                                                    {ah.shifts && ah.shifts.length > 0 ? `Shift ${ah.shifts.join(', ')}` : (ah.status || 'Assigned')}
                                                                </b>
                                                                {ah.remark ? ` — ${ah.remark}` : ''}
                                                            </span>
                                                            <span style={{ color: '#64748B', fontWeight: 600 }}>{ah.assigned_at || '—'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )} */}

                                        {/* Material Inward History Log */}
                                        {inh.inward_history && inh.inward_history.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', marginBottom: 6 }}>
                                                    📥 Material Inward Quality Inspection Logs
                                                </div>
                                                <div style={{ overflowX: 'auto', border: '1px solid #CCFBF1', borderRadius: 6, background: '#F0FDFA' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                                                        <thead>
                                                            <tr style={{ background: '#CCFBF1', borderBottom: '1px solid #99F6E4', color: '#115E59', textTransform: 'uppercase' }}>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Inspect Qty</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Good Qty</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Bad Qty</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Accepted Sq. In</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Inspector</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>Date & Time</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {inh.inward_history.map((inw, inwIdx) => (
                                                                <tr key={inwIdx} style={{ borderBottom: inwIdx < inh.inward_history.length - 1 ? '1px solid #E6FFFA' : 'none' }}>
                                                                    <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0F172A' }}>{inw.inspect_qty}</td>
                                                                    <td style={{ padding: '5px 8px', fontWeight: 700, color: '#059669' }}>{inw.good_qty}</td>
                                                                    <td style={{ padding: '5px 8px', fontWeight: 700, color: inw.bad_qty > 0 ? '#DC2626' : '#64748B' }}>{inw.bad_qty}</td>
                                                                    <td style={{ padding: '5px 8px', color: '#334155', fontWeight: 600 }}>{inw.total_sq_inch_accepted || '—'}</td>
                                                                    <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155' }}>{inw.operator_name || '—'}</td>
                                                                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>{formatDateTime(inw.timestamp)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Process Activity History */}
                                        {inh.process_history && inh.process_history.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                                                    ⏱️ Operator Activity History
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {inh.process_history.map((ph, phIdx) => {
                                                        const rawRemarks = (ph.remarks || '').trim();
                                                        const isInvalidRemarks = !rawRemarks || rawRemarks === '::' || rawRemarks === ':' || rawRemarks === 'undefined' || rawRemarks === 'null' || rawRemarks === '-' || rawRemarks === '—';
                                                        return (
                                                            <div key={phIdx} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '5px 8px', borderRadius: 4, color: '#334155', border: '1px solid #E2E8F0' }}>
                                                                <span>
                                                                    <b style={{ color: '#0F172A' }}>{ph.action || ph.activity_type}</b>
                                                                    {!isInvalidRemarks ? ` — ${rawRemarks}` : ''}
                                                                </span>
                                                                <span style={{ color: '#64748B', fontWeight: 600 }}>{formatDateTime(ph.timestamp)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* SECTION 2: OUTSOURCE SUBCONTRACTING TRAIL (From outsource_assignments) */}
            {(activeFilter === 'all' || activeFilter === 'outsource') && (
                <div className="lcard">
                    <div className="lch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="lcht" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🤝</span>
                            <span>Shopfloor Outsource Subcontracting Trail</span>
                            <span style={{ fontSize: 11, background: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                                {outsourceList.length} Vendor Assignments
                            </span>
                        </div>
                    </div>
                    <div className="lcb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {outsourceList.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                                No outsource subcontracting assignments recorded for this job.
                            </div>
                        ) : (
                            outsourceList.map((out, idx) => {
                                const currentStage = Math.min(4, Math.max(0, out.current_stage_idx ?? (out.status === 'Completed' ? 4 : 0)));
                                const isDone = out.status === 'Completed' || currentStage === 4;
                                const isRejected = out.status === 'Rejected';
                                const statusColor = isRejected ? '#EF4444' : isDone ? '#059669' : '#6366F1';
                                const statusBg = isRejected ? '#FEF2F2' : isDone ? '#ECFDF5' : '#EEF2FF';
                                const statusBorder = isRejected ? '#FECACA' : isDone ? '#A7F3D0' : '#C7D2FE';

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            border: '1px solid #E2E8F0',
                                            borderRadius: 12,
                                            background: '#FFFFFF',
                                            padding: 14,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        {/* Outsource Card Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1E1B4B' }}>
                                                        🏢 {out.vendor_name || 'Outsource Vendor'}
                                                    </span>
                                                    <span style={{ fontSize: 11.5, background: '#EEF2FF', color: '#4F46E5', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                                        {out.process_name || 'Outsource Process'}
                                                    </span>
                                                    {out.process_index && out.process_index !== '-' && (
                                                        <span style={{ fontSize: 11.5, background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontFamily: 'monospace' }}>
                                                            Prog.Sr.No.: {out.process_index}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                                                    Material Group: <b style={{ color: '#334155' }}>{out.group_name || 'Section'}</b>
                                                    {out.size ? ` • Sheet Size: ${out.size}` : ''}
                                                    {out.ups ? ` • (${out.ups} UPS)` : ''}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: 9999,
                                                        background: statusBg,
                                                        color: statusColor,
                                                        border: `1px solid ${statusBorder}`,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {out.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rejection Alert if present */}
                                        {isRejected && out.rejection_reason && (
                                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991B1B', marginBottom: 12 }}>
                                                <b>⚠️ Rejection Reason:</b> {out.rejection_reason}
                                            </div>
                                        )}

                                        {/* Outsource Commercials & Schedule Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Assigned Units</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {out.outsource_qty || 0} pcs
                                                    {out.outsource_sheets ? ` (${out.outsource_sheets} sh)` : ''}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Delivered Output</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#059669', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {out.actual_delivered_qty || (isDone ? out.outsource_qty : 0)} pcs
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Negotiated Rate</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#4F46E5', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {fmtR(out.outsource_rate)} / unit
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Value</div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 1 }}>
                                                    {fmtR((out.outsource_rate || 0) * (out.outsource_qty || 0))}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Target Delivery Date</div>
                                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#D97706', marginTop: 1 }}>
                                                    {out.delivery_date ? out.delivery_date.split('T')[0] : '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5-STAGE OUTSOURCE PROGRESS STEPPER */}
                                        <div style={{ marginBottom: 12, background: '#FAFAFA', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                                                🔄 Subcontracting Lifecycle Stages
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, position: 'relative' }}>
                                                {OUTSOURCE_STAGES.map((st) => {
                                                    const isStageCompleted = currentStage >= st.idx;
                                                    const isStageCurrent = currentStage === st.idx;
                                                    return (
                                                        <div
                                                            key={st.idx}
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                textAlign: 'center',
                                                                padding: '6px 4px',
                                                                borderRadius: 6,
                                                                background: isStageCurrent ? '#EEF2FF' : isStageCompleted ? '#F0FDF4' : '#FFFFFF',
                                                                border: `1px solid ${isStageCurrent ? '#6366F1' : isStageCompleted ? '#86EFAC' : '#E2E8F0'}`
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 14, marginBottom: 2 }}>{st.icon}</span>
                                                            <span style={{ fontSize: 10.5, fontWeight: 700, color: isStageCurrent ? '#4338CA' : isStageCompleted ? '#15803D' : '#94A3B8' }}>
                                                                {st.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Stage History Timeline Events */}
                                        {out.stage_history && out.stage_history.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', marginBottom: 6 }}>
                                                    📜 Live Stage Update History
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#EEF2FF', padding: 8, borderRadius: 6, border: '1px solid #E0E7FF' }}>
                                                    {out.stage_history.map((sh, shIdx) => (
                                                        <div key={shIdx} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', color: '#3730A3' }}>
                                                            <span>
                                                                <b>✓ {sh.stage_label || `Stage ${sh.stage_idx}`}</b>
                                                            </span>
                                                            <span style={{ color: '#6366F1', fontWeight: 600 }}>{sh.updated_at || '—'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Assign History & Notes */}
                                        {out.assign_history && out.assign_history.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                                                    📝 Assignment & Vendor Confirmation Logs
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {out.assign_history.map((ah, ahIdx) => (
                                                        <div key={ahIdx} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '5px 8px', borderRadius: 4, color: '#475569', border: '1px solid #E2E8F0' }}>
                                                            <span>
                                                                <b style={{ color: '#0F172A' }}>{ah.status || 'Confirmed'}</b>
                                                                {ah.remark ? ` — ${ah.remark}` : ''}
                                                                {ah.price ? ` @ ₹${ah.price}/u` : ''}
                                                            </span>
                                                            <span style={{ color: '#64748B', fontWeight: 600 }}>{ah.assigned_at || '—'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Batch Delivery Schedule & Receipts Table */}
                                        {out.batch_receipts && out.batch_receipts.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', marginBottom: 6 }}>
                                                    📦 Batch Delivery Receipts Schedule
                                                </div>
                                                <div style={{ overflowX: 'auto', border: '1px solid #E0E7FF', borderRadius: 6, background: '#EEF2FF' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                                                        <thead>
                                                            <tr style={{ background: '#E0E7FF', borderBottom: '1px solid #C7D2FE', color: '#3730A3', textTransform: 'uppercase' }}>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Type</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Quantity</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Date</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>Time</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {out.batch_receipts.map((br, brIdx) => (
                                                                <tr key={brIdx} style={{ borderBottom: brIdx < out.batch_receipts.length - 1 ? '1px solid #E0E7FF' : 'none' }}>
                                                                    <td style={{ padding: '5px 8px', fontWeight: 600, color: br.type === 'actual' ? '#059669' : '#4F46E5' }}>
                                                                        {br.type === 'actual' ? '✅ Actual Receipt' : '📅 Expected Delivery'}
                                                                    </td>
                                                                    <td style={{ padding: '5px 8px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                                                                        {br.qty} pcs
                                                                    </td>
                                                                    <td style={{ padding: '5px 8px', color: '#334155' }}>{br.date || '—'}</td>
                                                                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748B' }}>{br.time || '—'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vendor Invoicing Details */}
                                        {(out.invoice_no || out.invoice_amt > 0) && (
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12 }}>
                                                <span style={{ fontWeight: 700, color: '#475569' }}>🧾 Vendor Invoicing:</span>
                                                {out.invoice_no && <span>Inv No: <b style={{ color: '#0F172A' }}>{out.invoice_no}</b></span>}
                                                {out.invoice_date && <span>Date: <b style={{ color: '#0F172A' }}>{out.invoice_date}</b></span>}
                                                {out.invoice_amt > 0 && <span>Amount: <b style={{ color: '#059669' }}>{fmtR(out.invoice_amt)}</b></span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default JourneyTab;