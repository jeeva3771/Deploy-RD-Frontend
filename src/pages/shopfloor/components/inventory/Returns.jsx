import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Scale, Loader2, AlertCircle } from 'lucide-react';
import { fetchMaterialReturns, logMaterialReturn, fetchInwardLogs } from '../../../../reducer/shopFloorReducer';
import { fetchAllUsers } from '../../../../reducer/userReducer';
import { toast } from 'react-toastify';
import Pagination from './Pagination';

const Returns = ({ isUv, department, processNames, floor }) => {
    const dispatch = useDispatch();

    const dept = department || (isUv ? 'Print' : 'Laser');

    // Component State
    const [returnsList, setReturnsList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [inwardLogsList, setInwardLogsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Active Return Type Tab ("defective" or "wrong_material")
    const [activeReturnType, setActiveReturnType] = useState('defective');

    // Form Inputs
    const [selectedJobId, setSelectedJobId] = useState('');
    const [selectedMaterialGroup, setSelectedMaterialGroup] = useState('');
    const [quantity, setQuantity] = useState('');
    const [returnedBy, setReturnedBy] = useState('');
    const [reason, setReason] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch logged returns
                const returnsRes = await dispatch(fetchMaterialReturns({ department: dept })).unwrap();
                if (returnsRes.success) {
                    setReturnsList(returnsRes.data || []);
                }

                // Fetch inward logs for dropdown
                const logsParams = { bad_qty: 'true' };
                if (processNames) {
                    logsParams.process_name = processNames;
                } else {
                    logsParams.department = dept;
                }
                const logsRes = await dispatch(fetchInwardLogs(logsParams)).unwrap();
                if (logsRes.success) {
                    setInwardLogsList(logsRes.data || []);
                }

                // Fetch users for RETURNED BY select
                const usersRes = await dispatch(fetchAllUsers({ limit: 100 })).unwrap();
                let fetchedUsers = [];
                if (usersRes.data) {
                    fetchedUsers = usersRes.data;
                } else if (usersRes.success && Array.isArray(usersRes.users)) {
                    fetchedUsers = usersRes.users;
                }

                // Filter users based on floor config (if dynamic) or department defaults
                let filteredUsers = [];
                if (floor) {
                    const floorRoles = [
                        ...(floor.operators || []).map(o => String(o.name || o || '').toLowerCase()),
                        ...(floor.supervisors || []).map(s => String(s.name || s || '').toLowerCase())
                    ].filter(Boolean);
                    filteredUsers = fetchedUsers.filter(user => {
                        const roleName = String(user.roleName || user.role?.name || '').toLowerCase();
                        return floorRoles.includes(roleName);
                    });
                } else {
                    filteredUsers = fetchedUsers.filter(user => {
                        const roleName = (user.roleName || user.role?.name || '').toLowerCase();
                        const deptName = (user.department?.name || user.departmentName || '').toLowerCase();

                        if (dept === 'Print') {
                            return roleName.includes('uv printing operator') ||
                                roleName.includes('uv printing head') ||
                                deptName.includes('uv printing');
                        } else {
                            return roleName.includes('laser cutting operator') ||
                                roleName.includes('laser cutting head') ||
                                deptName.includes('laser');
                        }
                    });
                }

                setUsersList(filteredUsers);
            } catch (error) {
                console.error("Failed to load initial data for Returns page:", error);
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [dispatch, dept, floor, processNames]);

    const uniqueJobs = useMemo(() => {
        const jobsMap = new Map();

        inwardLogsList.forEach(log => {
            const jobId = log.job_id?._id || log.job_id;
            const jobNoStr = log.sub_job_no ? `${log.job_no}/${log.sub_job_no}` : log.job_no;
            const material_group = log.material_name;

            const totalBadInwarded = inwardLogsList
                .filter(l => String(l.job_id?._id || l.job_id) === String(jobId) && l.material_name === material_group)
                .reduce((acc, l) => acc + (l.bad_qty || 0), 0);

            const totalReturned = returnsList
                .filter(ret => {
                    const matchId = ret.shop_floor_job_id === jobId;
                    const matchStr = ret.job_no?.toLowerCase() === jobNoStr.toLowerCase();
                    return (matchId || matchStr) && ret.material_group === material_group;
                })
                .reduce((acc, ret) => acc + (ret.quantity || 0), 0);

            if (totalBadInwarded - totalReturned > 0) {
                if (!jobsMap.has(jobId)) {
                    jobsMap.set(jobId, {
                        _id: jobId,
                        job_no: log.job_no,
                        sub_job_no: log.sub_job_no,
                        client_name: log.job_id?.client_name || '',
                        jobNoStr: jobNoStr
                    });
                }
            }
        });

        return Array.from(jobsMap.values());
    }, [inwardLogsList, returnsList]);

    // Automatically prefill remaining bad quantity when job and material group are selected
    useEffect(() => {
        if (selectedJobId && selectedMaterialGroup) {
            const selectedJob = uniqueJobs.find(j => j._id === selectedJobId);
            const jobNoStr = selectedJob ? selectedJob.jobNoStr : '';

            const totalBadInwarded = inwardLogsList
                .filter(log => String(log.job_id?._id || log.job_id) === String(selectedJobId) && log.material_name === selectedMaterialGroup)
                .reduce((acc, log) => acc + (log.bad_qty || 0), 0);

            const totalReturned = returnsList
                .filter(ret => {
                    const matchId = ret.shop_floor_job_id === selectedJobId;
                    const matchStr = ret.job_no?.toLowerCase() === jobNoStr.toLowerCase();
                    return (matchId || matchStr) && ret.material_group === selectedMaterialGroup;
                })
                .reduce((acc, ret) => acc + (ret.quantity || 0), 0);

            const remainingBad = Math.max(0, totalBadInwarded - totalReturned);

            // Prefill with the remaining bad quantity (if > 0, set it, otherwise set to '' or 0)
            setQuantity(remainingBad > 0 ? String(remainingBad) : '');
        } else {
            setQuantity('');
        }
    }, [selectedJobId, selectedMaterialGroup, inwardLogsList, returnsList, uniqueJobs]);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedJobId) {
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
        if (!returnedBy) {
            toast.warning("Please select who returned the material");
            return;
        }
        if (!reason || !reason.trim()) {
            toast.warning("Please enter the reason for the return");
            return;
        }

        const selectedJob = uniqueJobs.find(j => j._id === selectedJobId);
        const jobNoStr = selectedJob ? selectedJob.jobNoStr : selectedJobId;

        const totalBadInwarded = inwardLogsList
            .filter(log => String(log.job_id?._id || log.job_id) === String(selectedJobId) && log.material_name === selectedMaterialGroup)
            .reduce((acc, log) => acc + (log.bad_qty || 0), 0);

        const totalReturned = returnsList
            .filter(ret => {
                const matchId = ret.shop_floor_job_id === selectedJobId;
                const matchStr = ret.job_no?.toLowerCase() === jobNoStr.toLowerCase();
                return (matchId || matchStr) && ret.material_group === selectedMaterialGroup;
            })
            .reduce((acc, ret) => acc + (ret.quantity || 0), 0);

        const remainingBad = Math.max(0, totalBadInwarded - totalReturned);

        if (Number(quantity) > remainingBad) {
            toast.warning(`Quantity cannot exceed the remaining bad inwarded ${dept === 'Print' ? 'pieces' : 'sheets'} (${remainingBad})`);
            return;
        }

        const payload = {
            return_type: activeReturnType,
            job_no: jobNoStr,
            shop_floor_job_id: selectedJobId,
            material_group: selectedMaterialGroup,
            quantity: Number(quantity),
            return_by: returnedBy,
            reason: reason.trim()
        };

        setSubmitting(true);
        try {
            const res = await dispatch(logMaterialReturn(payload)).unwrap();
            if (res.success) {
                toast.success(res.message || "Material return logged successfully!");

                // Reset form inputs
                setSelectedJobId('');
                setSelectedMaterialGroup('');
                setQuantity('');
                setReturnedBy('');
                setReason('');

                // Refresh list of returns
                const returnsRes = await dispatch(fetchMaterialReturns({ department: dept })).unwrap();
                if (returnsRes.success) {
                    setReturnsList(returnsRes.data || []);
                }

                // Refresh inward logs to update dropdown options
                const logsParams = { bad_qty: 'true' };
                if (processNames) {
                    logsParams.process_name = processNames;
                } else {
                    logsParams.department = dept;
                }
                const logsRes = await dispatch(fetchInwardLogs(logsParams)).unwrap();
                if (logsRes.success) {
                    setInwardLogsList(logsRes.data || []);
                }

                setCurrentPage(1); // Go back to page 1 to see the new entry
            }
        } catch (error) {
            console.error("Failed to log material return:", error);
            toast.error(error.message || "Failed to log material return");
        } finally {
            setSubmitting(false);
        }
    };

    // Derived states
    const selectedJobObj = uniqueJobs.find(j => j._id === selectedJobId);

    const availableMaterialGroups = Array.from(
        new Set(
            inwardLogsList
                .filter(log => String(log.job_id?._id || log.job_id) === String(selectedJobId))
                .map(log => log.material_name)
        )
    ).filter(material_group => {
        const jobNoStr = selectedJobObj ? selectedJobObj.jobNoStr : '';
        const totalBadInwarded = inwardLogsList
            .filter(log => String(log.job_id?._id || log.job_id) === String(selectedJobId) && log.material_name === material_group)
            .reduce((acc, log) => acc + (log.bad_qty || 0), 0);
        const totalReturned = returnsList
            .filter(ret => {
                const matchId = ret.shop_floor_job_id === selectedJobId;
                const matchStr = ret.job_no?.toLowerCase() === jobNoStr.toLowerCase();
                return (matchId || matchStr) && ret.material_group === material_group;
            })
            .reduce((acc, ret) => acc + (ret.quantity || 0), 0);
        return totalBadInwarded - totalReturned > 0;
    });

    // Extract dynamic counts for the top cards
    const defectiveCount = returnsList.filter(r => r.return_type === 'defective').length;
    const wrongCount = returnsList.filter(r => r.return_type === 'wrong_material').length;

    // Filter returns list based on active return type tab
    const filteredReturnsList = returnsList.filter(r => r.return_type === activeReturnType);
    const totalPages = Math.ceil(filteredReturnsList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReturns = filteredReturnsList.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Returns Records...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Top Cards for selecting return type */}
            <div className="grid grid-cols-2 gap-4">
                {/* Defective card */}
                <div
                    onClick={() => { setActiveReturnType('defective'); setCurrentPage(1); }}
                    className={`rounded-2xl p-6 text-center border shadow-lg relative overflow-hidden group transition-all duration-300 cursor-pointer ${activeReturnType === 'defective'
                            ? 'bg-rose-500 text-white border-rose-600 scale-[1.02] ring-4 ring-rose-500/20'
                            : 'bg-white text-slate-800 border-rose-200 hover:border-rose-400 hover:shadow-md'
                        }`}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/20 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform"></div>
                    <div className="flex flex-col items-center relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${activeReturnType === 'defective' ? 'bg-white/20' : 'bg-rose-50'
                            }`}>
                            <X className={`w-6 h-6 ${activeReturnType === 'defective' ? 'text-rose-100' : 'text-rose-500'}`} />
                        </div>
                        <h4 className={`text-[11px] font-[1000] uppercase tracking-[0.2em] mb-1 ${activeReturnType === 'defective' ? 'text-white' : 'text-rose-600'
                            }`}>DEFECTIVE MATERIAL</h4>
                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 mb-3 ${activeReturnType === 'defective' ? 'text-white/80' : 'text-slate-400'
                            }`}>Damaged on receipt</p>
                        <span className="text-4xl font-black tracking-tighter leading-none">{defectiveCount}</span>
                    </div>
                </div>

                {/* Wrong Material card */}
                <div
                    onClick={() => { setActiveReturnType('wrong_material'); setCurrentPage(1); }}
                    className={`rounded-2xl p-6 text-center border shadow-lg relative overflow-hidden group transition-all duration-300 cursor-pointer ${activeReturnType === 'wrong_material'
                            ? 'bg-amber-500 text-white border-amber-600 scale-[1.02] ring-4 ring-amber-500/20'
                            : 'bg-white text-slate-800 border-amber-200 hover:border-amber-400 hover:shadow-md'
                        }`}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/20 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform"></div>
                    <div className="flex flex-col items-center relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${activeReturnType === 'wrong_material' ? 'bg-white/20' : 'bg-rose-50'
                            }`}>
                            <X className={`w-6 h-6 ${activeReturnType === 'wrong_material' ? 'text-amber-100' : 'text-amber-500'}`} />
                        </div>
                        <h4 className={`text-[11px] font-[1000] uppercase tracking-[0.2em] mb-1 ${activeReturnType === 'wrong_material' ? 'text-white' : 'text-amber-600'
                            }`}>WRONG MATERIAL</h4>
                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 mb-3 ${activeReturnType === 'wrong_material' ? 'text-white/80' : 'text-slate-400'
                            }`}>Incorrect size / grade</p>
                        <span className="text-4xl font-black tracking-tighter leading-none">{wrongCount}</span>
                    </div>
                </div>
            </div>

            {/* Dynamic Logging Form */}
            <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${activeReturnType === 'defective' ? 'border-rose-100' : 'border-amber-100'
                }`}>
                <div className={`p-4 border-b flex items-center gap-2 ${activeReturnType === 'defective' ? 'border-rose-50' : 'border-amber-50'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeReturnType === 'defective' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}></div>
                    <h4 className={`text-[10px] font-[1000] uppercase tracking-widest flex items-center gap-2 ${activeReturnType === 'defective' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                        <Scale className="w-3 h-3" /> LOG {activeReturnType === 'defective' ? 'DEFECTIVE' : 'WRONG MATERIAL'} RETURN
                    </h4>
                </div>
                <form onSubmit={handleSubmit} className="p-6 bg-slate-50/30">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Job No */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">JOB NO.</label>
                            <select
                                value={selectedJobId}
                                onChange={(e) => {
                                    setSelectedJobId(e.target.value);
                                    setSelectedMaterialGroup('');
                                }}
                                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all ${activeReturnType === 'defective' ? 'focus:border-rose-400' : 'focus:border-amber-400'
                                    }`}
                            >
                                <option value="">Select job...</option>
                                {uniqueJobs.map((job) => (
                                    <option key={job._id} value={job._id}>
                                        {job.job_no}/{job.sub_job_no} ({job.client_name?.substring(0, 15)})
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
                                disabled={!selectedJobId}
                                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all disabled:opacity-50 ${activeReturnType === 'defective' ? 'focus:border-rose-400' : 'focus:border-amber-400'
                                    }`}
                            >
                                <option value="">Select material...</option>
                                {availableMaterialGroups.map((mgName) => (
                                    <option key={mgName} value={mgName}>
                                        {mgName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">QTY (PCS)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all ${activeReturnType === 'defective' ? 'focus:border-rose-400' : 'focus:border-amber-400'
                                    }`}
                            />
                            {selectedJobId && selectedMaterialGroup && (
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-1">
                                    {isUv ? 'Inward Bad Pieces Remaining: ' : 'Inward Bad Sheets Remaining: '}<span className="font-[1000] text-rose-500">{(() => {
                                        const selectedJob = uniqueJobs.find(j => j._id === selectedJobId);
                                        const jobNoStr = selectedJob ? selectedJob.jobNoStr : '';
                                        const totalBadInwarded = inwardLogsList
                                            .filter(log => String(log.job_id?._id || log.job_id) === String(selectedJobId) && log.material_name === selectedMaterialGroup)
                                            .reduce((acc, log) => acc + (log.bad_qty || 0), 0);
                                        const totalReturned = returnsList
                                            .filter(ret => {
                                                const matchId = ret.shop_floor_job_id === selectedJobId;
                                                const matchStr = ret.job_no?.toLowerCase() === jobNoStr.toLowerCase();
                                                return (matchId || matchStr) && ret.material_group === selectedMaterialGroup;
                                            })
                                            .reduce((acc, ret) => acc + (ret.quantity || 0), 0);
                                        return Math.max(0, totalBadInwarded - totalReturned);
                                    })()}{isUv ? ' pcs' : ' sh'}</span>
                                </div>
                            )}
                        </div>

                        {/* Returned By */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RETURNED BY</label>
                            <select
                                value={returnedBy}
                                onChange={(e) => setReturnedBy(e.target.value)}
                                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all ${activeReturnType === 'defective' ? 'focus:border-rose-400' : 'focus:border-amber-400'
                                    }`}
                            >
                                <option value="">Select person...</option>
                                {usersList && usersList.map((user) => (
                                    <option key={user._id || user.id} value={user.name}>
                                        {user.name} ({user.roleName || user.role?.name || 'Staff'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reason */}
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REASON</label>
                            <input
                                type="text"
                                placeholder={activeReturnType === 'defective' ? "Nature of defect..." : "Incorrect size / grade..."}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-800 uppercase outline-none transition-all ${activeReturnType === 'defective' ? 'focus:border-rose-400' : 'focus:border-amber-400'
                                    }`}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-4 text-white text-[11px] font-[1000] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 disabled:opacity-75 ${activeReturnType === 'defective'
                                ? 'bg-rose-500 hover:bg-rose-600'
                                : 'bg-amber-500 hover:bg-amber-600'
                            }`}
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Scale className="w-4 h-4" />
                        )}
                        LOG {activeReturnType === 'defective' ? 'DEFECTIVE' : 'WRONG MATERIAL'} RETURN
                    </button>
                </form>
            </div>

            {/* Logged Returns History List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Scale className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-[1000] text-slate-800 uppercase tracking-widest">MATERIAL RETURN HISTORY</h3>
                            <p className="text-[8px] font-black text-slate-400/80 uppercase tracking-widest mt-0.5">Logged records of shop floor material returns.</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{filteredReturnsList.length} {activeReturnType === 'defective' ? 'DEFECTIVE' : 'WRONG MAT.'} RETURNS</span>
                    </div>
                </div>

                {filteredReturnsList.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">No {activeReturnType === 'defective' ? 'defective' : 'wrong material'} returns logged yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paginatedReturns.map((log) => (
                            <div
                                key={log._id || log.id}
                                className={`bg-white rounded-2xl shadow-sm border overflow-hidden group transition-all duration-300 ${log.return_type === 'defective'
                                        ? 'border-rose-100 hover:border-rose-300'
                                        : 'border-amber-100 hover:border-amber-300'
                                    }`}
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-md font-[1000] italic tracking-tight uppercase ${log.return_type === 'defective' ? 'text-rose-600' : 'text-amber-600'
                                                }`}>
                                                RET-{log.id ? log.id.substring(0, 8) : 'LOG'}
                                            </h4>
                                            <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest ${log.return_type === 'defective'
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {log.return_type === 'defective' ? 'Defective' : 'Wrong Mat.'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[8px] font-black rounded uppercase tracking-widest">
                                                JOB: {log.job_no}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide mt-0.5">
                                            Group: {log.material_group}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {log.created_at || new Date(log.createdAt).toLocaleString()} · Returned By: {log.return_by}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-2 border rounded-lg flex flex-col items-center min-w-[60px] ${log.return_type === 'defective'
                                                ? 'bg-rose-50/50 border-rose-100'
                                                : 'bg-amber-50/50 border-amber-100'
                                            }`}>
                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">QTY</span>
                                            <span className={`text-lg font-[1000] ${log.return_type === 'defective' ? 'text-rose-600' : 'text-amber-600'
                                                }`}>{log.quantity}</span>
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

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                            totalCount={filteredReturnsList.length}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Returns;
