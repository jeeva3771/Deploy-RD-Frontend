import React, { useState } from 'react';
import { X, Package, Box, ArrowRightLeft, TrendingUp, AlertTriangle, Home, Database, Trash2, ArrowDownLeft, ArrowUpRight, Plus, ExternalLink, Factory, RefreshCcw, Undo2, Scale, MinusCircle, PlusCircle, Store, Zap, Mailbox, RefreshCw } from 'lucide-react';

// Import Modular Inventory Components
import StockDashboard from './inventory/StockDashboard';
import InwardGate from './inventory/InwardGate';
import Returns from './inventory/Returns';
import ExcessStock from './inventory/ExcessStock';
import Rejections from './inventory/Rejections';
import Reconcile from './inventory/Reconcile';
import Reprocess from './inventory/Reprocess';
import ExtraMaterial from './inventory/ExtraMaterial';
import Outsource from './inventory/Outsource';
import ShopFloorInventory from './inventory/ShopFloorInventory';

const InventoryPanel = ({ isOpen, onClose, isUv, department, processNames, floor }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    if (!isOpen) return null;

    const dept = department || (isUv ? 'Print' : 'Laser');
    const isAssembly = dept?.toLowerCase()?.includes('assembly');

    const navItems = [
        { id: 'dashboard', label: 'STOCK DASHBOARD', icon: <Box className="w-5 h-5 text-indigo-500" /> },
        { id: 'shopfloor_inventory', label: 'SHOP FLOOR INVENTORY', icon: <Factory className="w-5 h-5 text-teal-600" /> },
        { id: 'inward', label: 'INWARD GATE', icon: <Package className="w-5 h-5 text-amber-600" /> },
        { id: 'returns', label: 'RETURNS', icon: <Undo2 className="w-5 h-5 text-slate-600" /> },
        { id: 'excess', label: 'EXCESS STOCK', icon: <Scale className="w-5 h-5 text-slate-700" /> },
        { id: 'rejections', label: 'REJECTIONS', icon: <MinusCircle className="w-5 h-5 text-rose-500" /> },
        // { id: 'reconcile', label: 'RECONCILE', icon: <Scale className="w-5 h-5 text-slate-700" /> },
        { id: 'reprocess', label: 'REPROCESS REQ', icon: <RefreshCcw className="w-5 h-5 text-blue-500" /> },
        { id: 'extra', label: 'EXTRA MATERIAL', icon: <PlusCircle className="w-5 h-5 text-purple-500" /> },
        ...(!isAssembly ? [{ id: 'outsource', label: 'JOB WORK / OUTSOURCE', icon: <Factory className="w-5 h-5 text-slate-500" /> }] : []),
    ];

    return (
        <div className="fixed inset-0 z-[110] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>

            {/* Panel */}
            <div className="relative w-full max-w-5xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="bg-[#131b2e] w-full">
                    {/* Header Section */}
                    <div className="p-3 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 flex items-center justify-center bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Package className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-[1000] text-white uppercase tracking-tight leading-none italic italic-slanted">{dept} STUDIO — STOCK LEDGER</span>
                                </div>
                                <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mt-1 italic opacity-60">
                                    {dept} STUDIO • INVENTORY & GODOWN LEDGER
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="px-0 mt-1 mx-2 mb-2 border-b border-white/5">
                        <div className="flex items-stretch overflow-x-auto no-scrollbar">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex-1 flex flex-col items-center justify-center min-w-[100px] py-2 gap-0.5 transition-all relative border-r border-white/5 last:border-r-0 ${activeTab === item.id ? 'bg-white rounded-t-xl' : 'text-slate-400 hover:bg-white/5'}`}
                                >
                                    <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-105' : ''}`}>
                                        {activeTab === item.id ? (
                                            <div className="relative">
                                                <div className="relative w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-teal-50 shadow-sm overflow-hidden">
                                                    <div className="w-6 h-6 flex items-center justify-center">
                                                        {React.cloneElement(item.icon, { className: 'w-4 h-4 opacity-80' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                {React.cloneElement(item.icon, { className: 'w-4 h-4 opacity-80' })}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-wider text-center leading-tight max-w-[80px] ${activeTab === item.id ? 'text-teal-600' : 'text-slate-500'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area - Conditional Rendering based on activeTab */}
                <div className="flex-1 bg-[#eef2f7] overflow-y-auto custom-sidebar-scroll scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {activeTab === 'dashboard' ? (
                        <StockDashboard isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'shopfloor_inventory' ? (
                        <ShopFloorInventory isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'inward' ? (
                        <InwardGate isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'returns' ? (
                        <Returns isUv={isUv} department={dept} processNames={processNames} floor={floor} />
                    ) : activeTab === 'excess' ? (
                        <ExcessStock isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'rejections' ? (
                        <Rejections isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'reconcile' ? (
                        <Reconcile isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'reprocess' ? (
                        <Reprocess isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'extra' ? (
                        <ExtraMaterial isUv={isUv} department={dept} processNames={processNames} />
                    ) : activeTab === 'outsource' ? (
                        <Outsource isUv={isUv} department={dept} processNames={processNames} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100 animate-bounce">
                                {navItems.find(i => i.id === activeTab)?.icon}
                            </div>
                            <h2 className="text-xl font-[1000] text-slate-800 uppercase tracking-tight">{navItems.find(i => i.id === activeTab)?.label}</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 italic">Module under development • Industrial Edition</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryPanel;
