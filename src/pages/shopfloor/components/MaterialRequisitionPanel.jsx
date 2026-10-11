import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, FileText, Plus, Check, Loader2, AlertCircle, Clock, Send, CheckCircle, Flame } from 'lucide-react';
import { toast } from 'react-toastify';
import RequisitionForm from './RequisitionForm';
import {
    fetchRequisitionsThunk,
    createRequisitionThunk,
    updateRequisitionStatusThunk
} from '../../../reducer/shopFloorRequisitionReducer';
import { fetchAllItems } from '../../../reducer/inventory/itemReducer';
import { fetchAllCategories } from '../../../reducer/inventory/common/materialCategoryReducer';

const MaterialRequisitionPanel = ({ isOpen, onClose, jobs = [], department = 'Laser' }) => {
    const dispatch = useDispatch();
    const { requisitions, loading, submitting } = useSelector((state) => state.shopfloorRequisition);
    const { items: inventoryItems = [] } = useSelector((state) => state.items);
    const { categories: materialCategories = [] } = useSelector((state) => state.materialCategories);

    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'new'
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PENDING', 'PARTIAL', 'FULFILLED', 'RECEIVED'
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedMonth, setSelectedMonth] = useState('All Months');

    // Function to parse month name
    const getMonthName = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split(' ')[0].split('-');
        if (parts.length === 3) {
            let monthIndex;
            if (parts[2].length === 4) { // DD-MM-YYYY
                monthIndex = parseInt(parts[1], 10) - 1;
            } else if (parts[0].length === 4) { // YYYY-MM-DD
                monthIndex = parseInt(parts[1], 10) - 1;
            }
            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            return monthNames[monthIndex];
        }
        return null;
    };

    const formatTimeOnly = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes(',')) {
            return dateStr.split(',')[1]?.trim() || dateStr;
        }
        return dateStr;
    };

    const isCurrentDept = useCallback((reqDept) => {
        if (!reqDept || !department) return false;
        const rD = reqDept.toLowerCase();
        const d = department.toLowerCase();
        if (rD === d) return true;
        const isPrintDept = d.includes('print') || d.includes('uv');
        const isReqPrintDept = rD.includes('print') || rD.includes('uv');
        if (isPrintDept && isReqPrintDept) return true;
        return false;
    }, [department]);

    const deptRequisitions = React.useMemo(() => {
        return requisitions.filter(r => isCurrentDept(r.department));
    }, [requisitions, isCurrentDept]);

    // Get unique categories and months for dropdowns from requisitions
    const uniqueCategories = Array.from(new Set(deptRequisitions.map(r => r.category).filter(Boolean)));
    const uniqueMonths = Array.from(new Set(deptRequisitions.map(r => getMonthName(r.created_at)).filter(Boolean)));

    // Form state
    const [formData, setFormData] = useState({
        type: 'Consumable',
        category: 'Select category...',
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
    const [issueQtyInput, setIssueQtyInput] = useState({});

    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [selectedSizeName, setSelectedSizeName] = useState('');
    const [selectedMaterialCategoryId, setSelectedMaterialCategoryId] = useState('');

    const getAvailableStock = (req) => {
        if (!req.item_id) return null;
        const matchedItem = inventoryItems.find(item => (item._id || item.id)?.toString() === req.item_id.toString());
        if (!matchedItem) return 0;
        if (matchedItem.item_type === 'sheet') {
            const sizeDoc = matchedItem.stock_sizes?.find(s => 
                s._id?.toString() === req.size_id?.toString() || 
                (s.size || `${s.width}x${s.height}`) === req.size_name
            );
            if (!sizeDoc) return 0;
            const sizeStockDoc = matchedItem.size_wise_stock?.find(s => 
                s.size_id?.toString() === sizeDoc._id?.toString()
            );
            return sizeStockDoc ? sizeStockDoc.count : 0;
        }
        return matchedItem.stock || 0;
    };

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAllItems({ limit: 1000 }));
            dispatch(fetchAllCategories());
            dispatch(fetchRequisitionsThunk({ department }));
        }
    }, [dispatch, isOpen, department]);

    const itemsToShow = React.useMemo(() => {
        if (!formData.category || formData.category === 'Select category...' || formData.category === 'BOM Material') {
            return [];
        }
        
        const cat = formData.category.toLowerCase();
        
        if (cat.includes('raw material')) {
            if (!selectedMaterialCategoryId) return [];
            return inventoryItems.filter(item => {
                const itemCatId = item.category?._id || item.category_id || '';
                return itemCatId.toString() === selectedMaterialCategoryId.toString();
            });
        }
        
        const filtered = inventoryItems.filter(item => {
            const typeName = (item.type?.name || '').toLowerCase();
            const categoryName = (item.category?.name || '').toLowerCase();
            
            if (cat.includes('consumable')) {
                return typeName.includes('consumable') || categoryName.includes('consumable');
            }
            if (cat.includes('hardware') || cat.includes('tool')) {
                return typeName.includes('hardware') || typeName.includes('tool') || categoryName.includes('hardware') || categoryName.includes('tool');
            }
            if (cat.includes('stationery')) {
                return typeName.includes('stationery') || categoryName.includes('stationery');
            }
            if (cat.includes('safety')) {
                return typeName.includes('safety') || categoryName.includes('safety');
            }
            if (cat.includes('asset')) {
                return typeName.includes('asset') || categoryName.includes('asset');
            }
            if (cat.includes('general')) {
                return typeName.includes('general') || categoryName.includes('general');
            }
            return false;
        });

        return filtered.length > 0 ? filtered : inventoryItems;
    }, [inventoryItems, formData.category, selectedMaterialCategoryId]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'category') {
                setSelectedInventoryItemId('');
                setSelectedInventoryItem(null);
                setSelectedSizeName('');
                setSelectedMaterialCategoryId('');
                updated.item_description = '';
                if (value !== 'BOM Material') {
                    setSelectedGroupId('');
                    setSelectedMaterialId('');
                    updated.reprocess_job_qty = '';
                }
            }
            if (name === 'job_no' && value === 'General / No specific job') {
                setSelectedGroupId('');
                setSelectedMaterialId('');
                updated.reprocess_job_qty = '';
            }
            return updated;
        });
    };

    const handleInventoryItemChange = (itemId) => {
        setSelectedInventoryItemId(itemId);
        const item = itemsToShow.find(i => (i._id || i.id) === itemId);
        setSelectedInventoryItem(item || null);
        setSelectedSizeName('');
        
        if (item) {
            const resolvedUnit = item.unit?.symbol || item.unit?.name || item.unit || 'pcs';
            setFormData(prev => ({
                ...prev,
                item_description: item.name,
                unit: resolvedUnit,
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
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category || formData.category === 'Select category...') {
            toast.error("Please select a category");
            return;
        }
        if (!formData.item_description.trim()) {
            toast.error("Item description is required");
            return;
        }
        if (!formData.qty || isNaN(formData.qty) || parseFloat(formData.qty) <= 0) {
            toast.error("Valid quantity is required");
            return;
        }

        let targetJobNo = formData.job_no;
        if (formData.isManualJob) {
            if (!formData.manualJobNo.trim()) {
                toast.error("Please enter a Job Number");
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

        const calculatedType = (formData.category === 'BOM Material' || formData.category === 'Raw Material') ? 'Extra Material' : 'Consumable';

        let extraPayload = {};
        if (formData.category === 'BOM Material' && selectedMaterialId) {
            const selectedJobObj = jobs.find(j => (j.sub_job_no || j.job_no) === targetJobNo);
            const selectedGroupObj = selectedJobObj?.material_groups?.find(g => g.group_id === selectedGroupId);
            const availableMaterials = selectedGroupObj?.materials || [];
            const selectedMat = availableMaterials.find(m => (m.item_id || m.material_name) === selectedMaterialId);
            if (selectedMat) {
                if (selectedMat.item_id) {
                    extraPayload.item_id = selectedMat.item_id;
                }
                extraPayload.size_name = selectedMat.material_input?.size || selectedMat.size || undefined;
            }
        } else if (formData.category !== 'BOM Material') {
            if (formData.category === 'Raw Material' && !selectedMaterialCategoryId) {
                toast.error("Please select a material category first");
                return;
            }
            if (!selectedInventoryItem) {
                toast.error("Please select an item from the master inventory");
                return;
            }
            extraPayload.item_id = selectedInventoryItem._id || selectedInventoryItem.id;
            if (selectedInventoryItem.item_type === 'sheet') {
                if (!selectedSizeName) {
                    toast.error("Please select a sheet size");
                    return;
                }
                extraPayload.size_name = selectedSizeName;
                const sizeDoc = selectedInventoryItem.stock_sizes?.find(s => 
                    (s.size || `${s.width}x${s.height}`) === selectedSizeName
                );
                if (sizeDoc) {
                    extraPayload.size_id = sizeDoc._id;
                }
            }
        }

        const payload = {
            ...formData,
            ...extraPayload,
            type: calculatedType,
            job_no: targetJobNo,
            qty: parseFloat(formData.qty),
            reprocess_job_qty: formData.reprocess_job_qty ? parseFloat(formData.reprocess_job_qty) : undefined,
            shopfloor_job_id,
            group_id: selectedGroupId || undefined,
            department
        };

        try {
            const result = await dispatch(createRequisitionThunk(payload)).unwrap();
            if (result.success) {
                toast.success("Material requisition raised successfully!");
                setActiveTab('all');
                // Reset form
                setFormData({
                    type: 'Consumable',
                    category: 'Select category...',
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
                setSelectedInventoryItemId('');
                setSelectedInventoryItem(null);
                setSelectedSizeName('');
                setSelectedMaterialCategoryId('');
            }
        } catch (error) {
            toast.error(error?.message || "Failed to raise requisition");
        }
    };
    const handleIssueSubmit = async (req) => {
        const remainingQty = req.qty - (req.issued_qty || 0);
        const inputValue = issueQtyInput[req._id];
        const qtyToIssue = inputValue !== undefined ? parseFloat(inputValue) : remainingQty;

        if (isNaN(qtyToIssue) || qtyToIssue <= 0) {
            toast.error("Please enter a valid quantity to issue");
            return;
        }

        if (qtyToIssue > remainingQty) {
            toast.error(`Cannot issue more than remaining quantity of ${remainingQty} ${req.unit}`);
            return;
        }

        const availStock = getAvailableStock(req);
        if (availStock !== null && qtyToIssue > availStock) {
            toast.error(`Insufficient stock! Only ${availStock} ${req.unit} available in master inventory`);
            return;
        }

        const totalNewIssued = (req.issued_qty || 0) + qtyToIssue;
        // If total issued quantity equals or exceeds total quantity requested, mark as fully ISSUED
        const finalStatus = totalNewIssued >= req.qty ? 'ISSUED' : 'PARTIAL';

        try {
            const result = await dispatch(updateRequisitionStatusThunk({
                id: req._id,
                status: finalStatus,
                issued_qty: totalNewIssued
            })).unwrap();

            if (result.success) {
                toast.success(`Successfully issued ${qtyToIssue} ${req.unit}`);
                // Clear input value for this requisition
                setIssueQtyInput(prev => {
                    const updated = { ...prev };
                    delete updated[req._id];
                    return updated;
                });
            }
        } catch (error) {
            toast.error(error?.message || "Failed to issue material");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const req = requisitions.find(r => r._id === id);
        let targetStatus = status;
        if (status === 'RECEIVED' && req && req.status === 'PARTIAL') {
            targetStatus = 'PENDING';
        }

        try {
            const result = await dispatch(updateRequisitionStatusThunk({ id, status: targetStatus })).unwrap();
            if (result.success) {
                toast.success(`Requisition marked as ${targetStatus.toLowerCase()}`);
            }
        } catch (error) {
            toast.error(error?.message || "Failed to update requisition status");
        }
    };

    // Calculate dynamic stats
    const totalCount = deptRequisitions.length;
    const pendingCount = deptRequisitions.filter(r => r.status === 'PENDING').length;

    // Filter requisitions
    const filteredRequisitions = deptRequisitions.filter(req => {
        // Status filter
        let statusMatch = false;
        if (filterStatus === 'ALL') {
            statusMatch = true;
        } else if (filterStatus === 'FULFILLED') {
            statusMatch = req.status === 'ISSUED';
        } else if (filterStatus === 'PARTIAL') {
            statusMatch = req.status === 'PARTIAL';
        } else {
            statusMatch = req.status === filterStatus;
        }

        // Category filter
        const categoryMatch = selectedCategory === 'All Categories' || req.category === selectedCategory;

        // Month filter
        const monthMatch = selectedMonth === 'All Months' || getMonthName(req.created_at) === selectedMonth;

        return statusMatch && categoryMatch && monthMatch;
    });

    const categories = [
        'Select category...',
        'Raw Material',
        'Stationery',
        'Consumable',
        'Hardware/Tool',
        'Safety Item',
        'General',
        'Repeat-use Asset'
    ];

    // De-duplicate jobs based on sub_job_no/job_no
    const uniqueJobsList = [];
    const seenJobKeys = new Set();
    for (const j of jobs) {
        const jobKey = j.sub_job_no || j.job_no;
        if (jobKey && !seenJobKeys.has(jobKey)) {
            seenJobKeys.add(jobKey);
            uniqueJobsList.push(j);
        }
    }

    const types = ['Consumable', 'Extra Material', 'Reprocess', 'Excess Return'];
    const units = ['pcs', 'sheets', 'nos', 'kg', 'm', 'roll'];

    return (
        <div className="fixed inset-0 flex justify-end" style={{ zIndex: 110 }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 transition-opacity"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
            ></div>

            {/* Slide Panel Container */}
            <div className="relative w-full max-w-3xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" style={{ backgroundColor: '#f8fafc' }}>

                {/* Header */}
                <div className="text-white p-6 relative overflow-hidden shadow-lg flex-none" style={{ backgroundColor: '#131b2e' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-[1000] tracking-tighter uppercase leading-none italic flex items-center gap-2">
                                    <span>📋</span> MATERIAL REQUISITION
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mt-1.5 italic">
                                {department === 'Print' ? 'UV PRINTING' : department.toUpperCase()} DEPT • {pendingCount} PENDING • {totalCount} TOTAL
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white rounded-xl p-2 transition-all border"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex w-full mt-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'all'
                                ? 'bg-white text-[#0f766e] border-2 border-slate-950 rounded-t-2xl rounded-b-none relative z-10 -mb-[2px]'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <span>📋</span> ALL REQUESTS
                        </button>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'new'
                                ? 'bg-white text-[#0f766e] border-2 border-slate-950 rounded-t-2xl rounded-b-none relative z-10 -mb-[2px]'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            + NEW REQUISITION
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {activeTab === 'all' ? (
                        <div className="space-y-6">
                            {/* Filter bar */}
                            <div className="flex flex-wrap items-center gap-2">
                                {['ALL', 'PENDING', 'PARTIAL', 'FULFILLED', 'RECEIVED'].map((status) => {
                                    let count = 0;
                                    if (status === 'ALL') {
                                        count = deptRequisitions.length;
                                    } else if (status === 'FULFILLED') {
                                        count = deptRequisitions.filter(r => r.status === 'ISSUED').length;
                                    } else if (status === 'PARTIAL') {
                                        count = deptRequisitions.filter(r => r.status === 'PARTIAL').length;
                                    } else {
                                        count = deptRequisitions.filter(r => r.status === status).length;
                                    }

                                    const label = status === 'ALL' ? 'ALL' : `${status} (${count})`;

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-200 ${filterStatus === status
                                                ? 'text-white'
                                                : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-50'
                                                }`}
                                            style={filterStatus === status ? { backgroundColor: '#009688', borderColor: '#009688' } : {}}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Dropdowns for Categories and Months */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-48 bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-800 shadow-sm focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer appearance-none pr-10"
                                        >
                                            <option value="All Categories">All Categories</option>
                                            {uniqueCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none text-[8px] font-black">▼</span>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-40 bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-800 shadow-sm focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer appearance-none pr-10"
                                        >
                                            <option value="All Months">All Months</option>
                                            {uniqueMonths.map(month => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none text-[8px] font-black">▼</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    {filteredRequisitions.length} of {deptRequisitions.length} showing
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading requisitions...</span>
                                </div>
                            ) : filteredRequisitions.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center bg-white flex flex-col items-center justify-center max-w-md mx-auto">
                                    <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">No Requests Found</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs leading-relaxed">
                                        There are currently no material requisitions in this state.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredRequisitions.map((req) => {
                                        let statusBadge = "bg-slate-100 text-slate-500";
                                        if (req.status === "PENDING") statusBadge = "bg-[#fffbeb] text-[#d97706] border border-amber-200/50";
                                        if (req.status === "PARTIAL") statusBadge = "bg-[#fef3c7] text-[#b45309] border border-amber-300/30";
                                        if (req.status === "ISSUED") statusBadge = "bg-[#f0fdf4] text-[#15803d] border border-emerald-200/50";
                                        if (req.status === "RECEIVED") statusBadge = "bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]";
                                        if (req.status === "REJECTED") statusBadge = "bg-rose-50 text-rose-600 border border-rose-200/50";

                                        const cardBorderClass = req.urgent
                                            ? "border-2 border-amber-500 shadow-md"
                                            : "border border-slate-200/80 shadow-sm";

                                        return (
                                            <div
                                                key={req._id}
                                                className={`bg-white rounded-3xl p-5 transition-all duration-300 relative overflow-hidden group space-y-4 ${cardBorderClass}`}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    {/* Left side: details */}
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="text-sm font-[1000] text-slate-800 leading-snug tracking-tight">
                                                                {req.urgent && '🔥 '}{req.item_description}
                                                            </h4>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {(req.category === 'Raw Material' ? 'Extra Material' : req.type)} • {req.job_no} • By {req.requested_by} • {formatTimeOnly(req.created_at)}
                                                        </p>
                                                        {req.remarks && (
                                                            <p className="text-[10px] font-semibold text-slate-400 italic">
                                                                {req.remarks}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Right side: status & qty */}
                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusBadge}`}>
                                                            {req.status === 'ISSUED' ? 'FULFILLED' : req.status}
                                                        </span>
                                                        <div className="text-right">
                                                            {req.issued_qty && req.issued_qty > 0 && req.issued_qty < req.qty ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xl font-[1000] italic text-slate-800">
                                                                        {req.issued_qty} / {req.qty}
                                                                    </span>
                                                                    <span className="text-[9px] uppercase font-black text-slate-400">
                                                                        {req.unit} issued
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-2xl font-[1000] italic text-slate-800">
                                                                    {req.qty} <span className="text-xs uppercase font-black text-slate-500">{req.unit}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>



                                                {(req.status === 'ISSUED' || req.status === 'PARTIAL') && (
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(req._id, 'RECEIVED')}
                                                            className="bg-[#009688] hover:bg-[#00796b] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-md uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5"
                                                        >
                                                            <span>✓</span> Mark Received on Floor
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Navy banner for issued / received status */}
                                                {(req.status === 'ISSUED' || req.status === 'PARTIAL' || req.status === 'RECEIVED' || (req.status === 'PENDING' && req.issued_qty > 0)) && (
                                                    <div className="bg-[#131b2e] -mx-5 -mb-5 mt-4 p-4 text-white rounded-b-[1.4rem] grid grid-cols-2 gap-4 border-t border-slate-800 flex-none">
                                                        {/* Left side: Issued Info */}
                                                        <div className="space-y-0.5">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">ISSUED BY STORES</span>
                                                            <p className="text-[10px] font-bold text-emerald-400 leading-tight">
                                                                {req.issued_qty || req.qty} {req.unit} · {req.issued_by || 'System'} - {req.issued_at || req.created_at}
                                                            </p>
                                                        </div>

                                                        {/* Right side: Received Info */}
                                                        {(req.status === 'RECEIVED' || (req.status === 'PENDING' && req.issued_qty > 0)) ? (
                                                            <div className="space-y-0.5 border-l border-slate-800 pl-4">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">RECEIVED ON FLOOR</span>
                                                                <p className="text-[10px] font-bold text-cyan-400 leading-tight">
                                                                    {req.received_by || 'HEAD'} - {req.received_at || req.updated_at || req.created_at}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            (req.status === 'PARTIAL' || req.status === 'ISSUED') && (
                                                                <div className="space-y-0.5 border-l border-slate-800 pl-4 flex flex-col justify-center">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">RECEIVED ON FLOOR</span>
                                                                    <p className="text-[10px] font-bold text-amber-500 leading-tight animate-pulse">
                                                                        AWAITING RECEIPT...
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <RequisitionForm
                            title="RAISE NEW MATERIAL REQUISITION"
                            subtitle="Request materials, hardware, consumables or log excess returns."
                            categories={categories}
                            units={units}
                            jobs={jobs}
                            formData={formData}
                            submitting={submitting}
                            handleInputChange={handleInputChange}
                            handleFormSubmit={handleFormSubmit}
                            allowManualJob={true}
                            showBOMFields={true}
                            selectedGroupId={selectedGroupId}
                            selectedMaterialId={selectedMaterialId}
                            handleGroupChange={handleGroupChange}
                            handleMaterialChange={handleMaterialChange}
                            itemsToShow={itemsToShow}
                            selectedInventoryItemId={selectedInventoryItemId}
                            handleInventoryItemChange={handleInventoryItemChange}
                            selectedInventoryItem={selectedInventoryItem}
                            selectedSizeName={selectedSizeName}
                            setSelectedSizeName={setSelectedSizeName}
                            materialCategories={materialCategories}
                            selectedMaterialCategoryId={selectedMaterialCategoryId}
                            setSelectedMaterialCategoryId={setSelectedMaterialCategoryId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialRequisitionPanel;
