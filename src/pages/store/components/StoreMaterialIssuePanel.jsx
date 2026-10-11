import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logMaterialIssue, escalateStoreIssue, fetchAllStoreIssues, authorizeStoreIssue, clearStoreFlags } from '../../../reducer/storeReducer';
import { getAllDepartments } from '../../../reducer/departmentReducer';
import { fetchAllUsers } from '../../../reducer/userReducer';
import { fetchItemsStockByIds } from '../../../reducer/inventory/itemReducer';
import { fetchCustomItemsStockByIds } from '../../../reducer/inventory/customItemReducer';
import { toast } from 'react-toastify';
import { handleStorePrint } from '../utils/storePrint';

const StoreMaterialIssuePanel = ({ job, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { departments } = useSelector((state) => state.department);
    const { users } = useSelector((state) => state.user);

    const [isClearing, setIsClearing] = useState(false);
    const [isEscalating, setIsEscalating] = useState(false);
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalateRemark, setEscalateRemark] = useState('');
    const [isIssuing, setIsIssuing] = useState(null); // material_id for loading state
    const [activeIssueFormId, setActiveIssueFormId] = useState(null);
    const [logType, setLogType] = useState('ISSUE'); // 'ISSUE' or 'RETURN'
    const [issueData, setIssueData] = useState({
        dept: '-- SELECT --',
        recipient: '-- SELECT --',
        qty: 0
    });

    const [stockData, setStockData] = useState({});
    const [isFetchingStock, setIsFetchingStock] = useState(false);

    const fetchCurrentStock = useCallback(async () => {
        setIsFetchingStock(true);
        try {
            const specs = job?.materials || [];
            
            const standardIds = [];
            const customIds = [];

            specs.forEach(mat => {
                const job_item = job?.items?.find(i => i.item_id === mat.item_id);
                const isCustom = job_item?.type === "Custom";
                if (isCustom) {
                    const cid = job_item?.master_id || mat.material_id || job_item?.item_id || mat.item_id;
                    if (cid) customIds.push(cid);
                } else {
                    const sid = mat.material_id || job_item?.subCategoryId || job_item?.item_id || mat.item_id;
                    if (sid) standardIds.push(sid);
                }
            });

            const uniqueStandardIds = Array.from(new Set(standardIds)).filter(Boolean);
            const uniqueCustomIds = Array.from(new Set(customIds)).filter(Boolean);

            let standardStock = [];
            let customStock = [];

            const promises = [];
            if (uniqueStandardIds.length > 0) {
                promises.push(
                    dispatch(fetchItemsStockByIds(uniqueStandardIds)).unwrap()
                        .then(response => {
                            standardStock = response?.data || [];
                        })
                );
            }
            if (uniqueCustomIds.length > 0) {
                promises.push(
                    dispatch(fetchCustomItemsStockByIds(uniqueCustomIds)).unwrap()
                        .then(response => {
                            customStock = response?.data || [];
                        })
                );
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }

            const inventoryItems = [...standardStock, ...customStock];
            const newStockData = {};

            specs.forEach(mat => {
                const job_item = job?.items?.find(i => i.item_id === mat.item_id);
                const isCustom = job_item?.type === "Custom";
                const actualItemId = isCustom
                    ? (job_item?.master_id || mat.material_id || job_item?.item_id || mat.item_id)
                    : (mat.material_id || job_item?.subCategoryId || job_item?.item_id || mat.item_id);

                const item = inventoryItems.find(i => i._id === actualItemId || i.id === actualItemId);
                if (item) {
                    if (item.item_type === 'sheet') {
                        let stockCount = 0;
                        let stockArea = 0;

                        // Extract size from specs string: "Type: sheet Color: 2 Size: 24x48 ..."
                        const matSize = mat.specs?.split('Size:')[1]?.trim()?.split(' ')[0];

                        if (matSize && item.size_wise_stock && item.stock_sizes) {
                            const foundSizeDoc = item.stock_sizes.find(sz => {
                                const normalize = s => (s || '').toLowerCase().replace(/\s+/g, '');
                                const inputSize = normalize(matSize);
                                const nameSize = normalize(sz.size);
                                const dimSize = normalize(`${sz.width}x${sz.height}`);
                                return nameSize === inputSize || dimSize === inputSize;
                            });
                            if (foundSizeDoc) {
                                const sizeStock = item.size_wise_stock.find(s =>
                                    String(s.size_id) === String(foundSizeDoc._id) ||
                                    String(s.size_id?._id) === String(foundSizeDoc._id) ||
                                    String(s.size_id) === String(foundSizeDoc.id)
                                );
                                if (sizeStock) {
                                    stockCount = sizeStock.count || 0;
                                    stockArea = sizeStock.sqinch || 0;
                                }
                            }
                        } else {
                            stockCount = item.stock || 0;
                        }
                        newStockData[mat._id] = {
                            ...item,
                            stock: stockCount,
                            totalArea: stockArea,
                            item_type: 'sheet'
                        };
                    } else {
                        newStockData[mat._id] = { ...item, stock: item.stock || 0, item_type: item.item_type };
                    }
                } else {
                    newStockData[mat._id] = { stock: "N/A" };
                }
            });
            setStockData(newStockData);
            if (!job?.is_on_hold) {
                toast.success("Stock details fetched!");
            }
        } catch (err) {
            toast.error("Failed to fetch current stock");
            console.error(err);
        } finally {
            setIsFetchingStock(false);
        }
    }, [dispatch, job]);

    useEffect(() => {
        if (isOpen) {
            dispatch(getAllDepartments({ is_active: 'true', order: 'asc' }));
            if (job) fetchCurrentStock();
        }
    }, [dispatch, isOpen, job, fetchCurrentStock]);

    const handleDeptChange = (deptName) => {
        setIssueData({ ...issueData, dept: deptName, recipient: '-- SELECT --' });

        if (deptName !== '-- SELECT --') {
            const selectedDept = departments.find(d => d.name === deptName);
            if (selectedDept) {
                dispatch(fetchAllUsers({
                    department: selectedDept._id || selectedDept.id,
                    is_active: 'true',
                }));
            }
        }
    };

    if (!isOpen || !job) return null;

    const handleClearFlag = async (type) => {
        try {
            setIsClearing(true);
            await dispatch(clearStoreFlags({ id: job._id, type })).unwrap();
            toast.success("Notification cleared");
        } catch (error) {
            toast.error(error?.message || "Action failed");
        } finally {
            setIsClearing(false);
        }
    };

    const handleEscalate = async () => {
        if (!escalateRemark.trim()) {
            toast.error("Please provide a reason for escalation");
            return;
        }

        try {
            setIsEscalating(true);
            await dispatch(escalateStoreIssue({ id: job._id, payload: { remark: escalateRemark } })).unwrap();
            toast.success("Job escalated to management");
            setShowEscalateModal(false);
            setEscalateRemark('');
            dispatch(fetchAllStoreIssues());
        } catch (error) {
            toast.error(error?.message || "Escalation failed");
        } finally {
            setIsEscalating(false);
        }
    };

    const handleActionClick = (item, type) => {
        if (activeIssueFormId === item._id && logType === type) {
            setActiveIssueFormId(null);
        } else {
            setActiveIssueFormId(item._id);
            setLogType(type);

            let matchedDept = '-- SELECT --';
            if (item.department) {
                const found = departments.find(d =>
                    (d._id?.toString() === item.department?.toString()) ||
                    (d.id?.toString() === item.department?.toString())
                );
                if (found) {
                    matchedDept = found.name;
                    // Auto-fetch users for the pre-selected department
                    dispatch(fetchAllUsers({
                        department: found._id || found.id,
                        is_active: 'true',
                    }));
                }
            }

            const netIssued = (item.issued_qty || 0) - (item.returned_qty || 0);
            setIssueData({
                dept: matchedDept,
                recipient: '-- SELECT --',
                qty: Math.max(0, type === 'ISSUE' ? (item.required_qty - netIssued) : 0)
            });
        }
    };

    const handleLogIssue = async (materialId) => {
        if (!issueData.qty || isNaN(issueData.qty) || parseFloat(issueData.qty) <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }

        if (!issueData.dept || issueData.dept === '-- SELECT --') {
            toast.error("Please select a department");
            return;
        }

        try {
            setIsIssuing(materialId);
            await dispatch(logMaterialIssue({
                id: job._id,
                materialId,
                payload: {
                    qty: parseFloat(issueData.qty),
                    type: logType,
                    dept: issueData.dept,
                    recipient: issueData.recipient === '-- SELECT --' ? 'N/A' : issueData.recipient
                }
            })).unwrap();
            toast.success(`${logType === 'ISSUE' ? 'Material Issued' : 'Material Returned'} successfully`);
            setActiveIssueFormId(null);
            dispatch(fetchAllStoreIssues());
            fetchCurrentStock();
        } catch (error) {
            toast.error(error?.message || "Logging failed");
        } finally {
            setIsIssuing(null);
        }
    };

    const handleLaserReturn = async (materialId, qty) => {
        try {
            setIsIssuing(materialId);

            // Find the material to extract the last issue details
            const material = job.materials?.find(m => m._id === materialId || m.id === materialId);
            const lastIssue = material?.logs ? [...material.logs].reverse().find(l => l.type === 'ISSUE') : null;

            // Resolve fallback department name if no logs exist
            let resolvedDept = 'Laser';
            if (material?.department) {
                const foundDept = departments.find(d =>
                    (d._id?.toString() === material.department.toString()) ||
                    (d.id?.toString() === material.department.toString())
                );
                if (foundDept) {
                    resolvedDept = foundDept.name;
                }
            }

            const dept = lastIssue?.dept || resolvedDept;
            const recipient = lastIssue?.recipient || 'Shop Floor';

            await dispatch(logMaterialIssue({
                id: job._id,
                materialId,
                payload: {
                    qty: parseFloat(qty),
                    type: 'RETURN',
                    dept,
                    recipient,
                    isLaserReturn: true
                }
            })).unwrap();
            toast.success('Material returned successfully');
            dispatch(fetchAllStoreIssues());
            fetchCurrentStock();
        } catch (error) {
            toast.error(error?.message || "Logging failed");
        } finally {
            setIsIssuing(null);
        }
    };

    const handlePrint = () => {
        handleStorePrint(job);
    };

    const handleAuthorize = async () => {
        try {
            setIsAuthorizing(true);
            await dispatch(authorizeStoreIssue(job._id)).unwrap();
            toast.success("Job authorized and moved to Issued");
            dispatch(fetchAllStoreIssues());
            onClose();
        } catch (error) {
            toast.error(error?.message || "Authorization failed");
        } finally {
            setIsAuthorizing(false);
        }
    };

    const isAllIssued = (job.materials || []).length > 0 &&
        (job.materials || []).every(m => (m.issued_qty - m.returned_qty) >= m.required_qty);

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                className={`fixed inset-0 transition-all duration-300 z-[1040] ${isOpen ? 'opacity-100 bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
            ></div>

            <div className={`fixed top-0 right-0 h-full w-[1040px] bg-white shadow-2xl transform transition-transform duration-500 z-[1050] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header Content Wrapper */}
                <div className="flex flex-col h-full bg-[#f8fafc]">

                    {/* Blue Header Section */}
                    <div className="bg-[#4169E1] p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl text-white italic tracking-tighter uppercase leading-none mb-1">
                                        {job.sub_job_no} / {job.client_name || 'N/A'}
                                    </span>
                                    {job.is_on_hold && (
                                        <span className="bg-red-600 text-white text-[9px] px-3 py-1 rounded-lg animate-pulse font-black italic tracking-widest uppercase shadow-lg shadow-red-500/20">
                                            On Hold
                                        </span>
                                    )}
                                </div>
                                <p className="text-[20px] text-white italic tracking-widest uppercase opacity-80">
                                    Stores Accounting Panel
                                </p>
                                {job.reference_no && (
                                    <div className="mt-1 text-white/70 text-sm font-black italic tracking-[0.2em] uppercase">
                                        Ref No. {job.reference_no}
                                    </div>
                                )}
                            </div>
                            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowEscalateModal(true)}
                                disabled={job.is_on_hold}
                                className="bg-[#d94141] hover:bg-[#c0392b] text-white text-[9px] font-black px-4 py-1.5 rounded-lg shadow-md italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                Enable Escalation
                            </button>
                        </div>
                    </div>

                    {/* Body Section */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">



                        <div className={`${job.is_on_hold ? 'select-none' : ''}`}>


                            {/* Notifications Header */}
                            {(job.is_qty_changed || job.is_date_changed) && (
                                <div className="flex flex-col gap-3">
                                    {job.is_qty_changed && (
                                        <div className="bg-purple-100 border-2 border-purple-500 p-4 rounded-2xl flex justify-between items-center animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <i className="fa-solid fa-triangle-exclamation text-purple-600 text-xl"></i>
                                                <div>
                                                    <p className="text-purple-900 font-black italic text-sm uppercase">Quantity Changed</p>
                                                    <p className="text-purple-700 text-[10px] font-bold italic uppercase opacity-70">
                                                        New Job Quantity: <span className="text-purple-900 font-black text-xs ml-1">{job.job_quantity || 'N/A'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleClearFlag('qty')}
                                                disabled={isClearing || job.is_on_hold}
                                                className="bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black px-4 py-2 rounded-lg italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                            >
                                                Acknowledge
                                            </button>
                                        </div>
                                    )}
                                    {job.is_date_changed && (
                                        <div className="bg-orange-100 border-2 border-orange-500 p-4 rounded-2xl flex justify-between items-center animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <i className="fa-solid fa-calendar-day text-orange-600 text-xl"></i>
                                                <div>
                                                    <p className="text-orange-900 font-black italic text-sm uppercase">Delivery/Completion Date Changed</p>
                                                    <div className="flex flex-col">
                                                        <p className="text-orange-700 text-[10px] font-bold italic uppercase opacity-70">
                                                            New Delivery: <span className="text-orange-900 font-black text-xs ml-1">{job.delivery_date || 'N/A'}</span>
                                                        </p>
                                                        <p className="text-orange-700 text-[10px] font-bold italic uppercase opacity-70">
                                                            New Completion: <span className="text-orange-900 font-black text-xs ml-1">{job.job_completion_date || 'N/A'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleClearFlag('date')}
                                                disabled={isClearing || job.is_on_hold}
                                                className="bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black px-4 py-2 rounded-lg italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                            >
                                                Acknowledge
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BOM Received Banner */}
                            <div className="bg-[#1e293b] text-white p-4 py-6 rounded-3xl shadow-inner flex justify-between items-center px-8 border-b-4 border-black/20">
                                <span className="text-[11px] font-black italic tracking-[0.2em] uppercase opacity-70">
                                    BOM Received:
                                </span>
                                <span className="text-[12px] font-black italic tracking-tighter">
                                    {job.created_at}
                                </span>
                            </div>

                            {/* MRP Requisition Section */}
                            <div className="space-y-4">
                                {/* Materials Table Container */}
                                <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col max-h-[750px]">
                                    <div className="flex-none bg-white">
                                        {/* Dark Blue Header */}
                                        <div className="bg-[#2D3192] p-6 px-10">
                                            <h3 className="text-white text-base font-[1000] italic uppercase tracking-[0.05em]">
                                                MRP Requisition: V1.0
                                            </h3>
                                        </div>

                                        {/* Column Header Bar */}
                                        <div className="p-4 px-10 grid grid-cols-5 text-[10px] font-black text-[#94A3B8] italic uppercase bg-white border-b border-slate-100">
                                            <div className="col-span-1">Material Specs</div>
                                            <div className="text-center">IN-STOCK</div>
                                            <div className="text-center">REQUIRED QTY</div>
                                            <div className="text-center">NET BAL</div>
                                            <div className="text-right">ACTION</div>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-50 overflow-y-auto flex-1 custom-scrollbar">
                                        {(job.materials || []).map((item, idx) => {
                                            const currentIssued = (item.logs || []).reduce((acc, log) => {
                                                return log.type === 'ISSUE' ? acc + parseFloat(log.qty || 0) : acc - parseFloat(log.qty || 0);
                                            }, 0);
                                            const netBalance = Math.max(0, item.required_qty - currentIssued);
                                            const maxReturn = Math.max(0, currentIssued - (item.inward_good_qty || 0));
 
                                            return (
                                                <React.Fragment key={idx}>
                                                    <div className="grid grid-cols-5 items-center p-8 px-10 hover:bg-slate-50/50 transition-colors">
                                                        <div className="col-span-1">
                                                            <p className="text-[14px] font-[1000] italic text-[#1e293b] leading-tight uppercase tracking-tight">{item.material_name}</p>
                                                            <p className="text-[10px] font-black text-blue-500 italic uppercase mt-1 tracking-tighter truncate">
                                                                {item.specs}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            {stockData[item._id] && stockData[item._id].stock !== "N/A" ? (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="text-2xl font-[1000] italic text-[#1e293b]">
                                                                        {stockData[item._id].stock}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 font-black italic">--</span>
                                                            )}
                                                        </div>
                                                        <div className="text-center font-[1000] italic text-2xl text-[#1e293b]">{item.required_qty}</div>
                                                        <div className="text-center font-[1000] italic text-2xl text-[#d94141]">
                                                            {netBalance}
                                                        </div>
                                                        <div className="text-right flex justify-end gap-3">
                                                            <button
                                                                onClick={() => handleActionClick(item, 'ISSUE')}
                                                                disabled={
                                                                    isIssuing === item._id || 
                                                                    netBalance <= 0 || 
                                                                    job.is_on_hold || 
                                                                    !stockData[item._id] || 
                                                                    stockData[item._id].stock === "N/A" || 
                                                                    parseFloat(stockData[item._id].stock) <= 0
                                                                }
                                                                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[10px] font-[1000] px-10 py-3 rounded-full shadow-lg italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed min-w-[110px]"
                                                            >
                                                                {activeIssueFormId === item._id && logType === 'ISSUE' ? 'Cancel' : 'Issue'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleActionClick(item, 'RETURN')}
                                                                disabled={isIssuing === item._id || maxReturn <= 0 || job.is_on_hold || item.laserreturn_qty > 0 || item.has_pending_laser_return}
                                                                className="bg-[#00a37f] hover:bg-[#008c6d] text-white text-[10px] font-[1000] px-10 py-3 rounded-full shadow-lg italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed min-w-[110px]"
                                                            >
                                                                {activeIssueFormId === item._id && logType === 'RETURN' ? 'Cancel' : 'Return'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Laser Return Notification */}
                                                    {item.laserreturn_qty > 0 && (() => {
                                                        const foundDept = departments.find(d =>
                                                            (d._id?.toString() === item.department?.toString()) ||
                                                            (d.id?.toString() === item.department?.toString())
                                                        );
                                                        const deptLabel = foundDept ? foundDept.name : 'Laser';
                                                        return (
                                                            <div className="bg-amber-50 px-10 py-3 border-y border-amber-100 flex justify-between items-center">
                                                                <p className="text-xs font-black text-amber-700 italic uppercase tracking-widest">
                                                                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                                                                    {deptLabel} Return: {item.laserreturn_qty} QTY
                                                                </p>
                                                                <button
                                                                    onClick={() => handleLaserReturn(item._id, item.laserreturn_qty)}
                                                                    disabled={isIssuing === item._id || job.is_on_hold}
                                                                    className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-6 py-2 rounded-full shadow-md italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                                                                >
                                                                    {isIssuing === item._id ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Go Ahead'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* History Logs */}
                                                    {(item.logs || []).length > 0 && (
                                                        <div className="px-10 pb-4 space-y-3">
                                                            {item.logs.map((log, lidx) => (
                                                                <div key={lidx} className={`relative pl-8 py-2 border-l-[6px] ${log.type === 'ISSUE' ? 'border-[#10a37f]' : 'border-[#f59e0b]'} bg-slate-50/50 rounded-r-2xl`}>
                                                                    <div className="flex justify-between items-center pr-8">
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-[#3b82f6] italic uppercase tracking-widest leading-none mb-1">
                                                                                DEPT: {log.dept}
                                                                            </p>
                                                                            <p className="text-xl font-[1000] italic text-[#1e293b] uppercase leading-none">
                                                                                {log.recipient}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className={`text-4xl font-[1000] italic leading-none ${log.type === 'ISSUE' ? 'text-[#10a37f]' : 'text-[#f59e0b]'}`}>
                                                                                {log.type === 'ISSUE' ? '+' : '-'}{log.qty}
                                                                            </p>
                                                                            <p className="text-[8px] font-black text-slate-400 italic uppercase mt-1 tracking-tighter">
                                                                                {new Date(log.created_at || Date.now()).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Inline Issue Form */}
                                                    {activeIssueFormId === item._id && (
                                                        <div className="p-8 bg-[#f8fbff] border-l-[6px] border-[#3b82f6] m-4 rounded-[2rem] shadow-[inset_0_2px_10px_rgba(59,130,246,0.05),0_10px_30px_rgba(0,0,0,0.05)] transform transition-all animate-in slide-in-from-top-2 duration-300">
                                                            <div className="flex flex-wrap items-end gap-6">
                                                                <div className="flex-1 space-y-2">
                                                                    <label className="text-[10px] font-black text-[#3b82f6] italic uppercase tracking-widest block ml-4">Department</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={issueData.dept}
                                                                            onChange={(e) => handleDeptChange(e.target.value)}
                                                                            className="w-full bg-white border-0 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-[#3b82f6] transition-all"
                                                                        >
                                                                            <option>-- SELECT --</option>
                                                                            {departments.map((dept) => (
                                                                                <option key={dept.id} value={dept.name}>{dept.name.toUpperCase()}</option>
                                                                            ))}
                                                                        </select>
                                                                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 space-y-2">
                                                                    <label className="text-[10px] font-black text-[#3b82f6] italic uppercase tracking-widest block ml-4">Recipient</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={issueData.recipient}
                                                                            onChange={(e) => setIssueData({ ...issueData, recipient: e.target.value })}
                                                                            className="w-full bg-white border-0 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-[#3b82f6] transition-all"
                                                                        >
                                                                            <option>-- SELECT --</option>
                                                                            {users
                                                                                .filter(u => {
                                                                                    if (issueData.dept === '-- SELECT --') return false;
                                                                                    return u.department_id?.name === issueData.dept || u.department_name === issueData.dept;
                                                                                })
                                                                                .map((user) => {
                                                                                    const displayName = (user.name || `${user.first_name || ''} ${user.last_name || ''}`).trim() || 'Unknown User';
                                                                                    return (
                                                                                        <option key={user.id || user._id} value={displayName}>
                                                                                            {displayName.toUpperCase()}
                                                                                        </option>
                                                                                    );
                                                                                })}
                                                                        </select>
                                                                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                                                                    </div>
                                                                </div>

                                                                <div className="w-24 space-y-2">
                                                                    <label className="text-[10px] font-black text-[#3b82f6] italic uppercase tracking-widest block text-center">Qty Logged</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={logType === 'ISSUE' ? netBalance : maxReturn}
                                                                        value={issueData.qty}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            const max = logType === 'ISSUE' ? netBalance : maxReturn;
                                                                            if (val === '') {
                                                                                setIssueData({ ...issueData, qty: '' });
                                                                            } else {
                                                                                const numVal = parseFloat(val);
                                                                                if (numVal >= 0) {
                                                                                    setIssueData({ ...issueData, qty: Math.min(numVal, max) });
                                                                                }
                                                                            }
                                                                        }}
                                                                        className={`w-full bg-white border-0 rounded-2xl p-4 text-center text-sm font-[1000] italic ${parseFloat(issueData.qty) > (logType === 'ISSUE' ? netBalance : maxReturn) ? 'text-red-600 ring-2 ring-red-500' : 'text-slate-700'} shadow-sm focus:ring-2 focus:ring-[#3b82f6] transition-all`}
                                                                    />
                                                </div>

                                                                <button
                                                                    onClick={() => handleLogIssue(item._id)}
                                                                    disabled={
                                                                        isIssuing === item._id ||
                                                                        issueData.dept === '-- SELECT --' ||
                                                                        issueData.recipient === '-- SELECT --' ||
                                                                        !issueData.qty ||
                                                                        parseFloat(issueData.qty) <= 0 ||
                                                                        parseFloat(issueData.qty) > (logType === 'ISSUE' ? netBalance : maxReturn) ||
                                                                        (logType === 'RETURN' && item.laserreturn_qty > 0) ||
                                                                        (logType === 'ISSUE' && stockData[item._id] && stockData[item._id].stock !== 'N/A' && (
                                                                            parseFloat(stockData[item._id].stock || 0) <= 0 ||
                                                                            parseFloat(issueData.qty) > parseFloat(stockData[item._id].stock || 0)
                                                                        ))
                                                                    }
                                                                    className={`bg-[#0f172a] hover:bg-black text-white text-[11px] font-black px-10 py-4 rounded-2xl shadow-lg italic uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                                                >
                                                                    {isIssuing === item._id ? (
                                                                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                                                                    ) : (
                                                                        logType === 'ISSUE' ? 'Auth Log Issue' : 'Auth Log Return'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                        {(!job.materials || job.materials.length === 0) && (
                                            <div className="p-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">
                                                No Bill of Materials Defined
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-2 gap-4 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] z-10">
                        <button
                            onClick={handlePrint}
                            className="bg-[#1e293b] hover:bg-black text-white py-4 rounded-2xl font-black italic text-[10px] uppercase flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
                        >
                            <i className="fa-solid fa-print"></i>
                            Print Gate Pass
                        </button>
                        <button
                            onClick={handleAuthorize}
                            disabled={!isAllIssued || isAuthorizing || job.status === 'ISSUED' || job.is_on_hold}
                            className={`bg-[#10a352] hover:bg-[#0e8a45] text-white py-4 rounded-2xl font-black italic text-[10px] uppercase flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
                        >
                            {isAuthorizing ? (
                                <i className="fa-solid fa-circle-notch animate-spin"></i>
                            ) : (
                                <i className="fa-solid fa-circle-check"></i>
                            )}
                            Authorize Completion
                        </button>
                    </div>
                </div>


                {/* Escalation Modal */}
                {showEscalateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="p-5 px-8 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-[#334155]">Escalate {job.sub_job_no}</h3>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#334155] block">Escalation Reason</label>
                                    <textarea
                                        value={escalateRemark}
                                        onChange={(e) => setEscalateRemark(e.target.value)}
                                        placeholder="Reason..."
                                        className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all min-h-[160px] outline-none italic"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 px-8 border-t border-slate-50 flex justify-end items-center gap-4 bg-slate-50/30">
                                <button
                                    onClick={() => {
                                        setShowEscalateModal(false);
                                        setEscalateRemark('');
                                    }}
                                    className="text-slate-500 hover:text-slate-800 text-sm font-bold px-4 py-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEscalate}
                                    disabled={isEscalating || !escalateRemark.trim()}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm ${!escalateRemark.trim()
                                        ? 'bg-[#cbd5e1] text-white cursor-not-allowed'
                                        : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'
                                        }`}
                                >
                                    {isEscalating ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,800;1,800;0,1000;1,1000&display=swap');
                h2, p, span, button, div {
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                }
            `}</style>
            </div>
        </>
    );
};

export default StoreMaterialIssuePanel;
