import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItems, fetchCoordRFQs } from '../../reducer/rfqReducer';
import { getAllVendors } from '../../reducer/vendorReducer';
import CTShell from './CTShell';

import { Package, Truck, ClipboardCheck, AlertTriangle, FileText, ShoppingCart, Loader2, CheckCircle2, ChevronRight, MessageSquare, Users, X, Search } from 'lucide-react';

export default function CTProc() {
  const dispatch = useDispatch();
  const { items, coordRFQs, isLoading, coordLoading } = useSelector(state => state.rfq);
  const { vendors, loading: vendorsLoading } = useSelector(state => state.vendor || { vendors: [], loading: false });
  const [selectedSection, setSelectedSection] = React.useState('ALL_POS');
  const [activeModalItem, setActiveModalItem] = React.useState(null);

  // UI-only state (presentation search/filter/sort — never mutates source data)
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [vendorFilter, setVendorFilter] = React.useState('ALL');
  const [sortBy, setSortBy] = React.useState('LATEST');

  useEffect(() => {
    dispatch(fetchItems({}));
    dispatch(fetchCoordRFQs({}));
    dispatch(getAllVendors({}));
  }, [dispatch]);

  // --- Data Calculations ---
  const rfqStats = useMemo(() => {
    const activeItems = items.filter(i => i.stage !== '1. Draft RFQ');
    return {
      assigned: activeItems.filter(i => i.stage === '2. Assign Vendors' && (!i.quotes || i.quotes.length === 0)).length,
      review: activeItems.filter(i => i.stage === '3. Review (Negotiate)' || (i.stage === '2. Assign Vendors' && i.quotes && i.quotes.length > 0)).length,
      awarded: activeItems.filter(i => i.stage === '4. PO Awarded').length,
      total: activeItems.length
    };
  }, [items]);

  const coordStats = useMemo(() => {
    let poIssued = 0, enRoute = 0, qcCheck = 0, storesInward = 0, productionRelease = 0, escalated = 0;

    coordRFQs.forEach(rfq => {
      (rfq.awards || []).forEach(award => {
        let stage = award.coordStage || 'PO ISSUED';
        const ordered = Number(award.qty) || 0;
        const issued = Number(award.inwardIssued) || 0;
        const received = Number(award.inwardReceived) || 0;
        const good = Number(award.inwardGood) || 0;

        if (stage === 'STORES INWARD' && issued > 0) {
          if (issued >= ordered || (issued >= good && received >= ordered)) {
            stage = 'PRODUCTION RELEASE';
          }
        }

        if (award.inwardIsEscalated) escalated++;

        if (stage === 'PO ISSUED') poIssued++;
        else if (stage === 'EN ROUTE') enRoute++;
        else if (stage === 'QC CHECK') qcCheck++;
        else if (stage === 'STORES INWARD') storesInward++;
        else if (stage === 'PRODUCTION RELEASE') productionRelease++;
      });
    });

    return { poIssued, enRoute, qcCheck, storesInward, productionRelease, escalated, totalPOs: poIssued + enRoute + qcCheck + storesInward + productionRelease + escalated };
  }, [coordRFQs]);

  const allPOs = useMemo(() => {
    let list = [];
    coordRFQs.forEach(rfq => {
      (rfq.awards || []).forEach(award => {
        let edd = award.poDeliveryDate || rfq.deliveryDate || rfq.deadline;
        if (edd && typeof edd === 'string') {
          edd = edd.split('T')[0];
        } else if (edd instanceof Date) {
          edd = edd.toISOString().split('T')[0];
        }

        const ordered = Number(award.qty) || 0;
        const issued = Number(award.inwardIssued) || 0;
        const received = Number(award.inwardReceived) || 0;
        const good = Number(award.inwardGood) || 0;

        let actualStage = award.coordStage || 'PO ISSUED';
        if (actualStage === 'STORES INWARD' && issued > 0) {
          if (issued >= ordered || (issued >= good && received >= ordered)) {
            actualStage = 'PRODUCTION RELEASE';
          }
        }

        list.push({
          id: `${rfq._id}_${award.poNumber}`,
          poNumber: award.poNumber,
          jobNo: rfq.subJobNo && rfq.subJobNo !== 'MANUAL' ? rfq.subJobNo : rfq.jobNo,
          material: rfq.name,
          vendor: award.vendorName,
          qty: award.qty,
          edd: edd,
          stage: actualStage,
          ordered: ordered,
          received: Number(award.inwardReceived) || 0,
          qcGood: Number(award.inwardGood) || 0,
          qcBad: Number(award.inwardRejected) || 0,
          issued: Number(award.inwardIssued) || 0,
          history: award.inwardHistory || [],
          isEscalated: award.inwardIsEscalated || false,
        });
      });
    });
    return list;
  }, [coordRFQs]);

  // --- Dynamic Grid Data ---
  const activeGridData = useMemo(() => {
    switch (selectedSection) {
      case 'ASSIGNING': return items.filter(i => i.stage === '2. Assign Vendors' && (!i.quotes || i.quotes.length === 0));
      case 'NEGOTIATING': return items.filter(i => i.stage === '3. Review (Negotiate)' || (i.stage === '2. Assign Vendors' && i.quotes && i.quotes.length > 0));
      case 'AWARDED': return items.filter(i => i.stage === '4. PO Awarded');
      case 'ACTIVE_RFQS': return items.filter(i => i.stage !== '1. Draft RFQ');

      case 'PO_ISSUED': return allPOs.filter(p => p.stage === 'PO ISSUED');
      case 'EN_ROUTE': return allPOs.filter(p => p.stage === 'EN ROUTE');
      case 'QC_CHECK': return allPOs.filter(p => p.stage === 'QC CHECK');
      case 'STORE_INWARD': return allPOs.filter(p => p.stage === 'STORES INWARD');
      case 'PRODUCTION_RELEASE': return allPOs.filter(p => p.stage === 'PRODUCTION RELEASE');
      case 'ESCALATED': return allPOs.filter(p => p.isEscalated);
      default: return allPOs;
    }
  }, [selectedSection, items, allPOs]);

  const isRfqView = ['ASSIGNING', 'NEGOTIATING', 'AWARDED', 'ACTIVE_RFQS'].includes(selectedSection);

  // --- Vendor options for filter (presentation only) ---
  const vendorOptions = useMemo(() => {
    if (isRfqView) return [];
    const set = new Set();
    activeGridData.forEach(p => { if (p.vendor) set.add(p.vendor); });
    return Array.from(set);
  }, [activeGridData, isRfqView]);

  // --- Apply search / filter / sort for DISPLAY ONLY (copy, never mutate source) ---
  const displayGridData = useMemo(() => {
    let list = [...activeGridData];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(item => {
        const name = (item.material || item.name || '').toLowerCase();
        const id = (item.poNumber || item._id || item.id || '').toString().toLowerCase();
        const job = (item.subJobNo && item.subJobNo !== 'MANUAL' ? item.subJobNo : item.jobNo || '').toString().toLowerCase();
        return name.includes(q) || id.includes(q) || job.includes(q);
      });
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(item => (item.stage || '') === statusFilter);
    }

    if (!isRfqView && vendorFilter !== 'ALL') {
      list = list.filter(item => item.vendor === vendorFilter);
    }

    const qtyOf = (i) => Number(i.qty) || 0;
    const repliesOf = (i) => (i.quotes?.length || 0);

    if (sortBy === 'QTY_DESC') {
      list.sort((a, b) => qtyOf(b) - qtyOf(a));
    } else if (sortBy === 'PENDING_REPLIES' && isRfqView) {
      list.sort((a, b) => repliesOf(a) - repliesOf(b));
    } else if (sortBy === 'ESCALATED' && !isRfqView) {
      list.sort((a, b) => (b.isEscalated ? 1 : 0) - (a.isEscalated ? 1 : 0));
    }

    return list;
  }, [activeGridData, searchQuery, statusFilter, vendorFilter, sortBy, isRfqView]);

  // Reset presentation filters when switching sections
  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setVendorFilter('ALL');
    setSortBy('LATEST');
  }, [selectedSection]);

  // --- Stage -> status-pill class (uses existing .ct-scope pill system) ---
  const stagePill = (stage) => {
    const m = {
      '2. Assign Vendors': 'sp-blue',
      '3. Review (Negotiate)': 'sp-amber',
      '4. PO Awarded': 'sp-green',
      'PO ISSUED': 'sp-grey',
      'EN ROUTE': 'sp-blue',
      'QC CHECK': 'sp-amber',
      'STORES INWARD': 'sp-green',
      'PRODUCTION RELEASE': 'sp-teal',
    };
    return m[stage] || 'sp-grey';
  };

  const stageLabel = (stage) => {
    const m = {
      '2. Assign Vendors': 'Assign Vendors',
      '3. Review (Negotiate)': 'In Process',
      '4. PO Awarded': 'PO Awarded',
    };
    return m[stage] || stage;
  };

  // Stage -> dept-node left-border class for pipeline steps
  const stageNodeClass = {
    ASSIGNING: 'st-blue', NEGOTIATING: 'st-amber', AWARDED: 'st-green',
    PO_ISSUED: 'st-grey', EN_ROUTE: 'st-blue', QC_CHECK: 'st-amber', STORE_INWARD: 'st-green', PRODUCTION_RELEASE: 'st-teal',
  };

  const getStageIcon = (stage) => {
    if (stage === 'PO ISSUED') return <FileText size={14} style={{ color: 'var(--s400)' }} />;
    if (stage === 'EN ROUTE') return <Truck size={14} style={{ color: 'var(--blue-st)' }} />;
    if (stage === 'QC CHECK') return <AlertTriangle size={14} style={{ color: 'var(--amb-st)' }} />;
    if (stage === 'STORES INWARD') return <Package size={14} style={{ color: 'var(--grn-st)' }} />;
    if (stage === 'PRODUCTION RELEASE') return <CheckCircle2 size={14} style={{ color: 'var(--teal-st)' }} />;
    return <CheckCircle2 size={14} style={{ color: 'var(--grn-st)' }} />;
  };

  // --- Reusable inline-styled bits matching the .ct-scope tokens ---
  const labelStyle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--txt3)' };
  const valueStyle = { fontSize: 13, fontWeight: 800, color: 'var(--txt)', marginTop: 2 };

  // --- KPI metric card (uses .metric) ---
  const KpiCard = ({ title, value, icon: Icon, iconColor, sectionId, loading, sub }) => {
    const selected = selectedSection === sectionId;
    return (
      <button
        type="button"
        onClick={() => setSelectedSection(sectionId)}
        className="metric"
        style={{
          textAlign: 'left',
          border: selected ? '2px solid var(--teal)' : '1px solid var(--bdr)',
          background: selected ? '#F0FDFA' : 'var(--bg2)',
          transition: 'all .15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="metric-lbl">{title}</div>
            <div className="metric-val" style={{ marginTop: 8, color: 'var(--txt)' }}>
              {loading ? <Loader2 size={26} className="spin" style={{ color: 'var(--s300)' }} /> : value}
            </div>
          </div>
          <span style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: iconColor.bg, color: iconColor.fg,
          }}>
            <Icon size={20} />
          </span>
        </div>
        {sub && <div className="metric-sub" style={{ marginTop: 8 }}>{sub}</div>}
      </button>
    );
  };

  // --- Pipeline step (uses .dept-node look) ---
  const PipelineStep = ({ label, count, id, isLast }) => {
    const selected = selectedSection === id;
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => setSelectedSection(id)}
          className={`dept-node ${stageNodeClass[id] || ''}`}
          style={{
            flex: 1, minWidth: 0, marginBottom: 0, padding: '10px 12px',
            border: selected ? '1px solid var(--teal)' : '1px solid var(--bdr)',
            borderLeftWidth: 3,
            boxShadow: selected ? '0 0 0 2px #CCFBF1' : 'none',
          }}
        >
          <div className="dept-node-name" style={{ color: 'var(--txt2)' }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: 'var(--txt)', marginTop: 4 }}>{count}</div>
        </button>
        {!isLast && (
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--s300)' }}>
            <ChevronRight size={16} />
          </span>
        )}
      </div>
    );
  };

  // --- Modal (structure preserved, restyled to .ct-scope modal) ---
  const renderModalContent = () => {
    if (!activeModalItem) return null;
    const isRFQ = !!activeModalItem.stage?.includes('RFQ') || activeModalItem.stage === '2. Assign Vendors' || activeModalItem.stage === '3. Review (Negotiate)' || activeModalItem.stage === '4. PO Awarded' || activeModalItem.vendors;
    const sentToVendors = activeModalItem.vendorTokens || activeModalItem.selectedVendors || activeModalItem.vendors || [];

    return (
      <div className="ct-backdrop" onClick={() => setActiveModalItem(null)}>
        <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div style={{ minWidth: 0 }}>
              <div className="modal-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeModalItem.material || activeModalItem.name || 'Details'}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>
                Job {activeModalItem.subJobNo && activeModalItem.subJobNo !== 'MANUAL' ? activeModalItem.subJobNo : activeModalItem.jobNo}
              </div>
            </div>
            <button className="modal-close" onClick={() => setActiveModalItem(null)}><X size={18} /></button>
          </div>

          <div className="modal-body">
            {isRFQ ? (
              <>
                <div className="sec-lbl" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} /> Sent to ({sentToVendors.length})
                </div>
                {sentToVendors.length > 0 ? (
                  <div className="g2" style={{ marginBottom: 14 }}>
                    {sentToVendors.map((v, idx) => (
                      <div key={idx} className="po-card" style={{ marginBottom: 0 }}>
                        <span className="po-name" style={{ textTransform: 'none' }}>
                          {typeof v === 'object' ? (v.vendorName || v.name || v._id) : v}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <div className="po-meta" style={{ marginBottom: 14 }}>No vendors assigned yet.</div>}

                <div className="sec-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={14} /> Quotes received ({activeModalItem.quotes?.length || 0})
                </div>
                {activeModalItem.quotes && activeModalItem.quotes.length > 0 ? (
                  <div>
                    {activeModalItem.quotes.map((q, idx) => (
                      <div key={idx} className="po-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="po-name" style={{ textTransform: 'none' }}>{q.vendorName || q.vendorId || 'Vendor'}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="po-meta">No quotes received yet.</div>}
              </>
            ) : (
              <>
                <div className="g2" style={{ marginBottom: 14 }}>
                  <div className="po-card" style={{ marginBottom: 0 }}>
                    <div style={labelStyle}>Vendor</div>
                    <div style={valueStyle}>{activeModalItem.vendor}</div>
                  </div>
                  <div className="po-card" style={{ marginBottom: 0 }}>
                    <div style={labelStyle}>EDD</div>
                    <div style={{ ...valueStyle, fontFamily: 'monospace' }}>{activeModalItem.edd || 'N/A'}</div>
                  </div>
                </div>

                <div className="sec-lbl" style={{ marginTop: 0 }}>Inward &amp; QC status</div>
                <div className="imb-prog">
                  <div className="imb-stat">
                    <div className="imb-stat-val">{activeModalItem.ordered}</div>
                    <div className="imb-stat-lbl">Ordered</div>
                  </div>
                  <div className="imb-stat">
                    <div className="imb-stat-val">{activeModalItem.received}</div>
                    <div className="imb-stat-lbl">Received</div>
                  </div>
                  <div className="imb-stat">
                    <div className="imb-stat-val" style={{ color: 'var(--grn)' }}>{activeModalItem.qcGood}</div>
                    <div className="imb-stat-lbl">QC Passed</div>
                  </div>
                  <div className="imb-stat">
                    <div className="imb-stat-val" style={{ color: '#FCA5A5' }}>{activeModalItem.qcBad}</div>
                    <div className="imb-stat-lbl">Rejected</div>
                  </div>
                  <div className="imb-stat">
                    <div className="imb-stat-val" style={{ color: 'var(--teal)' }}>{activeModalItem.issued}</div>
                    <div className="imb-stat-lbl">Released</div>
                  </div>
                </div>

                {activeModalItem.received > 0 ? (
                  <>
                    <div className="po-bar" style={{ height: 8, display: 'flex' }}>
                      <div className="po-fill" style={{ background: 'var(--grn)', width: `${(activeModalItem.qcGood / activeModalItem.ordered) * 100}%` }} title="Good" />
                      <div className="po-fill" style={{ background: 'var(--red)', width: `${(activeModalItem.qcBad / activeModalItem.ordered) * 100}%` }} title="Rejected" />
                    </div>
                    <div className="po-meta" style={{ textAlign: 'center', marginTop: 6 }}>
                      Pending QC: {activeModalItem.received - (activeModalItem.qcGood + activeModalItem.qcBad)} / {activeModalItem.received}
                    </div>
                  </>
                ) : (
                  <div className="po-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                    <Truck size={14} style={{ color: 'var(--txt3)' }} />
                    <span className="po-meta">Awaiting delivery — no material received yet</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const statusFilterOptions = isRfqView
    ? [['ALL', 'All statuses'], ['2. Assign Vendors', 'Assign Vendors'], ['3. Review (Negotiate)', 'In Process'], ['4. PO Awarded', 'PO Awarded']]
    : [['ALL', 'All statuses'], ['PO ISSUED', 'PO Issued'], ['EN ROUTE', 'En Route'], ['QC CHECK', 'QC Check'], ['STORES INWARD', 'Store Inward'], ['PRODUCTION RELEASE', 'Prod Release']];

  const sortOptions = isRfqView
    ? [['LATEST', 'Latest'], ['QTY_DESC', 'Highest quantity'], ['PENDING_REPLIES', 'Pending replies']]
    : [['LATEST', 'Latest'], ['QTY_DESC', 'Highest quantity'], ['ESCALATED', 'Escalated first']];

  // Card cell helper (job/qty/vendor/edd) — generous left padding avoids any clip
  const Cell = ({ label, value, mono }) => (
    <div style={{ minWidth: 0 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, fontFamily: mono ? 'monospace' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={typeof value === 'string' ? value : undefined}>
        {value}
      </div>
    </div>
  );

  return (
    <CTShell hideHeader={true}>
      {/* Local overrides: cancel the parent .ct-scope clipping/overflow so nothing is cut off */}
      <style>{`
        .ctproc-root { height: 100%; width: 100%; overflow-y: auto; overflow-x: hidden; background: var(--bg); }
        .ctproc-inner { max-width: 1600px; margin: 0 auto; padding: 8px; box-sizing: border-box; }
        .ctproc-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 1100px){ .ctproc-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 640px){ .ctproc-grid { grid-template-columns: 1fr; } }
        .ctproc-pipe { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
        @media (max-width: 1100px){ .ctproc-pipe { grid-template-columns: 1fr; } }
        .vendor-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 1100px){ .vendor-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 640px){ .vendor-grid { grid-template-columns: 1fr; } }
        .ctproc-card { background: var(--bg2); border: 1px solid var(--bdr); border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all .15s; display: flex; flex-direction: column; min-width: 0; }
        .ctproc-card:hover { border-color: var(--teal); box-shadow: 0 6px 16px rgba(13,148,136,0.12); transform: translateY(-2px); }
        .ctproc-card .accent { height: 3px; border-radius: 3px; margin: -14px -16px 12px; }
        .spin { animation: ctspin 1s linear infinite; } @keyframes ctspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ctproc-root">
        <div className="ctproc-inner">

          {/* Header */}
          <div style={{ marginBottom: 5 }}>
            {/* <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--teal)' }}>
              Control Tower · Phase 1 · Shop Floor Command
            </div> */}
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--txt)' }}>Procurement Engine</h1>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 4 }}>Real-time overview of RFQs, coordination, and material inwards.</div>
          </div>

          {/* KPI cards */}
          <div className="g4" style={{ marginBottom: 16 }}>
            <KpiCard title="Active RFQs" value={rfqStats.total} icon={FileText} iconColor={{ bg: '#CCFBF1', fg: 'var(--td)' }} sectionId="ACTIVE_RFQS" loading={isLoading} />
            <KpiCard title="Total POs Tracked" value={coordStats.totalPOs} icon={ShoppingCart} iconColor={{ bg: '#DBEAFE', fg: 'var(--blue-st)' }} sectionId="ALL_POS" loading={coordLoading} sub={`${coordStats.poIssued} just issued`} />
            <KpiCard title="En Route" value={coordStats.enRoute} icon={Truck} iconColor={{ bg: '#D1FAE5', fg: 'var(--grn-st)' }} sectionId="EN_ROUTE" loading={coordLoading} sub="Inbound deliveries" />
            <KpiCard title="Escalations" value={coordStats.escalated} icon={AlertTriangle} iconColor={{ bg: '#FEE2E2', fg: 'var(--red-st)' }} sectionId="ESCALATED" loading={coordLoading} sub={coordStats.escalated > 0 ? 'Needs attention' : 'All clear'} />
          </div>

          {/* Pipelines */}
          <div className="ctproc-pipe" style={{ marginBottom: 16 }}>
            <div className="card" style={{ marginBottom: 0, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="spill sp-teal">1</span>
                <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--txt2)' }}>RFQ Module Pipeline</span>
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                <PipelineStep id="ASSIGNING" label="Assigning" count={rfqStats.assigned} />
                <PipelineStep id="NEGOTIATING" label="Negotiating" count={rfqStats.review} />
                <PipelineStep id="AWARDED" label="PO Awarded" count={rfqStats.awarded} isLast />
              </div>
            </div>

            <div className="card" style={{ marginBottom: 0, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="spill sp-blue">2</span>
                <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--txt2)' }}>PO Coordination Tracking</span>
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                <PipelineStep id="PO_ISSUED" label="PO Issued" count={coordStats.poIssued} />
                <PipelineStep id="EN_ROUTE" label="En Route" count={coordStats.enRoute} isLast />
              </div>
            </div>

            <div className="card" style={{ marginBottom: 0, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="spill sp-green">3</span>
                <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--txt2)' }}>Store / Material Inward</span>
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                <PipelineStep id="QC_CHECK" label="QC Check" count={coordStats.qcCheck} />
                <PipelineStep id="STORE_INWARD" label="Store Inward" count={coordStats.storesInward} />
                <PipelineStep id="PRODUCTION_RELEASE" label="Prod Release" count={coordStats.productionRelease} isLast />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="card" style={{ marginBottom: 14, padding: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--bdr)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardCheck size={18} style={{ color: 'var(--s400)' }} />
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'capitalize', color: 'var(--txt)' }}>
                    {selectedSection.replace(/_/g, ' ').toLowerCase()}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', fontFamily: 'monospace' }}>
                    {displayGridData.length} of {activeGridData.length} items
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none' }} />
                  <input
                    className="form-inp"
                    style={{ paddingLeft: 32, fontSize: 13 }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search material, job…"
                  />
                </div>
                {/* <select className="form-sel" style={{ width: 'auto', fontSize: 13 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {sortOptions.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
                </select> */}
                {/* <select className="form-sel" style={{ width: 'auto', fontSize: 13 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  {statusFilterOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select> */}
                {!isRfqView && (
                  <select className="form-sel" style={{ width: 'auto', fontSize: 13 }} value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
                    <option value="ALL">All vendors</option>
                    {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          {displayGridData.length === 0 ? (
            <div className="card" style={{ padding: 50, textAlign: 'center', marginBottom: 24 }}>
              <ClipboardCheck size={28} style={{ color: 'var(--s300)', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt2)' }}>Nothing to show here</div>
              <div style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 4 }}>Try clearing filters or pick another pipeline stage.</div>
            </div>
          ) : (
            <div className="ctproc-grid" style={{ paddingBottom: 24 }}>
              {displayGridData.map(item => {
                const pillClass = stagePill(item.stage);
                const accentColor = {
                  'sp-grey': 'var(--grey-st)', 'sp-blue': 'var(--blue-st)', 'sp-amber': 'var(--amb-st)',
                  'sp-green': 'var(--grn-st)', 'sp-teal': 'var(--teal-st)', 'sp-red': 'var(--red-st)',
                }[pillClass] || 'var(--grey-st)';

                return (
                  <div key={item.id || item._id} className="ctproc-card" onClick={() => setActiveModalItem(item)}>
                    <div className="accent" style={{ background: accentColor }} />

                    {/* Title + status pill */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.3, color: 'var(--txt)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={item.material || item.name}>
                        {item.material || item.name || 'Unknown'}
                      </div>
                      <span className={`spill ${pillClass}`} style={{ flexShrink: 0 }}>
                        {isRfqView ? stageLabel(item.stage) : item.stage}
                      </span>
                    </div>

                    {/* ID line */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', fontFamily: 'monospace', marginBottom: 12 }}>
                      {isRfqView ? '' : `PO · ${item.poNumber || '—'}`}
                    </div>

                    {isRfqView ? (
                      <>
                        <div className="g2" style={{ marginBottom: 12 }}>
                          <Cell label="Job" value={item.subJobNo && item.subJobNo !== 'MANUAL' ? item.subJobNo : item.jobNo} />
                          <Cell label="Quantity" value={item.qty} mono />
                        </div>

                        {/* Sent vs Replies */}
                        <div style={{ marginTop: 'auto', display: 'flex', border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg3)' }}>
                            <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} /> Sent To</div>
                            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: 'var(--teal-st)', marginTop: 2 }}>
                              {(item.vendorTokens?.length) || (item.selectedVendors?.length) || (item.vendors?.length) || 0}
                            </div>
                          </div>
                          <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg3)', borderLeft: '1px solid var(--bdr)' }}>
                            <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={11} /> Replies</div>
                            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: 'var(--grn-st)', marginTop: 2 }}>
                              {item.quotes?.length || 0}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="g2" style={{ marginBottom: 12, rowGap: 10 }}>
                          <Cell label="Job" value={item.jobNo} />
                          <Cell label="Quantity" value={item.qty} mono />
                          <Cell label="Vendor" value={item.vendor} />
                          <Cell label="EDD" value={item.edd || 'N/A'} mono />
                        </div>

                        {item.stage === 'QC CHECK' && (
                          <div className="spill sp-amber" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                            Pending QC: {item.received - (item.qcGood + item.qcBad)} nos
                          </div>
                        )}

                        {item.stage === 'PRODUCTION RELEASE' && (
                          <div className="spill sp-teal" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                            Released: {item.issued} / {item.received} nos
                          </div>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--bdr)', paddingTop: 12 }}>
                          {getStageIcon(item.stage)}
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.stage}</span>
                          {item.isEscalated && <span className="spill sp-red" style={{ flexShrink: 0 }}>Escalated</span>}
                          <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--s300)', flexShrink: 0 }} />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* All Registered Vendors */}
          <div style={{ paddingBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 12 }}>
              All Supply Vendors
            </div>
            {vendorsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 20, color: 'var(--s300)' }}>
                <Loader2 className="spin" size={20} /> <span style={{ fontSize: 13, fontWeight: 700 }}>Loading vendors...</span>
              </div>
            ) : (
              <div className="vendor-grid">
                {(vendors || []).map(v => (
                  <div key={v._id} className="card" style={{ padding: '14px 16px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--txt)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {v.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(v.material_categories || []).map(c => (
                        <span key={c.id || c._id} style={{
                          fontSize: 9, fontWeight: 900, background: '#312E81', color: '#fff',
                          padding: '3px 8px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: 0.5,
                          display: 'inline-flex', alignItems: 'center', gap: 3
                        }}>
                          → {c.name}
                        </span>
                      ))}
                      {(v.material_categories?.length === 0) && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)' }}>No categories assigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {renderModalContent()}
      </div>
    </CTShell>
  );
}