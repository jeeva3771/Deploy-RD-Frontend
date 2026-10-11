import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { ACC, PRIORITY_CFG } from "../constants/accountsConstants";
import { Tag2 } from "../common/UIHelpers";
import { PeriodFilter, getCurrentMonthValue } from "../common/PeriodFilter";
import { axiosInstance } from "../../../../utils/url/config";

export default function AuditView() {
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState(ACC.audit);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [periodLabel, setPeriodLabel] = useState("Current Month");
  const [availableFinancialYears, setAvailableFinancialYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const PC = PRIORITY_CFG;

  const PANELS = [
    { id: 'stock', icon: '📦', title: 'Stock Audit', sub: 'Inventory vs records' },
    { id: 'production', icon: '⚙️', title: 'Production Audit', sub: 'BOM variance + QC' },
    { id: 'financial', icon: '💰', title: 'Financial Audit', sub: 'Debtors, creditors, books' },
    { id: 'gst', icon: '🧾', title: 'GST Compliance', sub: 'Filing, ITC, GSTIN' },
    { id: 'asset', icon: '🏭', title: 'Asset Audit', sub: 'Fixed assets + maintenance' },
    { id: 'vendor', icon: '🚛', title: 'Vendor Audit', sub: 'Payables, POs, terms' },
    { id: 'payroll', icon: '👥', title: 'Payroll Audit', sub: 'Timesheets, PF, TDS' },
    { id: 'compliance', icon: '⚖️', title: 'Statutory Compliance', sub: 'Licences, MSME, factory' }
  ];

  const fetchAudit = useCallback(async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await axiosInstance.get("/accounts/audit-summary", { params });
      if (res.data?.success && res.data.data) {
        setAuditData(res.data.data);
        if (res.data.period) setPeriodLabel(res.data.period);
        if (res.data.availableFinancialYears) setAvailableFinancialYears(res.data.availableFinancialYears);
        if (res.data.availableMonths) setAvailableMonths(res.data.availableMonths);
      }
    } catch (err) {
      console.warn("Could not fetch dynamic audit summary, fallback to defaults:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit(selectedMonth);
  }, [fetchAudit, selectedMonth]);

  const ad = auditData || ACC.audit;
  const overallSc = Math.round(Object.values(ad).reduce((s, a) => s + (a.sc || 0), 0) / (Object.values(ad).length || 1));
  const totalH = Object.values(ad).reduce((s, a) => s + (a.f || []).filter(f => f.s === 'HIGH').length, 0);
  const totalM = Object.values(ad).reduce((s, a) => s + (a.f || []).filter(f => f.s === 'MED').length, 0);
  const totalL = Object.values(ad).reduce((s, a) => s + (a.f || []).filter(f => f.s === 'LOW').length, 0);

  return (
    <div style={{ position: 'relative', minHeight: 350 }}>
      <PeriodFilter
        value={selectedMonth}
        onChange={setSelectedMonth}
        availableFinancialYears={availableFinancialYears}
        availableMonths={availableMonths}
        label="Audit Period:"
        loading={loading}
        onRefresh={() => fetchAudit(selectedMonth)}
      />

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2E8F0',
            borderTopColor: '#0D9488', animation: 'spin 0.75s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div style={{ background: '#0C1A2E', borderRadius: 13, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'monospace', color: overallSc >= 85 ? '#10B981' : overallSc >= 70 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>{overallSc}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginTop: 4 }}>Overall Audit Score</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 2, marginTop: 6, width: 90 }}><div style={{ height: '100%', background: overallSc >= 85 ? '#10B981' : overallSc >= 70 ? '#F59E0B' : '#EF4444', borderRadius: 2, width: overallSc + '%' }} /></div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[{ v: totalH, l: 'High Priority', c: '#EF4444', i: '🔴' }, { v: totalM, l: 'Medium Priority', c: '#F59E0B', i: '🟡' }, { v: totalL, l: 'Low Priority', c: '#6366F1', i: '🔵' }].map(m => (
            <div key={m.l} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.c, fontFamily: 'monospace' }}>{m.i} {m.v}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginTop: 3 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PANELS.map(p => {
          const d = ad[p.id]; if (!d) return null;
          const highs = (d.f || []).filter(f => f.s === 'HIGH').length; const meds = (d.f || []).filter(f => f.s === 'MED').length; const lows = (d.f || []).filter(f => f.s === 'LOW').length;
          const sc = d.sc || 100; const scCol = sc >= 85 ? '#10B981' : sc >= 70 ? '#F59E0B' : '#EF4444'; const isOpen = sel === p.id;
          return (
            <div key={p.id} className="card" style={{ borderColor: highs > 0 ? '#FECACA' : meds > 0 ? '#FDE68A' : '#A7F3D0', margin: 0, cursor: 'pointer' }} onClick={() => setSel(isOpen ? null : p.id)}>
              <div style={{ padding: '10px 14px', display: 'flex', justifycontent: 'space-between', alignItems: 'center', borderBottom: isOpen ? '1px solid #F8FAFC' : 'none' }}>
                <div className="flx10">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: 18 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0C1A2E' }}>{p.title}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', marginTop: 1 }}>{p.sub}</div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>Last: {d.last} · Due: {d.due}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <div style={{ textAlign: 'center', marginRight: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: scCol, fontFamily: 'monospace' }}>{sc}</div>
                    <div style={{ width: 50, height: 3, background: '#F1F5F9', borderRadius: 2, marginTop: 2 }}><div style={{ height: '100%', background: scCol, borderRadius: 2, width: sc + '%' }} /></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {highs > 0 && <Tag2 l={'🔴 ' + highs} c="#EF4444" />}
                    {meds > 0 && <Tag2 l={'🟡 ' + meds} c="#F59E0B" />}
                    {lows > 0 && <Tag2 l={'🔵 ' + lows} c="#6366F1" />}
                  </div>
                  <span style={{ color: '#CBD5E1', fontSize: 12, marginLeft: 5 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                  {(d.f || []).map((f, i) => {
                    const pc = PC[f.s] || PC.LOW; return (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 12px', background: pc.bg, border: '1px solid ' + pc.bd, borderRadius: 9, marginBottom: 6, borderLeft: '3px solid ' + pc.c, alignItems: 'center' }}>
                        <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.2 }}>{f.s === 'HIGH' ? '🔴' : f.s === 'MED' ? '🟡' : '🔵'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Tag2 l={f.s} c={pc.c} bg="white" bd={pc.bd} />
                            <span style={{ fontSize: 12.5, fontWeight: 900, color: '#0C1A2E' }}>{f.t}</span>
                          </div>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', lineHeight: 1.5 }}>{f.d}</div>
                        </div>
                        <button className="btn bs" style={{ background: 'white', borderColor: pc.bd, color: pc.c, flexShrink: 0, alignSelf: 'center', marginLeft: 'auto' }} onClick={e => { e.stopPropagation(); toast.info('Action logged: ' + f.t); }}>Action</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
