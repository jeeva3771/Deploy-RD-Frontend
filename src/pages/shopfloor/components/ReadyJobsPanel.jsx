import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Scissors } from 'lucide-react';
import { fetchAllUsers, clearUsers } from '../../../reducer/userReducer';
import { fetchReadyJobs, confirmHandoverThunk } from '../../../reducer/readyJobsReducer';
import { getAllDepartments } from '../../../reducer/departmentReducer';
import { toast } from 'react-toastify';

const ReadyJobsPanel = ({ isOpen, onClose, department }) => {
    const dispatch = useDispatch();
    const { users = [] } = useSelector((state) => state.user);
    const { items: readyJobItems = [], loading, submitting } = useSelector((state) => state.readyJobs);
    const { departments = [] } = useSelector((state) => state.department);

    // Track collapse state for jobs and materials
    const [collapsedJobs, setCollapsedJobs] = useState(new Set());
    const [collapsedMaterials, setCollapsedMaterials] = useState(new Set());

    // Form states for each individual ready-job entry: keyed by ready_job _id
    // { [readyJobId]: { receiver: string, department: string } }
    const [transferForms, setTransferForms] = useState({});

    // Global form states for bulk transfer by jobId
    const [globalTransferForms, setGlobalTransferForms] = useState({});

    // Helper to find matching department object from departments list
    const findMatchingDepartmentObj = (deptName, depts) => {
        if (!deptName || !depts || depts.length === 0) return null;
        const target = deptName.toLowerCase().trim();

        // 1. Exact match
        let found = depts.find(d => d.name?.toLowerCase().trim() === target);
        if (found) return found;

        // 2. Substring / Contains match (e.g. "UV Printing" in "UV Printing Mimaki")
        found = depts.find(d => target.includes(d.name?.toLowerCase().trim()) || d.name?.toLowerCase().trim().includes(target));
        if (found) return found;

        // 3. Keyword / Synonym match
        const isPrint = target.includes('print') || target.includes('uv') || target.includes('mimaki') || target.includes('handtop');
        const isLaser = target.includes('laser') || target.includes('engrav') || target.includes('cut');
        const isAssembly = target.includes('assembly') || target.includes('labour');
        const isShopFloor = !isPrint && !isLaser && !isAssembly;

        return depts.find(d => {
            const dName = d.name?.toLowerCase().trim() || '';
            if (isPrint && (dName.includes('print') || dName.includes('uv'))) return true;
            if (isLaser && dName.includes('laser')) return true;
            if (isAssembly && dName.includes('assembly')) return true;
            if (isShopFloor && !dName.includes('assembly') && !dName.includes('laser') && !dName.includes('print') && !dName.includes('uv')) return true;
            return false;
        }) || null;
    };

    const fetchUsersForDept = (targetDeptName) => {
        const deptObj = targetDeptName ? findMatchingDepartmentObj(targetDeptName, departments) : null;
        const params = { limit: 300, is_active: 'true' };
        if (deptObj?._id || deptObj?.id) {
            params.department_id = deptObj._id || deptObj.id;
        }
        dispatch(fetchAllUsers(params));
    };

    // Fetch departments, ready jobs, and all active users on open
    useEffect(() => {
        if (isOpen) {
            dispatch(clearUsers());
            dispatch(getAllDepartments({ is_active: 'true', order: 'asc' }));
            dispatch(fetchReadyJobs({ handed_over: false, department }));
            dispatch(fetchAllUsers({ limit: 500, is_active: 'true' }));
        }
    }, [isOpen, dispatch, department]);

    // Auto-prepopulate BOM next_department when readyJobItems are loaded
    useEffect(() => {
        if (readyJobItems && readyJobItems.length > 0) {
            readyJobItems.forEach((entry) => {
                if (entry.next_department) {
                    // Pre-fill cycle form
                    setTransferForms(prev => {
                        if (prev[entry._id]?.department) return prev;
                        return {
                            ...prev,
                            [entry._id]: {
                                department: entry.next_department,
                                receiver: prev[entry._id]?.receiver || ''
                            }
                        };
                    });

                    // Pre-fill bulk material form
                    if (entry.group_id) {
                        setGlobalTransferForms(prev => {
                            if (prev[entry.group_id]?.department) return prev;
                            return {
                                ...prev,
                                [entry.group_id]: {
                                    department: entry.next_department,
                                    receiver: prev[entry.group_id]?.receiver || ''
                                }
                            };
                        });
                    }
                }
            });
        }
    }, [readyJobItems]);

    const isConflictingDept = (uDeptName, selDeptName) => {
        if (!uDeptName || !selDeptName) return false;
        const u = uDeptName.toLowerCase().trim();
        const s = selDeptName.toLowerCase().trim();

        const isPrint = (val) => val.includes('print') || val.includes('uv') || val.includes('mimaki') || val.includes('handtop');
        const isLaser = (val) => val.includes('laser') || val.includes('engrav') || val.includes('cut');
        const isAssembly = (val) => val.includes('assembly') || val.includes('labour');
        const isShopFloor = (val) => !isPrint(val) && !isLaser(val) && !isAssembly(val);

        if (isPrint(s) && isLaser(u)) return true;
        if (isLaser(s) && isPrint(u)) return true;
        if (isAssembly(s) && (isLaser(u) || isPrint(u))) return true;
        if (isShopFloor(s) && (isLaser(u) || isPrint(u))) return true;

        return false;
    };

    const isSameDept = (uDeptName, selDeptName) => {
        if (!uDeptName || !selDeptName) return false;
        const u = uDeptName.toLowerCase().trim();
        const s = selDeptName.toLowerCase().trim();
        if (u === s) return true;

        const isPrint = (val) => val.includes('print') || val.includes('uv') || val.includes('mimaki') || val.includes('handtop');
        const isLaser = (val) => val.includes('laser') || val.includes('engrav') || val.includes('cut');
        const isAssembly = (val) => val.includes('assembly') || val.includes('labour');
        const isShopFloor = (val) => !isPrint(val) && !isLaser(val) && !isAssembly(val);

        if (isPrint(u) && isPrint(s)) return true;
        if (isLaser(u) && isLaser(s)) return true;
        if (isAssembly(u) && isAssembly(s)) return true;
        if (isShopFloor(u) && isShopFloor(s)) return true;

        return false;
    };

    const getUserDeptName = (u) => {
        return (
            u.department_id?.name ||
            u.department_name ||
            u.department?.name ||
            (typeof u.department_id === 'string' ? u.department_id : '') ||
            (typeof u.department === 'string' ? u.department : '') ||
            u.role_id?.name ||
            u.role_name ||
            u.role?.name ||
            (typeof u.role === 'string' ? u.role : '') ||
            ''
        );
    };

    // Dynamic receiver options based on selected department
    const getReceiverOptionsForEntry = (entryId) => {
        const form = transferForms[entryId] || {};
        const selectedDept = form.department;
        if (!selectedDept) return [];

        const deptObj = findMatchingDepartmentObj(selectedDept, departments);

        const matchingUsers = (users || []).filter(u => {
            const userDeptName = getUserDeptName(u);
            if (isConflictingDept(userDeptName, selectedDept)) return false;
            if (deptObj && String(u.department_id?._id || u.department_id || u.department) === String(deptObj._id || deptObj.id)) return true;
            return isSameDept(userDeptName, selectedDept);
        });

        if (matchingUsers.length > 0) {
            return matchingUsers.map(u => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                return u.name || u.username || fullName || 'Unknown';
            }).filter(Boolean);
        }

        const fallbackUsers = (users || []).filter(u => {
            const userDeptName = getUserDeptName(u);
            return !isConflictingDept(userDeptName, selectedDept);
        });

        if (fallbackUsers.length > 0) {
            return fallbackUsers.map(u => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                return u.name || u.username || fullName || 'Unknown';
            }).filter(Boolean);
        }

        // Final safety fallback: Return all active users so dropdown is never empty
        return (users || []).map(u => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            return u.name || u.username || fullName || 'Unknown';
        }).filter(Boolean);
    };

    const getGlobalReceiverOptions = (jobId) => {
        const form = globalTransferForms[jobId] || {};
        const selectedDept = form.department;
        if (!selectedDept) return [];

        const deptObj = findMatchingDepartmentObj(selectedDept, departments);

        const matchingUsers = (users || []).filter(u => {
            const userDeptName = getUserDeptName(u);
            if (isConflictingDept(userDeptName, selectedDept)) return false;
            if (deptObj && String(u.department_id?._id || u.department_id || u.department) === String(deptObj._id || deptObj.id)) return true;
            return isSameDept(userDeptName, selectedDept);
        });

        if (matchingUsers.length > 0) {
            return matchingUsers.map(u => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                return u.name || u.username || fullName || 'Unknown';
            }).filter(Boolean);
        }

        const fallbackUsers = (users || []).filter(u => {
            const userDeptName = getUserDeptName(u);
            return !isConflictingDept(userDeptName, selectedDept);
        });

        if (fallbackUsers.length > 0) {
            return fallbackUsers.map(u => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                return u.name || u.username || fullName || 'Unknown';
            }).filter(Boolean);
        }

        // Final safety fallback: Return all active users so dropdown is never empty
        return (users || []).map(u => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            return u.name || u.username || fullName || 'Unknown';
        }).filter(Boolean);
    };

    const departmentOptions = useMemo(() => {
        return (departments || []).map(d => d.name).filter(Boolean);
    }, [departments]);

    // Helper to order department options with target nextDept at the top
    const getOrderedDepartmentOptions = (nextDept) => {
        const base = [...departmentOptions];
        if (!nextDept) return base;
        const matched = findMatchingDepartmentObj(nextDept, departments);
        const matchedName = matched?.name || nextDept;

        const filtered = base.filter(
            d => d.toLowerCase().trim() !== matchedName.toLowerCase().trim()
        );
        return [matchedName, ...filtered];
    };

    // Group ready_job items by job_no for display
    const activeLedger = useMemo(() => {
        const jobMap = {};

        readyJobItems.forEach(entry => {
            if ((entry.good_qty || 0) <= 0) return;
            // Group by job number, sub-job number, AND process name to separate different processes
            const jobKey = `${entry.job_no || entry.shopfloor_job_id}_${entry.sub_job_no || ''}_${entry.process_name || ''}`;
            if (!jobMap[jobKey]) {
                jobMap[jobKey] = {
                    jobId: String(entry.shopfloor_job_id),
                    jobNo: entry.job_no,
                    subJobNo: entry.sub_job_no,
                    processName: entry.process_name,
                    clientName: entry.client_name || 'Internal Client',
                    materials: {},
                    totalQty: 0,
                    totalCycles: 0
                };
            }

            const matKey = entry.group_id;
            if (!jobMap[jobKey].materials[matKey]) {
                jobMap[jobKey].materials[matKey] = {
                    groupId: matKey,
                    name: entry.material_name || 'Unknown Material',
                    specs: entry.material_specs || 'Standard',
                    cycles: [],
                    totalQty: 0,
                    isSample: false,
                    nextDepartment: entry.next_department || '',
                    nextProcessName: entry.next_process_name || ''
                };
            }

            if (entry.cycle_number >= 5000) {
                jobMap[jobKey].materials[matKey].isRecut = true;
            } else if (entry.cycle_number >= 1000) {
                jobMap[jobKey].materials[matKey].isSample = true;
            }

            const handlerName = (entry.completed_by_name && entry.completed_by_name !== 'N/A' && entry.completed_by_name.trim() !== '') 
                ? entry.completed_by_name 
                : 'Ready Stock';

            jobMap[jobKey].materials[matKey].cycles.push({
                id: entry._id,           // ready_job document _id — used for handover API
                cycle_number: entry.cycle_number,
                name: entry.cycle_number >= 5000 ? `Recut Cycle ${Math.max(1, entry.cycle_number - 5000)}` : entry.cycle_number >= 1000 ? `Sample Cycle ${entry.cycle_number - 1000}` : `Cycle ${entry.cycle_number || 1}`,
                posted: entry.completed_at
                    ? new Date(entry.completed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Just now',
                handler: handlerName,
                qty: entry.good_qty || 0,
                nextDepartment: entry.next_department || '',
                nextProcessName: entry.next_process_name || ''
            });

            jobMap[jobKey].materials[matKey].totalQty += (entry.good_qty || 0);
        });

        // Flatten to array form
        return Object.values(jobMap).map(job => {
            const materials = Object.values(job.materials);
            const totalQty = materials.reduce((sum, m) => sum + m.totalQty, 0);
            const totalCycles = materials.reduce((sum, m) => sum + m.cycles.length, 0);
            return { ...job, materials, totalQty, totalCycles };
        });
    }, [readyJobItems]);

    // Subtitle Stats
    const stats = useMemo(() => {
        const totalTransfers = activeLedger.reduce((sum, j) => sum + j.totalCycles, 0);
        const totalJobs = activeLedger.length;
        return { totalTransfers, totalJobs };
    }, [activeLedger]);

    // Collapse handlers
    const toggleJob = (jobId) => {
        setCollapsedJobs(prev => {
            const next = new Set(prev);
            if (next.has(jobId)) {
                next.delete(jobId);
            } else {
                next.add(jobId);
            }
            return next;
        });
    };

    const toggleMaterial = (matId) => {
        setCollapsedMaterials(prev => {
            const next = new Set(prev);
            if (next.has(matId)) {
                next.delete(matId);
            } else {
                next.add(matId);
            }
            return next;
        });
    };

    // Form inputs handler
    const handleFormChange = (entryId, field, value) => {
        setTransferForms(prev => {
            const current = prev[entryId] || { receiver: '', department: '' };
            const next = { ...current, [field]: value };
            if (field === 'department') {
                next.receiver = '';
            }
            return {
                ...prev,
                [entryId]: next
            };
        });

        if (field === 'department') {
            if (value) {
                fetchUsersForDept(value);
            } else {
                dispatch(clearUsers());
            }
        }
    };

    const handleGlobalFormChange = (jobId, field, value) => {
        setGlobalTransferForms(prev => {
            const current = prev[jobId] || { receiver: '', department: '' };
            const next = { ...current, [field]: value };
            if (field === 'department') {
                next.receiver = '';
            }
            return {
                ...prev,
                [jobId]: next
            };
        });

        if (field === 'department') {
            if (value) {
                fetchUsersForDept(value);
            } else {
                dispatch(clearUsers());
            }
        }
    };

    // Confirm transfer action — calls backend to mark ready_job as handed_over
    const handleConfirmTransfer = async (jobNo, matName, cycle) => {
        const form = transferForms[cycle.id];
        if (!form?.receiver || !form?.department) return;

        try {
            await dispatch(confirmHandoverThunk({
                id: cycle.id,
                payload: {
                    department: form.department,
                    receiver: form.receiver
                }
            })).unwrap();

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-[900] uppercase tracking-wider text-xs">Stock Transfer Confirmed!</span>
                    <span className="text-[10px] text-slate-200">
                        Transferred {cycle.qty} pcs of {matName} ({jobNo}) to {form.receiver} ({form.department}).
                    </span>
                </div>,
                { theme: 'dark', autoClose: 4000 }
            );

            // Clean up form state for this entry
            setTransferForms(prev => {
                const next = { ...prev };
                delete next[cycle.id];
                return next;
            });
        } catch (err) {
            toast.error('Failed to confirm transfer. Please try again.', { theme: 'dark' });
        }
    };

    const handleConfirmTransferAll = async (jobNo, mat) => {
        const form = globalTransferForms[mat.groupId];
        if (!form?.receiver || !form?.department) return;

        try {
            const allCycles = mat.cycles.map(cycle => ({ matName: mat.name, cycle }));

            for (const { matName, cycle } of allCycles) {
                await dispatch(confirmHandoverThunk({
                    id: cycle.id,
                    payload: {
                        department: form.department,
                        receiver: form.receiver
                    }
                })).unwrap();
            }

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-[900] uppercase tracking-wider text-xs">Bulk Transfer Confirmed!</span>
                    <span className="text-[10px] text-slate-200">
                        Transferred {mat.totalQty} pcs of {mat.name} ({jobNo}) to {form.receiver} ({form.department}).
                    </span>
                </div>,
                { theme: 'dark', autoClose: 4000 }
            );

            setGlobalTransferForms(prev => {
                const next = { ...prev };
                delete next[mat.groupId];
                return next;
            });
            
            setTransferForms(prev => {
                const next = { ...prev };
                allCycles.forEach(({cycle}) => { delete next[cycle.id]; });
                return next;
            });

        } catch (err) {
            toast.error('Failed to confirm bulk transfer. Please try again.', { theme: 'dark' });
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Slide-over Panel */}
            <div
                className="relative h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
                style={{ width: 480, overflow: 'hidden' }}
            >
                {/* Slanted Green Industrial Header */}
                <div style={{ background: '#059669', color: 'white', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Scissors className="w-4 h-4 text-white -rotate-90" />
                            <span>{department ? `${department === 'Print' ? 'UV Print' : department.toUpperCase()} ` : ''}Ready Jobs — Stock Ledger</span>
                        </div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginTop: 2 }}>
                            {loading ? 'LOADING...' : `${stats.totalTransfers} TRANSFER${stats.totalTransfers !== 1 ? 'S' : ''} ACROSS ${stats.totalJobs} JOB${stats.totalJobs !== 1 ? 'S' : ''}`}
                        </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '18px', cursor: 'pointer' }} onClick={onClose}>✕</button>
                </div>

                {/* Ledger Item List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: 'white' }}>
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-20">
                            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-[1000] uppercase tracking-[0.15em] text-slate-500">Loading ready jobs...</p>
                        </div>
                    ) : activeLedger.length === 0 ? (
                        <div style={{ border: '3px dashed #E2E8F0', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', fontStyle: 'italic', marginTop: '12px' }}>
                            No stock pending — complete cycles and post to Ready Stock
                        </div>
                    ) : (
                        activeLedger.map((job) => {
                            const accordionId = `${job.jobId}_${job.processName || ''}`;
                            const isJobCollapsed = collapsedJobs.has(accordionId);

                            return (
                                <div
                                    key={job.jobId}
                                    style={{ border: '2px solid #059669', borderRadius: '14px', marginBottom: '12px', overflow: 'hidden', background: 'white' }}
                                >
                                    {/* Job Header */}
                                    <div
                                        onClick={() => toggleJob(job.jobId)}
                                        style={{ background: '#F0FDF4', padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: !isJobCollapsed ? '1px solid #A7F3D0' : 'none' }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 900, fontStyle: 'italic', color: '#065F46', textTransform: 'uppercase' }}>
                                                    {job.jobNo}
                                                </span>
                                                {job.subJobNo && (
                                                    <span style={{ fontSize: '9px', fontWeight: 900, background: '#D1FAE5', color: '#065F46', padding: '1px 5px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                                                        {job.subJobNo}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '8px', fontWeight: 700, color: '#059669', marginTop: 2, textTransform: 'uppercase' }}>
                                                {job.clientName} · {job.materials.length} item{job.materials.length !== 1 ? 's' : ''} · {job.totalQty} pcs ready
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ background: '#059669', color: 'white', borderRadius: '8px', padding: '5px 12px', fontSize: '16px', fontWeight: 900, fontFamily: 'monospace' }}>
                                                {job.totalQty}
                                            </div>
                                            <span style={{ color: '#059669', fontWeight: 900, fontSize: '14px' }}>
                                                {isJobCollapsed ? '▼' : '▲'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Job Expanded Material Groups */}
                                    {!isJobCollapsed && (
                                        <div style={{ background: 'white' }}>

                                            {job.materials.map((mat) => {
                                                const matId = `${accordionId}-${mat.groupId}`;
                                                const isMatCollapsed = collapsedMaterials.has(matId);

                                                return (
                                                    <div
                                                        key={mat.groupId}
                                                        style={{ borderBottom: '1px solid #E2E8F0' }}
                                                    >
                                                        {/* Material Subheader */}
                                                        <div
                                                            onClick={() => toggleMaterial(matId)}
                                                            style={{ padding: '8px 14px 8px 20px', cursor: 'pointer', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                        >
                                                            <div>
                                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0C1A2E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span>{mat.name}</span>
                                                                    {mat.isSample && (
                                                                        <span style={{ fontSize: '7px', fontWeight: 900, background: '#D946EF', color: 'white', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontStyle: 'normal', letterSpacing: '0.5px' }}>
                                                                            Sample
                                                                        </span>
                                                                    )}
                                                                    {mat.isRecut && (
                                                                        <span style={{ fontSize: '7px', fontWeight: 900, background: '#F59E0B', color: 'white', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontStyle: 'normal', letterSpacing: '0.5px' }}>
                                                                            Recut
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '8px', fontWeight: 700, color: '#64748B' }}>
                                                                    {mat.specs} · {mat.cycles.length} cycle{mat.cycles.length !== 1 ? 's' : ''}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: '6px', padding: '3px 9px', fontSize: '12px', fontWeight: 900, fontFamily: 'monospace' }}>
                                                                    {mat.totalQty} pcs
                                                                </span>
                                                                <span style={{ color: '#94A3B8', fontSize: '11px' }}>
                                                                    {isMatCollapsed ? '▼' : '▲'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Material Cycles */}
                                                        {!isMatCollapsed && (
                                                            <div style={{ background: 'white' }}>
                                                                {mat.cycles.length > 1 && (
                                                                    <div style={{ padding: '8px 14px 10px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>BULK SEND ALL CYCLES FOR THIS MATERIAL</div>
                                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '7px', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: 3 }}>
                                                                                    Department {mat.nextDepartment ? '(Locked by BOM)' : ''}
                                                                                </div>
                                                                                <select
                                                                                    value={globalTransferForms[mat.groupId]?.department || ''}
                                                                                    onChange={(e) => handleGlobalFormChange(mat.groupId, 'department', e.target.value)}
                                                                                    disabled={!!mat.nextDepartment}
                                                                                    style={{ width: '100%', border: '1.5px solid ' + (globalTransferForms[mat.groupId]?.department ? '#10B981' : '#D1FAE5'), borderRadius: 7, padding: '5px 6px', fontSize: '10px', fontWeight: 700, color: '#0C1A2E', outline: 'none', background: mat.nextDepartment ? '#F1F5F9' : 'white', cursor: mat.nextDepartment ? 'not-allowed' : 'pointer' }}
                                                                                >
                                                                                    <option value="">Select dept...</option>
                                                                                    {getOrderedDepartmentOptions(mat.nextDepartment).map((opt) => (
                                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '7px', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: 3 }}>Received By</div>
                                                                                <select
                                                                                    value={globalTransferForms[mat.groupId]?.receiver || ''}
                                                                                    onChange={(e) => handleGlobalFormChange(mat.groupId, 'receiver', e.target.value)}
                                                                                    disabled={!globalTransferForms[mat.groupId]?.department}
                                                                                    style={{ width: '100%', border: '1.5px solid ' + (globalTransferForms[mat.groupId]?.receiver ? '#10B981' : '#D1FAE5'), borderRadius: 7, padding: '5px 6px', fontSize: '10px', fontWeight: 700, color: '#0C1A2E', outline: 'none', background: 'white' }}
                                                                                >
                                                                                    {!globalTransferForms[mat.groupId]?.department ? (
                                                                                        <option value="">Choose dept first...</option>
                                                                                    ) : (
                                                                                        <>
                                                                                            <option value="">Select person...</option>
                                                                                            {getGlobalReceiverOptions(mat.groupId).map((opt) => (
                                                                                                <option key={opt} value={opt}>{opt}</option>
                                                                                            ))}
                                                                                        </>
                                                                                    )}
                                                                                </select>
                                                                            </div>
                                                                            <div style={{ flex: '0 0 auto' }}>
                                                                                <button
                                                                                    onClick={() => handleConfirmTransferAll(job.jobNo, mat)}
                                                                                    disabled={submitting || !globalTransferForms[mat.groupId]?.receiver || !globalTransferForms[mat.groupId]?.department}
                                                                                    style={{ background: (globalTransferForms[mat.groupId]?.receiver && globalTransferForms[mat.groupId]?.department && !submitting) ? '#059669' : '#94A3B8', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '10px', fontWeight: 900, cursor: (globalTransferForms[mat.groupId]?.receiver && globalTransferForms[mat.groupId]?.department && !submitting) ? 'pointer' : 'not-allowed', textTransform: 'uppercase', height: '27px' }}
                                                                                >
                                                                                    {submitting ? 'SENDING...' : 'SEND ALL'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {mat.cycles.map((cycle) => {
                                                                    const form = transferForms[cycle.id] || { receiver: '', department: '' };
                                                                    const canConfirm = form.receiver && form.department;

                                                                    return (
                                                                        <div
                                                                            key={cycle.id}
                                                                            style={{ padding: '10px 14px 12px 24px', background: 'white', borderTop: '1px dashed #E2E8F0' }}
                                                                        >
                                                                            {/* Cycle Info Row */}
                                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10, background: '#F8FAFC', borderRadius: 8, padding: '7px 10px' }}>
                                                                                <div>
                                                                                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Cycle</div>
                                                                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#0C1A2E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                        <span>{cycle.name}</span>
                                                                                        {cycle.cycle_number >= 5000 ? (
                                                                                            <span style={{ fontSize: '6px', fontWeight: 900, background: '#F59E0B', color: 'white', padding: '0px 3px', borderRadius: '3px', textTransform: 'uppercase' }}>
                                                                                                Recut
                                                                                            </span>
                                                                                        ) : cycle.cycle_number >= 1000 && (
                                                                                            <span style={{ fontSize: '6px', fontWeight: 900, background: '#D946EF', color: 'white', padding: '0px 3px', borderRadius: '3px', textTransform: 'uppercase' }}>
                                                                                                Sample
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Posted</div>
                                                                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#0C1A2E' }}>{cycle.posted}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Handler</div>
                                                                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#0C1A2E' }}>{cycle.handler}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Qty</div>
                                                                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#059669' }}>{cycle.qty} pcs</div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Transfer Form Inputs */}
                                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 7 }}>
                                                                                {/* Department (Right) */}
                                                                                <div>
                                                                                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: 3 }}>
                                                                                        Department {cycle.nextDepartment ? '(Locked by BOM)' : ''}
                                                                                    </div>
                                                                                    <select
                                                                                        value={form.department}
                                                                                        onChange={(e) => {
                                                                                            handleFormChange(cycle.id, 'department', e.target.value);
                                                                                        }}
                                                                                        disabled={!!cycle.nextDepartment}
                                                                                        style={{ width: '100%', border: '1.5px solid ' + (form.department ? '#10B981' : '#D1FAE5'), borderRadius: 7, padding: '5px 6px', fontSize: '10px', fontWeight: 700, color: '#0C1A2E', outline: 'none', background: cycle.nextDepartment ? '#F1F5F9' : 'white', cursor: cycle.nextDepartment ? 'not-allowed' : 'pointer' }}
                                                                                    >
                                                                                        <option value="">Select dept...</option>
                                                                                        {getOrderedDepartmentOptions(cycle.nextDepartment).map((opt) => (
                                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>

                                                                                {/* Received By (Left) */}
                                                                                <div>
                                                                                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: 3 }}>Received By</div>
                                                                                    <select
                                                                                        value={form.receiver}
                                                                                        onChange={(e) => handleFormChange(cycle.id, 'receiver', e.target.value)}
                                                                                        disabled={!form.department}
                                                                                        style={{ width: '100%', border: '1.5px solid ' + (form.receiver ? '#10B981' : '#D1FAE5'), borderRadius: 7, padding: '5px 6px', fontSize: '10px', fontWeight: 700, color: '#0C1A2E', outline: 'none', background: 'white' }}
                                                                                    >
                                                                                        {!form.department ? (
                                                                                            <option value="">Choose dept first...</option>
                                                                                        ) : (
                                                                                            <>
                                                                                                <option value="">Select person...</option>
                                                                                                {getReceiverOptionsForEntry(cycle.id).map((opt) => (
                                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                                ))}
                                                                                            </>
                                                                                        )}
                                                                                    </select>
                                                                                </div>
                                                                            </div>

                                                                            {/* Transfer Confirmation Button */}
                                                                            {canConfirm ? (
                                                                                <button
                                                                                    onClick={() => handleConfirmTransfer(job.jobNo, mat.name, cycle)}
                                                                                    disabled={submitting}
                                                                                    style={{ width: '100%', background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '9px', fontSize: '10px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}
                                                                                >
                                                                                    {submitting ? 'Confirming...' : '✓ Confirm Transfer'}
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    disabled
                                                                                    style={{ width: '100%', background: '#94A3B8', color: 'white', border: 'none', borderRadius: 8, padding: '9px', fontSize: '10px', fontWeight: 900, cursor: 'not-allowed', textTransform: 'uppercase' }}
                                                                                >
                                                                                    Select receiver and department
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReadyJobsPanel;
