import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    RefreshCcw,
    Plus,
    Search,
    Printer,
    Eye,
    Share2,
    X,
    AlertTriangle,
    Clock,
    Check,
    Send,
    Flame,
    Calendar,
    User,
    FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import RequisitionForm from '../RequisitionForm';
import { axiosInstance } from '../../../../utils/url/config';
import {
    fetchRequisitionsThunk,
    createRequisitionThunk
} from '../../../../reducer/shopFloorRequisitionReducer';

const Reprocess = ({ isUv, department, processNames }) => {
    const dispatch = useDispatch();
    const { requisitions, loading } = useSelector((state) => state.shopfloorRequisition);

    // Page state
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedReqForView, setSelectedReqForView] = useState(null);
    const [activeTab, setActiveTab] = useState('requisitions');

    // Form state
    const [formData, setFormData] = useState({
        category: 'BOM Material',
        job_no: 'General / No specific job',
        isManualJob: false,
        manualJobNo: '',
        item_description: '',
        qty: '',
        reprocess_job_qty: '',
        unit: 'pcs',
        urgent: false,
        remarks: ''
    });

    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');

    const dept = department || (isUv ? 'Print' : 'Laser');

    // Fetch active jobs and reprocess requisitions list
    const fetchData = useCallback(async () => {
        try {
            setLoadingJobs(true);
            const jobParams = processNames
                ? { process_name: processNames, include_completed: 'true' }
                : { department: dept, include_completed: 'true' };
            const jobsResponse = await axiosInstance.get('/shop-floor/jobs', { params: jobParams });
            if (jobsResponse.data?.success) {
                setJobs(jobsResponse.data.data || []);
            }
            dispatch(fetchRequisitionsThunk({ type: 'Reprocess', department: dept }));
        } catch (error) {
            console.error("fetchData error:", error);
            toast.error("Failed to load active jobs or reprocess ledger");
        } finally {
            setLoadingJobs(false);
        }
    }, [dispatch, dept, processNames]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'category' && value !== 'BOM Material') {
                setSelectedGroupId('');
                setSelectedMaterialId('');
                updated.reprocess_job_qty = '';
            }
            if (name === 'job_no' && value === 'General / No specific job') {
                setSelectedGroupId('');
                setSelectedMaterialId('');
                updated.reprocess_job_qty = '';
            }
            return updated;
        });
    };

    const handleGroupChange = (e) => {
        const groupId = e.target.value;
        setSelectedGroupId(groupId);
        setSelectedMaterialId('');

        if (groupId) {
            const selectedJobObj = jobs.find(j => (j.sub_job_no || j.job_no) === formData.job_no);
            if (selectedJobObj && selectedJobObj.material_groups) {
                const selectedGroupObj = selectedJobObj.material_groups.find(g => g.group_id === groupId);
                if (selectedGroupObj) {
                    const materials = selectedGroupObj.materials || [];

                    let unitToSet = 'pcs';
                    const hasSheet = materials.some(m => m.material_type?.toLowerCase() === 'sheet');
                    if (hasSheet) {
                        const bom = selectedJobObj?.bom_id;
                        let processes = [];
                        if (bom && bom.materialprocess) {
                            const processGroup = bom.materialprocess.find(p => String(p.material_group_id) === String(groupId));
                            if (processGroup) processes = processGroup.processes || [];
                        }
                        const cuttingIndex = processes.findIndex(p =>
                            p.process_name?.toLowerCase().includes("laser") ||
                            p.process_name?.toLowerCase().includes("cutting") ||
                            p.process_name?.toLowerCase().includes("cut")
                        );
                        const currentProcessIndex = processes.findIndex(p =>
                            p.process_name?.toLowerCase().trim() === selectedJobObj?.process_name?.toLowerCase().trim()
                        );
                        if (cuttingIndex === -1 || (currentProcessIndex !== -1 && currentProcessIndex < cuttingIndex)) {
                            unitToSet = 'sh';
                        }
                    }

                    setFormData(prev => ({
                        ...prev,
                        item_description: selectedGroupObj.group_name || '',
                        unit: unitToSet,
                        reprocess_job_qty: ''
                    }));
                    return;
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            item_description: '',
            reprocess_job_qty: ''
        }));
    };

    const handleMaterialChange = (materialVal, availableMaterials) => {
        setSelectedMaterialId(materialVal);
        const selectedMat = availableMaterials.find(m => (m.item_id || m.material_name) === materialVal);
        if (selectedMat) {
            const selectedJobObj = jobs.find(j => (j.sub_job_no || j.job_no) === formData.job_no);
            const bom = selectedJobObj?.bom_id;
            let processes = [];
            if (bom && bom.materialprocess) {
                const processGroup = bom.materialprocess.find(p =>
                    p.material_group_name?.toLowerCase().trim() === selectedMat?.category_type?.toLowerCase().trim() ||
                    p.material_group_name?.toLowerCase().trim() === selectedMat?.material_name?.toLowerCase().trim() ||
                    String(p.material_group_id) === String(selectedGroupId)
                );
                if (processGroup) {
                    processes = processGroup.processes || [];
                }
            }

            const cuttingIndex = processes.findIndex(p =>
                p.process_name?.toLowerCase().includes("laser") ||
                p.process_name?.toLowerCase().includes("cutting") ||
                p.process_name?.toLowerCase().includes("cut")
            );

            const currentProcessIndex = processes.findIndex(p =>
                p.process_name?.toLowerCase().trim() === selectedJobObj?.process_name?.toLowerCase().trim()
            );

            const isSheetMaterial = selectedMat.material_type?.toLowerCase() === 'sheet';
            let unitToSet = selectedMat.unit || 'pcs';

            if (isSheetMaterial) {
                if (cuttingIndex === -1 || (currentProcessIndex !== -1 && currentProcessIndex < cuttingIndex)) {
                    unitToSet = 'sh';
                } else {
                    unitToSet = 'pcs';
                }
            }

            let desc = selectedMat.material_name;
            const matSize = selectedMat.material_input?.size || (selectedMat.material_input?.length ? `${selectedMat.material_input.length}X${selectedMat.material_input.width}` : '');
            const matSpec = selectedMat.material_input?.specification || '';
            if (matSize) desc += ` - Size: ${matSize}`;
            if (matSpec) desc += ` (${matSpec})`;

            setFormData(prev => ({
                ...prev,
                item_description: selectedMat.material_name,
                unit: selectedMat.unit || 'pcs',
                reprocess_job_qty: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                item_description: '',
                reprocess_job_qty: ''
            }));
        }
    };

    // Submit new reprocess requisition
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category || formData.category === 'Select category...') {
            toast.warn("Please select a category");
            return;
        }

        if (!formData.qty || parseFloat(formData.qty) <= 0) {
            toast.warn("Quantity must be greater than zero");
            return;
        }

        let targetJobNo = formData.job_no;
        if (formData.isManualJob) {
            if (!formData.manualJobNo.trim()) {
                toast.warn("Please enter a Job Number");
                return;
            }
            targetJobNo = formData.manualJobNo.trim();
        }

        // Map the selected job_no to target job ID if found
        let shopfloor_job_id = undefined;
        if (targetJobNo !== 'General / No specific job') {
            const foundJob = jobs.find(j => j.sub_job_no === targetJobNo || j.job_no === targetJobNo);
            if (foundJob) {
                shopfloor_job_id = foundJob._id;
            }
        }

        const payload = {
            type: 'Reprocess',
            category: formData.category,
            job_no: targetJobNo,
            shopfloor_job_id,
            group_id: selectedGroupId || undefined,
            item_description: formData.item_description,
            qty: parseFloat(formData.qty),
            reprocess_job_qty: formData.reprocess_job_qty ? parseFloat(formData.reprocess_job_qty) : undefined,
            unit: formData.unit,
            urgent: formData.urgent,
            remarks: formData.remarks,
            department: dept
        };

        try {
            setSubmitting(true);
            const response = await dispatch(createRequisitionThunk(payload)).unwrap();
            if (response?.success) {
                toast.success("Reprocess requisition raised successfully!");
                setShowFormModal(false);
                // Reset form
                setFormData({
                    category: 'BOM Material',
                    job_no: 'General / No specific job',
                    isManualJob: false,
                    manualJobNo: '',
                    item_description: '',
                    qty: '',
                    reprocess_job_qty: '',
                    unit: 'pcs',
                    urgent: false,
                    remarks: ''
                });
                setSelectedGroupId('');
                setSelectedMaterialId('');
                // Reload list
                dispatch(fetchRequisitionsThunk({ type: 'Reprocess', department: dept }));
            }
        } catch (error) {
            console.error("handleFormSubmit error:", error);
            toast.error(error?.message || "Failed to raise requisition");
        } finally {
            setSubmitting(false);
        }
    };

    // Print requisition slip
    const handlePrint = (req) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Reprocess Requisition - ${req.requisition_no}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #000; background-color: #fff; }
                    .ticket { border: 2px dashed #000; padding: 25px; max-width: 450px; margin: 0 auto; box-sizing: border-box; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
                    .header h2 { margin: 0; font-size: 18px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900; }
                    .header .sub { font-size: 11px; margin-top: 5px; letter-spacing: 1px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; line-height: 1.4; }
                    .label { font-weight: bold; text-transform: uppercase; }
                    .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
                    .urgent-tag { color: #fff; background-color: #000; padding: 3px 8px; font-weight: bold; font-size: 11px; display: inline-block; letter-spacing: 1px; }
                    .remarks-box { margin-top: 12px; padding: 8px; border: 1px solid #000; font-size: 12px; }
                    .footer { text-align: center; margin-top: 25px; font-size: 11px; border-top: 1px solid #000; padding-top: 10px; }
                    @media print {
                        body { padding: 0; }
                        .ticket { border: 2px dashed #000; width: 100%; max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <div class="header">
                        <h2>Reprocess Requisition</h2>
                        <div class="sub">${dept} Studio Inventory Dept</div>
                    </div>
                    <div class="row">
                        <span class="label">Req No:</span>
                        <span>${req.requisition_no}</span>
                    </div>
                    <div class="row">
                        <span class="label">Date/Time:</span>
                        <span>${req.created_at || ''}</span>
                    </div>
                    <div class="row">
                        <span class="label">Status:</span>
                        <span style="font-weight: 900;">${req.status}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="row">
                        <span class="label">Job Number:</span>
                        <span style="font-weight: 900;">${req.job_no}</span>
                    </div>
                    <div class="row">
                        <span class="label">Category:</span>
                        <span>${req.category || 'General'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Description:</span>
                        <span style="text-align: right; max-width: 60%;">${req.item_description}</span>
                    </div>
                    <div class="row">
                        <span class="label">Qty Reqd:</span>
                        <span style="font-size: 16px; font-weight: 900;">${req.qty} ${req.unit}</span>
                    </div>
                    ${req.urgent ? `
                    <div style="text-align: center; margin: 12px 0;">
                        <span class="urgent-tag">🔥 URGENT REQUIREMENT</span>
                    </div>
                    ` : ''}
                    <div class="divider"></div>
                    <div class="row">
                        <span class="label">Requested By:</span>
                        <span>${req.requested_by}</span>
                    </div>
                    <div class="row">
                        <span class="label">Dept:</span>
                        <span>${req.department || 'Laser'}</span>
                    </div>
                    ${req.remarks ? `
                    <div class="remarks-box">
                        <strong>REMARKS / PURPOSE:</strong><br/>
                        <span style="display: block; margin-top: 4px; font-style: italic;">${req.remarks}</span>
                    </div>
                    ` : ''}
                    <div class="footer">
                        <p>SYSTEM GENERATED PRODUCTION SLIP</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Share requisition on WhatsApp
    const handleWhatsAppShare = (req) => {
        const urgentEmoji = req.urgent ? '🚨 *URGENT REPROCESS REQ* 🚨\n' : '📋 *REPROCESS REQUISITION*\n';
        const message = `${urgentEmoji}` +
            `---------------------------------\n` +
            `*Req No:* ${req.requisition_no}\n` +
            `*Job No:* ${req.job_no}\n` +
            `*Item:* ${req.item_description}\n` +
            `*Qty:* ${req.qty} ${req.unit}\n` +
            `*Category:* ${req.category || 'N/A'}\n` +
            `*Status:* ${req.status}\n` +
            `*Requested By:* ${req.requested_by} (${req.department})\n` +
            `*Date:* ${req.created_at || ''}\n` +
            (req.remarks ? `*Remarks:* ${req.remarks}\n` : '') +
            `---------------------------------\n` +
            `*${dept} Studio Inventory Management System*`;
        const encodedText = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    const getDepartmentDisplayName = (dept) => {
        if (!dept) return 'Unknown';
        const d = dept.toLowerCase().trim();
        if (d === 'print' || d === 'uv') return 'UV Studio';
        if (d === 'laser') return 'Laser Studio';
        if (d === 'assembly') return 'Assembly';
        return dept;
    };

    // Filter requisitions based on search query
    const filteredRequisitions = (requisitions || []).filter(req => {
        if (!req || req.type !== 'Reprocess') return false;
        const query = searchQuery.toLowerCase();
        return (
            (req.requisition_no || '').toLowerCase().includes(query) ||
            (req.job_no || '').toLowerCase().includes(query) ||
            (req.item_description || '').toLowerCase().includes(query) ||
            (req.category || '').toLowerCase().includes(query)
        );
    });

    const reprocessJobs = (jobs || []).filter(job => job.is_reprocess || (job.sub_job_no && job.sub_job_no.includes('-R')));

    const filteredReprocessJobs = reprocessJobs.filter(job => {
        const query = searchQuery.toLowerCase();
        return (
            (job.job_no || '').toLowerCase().includes(query) ||
            (job.sub_job_no || '').toLowerCase().includes(query) ||
            (job.client_name || '').toLowerCase().includes(query) ||
            (job.product_name || '').toLowerCase().includes(query) ||
            (job.process_name || '').toLowerCase().includes(query) ||
            (job.reprocess_created_from && getDepartmentDisplayName(job.reprocess_created_from).toLowerCase().includes(query))
        );
    });

    const categories = [
        'Select category...',
        'BOM Material'
    ];
    const units = ['pcs', 'sheets', 'nos', 'kg', 'm', 'roll'];

    return (
        <div className="p-6 space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-sm gap-4 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                        <RefreshCcw className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '60s' }} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-[1000] text-amber-800 uppercase tracking-widest flex items-center gap-2">
                            REPROCESS REQUISITIONS & JOBS
                        </h3>
                        <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-1">
                            Track and raise material requisitions required for reprocessing completed or damaged jobs.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowFormModal(true)}
                    className="w-full sm:w-auto hover:bg-amber-700 text-white text-[10px] font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-100 hover:shadow-amber-200 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider active:scale-95 shrink-0 mt-1 sm:mt-0"
                    style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                >
                    <Plus className="w-3.5 h-3.5" /> Raise Reprocess Req
                </button>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-sm">
                <button
                    onClick={() => setActiveTab('requisitions')}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        activeTab === 'requisitions'
                            ? 'bg-white text-amber-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Material Requisitions ({filteredRequisitions.length})
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        activeTab === 'jobs'
                            ? 'bg-white text-amber-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Reprocess Jobs Queue ({filteredReprocessJobs.length})
                </button>
            </div>

            {/* Filter and search bar */}
            <div className="flex justify-between items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={activeTab === 'requisitions' ? "Search by Req No, Job No, description..." : "Search by Job No, Product, Process, Origin..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {activeTab === 'requisitions' ? `${filteredRequisitions.length} REQUISITIONS FOUND` : `${filteredReprocessJobs.length} JOBS FOUND`}
                </span>
            </div>

            {/* Ledger content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-white border border-slate-100 rounded-3xl">
                    <RefreshCcw className="w-8 h-8 text-amber-600 animate-spin mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading...</span>
                </div>
            ) : activeTab === 'requisitions' ? (
                filteredRequisitions.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <AlertTriangle className="w-10 h-10 text-slate-300 mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {searchQuery ? "No matching reprocess requisitions" : "NO REPROCESS REQUISITIONS — ALL CLEAR ✓"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredRequisitions.map((req) => {
                            let statusColor = "bg-slate-100 text-slate-500 border-slate-200";
                            if (req.status === "PENDING") statusColor = "bg-amber-50 text-amber-600 border-amber-200";
                            if (req.status === "ISSUED") statusColor = "bg-purple-50 text-purple-600 border-purple-200";
                            if (req.status === "RECEIVED") statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
                            if (req.status === "REJECTED") statusColor = "bg-rose-50 text-rose-600 border-rose-200";

                            return (
                                <div
                                    key={req._id}
                                    className={`bg-white rounded-3xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden flex flex-col justify-between group ${
                                        req.urgent ? 'border-amber-400 shadow-amber-50/50' : 'border-slate-100'
                                    }`}
                                >
                                    {req.urgent && (
                                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider animate-pulse flex items-center gap-1">
                                            <Flame className="w-3 h-3 fill-white" /> Urgent
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-wider block">
                                                    {req.requisition_no}
                                                </span>
                                                <h4 className="text-xs font-[1000] text-slate-800 uppercase mt-1 leading-tight max-w-[80%] break-all">
                                                    {req.job_no}
                                                </h4>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${statusColor}`}>
                                                {req.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Item:</span>
                                                <span className="uppercase text-right max-w-[70%] text-slate-800 truncate" title={req.item_description}>
                                                    {req.item_description}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Qty Reqd:</span>
                                                <span className="font-[900] text-slate-900">
                                                    {req.qty} <span className="text-[9px] font-black text-slate-500 uppercase">{req.unit}</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Category:</span>
                                                <span className="uppercase text-slate-800 font-semibold">{req.category || 'Other'}</span>
                                            </div>
                                        </div>

                                        {req.remarks && (
                                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-500 italic max-h-16 overflow-y-auto no-scrollbar">
                                                {req.remarks}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <span className="truncate max-w-[90px]">{req.requested_by}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setSelectedReqForView(req)}
                                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-100 transition-all active:scale-95"
                                                title="View Slip"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(req)}
                                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-100 transition-all active:scale-95"
                                                title="Print Slip"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleWhatsAppShare(req)}
                                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-100 transition-all active:scale-95"
                                                title="Share WhatsApp"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                filteredReprocessJobs.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center flex flex-col items-center justify-center bg-slate-50/30">
                        <AlertTriangle className="w-10 h-10 text-slate-300 mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {searchQuery ? "No matching reprocess jobs" : "NO REPROCESS JOBS — ALL CLEAR ✓"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredReprocessJobs.map((job) => {
                            const currentDept = dept;
                            const createdFrom = job.reprocess_created_from;
                            const isCreatedFromOther = createdFrom && createdFrom.toLowerCase().trim() !== currentDept.toLowerCase().trim();
                            const fromDisplayName = getDepartmentDisplayName(createdFrom || currentDept);

                            let statusColor = "bg-slate-100 text-slate-500 border-slate-200";
                            if (job.status === "Pending" || job.status === "pending") statusColor = "bg-amber-50 text-amber-600 border-amber-200";
                            if (job.status === "In Progress" || job.status === "in progress") statusColor = "bg-blue-50 text-blue-600 border-blue-200";
                            if (job.status === "Completed" || job.status === "completed") statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200";

                            return (
                                <div
                                    key={job._id}
                                    className={`bg-white rounded-3xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden flex flex-col justify-between group ${
                                        isCreatedFromOther ? 'border-sky-300 shadow-sky-50/50' : 'border-slate-100'
                                    }`}
                                >
                                    {isCreatedFromOther && (
                                        <div className="absolute top-0 right-0 bg-sky-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider animate-pulse flex items-center gap-1">
                                            From: {fromDisplayName}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-wider block">
                                                    Reprocess Job
                                                </span>
                                                <h4 className="text-xs font-[1000] text-slate-800 uppercase mt-1 leading-tight max-w-[85%] break-all">
                                                    {job.sub_job_no || job.job_no}
                                                </h4>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${statusColor}`}>
                                                {job.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Product:</span>
                                                <span className="uppercase text-right max-w-[70%] text-slate-800 truncate" title={job.product_name}>
                                                    {job.product_name}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Process:</span>
                                                <span className="uppercase text-slate-800 font-semibold">{job.process_name}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Qty Reqd:</span>
                                                <span className="font-[900] text-slate-900">
                                                    {job.total_qty} <span className="text-[9px] font-black text-slate-500 uppercase">pcs</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                <span className="text-slate-400 uppercase">Client:</span>
                                                <span className="uppercase text-slate-800 font-semibold">{job.client_name || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-500">
                                            <div className="flex justify-between">
                                                <span>Originated From:</span>
                                                <span className={`font-black ${isCreatedFromOther ? 'text-sky-600' : 'text-slate-600'}`}>{fromDisplayName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Raise Reprocess Requisition Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <RequisitionForm
                        title="RAISE NEW REPROCESS REQUISITION"
                        subtitle="Request replacement materials specifically for reprocessing."
                        categories={categories}
                        units={units}
                        jobs={jobs}
                        formData={formData}
                        submitting={submitting}
                        handleInputChange={handleInputChange}
                        handleFormSubmit={handleFormSubmit}
                        onClose={() => setShowFormModal(false)}
                        allowManualJob={true}
                        showBOMFields={true}
                        selectedGroupId={selectedGroupId}
                        selectedMaterialId={selectedMaterialId}
                        handleGroupChange={handleGroupChange}
                        handleMaterialChange={handleMaterialChange}
                        className="max-w-lg w-full"
                        isReprocess={true}
                    />
                </div>
            )}

            {/* View Requisition Detail Modal */}
            {selectedReqForView && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-6 py-5 flex justify-between items-center">
                            <div>
                                <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest block">
                                    {selectedReqForView.requisition_no}
                                </span>
                                <h3 className="text-xs font-[1000] uppercase tracking-wider mt-1 text-amber-400">
                                    REPROCESS SLIP
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedReqForView(null)}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Slip Detail */}
                        <div className="p-6 space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                    <span className="text-slate-400 uppercase">JOB NUMBER:</span>
                                    <span className="font-[1000] text-slate-900 uppercase">{selectedReqForView.job_no}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                    <span className="text-slate-400 uppercase">CATEGORY:</span>
                                    <span className="font-[900] text-slate-800 uppercase">{selectedReqForView.category || 'GENERAL'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                    <span className="text-slate-400 uppercase">QUANTITY:</span>
                                    <span className="text-base font-[1000] text-slate-900 uppercase">
                                        {selectedReqForView.qty} {selectedReqForView.unit}
                                    </span>
                                </div>
                                <div className="flex justify-between items-start text-xs font-bold text-slate-600">
                                    <span className="text-slate-400 uppercase">DESCRIPTION:</span>
                                    <span className="font-[950] text-slate-800 uppercase text-right max-w-[60%]">{selectedReqForView.item_description}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                    <span className="text-slate-400 uppercase">STATUS:</span>
                                    <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                                        {selectedReqForView.status}
                                    </span>
                                </div>

                                {selectedReqForView.urgent && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-rose-600 text-[10px] font-black uppercase tracking-wider animate-pulse">
                                        <Flame className="w-4 h-4 fill-rose-500" /> Urgent Reprocess Requirement
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5 text-[11px] font-bold text-slate-600 px-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 uppercase">Requested By:</span>
                                    <span className="text-slate-700">{selectedReqForView.requested_by} ({selectedReqForView.department || 'Laser'})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 uppercase">Raised At:</span>
                                    <span className="text-slate-700">{selectedReqForView.created_at || ''}</span>
                                </div>
                            </div>

                            {selectedReqForView.remarks && (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">REMARKS / CAUSE</span>
                                    <p className="text-xs font-medium text-slate-600 italic leading-relaxed">
                                        {selectedReqForView.remarks}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer buttons */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between gap-3">
                            <button
                                onClick={() => handleWhatsAppShare(selectedReqForView)}
                                className="flex-1 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-50"
                                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                            >
                                <Share2 className="w-3.5 h-3.5" /> WhatsApp
                            </button>
                            <button
                                onClick={() => handlePrint(selectedReqForView)}
                                className="flex-1 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-50"
                                style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reprocess;
