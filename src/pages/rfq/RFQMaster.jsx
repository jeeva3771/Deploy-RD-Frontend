import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PiPlusCircleBold, PiCamera } from 'react-icons/pi';
import { FaEye } from 'react-icons/fa';
import GeneratorModal from './components/GeneratorModal';
import WorkflowModal from './components/WorkflowModal';
import ImageLightbox from '../common/ImageLightbox';
import { fetchItems, fetchAvailableJobs, addRFQs, updateRFQ, patchRFQImage } from '../../reducer/rfqReducer';
import { toast } from 'react-toastify';
import { axiosInstance } from '../../utils/url/config';
import { FormControl, Select, MenuItem } from '@mui/material';

const STAGES = [
    { name: "1. Draft RFQ", color: "bg-slate-500" },
    { name: "2. Assign Vendors", color: "bg-indigo-600" },
    { name: "3. Review (Negotiate)", color: "bg-amber-500" },
    { name: "4. PO Awarded", color: "bg-green-600" },
    { name: "5. In Process", color: "bg-orange-500" },
    { name: "6. Delivery", color: "bg-blue-500" }
];

const RFQDashboard = () => {
    const dispatch = useDispatch();
    const { items, availableJobs, isLoading } = useSelector(state => state.rfq);
    const { user } = useSelector(state => state.auth);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedCreator, setSelectedCreator] = useState("");
    const [creators, setCreators] = useState([]);

    const fileRef = React.useRef(null);
    const [uploadingId, setUploadingId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Visible only for Admin or Purchase Head
    const showFilter = user?.role?.toLowerCase() === "admin executive" || (user?.role?.toLowerCase().includes("purchase") && user?.is_head);

    useEffect(() => {
        dispatch(fetchItems({ creatorId: selectedCreator, search: debouncedSearch }));
        dispatch(fetchAvailableJobs());
    }, [dispatch, selectedCreator, debouncedSearch]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (showFilter) {
            const getCreators = async () => {
                try {
                    const { data } = await axiosInstance.get("/user?roleName=Purchase Manager,Purchase Coordinator,admin executive&is_active=true");
                    if (data.success) setCreators(data.data || []);
                    console.log(data.data);
                } catch (err) {
                    console.error("Error fetching creators:", err);
                }
            };
            getCreators();
        }
    }, [showFilter]);

    const handleUpdateItem = async (updated, customMessage) => {
        try {
            await dispatch(updateRFQ(updated)).unwrap();
            if (customMessage !== false) {
                toast.success(customMessage || "RFQ Updated Successfully");
            }
            setActiveModal(null);
        } catch (error) {
            const errMsg = typeof error === 'string' ? error : (error?.message || "Error updating RFQ");
            console.error("Error updating RFQ:", error);
            // Stale action — re-throw so WorkflowModal can show in-modal overlay
            if (errMsg.includes('already progressed') || errMsg.includes('Please refresh')) {
                throw errMsg; // WorkflowModal will catch this
            } else {
                toast.error(errMsg);
            }
        }
    };

    const handleAddRFQs = async (rfqs) => {
        try {
            await dispatch(addRFQs(rfqs)).unwrap();
            toast.success(`${rfqs.length} RFQ(s) Created Successfully`);
            setActiveModal(null);
        } catch (error) {
            toast.error(error || "Error creating RFQs");
            console.error("Error creating RFQs:", error);
        }
    };

    const patchImage = async (id, img) => {
        try {
            await dispatch(patchRFQImage({ id, img })).unwrap();
            toast.success("Image Updated Successfully");
        } catch (error) {
            toast.error(error || "Error patching image");
            console.error("Error patching image:", error);
        }
    };

    const handleCameraClick = (e, id) => {
        e.stopPropagation();
        setUploadingId(id);
        fileRef.current?.click();
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file && uploadingId) {
            patchImage(uploadingId, file);
        }
        e.target.value = ''; // Reset the input to allow selecting same file again
    };

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 h-[calc(100vh-90px)] mt-2 w-full font-black italic">
            {/* <style>{`
                .custom-scroll::-webkit-scrollbar { height: 8px; width: 6px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            `}</style> */}

            {/* Sub-header integrated below global AppHeader */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm z-10 shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
                        Procurement Engine
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative group mr-2">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-xs"></i>
                        <input
                            type="text"
                            placeholder="SEARCH BY JOB / RFQ / CLIENT / MATERIAL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-2 border-slate-200 rounded py-2 pl-9 pr-10 w-56 sm:w-80 text-[10px] font-black italic uppercase tracking-wider focus:outline-none focus:border-blue-500 transition-all shadow-sm h-[32px]"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <i className="fa-solid fa-circle-xmark text-xs"></i>
                            </button>
                        )}
                    </div>

                    {showFilter && (
                        <FormControl
                            variant="outlined"
                            size="small"
                            style={{ minWidth: 0 }}
                            className="w-full sm:w-auto"
                        >
                            <Select
                                value={selectedCreator}
                                onChange={(e) => setSelectedCreator(e.target.value)}
                                displayEmpty
                                size="small"
                                className="capitalize dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-2xl overflow-hidden font-black uppercase italic tracking-tight text-slate-700 shadow-sm border-2 border-slate-200"
                                inputProps={{
                                    style: {
                                        paddingRight: "32px",
                                        paddingLeft: "12px",
                                        whiteSpace: "nowrap",
                                    },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        border: '1px solid',
                                        borderColor: 'rgba(148, 163, 184, 0.4)',
                                        borderRadius: '12px',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(148, 163, 184, 0.7)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        border: '1px solid',
                                        borderColor: 'rgba(148, 163, 184, 0.4)',
                                    },
                                    "& .MuiSelect-select": {
                                        whiteSpace: "nowrap",
                                        overflow: "visible",
                                        textOverflow: "unset",
                                        minWidth: "fit-content",
                                        padding: '8px 12px',
                                        fontSize: '13px',        // bumped from 12px
                                        fontWeight: '600',        // add this
                                        letterSpacing: '0',       // reset tight tracking from className
                                    },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        className: "dark:bg-gray-800 dark:text-gray-100",
                                        style: { minWidth: "fit-content" },
                                    },
                                }}
                            >
                                <MenuItem value="">
                                    <span className="text-[var(--theme-text-muted)] rounded-2xl dark:text-gray-400 pr-4 text-[11px] font-black uppercase italic">
                                        All Creators
                                    </span>
                                </MenuItem>
                                {creators.map((creator) => (
                                    <MenuItem
                                        key={creator._id}
                                        value={creator._id}
                                        className="text-[10px] font-black"
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        <span className="pr-4">{creator.name} - <span className="opacity-60 text-[14px]">{creator.role?.name || "N/A"}</span></span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <button
                        onClick={() => setActiveModal('GEN')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-all active:scale-95 leading-none uppercase italic border-b-4 border-blue-900"
                    >
                        <PiPlusCircleBold className="text-xl" />
                        <span>Generate RFQ</span>
                    </button>
                </div>
            </div>

            {/* Kanban board */}
            <div
                className="flex-1 overflow-x-auto p-6 flex gap-6 items-stretch relative h-full scrollbar-thin"
                style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
            >
                {STAGES.map(stage => (
                    <div
                        key={stage.name}
                        style={{
                            minWidth: 330, maxWidth: 330,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%',
                            flexShrink: 0
                        }}
                    >
                        {/* Column header */}
                        <div className={`p-4 rounded-t-2xl flex justify-between items-center font-black uppercase text-[10px] text-white ${stage.color}`}>
                            <span>{stage.name}</span>
                            <span className="bg-white/20 px-2 rounded-full font-black">
                                {items.filter(i => {
                                    if (stage.name === '2. Assign Vendors') {
                                        return i.stage === '2. Assign Vendors' && (!i.quotes || i.quotes.length === 0);
                                    }
                                    if (stage.name === '3. Review (Negotiate)') {
                                        return i.stage === '3. Review (Negotiate)' || (i.stage === '2. Assign Vendors' && i.quotes && i.quotes.length > 0);
                                    }
                                    return i.stage === stage.name;
                                }).length}
                            </span>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                            {items.filter(i => {
                                if (stage.name === '2. Assign Vendors') {
                                    return i.stage === '2. Assign Vendors' && (!i.quotes || i.quotes.length === 0);
                                }
                                if (stage.name === '3. Review (Negotiate)') {
                                    return i.stage === '3. Review (Negotiate)' || (i.stage === '2. Assign Vendors' && i.quotes && i.quotes.length > 0);
                                }
                                return i.stage === stage.name;
                            }).map(item => {
                                const isImageLocked = ["5. In Process", "6. Delivery"].includes(item.stage);

                                return (
                                    <div
                                        key={item._id}
                                        className="bg-white p-5 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm transition-all group relative cursor-pointer"
                                        onClick={() => setActiveModal(item)}
                                    >
                                        {/* Top row */}
                                        <div className="flex justify-between items-start mb-3 leading-none italic">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg tracking-tighter italic border border-blue-100 h-[22px] flex items-center">
                                                    {item.subJobNo && item.subJobNo !== 'MANUAL' ? item.subJobNo : item.jobNo}
                                                </span>
                                                {item.reference_no && (
                                                    <span className="text-slate-400 font-[1000] italic text-[11px] leading-tight tracking-normal">
                                                        - {item.reference_no}
                                                    </span>
                                                )}
                                                {item.is_on_hold && item.stage !== "6. Delivery" && (
                                                    <span
                                                        style={{
                                                            border: "1.5px solid red",
                                                            color: "red",
                                                            fontWeight: 900,
                                                            padding: "4px 10px",
                                                            borderRadius: "8px",
                                                            fontSize: "10px",
                                                            backgroundColor: "transparent",
                                                            fontStyle: "italic",
                                                            textTransform: "uppercase",
                                                            whiteSpace: "nowrap",
                                                            lineHeight: 1,
                                                            height: "22px",
                                                            display: "flex",
                                                            alignItems: "center"
                                                        }}
                                                        className="animate-pulse"
                                                    >
                                                        On Hold
                                                    </span>
                                                )}
                                            </div>
                                            {/* <span className="text-[9px] font-bold text-slate-400 italic uppercase">#{item.uid?.split('-')[1]}</span> */}
                                            <span className="text-[10px] font-bold text-slate-400 italic uppercase">
                                                {item.uid}
                                            </span>

                                        </div>

                                        {/* Image + content row */}
                                        <div className="flex gap-4">
                                            {/* Image thumb */}
                                            <div
                                                onClick={(e) => {
                                                    if (!item.image && !isImageLocked) handleCameraClick(e, item._id);
                                                }}
                                                className={`h-16 w-16 shrink-0 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner italic uppercase transition-colors group/thumb ${(!item.image && !isImageLocked) ? 'cursor-pointer hover:border-blue-200 hover:bg-slate-100' : ''}`}
                                            >
                                                {item.image
                                                    ? <img src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_BACKEND_URL}/${item.image}`} className="w-full h-full object-cover" alt="ref" />
                                                    : <PiCamera className={`text-2xl ${isImageLocked ? 'text-slate-200' : 'text-slate-300'}`} />
                                                }
                                                {/* Camera overlay on hover */}
                                                {item.image && (
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); setPreviewImage(item.image); }} className="text-white hover:text-blue-300 hover:scale-110 transition-transform">
                                                            <FaEye className="text-lg" />
                                                        </button>
                                                        {!isImageLocked && (
                                                            <button onClick={(e) => handleCameraClick(e, item._id)} className="text-white hover:text-amber-300 hover:scale-110 transition-transform">
                                                                <PiCamera className="text-lg" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-slate-800 text-sm leading-tight italic uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase leading-none tracking-wider">{item.qty} Nos</p>
                                                <p className="text-[9px] text-slate-400 font-medium truncate mt-1 italic">{item.specs}</p>
                                            </div>
                                        </div>

                                        {/* {(item.deliveryDate || item.deadline) && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                {item.deliveryDate ? (typeof item.deliveryDate === 'string' ? item.deliveryDate.split('T')[0] : new Date(item.deliveryDate).toLocaleDateString()) : new Date(item.deadline).toISOString().split("T")[0].replace(/-/g, "-")}
                                                {item.deliveryTime && ` @ ${item.deliveryTime}`}
                                            </span>
                                        </div>
                                    )} */}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onFileChange} />

            {/* Modals */}
            {activeModal === 'GEN' && (
                <GeneratorModal
                    availableJobs={availableJobs}
                    existingRFQs={items}
                    onClose={() => setActiveModal(null)}
                    onAdd={handleAddRFQs}
                />
            )}
            {typeof activeModal === 'object' && activeModal !== null && (
                <WorkflowModal
                    item={items.find(i => i._id === activeModal._id) || activeModal}
                    onClose={() => setActiveModal(null)}
                    onUpdate={handleUpdateItem}
                />
            )}

            <ImageLightbox
                src={previewImage?.startsWith('http') ? previewImage : (previewImage ? `${import.meta.env.VITE_BACKEND_URL}/${previewImage}` : null)}
                fileName={previewImage?.split('/').pop().split('---').pop() || 'Preview'}
                onClose={() => setPreviewImage(null)}
            />
        </div>
    );
};

export default RFQDashboard;