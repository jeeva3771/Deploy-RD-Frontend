import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Factory,
    Search,
    History,
    Layers,
    TrendingUp,
    Activity,
    ClipboardList,
    Clock,
    User,
    ChevronRight,
    X,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2
} from 'lucide-react';
import { axiosInstance } from '../../../../utils/url/config';
import { toast } from 'react-toastify';

const formatSizeLabel = (size) => {
    if (!size) return 'PCS';
    const s = String(size).toLowerCase().trim();
    if (s === 'undefined' || s === 'undefinedxundefined' || s.includes('undefined')) {
        return 'PCS';
    }
    return size;
};

const ShopFloorInventory = ({ isUv, department }) => {
    const dept = department || (isUv ? 'Print' : 'Laser');
    const displayDepartment = dept === 'Print' ? 'UV' : dept;

    const [items, setItems] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal & Detail state
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState('inward'); // 'inward' or 'usage'
    const [showHistorySection, setShowHistorySection] = useState(false); // only load history when clicked
    const [ledgerTab, setLedgerTab] = useState('all'); // 'all', 'inward', 'usage'

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch shop floor inventory items
            const invResponse = await axiosInstance.get(`/shop-floor/inventory?shopfloor_name=${dept}`);
            if (invResponse.data?.success) {
                setItems(invResponse.data.data || []);
            }

            // Fetch current jobs to calculate waiting quantities
            const jobsResponse = await axiosInstance.get('/shop-floor/jobs');
            if (jobsResponse.data?.success) {
                setJobs(jobsResponse.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching shop floor inventory data:", error);
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    }, [dept]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate waiting quantity for a given material
    const calculateWaitingQty = useCallback((itemName) => {
        let waitingQty = 0;
        const normName = itemName?.toLowerCase().trim();

        jobs.forEach(job => {
            if (job.status !== 'Completed' && job.status !== 'Cancelled') {
                job.material_groups?.forEach(group => {
                    group.materials?.forEach(mat => {
                        if (mat.material_name?.toLowerCase().trim() === normName) {
                            const groupInwarded = group.inward_history?.reduce((acc, inv) => acc + (inv.inspect_qty || 0), 0) || 0;
                            const groupPlanned = group.bom_inhouse_qty || group.inhouse_qty || 0;
                            const remaining = Math.max(0, groupPlanned - groupInwarded);
                            waitingQty += remaining;
                        }
                    });
                });
            }
        });
        return waitingQty;
    }, [jobs]);

    // Filtered items list
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item.name?.toLowerCase().includes(query) ||
                item.item_code?.toLowerCase().includes(query)
            );
        });
    }, [items, searchQuery]);

    // Overall metrics
    const stats = useMemo(() => {
        const totalItems = items.length;
        const totalStockUnits = items.reduce((acc, item) => acc + (item.stock || 0), 0);

        const totalStockValue = items.reduce((acc, item) => {
            if (item.item_type === 'sheet') {
                // If we have size_wise_stock, calculate cost based on size dimensions * rate
                if (item.size_wise_stock && item.size_wise_stock.length > 0) {
                    const sheetVal = item.size_wise_stock.reduce((sum, szStock) => {
                        const count = szStock.count || 0;
                        if (count <= 0) return sum;
                        const matchedSz = item.stock_sizes?.find(s => s._id === szStock.size_id || s === szStock.size_id);
                        let width = Number(matchedSz?.width || 0);
                        let height = Number(matchedSz?.height || 0);
                        if (width === 0 || height === 0) {
                            const dims = (matchedSz?.size || '0x0').toLowerCase().split('x').map(Number);
                            if (dims.length >= 2 && !isNaN(dims[0]) && !isNaN(dims[1])) {
                                width = dims[0];
                                height = dims[1];
                            }
                        }
                        return sum + (count * width * height * Number(item.cost || 0));
                    }, 0);
                    return acc + sheetVal;
                }

                // Fallback: If size_wise_stock is not set/available but we have overall stock
                if (item.stock > 0 && item.stock_sizes && item.stock_sizes.length > 0) {
                    const firstSz = item.stock_sizes[0];
                    let width = Number(firstSz?.width || 0);
                    let height = Number(firstSz?.height || 0);
                    if (width === 0 || height === 0) {
                        const dims = (firstSz?.size || '0x0').toLowerCase().split('x').map(Number);
                        if (dims.length >= 2 && !isNaN(dims[0]) && !isNaN(dims[1])) {
                            width = dims[0];
                            height = dims[1];
                        }
                    }
                    return acc + (item.stock * width * height * Number(item.cost || 0));
                }

                // Absolute fallback
                return acc + ((item.stock || 0) * Number(item.cost || 0));
            } else {
                // Non-sheet materials calculate value as stock * cost
                return acc + ((item.stock || 0) * Number(item.cost || 0));
            }
        }, 0);

        return { totalItems, totalStockUnits, totalStockValue };
    }, [items]);

    // Compile department overall history
    const overallHistory = useMemo(() => {
        let list = [];

        items.forEach(item => {
            // Process Inwards
            item.inward_history?.forEach(history => {
                list.push({
                    ...history,
                    item_name: item.name,
                    item_code: item.item_code,
                    type: 'INWARD',
                    date: history.issued_at || history.requested_at
                });
            });
            // Process Usage
            item.usage_history?.forEach(history => {
                list.push({
                    ...history,
                    item_name: item.name,
                    item_code: item.item_code,
                    type: 'USAGE',
                    date: history.recorded_at
                });
            });
        });

        // Sort by date desc
        return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [items]);

    const filteredLedgerHistory = useMemo(() => {
        if (ledgerTab === 'all') return overallHistory;
        return overallHistory.filter(h => h.type === ledgerTab.toUpperCase());
    }, [overallHistory, ledgerTab]);

    // Item detail metrics calculation
    const detailMetrics = useMemo(() => {
        if (!selectedItem) return { inwarded: 0, used: 0, waiting: 0 };
        const inwarded = selectedItem.inward_history?.reduce((acc, h) => acc + (h.qty || 0), 0) || 0;
        const used = selectedItem.usage_history?.reduce((acc, h) => acc + (h.qty || 0), 0) || 0;
        const waiting = calculateWaitingQty(selectedItem.name);
        return { inwarded, used, waiting };
    }, [selectedItem, calculateWaitingQty]);

    const handleOpenItem = (item) => {
        setSelectedItem(item);
        setShowHistorySection(false); // Reset history section visibility
        setShowDetailModal(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-inner">
                        <Factory className="w-5 h-5 text-teal-600 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-[1000] text-slate-800 uppercase tracking-tight">SHOP FLOOR INVENTORY</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            {displayDepartment} Department Ledger • Real-time Tracking
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 border border-slate-900"
                    >
                        <History className="w-4 h-4 text-teal-400" />
                        Overall History
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95"
                        title="Refresh"
                    >
                        <Activity className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Items</span>
                        <span className="text-2xl font-[1000] text-slate-800 leading-none">{stats.totalItems}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Stock Units</span>
                        <span className="text-2xl font-[1000] text-slate-800 leading-none">{stats.totalStockUnits}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <span className="text-xl font-[1000] leading-none">₹</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Stock Value</span>
                        <span className="text-2xl font-[1000] text-slate-800 leading-none">₹{Number(stats.totalStockValue || 0).toFixed(0)}</span>
                    </div>
                </div>
            </div>

            {/* Search and List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 max-w-md w-full focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all duration-200">
                    <Search className="w-4 h-4 text-slate-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Search items by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-xs text-slate-700 outline-none w-full font-bold placeholder-slate-400"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading ledger items...</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center bg-white flex flex-col items-center justify-center max-w-md mx-auto">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">No Items in Shop Floor</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs leading-relaxed">
                            No materials have been inwarded to this shop floor yet, or no items match your search.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-3xl border border-slate-200/80">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="py-4 px-6">Item Code</th>
                                    <th className="py-4 px-6">Item Name</th>
                                    <th className="py-4 px-6">Stock Type</th>
                                    <th className="py-4 px-6 text-center">On-Hand Stock</th>

                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                {filteredItems.map(item => {
                                    const waiting = calculateWaitingQty(item.name);
                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-4 px-6 font-mono text-[10px] text-slate-500 uppercase">{item.item_code}</td>
                                            <td className="py-4 px-6">
                                                <div className="font-[900] text-slate-800">{item.name}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.item_type === 'sheet'
                                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                    : 'bg-teal-50 text-teal-600 border border-teal-100'
                                                    }`}>
                                                    {item.item_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`text-sm font-[1000] italic ${item.stock <= 0 ? 'text-rose-500' : 'text-slate-800'
                                                    }`}>
                                                    {item.stock}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleOpenItem(item)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-600 border border-slate-200 hover:border-teal-200 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider"
                                                >
                                                    View Details
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ITEM DETAIL MODAL */}
            {showDetailModal && selectedItem && (
                <div className="fixed inset-0 flex justify-end" style={{ zIndex: 120 }}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
                    <div className="relative w-full max-w-2xl h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="bg-[#131b2e] text-white p-6 relative overflow-hidden flex-none">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.2em] block mb-1">
                                        {selectedItem.item_code} · {selectedItem.item_type}
                                    </span>
                                    <h4 className="text-base font-[1000] tracking-tight text-white leading-snug">
                                        {selectedItem.name}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all border border-white/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Metrics Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Received</span>
                                    <span className="text-base font-[1000] text-emerald-600 italic">{detailMetrics.inwarded}</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Consumed</span>
                                    <span className="text-base font-[1000] text-rose-500 italic">{detailMetrics.used}</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">On Hand</span>
                                    <span className="text-base font-[1000] text-slate-800 italic">{selectedItem.stock}</span>
                                </div>

                            </div>

                            {/* Size-wise Stock Breakdown (For Sheet materials) */}
                            {selectedItem.item_type === 'sheet' && (
                                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <span>📏</span> Size-wise Stock Breakdown
                                    </h5>
                                    {selectedItem.size_wise_stock?.length === 0 ? (
                                        <p className="text-[10px] font-bold text-slate-400 italic">No sized stock logged yet.</p>
                                    ) : (
                                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                            <table className="w-full text-left text-[11px] font-bold text-slate-700">
                                                <thead>
                                                    <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                        <th className="py-2.5 px-4">Size Name</th>
                                                        <th className="py-2.5 px-4 text-right">Available Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedItem.size_wise_stock?.map((szStock, sIdx) => {
                                                        const matchedSz = selectedItem.stock_sizes?.find(s => s._id === szStock.size_id || s === szStock.size_id);
                                                        let sizeLabel = 'Standard';
                                                        if (matchedSz) {
                                                            if (matchedSz.size) {
                                                                sizeLabel = matchedSz.size;
                                                            } else if (matchedSz.width !== undefined && matchedSz.height !== undefined) {
                                                                sizeLabel = `${matchedSz.width}x${matchedSz.height}`;
                                                            }
                                                        }
                                                        const finalSizeLabel = formatSizeLabel(sizeLabel);
                                                        return (
                                                            <tr key={sIdx} className="hover:bg-slate-50/50">
                                                                <td className="py-2.5 px-4 font-mono">{finalSizeLabel}</td>
                                                                <td className="py-2.5 px-4 text-right font-[1000] text-slate-800">{szStock.count} sheets</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transaction History Trigger & Section */}
                            <div className="space-y-4">
                                {!showHistorySection ? (
                                    <div className="text-center pt-4">
                                        <button
                                            onClick={() => setShowHistorySection(true)}
                                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                        >
                                            <History className="w-4 h-4 text-teal-400" />
                                            Load Transaction Logs
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4">
                                        <div className="flex border-b border-slate-100">
                                            <button
                                                onClick={() => setActiveHistoryTab('inward')}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all ${activeHistoryTab === 'inward'
                                                    ? 'border-b-2 border-teal-500 text-teal-600'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                Inward History
                                            </button>
                                            <button
                                                onClick={() => setActiveHistoryTab('usage')}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all ${activeHistoryTab === 'usage'
                                                    ? 'border-b-2 border-teal-500 text-teal-600'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                Usage History
                                            </button>
                                        </div>

                                        {activeHistoryTab === 'inward' ? (
                                            <div className="space-y-3">
                                                {selectedItem.inward_history?.length === 0 ? (
                                                    <p className="text-[10px] font-bold text-slate-400 italic py-6 text-center">No inward records found.</p>
                                                ) : (
                                                    selectedItem.inward_history.map((h, hIdx) => (
                                                        <div key={hIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-[11px] font-bold text-slate-700">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">REQ:</span>
                                                                    <span className="font-mono text-slate-800">{h.requisition_no || 'Manual'}</span>
                                                                </div>
                                                                <p className="text-[9px] text-slate-400">
                                                                    By {h.requested_by} • Issued by {h.issued_by || 'System'}
                                                                </p>
                                                                <p className="text-[8px] text-slate-400 font-medium">
                                                                    {h.issued_at || h.requested_at}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs font-[1000] text-emerald-600">+{h.qty}</span>
                                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                                                    {formatSizeLabel(h.size)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedItem.usage_history?.length === 0 ? (
                                                    <p className="text-[10px] font-bold text-slate-400 italic py-6 text-center">No usage records found.</p>
                                                ) : (
                                                    selectedItem.usage_history.map((h, hIdx) => (
                                                        <div key={hIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-[11px] font-bold text-slate-700">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">JOB:</span>
                                                                    <span className="font-mono text-slate-800">{h.sub_job_no || h.job_no}</span>
                                                                </div>
                                                                <p className="text-[9px] text-slate-400">
                                                                    Operator: {h.operator_name || 'System'}
                                                                </p>
                                                                <p className="text-[8px] text-slate-400 font-medium">
                                                                    {h.recorded_at}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs font-[1000] text-rose-500">-{h.qty}</span>
                                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                                                    {formatSizeLabel(h.size)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERALL HISTORY MODAL */}
            {showHistoryModal && (
                <div className="fixed inset-0 flex justify-end" style={{ zIndex: 120 }}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
                    <div className="relative w-full max-w-2xl h-full bg-[#f8fafc] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="bg-[#131b2e] text-white p-6 relative overflow-hidden flex-none">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.2em] block mb-1">
                                        {displayDepartment} Department Ledger
                                    </span>
                                    <div className="text-base font-[1000] tracking-tight text-white leading-snug uppercase" style={{ color: '#ffffff' }}>
                                        Unified Transaction Timeline
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all border border-white/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="bg-white border-b border-slate-200 px-6 flex flex-none">
                            <button
                                onClick={() => setLedgerTab('all')}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider text-center transition-all ${ledgerTab === 'all'
                                    ? 'border-b-2 border-teal-500 text-teal-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                All History
                            </button>
                            <button
                                onClick={() => setLedgerTab('inward')}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider text-center transition-all ${ledgerTab === 'inward'
                                    ? 'border-b-2 border-teal-500 text-teal-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Inward History
                            </button>
                            <button
                                onClick={() => setLedgerTab('usage')}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider text-center transition-all ${ledgerTab === 'usage'
                                    ? 'border-b-2 border-teal-500 text-teal-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Usage History
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {filteredLedgerHistory.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No transaction logs available</span>
                                </div>
                            ) : (
                                filteredLedgerHistory.map((h, idx) => {
                                    const isInward = h.type === 'INWARD';
                                    return (
                                        <div
                                            key={idx}
                                            className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-all text-xs font-bold text-slate-700"
                                        >
                                            <div className="flex gap-3 items-start">
                                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${isInward
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-rose-50 text-rose-500 border-rose-100'
                                                    }`}>
                                                    {isInward ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="font-[900] text-slate-800">{h.item_name}</div>
                                                    <div className="flex items-center gap-2 text-[9px] text-slate-400">
                                                        <span className="font-mono uppercase">{h.item_code}</span>
                                                        <span>•</span>
                                                        <span>{isInward ? `Requisition: ${h.requisition_no || 'Manual'}` : `Job: ${h.sub_job_no || h.job_no}`}</span>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 leading-tight">
                                                        {isInward ? `Requested by ${h.requested_by} • Issued by ${h.issued_by || 'System'}` : `Processed by ${h.operator_name || 'Operator'}`}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-[8px] text-slate-400 font-medium mt-1">
                                                        <Clock className="w-3 h-3 text-slate-300" />
                                                        {h.date}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-sm font-[1000] italic ${isInward ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {isInward ? '+' : '-'}{h.qty}
                                                </span>
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                                    {formatSizeLabel(h.size)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopFloorInventory;
