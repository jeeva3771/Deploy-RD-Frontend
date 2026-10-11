import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchExtraMaterialEMRListThunk,
    approveExtraMaterialEMRThunk,
    rejectExtraMaterialEMRThunk,
    confirmEMRReceiptThunk
} from "../../reducer/shopFloorEMRReducer";
import {
    fetchRequisitionsThunk,
    updateRequisitionStatusThunk
} from "../../reducer/shopFloorRequisitionReducer";
import { fetchItemsStockByIds } from "../../reducer/inventory/itemReducer";
import { fetchCustomItemsStockByIds } from "../../reducer/inventory/customItemReducer";
import { toast } from "react-toastify";
import {
    Check,
    X,
    Search,
    Clock,
    AlertTriangle,
    RefreshCw,
    Sparkles,
    Send,
    Eye,
    Printer,
    Share2,
    Filter,
    User,
    Calendar,
    Flame,
    Layers,
    ClipboardList,
    FileText
} from "lucide-react";

const ExtraMaterialRequest = () => {
    const dispatch = useDispatch();

    // Redux selectors
    const { emrs, loading: emrLoading } = useSelector((state) => state.shopfloorEMR);
    const { requisitions, loading: reqLoading } = useSelector((state) => state.shopfloorRequisition);

    // Active Section Toggle: 'EMR' or 'REQUISITION'
    const [activeSection, setActiveSection] = useState("EMR");

    // EMR local UI states
    const [emrSearchTerm, setEmrSearchTerm] = useState("");
    const [emrActiveTab, setEmrActiveTab] = useState("PENDING"); // 'PENDING', 'APPROVED', 'RECEIVED', 'REJECTED', 'ALL'
    const [isFetchingStock, setIsFetchingStock] = useState(false);
    const [stockData, setStockData] = useState({});
    const [selectedEmrForModal, setSelectedEmrForModal] = useState(null);

    // Requisition local UI states
    const [reqSearchTerm, setReqSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("ALL"); // ALL, Extra Material, Consumable, Reprocess, Excess Return
    const [reqActiveTab, setReqActiveTab] = useState("PENDING"); // PENDING, ISSUED, RECEIVED, REJECTED, ALL
    const [selectedReqForView, setSelectedReqForView] = useState(null);

    // Requisition Issue Modal States
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [reqToIssue, setReqToIssue] = useState(null);
    const [issueQtyInput, setIssueQtyInput] = useState("");

    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Fetch Stock for both EMR materials and Requisition items
    const fetchCurrentStock = useCallback(async (emrRecords = [], reqRecords = []) => {
        if ((!emrRecords || emrRecords.length === 0) && (!reqRecords || reqRecords.length === 0)) return;
        setIsFetchingStock(true);
        try {
            const emrMatIds = emrRecords.flatMap(emr => emr.materials?.map(m => m.material_id) || []).filter(Boolean);
            const reqMatIds = reqRecords.map(req => req.item_id).filter(Boolean);
            const allMaterialIds = [...emrMatIds, ...reqMatIds];
            const uniqueIds = Array.from(new Set(allMaterialIds));

            if (uniqueIds.length === 0) return;

            let standardStock = [];
            let customStock = [];

            const promises = [];
            promises.push(
                dispatch(fetchItemsStockByIds(uniqueIds)).unwrap()
                    .then(response => {
                        standardStock = response?.data || [];
                    })
                    .catch(() => { })
            );
            promises.push(
                dispatch(fetchCustomItemsStockByIds(uniqueIds)).unwrap()
                    .then(response => {
                        customStock = response?.data || [];
                    })
                    .catch(() => { })
            );

            await Promise.all(promises);

            const inventoryItems = [...standardStock, ...customStock];
            const newStockData = {};

            // 1. Process EMRs
            emrRecords.forEach(emr => {
                const matId = emr.materials?.[0]?.material_id;
                if (!matId) {
                    newStockData[emr._id] = 0;
                    return;
                }

                const item = inventoryItems.find(i => i._id === matId || i.id === matId);
                if (item) {
                    let stockCount = item.stock || 0;
                    const matSize = emr.sheet_size;

                    if (item.item_type === 'sheet' && matSize && item.size_wise_stock && item.stock_sizes) {
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
                            }
                        }
                    }
                    newStockData[emr._id] = stockCount;
                } else {
                    newStockData[emr._id] = 0;
                }
            });

            // 2. Process Requisitions
            reqRecords.forEach(req => {
                const matId = req.item_id;
                if (!matId) {
                    newStockData[req._id] = 0;
                    return;
                }

                const item = inventoryItems.find(i => i._id === matId || i.id === matId);
                if (item) {
                    let stockCount = item.stock || 0;
                    const matSize = req.size_name;

                    if (item.item_type === 'sheet' && matSize && item.size_wise_stock && item.stock_sizes) {
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
                            }
                        }
                    }
                    newStockData[req._id] = stockCount;
                } else {
                    newStockData[req._id] = 0;
                }
            });

            setStockData(newStockData);
        } catch (err) {
            console.error("Failed to fetch stock in EMR/Requisition list", err);
        } finally {
            setIsFetchingStock(false);
        }
    }, [dispatch]);

    // Global Load
    const fetchData = useCallback(async () => {
        try {
            const [emrRes, reqRes] = await Promise.all([
                dispatch(fetchExtraMaterialEMRListThunk()).unwrap(),
                dispatch(fetchRequisitionsThunk()).unwrap()
            ]);
            const emrsList = emrRes?.data || [];
            const reqsList = reqRes?.data || [];
            fetchCurrentStock(emrsList, reqsList);
        } catch (err) {
            toast.error(err?.message || "Failed to load records");
        }
    }, [dispatch, fetchCurrentStock]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- EMR Actions ---
    const handleEmrApprove = async (emrId) => {
        if (actionLoadingId) return;
        try {
            setActionLoadingId(emrId);
            const response = await dispatch(approveExtraMaterialEMRThunk(emrId)).unwrap();
            if (response?.success) {
                toast.success("Extra material request approved successfully!");
                fetchData();
            } else {
                toast.error(response?.message || "Approval failed");
            }
        } catch (err) {
            toast.error(err?.message || "Approval failed");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleEmrReject = async (emrId) => {
        if (actionLoadingId) return;
        try {
            setActionLoadingId(emrId);
            const response = await dispatch(rejectExtraMaterialEMRThunk(emrId)).unwrap();
            if (response?.success) {
                toast.success("Extra material request rejected successfully!");
                fetchData();
            } else {
                toast.error(response?.message || "Rejection failed");
            }
        } catch (err) {
            toast.error(err?.message || "Rejection failed");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleEmrConfirmReceipt = async (emrId) => {
        if (actionLoadingId) return;
        try {
            setActionLoadingId(emrId);
            const response = await dispatch(confirmEMRReceiptThunk(emrId)).unwrap();
            if (response?.success) {
                toast.success("Receipt confirmed successfully!");
                fetchData();
            } else {
                toast.error(response?.message || "Confirmation failed");
            }
        } catch (err) {
            toast.error(err?.message || "Confirmation failed");
        } finally {
            setActionLoadingId(null);
        }
    };

    // --- Requisition Actions ---
    const handleOpenIssueModal = (req) => {
        setReqToIssue(req);
        const remaining = req.qty - (req.issued_qty || 0);
        setIssueQtyInput(remaining);
        setShowIssueModal(true);
    };

    const handleIssueSubmit = async () => {
        if (!issueQtyInput || isNaN(issueQtyInput) || parseFloat(issueQtyInput) <= 0) {
            toast.error("Please enter a valid quantity to issue");
            return;
        }

        const inputQty = parseFloat(issueQtyInput);
        const remainingQty = reqToIssue.qty - (reqToIssue.issued_qty || 0);

        if (inputQty > remainingQty) {
            toast.error(`Issued quantity cannot exceed remaining quantity of ${remainingQty}`);
            return;
        }

        const availStock = stockData[reqToIssue._id] || 0;
        if (inputQty > availStock) {
            toast.error(`Insufficient stock! Only ${availStock} available in master inventory.`);
            return;
        }

        const prevIssued = reqToIssue.issued_qty || 0;
        const cumulativeIssued = prevIssued + inputQty;
        const targetStatus = cumulativeIssued === reqToIssue.qty ? 'ISSUED' : 'PARTIAL';

        try {
            setActionLoadingId(reqToIssue._id);
            const res = await dispatch(updateRequisitionStatusThunk({
                id: reqToIssue._id,
                status: targetStatus,
                issued_qty: cumulativeIssued
            })).unwrap();

            if (res.success) {
                toast.success(`Requisition successfully marked as ${targetStatus}`);
                setShowIssueModal(false);
                setReqToIssue(null);
                fetchData();
            } else {
                toast.error(res.message || "Failed to update requisition status");
            }
        } catch (err) {
            toast.error(err?.message || "Failed to issue requisition");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReqReject = async (reqId) => {
        if (!window.confirm("Are you sure you want to reject this requisition?")) return;

        try {
            setActionLoadingId(reqId);
            const res = await dispatch(updateRequisitionStatusThunk({
                id: reqId,
                status: 'REJECTED'
            })).unwrap();

            if (res.success) {
                toast.success("Requisition rejected successfully");
                fetchData();
            } else {
                toast.error(res.message || "Failed to reject requisition");
            }
        } catch (err) {
            toast.error(err?.message || "Failed to reject requisition");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Print Requisition Voucher
    const handlePrintReq = (req) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Requisition Voucher - ${req.requisition_no}</title>
                <style>
                    body {
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 40px;
                        color: #334155;
                        line-height: 1.5;
                    }
                    .header {
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                        text-align: center;
                    }
                    .title {
                        font-size: 24px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: #1e293b;
                        margin: 0;
                    }
                    .subtitle {
                        font-size: 11px;
                        font-weight: 600;
                        color: #94a3b8;
                        text-transform: uppercase;
                        letter-spacing: 0.15em;
                        margin-top: 5px;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-cols: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 40px;
                    }
                    .detail-item {
                        background: #f8fafc;
                        border: 1px solid #f1f5f9;
                        border-radius: 12px;
                        padding: 15px;
                    }
                    .label {
                        font-size: 9px;
                        font-weight: 800;
                        color: #94a3b8;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        margin-bottom: 5px;
                    }
                    .value {
                        font-size: 14px;
                        font-weight: 700;
                        color: #334155;
                    }
                    .urgent-badge {
                        display: inline-block;
                        background: #fee2e2;
                        color: #ef4444;
                        font-size: 10px;
                        font-weight: 800;
                        padding: 4px 10px;
                        border-radius: 6px;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        margin-top: 10px;
                    }
                    .remarks-box {
                        background: #f8fafc;
                        border-left: 4px solid #cbd5e1;
                        padding: 15px;
                        border-radius: 0 12px 12px 0;
                        margin-bottom: 40px;
                    }
                    .footer-sig {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 80px;
                    }
                    .sig-line {
                        width: 200px;
                        border-top: 1px solid #cbd5e1;
                        text-align: center;
                        padding-top: 10px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        color: #94a3b8;
                    }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">REQUISITION VOUCHER</h1>
                    <div class="subtitle">Laser Studio Inventory Management System</div>
                </div>

                <div class="details-grid">
                    <div class="detail-item">
                        <div class="label">Requisition Number</div>
                        <div class="value">${req.requisition_no}</div>
                        ${req.urgent ? '<div class="urgent-badge">🚨 URGENT</div>' : ''}
                    </div>
                    <div class="detail-item">
                        <div class="label">Requisition Type</div>
                        <div class="value">${req.category}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Job Number</div>
                        <div class="value">${req.job_no || 'General'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Requested By</div>
                        <div class="value">${req.requested_by} (${req.department || 'Laser'})</div>
                    </div>
                    <div class="detail-item" style="grid-column: span 2">
                        <div class="label">Item Requested</div>
                        <div class="value" style="font-size: 16px; color: #1e293b;">${req.item_description} ${req.size_name ? `(${req.size_name})` : ''}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Requested Qty</div>
                        <div class="value">${req.qty} ${req.unit}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label">Issued Qty</div>
                        <div class="value">${req.issued_qty || '--'} ${req.unit}</div>
                    </div>
                </div>

                ${req.remarks ? `
                <div class="remarks-box">
                    <div class="label">Remarks / Instructions</div>
                    <div class="value" style="font-weight: 500; font-style: italic;">${req.remarks}</div>
                </div>
                ` : ''}

                <div class="footer-sig">
                    <div>
                        <div style="height: 40px;"></div>
                        <div class="sig-line">Requested By</div>
                    </div>
                    <div>
                        <div style="height: 40px;"></div>
                        <div class="sig-line">Issued By (Stores)</div>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Share Requisition details on WhatsApp
    const handleWhatsAppShareReq = (req) => {
        const urgentPrefix = req.urgent ? '🚨 *URGENT REQUISITION* 🚨\n' : '📋 *MATERIAL REQUISITION*\n';
        const message = `${urgentPrefix}` +
            `---------------------------------\n` +
            `*Req No:* ${req.requisition_no}\n` +
            `*Type:* ${req.category === 'Raw Material' ? 'Extra Material' : req.type}\n` +
            `*Job No:* ${req.job_no || 'General'}\n` +
            `*Item:* ${req.item_description} ${req.size_name ? `(${req.size_name})` : ''}\n` +
            `*Qty:* ${req.qty} ${req.unit}\n` +
            `*Category:* ${req.category || 'N/A'}\n` +
            `*Status:* ${req.status}\n` +
            `*Requested By:* ${req.requested_by} (${req.department || 'Laser'})\n` +
            `*Date:* ${req.created_at || ''}\n` +
            (req.remarks ? `*Remarks:* ${req.remarks}\n` : '') +
            `---------------------------------\n` +
            `*Laser Studio Inventory Management*`;
        const encodedText = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    // --- Filter Logics ---
    const filteredEmrs = React.useMemo(() => {
        let list = emrs || [];
        if (emrSearchTerm.trim()) {
            const query = emrSearchTerm.toLowerCase();
            list = list.filter(emr =>
                (emr.job_no || "").toLowerCase().includes(query) ||
                (emr.sub_job_no || "").toLowerCase().includes(query) ||
                (emr.materials?.[0]?.material_name || "").toLowerCase().includes(query) ||
                (emr.reason || "").toLowerCase().includes(query) ||
                (emr.requested_by?.name || "").toLowerCase().includes(query)
            );
        }

        if (emrActiveTab !== "ALL") {
            if (emrActiveTab === "APPROVED") {
                list = list.filter(emr => emr.status === "APPROVED" || emr.status === "ISSUED");
            } else {
                list = list.filter(emr => emr.status === emrActiveTab);
            }
        }
        return list;
    }, [emrs, emrSearchTerm, emrActiveTab]);

    const filteredRequisitions = React.useMemo(() => {
        let list = requisitions || [];
        if (reqSearchTerm.trim()) {
            const query = reqSearchTerm.toLowerCase();
            list = list.filter(r =>
                (r.requisition_no || '').toLowerCase().includes(query) ||
                (r.job_no || '').toLowerCase().includes(query) ||
                (r.item_description || '').toLowerCase().includes(query) ||
                (r.category || '').toLowerCase().includes(query) ||
                (r.requested_by || '').toLowerCase().includes(query) ||
                (r.department || '').toLowerCase().includes(query)
            );
        }

        if (selectedType !== 'ALL') {
            list = list.filter(r => r.type === selectedType);
        }

        if (reqActiveTab !== 'ALL') {
            if (reqActiveTab === 'ISSUED') {
                list = list.filter(r => r.status === 'ISSUED' || r.status === 'PARTIAL');
            } else {
                list = list.filter(r => r.status === reqActiveTab);
            }
        }
        return list;
    }, [requisitions, reqSearchTerm, selectedType, reqActiveTab]);

    // --- Statistics ---
    const emrStats = React.useMemo(() => {
        const list = emrs || [];
        return {
            total: list.length,
            pending: list.filter(e => e.status === "PENDING").length,
            approved: list.filter(e => e.status === "APPROVED" || e.status === "ISSUED").length,
            completed: list.filter(e => e.status === "RECEIVED").length,
            urgent: list.filter(e => e.urgent && e.status === "PENDING").length
        };
    }, [emrs]);

    const reqStats = React.useMemo(() => {
        const list = requisitions || [];
        return {
            total: list.length,
            pending: list.filter(r => r.status === 'PENDING').length,
            issued: list.filter(r => r.status === 'ISSUED' || r.status === 'PARTIAL').length,
            received: list.filter(r => r.status === 'RECEIVED').length,
            rejected: list.filter(r => r.status === 'REJECTED').length,
            urgent: list.filter(r => r.urgent && r.status === 'PENDING').length
        };
    }, [requisitions]);

    const isGlobalLoading = emrLoading || reqLoading;

    return (
        <div className="bg-white p-6 mt-5" style={{ minHeight: "calc(100vh - 200px)" }}>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-2 gap-4">
                <div>
                    <h1 className="text-3xl font-[1000] text-[#111827] tracking-tighter uppercase leading-none">
                        EXTRA MATERIAL & REQUISITIONS
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        Manage, authorize and issue EMR sheet requests and general shopfloor requisitions
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 hover:bg-slate-50 border-2 border-slate-200 rounded-lg transition-all active:scale-95 text-slate-400 hover:text-indigo-600 h-[38px] w-[38px] flex items-center justify-center shadow-sm self-end md:self-auto"
                    title="Reload Data"
                >
                    <RefreshCw className={`w-4 h-4 ${isGlobalLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Premium Section Switcher Tab Group */}
            <div className="flex bg-[#edf2f7] p-1 rounded-xl mb-8 border border-slate-200/60 shadow-sm gap-1 w-full">
                <button
                    onClick={() => setActiveSection("EMR")}
                    className={`flex-1 py-3 px-4 rounded-lg font-[900] text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeSection === "EMR"
                        ? "bg-white text-[#581c87] shadow-sm border border-slate-200/40"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Layers className={`w-4 h-4 ${activeSection === "EMR" ? "text-[#581c87]" : "text-slate-400"}`} />
                    <span>Extra Materials (EMR)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeSection === "EMR" ? "bg-purple-100 text-[#581c87]" : "bg-slate-200 text-slate-500"
                        }`}>{emrStats.pending}</span>
                </button>
                <button
                    onClick={() => setActiveSection("REQUISITION")}
                    className={`flex-1 py-3 px-4 rounded-lg font-[900] text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeSection === "REQUISITION"
                        ? "bg-white text-[#581c87] shadow-sm border border-slate-200/40"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <ClipboardList className={`w-4 h-4 ${activeSection === "REQUISITION" ? "text-[#581c87]" : "text-slate-400"}`} />
                    <span>Requisitions</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeSection === "REQUISITION" ? "bg-purple-100 text-[#581c87]" : "bg-slate-200 text-slate-500"
                        }`}>{reqStats.pending}</span>
                </button>
            </div>

            {/* ========================================================================= */}
            {/* EMR SECTION */}
            {/* ========================================================================= */}
            {activeSection === "EMR" && (
                <div className="animate-in fade-in duration-300">
                    {/* Controls row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative group max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="SEARCH JOB NO, MATERIAL, REASON..."
                                    value={emrSearchTerm}
                                    onChange={(e) => setEmrSearchTerm(e.target.value)}
                                    className="bg-white border-2 border-slate-200 rounded py-2 pl-9 pr-10 w-full text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-all shadow-sm h-[38px]"
                                />
                                {emrSearchTerm && (
                                    <button onClick={() => setEmrSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total EMRs</span>
                                <h3 className="text-2xl font-[1000] text-slate-800 leading-none mt-2">{emrStats.total}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pending Store</span>
                                <h3 className="text-2xl font-[1000] text-amber-700 leading-none mt-2">{emrStats.pending}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
                            <div>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Urgent Pending</span>
                                <h3 className="text-2xl font-[1000] text-rose-700 leading-none mt-2">{emrStats.urgent}</h3>
                            </div>
                            <div className={`w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center ${emrStats.urgent > 0 ? 'animate-pulse' : ''}`}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Approved / Issued</span>
                                <h3 className="text-2xl font-[1000] text-blue-700 leading-none mt-2">{emrStats.approved}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Check className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Completed</span>
                                <h3 className="text-2xl font-[1000] text-emerald-700 leading-none mt-2">{emrStats.completed}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Custom Tabs Navigation */}
                    <div className="flex flex-wrap items-center border-b border-slate-100 mb-8 gap-2">
                        {[
                            { id: "PENDING", label: "Pending Approval", count: emrStats.pending, activeColor: "border-amber-500 text-amber-600" },
                            { id: "APPROVED", label: "Approved / Issued", count: emrStats.approved, activeColor: "border-blue-500 text-blue-600" },
                            { id: "RECEIVED", label: "Completed", count: emrStats.completed, activeColor: "border-emerald-500 text-emerald-600" },
                            { id: "REJECTED", label: "Rejected", count: emrs.filter(e => e.status === "REJECTED").length, activeColor: "border-rose-500 text-rose-600" },
                            { id: "ALL", label: "All Requests", count: emrStats.total, activeColor: "border-slate-800 text-slate-800" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setEmrActiveTab(tab.id)}
                                className={`pb-4 px-4 font-black uppercase tracking-wider text-xs border-b-4 transition-all relative flex items-center gap-2 ${emrActiveTab === tab.id
                                    ? `${tab.activeColor} opacity-100 font-black`
                                    : "border-transparent text-slate-400 hover:text-slate-600 opacity-80"
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${emrActiveTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* EMR List Content */}
                    <div>
                        {emrLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Loading EMR Records...</span>
                            </div>
                        ) : filteredEmrs.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] py-24 text-center flex flex-col items-center justify-center bg-slate-50/20 max-w-lg mx-auto">
                                <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">No Requests Found</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs leading-relaxed">
                                    There are currently no extra material requests raised in this category.
                                </p>
                            </div>
                        ) : emrActiveTab === "ALL" ? (
                            // Historical Ledger Table
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">JOB / SUB JOB</th>
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">MATERIAL REQUISITIONED</th>
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CURRENT STOCK</th>
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">SPECS & QTY</th>
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">REQUEST DETAILS</th>
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                                                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredEmrs.map((emr) => (
                                                <tr key={emr._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-black text-slate-800">
                                                                {emr.job_no} {emr.sub_job_no !== 'N/A' ? `(${emr.sub_job_no})` : ''}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                                Category: {emr.category || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-black text-slate-700">
                                                                {emr.materials?.[0]?.material_name || "Unspecified Material"}
                                                            </span>
                                                            {emr.materials?.length > 1 && (
                                                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">
                                                                    + {emr.materials.length - 1} other materials
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="text-[13px] font-bold text-slate-700">
                                                            {stockData[emr._id] !== undefined ? stockData[emr._id] : "--"}
                                                        </span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[12px] font-black text-slate-800">
                                                                    {emr.qty} {emr.unit}
                                                                </span>
                                                                {emr.urgent && (
                                                                    <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                                        URGENT
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                                Size: {emr.sheet_size}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-slate-600 block max-w-xs truncate" title={emr.reason}>
                                                                Reason: {emr.reason}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                                                By: {emr.requested_by?.name || "Operator"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {(() => {
                                                            let badgeStyle = "bg-slate-100 text-slate-500";
                                                            if (emr.status === 'PENDING') badgeStyle = "bg-amber-50 text-amber-600 border border-amber-200/50";
                                                            if (emr.status === 'APPROVED' || emr.status === 'ISSUED') badgeStyle = "bg-blue-50 text-blue-600 border border-blue-200/50";
                                                            if (emr.status === 'RECEIVED') badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
                                                            if (emr.status === 'REJECTED') badgeStyle = "bg-rose-50 text-rose-600 border border-rose-200/50";

                                                            return (
                                                                <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                                                                    {emr.status === 'ISSUED' ? 'APPROVED' : emr.status}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {emr.status === 'PENDING' ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleEmrApprove(emr._id)}
                                                                    disabled={!!actionLoadingId}
                                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEmrReject(emr._id)}
                                                                    disabled={!!actionLoadingId}
                                                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                                                                >
                                                                    <X className="w-3.5 h-3.5" /> Reject
                                                                </button>
                                                            </div>
                                                        ) : emr.status === 'APPROVED' || emr.status === 'ISSUED' ? (
                                                            <button
                                                                onClick={() => handleEmrConfirmReceipt(emr._id)}
                                                                disabled={!!actionLoadingId}
                                                                className="px-3 py-1.5 bg-[#10a37f] hover:bg-[#0e8f6e] disabled:bg-[#a3ebd6] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm mx-auto"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Confirm
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            // Kanban / Cards View
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredEmrs.map((emr) => (
                                    <div
                                        key={emr._id}
                                        className={`bg-white border-2 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between group h-full
                                            ${emr.urgent && emr.status === 'PENDING' ? 'border-rose-500 shadow-rose-50' : 'border-slate-100'}
                                        `}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 h-full ${emr.urgent && emr.status === 'PENDING' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`}></div>

                                        <div>
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4 pl-2">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Details</span>
                                                    <h4 className="text-lg font-[1000] text-slate-800 leading-none mt-1">
                                                        {emr.job_no}
                                                    </h4>
                                                    {emr.sub_job_no !== 'N/A' && (
                                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg mt-1.5 inline-block uppercase">
                                                            Sub-Job: {emr.sub_job_no}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    {emr.urgent && emr.status === 'PENDING' && (
                                                        <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-pulse shadow-md uppercase tracking-wider mb-2">
                                                            URGENT
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">
                                                        {emr.category || 'Standard'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Material info */}
                                            {emr?.materials && (
                                                (() => {
                                                    const firstMaterial = emr.materials[0];
                                                    if (!firstMaterial) return null;
                                                    return (
                                                        <>
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-3 ml-2">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Material Requested</span>
                                                                <h5 className="text-[12px] font-black text-slate-700 uppercase leading-snug">
                                                                    {firstMaterial?.material_name}
                                                                </h5>
                                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                                                    <div>
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Size</span>
                                                                        <span className="text-[10px] font-black text-slate-600 mt-1 block uppercase leading-none">{emr.sheet_size || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Curr Stock</span>
                                                                        <span className="text-[11px] font-bold text-slate-700 mt-1 block leading-none">{firstMaterial.stock}</span>
                                                                    </div>
                                                                    <div className="bg-white border border-slate-150 rounded-xl px-3 py-1.5 text-center shadow-sm">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Qty</span>
                                                                        <span className="text-[13px] font-[1000] text-indigo-600 mt-1 block leading-none">{emr.qty} {emr.unit}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {emr.materials.length > 1 && (
                                                                <button
                                                                    onClick={() => setSelectedEmrForModal(emr)}
                                                                    className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl uppercase tracking-wider mb-4 ml-2 transition-all inline-flex items-center gap-1.5 border border-indigo-100"
                                                                >
                                                                    + {emr.materials.length - 1} more items
                                                                </button>
                                                            )}
                                                        </>
                                                    );
                                                })()
                                            )}

                                            {/* Reason & Requester */}
                                            <div className="space-y-2 mb-6 pl-2">
                                                <div className="flex items-start gap-1.5">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Reason:</span>
                                                    <span className="text-[10px] font-bold text-slate-600 leading-tight block">{emr.reason}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Requester:</span>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{emr.requested_by?.name || "Shopfloor Operator"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="pl-2 pt-2 border-t border-slate-50">
                                            {emr.status === 'PENDING' ? (
                                                <div className="flex gap-2.5">
                                                    <button
                                                        onClick={() => handleEmrReject(emr._id)}
                                                        disabled={!!actionLoadingId}
                                                        className="flex-1 py-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm border border-rose-100"
                                                    >
                                                        {actionLoadingId === emr._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Reject</>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEmrApprove(emr._id)}
                                                        disabled={!!actionLoadingId}
                                                        className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                                    >
                                                        {actionLoadingId === emr._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Approve</>}
                                                    </button>
                                                </div>
                                            ) : emr.status === 'APPROVED' || emr.status === 'ISSUED' ? (
                                                <button
                                                    onClick={() => handleEmrConfirmReceipt(emr._id)}
                                                    disabled={!!actionLoadingId}
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                                >
                                                    {actionLoadingId === emr._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Confirm Receipt</>}
                                                </button>
                                            ) : emr.status === 'RECEIVED' ? (
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                                    <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                        <Check className="w-4 h-4 text-emerald-500" /> Completed & Received
                                                    </span>
                                                </div>
                                            ) : emr.status === 'REJECTED' ? (
                                                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                                                    <span className="text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                        <X className="w-4 h-4 text-rose-500" /> Request Rejected
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* REQUISITION SECTION */}
            {/* ========================================================================= */}
            {activeSection === "REQUISITION" && (
                <div className="animate-in fade-in duration-300">
                    {/* Controls row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div className="relative group flex items-center bg-white border-2 border-slate-200 rounded px-3 h-[38px] shadow-sm">
                                <Filter className="text-slate-400 w-3.5 h-3.5 mr-2" />
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="bg-transparent text-[9px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4"
                                >
                                    <option value="ALL">ALL TYPES</option>
                                    <option value="Extra Material">Extra Material</option>
                                    <option value="Consumable">Consumables / General</option>
                                    <option value="Reprocess">Reprocess Reqs</option>
                                    <option value="Excess Return">Excess Return</option>
                                </select>
                            </div>

                            <div className="relative group flex-1 md:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="SEARCH REQ NO, JOB NO, ITEM OR REQUESTER..."
                                    value={reqSearchTerm}
                                    onChange={(e) => setReqSearchTerm(e.target.value)}
                                    className="bg-white border-2 border-slate-200 rounded py-2 pl-9 pr-10 w-full md:w-80 text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-all shadow-sm h-[38px]"
                                />
                                {reqSearchTerm && (
                                    <button onClick={() => setReqSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Requests</span>
                                <h3 className="text-2xl font-[1000] text-slate-800 leading-none mt-2">{reqStats.total}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pending Stores</span>
                                <h3 className="text-2xl font-[1000] text-amber-700 leading-none mt-2">{reqStats.pending}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
                            <div>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Urgent Pending</span>
                                <h3 className="text-2xl font-[1000] text-rose-700 leading-none mt-2">{reqStats.urgent}</h3>
                            </div>
                            <div className={`w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center ${reqStats.urgent > 0 ? 'animate-pulse' : ''}`}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Issued</span>
                                <h3 className="text-2xl font-[1000] text-blue-700 leading-none mt-2">{reqStats.issued}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Check className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Completed</span>
                                <h3 className="text-2xl font-[1000] text-emerald-700 leading-none mt-2">{reqStats.received}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Custom Tabs Navigation */}
                    <div className="flex flex-wrap items-center border-b border-slate-100 mb-8 gap-2">
                        {[
                            { id: "PENDING", label: "Pending Approval", count: reqStats.pending, activeColor: "border-amber-500 text-amber-600" },
                            { id: "ISSUED", label: "Issued / Partial", count: reqStats.issued, activeColor: "border-blue-500 text-blue-600" },
                            { id: "RECEIVED", label: "Completed", count: reqStats.received, activeColor: "border-emerald-500 text-emerald-600" },
                            { id: "REJECTED", label: "Rejected", count: reqStats.rejected, activeColor: "border-rose-500 text-rose-600" },
                            { id: "ALL", label: "All Requests", count: reqStats.total, activeColor: "border-slate-800 text-slate-800" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setReqActiveTab(tab.id)}
                                className={`pb-4 px-4 font-black uppercase tracking-wider text-xs border-b-4 transition-all relative flex items-center gap-2 ${reqActiveTab === tab.id
                                    ? `${tab.activeColor} opacity-100 font-black`
                                    : "border-transparent text-slate-400 hover:text-slate-600 opacity-80"
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${reqActiveTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Requisitions List Content */}
                    <div>
                        {reqLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Loading Requisition Records...</span>
                            </div>
                        ) : filteredRequisitions.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] py-24 text-center flex flex-col items-center justify-center bg-slate-50/20 max-w-lg mx-auto">
                                <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">No Requisitions Found</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs leading-relaxed">
                                    There are currently no requisitions in this filter category.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                                {filteredRequisitions.map((req) => {
                                    let statusColor = "bg-slate-50 text-slate-600 border-slate-200";
                                    if (req.status === "PENDING") statusColor = "bg-amber-50 text-amber-600 border-amber-200";
                                    if (req.status === "ISSUED" || req.status === "PARTIAL") statusColor = "bg-blue-50 text-blue-600 border-blue-200";
                                    if (req.status === "RECEIVED") statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
                                    if (req.status === "REJECTED") statusColor = "bg-rose-50 text-rose-600 border-rose-200";

                                    return (
                                        <div
                                            key={req._id}
                                            className={`bg-white rounded-3xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden flex flex-col justify-between group h-full
                                                ${req.urgent ? 'border-amber-400 shadow-amber-50/50' : 'border-slate-100'}
                                            `}
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${req.urgent ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`}></div>

                                            <div>
                                                <div className="flex justify-between items-start mb-3 pl-2">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[11px] font-[1000] text-slate-800 uppercase tracking-tight">
                                                                {req.requisition_no}
                                                            </span>
                                                            {req.urgent && (
                                                                <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                                                    URGENT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                            {req.category}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setSelectedReqForView(req)}
                                                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-755 rounded-lg border border-slate-200 transition-all active:scale-95 shadow-sm"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className={`ml-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${statusColor} border`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-3 ml-2 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Job Ref</span>
                                                            <span className="text-[11px] font-black text-slate-800 mt-1 block uppercase leading-none truncate max-w-[120px]" title={req.job_no}>
                                                                {req.job_no || 'General'}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Category</span>
                                                            <span className="text-[10px] font-black text-indigo-600 mt-1 block uppercase leading-none">
                                                                {req.category || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-slate-100 pt-2">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Item Description</span>
                                                        <p className="text-[11px] font-black text-slate-700 uppercase leading-snug break-words">
                                                            {req.item_description} {req.size_name && `(${req.size_name})`}
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                        <div>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Requested</span>
                                                            <span className="text-[12px] font-black text-slate-800 mt-1 block leading-none">
                                                                {req.qty} {req.unit}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Available Stock</span>
                                                            <span className={`text-[12px] font-[1000] mt-1 block leading-none ${stockData[req._id] === undefined ? 'text-slate-400' :
                                                                    stockData[req._id] < (req.qty - (req.issued_qty || 0)) ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
                                                                }`}>
                                                                {stockData[req._id] !== undefined ? `${stockData[req._id]} ${req.unit}` : 'Loading...'}
                                                            </span>

                                                        </div>
                                                        {req.issued_qty > 0 && (
                                                            <div className="text-right">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Issued</span>
                                                                <span className="text-[12px] font-black text-emerald-600 mt-1 block leading-none">
                                                                    {req.issued_qty} {req.unit}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 ml-2 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span>By: {req.requested_by} ({req.department})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        <span>Date: {req.created_at || 'N/A'}</span>
                                                    </div>
                                                    {req.remarks && (
                                                        <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-2.5 mt-2 text-amber-700 italic font-medium NormalCase leading-relaxed">
                                                            <span className="font-bold text-[8px] uppercase tracking-wider block mb-0.5 text-amber-600 not-italic">Remarks:</span>
                                                            {req.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(req.status === 'PENDING' || req.status === 'PARTIAL') && (
                                                <div className="mt-5 pt-3 border-t border-slate-50 flex gap-2 ml-2">
                                                    <button
                                                        onClick={() => handleReqReject(req._id)}
                                                        disabled={!!actionLoadingId}
                                                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-rose-100"
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenIssueModal(req)}
                                                        disabled={!!actionLoadingId}
                                                        className="flex-[2] py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-100"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Issue
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODALS */}
            {/* ========================================================================= */}

            {/* EMR Material Group Details Modal */}
            {selectedEmrForModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">
                                    {selectedEmrForModal.job_no}
                                </h3>
                                {selectedEmrForModal.sub_job_no !== 'N/A' && (
                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg mt-1.5 inline-block uppercase w-fit">
                                        Sub-Job: {selectedEmrForModal.sub_job_no}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => setSelectedEmrForModal(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                All Materials in EMR ({selectedEmrForModal.materials?.length} Items)
                            </span>
                            {selectedEmrForModal.materials?.map((material, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Item #{idx + 1}</span>
                                            <h5 className="text-[12px] font-black text-slate-700 uppercase leading-snug">
                                                {material?.material_name}
                                            </h5>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100/60">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Size</span>
                                            <span className="text-[10px] font-black text-slate-600 mt-1 block uppercase leading-none">{selectedEmrForModal.sheet_size || 'N/A'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Curr Stock</span>
                                            <span className="text-[11px] font-[1000] text-slate-700 mt-1 block leading-none">{material.stock}</span>
                                        </div>
                                        <div className="bg-white border border-slate-150 rounded-xl px-3 py-1.5 text-center shadow-sm">
                                            <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">Qty</span>
                                            <span className="text-[13px] font-[1000] text-indigo-600 mt-1 block leading-none">
                                                {selectedEmrForModal.qty} {selectedEmrForModal.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedEmrForModal(null)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Requisition View Details Modal */}
            {selectedReqForView && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">
                                    Requisition Details
                                </h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {selectedReqForView.requisition_no}
                                </p>
                            </div>
                            <button onClick={() => setSelectedReqForView(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Type</span>
                                    <span className="font-bold text-slate-700 uppercase mt-0.5 block">{selectedReqForView.type}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                                    <span className="font-bold text-slate-700 uppercase mt-0.5 block">{selectedReqForView.status}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Job No</span>
                                    <span className="font-bold text-slate-700 uppercase mt-0.5 block">{selectedReqForView.job_no || 'General'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Category</span>
                                    <span className="font-bold text-indigo-600 uppercase mt-0.5 block">{selectedReqForView.category || 'General'}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Item Name / Specs</span>
                                <span className="font-bold text-slate-800 uppercase mt-1 block text-sm leading-snug">{selectedReqForView.item_description} {selectedReqForView.size_name && `(${selectedReqForView.size_name})`}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Requested Qty</span>
                                    <span className="font-black text-slate-700 text-sm mt-0.5 block">{selectedReqForView.qty} {selectedReqForView.unit}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Issued Qty</span>
                                    <span className="font-black text-emerald-600 text-sm mt-0.5 block">{selectedReqForView.issued_qty || '--'} {selectedReqForView.unit}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[10px] text-slate-500 uppercase font-bold font-mono">
                                <div>Requested By: <span className="text-slate-700">{selectedReqForView.requested_by}</span></div>
                                <div>Department: <span className="text-slate-700">{selectedReqForView.department}</span></div>
                                <div>Date: <span className="text-slate-700">{selectedReqForView.created_at}</span></div>
                                {selectedReqForView.issued_by && (
                                    <>
                                        <div className="border-t border-slate-100/60 pt-1.5">Issued By: <span className="text-slate-700">{selectedReqForView.issued_by}</span></div>
                                        <div>Issued At: <span className="text-slate-700">{selectedReqForView.issued_at}</span></div>
                                    </>
                                )}
                            </div>

                            {selectedReqForView.remarks && (
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Remarks / Notes</span>
                                    <p className="mt-1 text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3 italic leading-relaxed">{selectedReqForView.remarks}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => { handlePrintReq(selectedReqForView); setSelectedReqForView(null); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                Print
                            </button>
                            <button onClick={() => setSelectedReqForView(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Requisition Issue Quantity Modal */}
            {showIssueModal && reqToIssue && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.2rem] border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 px-6 py-5 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-[13px] font-black uppercase tracking-wider">
                                    Issue Materials
                                </h3>
                                <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#ffffff' }}>
                                    Confirm issued quantity for {reqToIssue.requisition_no}
                                </div>
                            </div>
                            <button onClick={() => { setShowIssueModal(false); setReqToIssue(null); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Item requested</span>
                                <h4 className="font-bold text-slate-800 uppercase leading-snug">{reqToIssue.item_description} {reqToIssue.size_name && `(${reqToIssue.size_name})`}</h4>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/60 font-bold uppercase text-[9px] text-slate-500">
                                    <span>Requested Qty:</span>
                                    <span className="text-slate-800 text-xs font-black">{reqToIssue.qty} {reqToIssue.unit}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 font-bold uppercase text-[9px] text-slate-500">
                                    <span>Available Stock:</span>
                                    <span className={`text-xs font-black ${stockData[reqToIssue._id] === undefined ? 'text-slate-400' :
                                            stockData[reqToIssue._id] < (reqToIssue.qty - (reqToIssue.issued_qty || 0)) ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
                                        }`}>
                                        {stockData[reqToIssue._id] !== undefined ? `${stockData[reqToIssue._id]} ${reqToIssue.unit}` : 'Loading...'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Actual Qty Issued</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="number"
                                        min="0.01"
                                        max={reqToIssue.qty - (reqToIssue.issued_qty || 0)}
                                        step="any"
                                        value={issueQtyInput}
                                        onChange={(e) => setIssueQtyInput(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pr-12 text-sm font-[1000] italic text-slate-700 shadow-sm focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-4 text-xs font-black text-slate-400 uppercase italic">
                                        {reqToIssue.unit}
                                    </span>
                                </div>
                                <span className="text-[8.5px] text-slate-400 italic block ml-2">
                                    Defaults to the requested quantity. Adjust if partial issuing.
                                </span>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                            <button onClick={() => { setShowIssueModal(false); setReqToIssue(null); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                Cancel
                            </button>
                            <button
                                onClick={handleIssueSubmit}
                                disabled={actionLoadingId === reqToIssue._id}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
                            >
                                {actionLoadingId === reqToIssue._id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" /> Confirm Issue
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                h1, h2, h3, h4, h5, p, span, button, table, select, input {
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                }
            `}</style>
        </div>
    );
};

export default ExtraMaterialRequest;
