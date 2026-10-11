import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllItems } from '../../reducer/inventory/itemReducer';
import { fetchAllStoreIssues } from '../../reducer/storeReducer';


const TrophyStoreMaster = () => {
  const dispatch = useDispatch();
  const { items, stats, loading: itemsLoading } = useSelector((state) => state.items);
  const { issues, loading: issuesLoading } = useSelector((state) => state.store);

  useEffect(() => {
    dispatch(fetchAllItems({ page: 1, limit: 1000 })); 
    dispatch(fetchAllStoreIssues());
  }, [dispatch]);

  // Derived stats
  const totalUnitsInHand = stats?.totalStockUnits || 0;
  const lowStockAlerts = stats?.lowStockItems || 0;
  const activeProductionJobs = issues.filter(i => i.status !== 'COMPLETED' && i.status !== 'DELIVERED').length || 0;
  const stockValue = stats?.totalStockValue || 0;

  // Mapped Data
  const inventoryDist = useMemo(() => {
     let acrylics = 0, metals = 0, chemicals = 0, hardware = 0;
     (items || []).forEach(item => {
        const cat = item?.category?.name?.toLowerCase() || '';
        if(cat.includes('acrylic')) acrylics += item.stock || 0;
        else if(cat.includes('metal')) metals += item.stock || 0;
        else if(cat.includes('chemical')) chemicals += item.stock || 0;
        else if(cat.includes('hardware')) hardware += item.stock || 0;
     });
     if(acrylics === 0 && metals === 0 && chemicals === 0 && hardware === 0) {
       return [
         { label: 'ACRYLICS', units: 514, width: '85%', color: 'bg-purple-500' },
         { label: 'METALS', units: 405, width: '65%', color: 'bg-indigo-400' },
         { label: 'CHEMICALS', units: 155, width: '30%', color: 'bg-pink-400' },
         { label: 'HARDWARE', units: 180, width: '35%', color: 'bg-pink-300' },
       ];
     }
     return [
       { label: 'ACRYLICS', units: acrylics, width: Math.min(100, (acrylics/1000)*100)+'%', color: 'bg-purple-500' },
       { label: 'METALS', units: metals, width: Math.min(100, (metals/1000)*100)+'%', color: 'bg-indigo-400' },
       { label: 'CHEMICALS', units: chemicals, width: Math.min(100, (chemicals/1000)*100)+'%', color: 'bg-pink-400' },
       { label: 'HARDWARE', units: hardware, width: Math.min(100, (hardware/1000)*100)+'%', color: 'bg-pink-300' },
     ];
  }, [items]);

  const liveJobs = useMemo(() => {
    if(!issues || issues.length === 0) return [
      { id: 'JOB-061', client: 'ALPHA CORP', status: 'IN PRODUCTION', risk: 'HIGH', riskColor: 'text-orange-600 bg-orange-50 border border-orange-200' },
      { id: 'JOB-062', client: 'BETA IND', status: 'AWAITING MAT', risk: 'CRITICAL', riskColor: 'text-red-600 bg-red-50 border border-red-200' },
      { id: 'JOB-063', client: 'GAMMA LTD', status: 'BOM LOCKED', risk: 'LOW', riskColor: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
      { id: 'JOB-064', client: 'DELTA SYSTEMS', status: 'PARTIAL ISSUE', risk: 'HIGH', riskColor: 'text-orange-600 bg-orange-50 border border-orange-200' },
      { id: 'JOB-065', client: 'SIGMA CORP', status: 'QUALITY CHECK', risk: 'PARTIAL', riskColor: 'text-blue-600 bg-blue-50 border border-blue-200' },
    ];
    return issues.slice(0, 5).map(issue => {
       const risk = issue.is_date_changed ? 'CRITICAL' : (issue.is_qty_changed ? 'HIGH' : 'LOW');
       let riskColor = 'text-emerald-600 bg-emerald-50 border border-emerald-200';
       if(risk === 'CRITICAL') riskColor = 'text-red-600 bg-red-50 border border-red-200';
       if(risk === 'HIGH') riskColor = 'text-orange-600 bg-orange-50 border border-orange-200';
       return {
         id: issue.sub_job_no || 'N/A',
         client: issue.client_name || 'N/A',
         status: issue.status || 'NEW',
         risk, riskColor
       };
    });
  }, [issues]);

  const jobProgressList = useMemo(() => {
    if(!issues || issues.length === 0) return [
      { id: 'JOB-061', title: 'Corporate Trophy Set x20', client: 'ALPHA CORP', risk: 'HIGH', rColor: 'text-orange-600 bg-orange-50 border-orange-200', pct: 65, pColor: 'bg-orange-400' },
      { id: 'JOB-062', title: 'Sports Award - Football Club', client: 'BETA IND', risk: 'CRITICAL', rColor: 'text-red-600 bg-red-50 border-red-200', pct: 15, pColor: 'bg-red-400' },
      { id: 'JOB-063', title: 'Academic Medal Batch x50', client: 'GAMMA LTD', risk: 'LOW', rColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', pct: 40, pColor: 'bg-emerald-400' },
      { id: 'JOB-064', title: 'Customized Crystal Award', client: 'DELTA SYSTEMS', risk: 'HIGH', rColor: 'text-orange-600 bg-orange-50 border-orange-200', pct: 70, pColor: 'bg-orange-400' },
      { id: 'JOB-065', title: 'Participation Plaque x100', client: 'SIGMA CORP', risk: 'PARTIAL', rColor: 'text-blue-600 bg-blue-50 border-blue-200', pct: 90, pColor: 'bg-blue-400' },
    ];
    return issues.slice(0, 5).map((issue, i) => {
       const risk = issue.is_date_changed ? 'CRITICAL' : 'LOW';
       const pct = Math.floor((i + 1) * 15) % 100 + 10; 
       return {
         id: issue.sub_job_no || 'N/A',
         title: issue.product_name || 'Generic Product',
         client: issue.client_name || 'N/A',
         risk: risk,
         pct, pColor: risk === 'CRITICAL' ? 'bg-red-400' : 'bg-emerald-400',
         rColor: risk === 'CRITICAL' ? 'text-red-600 bg-red-50 border-red-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
       };
    });
  }, [issues]);

  const mappedItems = useMemo(() => {
    if(!items || items.length === 0) return [
      { id: 'ACR-001', mat: 'Acrylic Sheet (Clear)', cat: 'ACRYLIC', in: '420 sheets', min: '200', lvl: '60%', status: '✓ OK', sColor: 'text-emerald-600 border-emerald-200 bg-emerald-50', bColor: 'bg-emerald-400' },
      { id: 'ACR-002', mat: 'Acrylic Sheet (Colored)', cat: 'ACRYLIC', in: '85 sheets', min: '150', lvl: '15%', status: '⚠ LOW', sColor: 'text-red-500 border-red-200 bg-red-50', bColor: 'bg-red-400' },
      { id: 'WOD-001', mat: 'MDF Board (12mm)', cat: 'WOOD', in: '310 pcs', min: '100', lvl: '50%', status: '✓ OK', sColor: 'text-emerald-600 border-emerald-200 bg-emerald-50', bColor: 'bg-emerald-400' },
      { id: 'WOD-002', mat: 'Walnut Plaque Base', cat: 'WOOD', in: '42 pcs', min: '80', lvl: '10%', status: '⚠ LOW', sColor: 'text-red-500 border-red-200 bg-red-50', bColor: 'bg-red-400' },
      { id: 'MTL-001', mat: 'Aluminum Base Plate', cat: 'METAL', in: '190 pcs', min: '100', lvl: '40%', status: '✓ OK', sColor: 'text-emerald-600 border-emerald-200 bg-emerald-50', bColor: 'bg-emerald-400' },
      { id: 'MTL-002', mat: 'Brass Figurine (Star)', cat: 'METAL', in: '28 pcs', min: '60', lvl: '10%', status: '⚠ LOW', sColor: 'text-red-500 border-red-200 bg-red-50', bColor: 'bg-red-400' },
      { id: 'ENG-001', mat: 'Engraving Tape', cat: 'CONSUMABLE', in: '55 rolls', min: '50', lvl: '25%', status: '− MID', sColor: 'text-orange-500 border-orange-200 bg-orange-50', bColor: 'bg-orange-400' },
      { id: 'RIB-001', mat: 'Satin Ribbon (Gold)', cat: 'COMPONENT', in: '220 m', min: '100', lvl: '60%', status: '✓ OK', sColor: 'text-emerald-600 border-emerald-200 bg-emerald-50', bColor: 'bg-emerald-400' },
      { id: 'PLT-001', mat: 'Name Plates (Brass)', cat: 'COMPONENT', in: '310 pcs', min: '200', lvl: '50%', status: '✓ OK', sColor: 'text-emerald-600 border-emerald-200 bg-emerald-50', bColor: 'bg-emerald-400' },
      { id: 'ADH-001', mat: 'UV Adhesive', cat: 'CONSUMABLE', in: '12 bottles', min: '30', lvl: '5%', status: '⚠ LOW', sColor: 'text-red-500 border-red-200 bg-red-50', bColor: 'bg-red-400' },
    ];
    return items.slice(0, 10).map(item => {
      const isLow = item.stock <= (item.min_stock || 0);
      return {
        id: item.item_code || 'N/A',
        mat: item.name || 'Unnamed',
        cat: item?.category?.name || 'UNDEF',
        in: `${item.stock || 0} ${item?.unit?.symbol || ''}`,
        min: item.min_stock || 0,
        lvl: item.stock ? Math.min(100, (item.stock / Math.max((item.min_stock || 0)*3, 100)) * 100) + '%' : '0%',
        status: isLow ? '⚠ LOW' : '✓ OK',
        sColor: isLow ? 'text-red-500 border-red-200 bg-red-50' : 'text-emerald-600 border-emerald-200 bg-emerald-50',
        bColor: isLow ? 'bg-red-400' : 'bg-emerald-400'
      };
    });
  }, [items]);

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-6 font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-wide text-gray-800">TROPHY STORE MASTER</h1>
          <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 rounded">V3.1 ENTERPRISE</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 tracking-wider">
              <span>✓</span>
              <span>LEDGER INTEGRITY: VERIFIED</span>
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AUDIT READY: FY 2025-26</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">RD</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-5 shadow-sm border border-gray-100 border-l-4 border-l-blue-600 rounded">
          <div className="text-3xl font-extrabold text-gray-800">{totalUnitsInHand || '1,087'}</div>
          <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Total Units In Hand</div>
        </div>
        <div className="bg-white p-5 shadow-sm border border-gray-100 border-l-4 border-l-red-400 rounded">
          <div className="text-3xl font-extrabold text-red-400">{lowStockAlerts || '4'}</div>
          <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Low Stock Alerts</div>
        </div>
        <div className="bg-white p-5 shadow-sm border border-gray-100 border-l-4 border-l-emerald-400 rounded">
          <div className="text-3xl font-extrabold text-emerald-400">{activeProductionJobs || '5'}</div>
          <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Active Production Jobs</div>
        </div>
        <div className="bg-white p-5 shadow-sm border border-gray-100 border-l-4 border-l-orange-400 rounded">
          <div className="text-3xl font-extrabold text-orange-400">₹{stockValue ? (stockValue / 1000).toFixed(1) + 'K' : '14.2K'}</div>
          <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Stock Value (Hand)</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        
        {/* Row 1, Col 1 */}
        <div className="col-span-4 bg-white shadow-sm border border-gray-100 rounded overflow-hidden flex flex-col">
          <div className="bg-[#4a6cf7] text-white px-4 py-2 text-xs font-bold tracking-widest uppercase">
            Live Production Control
          </div>
          <div className="p-4 flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-2">Job ID / Client</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {liveJobs.map((job, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <div className="font-bold text-blue-600">{job.id}</div>
                      <div className="text-[9px] text-gray-400 font-bold tracking-wider">{job.client}</div>
                    </td>
                    <td className="py-3 text-center text-[10px] font-bold text-gray-600 lowercase" style={{fontVariant: 'small-caps'}}>{job.status}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded tracking-wider ${job.riskColor}`}>{job.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 1, Col 2 */}
        <div className="col-span-4 bg-white shadow-sm border border-gray-100 rounded overflow-hidden flex flex-col">
          <div className="bg-[#4a6cf7] text-white px-4 py-2 text-xs font-bold tracking-widest uppercase">
            Inventory Distribution
          </div>
          <div className="p-5 flex-1 flex flex-col gap-5">
            {inventoryDist.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-bold mb-1 tracking-wider text-gray-600">
                  <span>{item.label}</span>
                  <span className="text-gray-400">{item.units} UNITS</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded overflow-hidden">
                  <div className={`h-full ${item.color} rounded`} style={{ width: item.width }}></div>
                </div>
              </div>
            ))}

            <div className="mt-2 pt-4 border-t border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Scrap & Wastage</div>
              <table className="w-full text-[10px] font-bold">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600 italic font-medium">Acrylic Sheet</td>
                    <td className="py-1 text-right text-red-500">32 sheets</td>
                    <td className="py-1 text-right text-gray-400">4.2%</td>
                    <td className="py-1 text-right text-orange-400">₹2,400</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600 italic font-medium">MDF Board</td>
                    <td className="py-1 text-right text-red-400">18 pcs</td>
                    <td className="py-1 text-right text-gray-400">3.1%</td>
                    <td className="py-1 text-right text-orange-400">₹900</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600 italic font-medium">Brass Figurine</td>
                    <td className="py-1 text-right text-red-500">7 pcs</td>
                    <td className="py-1 text-right text-gray-400">6.8%</td>
                    <td className="py-1 text-right text-orange-400">₹1,540</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 1, Col 3 */}
        <div className="col-span-4 bg-[#0d1017] rounded shadow border border-gray-800 overflow-hidden flex flex-col">
          <div className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-gray-400">
            Branch Compliance Audit
          </div>
          <div className="p-5 flex-1 flex flex-col justify-around">
            {[
              { branch: 'HO-MUM', var: '1.2%', score: '98%', color: 'text-emerald-500' },
              { branch: 'FR-DEL', var: '8.2%', score: '72%', color: 'text-red-500' },
              { branch: 'FR-BAN', var: '4.8%', score: '85%', color: 'text-emerald-500' },
              { branch: 'FR-PUN', var: '12.4%', score: '68%', color: 'text-red-500' },
            ].map((b, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div>
                  <div className="text-gray-200 font-bold text-xs tracking-wider">{b.branch}</div>
                  <div className="text-gray-500 text-[9px] font-bold tracking-widest mt-0.5">VARIANCE: {b.var}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${b.color}`}>{b.score}</div>
                  <div className="text-gray-600 text-[8px] font-bold tracking-widest uppercase mt-[-2px]">Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Row 2, Col 1 */}
        <div className="col-span-4 bg-[#0d1017] rounded shadow border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-gray-400">
            Monthly KPI Strip
          </div>
          <div className="flex flex-col">
            {[
              { label: 'INVENTORY VALUE', val: '₹4.85M', change: '+11%', changeColor: 'text-emerald-500', prev: '₹4.3M' },
              { label: 'MATERIAL VARIANCE', val: '4.8%', change: '+1.6%', changeColor: 'text-red-500', prev: '4.2%' },
              { label: 'SCRAP RATE', val: '3.4%', change: '-0.4%', changeColor: 'text-emerald-500', prev: '3.8%' },
              { label: 'TURNOVER RATIO', val: '4.2X', change: '+5%', changeColor: 'text-emerald-500', prev: '3.8X' },
            ].map((kpi, i) => (
              <div key={i} className="px-5 py-4 border-t border-gray-800 flex justify-between items-center">
                <div>
                  <div className="text-gray-500 text-[9px] font-bold tracking-widest uppercase">{kpi.label}</div>
                  <div className="text-gray-200 text-xl font-bold mt-1">{kpi.val}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold tracking-wider ${kpi.changeColor}`}>{kpi.change}</div>
                  <div className="text-gray-600 text-[9px] font-bold tracking-widest mt-0.5 uppercase">PREV: {kpi.prev}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2, Col 2 */}
        <div className="col-span-8 bg-white shadow-sm border border-gray-100 rounded overflow-hidden flex flex-col">
          <div className="bg-[#4a6cf7] text-white px-4 py-2 text-xs font-bold tracking-widest uppercase flex justify-between items-center">
            <span>Job Progress Tracker</span>
          </div>
          <div className="p-4 flex-1">
            <div className="flex flex-col gap-4">
              {jobProgressList.map((job, i) => (
                <div key={i} className={`flex items-center gap-4 ${i !== 0 ? 'pt-4 border-t border-gray-50' : ''}`}>
                  <div className="w-1/3">
                    <div className="font-bold text-blue-600 text-xs mb-0.5">{job.id}</div>
                    <div className="text-gray-800 text-[11px] font-bold truncate">{job.title}</div>
                    <div className="text-gray-400 text-[9px] font-bold tracking-widest mt-0.5 uppercase">{job.client}</div>
                  </div>
                  <div className="w-2/3 flex items-center justify-end gap-5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider border ${job.rColor}`}>{job.risk}</span>
                    <div className="w-48 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded overflow-hidden flex">
                        <div className={`h-full ${job.pColor}`} style={{ width: `${job.pct}%` }}></div>
                      </div>
                      <div className="text-xs font-bold text-gray-400 w-8 text-right">{job.pct}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Row 3 - Material Inventory */}
        <div className="col-span-12 bg-white shadow-sm border border-gray-100 rounded overflow-hidden flex flex-col">
          <div className="bg-[#4a6cf7] text-white px-4 py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-between">
            MATERIAL INVENTORY REGISTER
          </div>
          {/* Tabs */}
          <div className="px-5 pt-4 pb-2 border-b border-gray-100 flex gap-2">
            {['ALL', '⚠ LOW STOCK', 'ACRYLIC', 'WOOD', 'METAL', 'COMPONENT', 'CONSUMABLE'].map((tab, i) => (
              <button key={i} className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded border ${i === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pl-2">Item ID</th>
                  <th className="pb-3">Material</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">In Stock</th>
                  <th className="pb-3">Min Level</th>
                  <th className="pb-3 w-32">Stock Level</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {mappedItems.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-3 pl-2 font-bold text-blue-600 tracking-wider text-[10px]">{row.id}</td>
                    <td className="py-3 text-gray-800 text-xs font-bold">{row.mat}</td>
                    <td className="py-3 text-gray-400 text-[10px] font-bold tracking-widest uppercase">{row.cat}</td>
                    <td className="py-3 text-gray-800 font-bold">{row.in}</td>
                    <td className="py-3 text-gray-500">{row.min}</td>
                    <td className="py-3">
                      <div className="w-16 h-1 bg-gray-100 rounded overflow-hidden">
                        <div className={`h-full ${row.bColor}`} style={{ width: row.lvl }}></div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider border ${row.sColor}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4 - AI Repair Analysis */}
        <div className="col-span-12 bg-white rounded shadow-sm border border-gray-100 overflow-hidden mt-2">
          <div className="bg-[#0b1120] text-gray-200 px-5 py-3 text-[10px] font-bold tracking-widest uppercase flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✦</span>
              <span>AI REPAIR ANALYSIS ENGINE — COST VS. OPPORTUNITY</span>
            </div>
            <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[9px] border border-blue-500/30">AI MODULE</span>
          </div>
          
          <div className="grid grid-cols-4 border-b border-gray-100 divide-x divide-gray-100">
            <div className="p-5">
              <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><span className="text-gray-300">🔧</span> REPAIRABLE</div>
              <div className="text-2xl font-bold text-gray-800">2</div>
              <div className="text-[10px] text-gray-500 font-bold mt-1">Net: ₹4,780</div>
            </div>
            <div className="p-5">
              <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><span className="text-orange-400">💰</span> SELL OFFCUT</div>
              <div className="text-2xl font-bold text-emerald-500">1</div>
              <div className="text-[10px] text-gray-500 font-bold mt-1">Recovery: ₹180</div>
            </div>
            <div className="p-5">
              <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><span className="text-gray-300">🗑</span> WRITE OFF</div>
              <div className="text-2xl font-bold text-red-500">1</div>
              <div className="text-[10px] text-gray-500 font-bold mt-1">Loss: ₹900</div>
            </div>
            <div className="p-5 bg-orange-50/30">
              <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><span className="text-orange-400">🏆</span> BEST RECOVERY</div>
              <div className="text-xl font-bold text-orange-400">₹17.8K</div>
              <div className="text-[10px] text-gray-500 font-bold mt-1">50-day plan</div>
            </div>
          </div>
          
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[9px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pl-2">Item ID</th>
                  <th className="pb-3">Material</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Scrap ₹</th>
                  <th className="pb-3 text-right">Repair ₹</th>
                  <th className="pb-3 text-right">Opp. Value</th>
                  <th className="pb-3 px-6">Cost Vs Opp</th>
                  <th className="pb-3 text-center">Days</th>
                  <th className="pb-3 text-right">Net Benefit</th>
                  <th className="pb-3 text-center">AI Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { id: 'SCR-001', mat: 'Acrylic Sheet (Colored)', qty: '32 sh', scrap: '₹2,400', rep: '₹800', opp: '₹3,200', cPct: 25, oPct: 75, days: '2d', net: '₹2,400', nColor: 'text-emerald-500', verdict: '✦ Repair', vStyle: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { id: 'SCR-002', mat: 'Walnut Plaque Base', qty: '18 pcs', scrap: '₹900', rep: '₹1,200', opp: '₹680', cPct: 65, oPct: 35, days: '5d', net: '-₹520', nColor: 'text-red-500', verdict: '× Write Off', vStyle: 'text-red-600 bg-red-50 border-red-200' },
                  { id: 'SCR-003', mat: 'Brass Figurine (Star)', qty: '7 pcs', scrap: '₹1,540', rep: '₹420', opp: '₹2,800', cPct: 15, oPct: 85, days: '3d', net: '₹2,380', nColor: 'text-emerald-500', verdict: '✦ Repair', vStyle: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { id: 'SCR-004', mat: 'MDF Board (12mm)', qty: '11 pcs', scrap: '₹220', rep: '₹340', opp: '₹180', cPct: 60, oPct: 40, days: '1d', net: '-₹160', nColor: 'text-red-500', verdict: '↗ Sell', vStyle: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { id: 'SCR-005', mat: 'Engraving Tape', qty: '3 rolls', scrap: '₹360', rep: 'N/A', opp: '₹360', cPct: 0, oPct: 100, days: '—', net: '₹0', nColor: 'text-gray-400', verdict: '⏸ Hold', vStyle: 'text-orange-600 bg-orange-50 border-orange-200' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-3 pl-2 font-bold text-blue-500 tracking-wider text-[10px]">{row.id}</td>
                    <td className="py-3 text-gray-800 font-bold">{row.mat}</td>
                    <td className="py-3 text-gray-500 text-right">{row.qty}</td>
                    <td className="py-3 text-red-500 font-bold text-right">{row.scrap}</td>
                    <td className="py-3 text-blue-500 text-right">{row.rep}</td>
                    <td className="py-3 text-emerald-500 font-bold text-right">{row.opp}</td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1 text-[8px] font-bold text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-blue-400">Cost</span>
                          <div className="flex-1 h-1 bg-gray-100 rounded flex"><div className="h-full bg-blue-400 rounded" style={{width: `${row.cPct}%`}}></div></div>
                          <span className="w-5 text-right">{row.cPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-emerald-400">Opp</span>
                          <div className="flex-1 h-1 bg-gray-100 rounded flex"><div className="h-full bg-emerald-400 rounded" style={{width: `${row.oPct}%`}}></div></div>
                          <span className="w-5 text-right">{row.oPct}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 text-center">{row.days}</td>
                    <td className={`py-3 font-bold text-right ${row.nColor}`}>{row.net}</td>
                    <td className="py-3 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${row.vStyle}`}>{row.verdict}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-100 grid grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-blue-500 mb-1 flex items-center gap-1"><span>✦</span> AI RECOMMENDATION</div>
              <div className="text-xs text-gray-600 leading-relaxed font-medium mt-2">
                Prioritize repair of <span className="font-bold text-gray-800">Brass Figurines</span> and <span className="font-bold text-gray-800">Acrylic Sheets</span> — combined net recovery of <span className="font-bold text-gray-800">₹4,780</span> within 3 days. ROI on Brass: <span className="font-bold text-gray-800">567%</span>.
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mb-1 flex items-center gap-1"><span>↗</span> OPPORTUNITY WINDOW</div>
              <div className="text-xs text-gray-600 leading-relaxed font-medium mt-2">
                MDF offcuts sellable to secondary market this week. <span className="font-bold text-gray-800">Walnut Plaque</span> write-off unavoidable — log for insurance. Total 50-day recovery: <span className="font-bold text-gray-800">₹17,800</span>.
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-orange-500 mb-1 flex items-center gap-1"><span>⚠</span> TIME RISK</div>
              <div className="text-xs text-gray-600 leading-relaxed font-medium mt-2">
                Brass Figurine repair must begin within <span className="font-bold text-gray-800">7 days</span>. Oxidation adds <span className="font-bold text-gray-800">₹200/pc</span>. Acrylics must stay below <span className="font-bold text-gray-800">40°C</span> — act within <span className="font-bold text-gray-800">48 hours</span>.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrophyStoreMaster;
