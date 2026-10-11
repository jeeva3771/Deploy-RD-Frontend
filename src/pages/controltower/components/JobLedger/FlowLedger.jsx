import React, { useState } from 'react';
import { fmtR } from './data.js';

function FlowLedger({ job }) {
    const [expand, setExpand] = useState({});
    const tog = k => setExpand(p => ({ ...p, [k]: !p[k] }));

    if (!job) return null;

    // Compute cumulative cost as we render
    let cumCost = 0;

    const TYPE_CFG = {
        reserve: { label: 'BOM RESERVATION — STORES', bg: '#0C1A2E', color: 'white', icon: '📋', border: '#0C1A2E' },
        issue: { label: 'MATERIAL ISSUE FROM STORES', bg: '#EFF6FF', color: '#1D4ED8', icon: '📤', border: '#BFDBFE' },
        process: { label: 'PRODUCTION PROCESS', bg: '#F0FDFA', color: '#0D9488', icon: '⚙️', border: '#99F6E4' },
        return: { label: 'MATERIAL RETURN TO STORES', bg: '#ECFDF5', color: '#059669', icon: '↩️', border: '#A7F3D0' },
        reject: { label: 'REJECTS / WASTAGE', bg: '#FEF2F2', color: '#EF4444', icon: '⛔', border: '#FECACA' },
        fg: { label: 'FINISHED GOODS CREATION', bg: '#F5F3FF', color: '#7C3AED', icon: '🏆', border: '#DDD6FE' },
        pack: { label: 'PACKING', bg: '#FFF7ED', color: '#C2410C', icon: '📦', border: '#FED7AA' },
        dispatch: { label: 'DISPATCH', bg: '#ECFDF5', color: '#059669', icon: '🚚', border: '#6EE7B7' },
    };

    // Summary strip
    const fl = job.flowLedger || [];
    const totalMatIssued = fl.reduce((s, stage) => s + (stage.rows || []).filter(r => r.kind === 'mat' && (r.value || 0) > 0).reduce((a, r) => a + (r.value || 0), 0), 0);
    const totalProcCost = fl.reduce((s, stage) => s + (stage.rows || []).filter(r => r.kind === 'proc').reduce((a, r) => a + (r.value || 0), 0), 0);
    const totalReturns = fl.reduce((s, stage) => s + (stage.rows || []).filter(r => r.kind === 'mat' && stage.type === 'return').reduce((a, r) => a + (r.value || 0), 0), 0);
    const totalRejects = fl.reduce((s, stage) => s + (stage.rows || []).filter(r => r.kind === 'reject' && (r.value || 0) > 0).reduce((a, r) => a + (r.value || 0), 0), 0);
    const netCost = totalMatIssued + totalProcCost - totalReturns;

    return (
        <div>

            <div className="rg5" style={{ background: '#0C1A2E', borderRadius: 13, padding: '14px 18px', marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {[
                    { l: 'Material Issued', v: fmtR(totalMatIssued), c: '#60A5FA', icon: '📤' },
                    { l: 'Process Cost', v: fmtR(totalProcCost), c: '#34D399', icon: '⚙️' },
                    { l: 'Returns / Salvage', v: fmtR(totalReturns), c: '#A3E635', icon: '↩️' },
                    { l: 'Material Loss', v: fmtR(totalRejects), c: '#F87171', icon: '⛔' },
                    { l: 'Net Job Cost', v: fmtR(netCost), c: '#FBBF24', icon: '💰' },
                ].map(m => (
                    <div key={m.l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 8px' }}>
                        <div style={{ fontSize: 19, marginBottom: 3 }}>{m.icon}</div>
                        <div style={{ fontSize: 23, fontWeight: 900, color: m.c, fontFamily: 'monospace', lineHeight: 1 }}>{m.v}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 4 }}>{m.l}</div>
                    </div>
                ))}
            </div>


            {fl.map((stage, si) => {
                const cfg = TYPE_CFG[stage.type] || TYPE_CFG.process;
                const rows = stage.rows || [];
                const stageMat = rows.filter(r => r.kind === 'mat' && stage.type !== 'return').reduce((s, r) => s + (r.value || 0), 0);
                const stageProc = rows.filter(r => r.kind === 'proc').reduce((s, r) => s + (r.value || 0), 0);
                const stageReturn = stage.type === 'return' ? rows.filter(r => r.kind === 'mat').reduce((s, r) => s + (r.value || 0), 0) : 0;
                const stageTotal = stageMat + stageProc - stageReturn;
                if (stage.type !== 'return') cumCost += stageTotal;
                else cumCost -= stageReturn;
                const thisCum = cumCost;
                const isOpen = expand[si] !== false; // default open

                return (
                    <div key={si} style={{ marginBottom: 12, borderRadius: 13, overflow: 'hidden', border: '1.5px solid ' + cfg.border, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                        <div style={{ background: cfg.bg, padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => tog(si)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 26 }}>{cfg.icon}</span>
                                <div>
                                    <div style={{ fontSize: 14.5, fontWeight: 900, color: stage.type === 'reserve' ? 'rgba(255,255,255,0.9)' : cfg.color, textTransform: 'uppercase', letterSpacing: .5 }}>{stage.dept}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: stage.type === 'reserve' ? 'rgba(255,255,255,0.55)' : '#64748B', marginTop: 2 }}>{stage.date} · Ref: {stage.ref}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                {stageMat > 0 && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#60A5FA' }}>Mat: {fmtR(stageMat)}</span>}
                                {stageProc > 0 && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#34D399' }}>Process: {fmtR(stageProc)}</span>}
                                {stageReturn > 0 && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#A3E635' }}>Return: -{fmtR(stageReturn)}</span>}
                                <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: stage.type === 'reserve' ? '#FBBF24' : cfg.color }}>
                                    Stage: {fmtR(Math.abs(stageTotal))}
                                </span>
                                <span style={{ fontSize: 12.5, fontWeight: 900, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.25)', borderRadius: 7, padding: '3px 9px' }}>
                                    Cumulative: {fmtR(thisCum)}
                                </span>
                                <span style={{ color: stage.type === 'reserve' ? 'rgba(255,255,255,0.5)' : '#94A3B8', fontSize: 16, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
                            </div>
                        </div>


                        {isOpen && (
                            <div style={{ background: 'white' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                                            <th style={{ padding: '7px 10px', fontWeight: 900, color: '#64748B', fontSize: 11.5, textTransform: 'uppercase', width: 90 }}>Type</th>
                                            <th className="flth">Item / Process</th>
                                            <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 900, color: '#64748B', fontSize: 11.5, width: 65 }}>Qty</th>
                                            <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 900, color: '#64748B', fontSize: 11.5, width: 55 }}>Unit</th>
                                            <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 900, color: '#64748B', fontSize: 11.5, width: 85 }}>Rate (₹)</th>
                                            <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 900, color: '#64748B', fontSize: 11.5, width: 100 }}>Value (₹)</th>
                                            <th className="flth">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stage.rows.map((r, ri) => {
                                            const isMatRow = r.kind === 'mat';
                                            const isProcRow = r.kind === 'proc';
                                            const isRejectRow = r.kind === 'reject';
                                            const isFGRow = r.kind === 'fg';
                                            const rowBg = isRejectRow ? '#FEF9FA' : isProcRow ? '#F0FDF4' : isFGRow ? '#F5F3FF' : 'white';
                                            const typeLabel = isRejectRow ? 'REJECT' : isProcRow ? 'PROCESS' : isFGRow ? 'FG ENTRY' : stage.type === 'return' ? 'RETURN' : 'MATERIAL';
                                            const typeColor = isRejectRow ? '#EF4444' : isProcRow ? '#0D9488' : isFGRow ? '#7C3AED' : stage.type === 'return' ? '#059669' : '#2563EB';
                                            return (
                                                <tr key={ri} style={{ background: rowBg, borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '7px 10px' }}>
                                                        <span style={{ background: typeColor + '15', color: typeColor, border: '1px solid ' + typeColor + '33', borderRadius: 5, padding: '2px 7px', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{typeLabel}</span>
                                                    </td>
                                                    <td style={{ padding: '7px 10px', fontWeight: 800, color: isRejectRow ? '#B91C1C' : isProcRow ? '#065F46' : isFGRow ? '#5B21B6' : '#0C1A2E' }}>
                                                        {r.item || r.process}
                                                    </td>
                                                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: isRejectRow ? '#EF4444' : isProcRow ? '#0D9488' : '#0C1A2E' }}>
                                                        {r.qty}
                                                    </td>
                                                    <td style={{ padding: '7px 10px', textAlign: 'center', color: '#64748B' }}>{r.unit}</td>
                                                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                                                        {r.rate > 0 ? '₹' + r.rate.toLocaleString('en-IN') : '—'}
                                                    </td>
                                                    <td style={{
                                                        padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900,
                                                        color: isRejectRow ? '#EF4444' : stage.type === 'return' ? '#059669' : isProcRow ? '#059669' : '#0C1A2E'
                                                    }}>
                                                        {r.value > 0 ? (stage.type === 'return' ? '-' : '' + '₹' + r.value.toLocaleString('en-IN')) : isRejectRow && r.value === 0 ? '(within BOM)' : '—'}
                                                    </td>
                                                    <td style={{ padding: '7px 10px', fontSize: 11.5, color: '#64748B' }}>{r.note}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {(stageMat > 0 || stageProc > 0) && (
                                        <tfoot>
                                            <tr style={{ background: '#F0FDFA', borderTop: '1.5px solid #A7F3D0' }}>
                                                <td colSpan={5} style={{ padding: '8px 10px', fontWeight: 900, fontSize: 12.5, color: '#065F46' }}>
                                                    Stage Total — {stage.dept}
                                                </td>
                                                <td style={{
                                                    padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: 14.5,
                                                    color: stage.type === 'return' ? '#059669' : '#0C1A2E'
                                                }}>
                                                    {stage.type === 'return' ? '-' : ''}{fmtR(Math.abs(stageTotal))}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>

                                <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                                        <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>📌</span>
                                        <div>
                                            <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0C1A2E', marginBottom: 2 }}>Output: {stage.output}</div>
                                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B' }}>{stage.note}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Op: {stage.op}</span>
                                        {stage.qc !== '—' && <span className={'tag ' + (stage.qc === 'pass' ? 'tg' : stage.qc === 'fail' ? 'tr' : 'ta')}>{stage.qc === 'pass' ? 'QC PASS' : stage.qc === 'fail' ? 'QC FAIL' : 'PENDING'}</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default FlowLedger;