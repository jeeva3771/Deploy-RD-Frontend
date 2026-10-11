import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllControlTowerDepts } from '../../../reducer/controlTowerReducer';
import {
  Calendar,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCcw,
  Search,
  X,
  Clock,
  Flag,
  Scissors,
  FileText
} from 'lucide-react';

import HeaderPill from '../components/HeaderPill';
import ActionPill from '../components/ActionPill';

export default function CustomPatternC() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { depts } = useSelector((state) => state.controlTower);

  useEffect(() => {
    if (!depts || depts.length === 0) {
      dispatch(getAllControlTowerDepts());
    }
  }, [dispatch, depts]);

  const currentDept = depts.find(d => {
    const slug = (d.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return location.pathname === `/shopfloor/${slug}`;
  });

  const deptName = currentDept ? currentDept.name : 'Inventory & QC';

  const deptProcesses = currentDept?.processes || [];
  const stats = {
    dateChange: 0,
    dueToday: 0,
    qtyChange: 0,
    onHold: 0,
    escalated: 0
  };

  const [selectedProcess, setSelectedProcess] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState(null);
  const [currentView, setCurrentView] = useState('BOARD'); // 'BOARD' or 'COMPLETED'
  const [syncing, setSyncing] = useState(false);

  return (
    <div className="bg-[#f1f5f9] flex flex-col overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
      {/* Top Navbar */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-[1000] text-slate-800 tracking-wider uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {deptName}
            </span>

            {deptProcesses.length === 1 ? (
              <input
                type="text"
                readOnly
                value={deptProcesses[0].name}
                className="bg-slate-100 text-slate-800 text-[9px] font-[900] uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-1 outline-none shadow-sm cursor-default w-32 text-center"
              />
            ) : (
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="appearance-none bg-white text-slate-800 text-[9px] font-[900] uppercase tracking-widest border-2 border-blue-500/10 rounded-lg px-3 py-1 outline-none focus:border-blue-500/30 shadow-sm cursor-pointer transition-all"
              >
                <option value="All">All Processes</option>
                {deptProcesses.map(p => (
                  <option key={p._id || p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            )}

            <div className="relative mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="SEARCH JOB NO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-[1000] uppercase tracking-widest text-slate-700 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HeaderPill
              label="DATE CHANGE"
              count={stats.dateChange}
              icon={<Calendar className="w-3 h-3" />}
              bgColor="bg-[#fee2e2]"
              borderColor="border-[#ef4444]"
              textColor="text-[#991b1b]"
              isActive={activeHeaderFilter === 'DATE_CHANGE'}
              disabled={stats.dateChange === 0}
              onClick={() => setActiveHeaderFilter('DATE_CHANGE')}
            />
            <HeaderPill
              label="DUE TODAY"
              count={stats.dueToday}
              icon={<AlertCircle className="w-3 h-3" />}
              bgColor="bg-[#dbeafe]"
              borderColor="border-[#3b82f6]"
              textColor="text-[#1e40af]"
              isActive={activeHeaderFilter === 'DUE_TODAY'}
              disabled={stats.dueToday === 0}
              onClick={() => setActiveHeaderFilter('DUE_TODAY')}
            />
            <HeaderPill
              label="QTY CHANGE"
              count={stats.qtyChange}
              icon={<Package className="w-3 h-3" />}
              bgColor="bg-[#f3e8ff]"
              borderColor="border-[#a855f7]"
              textColor="text-[#6b21a8]"
              isActive={activeHeaderFilter === 'QTY_CHANGE'}
              disabled={stats.qtyChange === 0}
              onClick={() => setActiveHeaderFilter('QTY_CHANGE')}
            />
            <HeaderPill
              label="ON HOLD"
              count={stats.onHold}
              icon={<Clock className="w-3 h-3" />}
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              textColor="text-orange-600"
              isActive={activeHeaderFilter === 'ON_HOLD'}
              disabled={stats.onHold === 0}
              onClick={() => setActiveHeaderFilter('ON_HOLD')}
            />
            <HeaderPill
              label="ESCALATED"
              count={stats.escalated}
              icon={<Flag className="w-3 h-3" />}
              bgColor="bg-rose-50"
              borderColor="border-rose-200"
              textColor="text-rose-600"
              isActive={activeHeaderFilter === 'ESCALATED'}
              disabled={stats.escalated === 0}
              onClick={() => setActiveHeaderFilter('ESCALATED')}
            />

            {activeHeaderFilter && (
              <button
                onClick={() => setActiveHeaderFilter(null)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-slate-700 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg animate-in fade-in zoom-in duration-200 whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                SHOW ALL
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-0.5"></div>

          <ActionPill
            icon={<ShoppingCart className="w-3.5 h-3.5 text-slate-100" />}
            label="OUTSOURCE"
            count={0}
            onClick={() => { }}
          />
          <ActionPill icon={<Scissors className="w-3.5 h-3.5 text-green-400" />} label="READY JOBS" onClick={() => { }} />
          <ActionPill icon={<Package className="w-3.5 h-3.5 text-amber-500" />} label="INVENTORY" onClick={() => { }} />
          <ActionPill icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} label="REQUISITION" onClick={() => { }} />
          <ActionPill
            icon={<CheckCircle2 className={`w-3.5 h-3.5 ${currentView === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-600'}`} />}
            label="COMPLETED"
            count={0}
            onClick={() => setCurrentView(currentView === 'COMPLETED' ? 'BOARD' : 'COMPLETED')}
          />

          <button
            onClick={() => setSyncing(false)}
            disabled={syncing}
            className={`flex items-center gap-2 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-all text-[8px] font-black uppercase tracking-widest text-white ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>
    </div>
  );
}