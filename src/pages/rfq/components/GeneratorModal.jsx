import React, { useState, useRef, useEffect, useMemo, useReducer } from 'react';
import { PiPlusCircleBold, PiCamera, PiX } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';
import { axiosInstance } from '../../../utils/url/config';
import { fetchPackingAvailableJobs, fetchSubJobs, fetchJobDetails, markPackPurchased, clearSubJobs, clearJobDetails, fetchStorePendingRequests } from '../../../reducer/rfqReducer';
import { evaluateLogicRate } from '../../../utils/helper/logicRateEvaluator';

const STAGES = [
    { name: "1. Draft RFQ", color: "bg-slate-500" },
    { name: "2. Assign Vendors", color: "bg-indigo-600" },
    { name: "3. Review (Negotiate)", color: "bg-amber-500" },
    { name: "4. PO Awarded", color: "bg-green-600" },
    { name: "5. In Process", color: "bg-orange-500" },
    { name: "6. Delivery", color: "bg-blue-500" }
];

const MASTER_CARTONS = [{ name: "MC-24 (24x18x12)", l: 24, b: 18, h: 12 }, { name: "MC-20 (20x20x20)", l: 20, b: 20, h: 20 }];

const initialState = {
    tab: 'AI',
    selectedJobNo: '',
    selectedJobId: '',
    deadline: '',
    selectedItems: {},
    loading: false,
    customFormData: { name: '', qty: '', deadline: '' },
    imagePreview: null,
    imageFile: null,
    selProd: '',
    baseSize: { l: 0, b: 0, h: 0 },
    bufferVal: '',
    selectedMC: null,
    rfqDeadline: { date: '', time: '' },
    layers: [
        { id: 'TH', name: 'TH: THERMACOLE CUSHION', type: 'TH', active: true, cushion: 0.75, gap: 0, rateFactor: 0.08, inputType: 'thermocol_logic', manualSize: { l: '', b: '', h: '' } },
        { id: 'TB', name: 'TB: BLACK TOP-BOTTOM BOX', type: 'TB', active: true, cushion: 0, gap: 0.10, rateFactor: 0.05, inputType: 'black_box_logic', manualSize: { l: '', b: '', h: '' } },
        { id: 'CB', name: 'CUSTOM BOX', type: 'CB', active: false, cushion: 0, gap: 0.10, manualRate: '', isAdded: false, manualSize: { l: '', b: '', h: '' } },
        { id: 'CR', name: 'CR: OUTER MASTER CARTON', type: 'MC', active: true, cushion: 0, gap: 0.15, rateFactor: 0.04, inputType: 'capacity', manualSize: { l: '', b: '', h: '' } }
    ]
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE':
            return { ...state, ...action.payload };
        case 'FUNCTION_UPDATE':
            return { ...state, [action.key]: action.fn(state[action.key]) };
        default:
            return state;
    }
};

const GeneratorModal = ({ onClose, onAdd, availableJobs = [], existingRFQs = [] }) => {
    const reduxDispatch = useDispatch();
    const { packingAvailableJobs, storeAvailableRequests, subJobs: subJobsList, jobDetails: activeJobObj } = useSelector(state => state.rfq);

    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        tab, selectedJobNo, selectedJobId,
        deadline, selectedItems, loading, customFormData, imagePreview, imageFile,
        selProd, baseSize, bufferVal, selectedMC, rfqDeadline, layers
    } = state;

    const createSetter = React.useCallback((key) => (val) => {
        if (typeof val === 'function') {
            dispatch({ type: 'FUNCTION_UPDATE', key, fn: val });
        } else {
            dispatch({ type: 'UPDATE', payload: { [key]: val } });
        }
    }, [dispatch]);

    const setTab = React.useMemo(() => createSetter('tab'), [createSetter]);
    const setSelectedJobNo = React.useMemo(() => createSetter('selectedJobNo'), [createSetter]);
    const setSelectedJobId = React.useMemo(() => createSetter('selectedJobId'), [createSetter]);
    const setDeadline = React.useMemo(() => createSetter('deadline'), [createSetter]);
    const setSelectedItems = React.useMemo(() => createSetter('selectedItems'), [createSetter]);
    const setLoading = React.useMemo(() => createSetter('loading'), [createSetter]);
    const setCustomFormData = React.useMemo(() => createSetter('customFormData'), [createSetter]);
    const setImagePreview = React.useMemo(() => createSetter('imagePreview'), [createSetter]);
    const setImageFile = React.useMemo(() => createSetter('imageFile'), [createSetter]);
    const setSelProd = React.useMemo(() => createSetter('selProd'), [createSetter]);
    const setBaseSize = React.useMemo(() => createSetter('baseSize'), [createSetter]);
    const setBufferVal = React.useMemo(() => createSetter('bufferVal'), [createSetter]);
    const setSelectedMC = React.useMemo(() => createSetter('selectedMC'), [createSetter]);
    const setRfqDeadline = React.useMemo(() => createSetter('rfqDeadline'), [createSetter]);
    const setLayers = React.useMemo(() => createSetter('layers'), [createSetter]);

    const fileInputRef = useRef(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toISOString().slice(0, 16);

    // Filter job lists to exclude on-hold items for AI and BULK tabs
    const currentJobsList = useMemo(() => {
        const list = tab === 'AI' ? packingAvailableJobs : availableJobs;
        return list.filter(j => !j.is_on_hold);
    }, [tab, packingAvailableJobs, availableJobs]);

    useEffect(() => {
        if (tab === 'AI') {
            reduxDispatch(fetchPackingAvailableJobs());
        } else if (tab === 'STORE') {
            reduxDispatch(fetchStorePendingRequests());
        }
    }, [tab, reduxDispatch]);

    useEffect(() => {
        if (!selectedJobNo) {
            reduxDispatch(clearSubJobs());
            return;
        }
        if (tab !== 'STORE') {
            reduxDispatch(fetchSubJobs({ jobNo: selectedJobNo, tab }));
        }
        setSelectedJobId('');
        reduxDispatch(clearJobDetails());
    }, [selectedJobNo, tab, reduxDispatch, setSelectedJobId]);

    useEffect(() => {
        if (!selectedJobId) {
            reduxDispatch(clearJobDetails());
            return;
        }
        reduxDispatch(fetchJobDetails({ id: selectedJobId, tab }));
    }, [selectedJobId, tab, reduxDispatch]);

    // Filter sub-jobs to exclude on-hold items
    const availableSubJobs = useMemo(() => {
        return (subJobsList || []).filter(j => !j.is_on_hold);
    }, [subJobsList]);

    const bulkMaterials = useMemo(() => {
        if (!activeJobObj) return [];
        return (activeJobObj.material_specification || []).map((r, i) => ({
            id: `rec-${i}`,
            name: r.material_name || r.material_type,
            req_qty: parseFloat(r.req_qty || r.final_total || 0),
            stock: parseFloat(r.stock || 0),
            min_stock: parseFloat(r.min_stock || 0),
            needsPurchase: !!r.needsPurchase,
            itemType: r.itemType || 'Standard',
            material_category_id: r.material_category_id,
            material_type_id: r.material_type_id,
            vendorName: r.vendorName || null,
            specs: `${r.input?.size || ''} ${r.input?.ups ? `(${r.input.ups} UPS)` : ''}`.trim()
        }));
    }, [activeJobObj]);

    const customMaterials = useMemo(() => {
        if (tab === 'STORE' && activeJobObj && activeJobObj.items) {
            return activeJobObj.items;
        }
        return bulkMaterials;
    }, [activeJobObj, bulkMaterials, tab]);

    // Other states are managed by useReducer above

    useEffect(() => {
        if (activeJobObj) {
            const prodName = activeJobObj.product_name || 'Standard Product';
            setSelProd(prodName);

            let foundSize = { l: 0, b: 0, h: 0 };

            // 1. Try pulling from product_size array (from salesorderforms)
            if (activeJobObj.product_size && activeJobObj.product_size.length > 0) {
                const s = activeJobObj.product_size[0];
                const unit = String(activeJobObj.unit || '').toLowerCase().trim();

                const conversionFactors = {
                    in: 1,
                    inch: 1,
                    inches: 1,
                    cm: 1 / 2.54,
                    centimeter: 1 / 2.54,
                    mm: 1 / 25.4,
                    millimeter: 1 / 25.4,
                    m: 100 / 2.54,
                    meter: 100 / 2.54,
                    mtr: 100 / 2.54
                };
                const conv = conversionFactors[unit] || 1;

                foundSize = {
                    l: parseFloat(s.l || s.length || s.Length || 0) * conv,
                    b: parseFloat(s.b || s.w || s.width || s.Width || 0) * conv,
                    h: parseFloat(s.h || s.height || s.Height || 0) * conv
                };
            }

            // 2. Fallback to job_sheet if still zero
            if (foundSize.l === 0 && foundSize.b === 0) {
                try {
                    const processes = activeJobObj.job_sheet?.materialprocess?.flatMap(mp => mp.processes) || [];
                    const boxProcess = processes.find(p => p.input && p.input.length > 0 && p.input.width > 0);
                    if (boxProcess) {
                        foundSize = { l: boxProcess.input.length || 0, b: boxProcess.input.width || 0, h: boxProcess.input.height || 0 };
                    }
                } catch (e) { console.log("Error extracting dimensions", e); }
            }
            setBaseSize(foundSize);

            // Update layer active status based on requirements and stock
            setLayers(prev => prev.map(l => {
                if (l.type === 'MC') {
                    const isAllowed = activeJobObj.allow_mastercarton_packing === true;
                    return { ...l, active: isAllowed };
                }
                if (l.type === 'CB') return { ...l, isAdded: false, active: false };

                // For TH and TB, only check packing_materials (derived from packingdatas)
                const packingMat = activeJobObj.packing_materials?.find(pm =>
                    (l.type === 'TH' && (pm.name === 'Thermocol (Custom)' || pm.material_name === 'Thermocol (Custom)')) ||
                    (l.type === 'TB' && (pm.name === 'Black Box (Custom)' || pm.material_name === 'Black Box (Custom)'))
                );

                let isAllowed = true;
                if (l.type === 'TH') {
                    isAllowed = activeJobObj.allow_thermocol_packing === true;
                } else if (l.type === 'TB') {
                    isAllowed = activeJobObj.allow_blackbox_packing === true;
                }

                return {
                    ...l,
                    active: !!packingMat && isAllowed,
                    invRate: packingMat ? parseFloat(packingMat.unitCost || packingMat.rate || 0) : 0,
                    logicalRate: packingMat?.logicalRate || [],
                    packingName: packingMat?.material_name || packingMat?.name
                };
            }));
        } else {
            setSelProd('');
            setBaseSize({ l: 0, b: 0, h: 0 });
        }
    }, [activeJobObj, setBaseSize, setLayers, setSelProd]);



    const finalQtyAI = useMemo(() => {
        if (!activeJobObj) return 0;
        const base = Number(activeJobObj.quantity || activeJobObj.qty || 0);
        const buffer = parseFloat(bufferVal) || 0;
        return base + buffer;
    }, [activeJobObj, bufferVal]);
    const wastageAI = activeJobObj ? ((parseFloat(bufferVal || 0) / Number(activeJobObj.quantity || 1)) * 100).toFixed(1) : 0;

    const dataAI = useMemo(() => {
        let cL = parseFloat(baseSize.l), cB = parseFloat(baseSize.b), cH = parseFloat(baseSize.h);
        let ups = 0, mcQty = 0;
        const results = layers.map(layer => {
            const currentIn = { l: cL.toFixed(2), b: cB.toFixed(2), h: cH.toFixed(2) };

            // If layer is inactive, it doesn't add to the size
            if (!layer.active) {
                return { ...layer, autoRate: 0, resSize: currentIn, inSize: currentIn };
            }

            const rL = layer.manualSize?.l ? parseFloat(layer.manualSize.l) : (cL + parseFloat(layer.gap || 0) + (parseFloat(layer.cushion || 0) * 2));
            const rB = layer.manualSize?.b ? parseFloat(layer.manualSize.b) : (cB + parseFloat(layer.gap || 0) + (parseFloat(layer.cushion || 0) * 2));
            const rH = layer.manualSize?.h ? parseFloat(layer.manualSize.h) : (cH + parseFloat(layer.gap || 0) + (parseFloat(layer.cushion || 0) * 2));

            const interimLayer = { ...layer, resSize: { l: rL.toFixed(2), b: rB.toFixed(2), h: rH.toFixed(2) } };
            let autoRate = 0;
            if (layer.type === 'MC' || layer.type === 'CB') {
                autoRate = parseFloat(layer.manualRate || 0).toFixed(2);
            } else {
                const context = {
                    logic1: rL,
                    logic2: rB,
                    logic3: rH,
                    jobQty: finalQtyAI
                };
                const dynamicRate = evaluateLogicRate(layer.logicalRate || [], context);
                let currentRate = dynamicRate > 0 ? dynamicRate : parseFloat(layer.invRate || 0);

                const pName = layer.packingName || layer.name;
                if (pName === 'Thermocol (Custom)') {
                    // Volume-based formula: convert inches → metres, then multiply rate per m³
                    const v1 = rL * 0.0254;
                    const v2 = rB * 0.0254;
                    const v3 = rH * 0.0254;
                    const area = v1 * v2 * v3;
                    autoRate = parseFloat((area * currentRate).toFixed(2));
                } else {
                    // Standard Sum Logic — Black Box (Custom) and other logic items
                    autoRate = parseFloat((currentRate * (rL + rB + rH)).toFixed(2));
                }
            }

            cL = rL; cB = rB; cH = rH;
            const currentOut = { l: rL.toFixed(2), b: rB.toFixed(2), h: rH.toFixed(2) };

            if (layer.type === 'MC' && selectedMC && Number(selectedMC.l) > 0 && Number(selectedMC.b) > 0 && Number(selectedMC.h) > 0) {
                const fitL = Math.floor(selectedMC.l / cL);
                const fitB = Math.floor(selectedMC.b / cB);
                const fitH = Math.floor(selectedMC.h / cH);
                ups = fitL * fitB * fitH;
                mcQty = ups > 0 ? Math.ceil(finalQtyAI / ups) : 0;
            }
            return { ...layer, autoRate, resSize: currentOut, inSize: currentIn };
        });
        return { results, ups, mcQty };
    }, [layers, baseSize, selectedMC, finalQtyAI]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const submit = async () => {
        if (activeJobObj?.is_on_hold) return;
        setLoading(true);
        try {
            if (tab === 'CUSTOM') {
                const manualRfq = {
                    uid: 'AUTO_CUST',
                    jobNo: 'CUSTOM',
                    subJobNo: 'MANUAL',
                    category: 'CUSTOM',
                    subcategory: 'MANUAL',
                    client: 'Individual',
                    name: customFormData.name,
                    qty: customFormData.qty,
                    image: imageFile || imagePreview,
                    deadline: customFormData.deadline || (deadline ? deadline.split('T')[0] : ''),
                    stage: STAGES[0].name,
                    specs: 'Custom Manual Entry',
                    quotes: [], awards: [], deliverySchedule: [], isSplit: false, deliveryDate: '', deliveryTime: ''
                };
                if (manualRfq.name && manualRfq.qty) await onAdd([manualRfq]);
                return;
            }

            if (tab === 'BULK' && activeJobObj) {
                const rfqs = bulkMaterials
                    .filter(m => selectedItems[m.id] !== undefined)
                    .map(m => ({
                        uid: 'AUTO_RFQ',
                        jobNo: activeJobObj.job_no,
                        subJobNo: activeJobObj.sub_job_no,
                        category: activeJobObj.category,
                        category_id: activeJobObj.category_id,
                        material_category_id: m.material_category_id || null,
                        material_type_id: m.material_type_id || null,
                        vendorName: m.vendorName || null,
                        subcategory: activeJobObj.subcategory,
                        client: activeJobObj.client_name,
                        name: m.name,
                        specs: m.specs,
                        qty: Math.max(1, parseFloat(selectedItems[m.id]) || m.req_qty || 1),
                        stage: STAGES[0].name,
                        quotes: [], awards: [],
                        deadline: deadline ? deadline : null,
                        deliveryDate: deadline ? deadline.split('T')[0] : '',
                        deliveryTime: deadline && deadline.includes('T') ? deadline.split('T')[1] : '',
                        sales_order_nanoid: activeJobObj?.sales_order_nanoid || null,
                    }));
                if (rfqs.length > 0) await onAdd(rfqs);
            } else if (tab === 'AI' && activeJobObj) {
                const aiResults = dataAI.results.filter(l => l.active).map(l => {
                    return {
                        uid: 'AUTO_AI',
                        jobNo: activeJobObj?.job_no,
                        subJobNo: activeJobObj?.sub_job_no,
                        category: activeJobObj?.category,
                        category_id: activeJobObj?.category_id,
                        subcategory: activeJobObj?.subcategory,
                        client: activeJobObj?.client_name,
                        name: l.name,
                        specs: l.type === 'MC' && selectedMC
                            ? `${selectedMC.l}x${selectedMC.b}x${selectedMC.h} in`
                            : `${l.resSize.l}x${l.resSize.b}x${l.resSize.h} in`,
                        qty: l.type === 'MC' ? dataAI.mcQty : Math.round(finalQtyAI),
                        aiBaseRate: l.autoRate,
                        packingBufferVal: bufferVal,
                        packingBufferPrc: wastageAI,
                        packingFinalQty: Math.round(finalQtyAI),
                        // Include logical rates and conditions for vendor reference
                        logicalRate: l.logicalRate || [],
                        stage: STAGES[0].name,
                        quotes: [], awards: [],
                        deadline: (rfqDeadline.date && rfqDeadline.time) ? `${rfqDeadline.date}T${rfqDeadline.time}` : (deadline ? deadline : null),
                        deliverySchedule: [], isSplit: false,
                        deliveryDate: rfqDeadline.date || (deadline ? deadline.split('T')[0] : ''),
                        deliveryTime: rfqDeadline.time || (deadline && deadline.includes('T') ? deadline.split('T')[1] : ''),
                        sales_order_nanoid: activeJobObj?.sales_order_nanoid || null,
                    };
                })
                    .filter(l => l.qty > 0);
                if (aiResults.length > 0) {
                    await onAdd(aiResults);

                    // Mark the sub-job's BOM as "Packing AI Completed" so it's removed from lists
                    try {
                        await reduxDispatch(markPackPurchased(activeJobObj._id)).unwrap();
                    } catch (err) { console.error("Error marking pack purchased:", err); }

                    // Refresh sub-job list for this job to remove the drafted sub-job
                    try {
                        await reduxDispatch(fetchSubJobs({ jobNo: activeJobObj.job_no, tab: 'AI' })).unwrap();

                        // We also refresh packing available jobs just in case this was the last subjob
                        reduxDispatch(fetchPackingAvailableJobs());
                        setSelectedJobNo('');
                    } catch (err) { console.error("Error refreshing packing lists:", err); }

                    // Always clear sub-job selection and detail panel
                    setSelectedJobId('');
                    reduxDispatch(clearJobDetails());
                }
            } else if (tab === 'STORE' && activeJobObj) {
                const storeRfqs = customMaterials
                    .filter(m => selectedItems[m.id] !== undefined)
                    .map(m => ({
                        uid: 'AUTO_STORE',
                        jobNo: activeJobObj.request_number,
                        subJobNo: '',
                        category: '',
                        category_id: m.material_category_id || null,
                        material_category_id: m.material_category_id || null,
                        material_type_id: m.material_type_id || null,
                        vendorName: m.vendorName || null,
                        subcategory: '',
                        client: '',
                        name: m.name,
                        specs: m.specs,
                        qty: Math.max(1, parseFloat(selectedItems[m.id]) || m.req_qty || 1),
                        stage: STAGES[0].name,
                        quotes: [], awards: [],
                        deadline: deadline || null,
                        deliveryDate: deadline ? deadline.split('T')[0] : '',
                        deliveryTime: deadline && deadline.includes('T') ? deadline.split('T')[1] : '',
                        source: 'STORE',
                    }));
                if (storeRfqs.length > 0) await onAdd(storeRfqs);
            }
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setLoading(false);
        }
    };

    /* ── shared field style — readable, not italic uppercase ── */
    const fieldCls = "w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm";

    /* label style helper */
    const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col w-full transition-all duration-300 ${tab === 'AI' ? 'max-w-5xl' : 'max-w-2xl'}`}
                style={{ maxHeight: '90vh', boxShadow: '0 24px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)' }}
            >

                {/* ── TAB BAR ── */}
                <div className="flex shrink-0 rounded-t-3xl overflow-x-auto scrollbar-hide border-b border-slate-100 bg-white">
                    <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                    <button
                        onClick={() => { setTab('BULK'); setSelectedItems({}); }}
                        className={`min-w-[120px] flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all
                            ${tab === 'BULK' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                    >Bulk RFQ</button>

                    <button
                        onClick={() => { setTab('CUSTOM'); setSelectedItems({}); }}
                        className={`min-w-[120px] flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all
                            ${tab === 'CUSTOM' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                    >Custom RFQ</button>

                    <button
                        onClick={() => { setTab('AI'); setSelectedItems({}); }}
                        className={`min-w-[200px] flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all relative
                            ${tab === 'AI' ? 'text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                        style={tab === 'AI' ? { background: '#0f172a', boxShadow: 'inset 0 -4px 0 #3b82f6' } : {}}
                    >
                        Sequential Packing AI
                    </button>

                    <button
                        onClick={() => { setTab('STORE'); setSelectedItems({}); }}
                        className={`min-w-[120px] flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all
                            ${tab === 'STORE' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                    >Store RFQ</button>

                    <button
                        onClick={onClose}
                        className="px-6 py-4 bg-white text-slate-400 hover:text-red-500 transition-colors border-l border-slate-100 flex items-center justify-center"
                    >
                        <PiX className="text-xl font-bold" />
                    </button>
                </div>

                {/* STORE RFQ TAB */}
                {tab === 'STORE' && (
                    <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">

                        {/* ── Job / Sub-job selectors ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Request Number</label>
                                <select
                                    className={fieldCls}
                                    value={selectedJobId}
                                    onChange={e => {
                                        setSelectedJobId(e.target.value);
                                        setSelectedItems({});
                                    }}
                                >
                                    <option value="">— Select Request —</option>
                                    {(storeAvailableRequests || []).map(r => (
                                        <option key={r._id} value={r.request_number}>
                                            {r.request_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Materials table ── */}
                        {!activeJobObj ? (
                            <div className="text-center py-14 text-slate-400">
                                <div className="text-4xl mb-3">🏪</div>
                                <p className="text-sm font-semibold">Select a job to view store materials</p>
                            </div>
                        ) : customMaterials.length === 0 ? (
                            <div className="text-center py-14 text-slate-400">
                                <div className="text-4xl mb-3">📦</div>
                                <p className="text-sm font-semibold">No materials found in BOM for this sub-job</p>
                            </div>
                        ) : (
                            <div className="space-y-3">

                                {/* ── Legend + Select All shortcut ── */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    {tab !== 'STORE' ? (
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block"></span>
                                                Needs Purchase
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-200 inline-block"></span>
                                                Stock OK
                                            </span>
                                        </div>
                                    ) : <div></div>}

                                    {tab === 'STORE' ? (
                                        <button
                                            type="button"
                                            disabled={activeJobObj?.is_on_hold}
                                            onClick={() => {
                                                const next = {};
                                                customMaterials.forEach(m => { next[m.id] = m.req_qty > 0 ? m.req_qty : 1; });
                                                setSelectedItems(next);
                                            }}
                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${activeJobObj?.is_on_hold ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100'}`}
                                        >
                                            ⚡ Select All ({customMaterials.length})
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={activeJobObj?.is_on_hold}
                                            onClick={() => {
                                                const needed = customMaterials.filter(m => m.needsPurchase);
                                                const next = {};
                                                needed.forEach(m => { next[m.id] = m.req_qty > 0 ? m.req_qty : 1; });
                                                setSelectedItems(next);
                                            }}
                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${activeJobObj?.is_on_hold ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100'}`}
                                        >
                                            ⚡ Select All Needed ({customMaterials.filter(m => m.needsPurchase).length})
                                        </button>
                                    )}
                                </div>

                                {/* ── Table header (desktop) ── */}
                                <div
                                    className="hidden sm:grid gap-2 px-4 pb-1"
                                    style={{ gridTemplateColumns: tab === 'STORE' ? '2fr 1fr 1.4fr' : '2fr 1fr 1fr 1fr 1.4fr' }}
                                >
                                    {(tab === 'STORE' ? ['Material', 'Required', 'Purchase Qty'] : ['Material', 'Required', 'In Stock', 'Min Stock', 'Purchase Qty']).map(h => (
                                        <span key={h} className={`text-[9px] font-black uppercase tracking-widest ${activeJobObj?.is_on_hold ? 'text-slate-300' : 'text-slate-400'}`}>{h}</span>
                                    ))}
                                </div>

                                {/* ── Material rows ── */}
                                {customMaterials.map(m => {
                                    const isSelected = selectedItems[m.id] !== undefined;
                                    const isBad = m.needsPurchase;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`rounded-2xl border-2 transition-all ${isSelected
                                                ? 'border-emerald-500 shadow-md shadow-emerald-100'
                                                : (isBad && tab !== 'STORE')
                                                    ? 'border-red-200 bg-red-50/60'
                                                    : 'border-slate-100 bg-slate-50/80'
                                                }`}
                                        >
                                            <div
                                                className={`grid gap-x-3 gap-y-2 p-4 items-center ${activeJobObj?.is_on_hold ? 'cursor-not-allowed' : ''}`}
                                                style={{ gridTemplateColumns: window.innerWidth < 640 ? 'auto 1fr' : (tab === 'STORE' ? '2fr 1fr 1.4fr' : '2fr 1fr 1fr 1fr 1.4fr') }}
                                            >

                                                {/* ── Checkbox + Name ── */}
                                                <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={activeJobObj?.is_on_hold}
                                                        onClick={() => setSelectedItems(prev => {
                                                            const next = { ...prev };
                                                            if (next[m.id] !== undefined) { delete next[m.id]; }
                                                            else { next[m.id] = m.req_qty > 0 ? m.req_qty : 1; }
                                                            return next;
                                                        })}
                                                        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                                            ? 'bg-emerald-600 border-emerald-600'
                                                            : (activeJobObj?.is_on_hold ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-300 bg-white hover:border-emerald-400')
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-black leading-tight ${isBad ? 'text-red-800' : 'text-slate-800'
                                                            }`}>{m.name}</p>
                                                        {m.specs && (
                                                            <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">{m.specs}</p>
                                                        )}
                                                    </div>
                                                    {isBad && tab !== 'STORE' && (
                                                        <span className="shrink-0 text-[8px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded-full tracking-wider sm:hidden">Low</span>
                                                    )}
                                                </div>

                                                {/* ── Required Qty ── */}
                                                <div className="hidden sm:flex flex-col items-start">
                                                    <p className="text-sm font-black text-slate-700">
                                                        {m.req_qty}
                                                        <span className="text-[9px] text-slate-400 ml-0.5 font-semibold"> nos</span>
                                                    </p>
                                                </div>

                                                {/* ── In Stock ── */}
                                                {tab !== 'STORE' && (
                                                    <div className={`hidden sm:flex flex-col items-center px-2 py-1 rounded-lg ${m.stock < m.req_qty && m.stock < m.min_stock ? 'bg-red-100' :
                                                        m.stock < m.req_qty || m.stock < m.min_stock ? 'bg-amber-50' : 'bg-green-50'
                                                        }`}>
                                                        <p className={`text-sm font-black ${m.stock < m.req_qty && m.stock < m.min_stock ? 'text-red-700' :
                                                            m.stock < m.req_qty || m.stock < m.min_stock ? 'text-amber-700' : 'text-green-700'
                                                            }`}>{m.stock}</p>
                                                    </div>
                                                )}

                                                {/* ── Min Stock ── */}
                                                {tab !== 'STORE' && (
                                                    <div className="hidden sm:flex flex-col items-center">
                                                        <p className="text-sm font-black text-slate-500">{m.min_stock}</p>
                                                    </div>
                                                )}

                                                {/* ── Purchase Qty input ── */}
                                                <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                                                    {/* Mobile stock chips */}
                                                    {tab !== 'STORE' && (
                                                        <div className="flex gap-1.5 flex-wrap sm:hidden text-[9px] font-black">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Req: {m.req_qty}</span>
                                                            <span className={`px-2 py-0.5 rounded ${m.stock < m.req_qty ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                                }`}>Stock: {m.stock}</span>
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Min: {m.min_stock}</span>
                                                        </div>
                                                    )}

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Qty"
                                                        disabled={activeJobObj?.is_on_hold}
                                                        value={selectedItems[m.id] ?? ''}
                                                        onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                                        onChange={e => {
                                                            const raw = e.target.value;
                                                            if (raw !== '' && parseFloat(raw) < 0) return;
                                                            setSelectedItems(prev => ({ ...prev, [m.id]: raw }));
                                                        }}
                                                        onFocus={() => {
                                                            if (selectedItems[m.id] === undefined) {
                                                                setSelectedItems(prev => ({ ...prev, [m.id]: m.req_qty > 0 ? m.req_qty : 1 }));
                                                            }
                                                        }}
                                                        onBlur={e => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!e.target.value || isNaN(val) || val <= 0) {
                                                                setSelectedItems(prev => ({ ...prev, [m.id]: m.req_qty > 0 ? m.req_qty : 1 }));
                                                            } else {
                                                                setSelectedItems(prev => ({ ...prev, [m.id]: val }));
                                                            }
                                                        }}
                                                        className={`w-full sm:w-32 px-3 py-2 border-2 rounded-xl text-sm font-black text-center outline-none transition-all ${isSelected
                                                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                                            : (activeJobObj?.is_on_hold ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-500 focus:border-emerald-300')
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Deadline + actions ── */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className={labelCls}>Closure Deadline</label>
                            <input
                                type="datetime-local"
                                min={nowStr}
                                className={fieldCls}
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-4 text-slate-400 font-bold text-sm tracking-wide hover:text-slate-600 transition-colors rounded-2xl border border-slate-200 bg-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submit}
                                disabled={
                                    loading ||
                                    !deadline ||
                                    Object.keys(selectedItems).length === 0 ||
                                    Object.values(selectedItems).some(v => !v || parseFloat(v) <= 0)
                                }
                                className="flex-2 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase text-sm tracking-widest shadow-lg border-b-4 border-emerald-900 active:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                {loading && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {loading
                                    ? 'Processing...'
                                    : `Push to Drafts${Object.keys(selectedItems).length > 0 ? ` (${Object.keys(selectedItems).length})` : ''}`
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* AI TAB */}
                {tab === 'AI' && (
                    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

                        {/* LEFT panel */}
                        <div className="w-full md:w-[58%] p-5 space-y-4 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto"
                            style={{ WebkitOverflowScrolling: 'touch' }}>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Job No</label>
                                    <select
                                        className={`${fieldCls} ${currentJobsList.find(j => j.job_no === selectedJobNo)?.is_on_hold ? 'border-red-300 bg-red-50' : ''}`}
                                        value={selectedJobNo}
                                        onChange={e => {
                                            setSelectedJobNo(e.target.value);
                                            setSelectedJobId('');
                                            setSelectedItems([]);
                                        }}
                                    >
                                        <option value="">— Select Job No —</option>
                                        {currentJobsList.map(j => (
                                            <option key={j.job_no} value={j.job_no}>
                                                {j.job_no} · {j.client_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Sub-Job / Product</label>
                                    <select
                                        className={`${fieldCls} ${availableSubJobs.find(j => j._id === selectedJobId)?.is_on_hold ? 'border-red-300 bg-red-50' : ''}`}
                                        value={selectedJobId}
                                        onChange={e => {
                                            setSelectedJobId(e.target.value);
                                            setSelectedItems([]);
                                        }}
                                        disabled={!selectedJobNo}
                                    >
                                        <option value="">— Select Sub-Job —</option>
                                        {availableSubJobs.map(j => (
                                            <option key={j._id} value={j._id}>
                                                {j.sub_job_no} · {j.product_name || 'Standard Product'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dark product info bar */}
                            {selProd && (
                                <div className="rounded-3xl p-6 text-white space-y-6"
                                    style={{ background: '#0f172a', borderBottom: '4px solid #3b82f6' }}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-black opacity-40 uppercase tracking-widest italic">Product Name</div>
                                                {activeJobObj?.is_on_hold && (
                                                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md animate-pulse">ON HOLD</span>
                                                )}
                                            </div>
                                            <div className={`text-2xl font-black mt-1 uppercase italic tracking-tighter ${activeJobObj?.is_on_hold ? 'text-red-500' : 'text-blue-400'}`}>{selProd}</div>
                                            <div className="text-xs font-black opacity-50 mt-1 italic uppercase tracking-wider">Job Qty: {activeJobObj?.quantity}</div>
                                        </div>
                                        <div className="bg-slate-800/40 px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-4 shrink-0 min-w-[220px] justify-between shadow-inner">
                                            <div className="text-[10px] font-black uppercase tracking-widest italic opacity-90">Buffer Units:</div>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                min="0"
                                                disabled={activeJobObj?.is_on_hold}
                                                className={`w-16 bg-transparent text-white font-black text-right border-b-2 border-blue-500 outline-none text-xl leading-none py-1 ${activeJobObj?.is_on_hold ? 'opacity-50 cursor-not-allowed border-white/10' : ''}`}
                                                value={bufferVal}
                                                onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === '') {
                                                        setBufferVal('');
                                                    } else {
                                                        const num = parseInt(val);
                                                        if (!isNaN(num)) setBufferVal(Math.max(0, num));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { lbl: 'Length', key: 'l' },
                                            { lbl: 'Width', key: 'b' },
                                            { lbl: 'Height', key: 'h' }
                                        ].map(({ lbl, key }) => (
                                            <div key={lbl} className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 text-blue-200 text-center flex flex-col items-center justify-center gap-1 shadow-sm">
                                                <span className="text-[10px] font-black opacity-50 italic uppercase tracking-widest mb-1">{lbl}</span>
                                                <span className="text-xl font-black italic uppercase tracking-tighter">
                                                    {Number(baseSize[key] || 0).toFixed(2)} <span className="text-[12px] opacity-50 ml-1">IN</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Layer cards */}
                            <div className="space-y-3">
                                {layers.map((layer, idx) => {
                                    // Logic: 
                                    // 1. If layer is NOT in BOM, hide it (return null)
                                    // 2. If layer IS in BOM, show it.
                                    // 3. If layer is in BOM but active=false, show as disabled.

                                    const bomItems = activeJobObj?.packing_materials || [];
                                    const isInBom = layer.type === 'MC' || layer.type === 'CB' || bomItems.some(bi =>
                                        (layer.type === 'TH' && (bi.name === 'Thermocol (Custom)' || bi.material_name === 'Thermocol (Custom)')) ||
                                        (layer.type === 'TB' && (bi.name === 'Black Box (Custom)' || bi.material_name === 'Black Box (Custom)'))
                                    );

                                    if (!isInBom && layer.type !== 'CB') return null;
                                    if (layer.type === 'CB' && !layer.isAdded) return null;

                                    const isAllowed = !activeJobObj ||
                                        layer.type === 'CB' ||
                                        (layer.type === 'MC' && activeJobObj?.allow_mastercarton_packing === true) ||
                                        (layer.type === 'TH' && activeJobObj?.allow_thermocol_packing === true) ||
                                        (layer.type === 'TB' && activeJobObj?.allow_blackbox_packing === true);

                                    if (!isAllowed) return null;

                                    return (
                                        <div key={idx} className={`p-4 border-2 rounded-2xl transition-all relative ${layer.active ? 'border-blue-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-3 gap-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={layer.active}
                                                        disabled={activeJobObj?.is_on_hold}
                                                        onChange={() => setLayers(layers.map((l, i) => i === idx ? { ...l, active: !l.active } : l))}
                                                        className={`w-5 h-5 accent-blue-600 rounded shrink-0 ${activeJobObj?.is_on_hold ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                    />
                                                    {layer.type === 'CB' ? (
                                                        <input
                                                            disabled={activeJobObj?.is_on_hold}
                                                            className={`font-bold text-sm text-blue-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg outline-none w-full shadow-sm focus:border-blue-400 transition-all ${!layer.active || activeJobObj?.is_on_hold ? 'opacity-50' : ''} ${activeJobObj?.is_on_hold ? 'cursor-not-allowed' : ''}`}
                                                            value={layer.name}
                                                            onChange={e => setLayers(layers.map((l, i) => i === idx ? { ...l, name: e.target.value } : l))}
                                                        />
                                                    ) : (
                                                        <span className={`font-bold text-sm text-blue-900 leading-none truncate ${!layer.active ? 'opacity-50' : ''}`}>
                                                            {layer.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 whitespace-nowrap">
                                                        AI Base: ₹{dataAI.results[idx].autoRate}
                                                    </span>
                                                    {layer.type === 'CB' && (
                                                        <button
                                                            type="button"
                                                            disabled={activeJobObj?.is_on_hold}
                                                            onClick={() => setLayers(layers.map(l =>
                                                                l.type === 'TB' ? { ...l, active: true } :
                                                                    l.type === 'CB' ? { ...l, isAdded: false, active: false } : l
                                                            ))}
                                                            title="Remove Custom Box"
                                                            className={`shink-0 text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 rounded-full hover:bg-red-50 ${activeJobObj?.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <PiX className="text-sm font-black" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelCls}>Cushion / Gap (in)</label>
                                                    <input
                                                        type="number" step="0.05"
                                                        min="0"
                                                        disabled={!layer.active || activeJobObj?.is_on_hold}
                                                        className={`${fieldCls} ${!layer.active || activeJobObj?.is_on_hold ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''}`}
                                                        value={layer.type === 'TH' ? layer.cushion : layer.gap}
                                                        onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            // Only update if empty or non-negative
                                                            if (val !== '' && parseFloat(val) < 0) return;

                                                            setLayers(layers.map((l, i) => i === idx ? {
                                                                ...l,
                                                                cushion: l.type === 'TH' ? val : 0,
                                                                gap: l.type !== 'TH' ? val : 0
                                                            } : l));
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className={labelCls}>Accumulated Size</label>
                                                    {layer.type === 'CB_MANUAL' ? ( // Changing condition to hide manual size for CB
                                                        <div className="flex flex-wrap items-center gap-1 mt-1">
                                                            {['l', 'b', 'h'].map((dim, i) => (
                                                                <React.Fragment key={dim}>
                                                                    <input
                                                                        type="number" step="0.01" min="0" placeholder={dim.toUpperCase()}
                                                                        disabled={!layer.active}
                                                                        className={`w-16 px-2 py-2 bg-blue-50 border-2 border-blue-100 rounded-xl text-sm font-black text-blue-700 outline-none text-center focus:border-blue-300 transition-all ${!layer.active ? 'opacity-50 grayscale' : ''}`}
                                                                        value={layer.manualSize?.[dim] || ''}
                                                                        onChange={e => {
                                                                            const val = e.target.value;
                                                                            if (val !== '' && parseFloat(val) < 0) return;
                                                                            setLayers(layers.map((l, li) => li === idx ? {
                                                                                ...l,
                                                                                manualSize: { ...l.manualSize, [dim]: val }
                                                                            } : l));
                                                                        }}
                                                                    />
                                                                    {i < 2 && <span className="text-[10px] font-bold text-blue-200">×</span>}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="font-bold text-base text-blue-600">
                                                            {dataAI.results[idx].resSize.l} × {dataAI.results[idx].resSize.b} × {dataAI.results[idx].resSize.h} in
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {layer.type === 'TB' && !layers.find(l => l.type === 'CB').isAdded && isAllowed && (
                                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={activeJobObj?.is_on_hold}
                                                        onClick={() => setLayers(layers.map(l =>
                                                            l.type === 'TB' ? { ...l, active: false } :
                                                                l.type === 'CB' ? { ...l, isAdded: true, active: true } : l
                                                        ))}
                                                        className={`text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all shadow-sm ${activeJobObj?.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >+ Add Custom Box</button>
                                                </div>
                                            )}

                                            {layer.type === 'CB' && (
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <div>
                                                        <label className={labelCls}>Manual Rate (₹)</label>
                                                        <input
                                                            type="number" step="0.01" min="0"
                                                            disabled={activeJobObj?.is_on_hold}
                                                            className={`${fieldCls} ${activeJobObj?.is_on_hold ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''}`}
                                                            value={layer.manualRate || ''}
                                                            onChange={e => setLayers(layers.map((l, i) => i === idx ? { ...l, manualRate: e.target.value } : l))}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {layer.type === 'MC' && (
                                                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                                    <div>
                                                        <label className={labelCls}>Outer MC Rate (Manual)</label>
                                                        <input
                                                            type="number" step="0.01" min="0"
                                                            className={`${fieldCls} ${!layer.active || activeJobObj?.is_on_hold ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''}`}
                                                            disabled={!layer.active || activeJobObj?.is_on_hold}
                                                            value={layer.manualRate || ''}
                                                            onChange={e => setLayers(layers.map((l, i) => i === idx ? { ...l, manualRate: e.target.value } : l))}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Outer MC Type</label>
                                                        <select
                                                            className={`${fieldCls} ${!layer.active || activeJobObj?.is_on_hold ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''}`}
                                                            disabled={!layer.active || activeJobObj?.is_on_hold}
                                                            value={selectedMC?.name || ''}
                                                            onChange={e => {
                                                                setSelectedMC(MASTER_CARTONS.find(m => m.name === e.target.value));
                                                            }}
                                                        >
                                                            <option value="">— Select Master Carton —</option>
                                                            {MASTER_CARTONS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT panel */}
                        <div className="w-full md:w-[42%] p-5 space-y-3 bg-slate-50 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto"
                            style={{ WebkitOverflowScrolling: 'touch' }}>

                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold uppercase text-blue-600 border-b border-slate-100 pb-2 mb-3 tracking-wider">Live AI Benchmark Results</h4>
                                {activeJobObj ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-400 font-semibold">Job No</p>
                                            <p className="text-sm font-bold text-slate-800">{activeJobObj.job_no}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-400 font-semibold">Sub-Job</p>
                                            <p className="text-sm font-bold text-slate-800">{activeJobObj.sub_job_no}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-400 font-semibold">Client</p>
                                            <p className="text-sm font-bold text-slate-800 truncate max-w-[140px] text-right">{activeJobObj.client_name}</p>
                                        </div>
                                        <div className="flex justify-between items-center bg-blue-50 rounded-xl px-3 py-2 border border-blue-100 mt-1">
                                            <p className="text-xs text-blue-700 font-black uppercase tracking-wider">Job Qty</p>
                                            <p className="text-xl font-black text-blue-700 leading-none">{activeJobObj.quantity || 0} <span className="text-[10px] font-semibold opacity-60">nos</span></p>
                                        </div>
                                    </div>
                                ) : <p className="text-xs text-slate-300 font-semibold">Select a job to begin</p>}
                            </div>

                            <div className="space-y-4">
                                {dataAI.results.map((r, i) => {
                                    // Only show benchmark results for active layers
                                    if (!r.active) return null;

                                    return (
                                        <div key={i} className="bg-white rounded-2xl border-l-8 border-blue-600 shadow-md flex justify-between items-center p-6">
                                            <div className="flex-1 min-w-0">
                                                {r.type === 'TH' && (
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">TH SPECS</p>
                                                        <p className="font-extrabold text-sm text-slate-800">{r.resSize.l} × {r.resSize.b} × {r.resSize.h} IN</p>
                                                    </div>
                                                )}
                                                {(r.type === 'TB' || r.type === 'CB') && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-indigo-500">
                                                            {r.name} SPECS
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">INNER SIZE:</p>
                                                            <p className="font-extrabold text-[12px] text-slate-800">{r.inSize.l} × {r.inSize.b} × {r.inSize.h} IN</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">OUTER SIZE:</p>
                                                            <p className="font-extrabold text-[12px] text-slate-800">{r.resSize.l} × {r.resSize.b} × {r.resSize.h} IN</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {r.type === 'MC' && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">OUTER MC SIZE</p>
                                                        <p className="font-extrabold text-sm text-slate-800">
                                                            {selectedMC ? `${selectedMC.l} × ${selectedMC.b} × ${selectedMC.h} IN` : `${r.resSize.l} × ${r.resSize.b} × ${r.resSize.h} IN`}
                                                        </p>
                                                        {selectedMC && (
                                                            <p className="text-[9px] text-blue-600 font-black uppercase italic tracking-wider">
                                                                Stack: {dataAI.ups} units ({Math.floor(selectedMC.l / r.resSize.l)}x{Math.floor(selectedMC.b / r.resSize.b)}x{Math.floor(selectedMC.h / r.resSize.h)})
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right border-l-2 border-slate-100 pl-6 ml-6 shrink-0 flex flex-col items-end gap-1">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic mb-1">REQ QTY</p>
                                                <p className="font-black text-2xl leading-none text-slate-800 mb-2">{r.type === 'MC' ? dataAI.mcQty : Math.round(finalQtyAI)}</p>
                                                <p className="text-[11px] font-black text-slate-400 leading-none">RATE: <span className="text-blue-600 text-xl font-black italic ml-1">₹{r.autoRate}</span></p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-white rounded-2xl border-t-4 border-indigo-600 shadow-sm p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-slate-400 font-semibold">Wastage / Buffer</p>
                                    <p className="text-sm font-bold text-red-500">{bufferVal} units · {wastageAI}%</p>
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Production Qty</p>
                                    <p className="text-4xl font-black text-indigo-700 leading-none">{Math.round(finalQtyAI)}</p>
                                </div>
                            </div>

                            <div className="bg-blue-600 rounded-2xl p-4 text-white space-y-2.5 border-b-4 border-blue-800 shadow-lg">
                                <h5 className="text-xs font-bold uppercase tracking-wider">RFQ Submission Deadline</h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-blue-200 mb-1">Date</label>
                                        <input type="date" min={todayStr}
                                            disabled={activeJobObj?.is_on_hold}
                                            className={`p-2.5 rounded-xl text-sm font-semibold text-slate-800 bg-white/95 outline-none w-full ${activeJobObj?.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onChange={e => setRfqDeadline({ ...rfqDeadline, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-blue-200 mb-1">Time</label>
                                        <input type="time"
                                            disabled={activeJobObj?.is_on_hold}
                                            className={`p-2.5 rounded-xl text-sm font-semibold text-slate-800 bg-white/95 outline-none w-full ${activeJobObj?.is_on_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onChange={e => setRfqDeadline({ ...rfqDeadline, time: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={submit}
                                disabled={
                                    loading ||
                                    !selectedJobId ||
                                    !rfqDeadline.date ||
                                    !rfqDeadline.time ||
                                    bufferVal === '' || // All inputs mandatory (allows 0)
                                    (layers.filter(l => l.active).length === 0) || // Must have at least one layer
                                    (layers.find(l => l.type === 'MC')?.active && !selectedMC) || // MC selection mandatory if active
                                    // Custom Box (name + rate) & MC (rate) manual fields mandatory if active
                                    layers.some(l => l.active && (
                                        (l.type === 'CB' && (!l.name.trim() || !l.manualRate || parseFloat(l.manualRate) <= 0)) ||
                                        (l.type === 'MC' && (!l.manualRate || parseFloat(l.manualRate) <= 0))
                                    ))
                                }
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase text-sm tracking-widest shadow-lg border-b-4 border-blue-900 active:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {loading ? 'Processing...' : 'Push to Drafts'}
                            </button>
                        </div>
                    </div>
                )}

                {/* CUSTOM RFQ TAB */}
                {tab === 'CUSTOM' && (
                    <div className="p-8 sm:p-10 space-y-6 overflow-y-auto flex-1 custom-scroll scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Manual Custom Entry</h3>

                            {/* Link to Job (Optional) removed */}

                            <div>
                                <label className={labelCls}>Product Name</label>
                                <input className={fieldCls} type="text" placeholder="e.g. Exotic Wooden Base" value={customFormData.name} onChange={e => setCustomFormData({ ...customFormData, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Quantity</label>
                                    <input
                                        className={fieldCls}
                                        type="number"
                                        min="1"
                                        placeholder="0"
                                        value={customFormData.qty}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '' || parseInt(val) > 0) {
                                                setCustomFormData({ ...customFormData, qty: val });
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Closure Deadline</label>
                                    <input className={fieldCls} type="date" min={todayStr} value={customFormData.deadline} onChange={e => setCustomFormData({ ...customFormData, deadline: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Reference Image upload</label>
                                <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-2xl p-6 transition-all hover:border-indigo-400 hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden min-h-[140px] relative">
                                    {imagePreview ? (
                                        <div className="absolute inset-0">
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <PiCamera className="text-3xl text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            <p className="text-xs font-bold text-slate-400 uppercase">Click to upload image</p>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={onClose} disabled={loading} className="flex-1 py-4 text-slate-400 font-bold text-sm tracking-wide hover:text-slate-600 transition-colors rounded-2xl border border-slate-200 hover:border-slate-300 bg-white">Cancel</button>
                            <button
                                onClick={submit}
                                disabled={loading || !customFormData.name || !customFormData.qty || parseInt(customFormData.qty) <= 0 || !customFormData.deadline}
                                className="flex-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase text-sm tracking-widest shadow-lg border-b-4 border-indigo-900 active:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {loading ? 'Processing...' : 'Push to Drafts'}
                            </button>
                        </div>
                    </div>
                )}

                {/* BULK RFQ TAB */}
                {tab === 'BULK' && (
                    <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                        {/* Job / Sub-job selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Job No</label>
                                <select
                                    className={`${fieldCls} ${currentJobsList.find(j => j.job_no === selectedJobNo)?.is_on_hold ? 'border-red-300 bg-red-50' : ''}`}
                                    value={selectedJobNo}
                                    onChange={e => { setSelectedJobNo(e.target.value); setSelectedJobId(''); setSelectedItems({}); }}
                                >
                                    <option value="">— Select Job No —</option>
                                    {currentJobsList.map(j => (
                                        <option key={j.job_no} value={j.job_no}>
                                            {j.job_no} · {j.client_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Sub-Job / Product</label>
                                <select
                                    className={`${fieldCls} ${availableSubJobs.find(j => j._id === selectedJobId)?.is_on_hold ? 'border-red-300 bg-red-50' : ''}`}
                                    value={selectedJobId}
                                    onChange={e => { setSelectedJobId(e.target.value); setSelectedItems({}); }}
                                    disabled={!selectedJobNo}
                                >
                                    <option value="">— Select Sub-Job —</option>
                                    {availableSubJobs.map(j => (
                                        <option key={j._id} value={j._id}>
                                            {j.sub_job_no} · {j.product_name || 'Standard Product'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Materials table */}
                        {!activeJobObj ? (
                            <div className="text-center py-14 text-slate-400">
                                <div className="text-4xl mb-3">📋</div>
                                <p className="text-sm font-semibold">Select a job to view materials</p>
                            </div>
                        ) : bulkMaterials.length === 0 ? (
                            <div className="text-center py-14 text-slate-400">
                                <div className="text-4xl mb-3">📦</div>
                                <p className="text-sm font-semibold">No materials found in BOM for this sub-job</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Legend + Select All shortcut */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block"></span>Needs Purchase</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-50 border border-green-200 inline-block"></span>Stock OK</span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={activeJobObj?.is_on_hold}
                                        onClick={() => {
                                            const needed = bulkMaterials.filter(m => m.needsPurchase);
                                            const next = {};
                                            needed.forEach(m => { next[m.id] = m.req_qty > 0 ? m.req_qty : 1; });
                                            setSelectedItems(next);
                                        }}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${activeJobObj?.is_on_hold ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100'}`}
                                    >
                                        ⚡ Select All Needed ({bulkMaterials.filter(m => m.needsPurchase).length})
                                    </button>
                                </div>

                                {/* Table header */}
                                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] gap-2 px-4 pb-1">
                                    {['Material', 'Required', 'In Stock', 'Min Stock', 'Purchase Qty'].map(h => (
                                        <span key={h} className={`text-[9px] font-black uppercase tracking-widest ${activeJobObj?.is_on_hold ? 'text-slate-300' : 'text-slate-400'}`}>{h}</span>
                                    ))}
                                </div>

                                {/* Material rows */}
                                {bulkMaterials.map(m => {
                                    const isSelected = selectedItems[m.id] !== undefined;
                                    const isBad = m.needsPurchase;
                                    const isCustomType = m.itemType === 'Custom';
                                    return (
                                        <div
                                            key={m.id}
                                            className={`rounded-2xl border-2 transition-all ${isSelected
                                                ? 'border-blue-500 shadow-md shadow-blue-100'
                                                : isBad
                                                    ? 'border-red-200 bg-red-50/60'
                                                    : 'border-slate-100 bg-slate-50/80'
                                                }`}
                                        >
                                            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr_1.4fr] gap-x-3 gap-y-2 p-4 items-center">
                                                {/* Checkbox + Name (spans full width on mobile) */}
                                                <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={activeJobObj?.is_on_hold}
                                                        onClick={() => setSelectedItems(prev => {
                                                            const next = { ...prev };
                                                            if (next[m.id] !== undefined) { delete next[m.id]; }
                                                            else { next[m.id] = m.req_qty > 0 ? m.req_qty : 1; }
                                                            return next;
                                                        })}
                                                        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : (activeJobObj?.is_on_hold ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-300 bg-white hover:border-blue-400')
                                                            }`}
                                                    >
                                                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-black leading-tight ${isBad ? 'text-red-800' : 'text-slate-800'}`}>{m.name}</p>
                                                        {m.specs && <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">{m.specs}</p>}
                                                    </div>
                                                    {isCustomType && <span className="shrink-0 text-[8px] font-black uppercase bg-slate-400 text-white px-2 py-0.5 rounded-full tracking-wider">Custom</span>}
                                                    {isBad && <span className="shrink-0 text-[8px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded-full tracking-wider sm:hidden">Low</span>}
                                                </div>

                                                {/* Stock cells */}
                                                <div className="hidden sm:flex flex-col items-center">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5 sm:hidden">Required</p>
                                                    <p className="text-sm font-black text-slate-700">{m.req_qty}<span className="text-[9px] text-slate-400 ml-0.5 font-semibold"> nos</span></p>
                                                </div>
                                                <div className={`hidden sm:flex flex-col items-center px-2 py-1 rounded-lg ${m.stock < m.req_qty && m.stock < m.min_stock ? 'bg-red-100' :
                                                    m.stock < m.req_qty || m.stock < m.min_stock ? 'bg-amber-50' : 'bg-green-50'
                                                    }`}>
                                                    <p className={`text-sm font-black ${m.stock < m.req_qty && m.stock < m.min_stock ? 'text-red-700' :
                                                        m.stock < m.req_qty || m.stock < m.min_stock ? 'text-amber-700' : 'text-green-700'
                                                        }`}>{m.stock}</p>
                                                </div>
                                                <div className="hidden sm:flex flex-col items-center">
                                                    <p className="text-sm font-black text-slate-500">{m.min_stock}</p>
                                                </div>

                                                {/* Purchase Qty input — always visible */}
                                                <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                                                    {/* Mobile stock chips */}
                                                    <div className="flex gap-1.5 flex-wrap sm:hidden text-[9px] font-black">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Req: {m.req_qty}</span>
                                                        <span className={`px-2 py-0.5 rounded ${m.stock < m.req_qty ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                            }`}>Stock: {m.stock}</span>
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Min: {m.min_stock}</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Qty"
                                                        disabled={activeJobObj?.is_on_hold}
                                                        value={selectedItems[m.id] ?? ''}
                                                        onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                                        onChange={e => {
                                                            const raw = e.target.value;
                                                            // Block negative values
                                                            if (raw !== '' && parseFloat(raw) < 0) return;
                                                            // Allow clearing while typing, but store raw string
                                                            setSelectedItems(prev => ({ ...prev, [m.id]: raw }));
                                                        }}
                                                        onFocus={() => {
                                                            // Auto-select row on first focus
                                                            if (selectedItems[m.id] === undefined) {
                                                                setSelectedItems(prev => ({ ...prev, [m.id]: m.req_qty > 0 ? m.req_qty : 1 }));
                                                            }
                                                        }}
                                                        onBlur={e => {
                                                            const val = parseFloat(e.target.value);
                                                            // Snap to 1 if empty, 0, or negative
                                                            if (!e.target.value || isNaN(val) || val <= 0) {
                                                                setSelectedItems(prev => ({ ...prev, [m.id]: m.req_qty > 0 ? m.req_qty : 1 }));
                                                            } else {
                                                                setSelectedItems(prev => ({ ...prev, [m.id]: val }));
                                                            }
                                                        }}
                                                        className={`w-full sm:w-32 px-3 py-2 border-2 rounded-xl text-sm font-black text-center outline-none transition-all ${isSelected
                                                            ? 'border-blue-400 bg-blue-50 text-blue-800'
                                                            : (activeJobObj?.is_on_hold ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-500 focus:border-blue-300')
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Deadline + actions */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className={labelCls}>Closure Deadline</label>
                            <input type="datetime-local" min={nowStr} disabled={activeJobObj?.is_on_hold} className={fieldCls} value={deadline} onChange={e => setDeadline(e.target.value)} />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} disabled={loading} className="flex-1 py-4 text-slate-400 font-bold text-sm tracking-wide hover:text-slate-600 transition-colors rounded-2xl border border-slate-200 bg-white">Cancel</button>
                            <button
                                onClick={submit}
                                disabled={loading || !deadline || Object.keys(selectedItems).length === 0 || Object.values(selectedItems).some(v => !v || parseFloat(v) <= 0)}
                                className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase text-sm tracking-widest shadow-lg border-b-4 border-blue-900 transition-all flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {loading
                                    ? 'Processing...'
                                    : `Push to Drafts${Object.keys(selectedItems).length > 0 ? ` (${Object.keys(selectedItems).length})` : ''}`
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratorModal;