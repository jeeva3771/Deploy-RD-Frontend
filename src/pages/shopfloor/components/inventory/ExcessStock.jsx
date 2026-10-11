import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Scale, Loader2, Calendar, AlertCircle, Warehouse, PackageOpen } from 'lucide-react';
import { axiosInstance } from '../../../../utils/url/config';
import { fetchMaterialReturns, logMaterialReturn } from '../../../../reducer/shopFloorReducer';
import { fetchAllUsers } from '../../../../reducer/userReducer';
import { toast } from 'react-toastify';
import Pagination from './Pagination';

const ExcessStock = ({ isUv, department }) => {
    const dispatch = useDispatch();

    const dept = department || (isUv ? 'Print' : 'Laser');

    // Data lists
    const [excessList, setExcessList] = useState([]);
    const [returnsList, setReturnsList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form Inputs
    const [selectedJob, setSelectedJob] = useState('');
    const [selectedMaterialGroup, setSelectedMaterialGroup] = useState('');
    const [quantity, setQuantity] = useState('');
    const [returnedBy, setReturnedBy] = useState('');
    const [reason, setReason] = useState('');
    const [destination, setDestination] = useState('main_store');

    // Pagination State (Active Excess List)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Pagination State (Returns History List)
    const [historyPage, setHistoryPage] = useState(1);
    const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

    const loadData = useCallback(async () => {
        try {
            // 1. Fetch register logs
            const response = await axiosInstance.get("/inventory-registers/logs");
            if (response.data?.success) {
                setExcessList(response.data.excess_stock || []);
            }

            // 2. Fetch logged returns
            const returnsRes = await dispatch(fetchMaterialReturns({ department: dept })).unwrap();
            if (returnsRes.success) {
                setReturnsList(returnsRes.data || []);
            }

            // 3. Fetch users for dropdown - filtered to department
            const usersRes = await dispatch(fetchAllUsers({ limit: 100, departmentName: dept })).unwrap();
            if (usersRes.data) {
                setUsersList(usersRes.data);
            } else if (usersRes.success && Array.isArray(usersRes.users)) {
                setUsersList(usersRes.users);
            }
        } catch (error) {
            console.error("Failed to load Excess Stock return data:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch, dept]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);

    // Unique Jobs that have remaining excess stock to return
    const uniqueJobs = useMemo(() => {
        const jobsMap = new Map();
        excessList.forEach(item => {
            const key = item.sub_job_no;
            const totalExcess = excessList
                .filter(ex => ex.sub_job_no === item.sub_job_no && ex.group_name === item.group_name)
                .reduce((sum, ex) => sum + (ex.excess_qty || 0), 0);

            const totalReturned = returnsList
                .filter(ret => ret.job_no === item.sub_job_no && ret.material_group === item.group_name && ret.return_type === 'excess')
                .reduce((sum, ret) => sum + (ret.quantity || 0), 0);

            if (totalExcess - totalReturned > 0) {
                if (!jobsMap.has(key)) {
                    jobsMap.set(key, {
                        sub_job_no: item.sub_job_no,
                        label: `Job: ${item.sub_job_no}`
                    });
                }
            }
        });
        return Array.from(jobsMap.values());
    }, [excessList, returnsList]);

    // Available Material Groups for the selected Job that have remaining excess
    const availableMaterialGroups = useMemo(() => {
        if (!selectedJob) return [];
        const groups = new Set();
        excessList
            .filter(item => item.sub_job_no === selectedJob)
            .forEach(item => {
                const totalExcess = excessList
                    .filter(ex => ex.sub_job_no === selectedJob && ex.group_name === item.group_name)
                    .reduce((sum, ex) => sum + (ex.excess_qty || 0), 0);

                const totalReturned = returnsList
                    .filter(ret => ret.job_no === selectedJob && ret.material_group === item.group_name && ret.return_type === 'excess')
                    .reduce((sum, ret) => sum + (ret.quantity || 0), 0);

                if (totalExcess - totalReturned > 0) {
                    groups.add(item.group_name);
                }
            });
        return Array.from(groups);
    }, [selectedJob, excessList, returnsList]);

    // Calculate remaining excess quantity for selected Job and Material Group
    const remainingExcess = useMemo(() => {
        if (!selectedJob || !selectedMaterialGroup) return 0;
        const totalExcess = excessList
            .filter(ex => ex.sub_job_no === selectedJob && ex.group_name === selectedMaterialGroup)
            .reduce((sum, ex) => sum + (ex.excess_qty || 0), 0);

        const totalReturned = returnsList
            .filter(ret => ret.job_no === selectedJob && ret.material_group === selectedMaterialGroup && ret.return_type === 'excess')
            .reduce((sum, ret) => sum + (ret.quantity || 0), 0);

        return Math.max(0, totalExcess - totalReturned);
    }, [selectedJob, selectedMaterialGroup, excessList, returnsList]);

    // Auto-prefill quantity
    useEffect(() => {
        if (selectedJob && selectedMaterialGroup) {
            setQuantity(remainingExcess > 0 ? String(remainingExcess) : '');
        } else {
            setQuantity('');
        }
    }, [selectedJob, selectedMaterialGroup, remainingExcess]);

    const filteredUsers = useMemo(() => {
        if (!usersList) return [];
        const targetDept = dept === 'Print' ? 'print' : 'laser';
        return usersList.filter(user => {
            const role = (user.roleName || user.role?.name || '').toLowerCase();
            const deptName = (user.departmentName || user.department?.name || '').toLowerCase();

            return role.includes(targetDept) || deptName.includes(targetDept);
        });
    }, [usersList, dept]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedJob) {
            toast.warning("Please select a Job");
            return;
        }
        if (!selectedMaterialGroup) {
            toast.warning("Please select a Material Group");
            return;
        }
        if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
            toast.warning("Please enter a valid Quantity");
            return;
        }
        if (Number(quantity) > remainingExcess) {
            toast.warning(`Quantity cannot exceed the remaining excess quantity (${remainingExcess})`);
            return;
        }
        if (!returnedBy) {
            toast.warning("Please select who returned the material");
            return;
        }
        if (!reason || !reason.trim()) {
            toast.warning("Please enter the reason for the return");
            return;
        }

        const payload = {
            return_type: 'excess',
            job_no: selectedJob,
            material_group: selectedMaterialGroup,
            quantity: Number(quantity),
            return_by: returnedBy,
            reason: reason.trim(),
            destination: destination
        };

        setSubmitting(true);
        try {
            const res = await dispatch(logMaterialReturn(payload)).unwrap();
            if (res.success) {
                toast.success(res.message || "Excess material return logged successfully!");

                // Reset form inputs
                setSelectedJob('');
                setSelectedMaterialGroup('');
                setQuantity('');
                setReturnedBy('');
                setReason('');
                setDestination('main_store');

                // Refresh data
                await loadData();
            }
        } catch (error) {
            console.error("Failed to log excess material return:", error);
            toast.error(error.message || "Failed to log excess material return");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Excess Stock...</span>
            </div>
        );
    }

    // Filter returnsList for 'excess' type
    const excessReturnsHistory = returnsList.filter(r => r.return_type === 'excess');

    // Pagination for Excess Stock list
    const totalPages = Math.ceil(excessList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = excessList.slice(startIndex, startIndex + itemsPerPage);

    // Pagination for Returns History
    const historyTotalPages = Math.ceil(excessReturnsHistory.length / historyItemsPerPage);
    const historyStartIndex = (historyPage - 1) * historyItemsPerPage;
    const paginatedHistory = excessReturnsHistory.slice(historyStartIndex, historyStartIndex + historyItemsPerPage);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                        <Scale className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-[1000] text-amber-600 uppercase tracking-widest">EXCESS STOCK — RETURN TO STORES</h3>
                        <p className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest mt-0.5">
                            Jobs where material issued exceeds actual requirement
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-slate-100 rounded-full">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{excessList.length} TOTAL ENTRIES</span>
                </div>
            </div>

            {/* Dynamic Logging Form */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden transition-all duration-300">
                <div className="p-4 border-b border-amber-50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <h4 className="text-[10px] font-[1000] uppercase tracking-widest flex items-center gap-2 text-amber-600">
                        <Scale className="w-3 h-3" /> LOG EXCESS MATERIAL RETURN TO STORES
                    </h4>
                </div>
                <form onSubmit={handleSubmit} className="p-6 bg-slate-50/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        {/* Job No */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">JOB NO.</label>
                            <select
                                value={selectedJob}
                                onChange={(e) => {
                                    setSelectedJob(e.target.value);
                                    setSelectedMaterialGroup('');
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all focus:border-amber-400"
                            >
                                <option value="">Select job...</option>
                                {uniqueJobs.map((job) => (
                                    <option key={job.sub_job_no} value={job.sub_job_no}>
                                        {job.sub_job_no}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Material Group */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MATERIAL GROUP</label>
                            <select
                                value={selectedMaterialGroup}
                                onChange={(e) => setSelectedMaterialGroup(e.target.value)}
                                disabled={!selectedJob}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all disabled:opacity-50 focus:border-amber-400"
                            >
                                <option value="">Select material...</option>
                                {availableMaterialGroups.map((mgName) => (
                                    <option key={mgName} value={mgName}>
                                        {mgName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity (PCS) */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">QTY (PCS)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all focus:border-amber-400"
                            />
                            {selectedJob && selectedMaterialGroup && (
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-1">
                                    Remaining Excess: <span className="font-[1000] text-amber-600">{remainingExcess} pcs</span>
                                </div>
                            )}
                        </div>

                        {/* Returned By */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RETURNED BY</label>
                            <select
                                value={returnedBy}
                                onChange={(e) => setReturnedBy(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all focus:border-amber-400"
                            >
                                <option value="">Select person...</option>
                                {filteredUsers && filteredUsers.map((user) => (
                                    <option key={user._id || user.id} value={user.name}>
                                        {user.name} ({user.roleName || user.role?.name || 'Staff'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Destination */}
                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RETURN DESTINATION</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div
                                    onClick={() => setDestination('main_store')}
                                    className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                        destination === 'main_store'
                                            ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        destination === 'main_store' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        <Warehouse className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-black uppercase text-slate-800 tracking-wide">Return to Main Store</p>
                                        <p className="text-[9px] font-medium text-slate-400 leading-tight">Deduct stock from shop floor, return to central inventory</p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setDestination('local_inventory')}
                                    className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                        destination === 'local_inventory'
                                            ? 'bg-teal-500/10 border-teal-500 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        destination === 'local_inventory' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        <PackageOpen className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-black uppercase text-slate-800 tracking-wide">Retain in Local Shopfloor</p>
                                        <p className="text-[9px] font-medium text-slate-400 leading-tight">Keep material on the shop floor for future jobs</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REASON</label>
                            <input
                                type="text"
                                placeholder="Return of leftover / unused material to main inventory..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all focus:border-amber-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 text-white text-[11px] font-[1000] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 disabled:opacity-75 bg-amber-500 hover:bg-amber-600"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Scale className="w-4 h-4" />
                        )}
                        LOG EXCESS MATERIAL RETURN
                    </button>
                </form>
            </div>

            {/* List of active registered Excess Stocks */}
            {/* <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        REGISTERED EXCESS LEDGER
                    </h3>
                </div>

                {excessList.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.2em]">No excess stock registered ✓</p>
                    </div>
                ) : (
                    paginatedList.map((item, idx) => {
                        const sqin = Math.round((item.excess_sqft || 0) * 144 * 100) / 100;
                        const dateStr = item.timestamp 
                            ? new Date(item.timestamp).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                              })
                            : 'N/A';

                        return (
                            <div 
                                key={item._id || idx} 
                                className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden group hover:border-amber-300 transition-all hover:shadow-md"
                            >
                                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-lg font-[1000] text-amber-600 italic tracking-tight">
                                                {item.group_name || "Unknown Material"}
                                            </h4>
                                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 text-[8px] font-black rounded uppercase tracking-widest">
                                                SUB JOB: {item.sub_job_no || "N/A"}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                            <span className="text-slate-600">
                                                PROCESS: <span className="text-teal-600">{item.process_name || "N/A"}</span>
                                            </span>
                                            <span className="hidden md:inline">•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {dateStr}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex flex-col items-center min-w-[70px]">
                                            <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest">EXCESS QTY</span>
                                            <span className="text-lg font-[1000] text-amber-600">
                                                {item.excess_qty || 0}
                                            </span>
                                        </div>
                                        <div className="px-4 py-2 bg-teal-50 border border-teal-100 rounded-xl flex flex-col items-center min-w-[80px]">
                                            <span className="text-[7px] font-black text-teal-500 uppercase tracking-widest">SQ. INCHES</span>
                                            <span className="text-lg font-[1000] text-teal-600">
                                                {sqin} sqin
                                            </span>
                                        </div>
                                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center min-w-[80px]">
                                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">SQ. FEET</span>
                                            <span className="text-lg font-[1000] text-slate-700">
                                                {item.excess_sqft || 0} sqft
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div> */}

            {/* {excessList.length > 5 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalCount={excessList.length}
                />
            )} */}

            {/* Logged Excess Returns History */}
            <div className="space-y-4 border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Scale className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-[1000] text-slate-800 uppercase tracking-widest">EXCESS RETURN HISTORY</h3>
                            <p className="text-[8px] font-black text-slate-400/80 uppercase tracking-widest mt-0.5">Logged records of excess stock returns to stores.</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{excessReturnsHistory.length} TOTAL RETURNS</span>
                    </div>
                </div>

                {excessReturnsHistory.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">No excess material returns logged yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paginatedHistory.map((log) => (
                            <div
                                key={log._id || log.id}
                                className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden group hover:border-amber-300 transition-all duration-300"
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-md font-[1000] italic tracking-tight uppercase text-amber-600">
                                                RET-{log.id ? log.id.substring(0, 8) : 'LOG'}
                                            </h4>
                                            <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest ${
                                                log.destination === 'local_inventory'
                                                    ? 'bg-teal-100 text-teal-700 border border-teal-200/50'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                            }`}>
                                                {log.destination === 'local_inventory' ? 'Local Inventory' : 'Main Store Return'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[8px] font-black rounded uppercase tracking-widest">
                                                JOB: {log.job_no}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide mt-0.5">
                                            Material Group: {log.material_group} {log.size && `(${log.size})`}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {log.created_at || new Date(log.createdAt).toLocaleString()} · Returned By: {log.return_by}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 border border-amber-100 rounded-lg flex flex-col items-center min-w-[60px] bg-amber-50/50">
                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">QTY</span>
                                            <span className="text-lg font-[1000] text-amber-600">{log.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                                {log.reason && (
                                    <div className="bg-slate-50/50 px-4 py-2.5 border-t border-slate-100 flex items-start gap-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REASON:</span>
                                        <p className="text-[9px] font-semibold text-slate-600 italic">"{log.reason}"</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {excessReturnsHistory.length > 10 && (
                            <Pagination
                                currentPage={historyPage}
                                totalPages={historyTotalPages}
                                onPageChange={setHistoryPage}
                                itemsPerPage={historyItemsPerPage}
                                onItemsPerPageChange={setHistoryItemsPerPage}
                                totalCount={excessReturnsHistory.length}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExcessStock;
